import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./restora.db")

# Normalize Supabase connection string if it starts with postgres://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def create_configured_engine(url: str):
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    else:
        return create_engine(url, pool_pre_ping=True, pool_size=10, max_overflow=20)

engine = create_configured_engine(DATABASE_URL)

# Test remote connection; fallback to SQLite if remote fails
if not DATABASE_URL.startswith("sqlite"):
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
        print(f"[DATABASE] Connected successfully to remote PostgreSQL/Supabase database!")
    except Exception as e:
        print("\n" + "=" * 70)
        print("  [DATABASE NOTICE] Could not reach remote PostgreSQL/Supabase database:")
        print(f"  {e}")
        print("  --> Falling back to local SQLite (restora.db) so your app runs without crashing!")
        print("  --> Check your Supabase connection string or use the connection pooler.")
        print("=" * 70 + "\n")
        DATABASE_URL = "sqlite:///./restora.db"
        engine = create_configured_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
