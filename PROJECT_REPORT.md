# Campus Hive v2.0 — Comprehensive Project Report

> **ANITS College — Smart Campus Platform**
> Date: March 23, 2026

---

## 1. Project Overview

Campus Hive is an AI-powered campus collaboration platform for ANITS College that connects students based on shared interests, enables smart polling, event management, and anonymous incident reporting. The platform uses **Machine Learning (TF-IDF + Cosine Similarity)** to find compatible students and **Google AI** for intelligent content generation.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Django 6.0.3, Django REST Framework |
| **Frontend** | React 18, TypeScript, Vite 5, Tailwind CSS |
| **Database** | Supabase PostgreSQL (production) / SQLite (development) |
| **Authentication** | JWT via SimpleJWT (token-based, stateless) |
| **ML Algorithm** | TF-IDF Vectorization + Cosine Similarity + Multi-Factor Weighted Scoring |
| **AI Integration** | Google AI 2.0 Flash API |
| **Deployment** | Docker + Docker Compose, Nginx, AWS EC2 |
| **Dev Tools** | Python 3.13, Node.js 22, npm, pip |

---

## 3. Features Overview

### 3.1 Vibe Matcher (ML-Powered Student Matching)
- Uses **TF-IDF + Cosine Similarity** to find students with compatible interests
- Analyzes 5 weighted factors: tags, branch, section, year, and common interest count
- Shows match percentage, shared tags, and AI-generated compatibility insights
- Tested with 50 diverse student profiles across 9 interest clusters

### 3.2 Smart Polls (AI-Driven Consensus)
- Create polls with multiple options inside group spaces
- AI generates summaries of voting reasons after 3+ votes
- Real-time vote percentages with visual progress bars
- Duplicate vote prevention per user

### 3.3 Smart Event Planner (Kanban + AI Tasks)
- Create campus events with budget tracking
- AI auto-generates task lists based on event description
- Kanban task management (To Do → In Progress → Done)
- Progress tracking with completion percentage

### 3.4 Safety Shield (Anonymous Incident Reporting)
- Anonymous reporting (no login required)
- Severity levels: Green (suggestion), Orange (concern), Red (emergency)
- Location-based categorization
- Admin status tracking: Reported → Reviewing → Resolved
- Stealth Mode for user safety (quick-exit/redirection)

### 3.5 Admin Panel
- Django's built-in admin with full CRUD for all 9 models
- Activity logging tracks every user action
- Filters by role, branch, year, status, severity
- Read-only audit trail for compliance

---

## 4. ML Vibe Matcher Algorithm — Deep Dive

### 4.1 Algorithm Architecture

The Vibe Matcher uses a **multi-stage pipeline** combining NLP techniques with weighted multi-factor scoring:

```
                    User A Tags                 User B Tags
                        |                           |
                        v                           v
               ┌─────────────────────────────────────────┐
               │   Stage 1: TF-IDF Vectorization         │
               │   Convert tag lists to numerical vectors │
               │   using Term Frequency–Inverse Document  │
               │   Frequency weighting                    │
               └─────────────────┬───────────────────────┘
                                 |
                                 v
               ┌─────────────────────────────────────────┐
               │   Stage 2: Cosine Similarity             │
               │   Measure angle between TF-IDF vectors   │
               │   Range: 0.0 (no similarity) to          │
               │          1.0 (identical interests)       │
               └─────────────────┬───────────────────────┘
                                 |
                                 v
               ┌─────────────────────────────────────────┐
               │   Stage 3: Multi-Factor Weighted Scoring │
               │                                          │
               │   Tags (TF-IDF):  50% weight             │
               │   Same Branch:    15% weight              │
               │   Same Year:      15% weight              │
               │   Same Section:   10% weight              │
               │   Common Count:   10% weight              │
               └─────────────────┬───────────────────────┘
                                 |
                                 v
               ┌─────────────────────────────────────────┐
               │   Stage 4: Rare Interest Bonus           │
               │   Tags shared by < 20% of users get      │
               │   1.5x boost (rewards niche interests)   │
               └─────────────────┬───────────────────────┘
                                 |
                                 v
                        Final Vibe Score (0-100%)
```

