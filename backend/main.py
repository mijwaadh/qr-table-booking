import os
import sys
import subprocess

# Auto-generate Prisma Client Python if it hasn't been generated yet (useful for Render deployments)
client_exists = False
try:
    import prisma
    from prisma import Prisma
    client_exists = True
except (ImportError, RuntimeError):
    pass

if not client_exists:
    print("[Prisma] Client not found. Generating Prisma client...")
    schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "prisma", "schema.prisma")
    try:
        subprocess.run([sys.executable, "-m", "prisma", "generate", f"--schema={schema_path}"], check=True)
        print("[Prisma] Client successfully generated on startup. Evicting module caches...")
        # Force reload of prisma package
        for key in list(sys.modules.keys()):
            if key == "prisma" or key.startswith("prisma."):
                del sys.modules[key]
        print("[Prisma] Module caches evicted successfully.")
    except Exception as e:
        print(f"[Prisma] Failed to auto-generate client on startup: {e}")

from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import datetime
import os
import sys
import random
import uuid

# Ensure the directory containing this file is on sys.path so absolute module imports work anywhere
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, get_db, Base
import models, schemas


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

app = FastAPI(title="ServeFlow Restaurant Suite API")

# Mount Prisma routes
from prisma_routes import router as prisma_router
app.include_router(prisma_router)

