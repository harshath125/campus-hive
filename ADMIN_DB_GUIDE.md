# 🛡️ Admin Panel & Database Management Guide

> How the administrator manages Campus Hive through Django Admin Panel

---

## 1. Overview

Campus Hive uses **Django's Admin Panel** as the central administration interface. The admin can manage all users, spaces, polls, events, incidents, and view activity logs — all from a single web dashboard.

**URL**: `http://localhost:8000/admin/`  
**File**: [`backend/core/admin.py`](backend/core/admin.py)

### Admin Login
```
Email:    admin@campushive.com
Password: admin123
```

---

## 2. Database Tables (What the Admin Controls)

| Table Name | Admin Panel Name | What It Stores | Admin Can |
|------------|-----------------|----------------|-----------|
| `ch_users` | Users | All student & admin accounts | View, edit, activate/deactivate, change roles |
| `ch_groups` | Groups | Spaces/Hubs/Clubs | View, edit, delete groups |
| `ch_group_members` | Group Members | Who is in which group | Approve/reject join requests, change roles |
| `ch_polls` | Polls | All polls across spaces | View questions, see AI insights, view vote counts |
| `ch_poll_options` | Poll Options | Poll choices | View option text and vote counts |
| `ch_votes` | Votes | Individual votes + reasons | View who voted, what reason they gave |
| `ch_events` | Events | All events | View event details, budget, tasks |
| `ch_event_tasks` | Event Tasks | Kanban tasks for events | View/update task status and assignments |
| `ch_incidents` | Incidents | Anonymous safety reports | View, change severity/status, investigate |
| `ch_activity_log` | Activity Logs | All user actions | View-only (immutable audit trail) |
| `ch_announcements` | Announcements | Campus-wide announcements | Create, edit, activate/deactivate |
| `ch_resources` | Resources | Shared learning resources | Create, edit, delete |
| `ch_vibe_requests` | Vibe Requests | Connection requests between students | View, change status |

---

## 3. Admin Panel Features by Section

### 👤 Users Management

**What the admin sees:**

| Column | Type | Editable |
|--------|------|----------|
| Email | Text | ✅ |
| Name | Text | ✅ |
| Role | student/admin | ✅ |
| Branch | CSE/IT/ECE/etc | ✅ |
| Section | 3-A, 3-B, etc | ✅ |
| Year | 1-4 | ✅ |
| Vibe Score | Integer | ✅ |
| Is Active | Toggle | ✅ (inline) |
| Date Joined | DateTime | ❌ (read-only) |

**Admin Actions:**
- **Search** users by email, name, branch, section
- **Filter** by role (student/admin), is_active, branch, year
- **Deactivate** problematic accounts (toggle `is_active`)
- **Promote** a student to admin by changing `role` and setting `is_staff = True`
- **Create** new users with the "Add User" form

### 🏘️ Groups (Spaces) Management

**What the admin sees:**

| Column | Description |
|--------|-------------|
| Icon | Emoji icon of the space |
| Name | Group name |
| Type | club, study, committee, class, sports, hub |
| Privacy | public, private, mandatory |
| Member Count | Auto-calculated |
| Admin | Who created it |
| Created At | When it was made |

**Admin Actions:**
- View all groups and their settings
- Edit group type, privacy, description
- Delete groups that violate policies

### 👥 Group Members (Join Requests)

This is where the admin handles **join requests** for private spaces.

| Column | Editable |
|--------|----------|
| User | ❌ |
| Group | ❌ |
| Role | admin/member |
| **Status** | ✅ **pending → approved / rejected** |
| Joined At | ❌ |

**How to approve join requests:**
1. Filter by `Status = Pending`
2. Find the request
3. Change `Status` dropdown to `Approved`
4. Click **Save**

### 📊 Polls & Votes

**Poll Admin shows:**
- Question (truncated to 80 chars)
- Group it belongs to
- Total votes count
- **Has AI Insight** (✅/❌ boolean indicator)
- Inline view of all **Poll Options** with vote counts

**Vote Admin shows:**
- Who voted (user email)
- Which poll and option
- **Reason** (truncated to 60 chars) — this is what feeds the AI
- Timestamp

**Admin Actions:**
- View AI-generated insights (read-only `ai_insight` field)
- See complete voting breakdown
- Search votes by reason text or user email

### 📅 Events & Tasks

**Event Admin shows:**
- Event title, group, date, budget
- Attendee count
- **Task count** (inline calculated)
- Inline view of all **Event Tasks**

**Event Task Admin shows:**
- Task title, assigned to, status, priority
- Status is editable: `todo` → `inprogress` → `done`

### 🚨 Incidents (Anonymous Reports)

