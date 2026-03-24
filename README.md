# 🐝 Campus Hive — AI-Powered Campus Community Platform

**Campus Hive** is a full-stack web application built for ANITS (Anil Neerukonda Institute) students. It connects students through AI-powered vibe matching, collaborative spaces, smart polls, event planning, and an admin dashboard — all in a sleek, dark-themed UI.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **🤖 Vibe Matcher** | ML-powered student matching using TF-IDF + Cosine Similarity. Finds students with similar interests and displays compatibility scores. |
| **🌐 Spaces** | Create public/private groups (clubs, study groups, teams) with built-in polls & event planning. Join, request, approve members. |
| **📊 Smart Polls** | Create polls inside spaces with AI-generated insights on voting patterns. |
| **📅 Event Planner** | AI-assisted event creation with auto-generated task boards (Kanban-style). |
| **🛡️ Safety Shield** | Anonymous campus safety reporting with severity levels and incident tracking. |
| **📚 Resources Hub** | Share interview experiences, study materials, and campus announcements. |
| **🔔 Notifications** | Real-time announcement feed from admin — visible via notification bell. |
| **👑 Admin Dashboard** | Full CRUD operations: user management, CSV upload, announcements, resources, activity logs, DB health monitoring. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS + Framer Motion |
| **Backend** | Django 5 + Django REST Framework |
| **Database** | Supabase (PostgreSQL) with SQLite fallback |
| **AI/ML** | Google Gemini API (insights) + TF-IDF Cosine Similarity (matching) |
| **Auth** | JWT (SimpleJWT) |
| **Deployment** | Docker + Nginx + Gunicorn |

---

## 📁 Project Structure

```
campus-hive/
├── frontend/            # React + TypeScript SPA
│   ├── src/
│   │   ├── pages/       # All page components (Dashboard, VibeMatcher, Spaces, etc.)
│   │   ├── api.ts       # API service layer
│   │   └── App.tsx      # Main app with auth context & routing
│   ├── Dockerfile       # Multi-stage: Node build → Nginx serve
│   └── nginx.conf       # Reverse proxy config (routes /api/ to backend)
│
├── backend/             # Django REST API
│   ├── core/
│   │   ├── models.py    # User, ActivityLog, Announcement, Resource, Incident
│   │   ├── views/       # auth, admin, vibe, group, safety, resource views
│   │   └── utils/       # vibe_algorithm.py (ML matching), gemini_utils.py (AI)
│   ├── campus_hive/     # Django settings, URLs, WSGI
│   ├── Dockerfile       # Python + Gunicorn production server
│   └── .env             # Environment variables (DB, API keys)
│
├── docker-compose.yml   # Orchestrates frontend + backend containers
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.11+, Node.js 18+, Git

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_test_users   # Seeds 200 test users
python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

### Default Admin Login
- Email: `admin@campushive.com`
- Password: `admin123`

---

## 🧠 Vibe Matching Algorithm

The vibe matcher uses a **multi-factor weighted scoring** system:

| Factor | Weight | Method |
|--------|--------|--------|
| Tag Similarity | 50% | TF-IDF vectors + Cosine Similarity (60%) blended with Jaccard Similarity (40%) |
| Branch Match | 15% | Same branch = 100%, different = 0% |
| Year Proximity | 15% | Same year = 100%, ±1 = 70%, ±2 = 40%, ±3+ = 10% |
| Section Match | 10% | Same section = 100%, different = 0% |
| Shared Tag Count | 10% | 4+ shared tags = max bonus |

The algorithm processes TF-IDF vectors for **all users at once** for efficiency, then ranks the top 10 matches with AI-generated insights from Google Gemini.

---

## 🐳 Docker Deployment

```bash
docker-compose up -d --build
```
- Frontend: `http://localhost` (port 80)
- Backend API: proxied through Nginx at `/api/`

---

## 👨‍💻 Author

**Harshath Raghava** — ANITS B.Tech Student  
Built as a campus community project to enhance student collaboration through AI.
