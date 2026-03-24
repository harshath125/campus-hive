# 🗄️ Supabase Database Guide — Campus Hive

## Your Project Details

| Setting | Value |
|---------|-------|
| **Project Reference** | `boxpatdnkenkbfpnffqk` |
| **Host** | `db.boxpatdnkenkbfpnffqk.supabase.co` |
| **Port** | `5432` |
| **Database** | `postgres` |
| **User** | `postgres` |
| **Dashboard** | https://supabase.com/dashboard/project/boxpatdnkenkbfpnffqk |

> ⚠️ Password is in your `.env` file — **never commit `.env` to GitHub**.

---

## 1 · Viewing Data in Supabase Dashboard

### Step-by-step → Table Editor

1. Go to **https://supabase.com/dashboard/project/boxpatdnkenkbfpnffqk/editor**
2. In the left sidebar click **Table Editor**
3. Select any table from the list on the left

### Tables created by the Flask backend

| Table | What's inside |
|-------|--------------|
| `users` | All registered students — name, email, branch, section, year, tags, role |
| `groups` | Spaces/clubs — name, type (section/club/squad/committee), privacy (public/private) |
| `polls` | Polls linked to a group — question, total_votes, ai_insight |
| `poll_options` | Answer options per poll — text, vote count |
| `votes` | Who voted on what — user_id, option_id, reason text |
| `events` | Events linked to a group — title, date, budget, attendee_count |
| `event_tasks` | Kanban tasks per event — title, status (todo/inprogress/done), priority |
| `incidents` | Anonymous safety reports — NO user_id (true anonymity), severity, description |

### How to browse rows:
- Click a table → all rows appear in a spreadsheet view
- Use the **Search** bar (top-right) to filter
- Click any row to see all its columns
- Use columns headers to sort ascending/descending

---

## 2 · SQL Editor — Direct Queries

Go to: **https://supabase.com/dashboard/project/boxpatdnkenkbfpnffqk/sql/new**

### View all users
```sql
SELECT id, name, email, role, branch, section, year, is_active, created_at
FROM users
ORDER BY created_at DESC;
```

### View users with their tags
```sql
SELECT name, email, branch, tags
FROM users
WHERE tags IS NOT NULL
ORDER BY name;
```

### View all groups/spaces
```sql
SELECT id, name, type, privacy, member_count, admin_id, created_at
FROM groups
ORDER BY created_at DESC;
```

### View all polls with their space name
```sql
SELECT 
    p.id,
    p.question,
    g.name AS space_name,
    p.total_votes,
    p.created_at
FROM polls p
LEFT JOIN groups g ON g.id = p.group_id
ORDER BY p.created_at DESC;
```

### View poll options and vote counts
```sql
SELECT 
    po.text AS option,
    po.votes,
    p.question
FROM poll_options po
JOIN polls p ON p.id = po.poll_id
ORDER BY p.id, po.votes DESC;
```

### View all votes with reason text
```sql
SELECT 
    u.name AS voter,
    p.question,
    po.text AS chosen_option,
    v.reason,
    v.created_at
FROM votes v
JOIN users u ON u.id = v.user_id
JOIN polls p ON p.id = v.poll_id
JOIN poll_options po ON po.id = v.option_id
ORDER BY v.created_at DESC;
```

### View events with their tasks
```sql
SELECT 
    e.title AS event,
    g.name AS space,
    et.title AS task,
    et.status,
    et.priority
FROM events e
JOIN groups g ON g.id = e.group_id
LEFT JOIN event_tasks et ON et.event_id = e.id
ORDER BY e.created_at DESC, et.priority;
```

### View all anonymous safety reports
```sql
SELECT id, severity, description, status, created_at
FROM incidents
ORDER BY created_at DESC;
```

### Count users per branch
```sql
SELECT branch, COUNT(*) AS student_count
FROM users
WHERE role = 'student'
GROUP BY branch
ORDER BY student_count DESC;
```

---

## 3 · Current Seeded Data (Login Credentials)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@anits.edu.in | Admin@1234 |
| **Student** | priya@anits.edu.in | Student@123 |
| **Student** | rahul@anits.edu.in | Student@123 |

---

## 4 · Reset & Reseed (if schema gets corrupted)

Run this from the backend folder:

```bat
cd campus-hive\backend
venv\Scripts\python.exe db\db_reset_and_seed.py
```

This will:
- Drop all old Flask tables
- Recreate them with the correct schema
- Seed fresh admin + students + groups + polls + events

---

## 5 · Full Reset via Supabase SQL Editor

If you need a complete wipe (nuclear option):

```sql
-- Drop all Flask-managed tables (use SQL Editor)
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS poll_options CASCADE;
DROP TABLE IF EXISTS polls CASCADE;
DROP TABLE IF EXISTS event_tasks CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS userrole CASCADE;
DROP TYPE IF EXISTS grouptype CASCADE;
DROP TYPE IF EXISTS privacy CASCADE;
DROP TYPE IF EXISTS taskstatus CASCADE;
DROP TYPE IF EXISTS priority CASCADE;
DROP TYPE IF EXISTS severity CASCADE;
DROP TYPE IF EXISTS incidentstatus CASCADE;
```

Then restart the Flask backend — it will recreate all tables automatically.

---

## 6 · Check DB Connection Locally

```bat
cd campus-hive\backend
venv\Scripts\python.exe db\db_check2.py
```

Output is saved to `backend/db_check_output.txt` — open it to see table row counts.

---

## 7 · GitHub Push — Protect Credentials

Before pushing, verify `.gitignore` contains:

```
campus-hive/backend/.env
campus-hive/backend/venv/
campus-hive/backend/__pycache__/
campus-hive/backend/*.pyc
campus-hive/frontend/node_modules/
campus-hive/backend/db_*output.txt
```

Create a safe `.env.example` (no real values):
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
SECRET_KEY=change-this-in-production
GEMINI_API_KEY=your-api-key-here
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000
CORS_ORIGINS=http://localhost:3000
```
