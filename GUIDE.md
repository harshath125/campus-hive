# 🐝 Campus Hive — Complete Guide

> Step-by-step guide for setup, features, database, deployment, and maintenance.

---

## 📋 Table of Contents

1. [Quick Start (Local)](#1-quick-start-local)
2. [Project Structure](#2-project-structure)
3. [All Features](#3-all-features)
4. [Database & Data Viewing](#4-database--data-viewing)
5. [Authentication](#5-authentication)
6. [AI Features (AI)](#6-ai-features-ai)
7. [Docker Deployment](#7-docker-deployment)
8. [AWS EC2 Deployment (Free Tier)](#8-aws-ec2-deployment-free-tier)
9. [Admin Panel](#9-admin-panel)
10. [API Reference](#10-api-reference)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Quick Start (Local)

### What You Need

- Python 3.10+ → [python.org](https://python.org)
- Node.js 18+ → [nodejs.org](https://nodejs.org)
- DB Browser for SQLite → [sqlitebrowser.org](https://sqlitebrowser.org) (to view data)

### Backend Setup

```powershell
cd campus-hive\backend

# Create virtual environment (first time only)
python -m venv venv

# Activate it
.\venv\Scripts\activate

# Install packages
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create admin user (first time only)
python manage.py createsuperuser

# Seed sample data (optional)
python seed_data.py

# Start backend
python manage.py runserver 8000
```

**Backend runs at:** http://localhost:8000
**Admin panel at:** http://localhost:8000/admin

### Frontend Setup

```powershell
cd campus-hive\frontend

# Install packages
npm install

# Start dev server
npm run dev
```

**Frontend runs at:** http://localhost:5173

### Both Running Together

Open 2 terminals. Terminal 1 runs backend, Terminal 2 runs frontend. That's it!

---

## 2. Project Structure

```
campus-hive/
├── backend/
│   ├── campus_hive/          # Django project settings
│   │   ├── settings.py       # Database, middleware, CORS config
│   │   ├── urls.py           # Root URL config (includes /api/ and /admin/)
│   │   └── wsgi.py           # WSGI entry point
│   ├── core/                 # Main app
│   │   ├── models.py         # All database models (User, Group, Poll, Event, etc.)
│   │   ├── admin.py          # Django admin registrations
│   │   ├── urls.py           # All API route definitions
│   │   ├── views/            # API endpoint handlers
│   │   │   ├── auth_views.py     # Login, signup, profile
│   │   │   ├── group_views.py    # Spaces/groups CRUD + join/leave
│   │   │   ├── poll_views.py     # Polls + voting + AI insight
│   │   │   ├── event_views.py    # Events + Kanban tasks
│   │   │   ├── vibe_views.py     # Vibe matcher + requests + AI endpoints
│   │   │   ├── incident_views.py # Safety reports
│   │   │   └── admin_views.py    # Admin dashboard API
│   │   └── utils/
│   │       ├── ai_utils.py   # AI integration
│   │       └── vibe_algorithm.py # TF-IDF matching algorithm
│   ├── db.sqlite3            # ← YOUR DATABASE FILE
│   ├── manage.py
│   ├── requirements.txt
│   ├── seed_data.py
│   └── .env                  # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Routes, auth context, state management
│   │   ├── api.ts            # All API call functions
│   │   ├── pages/
│   │   │   ├── Landing.tsx       # Home page
│   │   │   ├── Login.tsx         # Student login
│   │   │   ├── Signup.tsx        # Student registration
│   │   │   ├── Dashboard.tsx     # Main layout + sidebar + notifications
│   │   │   ├── VibeMatcher.tsx   # ML matching + send/accept requests
│   │   │   ├── ConnectionPool.tsx # Accepted connections + chat + ideas
│   │   │   ├── SmartPolls.tsx    # Polls + AI insights
│   │   │   ├── EventPlanner.tsx  # Events + AI task generation + Kanban
│   │   │   ├── Spaces.tsx        # Groups/clubs + members tab
│   │   │   ├── Safety.tsx        # Anonymous incident reporting
│   │   │   ├── Resources.tsx     # Resource sharing
│   │   │   ├── AdminLogin.tsx    # Admin login
│   │   │   └── AdminPanel.tsx    # Admin dashboard
│   │   └── index.css         # Global styles
│   └── package.json
├── Dockerfile                # Full-stack Docker build
├── docker-compose.yml        # Docker Compose config
├── nginx.conf                # Nginx config for production
└── GUIDE.md                  # ← THIS FILE
```

---

## 3. All Features

### 🔮 Vibe Matcher
- ML-powered student matching using TF-IDF + Cosine Similarity
- Multi-factor scoring: tags, branch, year, section
- **Send/Accept/Decline** vibe connection requests
- Real-time status: "Request Sent" / "Connected"
- AI-generated compatibility insights (AI)

### 💜 Connection Pool (NEW)
- Accepted vibe matches appear here as connections
- **Private chat** with each connection
- **Shared spaces** view — spaces you both belong to
- **Ideas board** — collaboration suggestions (hackathon team, study group, etc.)

### 📊 Smart Polls
- Create polls inside any joined space
- Vote with mandatory reasoning (min 10 chars)
- **AI Insight** button — calls AI to analyze voting reasons
- Works even before anyone votes (predictive insight)
- "AI" badge on AI-generated insights

### 📅 Event Planner + AI Task Generation
- Plan events inside spaces with title, date, budget, attendees
- **AI generates custom Kanban tasks** based on your event description
- More detail in description = better AI tasks
- Shows "AI-Generated Tasks" badge + Bot icon on each task
- Falls back to smart default tasks if AI is unavailable
- Kanban board with To Do / In Progress / Done columns
- Tasks show priority badges (high/medium/low)

### 🌐 Spaces (Full-Screen View)
- Create Public/Private/Mandatory spaces (clubs, study groups, committees)
- **Members tab** — see all members with names, avatars, join dates, admin badge
- Polls and Events tabs per space
- Full-screen modal (no more small box!)
- Admin can approve/reject join requests

### 🛡️ Safety Shield
- Anonymous incident reporting (no login required)
- Severity levels: Yellow/Orange/Red
- Reports visible in Django admin panel
- Activity log tracks all reports

### 📚 Resources
- Share and browse resources/links
- Like functionality
- Comments removed (was non-functional)

### 🔔 Notifications
- Bell icon shows badge count
- Incoming vibe match requests with Accept/Decline inline
- Announcements from admin

### 🛠️ Admin Dashboard
- User management (view, edit, deactivate, delete)
- Activity logs with full audit trail
- Incident management with status updates
- CSV user import
- Announcements and resource management
- Database health check

---

## 4. Database & Data Viewing

### Where Is The Database?

```
campus-hive/backend/db.sqlite3
```

This ONE file contains ALL your data. It's a SQLite database.

### View Data: DB Browser for SQLite

1. Download from [sqlitebrowser.org](https://sqlitebrowser.org)
2. Open → File → Open Database → select `db.sqlite3`
3. Click **Browse Data** tab
4. Select table from dropdown:

| Table | Contents |
|---|---|
| `ch_users` | All students and admins |
| `ch_groups` | Spaces/clubs/hubs |
| `ch_group_members` | Who joined which space + status |
| `ch_polls` | All polls |
| `ch_poll_options` | Poll choices |
| `ch_votes` | Votes with reasons |
| `ch_events` | Campus events |
| `ch_event_tasks` | Kanban tasks |
| `ch_incidents` | Safety reports |
| `ch_activity_logs` | Full audit trail |
| `ch_announcements` | Admin notifications |
| `ch_resources` | Shared links |
| `ch_vibe_requests` | Vibe match requests (pending/accepted/declined) |

### View Data: Django Admin (Web)

Go to http://localhost:8000/admin → Login with superuser credentials.

### View Data: Command Line

```powershell
cd campus-hive\backend
.\venv\Scripts\activate
python manage.py shell

# Example queries
from core.models import User
User.objects.count()                    # Total users
User.objects.filter(role="admin").count()  # Total admins

from core.models import VibeRequest
VibeRequest.objects.filter(status="accepted").count()  # Connections
```

### Backup Database

```powershell
copy campus-hive\backend\db.sqlite3 campus-hive\backend\db_backup.sqlite3
```

---

## 5. Authentication

### How It Works

```
Student → /login → email + password → Backend validates →
JWT token created (24hr) → Stored in browser localStorage →
Sent with every API request as: Authorization: Bearer <token>
```

### Key Settings (.env)

```
SECRET_KEY=campus-hive-super-secret-jwt-key-2024-change-in-prod
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRES_HOURS=24
```

### Creating Admin Users

```powershell
.\venv\Scripts\activate
python manage.py createsuperuser
# Enter email, username, password
```

Or in Django Admin → Users → Add User → Set `is_staff=True`, `is_superuser=True`

---

## 6. AI Features (AI)

### API Key

Set in `.env`:
```
AI_API_KEY=AIzaSyAC3BI2WFqTFUmtBoaNR4ogy-d4OVH4o2c
```

### What AI Does

| Feature | How It Works |
|---|---|
| **Poll AI Insight** | Analyzes voting reasons → 3 bullet-point summary. Works even before votes (predictive). |
| **Event Task Generation** | Takes event description → generates 5-8 custom Kanban tasks with priorities. |
| **Vibe Match Insight** | Generates a fun compatibility sentence based on shared interests. |

### Testing AI

1. Create a poll → Click "AI Insight" button → Should show AI response
2. Create an event with detailed description → Tasks should be AI-generated with 🤖 icon
3. Run vibe matcher → Match insights should be contextual

### If AI Doesn't Work

- Check `AI_API_KEY` is set in `.env`
- Check `google-generativeai` is installed: `pip install google-generativeai`
- The app falls back gracefully — default tasks and insights are used

---

## 7. Docker Deployment

### Prerequisites

- Docker + Docker Compose installed

### Steps

```bash
cd campus-hive

# Build frontend first (needed for nginx)
cd frontend && npm install && npm run build && cd ..

# Build and start
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Access:**
- Frontend: http://localhost (port 80)
- Backend API: http://localhost/api/
- Admin Panel: http://localhost/admin/

### Stop / Restart

```bash
docker-compose down        # Stop
docker-compose up -d       # Start again
docker-compose restart     # Restart
```

---

## 8. AWS EC2 Deployment (Free Tier)

### Step 1: Launch EC2

1. Go to [AWS Console](https://console.aws.amazon.com) → EC2
2. Click **Launch Instance**
3. Settings:
   - **Name:** Campus-Hive
   - **AMI:** Ubuntu Server 22.04 LTS (Free Tier)
   - **Instance Type:** t2.micro (Free Tier)
   - **Key Pair:** Create new → Download `.pem` file
   - **Storage:** 8 GB gp3

### Step 2: Security Group

Add these inbound rules:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | My IP |
| HTTP | 80 | 0.0.0.0/0 |
| Custom TCP | 8000 | 0.0.0.0/0 |

### Step 3: Connect (MobaXterm)

- Remote Host: (your EC2 Public IP)
- Username: ubuntu
- Private key: your `.pem` file

### Step 4: Install Everything

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nginx git
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 5: Clone & Setup Backend

```bash
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/campus-hive.git
cd campus-hive/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Create .env
cat > .env << 'EOF'
SECRET_KEY=your-random-64-char-key-here
DJANGO_DEBUG=False
AI_API_KEY=AIzaSyAC3BI2WFqTFUmtBoaNR4ogy-d4OVH4o2c
CORS_ORIGINS=http://YOUR_EC2_IP
EOF

python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

### Step 6: Build Frontend

```bash
cd /home/ubuntu/campus-hive/frontend
echo "VITE_API_URL=http://YOUR_EC2_IP/api" > .env
npm install
npm run build
```

### Step 7: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/campus-hive
```

Paste:
```nginx
server {
    listen 80;
    server_name _;

    root /home/ubuntu/campus-hive/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
        alias /home/ubuntu/campus-hive/backend/staticfiles/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/campus-hive /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

### Step 8: Create Backend Service

```bash
sudo nano /etc/systemd/system/campus-hive.service
```

Paste:
```ini
[Unit]
Description=Campus Hive Backend
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/campus-hive/backend
ExecStart=/home/ubuntu/campus-hive/backend/venv/bin/gunicorn campus_hive.wsgi:application --bind 127.0.0.1:8000 --workers 2
Restart=always
Environment="DJANGO_SETTINGS_MODULE=campus_hive.settings"

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable campus-hive
sudo systemctl start campus-hive
sudo systemctl status campus-hive
```

### Step 9: Verify

- http://YOUR_EC2_IP → Frontend
- http://YOUR_EC2_IP/admin → Django Admin
- Register account → Test features

### Step 10: Update Script

```bash
cat > /home/ubuntu/update.sh << 'EOF'
#!/bin/bash
cd /home/ubuntu/campus-hive
git pull origin main
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
cd ../frontend
npm install && npm run build
sudo systemctl restart campus-hive
sudo systemctl restart nginx
echo "✅ Updated!"
EOF
chmod +x /home/ubuntu/update.sh
```

Run `./update.sh` after every `git push`.

---

## 9. Admin Panel

### Access

- **Local:** http://localhost:8000/admin
- **EC2:** http://YOUR_EC2_IP/admin

### What You Can Manage

| Section | Actions |
|---|---|
| Users | View, edit, deactivate, delete users |
| Groups | Create/manage spaces, see member counts |
| Group Members | Approve or reject join requests |
| Polls | Manage polls and options |
| Events | Manage events and tasks |
| Incidents | View safety reports, update status |
| Vibe Requests | See all match requests, change status |
| Activity Logs | Full audit trail of all user actions |
| Announcements | Post notifications to student bell icon |
| Resources | Manage shared links |

---

## 10. API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me/update` | Update profile |

### Vibe Matcher
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/vibe/matches` | Get ML-ranked matches |
| POST | `/api/vibe/request` | Send connection request |
| GET | `/api/vibe/requests` | Get incoming/outgoing/connections |
| POST | `/api/vibe/requests/{id}/respond` | Accept or decline |

### AI Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/generate-tasks` | AI generates event tasks |
| POST | `/api/ai/poll-insight` | AI generates poll insight |

### Groups/Spaces
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/groups/` | List all groups |
| POST | `/api/groups/create` | Create new group |
| POST | `/api/groups/{id}/join` | Join or request to join |
| GET | `/api/groups/{id}/members` | List members |

### Polls
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/polls/` | Create poll |
| GET | `/api/polls/group/{id}` | List polls in group |
| POST | `/api/polls/{id}/vote` | Vote with reason |

### Events
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/events/` | Create event |
| GET | `/api/events/group/{id}` | List events in group |
| POST | `/api/events/{id}/tasks` | Add task to event |
| PATCH | `/api/events/tasks/{id}` | Update task status |

### Incidents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/incidents/report` | Report incident (no auth) |
| GET | `/api/incidents/` | List all (auth required) |

---

## 11. Troubleshooting

| Problem | Solution |
|---|---|
| Backend won't start | Check `.\venv\Scripts\activate` is run first |
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| Frontend blank page | Run `npm run build`, check console errors |
| "502 Bad Gateway" on EC2 | Restart: `sudo systemctl restart campus-hive` |
| Admin login fails | Run `python manage.py createsuperuser` |
| AI not working | Check `AI_API_KEY` in `.env` |
| Database locked | Stop all Django processes, retry |
| Supabase warning | Normal — using SQLite fallback |
| Docker build fails | Check Docker is running, try `docker-compose build --no-cache` |

### Useful Commands

```powershell
# Check backend logs (EC2)
sudo journalctl -u campus-hive -n 50

# Restart services (EC2)
sudo systemctl restart campus-hive
sudo systemctl restart nginx

# Backup database
copy backend\db.sqlite3 backend\db_backup.sqlite3

# Django shell
.\venv\Scripts\activate
python manage.py shell
```

---

## Free Tier Limits

| Resource | Limit |
|---|---|
| EC2 t2.micro | 750 hrs/month (24/7 = ~730 hrs ✅) |
| EBS Storage | 30 GB |
| Data Transfer | 15 GB/month outbound |

> ⚠️ Running 1 t2.micro 24/7 fits free tier. Don't launch extra instances.

---

**Built with Django + React + TailwindCSS + AI**
