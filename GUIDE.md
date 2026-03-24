# Campus Hive v2.0 — Complete Admin & Deployment Guide

---

## 1. How to Run the Project (Local)

### Quick Start (3 commands)
```batch
batch\setup_backend.bat     :: Install Python deps, migrate DB, create admin user
batch\setup_frontend.bat    :: Install npm packages
batch\start_all.bat         :: Launch Django (port 8000) + Vite (port 5173)
```

### Manual Start
```powershell
# Terminal 1 — Backend
cd campus-hive\backend
venv\Scripts\activate
python manage.py runserver 8000

# Terminal 2 — Frontend
cd campus-hive\frontend
npm run dev
```

### URLs
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Django Admin | http://localhost:8000/admin/ |
| API Root | http://localhost:8000/api/ |

---

## 2. Django Admin Panel Guide

### Login
1. Go to `http://localhost:8000/admin/`
2. Enter your superuser email and password
3. (Default: `admin@campushive.com` / `admin123`)

### What You Can Manage

| Section | What It Shows | Actions |
|---------|--------------|---------|
| **Users** | All students, faculty, admins | View/edit/deactivate, filter by role/branch/year/section |
| **Groups** | Spaces (clubs, departments) | Create/edit, see member counts, admin info |
| **Polls** | All created polls | View questions, options, AI insights |
| **Poll Options** | Individual poll choices | See vote counts |
| **Votes** | Every vote cast | See who voted, their reason, timestamp |
| **Events** | All events | View details, budget, associated group |
| **Event Tasks** | Kanban-style tasks | Track status (todo/inprogress/done), priority, assignee |
| **Incidents** | Anonymous safety reports | Manage severity (green/orange/red), status (reported/reviewing/resolved) |
| **Activity Logs** | Complete audit trail (read-only) | Track every login, signup, vote, group creation, vibe match |

### Admin Tips
- **Search**: Use the search bar at the top of any model list
- **Filter**: Use the right sidebar filters (role, branch, year, status, etc.)
- **Export**: Select items → Action dropdown → export (if django-import-export added)
- **Bulk Actions**: Select multiple items → choose action → Run

---

## 3. How to Connect to Supabase Database

### Step 1: Get Your Supabase Connection String
1. Go to https://supabase.com → your project
2. Navigate to **Settings → Database → Connection string → URI**
3. Copy the full `postgresql://...` URL

### Step 2: Update .env
Edit `campus-hive/backend/.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres
```

### Step 3: Run Migrations
```powershell
cd campus-hive\backend
venv\Scripts\activate
python manage.py migrate
python manage.py createsuperuser
```

### How the DB Switching Works
The settings automatically detect if Supabase is reachable:
- **Supabase available** → Uses PostgreSQL (production)
- **Supabase unreachable** → Falls back to local SQLite (development)

You'll see this in the console:
```
[OK] Connected to Supabase PostgreSQL    ← production mode
[WARN] Supabase unreachable - using local SQLite   ← dev mode
```

---

## 4. Monitor All Database Operations

### Django Admin Activity Logs
Every user action is automatically logged:
- Login/Signup attempts
- Profile updates
- Group creations
- Poll votes
- Event and task management
- Vibe match requests
- Incident reports

**View at**: Admin Panel → Activity Logs

### Django Shell (Advanced Queries)
```powershell
cd campus-hive\backend
venv\Scripts\activate
python manage.py shell
```
```python
# Count all users
from core.models import User
User.objects.count()

# Recent activity
from core.models import ActivityLog
ActivityLog.objects.order_by('-timestamp')[:10]

# Users by branch
User.objects.filter(branch='CSE').count()

# Active polls
from core.models import Poll
Poll.objects.filter(is_active=True).count()
```

### Console Logs
The Django server prints all HTTP requests:
```
[22/Mar/2026 22:45:10] "POST /api/auth/login HTTP/1.1" 200
[22/Mar/2026 22:45:15] "GET /api/vibe/matches HTTP/1.1" 200
```

---

## 5. API Endpoints Reference

### Auth
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/signup` | No | Register new student |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user profile |
| PUT | `/api/auth/me/update` | Yes | Update profile/tags |

### Groups (Spaces)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/groups/` | No | List all groups |
| POST | `/api/groups/create` | Yes | Create group |
| GET | `/api/groups/<id>` | No | Get group by ID |
| PUT | `/api/groups/<id>/update` | Yes | Update group |

### Polls
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/polls/` | Yes | Create poll |
| GET | `/api/polls/group/<id>` | No | List polls in group |
| GET | `/api/polls/<id>` | No | Get poll details |
| POST | `/api/polls/<id>/vote` | Yes | Vote (with reason) |

### Events
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/events/` | Yes | Create event (optional AI task gen) |
| GET | `/api/events/group/<id>` | No | List events in group |
| GET | `/api/events/<id>` | No | Get event details |
| POST | `/api/events/<id>/tasks` | Yes | Add task manually |
| PATCH | `/api/events/tasks/<id>` | Yes | Update task status |

