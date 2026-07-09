import os
import urllib.parse as urlparse
import psycopg
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/serveflow_db")

def ensure_database_exists():
    try:
        url = urlparse.urlparse(DATABASE_URL)
        db_name = url.path.lstrip("/")
        
        host = url.hostname or "localhost"
        if host not in ["localhost", "127.0.0.1"]:
            print(f"[Database] Hosted DB detected ({host}). Skipping local auto-creation check.")
            return
            
        user = url.username or "postgres"
        password = url.password or "postgres"
        port = url.port or 5432
        
        default_url = f"postgresql://{user}:{password}@{host}:{port}/postgres"
        
        conn = psycopg.connect(default_url, autocommit=True)
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (db_name,))
        exists = cur.fetchone()
        if not exists:
            print(f"[Database] Local database '{db_name}' does not exist. Creating...")
            cur.execute(f"CREATE DATABASE {db_name}")
            print(f"[Database] '{db_name}' created successfully.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[Database] Notice during local auto-creation check: {e}")

ensure_database_exists()

engine_url = DATABASE_URL
if engine_url.startswith("postgresql://"):
    engine_url = engine_url.replace("postgresql://", "postgresql+psycopg://", 1)

connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,
}

if "sqlite" not in engine_url:
    connect_args["connect_timeout"] = 15
    # For Supabase poolers / PgBouncer, disable server-side prepared statements and set pool parameters
    if ":6543" in engine_url or "pooler.supabase.com" in engine_url or "pgbouncer" in engine_url:
        connect_args["prepare_threshold"] = None
        engine_kwargs["pool_recycle"] = 300
        engine_kwargs["pool_size"] = 5
        engine_kwargs["max_overflow"] = 10

engine = create_engine(
    engine_url,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
