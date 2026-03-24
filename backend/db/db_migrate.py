"""
db_migrate.py — Comprehensive schema alignment for Campus Hive Supabase DB.

This script:
1. Detects actual column names in the `users` table
2. Renames password-related columns to `hashed_password`
3. Adds all missing columns required by the SQLAlchemy model
4. Fixes enum type case (uppercase → lowercase)
5. Verifies the fix by running Flask ORM queries
6. Saves full output to db_migrate_output.txt

Run: venv\Scripts\python.exe db_migrate.py
"""
import os, sys, traceback
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

output = []
def log(msg=""):
    output.append(str(msg))
    print(msg)

def save():
    open("db_migrate_output.txt", "w", encoding="utf-8").write("\n".join(output))

try:
    import psycopg2
    log("Connecting to Supabase...")
    conn = psycopg2.connect(DATABASE_URL, sslmode="require", connect_timeout=15)
    conn.autocommit = False
    cur = conn.cursor()
    log("Connected.\n")

    # ── STEP 1: Inspect `users` actual columns ─────────────────────────────
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name='users'
        ORDER BY ordinal_position;
    """)
    existing_cols = {row[0]: row[1] for row in cur.fetchall()}
    log("Current `users` columns:")
    for c, t in existing_cols.items():
        log(f"  {c:<28} {t}")

    # ── STEP 2: Rename password column to hashed_password ──────────────────
    for old_name in ["password", "password_hash"]:
        if old_name in existing_cols and "hashed_password" not in existing_cols:
            log(f"\nRenaming '{old_name}' → 'hashed_password'...")
            cur.execute(f'ALTER TABLE users RENAME COLUMN "{old_name}" TO hashed_password;')
            existing_cols["hashed_password"] = existing_cols.pop(old_name)
            log("Done.")

    # ── STEP 3: Add all missing columns ────────────────────────────────────
    needed_cols = {
        "hashed_password": "VARCHAR(255) NOT NULL DEFAULT 'legacy_hash'",
        "avatar":          "VARCHAR(100) DEFAULT '👤'",
        "role":            "VARCHAR(20)  DEFAULT 'student'",
        "branch":          "VARCHAR(100)",
        "section":         "VARCHAR(50)",
        "year":            "INTEGER",
        "tags":            "TEXT[]",
        "vibe_score":      "INTEGER DEFAULT 0",
        "is_active":       "BOOLEAN DEFAULT TRUE",
        "updated_at":      "TIMESTAMPTZ",
        "name":            "VARCHAR(255) DEFAULT 'Unknown'",
        "email":           "VARCHAR(255)",
        "created_at":      "TIMESTAMPTZ DEFAULT NOW()",
    }
    log("\nChecking / adding missing columns...")
    for col, col_def in needed_cols.items():
        if col not in existing_cols:
            log(f"  + Adding: {col} {col_def}")
            cur.execute(f'ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {col_def};')
        else:
            log(f"  ✓ exists: {col}")

    # ── STEP 4: Fix enum values (uppercase → lowercase) ────────────────────
    # Check if the 'userrole' enum exists and its values
    cur.execute("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid=pg_type.oid WHERE pg_type.typname='userrole';")
    enum_vals = [r[0] for r in cur.fetchall()]
    log(f"\n'userrole' enum values: {enum_vals}")

    uppercase_vals = [v for v in enum_vals if v != v.lower()]
    if uppercase_vals:
        log(f"Fixing uppercase enum values: {uppercase_vals}")
        # We need to: alter the role column to text, drop old enum, recreate with lowercase, alter back
        cur.execute("ALTER TABLE users ALTER COLUMN role TYPE TEXT USING LOWER(role::TEXT);")
        
        # Check if any other tables use this enum
        cur.execute("DROP TYPE IF EXISTS userrole CASCADE;")
        cur.execute("CREATE TYPE userrole AS ENUM ('student', 'admin', 'faculty');")
        cur.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole;")
        log("✅ Fixed userrole enum to lowercase values")

    # Fix other enums similarly
    for enum_name, values in [
        ("grouptype",     ["section", "club", "squad", "committee"]),
        ("privacy",       ["public", "private"]),
        ("taskstatus",    ["todo", "inprogress", "done"]),
        ("priority",      ["low", "medium", "high"]),
        ("severity",      ["yellow", "orange", "red"]),
        ("incidentstatus",["pending", "investigating", "resolved"]),
    ]:
        cur.execute(f"SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid=pg_type.oid WHERE pg_type.typname='{enum_name}';")
        ev = [r[0] for r in cur.fetchall()]
        if any(v != v.lower() for v in ev if v):
            log(f"Fixing {enum_name} enum: {ev}")
            # Find which table/column uses this enum
            cur.execute(f"""
                SELECT c.table_name, c.column_name FROM information_schema.columns c
                WHERE c.udt_name='{enum_name}' AND c.table_schema='public';
            """)
            usages = cur.fetchall()
            for table, col in usages:
                cur.execute(f'ALTER TABLE "{table}" ALTER COLUMN "{col}" TYPE TEXT USING LOWER("{col}"::TEXT);')
            cur.execute(f"DROP TYPE IF EXISTS {enum_name} CASCADE;")
            vals_str = ", ".join(f"'{v}'" for v in values)
            cur.execute(f"CREATE TYPE {enum_name} AS ENUM ({vals_str});")
            for table, col in usages:
                cur.execute(f'ALTER TABLE "{table}" ALTER COLUMN "{col}" TYPE {enum_name} USING "{col}"::{enum_name};')
            log(f"✅ Fixed {enum_name}")
        else:
            log(f"  ✓ {enum_name} values OK: {ev}")

    conn.commit()
    log("\n✅ All schema fixes committed to Supabase!\n")
    cur.close()
    conn.close()

    # ── STEP 5: Verify via Flask ORM ───────────────────────────────────────
    log("Testing Flask ORM...")
    from app import create_app
    from app.models import User, Group, Poll, Event, Incident
    app = create_app()
    with app.app_context():
        try:
            uc = User.query.count()
            gc = Group.query.count()
            pc = Poll.query.count()
            ec = Event.query.count()
            log(f"\n✅ Flask ORM OK!")
            log(f"   Users:    {uc}")
            log(f"   Groups:   {gc}")
            log(f"   Polls:    {pc}")
            log(f"   Events:   {ec}")
            if uc > 0:
                log("\nAll registered users:")
                for u in User.query.all():
                    log(f"   {u.id:>3}. {u.name:<25} {u.email:<35} role={u.role}")
        except Exception as orm_err:
            log(f"❌ Flask ORM still failing: {orm_err}")
            log(traceback.format_exc())

except Exception as e:
    log(f"\n❌ Script error: {e}")
    log(traceback.format_exc())
    try:
        conn.rollback()
    except: pass

finally:
    save()
    log("\nFull output saved to db_migrate_output.txt")
