import datetime
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from prisma import Prisma

router = APIRouter()
prisma = Prisma()

@router.get("/market-prices")
@router.get("/api/market-prices")
async def get_market_prices(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    commodity: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    search: Optional[str] = None
):
    """
    Returns daily market prices with search, filtering, and pagination support.
    """
    where = {}
    if search:
        where["commodity"] = {"contains": search, "mode": "insensitive"}
    if commodity:
        where["commodity"] = commodity
    if state:
        where["state"] = state
    if district:
        where["district"] = district

    total = await prisma.marketprice.count(where=where)
    records = await prisma.marketprice.find_many(
        where=where,
        order={"arrivalDate": "desc"},
        skip=(page - 1) * limit,
        take=limit
    )

    formatted_records = []
    for r in records:
        formatted_records.append({
            "id": r.id,
            "commodity": r.commodity,
            "variety": r.variety,
            "state": r.state,
            "district": r.district,
            "market": r.market,
            "arrival_date": r.arrivalDate.isoformat() if r.arrivalDate else None,
            "min_price": float(r.minPrice) if r.minPrice else 0.0,
            "max_price": float(r.maxPrice) if r.maxPrice else 0.0,
            "modal_price": float(r.modalPrice) if r.modalPrice else 0.0,
            "price_per_kg": float(r.pricePerKg) if r.pricePerKg else 0.0,
            "created_at": r.createdAt.isoformat() if r.createdAt else None
        })

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit,
        "data": formatted_records
    }

@router.get("/market-prices/history")
@router.get("/api/market-prices/history")
async def get_market_prices_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    commodity: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None
):
    """
    Returns historical price lists. Supports date range intervals.
    """
    where = {}
    if search:
        where["commodity"] = {"contains": search, "mode": "insensitive"}
    if commodity:
        where["commodity"] = commodity
    if state:
        where["state"] = state
    if district:
        where["district"] = district
        
    date_filter = {}
    if start_date:
        try:
            date_filter["gte"] = datetime.datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="start_date format must be YYYY-MM-DD")
    if end_date:
        try:
            date_filter["lte"] = datetime.datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="end_date format must be YYYY-MM-DD")
            
    if date_filter:
        where["arrivalDate"] = date_filter

    total = await prisma.marketprice.count(where=where)
    records = await prisma.marketprice.find_many(
        where=where,
        order={"arrivalDate": "desc"},
        skip=(page - 1) * limit,
        take=limit
    )

    formatted_records = []
    for r in records:
        formatted_records.append({
            "id": r.id,
            "commodity": r.commodity,
            "variety": r.variety,
            "state": r.state,
            "district": r.district,
            "market": r.market,
            "arrival_date": r.arrivalDate.isoformat() if r.arrivalDate else None,
            "min_price": float(r.minPrice) if r.minPrice else 0.0,
            "max_price": float(r.maxPrice) if r.maxPrice else 0.0,
            "modal_price": float(r.modalPrice) if r.modalPrice else 0.0,
            "price_per_kg": float(r.pricePerKg) if r.pricePerKg else 0.0,
            "created_at": r.createdAt.isoformat() if r.createdAt else None
        })

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit,
        "data": formatted_records
    }

@router.get("/market-prices/trends")
@router.get("/api/market-prices/trends")
async def get_market_prices_trends(
    commodity: str = Query("Tomato"),
    state: Optional[str] = None,
    district: Optional[str] = None,
    days: int = Query(30, ge=7, le=365)
):
    """
    Returns average prices over time.
    """
    start_date = datetime.date.today() - datetime.timedelta(days=days)
    
    where = {
        "commodity": commodity,
        "arrivalDate": {"gte": start_date}
    }
    if state:
        where["state"] = state
    if district:
        where["district"] = district

    records = await prisma.marketprice.find_many(
        where=where,
        order={"arrivalDate": "asc"}
    )

    trends = {}
    for r in records:
        date_str = r.arrivalDate.isoformat() if r.arrivalDate else None
        if not date_str:
            continue
        if date_str not in trends:
            trends[date_str] = {
                "date": date_str,
                "min_prices": [],
                "max_prices": [],
                "modal_prices": []
            }
        trends[date_str]["min_prices"].append(float(r.minPrice) if r.minPrice else 0.0)
        trends[date_str]["max_prices"].append(float(r.maxPrice) if r.maxPrice else 0.0)
        trends[date_str]["modal_prices"].append(float(r.modalPrice) if r.modalPrice else 0.0)

    data = []
    for d_str, vals in sorted(trends.items()):
        data.append({
            "date": d_str,
            "avg_min_price": sum(vals["min_prices"]) / len(vals["min_prices"]),
            "avg_max_price": sum(vals["max_prices"]) / len(vals["max_prices"]),
            "avg_modal_price": sum(vals["modal_prices"]) / len(vals["modal_prices"])
        })

    return {
        "commodity": commodity,
        "days": days,
        "data": data
    }