| Column | Editable |
|--------|----------|
| Severity | green / orange / red |
| Description | ❌ |
| Location | ❌ |
| **Status** | ✅ **open → investigating → resolved** |

**How to handle incidents:**
1. Sort by severity (red = urgent)
2. Review description and location
3. Change status: `open` → `investigating` → `resolved`
4. All actions are logged

> **Note:** All incidents are **anonymous** — no user information is attached.

### 📋 Activity Logs (Audit Trail)

**What's logged:**

| Action | What Triggers It |
|--------|-----------------|
| `login` | User logs in |
| `signup` | New account created |
| `create_group` | Space/hub created |
| `join_group` | User joins a space |
| `create_poll` | New poll created |
| `vote` | User votes on a poll |
| `create_event` | New event created |
| `update_task` | Task status changed |
| `create_incident` | Incident reported |

**Admin Actions:**
- **View-only** — Cannot add, edit, or delete logs
- Only superuser can delete logs
- Filter by action type and timestamp
- Search by user email or details

### 💌 Vibe Requests

| Column | Editable |
|--------|----------|
| From User | ❌ |
| To User | ❌ |
| **Status** | ✅ **pending / accepted / declined** |
| Score | ❌ |
| Created At | ❌ |

**Admin Actions:**
- View all vibe connection requests
- Manually change status if needed
- Filter by status (pending/accepted/declined)

---

## 4. Database Backup & Management

### SQLite (Local/Default)
```bash
# Backup
cp backend/db.sqlite3 backend/db_backup_$(date +%Y%m%d).sqlite3

# View tables
sqlite3 backend/db.sqlite3 ".tables"

# Count users
sqlite3 backend/db.sqlite3 "SELECT COUNT(*) FROM ch_users;"

# Count votes with reasons
sqlite3 backend/db.sqlite3 "SELECT COUNT(*) FROM ch_votes WHERE reason != '';"
```

### PostgreSQL (Supabase/Production)
```bash
# Check connection
python -c "import django; django.setup(); from django.db import connection; cursor=connection.cursor(); cursor.execute('SELECT 1'); print('Connected!')"

# Backup via Supabase Dashboard
# Go to: supabase.com → Project → Database → Backups
```

### Reset Database
```bash
# Delete SQLite and re-create
rm backend/db.sqlite3
cd backend
python manage.py migrate
python seed_data.py
```

---

## 5. Common Admin Tasks

### Add a New Admin User
```bash
cd backend
python manage.py createsuperuser
# Enter: email, name, password
```

### Check Database Engine (Supabase vs SQLite)
```bash
# Start the backend server — look for this in console output:
#   [OK] Connected to Supabase PostgreSQL
# or:
#   [WARN] Supabase unreachable - using local SQLite
```

### Re-seed Test Data
```bash
cd backend
python seed_data.py
# This clears old data and creates fresh 50 users + sample data
```

### View Poll AI Insights in Admin
1. Go to `/admin/`
2. Click **Polls**
3. Look for ✅ in the "Has AI Insight" column
4. Click the poll to see the full `ai_insight` text

---

## 6. Admin Panel Customization

The admin panel is customized in `backend/core/admin.py`:

```python
# Site branding
admin.site.site_header = "🐝 Campus Hive Administration"
admin.site.site_title = "Campus Hive Admin"
admin.site.index_title = "Dashboard — Manage Users, Spaces, Polls, Events & Logs"
```

### Key Features:
- **Inline editing** — Edit `is_active` and `status` directly from list views
- **Search** — Every model has searchable fields
- **Filters** — Sidebar filters for quick data filtering
- **Raw ID fields** — Efficient foreign key lookups for large datasets
- **Read-only fields** — Timestamps and logs cannot be edited
- **Permission controls** — Activity logs cannot be added/edited, only deleted by superuser

---

## 7. Key Points for Project Showcase

### What to Highlight:
1. **"Complete admin control panel — manage users, spaces, polls, events, incidents from one place"**
2. **"Every user action is logged with IP address for audit compliance"**
3. **"Anonymous incident reporting — admin sees the report but never who filed it"**
4. **"AI insights are visible in admin panel — you can verify what the AI summarized"**
5. **"Join request approval workflow — admin reviews and approves/rejects membership"**

### Live Demo Flow:
1. Open `/admin/` → Show the dashboard with all models
2. Click **Users** → Show 50+ student profiles with filters
3. Click **Polls** → Show a poll with AI Insight ✅
4. Click **Votes** → Show individual vote reasons
5. Click **Incidents** → Show anonymous reports, change status
6. Click **Activity Logs** → Show the full audit trail

---

*📁 Source: `backend/core/admin.py` (211 lines) | `backend/core/models.py` (519 lines)*