@app.websocket("/ws")
@app.websocket("/")
@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Configure CORS using environment variable
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_credentials=True if "*" not in allowed_origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to seed data if empty
# Helper function to seed data if empty
def seed_initial_data(db: Session):
    # Seed Restaurant
    if db.query(models.Restaurant).count() == 0:
        db.add(models.Restaurant(name="ServeFlow Demo Restaurant"))
        db.commit()

    # Seed Categories
    if db.query(models.Category).count() == 0:
        categories = ["Starters", "Main Course", "Beverages", "Desserts"]
        for cat_name in categories:
            db.add(models.Category(name=cat_name))
        db.commit()

    # Seed Menu Items (exactly 20 items)
    working_urls_map = {
        "m1": "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=300",
        "m2": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=300",
        "m3": "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=300",
        "m4": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=300",
        "m5": "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=300",
        "m6": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300",
        "m7": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300",
        "m8": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80&w=300",
        "m9": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=300",
        "m10": "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&q=80&w=300",
        "m11": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=300",
        "m12": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=300",
        "m13": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=300",
        "m14": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&q=80&w=300",
        "m15": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&q=80&w=300",
        "m16": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=300",
        "m17": "https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&q=80&w=300",
        "m18": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=300",
        "m19": "https://images.unsplash.com/photo-1586040140378-b5634cb4c8fc?auto=format&fit=crop&q=80&w=300",
        "m20": "https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?auto=format&fit=crop&q=80&w=300",
    }

    if db.query(models.MenuItem).count() == 0:
        initial_menu = [
            models.MenuItem(id="m1", name="Heirloom Burrata", price=15.00, description="Vine-ripe tomatoes, basil pesto, aged balsamic.", category="Starters", available=True, type="VEG", imageUrl=working_urls_map["m1"], badge="Chef Special", calories=320),
            models.MenuItem(id="m2", name="Crispy Calamari", price=16.00, description="With wild garlic aioli, charred lemon.", category="Starters", available=True, type="NON-VEG", imageUrl=working_urls_map["m2"], calories=410),
            models.MenuItem(id="m3", name="Truffle Parmesan Fries", price=9.00, description="Hand-cut potatoes, white truffle oil, parmesan.", category="Starters", available=True, type="VEG", imageUrl=working_urls_map["m3"], badge="Best Seller", calories=280),
            models.MenuItem(id="m4", name="Garlic Butter Prawns", price=18.00, description="Sautéed in white wine, garlic, and fresh herbs.", category="Starters", available=True, type="NON-VEG", imageUrl=working_urls_map["m4"], calories=340),
            models.MenuItem(id="m5", name="Stuffed Mushrooms", price=12.00, description="With spinach, garlic, and cream cheese filling.", category="Starters", available=True, type="VEG", imageUrl=working_urls_map["m5"], calories=210),
            
            models.MenuItem(id="m6", name="Wagyu Truffle Burger", price=24.00, description="A5 Wagyu beef, black truffle paste, gruyère cheese.", category="Main Course", available=True, type="NON-VEG", imageUrl=working_urls_map["m6"], badge="Best Seller", calories=850),
            models.MenuItem(id="m7", name="Atlantic Salmon Steak", price=29.00, description="Pan-seared wild salmon, avocado crema, dill, asparagus.", category="Main Course", available=True, type="NON-VEG", imageUrl=working_urls_map["m7"], badge="Chef Special", calories=460),
            models.MenuItem(id="m8", name="Forest Mushroom Risotto", price=19.00, description="Arborio rice, wild porcini mushrooms, parmesan.", category="Main Course", available=True, type="VEG", imageUrl=working_urls_map["m8"], calories=550),
            models.MenuItem(id="m9", name="Ribeye Steak", price=38.00, description="USDA Prime ribeye, rosemary butter, roasted garlic.", category="Main Course", available=True, type="NON-VEG", imageUrl=working_urls_map["m9"], calories=920),
            models.MenuItem(id="m10", name="Chicken Parmigiana", price=23.00, description="Crispy chicken breast, marinara, mozzarella, spaghetti.", category="Main Course", available=True, type="NON-VEG", imageUrl=working_urls_map["m10"], calories=680),
            models.MenuItem(id="m11", name="Spinach Ricotta Ravioli", price=21.00, description="House-made ravioli, sage brown butter sauce.", category="Main Course", available=True, type="VEG", imageUrl=working_urls_map["m11"], calories=490),

            models.MenuItem(id="m12", name="Ocean Spray Cocktail", price=14.00, description="Artisanal gin, blue curaçao, fresh lime juice, tonic.", category="Beverages", available=True, type="VEG", imageUrl=working_urls_map["m12"], calories=180),
            models.MenuItem(id="m13", name="Smoked Old Fashioned", price=16.00, description="Premium bourbon, orange peel, angostura bitters, smoke.", category="Beverages", available=True, type="VEG", imageUrl=working_urls_map["m13"], badge="Best Seller", calories=160),
            models.MenuItem(id="m14", name="Lavender Lemonade", price=6.00, description="Squeezed lemons, lavender syrup, sparkling water.", category="Beverages", available=True, type="VEG", imageUrl=working_urls_map["m14"], calories=120),
            models.MenuItem(id="m15", name="Mango Passionfruit Smoothie", price=7.50, description="Fresh mango pulp, passionfruit juice, greek yogurt.", category="Beverages", available=True, type="VEG", imageUrl=working_urls_map["m15"], calories=240),
            models.MenuItem(id="m16", name="Iced Matcha Latte", price=6.50, description="Ceremonial grade matcha, oat milk, vanilla syrup.", category="Beverages", available=True, type="VEG", imageUrl=working_urls_map["m16"], calories=140),
            models.MenuItem(id="m17", name="Sparkling Water", price=4.00, description="Chilled sparkling mineral water with fresh lime.", category="Beverages", available=True, type="VEG", imageUrl=working_urls_map["m17"], calories=0),

            models.MenuItem(id="m18", name="Matcha Lava Cake", price=12.00, description="Molten white chocolate matcha core, vanilla gelato.", category="Desserts", available=True, type="VEG", imageUrl=working_urls_map["m18"], calories=450),
            models.MenuItem(id="m19", name="Signature Tiramisu", price=11.00, description="Mascarpone cream, ladyfingers, cocoa dusting.", category="Desserts", available=True, type="VEG", imageUrl=working_urls_map["m19"], badge="Chef Special", calories=480),
            models.MenuItem(id="m20", name="Vanilla Crème Brûlée", price=10.50, description="Rich custard base topped with caramelized sugar.", category="Desserts", available=True, type="VEG", imageUrl=working_urls_map["m20"], calories=390),
        ]
        db.add_all(initial_menu)
        db.commit()
    else:
        # Repair any existing seeded items (m1-m20) that have deprecated/broken Unsplash photo links
        for item_id, new_url in working_urls_map.items():
            existing_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
            if existing_item and "unsplash.com" in (existing_item.imageUrl or ""):
                # If it's a known broken unsplash ID or old seed, upgrade to the verified working link
                old_url = existing_item.imageUrl or ""
                broken_ids = ["photo-1608885898957", "photo-1599487488170", "photo-1573080496219", "photo-1559737607", "photo-1534422298391", "photo-1513558161293", "photo-1553530666", "photo-1536256263959", "photo-1563729784474", "photo-1571877227200", "photo-1516685018646"]
                if any(b_id in old_url for b_id in broken_ids) or old_url != new_url:
                    existing_item.imageUrl = new_url
        db.commit()

    # Seed 10 Tables: T01 to T10
    if db.query(models.Table).count() == 0:
        for i in range(1, 11):
            table_id = f"T{i:02d}"
            seats = 2 if i <= 4 else (4 if i <= 8 else 6)
            table = models.Table(id=table_id, name=f"Table {i}", seats=seats, status="AVAILABLE")
            db.add(table)
        db.commit()

    # Seed a sample order if empty
    if db.query(models.Order).count() == 0:
        ord_sample = models.Order(
            id="ord-101",
            tableId="T04",
            status="PREPARING",
            amount=57.00,
            time=datetime.datetime.now().strftime("%I:%M %p"),
            elapsedMinutes=10,
            allergyAlert=False
        )
        db.add(ord_sample)
        db.commit()
        
        # Link T04 state
        table_04 = db.query(models.Table).filter(models.Table.id == "T04").first()
        if table_04:
            table_04.status = "OCCUPIED"
            table_04.amount = 57.00
            table_04.seatedTime = datetime.datetime.now().strftime("%I:%M %p")
            table_04.elapsedMinutes = 10
            db.commit()

        item1 = models.OrderItem(orderId="ord-101", menuItemId="m7", quantity=1, completed=False)
        item2 = models.OrderItem(orderId="ord-101", menuItemId="m12", quantity=2, completed=False)
        db.add_all([item1, item2])
        db.commit()

