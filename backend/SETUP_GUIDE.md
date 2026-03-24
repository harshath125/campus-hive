# 🐝 Campus Hive – Flask + Supabase + JWT Setup Guide

## Quick Start (3 Steps)

```bash
# 1. Navigate to backend
cd "campus-hive/backend"

# 2. Activate virtual environment (already created)
.\venv\Scripts\activate          # Windows
source venv/bin/activate         # Mac/Linux

# 3. Run the server
python run.py
```

Server starts at → **http://localhost:5000**

---

## Table of Contents
1. [Project Structure](#project-structure)
2. [Tech Stack](#tech-stack)
3. [Environment Configuration](#environment-configuration)
4. [First-Time Setup Guide](#first-time-setup-guide)
5. [API Reference](#api-reference)
6. [JWT Authentication Flow](#jwt-authentication-flow)
7. [Database (Supabase)](#database-supabase)
8. [Docker Deployment](#docker-deployment)
9. [GitHub Push Guide](#github-push-guide)
10. [API Testing Examples](#api-testing-examples)

---

## Project Structure

```
campus-hive/
├── backend/
│   ├── app/
│   │   ├── __init__.py          ← Flask App Factory
│   │   ├── config.py            ← Settings & .env loader
│   │   ├── extensions.py        ← db, jwt, bcrypt, cors
│   │   ├── models.py            ← SQLAlchemy ORM models
│   │   ├── security.py          ← JWT helpers & decorators
│   │   ├── routers/
│   │   │   ├── auth.py          ← /api/auth/* (signup, login, me)
│   │   │   ├── groups.py        ← /api/groups/* (CRUD hives)
│   │   │   ├── polls.py         ← /api/polls/* (smart polls + AI)
│   │   │   ├── events.py        ← /api/events/* (AI task planner)
│   │   │   ├── vibe.py          ← /api/vibe/* (Jaccard matching)
│   │   │   └── incidents.py     ← /api/incidents/* (anonymous)
│   │   └── utils/
│   │       ├── gemini_utils.py  ← Gemini AI integration
│   │       └── vibe_logic.py    ← Jaccard similarity math
│   ├── run.py                   ← Entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env                     ← Your secrets (never commit!)
└── docker-compose.yml
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Flask 3.0** |
| Database | **Supabase PostgreSQL** (cloud) |
| ORM | **Flask-SQLAlchemy 3.1** |
| Auth | **Flask-JWT-Extended 4.6** (HS256 JWT) |
| Passwords | **Flask-Bcrypt** (bcrypt hashing) |
| CORS | **Flask-CORS** |
| AI | **Google Gemini Pro** (`google-generativeai`) |
| Deployment | **Gunicorn + Docker** |

---

## Environment Configuration

The `.env` file in `backend/` already contains your credentials:

```env
DATABASE_URL=postgresql://postgres:9wZIiXmi9XzvmAKt@db.boxpatdnkenkbfpnffqk.supabase.co:5432/postgres
SECRET_KEY=campus-hive-super-secret-jwt-key-2024-change-in-prod
JWT_ACCESS_TOKEN_EXPIRES_HOURS=24
GEMINI_API_KEY=AIzaSyAC3BI2WFqTFUmtBoaNR4ogy-d4OVH4o2c
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

> ⚠️ **Never commit `.env` to Git!** It's already in `.gitignore`.

---

## First-Time Setup Guide

### Windows

```batch
REM Step 1: Navigate to backend
cd "C:\Users\harsh\OneDrive\Desktop\vibe project\campus-hive\backend"

REM Step 2: Create virtual environment (already done)
python -m venv venv

REM Step 3: Activate virtual environment
.\venv\Scripts\activate

REM Step 4: Install all dependencies
pip install Flask Flask-SQLAlchemy Flask-JWT-Extended Flask-Bcrypt Flask-CORS SQLAlchemy python-dotenv gunicorn marshmallow pydantic
pip install psycopg2-binary
pip install google-generativeai

REM Step 5: Run the server
python run.py
```

### Mac / Linux

```bash
cd "campus-hive/backend"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

### Expected Output

```
🐝 Campus Hive API starting on http://localhost:5000
   Debug mode: True
   Endpoints:
     POST /api/auth/signup
     POST /api/auth/login
     GET  /api/auth/me
     ---------------------------
     /api/groups    /api/polls
     /api/events    /api/vibe
     /api/incidents
```

> Tables are **auto-created** in Supabase PostgreSQL on first run via `db.create_all()`.

---

## API Reference

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login → returns JWT |
| GET | `/api/auth/me` | ✅ JWT | Get your profile |
| PUT | `/api/auth/me` | ✅ JWT | Update your profile |

### 👥 Groups (`/api/groups`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/groups/` | ❌ | List all groups |
| POST | `/api/groups/` | ✅ JWT | Create a group |
| GET | `/api/groups/<id>` | ❌ | Get group details |
| PUT | `/api/groups/<id>` | ✅ JWT | Update group (admin only) |
| DELETE | `/api/groups/<id>` | ✅ JWT | Delete group (admin only) |

### 📊 Polls (`/api/polls`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/polls/group/<id>` | ✅ JWT | List group polls |
| POST | `/api/polls/` | ✅ JWT | Create poll |
| GET | `/api/polls/<id>` | ✅ JWT | Get poll with options |
| POST | `/api/polls/<id>/vote` | ✅ JWT | Cast vote + AI insight |

### 📅 Events (`/api/events`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events/group/<id>` | ✅ JWT | List group events |
| POST | `/api/events/` | ✅ JWT | Create event (AI tasks optional) |
| GET | `/api/events/<id>` | ✅ JWT | Get event + tasks |
| POST | `/api/events/<id>/tasks` | ✅ JWT | Add a task manually |
| PATCH | `/api/events/tasks/<id>` | ✅ JWT | Update task status (Kanban) |

### 🔮 Vibe Matcher (`/api/vibe`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/vibe/matches` | ✅ JWT | Get top 5 vibe matches |
| GET | `/api/vibe/score` | ✅ JWT | Get your vibe score |
| POST | `/api/vibe/tags` | ✅ JWT | Update your interest tags |

### 🛡️ Safety Shield (`/api/incidents`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/incidents/report` | ❌ **NONE** | Anonymous incident report |
| GET | `/api/incidents/` | ✅ JWT | List incidents (admin) |
| PATCH | `/api/incidents/<id>/status` | ✅ JWT | Update status |

---

## JWT Authentication Flow

### How It Works

```
1. POST /api/auth/signup  →  { access_token: "eyJ..." }
2. POST /api/auth/login   →  { access_token: "eyJ..." }
3. All protected requests → Header: Authorization: Bearer eyJ...
4. Token expires in 24 hours (configurable in .env)
```

### Token Payload Structure

```json
{
  "sub": "1",            ← user ID (identity)
  "email": "student@uni.edu",
  "role": "student",
  "exp": 1735000000      ← unix timestamp expiry
}
```

### Using the Token in Requests

**curl:**
```bash
TOKEN="your-jwt-token-here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/auth/me
```

**Python:**
```python
import requests
headers = {"Authorization": f"Bearer {token}"}
r = requests.get("http://localhost:5000/api/auth/me", headers=headers)
```

**JavaScript:**
```javascript
const res = await fetch("http://localhost:5000/api/auth/me", {
  headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
});
```

---

## Database (Supabase)

### Connection Details

- **Host**: `db.boxpatdnkenkbfpnffqk.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **SSL**: Required (automatically configured)

### Tables Auto-Created on Startup

| Table | Description |
|-------|-------------|
| `users` | Students, admins, faculty |
| `groups` | Hives (clubs, squads, sections) |
| `polls` | Smart polls with AI insights |
| `poll_options` | Options for each poll |
| `votes` | User votes with reasons |
| `events` | Campus events |
| `event_tasks` | Kanban tasks for events |
| `incidents` | Anonymous safety reports |

### Verify Tables in Supabase Dashboard

1. Go to [supabase.com](https://supabase.com) → Sign in
2. Select your project
3. Click **Table Editor** in sidebar
4. All 8 tables should appear after first server run

---

## API Testing Examples

### 1. Register a Student

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@college.edu",
    "password": "mypassword123",
    "name": "Rahul Kumar",
    "role": "student",
    "branch": "Computer Science",
    "section": "A",
    "year": 2,
    "tags": ["python", "ai/ml", "hackathons"]
  }'
```

**Response:**
```json
{
  "message": "Account created successfully",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": { "id": 1, "name": "Rahul Kumar", "email": "student@college.edu", ... }
}
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@college.edu", "password": "mypassword123"}'
```

### 3. Create a Hive (Group)

```bash
curl -X POST http://localhost:5000/api/groups/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "AI Enthusiasts", "type": "club", "description": "AI/ML community", "icon": "🤖", "color": "blue"}'
```

### 4. Create a Smart Poll

```bash
curl -X POST http://localhost:5000/api/polls/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": 1,
    "question": "What should be our next hackathon theme?",
    "options": [{"text": "AI & Healthcare"}, {"text": "Climate Tech"}, {"text": "EdTech"}]
  }'
```

### 5. Create Event with AI Tasks

```bash
curl -X POST http://localhost:5000/api/events/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": 1,
    "title": "Annual Tech Fest 2025",
    "description": "Three-day technology festival",
    "budget": 50000,
    "attendee_count": 500,
    "generate_tasks": true
  }'
```

### 6. Find Vibe Matches

```bash
curl http://localhost:5000/api/vibe/matches \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Anonymous Incident Report

```bash
curl -X POST http://localhost:5000/api/incidents/report \
  -H "Content-Type: application/json" \
  -d '{"severity": "yellow", "description": "Suspicious behavior in lab", "location": "Block C Lab 3"}'
```

---

## Docker Deployment

```bash
# From the campus-hive/ root folder
docker-compose up --build

# API available at http://localhost:5000
```

---

## GitHub Push Guide

```bash
cd "C:\Users\harsh\OneDrive\Desktop\vibe project\campus-hive"

# Initialize git
git init
git add .
git commit -m "🐝 Initial commit: Campus Hive Flask + Supabase + JWT"

# Push to GitHub (create repo at github.com first)
git remote add origin https://github.com/harshath125/campus-hive.git
git branch -M main
git push -u origin main
```

> 🔒 The `.gitignore` excludes `.env` automatically so your secrets stay safe.

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | *(set)* | Supabase PostgreSQL URL |
| `SECRET_KEY` | *(set)* | JWT signing key |
| `JWT_ACCESS_TOKEN_EXPIRES_HOURS` | `24` | Token lifetime |
| `GEMINI_API_KEY` | *(set)* | Google Gemini API key |
| `FLASK_ENV` | `development` | `development` or `production` |
| `FLASK_DEBUG` | `True` | Enable Flask debug mode |
| `FLASK_PORT` | `5000` | Port to run on |
| `CORS_ORIGINS` | *(set)* | Allowed frontend origins |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError` | Run `.\venv\Scripts\activate` first |
| `OperationalError: could not connect` | Check Supabase is running and `DATABASE_URL` is correct |
| `401 Unauthorized` | Pass `Authorization: Bearer <token>` header |
| `Token has expired` | Login again to get a fresh token |
| Tables not created | Delete and re-run `python run.py` (db.create_all runs on startup) |
| psycopg2 install error | Run `pip install psycopg2-binary` (not `psycopg2`) |

---

*🐝 Built with Flask + Supabase + Flask-JWT-Extended + Gemini AI*
