"""
DB Fix Script — Inspects existing column names in `users` table,
adds missing columns, and aligns the schema so Flask ORM works.

Run from backend folder:
  venv\Scripts\python.exe db_fix.py
"""
import os, sys
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

try:
    import psycopg2
    conn = psycopg2.connect(DATABASE_URL, sslmode="require", connect_timeout=10)
    conn.autocommit = False
    cur = conn.cursor()
    print("✅ Connected to Supabase\n")

    # ── Check current columns in `users` table ─────────────────────────────
    cur.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
        ORDER BY ordinal_position;
    """)
    cols = cur.fetchall()
    print(f"Current `users` table columns ({len(cols)}):")
    existing_col_names = []
    for col in cols:
        print(f"  {col[0]:<25} {col[1]:<20} nullable={col[2]}")
        existing_col_names.append(col[0])

    # ── Determine what's missing ────────────────────────────────────────────
    needed = {
        "hashed_password": "VARCHAR(255)",
        "avatar":          "VARCHAR(50) DEFAULT '👤'",
        "role":            "VARCHAR(20) DEFAULT 'student'",
        "branch":          "VARCHAR(100)",
        "section":         "VARCHAR(50)",
        "year":            "INTEGER",
        "tags":            "TEXT[] DEFAULT ARRAY[]::TEXT[]",
        "vibe_score":      "INTEGER DEFAULT 0",
        "is_active":       "BOOLEAN DEFAULT TRUE",
        "updated_at":      "TIMESTAMPTZ",
    }

    # If 'password' exists but 'hashed_password' doesn't → rename
    fixes_applied = []
    if "password" in existing_col_names and "hashed_password" not in existing_col_names:
        print("\n  → Renaming 'password' to 'hashed_password'...")
        cur.execute('ALTER TABLE users RENAME COLUMN password TO hashed_password;')
        existing_col_names.append("hashed_password")
        existing_col_names.remove("password")
        fixes_applied.append("renamed password → hashed_password")
        print("  ✅ Done")

    # If 'password_hash' exists but 'hashed_password' doesn't → rename
    if "password_hash" in existing_col_names and "hashed_password" not in existing_col_names:
        print("\n  → Renaming 'password_hash' to 'hashed_password'...")
        cur.execute('ALTER TABLE users RENAME COLUMN password_hash TO hashed_password;')
        existing_col_names.append("hashed_password")
        existing_col_names.remove("password_hash")
        fixes_applied.append("renamed password_hash → hashed_password")
        print("  ✅ Done")

    # Add any missing columns
    print("\nChecking for missing columns...")
    for col_name, col_def in needed.items():
        if col_name not in existing_col_names:
            print(f"  → Adding missing column: {col_name} {col_def}")
            cur.execute(f'ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_def};')
            fixes_applied.append(f"added column {col_name}")
            print(f"  ✅ Added {col_name}")
        else:
            print(f"  ✓  {col_name} already exists")

    conn.commit()
    print(f"\n✅ Schema fix complete. Changes made: {len(fixes_applied)}")
    for f in fixes_applied:
        print(f"   • {f}")

    # ── Now verify Flask ORM works ──────────────────────────────────────────
    cur.close()
    conn.close()

    print("\n--- Testing Flask ORM after fix ---")
    from app import create_app
    from app.models import User, Group, Poll, Event, Incident
    app = create_app()
    with app.app_context():
        uc = User.query.count()
        gc = Group.query.count()
        print(f"✅ Users:  {uc}")
        print(f"✅ Groups: {gc}")
        if uc > 0:
            for u in User.query.all():
                print(f"   • {u.name} ({u.email}) role={u.role}")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    try:
        conn.rollback()
    except: pass
    sys.exit(1)
