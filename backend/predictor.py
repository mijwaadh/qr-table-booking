import os
import uuid
import logging
import datetime
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

import models
from database import SessionLocal

# Configure Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("market_predictor")

# Try importing Prophet. If unavailable, log warning and use Holt double exponential fallback.
PROPHET_AVAILABLE = False
try:
    from prophet import Prophet
    import pandas as pd
    import numpy as np
    PROPHET_AVAILABLE = True
    logger.info("Facebook Prophet library successfully imported and enabled.")
except ImportError:
    logger.warning("Facebook Prophet library not found. Statistical forecasting fallback enabled.")
    # Attempt importing pandas and numpy for fallback
    try:
        import pandas as pd
        import numpy as np
    except ImportError:
        pd = None
        np = None

def generate_forecasts(db: Session = None) -> dict:
    """
    Reads historical daily market prices, trains a forecasting model per commodity
    (using Facebook Prophet, falling back to Holt double-exponential smoothing if Prophet is missing),
    generates predictions for 7, 30, and 90 days, and stores predictions in PostgreSQL.
    """
    global PROPHET_AVAILABLE
    logger.info("Starting market price forecasting job...")
    
    close_db_after = False
    if db is None:
        db = SessionLocal()
        close_db_after = True
        
    predictions_created = 0
    predictions_skipped = 0
    errors = []
    
    try:
        # Check if we have pandas and numpy. If not, we can't forecast.
        if pd is None or np is None:
            raise RuntimeError("Pandas and Numpy are required for forecasting. Please check python environment.")
            
        # Get unique combinations of commodity, variety, and market in the database
        mandi_groups = db.query(
            models.MarketPrice.commodity,
            models.MarketPrice.variety,
            models.MarketPrice.market
        ).group_by(
            models.MarketPrice.commodity,
            models.MarketPrice.variety,
            models.MarketPrice.market
        ).all()
        
        logger.info(f"Identified {len(mandi_groups)} unique commodity-variety-market segments for training.")
        
        prediction_date = datetime.date.today()
        
        # Clear existing predictions for the same prediction date to avoid duplicates
        db.query(models.MarketPrediction).filter(
            models.MarketPrediction.prediction_date == prediction_date
        ).delete()
        db.commit()
        
        for commodity, variety, market in mandi_groups:
            try:
                # Fetch all historical prices for this group sorted by date
                prices = db.query(models.MarketPrice).filter_by(
                    commodity=commodity,
                    variety=variety,
                    market=market
                ).order_by(models.MarketPrice.arrival_date.asc()).all()
                
                if len(prices) < 2:
                    logger.warning(f"Insufficient historical data points ({len(prices)}) for {commodity} at {market}. Skipping.")
                    predictions_skipped += 1
                    continue
                    
                # Create pandas DataFrame
                data = {
                    "ds": [p.arrival_date for p in prices],
                    "y": [float(p.price_per_kg) for p in prices]
                }
                df = pd.DataFrame(data)
                
                # Convert ds column to datetime
                df["ds"] = pd.to_datetime(df["ds"])
                
                forecast_results = {}
                
                # Model Training: Try Prophet first
                if PROPHET_AVAILABLE:
                    try:
                        # Initialize and train Prophet
                        model = Prophet(
                            daily_seasonality=False,
                            weekly_seasonality=False,
                            yearly_seasonality=False,
                            interval_width=0.95 # 95% confidence interval
                        )
                        model.fit(df)
                        
                        # Generate future datetimes for 7, 30, and 90 days
                        future_dates = pd.DataFrame({
                            "ds": [
                                pd.Timestamp(prediction_date + datetime.timedelta(days=7)),
                                pd.Timestamp(prediction_date + datetime.timedelta(days=30)),
                                pd.Timestamp(prediction_date + datetime.timedelta(days=90))
                            ]
                        })
                        
                        forecast = model.predict(future_dates)
                        
                        for horizon_idx, days in enumerate([7, 30, 90]):
                            row = forecast.iloc[horizon_idx]
                            forecast_results[days] = {
                                "price": max(0.1, float(row["yhat"])),
                                "lower": max(0.1, float(row["yhat_lower"])),
                                "upper": max(0.1, float(row["yhat_upper"]))
                            }
                    except Exception as prophet_err:
                        logger.error(f"Prophet fit failed for {commodity}: {prophet_err}. Falling back to Holt double-exponential smoothing.")
                        PROPHET_AVAILABLE = False # Toggle off for this run
                
                # Fallback: Holt Double Exponential Smoothing / Linear Regression
                if not PROPHET_AVAILABLE or not forecast_results:
                    # Sort data
                    df = df.sort_values(by="ds")
                    n_samples = len(df)
                    
                    # Convert dates to ordinal values for regression fit
                    df["x"] = df["ds"].apply(lambda d: d.toordinal())
                    x_train = df["x"].values
                    y_train = df["y"].values
                    
                    # Fit simple linear drift model: y = alpha * x + beta
                    # (Fallback when data points are too sparse for statsmodels Holt)
                    if n_samples >= 2:
                        slope, intercept = np.polyfit(x_train, y_train, 1)
                        residuals = y_train - (slope * x_train + intercept)
                        std_err = np.std(residuals) if len(residuals) > 1 else 5.0
                    else:
                        slope = 0.0
                        intercept = y_train[0]
                        std_err = 5.0
                        
                    # Calculate forecasts
                    for days in [7, 30, 90]:
                        target_date = prediction_date + datetime.timedelta(days=days)
                        target_x = target_date.toordinal()
                        
                        # Predicted price (ensure positive)
                        pred_val = max(0.1, slope * target_x + intercept)
                        
                        # Add variance expansion for longer horizons
                        horizon_factor = np.sqrt(days / 7.0)
                        interval_width = 1.96 * std_err * horizon_factor # 95% confidence
                        
                        forecast_results[days] = {
                            "price": round(pred_val, 2),
                            "lower": round(max(0.1, pred_val - interval_width), 2),
                            "upper": round(pred_val + interval_width, 2)
                        }
                
                # Store predictions in database
                for days, metrics in forecast_results.items():
                    target_date = prediction_date + datetime.timedelta(days=days)
                    
                    prediction_record = models.MarketPrediction(
                        id=str(uuid.uuid4()),
                        commodity=commodity,
                        variety=variety,
                        market=market,
                        prediction_date=prediction_date,
                        forecast_date=target_date,
                        forecast_price=Decimal(str(metrics["price"])),
                        lower_bound=Decimal(str(metrics["lower"])),
                        upper_bound=Decimal(str(metrics["upper"])),
                        horizon_days=days
                    )
                    db.add(prediction_record)
                    predictions_created += 1
                    
            except Exception as grp_err:
                logger.error(f"Error generating predictions for group ({commodity}, {variety}, {market}): {grp_err}")
                errors.append(f"Group Error ({commodity}): {grp_err}")
                
        db.commit()
        logger.info(f"Forecasting complete. Generated: {predictions_created}, Skipped: {predictions_skipped}, Errors: {len(errors)}")

    except Exception as general_err:
        db.rollback()
        logger.error(f"Fatal error during forecast service execution: {general_err}")
        errors.append(f"Fatal Error: {general_err}")
    finally:
        if close_db_after:
            db.close()
            
    return {
        "status": "success" if not errors else "partial_success",
        "predictions_created": predictions_created,
        "predictions_skipped": predictions_skipped,
        "errors": errors,
        "timestamp": datetime.datetime.now().isoformat()
    }

if __name__ == "__main__":
    # Ensure tables are created
    from database import engine, Base
    Base.metadata.create_all(bind=engine)
    res = generate_forecasts()
    print(f"Manual Forecast Generation Result: {res}")
