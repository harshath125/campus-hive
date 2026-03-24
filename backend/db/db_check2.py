"""
DB Diagnostic — outputs to db_check_output.txt and console.
Run: venv\Scripts\python.exe db_check2.py
"""
import os, sys
from dotenv import load_dotenv

load_dotenv()

lines = []
def log(msg=""):
    lines.append(msg)
    print(msg)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    log("ERROR: DATABASE_URL is not set in .env!")
    open("db_check_output.txt", "w").write("\n".join(lines))
    sys.exit(1)

host_part = DATABASE_URL.split("@")[-1]
log(f"DATABASE_URL host: {host_part}")

try:
    import psycopg2
    log("Connecting to Supabase via psycopg2...")
    conn = psycopg2.connect(DATABASE_URL, sslmode="require", connect_timeout=10)
    cur = conn.cursor()

    cur.execute("SELECT current_user, current_database();")
    row = cur.fetchone()
    log(f"Connected as user: {row[0]}  db: {row[1]}")

    cur.execute("""
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
    """)
    tables = cur.fetchall()
    log(f"\nTables in public schema: {len(tables)}")
    for (t,) in tables:
        cur.execute(f'SELECT COUNT(*) FROM public."{t}"')
        cnt = cur.fetchone()[0]
        log(f"  {t:<25} {cnt:>5} rows")

    cur.execute("SELECT typname FROM pg_type WHERE typcategory='E' ORDER BY typname;")
    enums = [e[0] for e in cur.fetchall()]
    log(f"\nEnum types: {enums}")

    cur.close()
    conn.close()
    log("\nConnection OK")

except Exception as e:
    log(f"\nCONNECTION FAILED: {e}")

log("\n--- Flask ORM check ---")
try:
    from app import create_app
    from app.models import User, Group, Poll, Event, Incident
    app = create_app()
    with app.app_context():
        uc = User.query.count()
        gc = Group.query.count()
        pc = Poll.query.count()
        ec = Event.query.count()
        ic = Incident.query.count()
        log(f"User count:     {uc}")
        log(f"Group count:    {gc}")
        log(f"Poll count:     {pc}")
        log(f"Event count:    {ec}")
        log(f"Incident count: {ic}")
        if uc > 0:
            latest = User.query.order_by(User.created_at.desc()).first()
            log(f"Latest user: {latest.name} / {latest.email}")
        else:
            log("No users yet — register at localhost:3000/signup")
except Exception as e2:
    log(f"Flask ORM error: {e2}")

open("db_check_output.txt", "w", encoding="utf-8").write("\n".join(lines))
log("\nOutput saved to db_check_output.txt")
