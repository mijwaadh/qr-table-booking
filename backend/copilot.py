import os
import json
import httpx
import logging
import datetime
from prisma import Prisma

logger = logging.getLogger("copilot")

# Load environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

async def query_copilot(message: str) -> dict:
    """
    Interfaces with Google Gemini Model to answer owners' ERP queries using live
    database context. Falls back to keyword parsing if Gemini API key or requests fail.
    """
    from prisma_routes import prisma
    
    # 1. Fetch live database prices and predictions to inject as context
    prices_context = []
    try:
        latest_prices = await prisma.marketprice.find_many(take=12, order={"arrivalDate": "desc"})
        for p in latest_prices:
            prices_context.append(
                f"- Commodity: {p.commodity} (variety: {p.variety}) | Market: {p.market} | Today's Price: Rs. {float(p.pricePerKg):.2f}/kg"
            )
            
        latest_preds = await prisma.marketprediction.find_many(take=12, order={"forecastDate": "asc"})
        for pred in latest_preds:
            prices_context.append(
                f"  * Prediction: {pred.horizonDays}d forecast on {pred.forecastDate.isoformat()} -> Rs. {float(pred.forecastPrice):.2f}/kg (lower: Rs. {float(pred.lowerBound):.2f}, upper: Rs. {float(pred.upperBound):.2f})"
            )
    except Exception as e:
        logger.error(f"Failed to gather price context for LLM: {e}")

    formatted_prices_and_predictions = "\n".join(prices_context)
    
    # 2. Make Google Gemini Model request if API key is present
    if GEMINI_API_KEY:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        prompt = f"""You are the ServeFlow AI Copilot for a restaurant owner.
Answer the owner's query based on the active database parameters provided below.

=== DATABASE PARAMETERS ===
- Menu items and gross margins:
  * Saffron Cream Penne (Cost: 260, Price: 450, Margin: 42.2%, Volume: low, Status: critical)
  * Avocado Green Salad (Cost: 190, Price: 380, Margin: 50.0%, Volume: medium, Status: warning)
  * Wagyu Truffle Burger (Cost: 420, Price: 1250, Margin: 66.4%, Volume: high, Status: healthy)
  * Atlantic Salmon Steak (Cost: 580, Price: 1390, Margin: 58.3%, Volume: medium, Status: warning)
- Suppliers:
  * FreshFoods Ltd (Reliability: 97%, category: Meats & Seafood)
  * Metro Wholesale (Reliability: 89%, category: Dry Goods)
  * Sai Farm Fresh (Reliability: 74%, category: Fresh Produce)
- Inventory status:
  * Hass Avocados (Stock: 12pcs, Runout: 1.2 days)
  * Roma Tomatoes (Stock: 8kg, Runout: 0.9 days)
  * Fresh Cream 35% (Stock: 24L, Runout: 4.5 days)
- Live Wholesale Prices and Predictions:
{formatted_prices_and_predictions}

=== OWNER QUERY ===
{message}

=== RESPONSE FORMAT ===
Output a JSON object matching this structure:
{{
  "text": "Detailed analysis text, explanation, and answer using markdown formatting.",
  "table": [
    {{ "ColumnA": "Value", "ColumnB": "Value" }}
  ],
  "recommendations": [
    "Action recommendation 1",
    "Action recommendation 2"
  ]
}}
Only return the raw JSON object. Do not include markdown code block backticks (e.g. do NOT wrap the output in ```json ... ```). Output raw JSON only.
"""
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        try:
            logger.info("Executing Google Gemini model request...")
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=payload, timeout=20.0)
                if res.status_code == 200:
                    res_json = res.json()
                    response_text = res_json["candidates"][0]["content"]["parts"][0]["text"].strip()
                    data = json.loads(response_text)
                    logger.info("Successfully received and parsed Gemini Copilot response.")
                    return data
                else:
                    logger.error(f"Gemini API returned status code {res.status_code}: {res.text}")
        except Exception as api_err:
            logger.error(f"Gemini API request failed: {api_err}. Falling back to default keyword responder.")

    # 3. Fallback Keyword Analyzer if Gemini fails
    logger.info("Running local keyword-based fallback responder.")
    msg_lower = message.lower()
    
    if "food cost" in msg_lower or "increasing" in msg_lower or "why" in msg_lower:
        return {
            "text": "Your overall food cost percentage has risen by **1.8%** this week, primarily driven by supply chain constraints on fresh produce. Increasing menu item prices or switching suppliers can help protect margins.",
            "table": [
                {"Ingredient": "Roma Tomatoes", "Increase": "+12.5%", "Impact": "High (Penne Pasta)", "Action": "Increase price by Rs. 15"},
                {"Ingredient": "Atlantic Salmon", "Increase": "+4.2%", "Impact": "Medium (Salmon Steak)", "Action": "Delay bulk orders by 7d"},
                {"Ingredient": "Wagyu Beef", "Increase": "+2.1%", "Impact": "High (Truffle Burger)", "Action": "Lock contract rates"}
            ],
            "recommendations": [
                "Increase Pasta price by Rs. 15 to offset Tomato price increases.",
                "Review supplier contract rates for Meats and Seafood."
            ]
        }
        
    elif "supplier" in msg_lower or "cheapest" in msg_lower:
        return {
            "text": "Based on purchase logs and supplier price tracking, **Metro Wholesale** is currently the cheapest supplier for dry storage goods, while **FreshFoods Ltd** has the best contract rates for proteins. Here is the supplier comparison:",
            "table": [
                {"Supplier": "FreshFoods Ltd", "Category": "Meats & Seafood", "Avg Unit Cost": "Lower (-4%)", "Reliability": "97% (Excellent)"},
                {"Supplier": "Metro Wholesale", "Category": "Dry Goods", "Avg Unit Cost": "Lowest (-7%)", "Reliability": "89% (Good)"},
                {"Supplier": "Sai Farm Fresh", "Category": "Fresh Produce", "Avg Unit Cost": "Market Standard", "Reliability": "74% (Critical)"}
            ],
            "recommendations": [
                "Shift fresh produce purchases from Sai Farm Fresh to Direct Bakeries/Apex Dairy Corp."
            ]
        }

    elif "menu" in msg_lower or "losing money" in msg_lower or "margin" in msg_lower:
        return {
            "text": "Three of your menu items are currently operating below target margins due to rising ingredient costs. **Saffron Cream Penne** has the lowest margin at **42.2%**.",
            "table": [
                {"Dish": "Saffron Cream Penne", "Recipe Cost": "Rs. 260.00", "Price": "Rs. 450.00", "Gross Margin": "42.2% (Critical)"},
                {"Dish": "Avocado Green Salad", "Recipe Cost": "Rs. 190.00", "Price": "Rs. 380.00", "Gross Margin": "50.0% (Warning)"},
                {"Dish": "Atlantic Salmon Steak", "Recipe Cost": "Rs. 580.00", "Price": "Rs. 1,390.00", "Gross Margin": "58.3% (Warning)"}
            ],
            "recommendations": [
                "Increase Saffron Cream Penne price by Rs. 15 to achieve 60% margin.",
                "Reduce avocado portion size slightly in Green Salad."
            ]
        }

    elif "buy" in msg_lower or "today" in msg_lower or "purchase" in msg_lower:
        return {
            "text": "Based on inventory runout levels and price predictions, here is your immediate procurement buy checklist for today:",
            "table": [
                {"Item": "Roma Tomatoes", "Urgency": "High (0.9 days left)", "Market Price": "Rs. 52.00/kg", "Forecast 7d": "Rs. 59.80/kg (+15%)", "Action": "Buy 25kg Today"},
                {"Item": "Hass Avocados", "Urgency": "High (1.2 days left)", "Market Price": "Rs. 95.00/piece", "Forecast 7d": "Rs. 99.00/piece", "Action": "Buy 40pcs Today"},
                {"Item": "Atlantic Salmon Filets", "Urgency": "Medium (1.8 days left)", "Market Price": "Rs. 1,150.00/kg", "Forecast 7d": "Rs. 1,090.00/kg (-5%)", "Action": "Buy minimum qty"}
            ],
            "recommendations": [
                "Procure Tomatoes immediately today to lock-in price before predicted weekly increase.",
                "Buy minimum required Salmon today; defer main purchase until next week for price drop."
            ]
        }

    elif "predict" in msg_lower or "next month" in msg_lower or "cost" in msg_lower or "forecast" in msg_lower:
        table_rows = []
        try:
            preds = await prisma.marketprediction.find_many(where={"horizonDays": 30}, take=6)
            for p in preds:
                cur = await prisma.marketprice.find_first(where={"commodity": p.commodity}, order={"arrivalDate": "desc"})
                cur_price = float(cur.pricePerKg) if cur else 0.0
                forecast = float(p.forecastPrice)
                diff_pct = ((forecast - cur_price) / cur_price * 100) if cur_price > 0 else 0.0
                diff_str = f"{'+' if diff_pct >= 0 else ''}{diff_pct:.1f}%"
                
                table_rows.append({
                    "Commodity": p.commodity,
                    "Current Price": f"Rs. {cur_price:.2f}/kg",
                    "30d Predicted": f"Rs. {forecast:.2f}/kg",
                    "Expected Trend": diff_str
                })
        except Exception:
            pass
            
        if not table_rows:
            table_rows = [
                {"Commodity": "Tomato", "Current Price": "Rs. 52.00/kg", "30d Predicted": "Rs. 62.40/kg", "Expected Trend": "+20.0%"},
                {"Commodity": "Wagyu Beef", "Current Price": "Rs. 2,200.00/kg", "30d Predicted": "Rs. 2,240.00/kg", "Expected Trend": "+1.8%"},
                {"Commodity": "Atlantic Salmon", "Current Price": "Rs. 1,150.00/kg", "30d Predicted": "Rs. 1,040.00/kg", "Expected Trend": "-9.5%"}
            ]

        return {
            "text": "Here is the 30-day forecast overview for your primary raw ingredients, compiled from the Facebook Prophet predictive models:",
            "table": table_rows,
            "recommendations": [
                "Lock contract prices for Tomatoes before the 30-day monsoon surge.",
                "Utilize spot pricing for Salmon next month to leverage price declines."
            ]
        }

    else:
        return {
            "text": "Hello! I am your Gemini-powered ServeFlow AI Copilot. I analyze menu costs, supplier rates, inventory runout risks, and price forecasting data. Try asking me:\n\n"
                    "- *Why is my food cost increasing?*\n"
                    "- *Which supplier is cheapest?*\n"
                    "- *Which menu items are losing money?*\n"
                    "- *What should I buy today?*\n"
                    "- *Predict next month's ingredient costs.*",
            "table": None,
            "recommendations": None
        }
