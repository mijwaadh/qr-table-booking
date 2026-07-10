from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

# MenuItem schemas
class MenuItemBase(BaseModel):
    name: str
    price: float
    description: str
    category: str
    available: bool = True
    type: str = "VEG" # VEG, NON-VEG
    imageUrl: Optional[str] = None
    badge: Optional[str] = None
    calories: Optional[int] = None

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemSchema(MenuItemBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

# OrderItem schemas
class OrderItemCreate(BaseModel):
    menuItemId: str
    quantity: int
    notes: Optional[str] = None
    completed: bool = False

class OrderItemSchema(BaseModel):
    id: int
    orderId: str
    menuItemId: str
    quantity: int
    notes: Optional[str] = None
    completed: bool
    menuItem: MenuItemSchema
    
    model_config = ConfigDict(from_attributes=True)

# Order schemas
class OrderCreate(BaseModel):
    tableId: str
    items: List[OrderItemCreate]

class OrderSchema(BaseModel):
    id: str
    tableId: str
    status: str # PENDING, PREPARING, READY, COMPLETED
    amount: float
    time: str
    elapsedMinutes: int
    allergyAlert: bool
    items: List[OrderItemSchema]
    
    model_config = ConfigDict(from_attributes=True)

# Table schemas
class TableCreate(BaseModel):
    name: str
    seats: int

class TableSchema(BaseModel):
    id: str
    name: str
    seats: int
    status: str # AVAILABLE, OCCUPIED, PAYMENT_PENDING
    amount: Optional[float] = None
    seatedTime: Optional[str] = None
    elapsedMinutes: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)

# Payment schemas
class PaymentCreate(BaseModel):
    tableId: str
    method: str # Cash, Card, UPI
    subtotal: float
    gst: float
    serviceCharge: float
    discount: float = 0.0
    total: float

class PaymentSchema(BaseModel):
    id: str
    orderId: Optional[str] = None
    tableId: str
    method: str
    subtotal: float
    gst: float
    serviceCharge: float
    discount: float
    total: float
    timestamp: str
    
    model_config = ConfigDict(from_attributes=True)

# Dashboard Stats schema
class DashboardStatsSchema(BaseModel):
    todaySales: float
    activeOrdersCount: int
    occupiedTablesCount: int
    pendingOrdersCount: int
    revenueChangePercent: float
    ordersChangePercent: float

# Customer QR Scan schema
class CustomerCreate(BaseModel):
    name: str
    phone: str
    tableId: Optional[str] = None

class CustomerSchema(BaseModel):
    id: int
    name: str
    phone: str
    tableId: Optional[str] = None
    scannedAt: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
