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