from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

@app.exception_handler(OperationalError)
async def db_connection_error_handler(request, exc: OperationalError):
    err_str = str(exc)
    if 'database "postgres" does not exist' in err_str or "does not exist" in err_str:
        detail_msg = "Database 'postgres' not found via Supabase Transaction Pooler (port 6543). Please switch port 6543 to port 5432 (Session pooler) in your Render DATABASE_URL: postgresql://user:pass@aws-0-xxx.pooler.supabase.com:5432/postgres"
    elif "Network is unreachable" in err_str:
        detail_msg = "Could not reach database server. If deploying on Render with Supabase, ensure DATABASE_URL uses the IPv4 Session/Transaction Pooler URL (*.pooler.supabase.com) rather than the direct IPv6 URL (db.supabase.co)."
    elif "server closed the connection" in err_str or "connection reset" in err_str or "buffer" in err_str or "terminating connection" in err_str:
        detail_msg = "Database connection closed during query. If saving a large image or payload, please ensure it is compressed or under 500KB."
    else:
        detail_msg = f"Database operational error: {err_str[:250]}"
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "Database connection error.",
            "detail": detail_msg
        }
    )

@app.on_event("startup")
def startup_event():
    import time
    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            print(f"[Startup] Connecting to database and initializing schema (Attempt {attempt}/{max_retries})...")
            Base.metadata.create_all(bind=engine)
            db = next(get_db())
            seed_initial_data(db)
            print("[Startup] Database schema and initial data loaded successfully.")
            
            # Start daily market price background scheduler
            try:
                from scheduler import scheduler
                scheduler.start()
            except Exception as sched_err:
                print(f"[Startup] Failed to start market price background scheduler: {sched_err}")
                
            break
        except Exception as e:
            err_msg = str(e)
            print(f"[Startup] Database setup attempt {attempt} failed: {err_msg}")
            if attempt == max_retries:
                print("=" * 80)
                print("CRITICAL DATABASE CONNECTION WARNING ON STARTUP")
                print("=" * 80)
                print(f"Error details: {err_msg}")
                if "Network is unreachable" in err_msg or "OperationalError" in err_msg or "psycopg" in err_msg:
                    print("\n[TROUBLESHOOTING GUIDE FOR RENDER & SUPABASE / POSTGRESQL]:")
                    print("1. If using Supabase, you MUST use the IPv4 Connection Pooler string!")
                    print("   - Direct connection strings (db.<project-ref>.supabase.co) use IPv6 exclusively.")
                    print("   - Render Web Services DO NOT support outbound IPv6 TCP connections (raises 'Network is unreachable').")
                    print("   - FIX: In your Supabase Dashboard -> Project Settings -> Database -> Connection string, select 'Transaction pooler' or 'Session pooler' (e.g. aws-0-xxx.pooler.supabase.com:6543) and update your Render DATABASE_URL environment variable.")
                    print("2. Verify that your database server is running and accepting TCP/IP connections.")
                    print("3. Ensure any special characters (@, #, $, %) in your DB password inside DATABASE_URL are URL-encoded.")
                print("=" * 80)
            else:
                time.sleep(3)

@app.on_event("startup")
async def startup_prisma():
    try:
        from prisma_routes import prisma
        await prisma.connect()
        print("[Startup] Connected to Prisma Client successfully.")
    except Exception as prisma_err:
        print(f"[Startup] Failed to connect Prisma Client: {prisma_err}")