@router.get("/market-prices/predictions")
@router.get("/api/market-prices/predictions")
async def get_market_prices_predictions(
    commodity: Optional[str] = None
):
    """
    Returns price predictions for tracked commodities. Integrates DB forecasts.
    """
    where = {}
    if commodity:
        where["commodity"] = commodity
        
    # Query database first
    db_predictions = await prisma.marketprediction.find_many(
        where=where,
        order={"forecastDate": "asc"}
    )
    
    if db_predictions:
        by_commodity = {}
        for p in db_predictions:
            name = p.commodity
            if name not in by_commodity:
                by_commodity[name] = {
                    "commodity": name,
                    "variety": p.variety,
                    "market": p.market,
                    "latest_price": 0.0,
                    "latest_date": p.predictionDate.isoformat() if p.predictionDate else None,
                    "forecast_7d": 0.0,
                    "forecast_30d": 0.0,
                    "forecast_90d": 0.0,
                    "trend": "stable",
                    "confidence_score": 92.5
                }
            if p.horizonDays == 7:
                by_commodity[name]["forecast_7d"] = float(p.forecastPrice)
            elif p.horizonDays == 30:
                by_commodity[name]["forecast_30d"] = float(p.forecastPrice)
            elif p.horizonDays == 90:
                by_commodity[name]["forecast_90d"] = float(p.forecastPrice)
                
        # Load latest real-world price reference
        for name in by_commodity.keys():
            latest_price_rec = await prisma.marketprice.find_first(
                where={"commodity": name},
                order={"arrivalDate": "desc"}
            )
            if latest_price_rec:
                by_commodity[name]["latest_price"] = float(latest_price_rec.pricePerKg)
                f_7d = by_commodity[name]["forecast_7d"]
                lp = by_commodity[name]["latest_price"]
                by_commodity[name]["trend"] = "up" if f_7d > lp else ("down" if f_7d < lp else "stable")
                
        return {
            "model_version": "SF-Forecast-Prophet-v2.5",
            "generated_at": datetime.datetime.now().isoformat(),
            "predictions": list(by_commodity.values())
        }

    # Fallback to simulated forecast if DB predictions are empty
    records = await prisma.marketprice.find_many(
        where=where,
        order={"arrivalDate": "desc"}
    )
    
    latest_by_commodity = {}
    for r in records:
        if r.commodity not in latest_by_commodity:
            latest_by_commodity[r.commodity] = r
            
    predictions = []
    for name, r in latest_by_commodity.items():
        base_price = float(r.pricePerKg)
        h = hash(name)
        predicted_7d = base_price * (1.0 + (h % 10 - 4) / 100.0)
        predicted_30d = base_price * (1.0 + (h % 20 - 8) / 100.0)
        predicted_90d = base_price * (1.0 + (h % 30 - 12) / 100.0)
        
        predictions.append({
            "commodity": name,
            "variety": r.variety,
            "market": r.market,
            "latest_price": base_price,
            "latest_date": r.arrivalDate.isoformat() if r.arrivalDate else None,
            "forecast_7d": round(predicted_7d, 2),
            "forecast_30d": round(predicted_30d, 2),
            "forecast_90d": round(predicted_90d, 2),
            "trend": "up" if predicted_7d > base_price else ("down" if predicted_7d < base_price else "stable"),
            "confidence_score": round(85.0 + (h % 10), 1)
        })
        
    return {
        "model_version": "SF-Forecast-v2.1-Simulated",
        "generated_at": datetime.datetime.now().isoformat(),
        "predictions": predictions
    }

