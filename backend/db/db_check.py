"""
DB Diagnostic Script — checks Supabase connection, lists tables,
and prints row counts. Run from: campus-hive/backend
Usage: python db_check.py
"""
import os, sys
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL is not set in .env!")
    sys.exit(1)

print(f"✅ DATABASE_URL found:")
# Mask password in output
masked = DATABASE_URL.split("@")
print(f"   ...@{masked[-1]}\n")

# ── Try raw psycopg2 connection first ──────────────────────────────────────
try:
    import psycopg2
    print("🔌 Testing raw psycopg2 connection...")
    conn = psycopg2.connect(DATABASE_URL, sslmode="require", connect_timeout=10)
    cur = conn.cursor()

    # Check current database + user
    cur.execute("SELECT current_user, current_database(), version();")
    row = cur.fetchone()
    print(f"   User: {row[0]}")
    print(f"   DB:   {row[1]}")
    print(f"   PG:   {row[2][:60]}...\n")

    # List all tables in public schema
    cur.execute("""
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
    """)
    tables = cur.fetchall()
    if not tables:
        print("⚠️  NO TABLES found in public schema!")
        print("   → Flask db.create_all() hasn't run yet, or connection is wrong.\n")
    else:
        print(f"✅ Tables in public schema ({len(tables)} found):")
        for (t,) in tables:
            # Get row count for each
            cur.execute(f'SELECT COUNT(*) FROM "{t}"')
            cnt = cur.fetchone()[0]
            print(f"   [{cnt:>4} rows]  {t}")

    # Check for SQLAlchemy enum types
    cur.execute("SELECT typname FROM pg_type WHERE typcategory = 'E' ORDER BY typname;")
    enums = cur.fetchall()
    if enums:
        print(f"\n✅ Enum types: {[e[0] for e in enums]}")

    cur.close()
    conn.close()
    print("\n✅ Supabase connection successful!")

except Exception as e:
    print(f"\n❌ Connection FAILED: {e}")
    print("\n   Check your DATABASE_URL in .env")
    print("   Make sure the Supabase project is active (not paused)")
    sys.exit(1)

# ── Try SQLAlchemy + Flask app context ─────────────────────────────────────
print("\n🔌 Testing via Flask app context...")
try:
    from app import create_app
    from app.models import User, Group, Poll, Event, Incident
    from app.extensions import db as sqlalchemy_db

    app = create_app()
    with app.app_context():
        try:
            user_count = User.query.count()
            group_count = Group.query.count()
            poll_count = Poll.query.count()
            event_count = Event.query.count()
            incident_count = Incident.query.count()
            print(f"\n✅ SQLAlchemy ORM counts:")
            print(f"   Users:     {user_count}")
            print(f"   Groups:    {group_count}")
            print(f"   Polls:     {poll_count}")
            print(f"   Events:    {event_count}")
            print(f"   Incidents: {incident_count}")
            if user_count > 0:
                latest = User.query.order_by(User.created_at.desc()).first()
                print(f"\n   Latest user: {latest.name} ({latest.email})")
        except Exception as e:
            print(f"   ❌ ORM query failed: {e}")
            print("   → Attempting db.create_all()...")
            sqlalchemy_db.create_all()
            print("   ✅ db.create_all() completed — tables created")
except Exception as e:
    print(f"   ❌ Flask app context failed: {e}")

print("\n─────────────────────────────────")
print("DONE. If tables are 0 rows, the app is connected but no data has been")
print("inserted. Register a user at http://localhost:3000/signup to test.")