@app.on_event("shutdown")
async def shutdown_prisma():
    try:
        from prisma_routes import prisma
        if prisma.is_connected():
            await prisma.disconnect()
            print("[Shutdown] Disconnected from Prisma Client successfully.")
    except Exception as prisma_err:
        print(f"[Shutdown] Failed to disconnect Prisma Client: {prisma_err}")

# --- TABLES APIS ---
@app.get("/api/tables", response_model=List[schemas.TableSchema])
def get_tables(db: Session = Depends(get_db)):
    return db.query(models.Table).order_by(models.Table.id).all()

@app.post("/api/tables", response_model=schemas.TableSchema)
async def create_table(table: schemas.TableCreate, db: Session = Depends(get_db)):
    count = db.query(models.Table).count()
    table_id = f"T-{uuid.uuid4().hex[:6]}"
    db_table = models.Table(
        id=table_id,
        name=table.name,
        seats=table.seats,
        status="AVAILABLE"
    )
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    await manager.broadcast({"type": "REFRESH"})
    return db_table

@app.put("/api/tables/{table_id}", response_model=schemas.TableSchema)
async def update_table_status(table_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    db_table = db.query(models.Table).filter(models.Table.id == table_id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    if "status" in payload:
        db_table.status = payload["status"]
        if payload["status"] == "AVAILABLE":
            db_table.amount = None
            db_table.seatedTime = None
            db_table.elapsedMinutes = None
        else:
            if "amount" in payload:
                db_table.amount = payload["amount"]
            if db_table.seatedTime is None:
                db_table.seatedTime = datetime.datetime.now().strftime("%I:%M %p")
                db_table.elapsedMinutes = 0
                
    db.commit()
    db.refresh(db_table)
    await manager.broadcast({"type": "REFRESH"})
    return db_table

# --- CUSTOMER QR SCAN APIS ---
@app.post("/api/customers/qr-scan", response_model=schemas.CustomerSchema)
async def register_qr_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    db_cust = models.Customer(
        name=customer.name,
        phone=customer.phone,
        tableId=customer.tableId
    )
    db.add(db_cust)
    db.commit()
    db.refresh(db_cust)
    await manager.broadcast({"type": "REFRESH"})
    return db_cust

@app.get("/api/customers", response_model=List[schemas.CustomerSchema])
def get_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).order_by(models.Customer.scannedAt.desc()).all()

# --- MENU APIS ---
@app.get("/api/menu", response_model=List[schemas.MenuItemSchema])
def get_menu(db: Session = Depends(get_db)):
    return db.query(models.MenuItem).all()

@app.post("/api/menu", response_model=schemas.MenuItemSchema)
async def create_menu_item(item: schemas.MenuItemBase, db: Session = Depends(get_db)):
    count = db.query(models.MenuItem).count()
    new_id = f"m-{uuid.uuid4().hex[:8]}"
    db_item = models.MenuItem(
        id=new_id,
        name=item.name,
        price=item.price,
        description=item.description,
        category=item.category,
        available=item.available,
        type=item.type,
        imageUrl=item.imageUrl or "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300",
        badge=item.badge,
        calories=item.calories
    )
    db.add(db_item)
    
    # Ensure category exists in categories table too
    cat_exists = db.query(models.Category).filter(models.Category.name == item.category).first()
    if not cat_exists:
        db.add(models.Category(name=item.category))
        
    db.commit()
    db.refresh(db_item)
    await manager.broadcast({"type": "REFRESH"})
    return db_item

@app.put("/api/menu/{item_id}", response_model=schemas.MenuItemSchema)
async def update_menu_item(item_id: str, item_data: Dict[str, Any], db: Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="MenuItem not found")
        
    for key, value in item_data.items():
        if hasattr(db_item, key):
            setattr(db_item, key, value)
            
    db.commit()
    db.refresh(db_item)
    await manager.broadcast({"type": "REFRESH"})
    return db_item

@app.delete("/api/menu/{item_id}")
async def delete_menu_item(item_id: str, db: Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="MenuItem not found")
    db.delete(db_item)
    db.commit()
    await manager.broadcast({"type": "REFRESH"})
    return {"message": "Item deleted successfully"}

def normalize_tid(tid: str) -> str:
    clean = str(tid or "T04").strip().upper()
    for prefix in ["TABLE", "TBL", "T-", "T_"]:
        if clean.startswith(prefix):
            clean = clean[len(prefix):].strip()
    if clean.startswith("T"):
        clean = clean[1:].strip()
    if clean.isdigit():
        return f"T{int(clean):02d}"
    return f"T{clean}" if not clean.startswith("T") else clean

# --- ORDERS APIS ---
@app.get("/api/orders", response_model=List[schemas.OrderSchema])
def get_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(models.Order.time.desc()).all()

@app.post("/api/orders", response_model=schemas.OrderSchema)
async def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    clean_tid = normalize_tid(payload.tableId)
        
    db_table = db.query(models.Table).filter(models.Table.id == clean_tid).first()
    if not db_table:
        table_num = clean_tid[1:].lstrip("0") or clean_tid
        db_table = models.Table(id=clean_tid, name=f"Table {table_num}", seats=4, status="AVAILABLE")
        db.add(db_table)
        db.commit()
        db.refresh(db_table)
    payload.tableId = db_table.id
        
    # Calculate amount
    total_amount = 0.0
    items_to_add = []
    
    # Check menu items and build order items
    for item in payload.items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item.menuItemId).first()
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"MenuItem {item.menuItemId} not found")
        total_amount += menu_item.price * item.quantity
        
    # Create order
    count = db.query(models.Order).count()
    order_id = f"ord-{uuid.uuid4().hex[:8]}"
    current_time = datetime.datetime.now().strftime("%I:%M %p")
    
    db_order = models.Order(
        id=order_id,
        tableId=payload.tableId,
        status="PENDING",
        amount=round(total_amount, 2),
        time=current_time,
        elapsedMinutes=0,
        allergyAlert=False
    )
    db.add(db_order)
    db.commit() # commit to get order instance persisted
    
    # Add order items
    for item in payload.items:
        db_item = models.OrderItem(
            orderId=order_id,
            menuItemId=item.menuItemId,
            quantity=item.quantity,
            notes=item.notes,
            completed=False
        )
        db.add(db_item)
        
    # Update table status
    db_table.status = "OCCUPIED"
    db_table.amount = round((db_table.amount or 0.0) + total_amount, 2)
    if not db_table.seatedTime:
        db_table.seatedTime = current_time
        db_table.elapsedMinutes = 0
        
    db.commit()
    db.refresh(db_order)
    await manager.broadcast({"type": "REFRESH"})
    return db_order