### 4.2 TF-IDF Explanation

**TF-IDF (Term Frequency–Inverse Document Frequency)** is an NLP technique that weighs how important a word is within a document relative to a collection:

- **TF (Term Frequency)**: How often a tag appears in a user's profile (1/total_tags per tag since tags are unique)
- **IDF (Inverse Document Frequency)**: `log(N / df)` where N = total users, df = users with that tag
- **Effect**: Common tags like "Python" get lower weight; rare tags like "FPGA" or "Blender" get higher weight

**Example:**
- "Python" (used by 15/50 students) → IDF = log(50/15) = 1.2
- "Verilog" (used by 2/50 students) → IDF = log(50/2) = 3.2
- Two students sharing "Verilog" score higher than two sharing "Python" because the interest is more distinctive

### 4.3 Cosine Similarity

Cosine similarity measures the angle between two TF-IDF vectors:

```
similarity = (A · B) / (|A| × |B|)
```

- **1.0** = identical interest profiles
- **0.5** = moderate overlap
- **0.0** = no common interests

This is preferred over Euclidean distance because it normalizes for profile size — a student with 3 tags is fairly compared to one with 8 tags.

### 4.4 Multi-Factor Weighted Scoring

The final score blends 5 signals:

| Factor | Weight | Logic |
|--------|--------|-------|
| **Tag Similarity (TF-IDF)** | 50% | Cosine similarity of TF-IDF vectors |
| **Same Branch** | 15% | 1.0 if same branch, 0.0 otherwise |
| **Same Year** | 15% | 1.0 if same year, 0.0 otherwise |
| **Same Section** | 10% | 1.0 if same section, 0.0 otherwise |
| **Common Tag Count** | 10% | `min(common_count / 3, 1.0)` — saturates at 3+ shared tags |

### 4.5 Rare Interest Bonus

Tags shared by fewer than 20% of all users receive a **1.5x multiplier**. This means:
- Two students who both like "Competitive Programming" (common) get a normal boost
- Two students who both like "FPGA Design" (rare) get a 1.5x amplified score

This rewards niche, distinctive shared interests over generic ones.

---

## 5. ML Accuracy Testing — 50 User Dataset

### 5.1 Test Dataset Design

50 student profiles were created across **9 distinct interest clusters** with known group memberships:

| Cluster | Users | Key Tags | Branch |
|---------|-------|----------|--------|
| AI/ML | 7 | Python, AI/ML, Deep Learning, TensorFlow, NLP | CSE |
| Web Dev | 7 | React, JavaScript, Web Dev, Next.js, Node.js | CSE/IT |
| Competitive Programming | 6 | DSA, C++, LeetCode, CodeForces, Algorithms | CSE/IT |
| Creative & Design | 5 | UI/UX, Figma, Photography, Blender, Sketching | Mixed |
| DevOps & Cloud | 4 | Docker, Kubernetes, AWS, CI/CD, Terraform | CSE/IT |
| Cybersecurity | 3 | Ethical Hacking, CTF, Penetration Testing, Kali | CSE/IT |
| Mobile Dev | 3 | Flutter, React Native, Kotlin, Mobile Dev | CSE/IT |
| IoT & Hardware | 4 | Arduino, Raspberry Pi, Embedded Systems, VLSI | ECE/EEE |
| Data & Analytics | 3 | Data Science, SQL, Tableau, Power BI, Spark | CSE/IT |

Additionally, **7 cross-interest students** were included to test edge cases (students with interests spanning multiple clusters).

### 5.2 Testing Methodology

For each cluster, one representative user was selected and the vibe matcher was run:
1. **Login** as the test user
2. **Call** `GET /api/vibe/matches` to get top 10 matches
3. **Measure** in-cluster average score vs. out-cluster average score
4. **Validate** that in-cluster scores are higher (positive separation)
5. **Check** top-1 and top-3 accuracy (how many top matches are from the same cluster)

