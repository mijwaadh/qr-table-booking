import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Date, Numeric, DateTime, func
from sqlalchemy.orm import relationship
from database import Base

class Restaurant(Base):
    __tablename__ = "restaurants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

class Table(Base):
    __tablename__ = "tables"
    
    id = Column(String, primary_key=True, index=True) # e.g. "T01"
    name = Column(String, nullable=False)
    seats = Column(Integer, nullable=False)
    status = Column(String, default="AVAILABLE") # AVAILABLE, OCCUPIED, PAYMENT_PENDING
    amount = Column(Float, nullable=True)
    seatedTime = Column(String, nullable=True)
    elapsedMinutes = Column(Integer, nullable=True)

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(String, primary_key=True, index=True) # e.g. "m1"
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, nullable=False) # e.g. "Starters", "Main Course"
    available = Column(Boolean, default=True)
    type = Column(String, default="VEG") # VEG, NON-VEG
    imageUrl = Column(String, nullable=True)
    badge = Column(String, nullable=True)
    calories = Column(Integer, nullable=True)

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, index=True) # e.g. "ord-1"
    tableId = Column(String, ForeignKey("tables.id"), nullable=False)
    status = Column(String, default="PENDING") # PENDING, PREPARING, READY, COMPLETED
    amount = Column(Float, nullable=False)
    time = Column(String, nullable=False)
    elapsedMinutes = Column(Integer, default=0)
    allergyAlert = Column(Boolean, default=False)
    
    table = relationship("Table")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="joined")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    orderId = Column(String, ForeignKey("orders.id"), nullable=False)
    menuItemId = Column(String, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    notes = Column(String, nullable=True)
    completed = Column(Boolean, default=False)
    
    order = relationship("Order", back_populates="items")
    menuItem = relationship("MenuItem", lazy="joined")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, index=True) # e.g. "pay-1"
    orderId = Column(String, nullable=True)
    tableId = Column(String, nullable=False)
    method = Column(String, nullable=False) # Cash, Card, UPI
    subtotal = Column(Float, nullable=False)
    gst = Column(Float, nullable=False)
    serviceCharge = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    timestamp = Column(String, nullable=False)

class MarketPrice(Base):
    __tablename__ = "market_prices"
    
    id = Column(String, primary_key=True, index=True)
    commodity = Column(String, nullable=False, index=True)
    variety = Column(String, nullable=False)
    state = Column(String, nullable=False, index=True)
    district = Column(String, nullable=False, index=True)
    market = Column(String, nullable=False)
    arrival_date = Column(Date, nullable=False, index=True)
    min_price = Column(Numeric(12, 2), nullable=False)
    max_price = Column(Numeric(12, 2), nullable=False)
    modal_price = Column(Numeric(12, 2), nullable=False)
    price_per_kg = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

class MarketPrediction(Base):
    __tablename__ = "market_predictions"
    
    id = Column(String, primary_key=True, index=True)
    commodity = Column(String, nullable=False, index=True)
    variety = Column(String, nullable=False)
    market = Column(String, nullable=False)
    prediction_date = Column(Date, nullable=False)
    forecast_date = Column(Date, nullable=False, index=True)
    forecast_price = Column(Numeric(12, 2), nullable=False)
    lower_bound = Column(Numeric(12, 2), nullable=False)
    upper_bound = Column(Numeric(12, 2), nullable=False)
    horizon_days = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False, index=True)
    tableId = Column(String, nullable=True)
    scannedAt = Column(DateTime, nullable=False, server_default=func.now())

