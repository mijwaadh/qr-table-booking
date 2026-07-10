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
    
    # Define authentic Government Agmarknet & DoCA Wholesale Mandi commodities and modal prices (₹/kg or ₹/L)
    commodities = [
        {"name": "Onion", "variety": "Red Nasik Big", "state": "Maharashtra", "district": "Nashik", "market": "Lasalgaon Mandi", "base_price": 38.0},
        {"name": "Potato", "variety": "Jyoti Desi", "state": "Uttar Pradesh", "district": "Agra", "market": "Agra Mandi", "base_price": 24.0},
        {"name": "Tomato", "variety": "Hybrid Grade A", "state": "Delhi", "district": "Delhi", "market": "Azadpur Mandi", "base_price": 48.0},
        {"name": "Tur Dal", "variety": "Grade A Unpolished", "state": "Maharashtra", "district": "Akola", "market": "Akola Mandi", "base_price": 162.0},
        {"name": "Basmati Rice", "variety": "Pusa 1121 Extra Long", "state": "Haryana", "district": "Karnal", "market": "Karnal Mandi", "base_price": 115.0},
        {"name": "Garlic", "variety": "Desi Ooty", "state": "Madhya Pradesh", "district": "Neemuch", "market": "Neemuch Mandi", "base_price": 210.0},
        {"name": "Ginger", "variety": "Fresh Cochin", "state": "Kerala", "district": "Ernakulam", "market": "Cochin Mandi", "base_price": 145.0},
        {"name": "Green Chilli", "variety": "G4 Pusa", "state": "Andhra Pradesh", "district": "Guntur", "market": "Guntur Mandi", "base_price": 65.0},
        {"name": "Coriander Leaves", "variety": "Dhania Fresh", "state": "Maharashtra", "district": "Mumbai", "market": "Vashi Wholesale Mandi", "base_price": 40.0},
        {"name": "Wheat", "variety": "Lokman Sharbati", "state": "Madhya Pradesh", "district": "Indore", "market": "Indore Mandi", "base_price": 31.0},
        {"name": "Mustard Oil", "variety": "Kachi Ghani Raw", "state": "Rajasthan", "district": "Alwar", "market": "Alwar Mandi", "base_price": 142.0},
        {"name": "Refined Sunflower Oil", "variety": "Grade A", "state": "Maharashtra", "district": "Latur", "market": "Latur Mandi", "base_price": 128.0},
        {"name": "Moong Dal", "variety": "Washed Split", "state": "Rajasthan", "district": "Nagaur", "market": "Merta Mandi", "base_price": 108.0},
        {"name": "Sugar", "variety": "S-30 Crystal Grade", "state": "Maharashtra", "district": "Kolhapur", "market": "Kolhapur Mandi", "base_price": 42.0},
        {"name": "Wholesale Milk", "variety": "Full Cream 6% Fat", "state": "Delhi", "district": "Delhi", "market": "Mother Dairy Wholesale Index", "base_price": 66.0},
        {"name": "Broiler Chicken", "variety": "Wholesale Live/Dressed", "state": "Delhi", "district": "Delhi", "market": "Ghazipur Poultry Market", "base_price": 185.0}
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
