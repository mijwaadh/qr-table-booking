import os
import urllib.parse as urlparse
import psycopg
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load .env file manually if exists
def load_dotenv():
    # Try backend directory first, then root directory
    for base_dir in [os.path.dirname(os.path.abspath(__file__)), os.getcwd()]:
        env_path = os.path.join(base_dir, ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        parts = line.split("=", 1)
                        key = parts[0].strip()
                        val = parts[1].strip().strip('"').strip("'")
                        os.environ[key] = val
            break

load_dotenv()

raw_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/serveflow_db")
DATABASE_URL = raw_url.strip().strip('"').strip("'").strip() if raw_url else ""

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

def resolve_working_db_url(url_str: str) -> str:
    url_str = url_str.strip().strip('"').strip("'").strip()
    if "sqlite" in url_str:
        return url_str
    try:
        conn = psycopg.connect(url_str, connect_timeout=10)
        conn.close()
        print("[Database] Successfully verified connection using provided DATABASE_URL.")
        return url_str
    except Exception as e:
        err_msg = str(e)
        print(f"[Database] Connection test with provided URL failed: {err_msg}")
        if ('database "postgres' in err_msg or "does not exist" in err_msg) and "/postgres" in url_str:
            try:
                parsed = urlparse.urlparse(url_str)
                user = parsed.username or ""
                if "." in user:
                    project_id = user.split(".")[-1].strip()
                    if project_id and project_id != "postgres":
                        alt_url = url_str.rsplit("/postgres", 1)[0].strip() + f"/{project_id}"
                        print(f"[Database] Retrying connection with project ID database name: '{project_id}'...")
                        conn2 = psycopg.connect(alt_url, connect_timeout=10)
                        conn2.close()
                        print(f"[Database] Success! Using database name '{project_id}'.")
                        return alt_url
            except Exception as e2:
                print(f"[Database] Fallback database check failed: {e2}")
        return url_str

working_url = resolve_working_db_url(DATABASE_URL)
engine_url = working_url
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