### Vibe Matcher
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/vibe/matches` | Yes | Get ML-powered matches |
| GET | `/api/vibe/score` | Yes | Get vibe score |
| POST | `/api/vibe/tags` | Yes | Update interest tags |

### Incidents
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/incidents/report` | No | Report incident (anonymous) |
| GET | `/api/incidents/` | Yes | List all incidents |
| PATCH | `/api/incidents/<id>/status` | Yes | Update incident status |

---

## 6. Docker Deployment

### Build & Run Locally
```bash
cd campus-hive
docker-compose up --build -d
```

### Access After Docker
- Frontend: http://localhost (port 80)
- Admin Panel: http://localhost/admin/
- API: http://localhost/api/

### Create Admin User in Docker
```bash
docker exec -it campushive-backend python manage.py createsuperuser
```

### View Logs
```bash
docker-compose logs -f backend     # Django logs
docker-compose logs -f frontend    # Nginx logs
docker-compose logs -f             # All logs
```

### Restart Services
```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart    # All
```

### Update Code & Redeploy
```bash
git pull
docker-compose up --build -d
```

---

## 7. AWS EC2 Deployment Guide

### Step 1: Launch EC2 Instance
1. Go to AWS Console → EC2 → **Launch Instance**
2. Settings:
   - **AMI**: Ubuntu 22.04 LTS
   - **Instance Type**: t2.micro (free tier) or t2.small for production
   - **Key Pair**: Create or select an existing SSH key
   - **Security Group Rules**:
     - SSH (22) — Your IP
     - HTTP (80) — Anywhere (0.0.0.0/0)
     - HTTPS (443) — Anywhere
     - Custom TCP (8000) — Anywhere (for Django admin direct access)

### Step 2: Connect to EC2
```bash
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### Step 3: Install Docker on EC2
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git
sudo usermod -aG docker $USER
# Log out and back in for group changes
exit
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### Step 4: Clone & Deploy
```bash
git clone <YOUR-GITHUB-REPO-URL> campus-hive
cd campus-hive

# Copy your .env file
nano backend/.env
# Paste your DATABASE_URL, GEMINI_API_KEY, SECRET_KEY, etc.

# Build and start
docker-compose up --build -d

# Create admin user
docker exec -it campushive-backend python manage.py migrate
docker exec -it campushive-backend python manage.py createsuperuser
```

### Step 5: Access Your App
- Frontend: `http://<EC2-PUBLIC-IP>`
- Admin: `http://<EC2-PUBLIC-IP>/admin/`
- API: `http://<EC2-PUBLIC-IP>/api/`

---

## 8. Security Best Practices

| Practice | How |
|----------|-----|
| Change SECRET_KEY | Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| Set DEBUG=False | In `.env`: `DJANGO_DEBUG=False` |
| Set ALLOWED_HOSTS | In `settings.py`: `ALLOWED_HOSTS = ["your-domain.com", "EC2-IP"]` |
| Use HTTPS | Set up SSL with Let's Encrypt / Certbot |
| Rotate JWT secret | Change `SECRET_KEY` periodically |
| Monitor logs | Check `docker-compose logs` regularly |
| Backup database | Supabase has automatic backups; for SQLite, backup `db.sqlite3` |

---

## 9. Project Architecture

```
campus-hive/
├── docker-compose.yml          ← Orchestrates backend + frontend
├── backend/
│   ├── Dockerfile              ← Python 3.13 container
│   ├── manage.py               ← Django management
│   ├── requirements.txt        ← Django + DRF + JWT + numpy + Gemini
│   ├── .env                    ← DATABASE_URL, GEMINI_API_KEY, SECRET_KEY
│   ├── test_api.py             ← 30-endpoint API test suite
│   ├── campus_hive/            ← Django project (settings, urls, wsgi)
│   └── core/                   ← Main app
│       ├── models.py           ← 9 models with Django ORM
│       ├── admin.py            ← Full admin panel config
│       ├── urls.py             ← API route mapping
│       ├── views/              ← 6 API view modules
│       └── utils/              ← vibe_algorithm.py, gemini_utils.py
├── frontend/
│   ├── Dockerfile              ← Node 22 build + Nginx serve
│   ├── nginx.conf              ← SPA routing + API proxy
│   ├── src/
│   │   ├── api.ts              ← API service (fetch + JWT)
│   │   ├── App.tsx             ← Router + Auth context
│   │   └── pages/              ← All page components
│   └── vite.config.ts          ← Dev proxy → localhost:8000
└── batch/
    ├── setup_backend.bat       ← Install + migrate + superuser
    ├── setup_frontend.bat      ← npm install
    └── start_all.bat           ← Launch both servers
```

---

## 10. Troubleshooting

| Issue | Fix |
|-------|-----|
| `Supabase unreachable` | Normal locally — uses SQLite fallback. Check DATABASE_URL for production. |
| `Module not found` errors | Run `venv\Scripts\activate` then `pip install -r requirements.txt` |
| Admin login fails | Run `python manage.py createsuperuser` to create new admin |
| Frontend can't reach API | Check Django is running on port 8000; check vite proxy config |
| JWT token expired | Tokens last 24 hours. Login again to get a new token. |
| Migration errors | Run `python manage.py makemigrations core` then `python manage.py migrate` |
| Port already in use | Kill existing process: `netstat -ano | findstr :8000` then `taskkill /PID <PID> /F` |