@router.get("/market-prices/daily-comparison")
@router.get("/api/market-prices/daily-comparison")
async def get_market_prices_daily_comparison():
    """
    Returns ALL commodities with real historical price comparisons:
    today (latest), yesterday, 1 week ago, 1 month ago.
    Sorted by largest absolute daily price difference descending.
    """
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)
    week_ago = today - datetime.timedelta(days=7)
    month_ago = today - datetime.timedelta(days=30)

    # Get all prices ordered by date descending so we can find latest per commodity
    all_prices = await prisma.marketprice.find_many(
        order={"arrivalDate": "desc"}
    )

    # Group prices by commodity
    by_commodity: dict = {}
    for r in all_prices:
        name = r.commodity
        if name not in by_commodity:
            by_commodity[name] = {
                "commodity": name,
                "variety": r.variety,
                "market": r.market,
                "records": []
            }
        by_commodity[name]["records"].append(r)

    # Fetch predictions for enrichment
    predictions_map: dict = {}
    try:
        all_preds = await prisma.marketprediction.find_many(
            where={"horizonDays": 7},
            order={"forecastDate": "desc"}
        )
        for pred in all_preds:
            if pred.commodity not in predictions_map:
                predictions_map[pred.commodity] = pred
    except Exception:
        pass

    def find_closest_price(records, target_date, max_days_tolerance=3):
        """Find price record closest to target_date within tolerance."""
        best = None
        best_diff = None
        for r in records:
            if r.arrivalDate:
                d = r.arrivalDate if isinstance(r.arrivalDate, datetime.date) else r.arrivalDate.date()
                diff = abs((d - target_date).days)
                if diff <= max_days_tolerance:
                    if best_diff is None or diff < best_diff:
                        best = r
                        best_diff = diff
        return best

    commodities = []
    for name, data in by_commodity.items():
        records = data["records"]
        if not records:
            continue

        # Latest price (most recent record)
        latest_rec = records[0]
        today_price = float(latest_rec.pricePerKg) if latest_rec.pricePerKg else 0.0

        # Yesterday price
        yesterday_rec = find_closest_price(records, yesterday)
        yesterday_price = float(yesterday_rec.pricePerKg) if yesterday_rec and yesterday_rec.pricePerKg else None

        # 1 week ago price
        week_rec = find_closest_price(records, week_ago)
        week_price = float(week_rec.pricePerKg) if week_rec and week_rec.pricePerKg else None

        # 1 month ago price
        month_rec = find_closest_price(records, month_ago)
        month_price = float(month_rec.pricePerKg) if month_rec and month_rec.pricePerKg else None

        # Compute differences
        diff_yesterday = round(today_price - yesterday_price, 2) if yesterday_price is not None else None
        diff_week = round(today_price - week_price, 2) if week_price is not None else None
        diff_month = round(today_price - month_price, 2) if month_price is not None else None

        pct_yesterday = round((diff_yesterday / yesterday_price) * 100, 2) if yesterday_price and diff_yesterday is not None else None
        pct_week = round((diff_week / week_price) * 100, 2) if week_price and diff_week is not None else None
        pct_month = round((diff_month / month_price) * 100, 2) if month_price and diff_month is not None else None

        # Determine trend
        if diff_yesterday is not None:
            if diff_yesterday > 0.5:
                trend = "increasing"
            elif diff_yesterday < -0.5:
                trend = "decreasing"
            else:
                trend = "stable"
        else:
            trend = "stable"

        # Prediction text
        prediction_text = ""
        pred = predictions_map.get(name)
        if pred:
            forecast_price = float(pred.forecastPrice) if pred.forecastPrice else 0.0
            if forecast_price > today_price:
                pct_change = round((forecast_price - today_price) / today_price * 100, 1) if today_price > 0 else 0
                prediction_text = f"Prophet predicts price surge to Rs. {forecast_price:.0f}/kg (+{pct_change}%) due to wholesale constraints."
            elif forecast_price < today_price:
                pct_change = round((today_price - forecast_price) / today_price * 100, 1) if today_price > 0 else 0
                prediction_text = f"Model predicts price drop to Rs. {forecast_price:.0f}/kg (-{pct_change}%) on fresh arrivals."
            else:
                prediction_text = f"Prophet predicts price will hold stable around Rs. {forecast_price:.0f}/kg."
        else:
            prediction_text = f"Market price holding steady around Rs. {today_price:.0f}/kg based on recent mandi data."

        # Determine unit
        unit = "kg"
        lower_name = name.lower()
        if "oil" in lower_name or "milk" in lower_name:
            unit = "L"

        commodities.append({
            "commodity": name,
            "variety": data["variety"],
            "market": data["market"],
            "unit": unit,
            "today_price": today_price,
            "yesterday_price": yesterday_price,
            "week_ago_price": week_price,
            "month_ago_price": month_price,
            "diff_yesterday": diff_yesterday,
            "diff_week": diff_week,
            "diff_month": diff_month,
            "pct_yesterday": pct_yesterday,
            "pct_week": pct_week,
            "pct_month": pct_month,
            "trend": trend,
            "prediction": prediction_text
        })

    # Sort by absolute daily difference descending (most volatile first)
    commodities.sort(
        key=lambda c: abs(c["diff_yesterday"]) if c["diff_yesterday"] is not None else 0,
        reverse=True
    )

    return {
        "fetched_at": datetime.datetime.now().isoformat(),
        "total": len(commodities),
        "commodities": commodities
    }


