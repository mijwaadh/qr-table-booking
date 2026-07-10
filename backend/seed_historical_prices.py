import uuid
import datetime
import random
from decimal import Decimal
from sqlalchemy.orm import Session

import models
from database import SessionLocal, engine, Base

def seed_historical_prices():
    print("Connecting to database and initializing tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Define commodities and base prices per kg
    commodities = [
        {"name": "Tomato", "variety": "Roma", "state": "Delhi", "district": "Delhi", "market": "Azadpur Mandi", "base_price": 45.0},
        {"name": "Wagyu Beef", "variety": "Flank", "state": "Maharashtra", "district": "Mumbai", "market": "Mumbai Port Terminal", "base_price": 2150.0},
        {"name": "Atlantic Salmon", "variety": "Filet", "state": "Maharashtra", "district": "Mumbai", "market": "Mumbai Port Terminal", "base_price": 1200.0},
        {"name": "Cream", "variety": "Fresh 35%", "state": "Delhi", "district": "Delhi", "market": "Mother Dairy Bulk Center", "base_price": 180.0},
        {"name": "Bell Peppers", "variety": "Yellow", "state": "Delhi", "district": "Delhi", "market": "Azadpur Mandi", "base_price": 120.0},
        {"name": "Avocados", "variety": "Hass", "state": "Karnataka", "district": "Bangalore", "market": "Yeshwanthpur Mandi", "base_price": 85.0}
    ]
    
    today = datetime.date.today()
    records_added = 0
    
    print("Clearing old prices to avoid duplicates...")
    db.query(models.MarketPrice).delete()
    db.commit()
    
    print("Generating 30 days of daily historical prices...")
    for c in commodities:
        base = c["base_price"]
        trend = random.choice([-0.2, 0.2, 0.0]) # Add slight general trend
        
        for day_offset in range(30, -1, -1):
            date = today - datetime.timedelta(days=day_offset)
            
            # Add random walk noise around base price
            noise = random.uniform(-0.03, 0.03) * base
            trend_offset = (30 - day_offset) * (trend / 30) * base
            modal_price = max(1.0, base + trend_offset + noise)
            
            # Modal price in Rs/Quintal (x100)
            modal_q = modal_price * 100.0
            min_q = modal_q * 0.90
            max_q = modal_q * 1.10
            
            # Store price record
            price_rec = models.MarketPrice(
                id=str(uuid.uuid4()),
                commodity=c["name"],
                variety=c["variety"],
                state=c["state"],
                district=c["district"],
                market=c["market"],
                arrival_date=date,
                min_price=Decimal(str(round(min_q / 100.0, 2))),
                max_price=Decimal(str(round(max_q / 100.0, 2))),
                modal_price=Decimal(str(round(modal_q / 100.0, 2))),
                price_per_kg=Decimal(str(round(modal_price, 2)))
            )
            db.add(price_rec)
            records_added += 1
            
    db.commit()
    db.close()
    print(f"Success! Seeded {records_added} daily price logs across 30 days.")

if __name__ == "__main__":
    seed_historical_prices()