@app.put("/api/orders/{order_id}", response_model=schemas.OrderSchema)
async def update_order_status(order_id: str, payload: Dict[str, str], db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if "status" in payload:
        new_status = payload["status"]
        old_status = db_order.status
        db_order.status = new_status
        
        # If order is cancelled and wasn't already cancelled/completed, deduct amount from table
        if new_status == "CANCELLED" and old_status not in ["CANCELLED", "COMPLETED"]:
            db_table = db.query(models.Table).filter(models.Table.id == db_order.tableId).first()
            if db_table:
                db_table.amount = max(0.0, round((db_table.amount or 0.0) - db_order.amount, 2))
                # Check if there are other active orders for this table
                active_orders = db.query(models.Order).filter(
                    models.Order.tableId == db_order.tableId,
                    models.Order.status.in_(["PENDING", "PREPARING", "READY"])
                ).count()
                if active_orders == 0 and (db_table.amount <= 0.01 or db_table.amount is None):
                    db_table.status = "AVAILABLE"
                    db_table.amount = None
                    db_table.seatedTime = None
                    db_table.elapsedMinutes = None
                elif active_orders == 0 and db_table.amount > 0:
                    db_table.status = "PAYMENT_PENDING"

        # If the order is served/completed, let's update table status to PAYMENT_PENDING if no other orders are preparing/pending
        elif new_status == "COMPLETED":
            table_id = db_order.tableId
            # Check if there are other pending/preparing orders for this table
            active_orders = db.query(models.Order).filter(
                models.Order.tableId == table_id,
                models.Order.status.in_(["PENDING", "PREPARING", "READY"])
            ).count()
            if active_orders == 0:
                db_table = db.query(models.Table).filter(models.Table.id == table_id).first()
                if db_table:
                    db_table.status = "PAYMENT_PENDING"
                    
    db.commit()
    db.refresh(db_order)
    await manager.broadcast({"type": "REFRESH"})
    return db_order

@app.put("/api/orders/{order_id}/items/{item_index}/toggle", response_model=schemas.OrderSchema)
async def toggle_order_item_completion(order_id: str, item_index: int, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Order items are joined. Let's retrieve items by ordering their ID to make sure index is consistent
    items = sorted(db_order.items, key=lambda x: x.id)
    if item_index < 0 or item_index >= len(items):
        raise HTTPException(status_code=404, detail="Item index out of range")
        
    target_item = items[item_index]
    target_item.completed = not target_item.completed
    
    db.commit()
    db.refresh(db_order)
    await manager.broadcast({"type": "REFRESH"})
    return db_order

# --- PAYMENTS & BILLING APIS ---
@app.post("/api/payments/settle", response_model=schemas.PaymentSchema)
async def settle_bill(payload: schemas.PaymentCreate, db: Session = Depends(get_db)):
    clean_tid = normalize_tid(payload.tableId)
    payload.tableId = clean_tid
    db_table = db.query(models.Table).filter(models.Table.id == clean_tid).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
        
    # Get active orders of this table to mark completed
    table_orders = db.query(models.Order).filter(
        models.Order.tableId == clean_tid,
        models.Order.status.notin_(["COMPLETED", "CANCELLED"])
    ).all()
    
    for order in table_orders:
        order.status = "COMPLETED"
        for item in order.items:
            item.completed = True
            
    # Reset table
    db_table.status = "AVAILABLE"
    db_table.amount = None
    db_table.seatedTime = None
    db_table.elapsedMinutes = None
    
    # Create payment record
    count = db.query(models.Payment).count()
    pay_id = f"pay-{uuid.uuid4().hex[:8]}"
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    
    # Link to last order if exists
    order_id = table_orders[-1].id if table_orders else None
    
    db_payment = models.Payment(
        id=pay_id,
        orderId=order_id,
        tableId=payload.tableId,
        method=payload.method,
        subtotal=payload.subtotal,
        gst=payload.gst,
        serviceCharge=payload.serviceCharge,
        discount=payload.discount,
        total=payload.total,
        timestamp=current_time
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    await manager.broadcast({"type": "REFRESH"})
    return db_payment

# --- REPORTS & STATS APIS ---
@app.get("/api/reports/stats")
def get_reports_stats(db: Session = Depends(get_db)):
    payments = db.query(models.Payment).all()
    
    # Calculate revenue and completed counts from actual DB records
    today_sales = sum(p.total for p in payments)
    completed_orders_count = len(payments)
    avg_order_value = today_sales / completed_orders_count if completed_orders_count > 0 else 0.0
    
    active_orders = db.query(models.Order).filter(models.Order.status.in_(["PENDING", "PREPARING", "READY"])).count()
    occupied_tables = db.query(models.Table).filter(models.Table.status.in_(["OCCUPIED", "PAYMENT_PENDING"])).count()
    pending_orders = db.query(models.Order).filter(models.Order.status == "PENDING").count()
    
    # Group payments by payment method
    method_totals = {"Cash": 0.0, "Card": 0.0, "UPI": 0.0, "Online": 0.0}
    for p in payments:
        method = p.method if p.method in method_totals else "Cash"
        method_totals[method] += p.total

    # Best selling items query from completed orders
    best_sellers = db.query(
        models.MenuItem.name,
        models.MenuItem.category,
        db.func.sum(models.OrderItem.quantity).label("quantity"),
        db.func.sum(models.OrderItem.quantity * models.MenuItem.price).label("revenue")
    ).join(
        models.OrderItem, models.OrderItem.menuItemId == models.MenuItem.id
    ).join(
        models.Order, models.Order.id == models.OrderItem.orderId
    ).filter(
        models.Order.status == "COMPLETED"
    ).group_by(
        models.MenuItem.name, models.MenuItem.category
    ).order_by(
        db.func.sum(models.OrderItem.quantity).desc()
    ).limit(5).all()
    
    best_selling_items = [
        {"name": row[0], "category": row[1], "orders": int(row[2]), "revenue": round(float(row[3]), 2), "trend": "up"}
        for row in best_sellers
    ]
    
    if not best_selling_items:
        # Fallback to display template formatting if no sales simulated yet
        best_selling_items = [
            {"name": "Wagyu Truffle Burger", "category": "Main Course", "orders": 0, "revenue": 0.0, "trend": "up"},
            {"name": "Atlantic Salmon Steak", "category": "Main Course", "orders": 0, "revenue": 0.0, "trend": "up"}
        ]

    # Weekly distribution
    weekly_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly_data = [12500, 15000, 14200, 18500, 24000, 32000, today_sales if today_sales > 0 else 28000]
    
    # Category Distribution
    category_distribution = {"Main Course": 0, "Starters": 0, "Beverages": 0, "Desserts": 0}
    cat_items = db.query(
        models.MenuItem.category,
        db.func.sum(models.OrderItem.quantity)
    ).join(
        models.OrderItem, models.OrderItem.menuItemId == models.MenuItem.id
    ).join(
        models.Order, models.Order.id == models.OrderItem.orderId
    ).filter(
        models.Order.status == "COMPLETED"
    ).group_by(
        models.MenuItem.category
    ).all()
    
    for row in cat_items:
        cat = row[0]
        qty = int(row[1] or 0)
        if cat in category_distribution:
            category_distribution[cat] = qty
            
    if sum(category_distribution.values()) == 0:
        category_distribution = {"Main Course": 45, "Beverages": 25, "Starters": 20, "Desserts": 10}

    # Peak hours service (simply map database payments or use high-aesthetic curves)
    peak_labels = ["11am", "1pm", "3pm", "5pm", "7pm", "9pm", "11pm"]
    peak_data = [15, 45, 12, 28, 65, 50, 18]

    return {
        "todaySales": round(today_sales, 2),
        "completedOrdersCount": completed_orders_count,
        "averageOrderValue": round(avg_order_value, 2),
        "activeOrdersCount": active_orders,
        "occupiedTablesCount": occupied_tables,
        "pendingOrdersCount": pending_orders,
        "revenueChangePercent": 12.5,
        "ordersChangePercent": 5.2,
        "bestSellingItems": best_selling_items,
        "weeklyRevenue": {
            "labels": weekly_labels,
            "data": weekly_data
        },
        "categoryDistribution": {
            "labels": list(category_distribution.keys()),
            "data": list(category_distribution.values())
        },
        "peakHours": {
            "labels": peak_labels,
            "data": peak_data
        },
        "revenueByPaymentMethod": method_totals
    }

# --- DEDICATED DEMO MODE APIS ---
@app.post("/api/demo/reset")
async def demo_reset(db: Session = Depends(get_db)):
    try:
        # Clear all order, payment, and seed tables
        db.query(models.OrderItem).delete()
        db.query(models.Order).delete()
        db.query(models.Payment).delete()
        db.query(models.Table).delete()
        db.query(models.MenuItem).delete()
        db.query(models.Category).delete()
        db.query(models.Restaurant).delete()
        db.commit()
        
        # Re-seed clean demo restaurant state
        seed_initial_data(db)
        
        await manager.broadcast({"type": "REFRESH"})
        return {"message": "Database reset to seed state successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

@app.post("/api/demo/lunch-rush")
async def demo_lunch_rush(db: Session = Depends(get_db)):
    try:
        # Clear active pending orders
        db.query(models.OrderItem).filter(
            models.OrderItem.orderId.in_(
                db.query(models.Order.id).filter(models.Order.status != "COMPLETED")
            )
        ).delete(synchronize_session=False)
        db.query(models.Order).filter(models.Order.status != "COMPLETED").delete(synchronize_session=False)
        
        # Reset all tables to AVAILABLE
        tables = db.query(models.Table).all()
        for t in tables:
            t.status = "AVAILABLE"
            t.amount = None
            t.seatedTime = None
            t.elapsedMinutes = None
        db.commit()
        
        menu_items = db.query(models.MenuItem).filter(models.MenuItem.available == True).all()
        if len(menu_items) < 5:
            raise HTTPException(status_code=400, detail="Seed database first using reset.")

        # Simulate rush orders on T02, T04, T06, T08
        rush_configs = [
            {"tableId": "T02", "status": "PENDING", "elapsed": 4},
            {"tableId": "T04", "status": "PREPARING", "elapsed": 12},
            {"tableId": "T06", "status": "READY", "elapsed": 24},
            {"tableId": "T08", "status": "READY", "elapsed": 38}
        ]
        
        current_time = datetime.datetime.now()
        
        for config in rush_configs:
            count = db.query(models.Order).count()
            order_id = f"ord-rush-{uuid.uuid4().hex[:8]}"
            seated_time_dt = current_time - datetime.timedelta(minutes=config["elapsed"])
            seated_time_str = seated_time_dt.strftime("%I:%M %p")
            
            selected_items = random.sample(menu_items, random.randint(2, 4))
            total_amount = 0.0
            order_items = []
            
            for item in selected_items:
                qty = random.randint(1, 2)
                total_amount += item.price * qty
                order_items.append({
                    "item": item,
                    "qty": qty
                })
                
            db_order = models.Order(
                id=order_id,
                tableId=config["tableId"],
                status=config["status"],
                amount=round(total_amount, 2),
                time=seated_time_str,
                elapsedMinutes=config["elapsed"],
                allergyAlert=random.choice([True, False])
            )
            db.add(db_order)
            db.commit()
            
            for oi in order_items:
                db_item = models.OrderItem(
                    orderId=order_id,
                    menuItemId=oi["item"].id,
                    quantity=oi["qty"],
                    notes=random.choice(["No onions", "Spicy", "", "Extra sauce", ""]) if oi["item"].category == "Main Course" else "",
                    completed=True if config["status"] in ["READY", "COMPLETED"] else random.choice([True, False])
                )
                db.add(db_item)
                
            db_table = db.query(models.Table).filter(models.Table.id == config["tableId"]).first()
            if db_table:
                db_table.status = "OCCUPIED"
                db_table.amount = round(total_amount, 2)
                db_table.seatedTime = seated_time_str
                db_table.elapsedMinutes = config["elapsed"]
                
        db.commit()
        await manager.broadcast({"type": "REFRESH"})
        return {"message": "Lunch rush simulation generated successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lunch rush generation failed: {str(e)}")

@app.post("/api/demo/simulate-sales")
async def demo_simulate_sales(db: Session = Depends(get_db)):
    try:
        # Clear completed orders and payment history
        db.query(models.OrderItem).filter(
            models.OrderItem.orderId.in_(
                db.query(models.Order.id).filter(models.Order.status == "COMPLETED")
            )
        ).delete(synchronize_session=False)
        db.query(models.Order).filter(models.Order.status == "COMPLETED").delete(synchronize_session=False)
        db.query(models.Payment).delete()
        db.commit()
        
        menu_items = db.query(models.MenuItem).all()
        if not menu_items:
            raise HTTPException(status_code=400, detail="No menu items to simulate sales.")
            
        payment_methods = ["Cash", "Card", "UPI", "Online"]
        num_sales = random.randint(15, 20)
        current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        
        for i in range(num_sales):
            hour = random.randint(11, 22)
            minute = random.randint(0, 59)
            time_str = f"{hour:02d}:{minute:02d}"
            timestamp_str = f"{current_date} {time_str}"
            time_12hr = datetime.datetime.strptime(time_str, "%H:%M").strftime("%I:%M %p")
            
            table_id = f"T{random.randint(1, 10):02d}"
            items_count = random.randint(2, 5)
            selected_items = random.choices(menu_items, k=items_count)
            
            subtotal = 0.0
            order_items = []
            order_id = f"ord-sale-{uuid.uuid4().hex[:8]}"
            
            for item in selected_items:
                qty = random.randint(1, 2)
                subtotal += item.price * qty
                order_items.append(
                    models.OrderItem(orderId=order_id, menuItemId=item.id, quantity=qty, completed=True)
                )
                
            db_order = models.Order(
                id=order_id,
                tableId=table_id,
                status="COMPLETED",
                amount=round(subtotal, 2),
                time=time_12hr,
                elapsedMinutes=random.randint(20, 60),
                allergyAlert=False
            )
            db.add(db_order)
            db.commit()
            db.add_all(order_items)
            
            gst = round(subtotal * 0.05, 2)
            service_charge = round(subtotal * 0.10, 2)
            discount = round(subtotal * 0.20, 2) if random.random() < 0.15 else 0.0
            total = round(subtotal + gst + service_charge - discount, 2)
            
            db_payment = models.Payment(
                id=f"pay-{100 + i}",
                orderId=order_id,
                tableId=table_id,
                method=random.choice(payment_methods),
                subtotal=round(subtotal, 2),
                gst=gst,
                serviceCharge=service_charge,
                discount=discount,
                total=total,
                timestamp=timestamp_str
            )
            db.add(db_payment)
            
        db.commit()
        await manager.broadcast({"type": "REFRESH"})
        return {"message": f"Successfully simulated {num_sales} completed sales."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Sales simulation failed: {str(e)}")

# --- MARKET PRICES SYNC APIS ---
@app.post("/api/market-prices/sync")
def trigger_market_sync():
    from scheduler import scheduler
    result = scheduler.trigger_sync()
    return result

@app.get("/api/market-prices/sync/status")
def get_market_sync_status():
    from scheduler import scheduler
    return {
        "is_alive": scheduler._thread.is_alive() if scheduler._thread else False,
        "last_run": scheduler.last_run_time.isoformat() if scheduler.last_run_time else None,
        "next_run": scheduler.next_run_time.isoformat() if scheduler.next_run_time else None,
        "runs_count": scheduler.runs_count
    }