### 5.3 Test Results

**Top Match Example — Arjun Reddy (AI/ML Cluster):**

| Rank | Match | Score | Branch | Shared Tags |
|------|-------|-------|--------|-------------|
| #1 | Sneha Patil | 69.2% | CSE 3-A | Python, AI/ML, Hackathons |
| #2 | Vikram Singh | 58.9% | CSE 3-B | AI/ML, Deep Learning, Python |
| #3 | Aisha Khan | 56.8% | CSE 3-A | Python, AI/ML |
| #4 | Priya Sharma | 55.2% | CSE 3-A | Python, AI/ML |

> **Observation**: Top matches are correctly from the AI/ML cluster, with Same Branch and Same Year boosting scores. The algorithm correctly identifies Sneha Patil as the #1 match due to sharing 3 highly relevant tags (Python, AI/ML, Hackathons) plus Same Branch, Same Section, and Same Year.

**Cluster Accuracy Summary:**
- In-cluster average scores are consistently **higher** than out-cluster scores
- The algorithm correctly separates related students from unrelated ones
- Cross-interest students (like Aisha Khan with Python + Web Dev + AI/ML) appear in multiple clusters' results, which is the correct behavior

### 5.4 Algorithm Validation

| Validation Criteria | Result |
|----|--------|
| In-cluster scores > Out-cluster scores | PASS for all 9 clusters |
| Top-1 match from same cluster | YES for majority of clusters |
| Top-3 includes cluster members | 2-3 out of 3 for most clusters |
| Rare interest bonus works | Verified (FPGA, Verilog users score higher together) |
| Cross-interest students handled | Correctly appear in multiple cluster results |
| Edge case: single-tag user | Handled gracefully (lower scores distributed evenly) |
| Edge case: no tags | Returns empty with helpful tip message |

---

## 6. Screenshots — Step-by-Step Feature Walkthrough

### 6.1 Landing Page
Open `http://localhost:5173` — the Campus Hive landing page with sign-in options.

### 6.2 Login
Click "Sign In" → Enter email and password → Click "Sign In".

### 6.3 Vibe Matcher — User Profile
After login, click "Vibe Matcher" in sidebar. Shows user tags and "Find My Vibe Matches" button.

### 6.4 Vibe Matcher — ML Results
Click "Find My Vibe Matches". The ML algorithm processes 49 profiles and returns ranked matches with:
- **Match percentage** (color-coded: green > 60%, yellow > 40%, red < 40%)
- **Shared tags** displayed as pills
- **Factor badges**: Same Branch, Same Year, Same Section
- **AI Insight**: Fun compatibility sentence generated by AI

### 6.5 Smart Polls — AI Consensus
Navigate to Smart Polls to see active polls with live vote percentages and AI Insight button.

### 6.6 Event Planner — Kanban Tasks
Navigate to Event Planner for Kanban-style task management with progress tracking.

### 6.7 Safety Shield — Anonymous Reporting
Navigate to Safety Shield for anonymous incident reporting with severity levels.

### 6.8 Admin Panel — Full Control
Access `http://localhost:8000/admin/` with admin credentials to manage all 9 models.

---

## 7. Admin Panel Guide

### How to Access
1. Navigate to `http://localhost:8000/admin/`
2. Login with: **admin@campushive.com** / **admin123**

### What You Can Do

| Section | Actions |
|---------|---------|
| **Users** | View all students/admins, filter by role/branch/year, activate/deactivate |
| **Groups** | Manage clubs, departments, study groups |
| **Polls + Options** | View poll questions, vote counts, AI insights |
| **Votes** | See who voted, their reasons, timestamps |
| **Events + Tasks** | Track events, manage Kanban tasks, update status |
| **Incidents** | Review severity, update status (Reported→Reviewing→Resolved) |
| **Activity Logs** | Read-only audit trail of every user action (login, signup, vote, etc.) |

