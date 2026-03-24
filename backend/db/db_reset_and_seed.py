"""
db_reset_and_seed.py — Complete schema reset for Campus Hive.

This drops all old Flask-managed tables, lets SQLAlchemy recreate them
with the CORRECT schema, then seeds sample data (admin user + groups + polls).

IMPORTANT: This will CLEAR all existing data in the Flask tables.
           The old tables (spaces, tasks, resources, safety_alerts, space_members)
           that belong to the OLD schema are left untouched.

Run: venv\Scripts\python.exe db_reset_and_seed.py
"""
import os, sys, traceback
from dotenv import load_dotenv

load_dotenv()

lines = []
def log(msg=""):
    lines.append(str(msg))
    print(msg)

def save():
    open("db_reset_output.txt", "w", encoding="utf-8").write("\n".join(lines))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    log("ERROR: DATABASE_URL not set in .env")
    save(); sys.exit(1)

try:
    import psycopg2
    conn = psycopg2.connect(DATABASE_URL, sslmode="require", connect_timeout=15)
    conn.autocommit = True
    cur = conn.cursor()
    log("Connected to Supabase.\n")

    # ── STEP 1: Drop old Flask-managed tables (wrong schema) ───────────────
    # These are the tables created by Flask ORM that have wrong column names
    # We drop them in the right order (FK constraints)
    drop_order = [
        "votes", "poll_options", "polls",
        "event_tasks", "events",
        "groups",
        "incidents",
        "users",
    ]
    log("Dropping old Flask tables with wrong schema...")
    for table in drop_order:
        cur.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE;')
        log(f"  Dropped: {table}")
    log()

    # Drop old enum types so SQLAlchemy can recreate them cleanly
    log("Dropping old enum types...")
    for enum_name in ["userrole", "grouptype", "privacy", "taskstatus",
                      "priority", "severity", "incidentstatus"]:
        cur.execute(f"DROP TYPE IF EXISTS {enum_name} CASCADE;")
        log(f"  Dropped enum: {enum_name}")
    log()

    cur.close()
    conn.close()

    # ── STEP 2: Let SQLAlchemy recreate all tables correctly ───────────────
    log("Running db.create_all() via Flask app context...")
    from app import create_app
    from app.extensions import db
    from app.models import User, Group, Poll, PollOption, Vote, Event, EventTask, Incident
    from app.security import hash_password, create_user_token

    app = create_app()
    with app.app_context():
        db.create_all()
        log("Tables created by SQLAlchemy:\n")

        # Verify by checking SQLAlchemy can query
        uc = User.query.count()
        gc = Group.query.count()
        log(f"  Users:  {uc} (fresh)")
        log(f"  Groups: {gc} (fresh)")

        # ── STEP 3: Seed sample data ───────────────────────────────────────
        log("\nSeeding data...\n")

        # Admin user
        admin = User(
            email="admin@anits.edu.in",
            hashed_password=hash_password("Admin@1234"),
            name="ANITS Admin",
            role="admin",
            branch="CSE",
            section="ADMIN",
            year=None,
            tags=[],
            avatar="🛡️",
            is_active=True,
        )
        db.session.add(admin)
        db.session.flush()
        log(f"  Created admin: {admin.email}")

        # Sample student
        student = User(
            email="priya@anits.edu.in",
            hashed_password=hash_password("Student@123"),
            name="Priya Sharma",
            role="student",
            branch="CSE",
            section="3-A",
            year=3,
            tags=["Python", "AI/ML", "Hackathons"],
            avatar="🌟",
            is_active=True,
        )
        db.session.add(student)

        student2 = User(
            email="rahul@anits.edu.in",
            hashed_password=hash_password("Student@123"),
            name="Rahul Verma",
            role="student",
            branch="ECE",
            section="2-B",
            year=2,
            tags=["DSA", "Web Dev", "Cloud"],
            avatar="🚀",
            is_active=True,
        )
        db.session.add(student2)
        db.session.flush()
        log(f"  Created students: {student.email}, {student2.email}")

        # Sample groups
        cse_group = Group(
            name="CSE 3-A",
            type="section",
            privacy="private",
            description="Class space for CSE 3rd Year Section A",
            icon="📚",
            color="violet",
            admin_id=admin.id,
            member_count=45,
        )
        db.session.add(cse_group)

        ai_club = Group(
            name="AI & ML Club",
            type="club",
            privacy="public",
            description="For students passionate about Artificial Intelligence and Machine Learning",
            icon="🤖",
            color="amber",
            admin_id=student.id,
            member_count=32,
        )
        db.session.add(ai_club)

        fest_club = Group(
            name="Fest Committee 2026",
            type="committee",
            privacy="private",
            description="Annual college fest planning and coordination committee",
            icon="🎉",
            color="emerald",
            admin_id=admin.id,
            member_count=18,
        )
        db.session.add(fest_club)
        db.session.flush()
        log(f"  Created groups: {cse_group.name}, {ai_club.name}, {fest_club.name}")

        # Sample poll
        poll1 = Poll(
            group_id=ai_club.id,
            question="Which Python framework do you prefer for ML projects?",
            created_by=student.id,
            total_votes=0,
            ai_insight=None,
        )
        db.session.add(poll1)
        db.session.flush()

        for opt_text in ["PyTorch", "TensorFlow", "Keras", "scikit-learn"]:
            db.session.add(PollOption(poll_id=poll1.id, text=opt_text, votes=0))

        poll2 = Poll(
            group_id=cse_group.id,
            question="Preferred exam schedule for mid-semesters?",
            created_by=admin.id,
            total_votes=0,
        )
        db.session.add(poll2)
        db.session.flush()

        for opt_text in ["9 AM - 12 PM", "2 PM - 5 PM", "Morning batch", "Evening batch"]:
            db.session.add(PollOption(poll_id=poll2.id, text=opt_text, votes=0))

        log(f"  Created 2 polls with options")

        # Sample event
        from datetime import datetime, timedelta
        event1 = Event(
            group_id=fest_club.id,
            title="Annual Hackathon 2026",
            description="36-hour campus hackathon - all branches welcome",
            date=datetime.now() + timedelta(days=21),
            budget=50000,
            attendee_count=200,
        )
        db.session.add(event1)
        db.session.flush()

        for task_data in [
            ("Confirm venue booking", "inprogress", "high"),
            ("Design event poster", "todo", "medium"),
            ("Contact sponsors", "inprogress", "high"),
            ("Set up registration portal", "todo", "high"),
            ("Arrange refreshments", "todo", "low"),
            ("Judge coordination", "todo", "medium"),
        ]:
            db.session.add(EventTask(
                event_id=event1.id,
                title=task_data[0],
                status=task_data[1],
                priority=task_data[2],
            ))
        log(f"  Created event '{event1.title}' with 6 tasks")

        # Sample incident
        incident1 = Incident(
            severity="yellow",
            description="Sample anonymous report - testing anonymity system. No real incident.",
            location="Library",
            status="pending",
        )
        db.session.add(incident1)

        db.session.commit()
        log("\n✅ All seed data committed!\n")

        # Final counts
        log("Final row counts:")
        log(f"  Users:     {User.query.count()}")
        log(f"  Groups:    {Group.query.count()}")
        log(f"  Polls:     {Poll.query.count()}")
        log(f"  Options:   {PollOption.query.count()}")
        log(f"  Events:    {Event.query.count()}")
        log(f"  Tasks:     {EventTask.query.count()}")
        log(f"  Incidents: {Incident.query.count()}")

        log("\n📋 Login credentials for testing:")
        log("  Admin:   admin@anits.edu.in  / Admin@1234")
        log("  Student: priya@anits.edu.in  / Student@123")
        log("  Student: rahul@anits.edu.in  / Student@123")

except Exception as e:
    log(f"\n❌ Error: {e}")
    log(traceback.format_exc())

finally:
    save()
    log("\nOutput saved to db_reset_output.txt")
