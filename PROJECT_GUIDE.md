# 🐝 Campus Hive — Complete Project Guide

> **Reviewer's Reference** · This document covers the project overview, tech stack, architecture, UML diagrams, actor interactions, and file map.

---

## 1 · What is Campus Hive?

**Campus Hive** is a **unified student collaboration platform** for ANITS (Anil Neerukonda  Institute of Technology and Science). It replaces fragmented WhatsApp groups, notice boards, and spreadsheets with a single, intelligent platform that covers:

| Problem Solved | Feature |
|----------------|---------|
| "Who shares my interests?" | **Vibe Matcher** — Jaccard similarity matching |
| "What does the class want?" | **Smart Polls** — Reasoned voting with collective insights |
| "How do we plan this event?" | **Event Planner** — Auto-Kanban task board generation |
| "Where do clubs organize?" | **Spaces** — Public/Private/Mandatory spaces with polls & events |
| "How do I report harassment safely?" | **Safety Shield** — Anonymous, no-auth incident reporting |
| "Where are placement resources?" | **Resources Hub** — Interview experiences, study material, announcements |
| "Who runs the platform?" | **Admin Panel** — Student import, space management, monitoring |

---

## 2 · Tech Stack

### Backend

| Layer | Technology |
|-------|-----------|
| Framework | **Flask 3.0** (Python) |
| Database | **Supabase PostgreSQL** (hosted) |
| ORM | **SQLAlchemy 2.0** + Flask-SQLAlchemy |
| Authentication | **Flask-JWT-Extended** (HS256 JWT, 24h expiry) |
| Password Hashing | **Flask-Bcrypt** (bcrypt, cost factor 12) |
| CORS | Flask-CORS |
| Environment | python-dotenv |
| Server | Gunicorn (production), Flask dev server (dev) |
| Smart Features | Custom Jaccard similarity engine (pure Python) |

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | **React 18** + **TypeScript** |
| Build Tool | **Vite 5** |
| Routing | React Router DOM v6 |
| Styling | **Tailwind CSS 3** + custom glassmorphism |
| Animations | **Framer Motion** |
| Icons | Lucide React |
| State | React Context API + useState |
| Fonts | Inter (Google Fonts) |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL database hosting + real-time capability |
| **GitHub** | Version control |
| **Vite Proxy** | `/api/*` proxied to Flask on port 5000 |

---

## 3 · System Architecture

```mermaid
graph TB
    subgraph Browser["Browser (React App — Port 3000)"]
        UI["React Pages<br/>(Landing / Dashboard / Spaces / Polls / Events / ...)"]
        CTX["AuthContext<br/>(JWT token + state)"]
    end

    subgraph Backend["Flask Backend — Port 5000"]
        direction TB
        MW["JWT Middleware<br/>(Flask-JWT-Extended)"]
        BP1["/api/auth"]
        BP2["/api/groups"]
        BP3["/api/polls"]
        BP4["/api/events"]
        BP5["/api/vibe"]
        BP6["/api/incidents (no auth)"]
        JACCQ["Jaccard Engine<br/>(Pure Python)"]
        INSIGHT["Collective Insight<br/>Generator"]
    end

    subgraph DB["Supabase PostgreSQL"]
        T1[(user)]
        T2[(group)]
        T3[(group_membership)]
        T4[(poll + poll_vote)]
        T5[(event + task)]
        T6[(incident)]
    end

    UI -- "fetch /api/*" --> MW
    CTX -- "Authorization: Bearer JWT" --> MW
    MW --> BP1 & BP2 & BP3 & BP4 & BP5
    UI -- "POST /api/incidents (anonymous)" --> BP6
    BP5 --> JACCQ
    BP3 --> INSIGHT
    BP1 & BP2 & BP3 & BP4 --> T1 & T2 & T3 & T4 & T5
    BP6 --> T6
```

---

## 4 · Database Entity-Relationship Diagram