### Activity Log Tracking
Every user action is automatically logged:
- Login/Signup with IP address
- Profile updates (which fields changed)
- Group creations
- Poll votes (with reason)
- Vibe match requests (score of top match)
- Event task status changes
- Incident reports

---

## 8. API Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register, returns JWT |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get profile (requires token) |
| PUT | `/api/auth/me/update` | Update profile |

### Vibe Matcher
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vibe/matches` | ML-powered match results |
| GET | `/api/vibe/score` | Get vibe score |
| POST | `/api/vibe/tags` | Update interest tags |

### Groups, Polls, Events, Incidents
Full CRUD endpoints available — see `GUIDE.md` for complete reference.

---

## 9. Database Schema

| Model | Key Fields | Table |
|-------|-----------|-------|
| User | email, name, branch, section, year, tags (JSON), role, vibe_score | ch_users |
| Group | name, type, description, admin (FK→User) | ch_groups |
| Poll | question, group (FK), created_by (FK), is_active | ch_polls |
| PollOption | text, poll (FK) | ch_poll_options |
| Vote | poll (FK), option (FK), user (FK), reason | ch_votes |
| Event | title, description, budget, group (FK), created_by (FK) | ch_events |
| EventTask | title, priority, status, event (FK), assigned_to (FK) | ch_event_tasks |
| Incident | severity, description, location, status, reported_by (nullable) | ch_incidents |
| ActivityLog | user (FK), action, details, ip_address, timestamp | ch_activity_logs |

---

## 10. How to Run

### Prerequisites
- Python 3.13+
- Node.js 22+
- Git

### Quick Start
```batch
cd campus-hive
batch\setup_backend.bat      :: Install deps, migrate DB, create admin
batch\setup_frontend.bat     :: Install npm packages
batch\start_all.bat          :: Launch Django (8000) + Vite (5173)
```

### Access Points
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Admin Panel | http://localhost:8000/admin/ |
| API | http://localhost:8000/api/ |

### Default Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@campushive.com | admin123 |
| Student | student01@campushive.com | test123 |

---

## 11. Testing Summary

| Test Area | Tests | Result |
|-----------|-------|--------|
| API Endpoints (Auth, CRUD, Vibe, Incidents) | 30 | All PASS |
| Admin Panel (Login, Models, Filters) | Manual | PASS |
| Frontend (Login, Vibe, Polls, Events, Safety) | Manual | PASS |
| ML Accuracy (9 clusters, 50 users) | 9 | All PASS |
| JWT Authentication Flow | 3 | All PASS |
| Duplicate Vote Prevention | 1 | PASS |
| Anonymous Reporting | 2 | PASS |

---

## 12. Architecture Diagram

```
┌─────────────────────┐     ┌────────────────────────┐
│  React Frontend     │     │  Django Admin Panel     │
│  (Vite + TypeScript)│     │  http://localhost:8000  │
│  Port: 5173         │     │  /admin/                │
└────────┬────────────┘     └───────────┬────────────┘
         │ API Proxy                    │
         │ /api/* → :8000              │
         ├──────────────────────────────┤
         │                              │
    ┌────▼──────────────────────────────▼────┐
    │       Django REST Framework             │
    │       JWT Auth (SimpleJWT)              │
    │       9 API View Modules                │
    ├─────────────────────────────────────────┤
    │                                         │
    │  ┌─────────────┐  ┌─────────────────┐  │
    │  │ Vibe Matcher │  │  AI      │  │
    │  │ TF-IDF +     │  │  Poll Summary   │  │
    │  │ Cosine Sim   │  │  Event Tasks    │  │
    │  │ + Weighted   │  │  Vibe Insights  │  │
    │  └─────────────┘  └─────────────────┘  │
    │                                         │
    ├─────────────────────────────────────────┤
    │       Django ORM (9 Models)             │
    └───────────────┬─────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │  PostgreSQL (Prod)  │
         │  SQLite (Dev)       │
         └─────────────────────┘
```
