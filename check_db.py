"""
Restora Database & Supabase Health Check Utility
Tests connectivity to either Supabase PostgreSQL or local SQLite database.
"""
import os
import sys
import time
from dotenv import load_dotenv

load_dotenv()

def print_banner():
    print("=" * 70)
    print("  RESTORA -- DATABASE & SUPABASE CONNECTIVITY MONITOR")
    print("=" * 70)

def check_supabase_http(supabase_url, anon_key=None):
    import urllib.request
    import json
    
    if not supabase_url or "your-project-ref" in supabase_url:
        return None
        
    print(f"[*] Checking Supabase HTTPS API Endpoint: {supabase_url}...")
    headers = {"User-Agent": "RestoraHealthCheck/1.0"}
    if anon_key and "your-anon" not in anon_key:
        headers["apikey"] = anon_key
        headers["Authorization"] = f"Bearer {anon_key}"
        
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/"
    req = urllib.request.Request(endpoint, headers=headers)
    
    start_t = time.time()
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            elapsed_ms = (time.time() - start_t) * 1000
            print(f"    [OK] Supabase API is REACHABLE (HTTP {resp.status}) - {elapsed_ms:.1f}ms latency")
            return True
    except urllib.error.HTTPError as e:
        elapsed_ms = (time.time() - start_t) * 1000
        # 401 or 200 means Supabase service is responding
        if e.code in [200, 400, 401, 403, 404]:
            print(f"    [OK] Supabase API is REACHABLE (HTTP {e.code}) - {elapsed_ms:.1f}ms latency")
            return True
        else:
            print(f"    [WARN] Supabase API returned HTTP {e.code}: {e.reason}")
            return False
    except Exception as ex:
        print(f"    [ERROR] Cannot connect to Supabase HTTPS URL: {ex}")
        return False

def check_database():
    print_banner()
    
    db_url = os.getenv("DATABASE_URL", "sqlite:///./restora.db")
    supabase_url = os.getenv("SUPABASE_URL", "")
    anon_key = os.getenv("SUPABASE_ANON_KEY", "")
    
    # 1. Supabase REST API check if configured
    if supabase_url and "your-project-ref" not in supabase_url:
        check_supabase_http(supabase_url, anon_key)
        print("-" * 70)

    # 2. Database Connection Check
    is_postgres = db_url.startswith("postgres://") or db_url.startswith("postgresql://")
    is_sqlite = db_url.startswith("sqlite")
    
    if is_sqlite:
        print("[i] Current Active Database: LOCAL SQLITE")
        print(f"    Connection: {db_url}")
        db_path = db_url.replace("sqlite:///", "")
        
        from sqlalchemy import create_engine, text
        try:
            engine = create_engine(db_url)
            start_t = time.time()
            with engine.connect() as conn:
                res = conn.execute(text("SELECT count(*) FROM sqlite_master WHERE type='table';")).scalar()
                fac_count = conn.execute(text("SELECT count(*) FROM facilities;")).scalar() if conn.execute(text("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='facilities';")).scalar() else 0
                user_count = conn.execute(text("SELECT count(*) FROM users;")).scalar() if conn.execute(text("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='users';")).scalar() else 0
            
            elapsed_ms = (time.time() - start_t) * 1000
            print(f"    [OK] SQLite database is active and readable ({elapsed_ms:.1f}ms).")
            print(f"    Tables Found: {res} | Users: {user_count} | Rest Points: {fac_count}")
            print("-" * 70)
            print("  NOTE: To point Restora to your Supabase PostgreSQL cloud database:")
            print("  1. Run supabase_schema.sql in your Supabase SQL editor.")
            print("  2. In your .env file, replace DATABASE_URL with your Supabase URI:")
            print("     DATABASE_URL=postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require")
            print("  3. Run this check command again: npm run check:db")
            print("=" * 70)
            return True
        except Exception as e:
            print(f"    [ERROR] SQLite error: {e}")
            return False

    elif is_postgres:
        # Normalize connection string
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
            
        # Obfuscate password in print
        import re
        masked_url = re.sub(r':([^:@]+)@', r':********@', db_url)
        print(f"[*] Target Database: SUPABASE POSTGRESQL")
        print(f"    Connection URI: {masked_url}")
        print("    Initiating TCP handshake & SQL ping...")
        
        from sqlalchemy import create_engine, text
        start_t = time.time()
        try:
            engine = create_engine(db_url, pool_pre_ping=True)
            with engine.connect() as conn:
                version = conn.execute(text("SELECT version();")).scalar()
                current_db = conn.execute(text("SELECT current_database();")).scalar()
                current_user = conn.execute(text("SELECT current_user;")).scalar()
                server_time = conn.execute(text("SELECT NOW();")).scalar()
                
                # Check tables
                tables = conn.execute(text("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    ORDER BY table_name;
                """)).scalars().all()
                
                fac_count = 0
                user_count = 0
                if "facilities" in tables:
                    fac_count = conn.execute(text("SELECT count(*) FROM facilities;")).scalar()
                if "users" in tables:
                    user_count = conn.execute(text("SELECT count(*) FROM users;")).scalar()
                    
            elapsed_ms = (time.time() - start_t) * 1000
            print("-" * 70)
            print("  >>> SUPABASE STATUS: ONLINE & OPERATIONAL! <<<")
            print("-" * 70)
            print(f"  Response Latency:  {elapsed_ms:.1f} ms")
            print(f"  Database Name:     {current_db}")
            print(f"  Connected User:    {current_user}")
            print(f"  Database Server:   {version.split(',')[0] if version else 'PostgreSQL'}")
            print(f"  Supabase Time:     {server_time}")
            print(f"  Public Tables ({len(tables)}): {', '.join(tables) if tables else 'None yet (Run supabase_schema.sql)'}")
            print(f"  Seeded Facilities: {fac_count}")
            print(f"  Registered Users:  {user_count}")
            print("=" * 70)
            return True
        except Exception as e:
            elapsed_ms = (time.time() - start_t) * 1000
            print("-" * 70)
            print("  >>> SUPABASE STATUS: CONNECTION FAILED <<<")
            print("-" * 70)
            print(f"  Error message: {e}")
            print(f"  Failed after:  {elapsed_ms:.1f} ms")
            print("\n  Troubleshooting checklist:")
            print("  1. Check database password in .env (replace [YOUR-DB-PASSWORD]).")
            print("  2. Ensure your Supabase project is active (not paused in Supabase Dashboard).")
            print("  3. For Supabase, use the Transaction Pooler URI (port 6543) or Direct URI (port 5432).")
            print("  4. Verify your IP is allowed or SSL is enabled (?sslmode=require).")
            print("=" * 70)
            return False
    else:
        print(f"[!] Unknown database protocol: {db_url}")
        return False

if __name__ == "__main__":
    success = check_database()
    sys.exit(0 if success else 1)