```mermaid
erDiagram
    USER {
        int id PK
        string name
        string email UK
        string password_hash
        string branch
        string section
        int year
        json tags
        bool is_admin
        datetime created_at
    }

    GROUP {
        int id PK
        string name
        string description
        string type
        string category
        int admin_id FK
        datetime created_at
    }

    GROUP_MEMBERSHIP {
        int id PK
        int user_id FK
        int group_id FK
        datetime joined_at
    }

    POLL {
        int id PK
        int group_id FK
        int created_by FK
        string question
        json options
        bool is_active
        string ai_insight
        datetime created_at
    }

    POLL_VOTE {
        int id PK
        int poll_id FK
        int user_id FK
        int option_index
        string reason
        datetime voted_at
    }

    EVENT {
        int id PK
        int group_id FK
        int created_by FK
        string title
        string description
        date event_date
        int budget
        int attendees
        datetime created_at
    }

    TASK {
        int id PK
        int event_id FK
        string title
        string status
        string assignee
        string priority
    }

    INCIDENT {
        int id PK
        string content
        string severity
        datetime created_at
    }

    USER ||--o{ GROUP_MEMBERSHIP : "joins"
    GROUP ||--o{ GROUP_MEMBERSHIP : "has"
    USER ||--o{ GROUP : "admins"
    GROUP ||--o{ POLL : "contains"
    USER ||--o{ POLL : "creates"
    POLL ||--o{ POLL_VOTE : "receives"
    USER ||--o{ POLL_VOTE : "casts"
    GROUP ||--o{ EVENT : "hosts"
    USER ||--o{ EVENT : "creates"
    EVENT ||--o{ TASK : "has"
```

---

## 5 · Use Case Diagram — Actor Interactions

```mermaid
graph LR
    S["👤 Student"]
    A["🛡️ Admin"]
    SYS["⚙️ Backend System"]

    subgraph Auth["Authentication"]
        UC1["Register Account"]
        UC2["Login / Get JWT"]
        UC3["Update Profile & Tags"]
    end

    subgraph SpaceMgmt["Space Management"]
        UC4["View All Spaces"]
        UC5["Join Public Space"]
        UC6["Request to Join Private Space"]
        UC7["Create New Space (becomes Admin)"]
        UC8["Approve Join Requests"]
        UC9["Leave Space"]
    end

    subgraph PollMgmt["Smart Polls"]
        UC10["View Space Polls"]
        UC11["Create Poll in Space"]
        UC12["Vote with Reason"]
        UC13["View Collective Insight"]
    end

    subgraph EventMgmt["Event Planner"]
        UC14["View Space Events"]
        UC15["Plan Event in Space"]
        UC16["Auto-generate Task Board"]
        UC17["Update Task Status (Kanban)"]
    end

    subgraph VibeMatch["Vibe Matching"]
        UC18["Run Vibe Match"]
        UC19["View Top 5 Matches"]
    end

    subgraph Safety["Safety"]
        UC20["Submit Anonymous Report"]
        UC21["View All Reports"]
        UC22["Monitor & Escalate"]
    end

    subgraph AdminOps["Admin Operations"]
        UC23["Import Students (CSV)"]
        UC24["Create Mandatory Spaces"]
        UC25["Post Announcements"]
        UC26["Monitor Activity Log"]
    end

    S --> UC1 & UC2 & UC3
    S --> UC4 & UC5 & UC6 & UC7 & UC9
    S --> UC10 & UC11 & UC12 & UC13
    S --> UC14 & UC15 & UC17
    S --> UC18 & UC19
    S --> UC20

    A --> UC2 & UC8 & UC21 & UC22 & UC23 & UC24 & UC25 & UC26

    SYS --> UC16
    UC7 -.->|"Auto-makes creator Admin"| UC8
    UC15 -.->|"Triggers"| UC16
    UC12 -.->|"After 3+ votes"| UC13
```

---

## 6 · User Flow Diagram

```mermaid
flowchart TD
    START([Open Campus Hive]) --> LANDING[Landing Page]
    LANDING --> SIGNUP[Sign Up] & LOGIN[Log In]
    SIGNUP & LOGIN --> DASHBOARD[Dashboard]

    DASHBOARD --> VM[Vibe Matcher]
    DASHBOARD --> POLLS[Smart Polls]
    DASHBOARD --> EVENTS[Event Planner]
    DASHBOARD --> SPACES[My Spaces]
    DASHBOARD --> SAFETY[Safety Shield]
    DASHBOARD --> RESOURCES[Resources Hub]
    DASHBOARD --> PROFILE[Profile Modal]

    SPACES --> SPACE_LIST[Browse Spaces]
    SPACE_LIST --> IS_PUB{Public Space?}
    IS_PUB -- Yes --> JOIN[Join Instantly]
    IS_PUB -- No --> REQ[Request to Join]
    REQ --> ADMIN_NOTIFY[Admin Sees Request]
    ADMIN_NOTIFY --> APPROVE{Approve?}
    APPROVE -- Yes --> JOIN
    APPROVE -- No --> DECLINED[Declined]
    JOIN --> SPACE_DETAIL[Space Detail]

    SPACE_DETAIL --> SPACE_POLLS[In-Space Polls]
    SPACE_DETAIL --> SPACE_EVENTS[In-Space Events]

    SPACE_POLLS --> CREATE_POLL[Create Poll]
    SPACE_POLLS --> VOTE_POLL[Vote + Reason]
    SPACE_POLLS --> AI_INSIGHT[View Insight]

    SPACE_EVENTS --> CREATE_EVENT[Create Event]
    CREATE_EVENT --> KANBAN[Auto-generated Kanban]
    KANBAN --> UPDATE_TASK[Move Tasks: Todo → 
    In Progress → Done]

    SAFETY --> ANON_FORM[Anonymous Form]
    ANON_FORM --> SUBMITTED[Submitted - No ID Attached]
```