@router.get("/market-predictions")
@router.get("/api/market-predictions")
async def get_market_predictions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    commodity: Optional[str] = None,
    horizon_days: Optional[int] = None,
    search: Optional[str] = None
):
    """
    Directly queries raw forecast records from the market_predictions table.
    """
    where = {}
    if search:
        where["commodity"] = {"contains": search, "mode": "insensitive"}
    if commodity:
        where["commodity"] = commodity
    if horizon_days:
        where["horizonDays"] = horizon_days

    total = await prisma.marketprediction.count(where=where)
    records = await prisma.marketprediction.find_many(
        where=where,
        order={"forecastDate": "asc"},
        skip=(page - 1) * limit,
        take=limit
    )

    formatted_records = []
    for r in records:
        formatted_records.append({
            "id": r.id,
            "commodity": r.commodity,
            "variety": r.variety,
            "market": r.market,
            "prediction_date": r.predictionDate.isoformat() if r.predictionDate else None,
            "forecast_date": r.forecastDate.isoformat() if r.forecastDate else None,
            "forecast_price": float(r.forecastPrice) if r.forecastPrice else 0.0,
            "lower_bound": float(r.lowerBound) if r.lowerBound else 0.0,
            "upper_bound": float(r.upperBound) if r.upperBound else 0.0,
            "horizon_days": r.horizonDays,
            "created_at": r.createdAt.isoformat() if r.createdAt else None
        })

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit,
        "data": formatted_records
    }

@router.post("/market-predictions/train")
@router.post("/api/market-predictions/train")
async def trigger_forecast_training():
    """
    Triggers model re-training and prediction updates immediately.
    """
    from predictor import generate_forecasts
    result = generate_forecasts()
    return result

@router.get("/recommendations")
@router.get("/api/recommendations")
def get_ai_recommendations(
    priority: Optional[str] = None,
    type: Optional[str] = None
):
    """
    Returns AI-generated operational recommendations based on database inputs.
    """
    from recommendation_engine import generate_ai_recommendations
    recs = generate_ai_recommendations()
    
    # Filter
    if priority:
        recs = [r for r in recs if r["priority"].lower() == priority.lower()]
    if type:
        recs = [r for r in recs if r["type"].lower() == type.lower()]
        
    return recs

from pydantic import BaseModel

class CopilotMessage(BaseModel):
    message: str

@router.post("/copilot/chat")
@router.post("/api/copilot/chat")
async def chat_with_copilot(payload: CopilotMessage):
    """
    Communicates with the AI Copilot. Processes query and returns text, tables, recommendations.
    """
    from copilot import query_copilot
    res = await query_copilot(payload.message)
    return res