---

## 7 · API Endpoint Reference

### Authentication
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | None | Create student account |
| POST | `/api/auth/login` | None | Login → JWT token |
| GET | `/api/auth/me` | JWT | Get current user |
| PUT | `/api/auth/me` | JWT | Update profile |

### Groups (Spaces)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/groups/` | JWT | List all groups |
| POST | `/api/groups/` | JWT | Create new group |
| GET | `/api/groups/<id>` | JWT | Get group details |
| PUT | `/api/groups/<id>` | JWT Admin | Update group |
| DELETE | `/api/groups/<id>` | JWT Admin | Delete group |
| POST | `/api/groups/<id>/join` | JWT | Join / request to join |

### Polls
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/polls/` | JWT | List polls |
| POST | `/api/polls/` | JWT | Create poll |
| GET | `/api/polls/<id>` | JWT | Get poll details |
| POST | `/api/polls/<id>/vote` | JWT | Vote with reason |
| GET | `/api/polls/<id>/insight` | JWT | Get collective insight |

### Events
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/events/` | JWT | List events |
| POST | `/api/events/` | JWT | Create event |
| GET | `/api/events/<id>` | JWT | Get event + tasks |
| PUT | `/api/events/<id>/tasks/<task_id>` | JWT | Update task status |

### Vibe Matching
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/vibe/matches` | JWT | Get top-5 vibe matches |

### Safety Reports
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/incidents/` | **None** | Anonymous report |
| GET | `/api/incidents/` | JWT Admin | List all reports |

### Health
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/health` | None | Server health check |

---

## 8 · Project File Map

```
vibe project/
│
├── setup_backend.bat        ← Run this FIRST (install Python deps)
├── setup_frontend.bat       ← Run this SECOND (install npm packages)
├── start_all.bat            ← Start both servers
├── test_api.bat             ← Test all 12 API endpoints
│
└── campus-hive/
    ├── SUPABASE_GUIDE.md    ← How to view/manage database
    ├── AUTH_GUIDE.md        ← JWT authentication reference
    ├── PROJECT_GUIDE.md     ← This file (architecture + UML)
    │
    ├── backend/             ← Flask REST API
    │   ├── .env             ← Supabase + JWT + Gemini credentials
    │   ├── requirements.txt
    │   ├── run.py           ← Entry point
    │   ├── app/
    │   │   ├── __init__.py  ← create_app() factory
    │   │   ├── models/      ← SQLAlchemy models (User, Group, Poll, Event, Task, Incident)
    │   │   ├── routes/      ← Blueprints (auth, groups, polls, events, vibe, incidents)
    │   │   └── utils/       ← Jaccard engine, AI insights helper
    │   └── venv/            ← Python virtual environment
    │
    └── frontend/            ← React + Vite + TypeScript
        ├── package.json
        ├── vite.config.ts   ← Proxy /api/* → port 5000
        ├── tailwind.config.js
        └── src/
            ├── App.tsx      ← AuthContext + all state + routing
            ├── main.tsx
            ├── index.css    ← Glassmorphism + Tailwind
            └── pages/
                ├── Landing.tsx
                ├── Login.tsx / Signup.tsx
                ├── Dashboard.tsx    ← Sidebar + profile modal
                ├── Spaces.tsx       ← Join/Request/Admin flow
                ├── SmartPolls.tsx   ← Space-scoped polls
                ├── EventPlanner.tsx ← Kanban events
                ├── VibeMatcher.tsx
                ├── Safety.tsx
                ├── Resources.tsx
                ├── AdminLogin.tsx
                └── AdminPanel.tsx   ← 5-tab admin dashboard
```

---

## 9 · Running the Project — Quickstart

```
1. Double-click  setup_backend.bat   (first time only)
2. Double-click  setup_frontend.bat  (first time only)
3. Double-click  start_all.bat       (every time you want to run)
4. Open          http://localhost:3000
```

To test all API endpoints:
```
5. Double-click  test_api.bat
```

---

## 10 · Environment Requirements

| Software | Minimum Version | Check Command |
|----------|-----------------|---------------|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| curl | *(ships with Windows 10+)* | `curl --version` |

> **Internet required** on first run to connect to Supabase and download npm packages.
