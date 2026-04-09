# 🤖 AI Features Guide — Polls & Event Planner

> How Campus Hive uses AI for Smart Poll Insights and Intelligent Event Planning

---

## 1. Overview

Campus Hive integrates **Google's Generative AI** for two key features:

| Feature | What It Does | API Endpoint |
|---------|-------------|--------------|
| **Smart Poll Insights** | Analyzes voting reasons and generates collective insight | `POST /api/ai/poll-insight` |
| **AI Event Planner** | Generates custom Kanban task lists from event descriptions | `POST /api/ai/generate-tasks` |

**File**: [`backend/core/utils/ai_utils.py`](backend/core/utils/ai_utils.py)

---

## 2. Smart Poll Insights — How It Works

### The Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  User Creates │────▶│ User Votes + │────▶│  Reasons Stored  │
│  a Poll       │     │ Gives Reason │     │  in ch_votes DB  │
└──────────────┘     └──────────────┘     └────────┬─────────┘
                                                    │
                                                    ▼ (after 3+ votes)
                                          ┌──────────────────┐
                                          │  ALL reasons     │
                                          │  fetched from DB │
                                          └────────┬─────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │  AI API called   │
                                          │  with prompt     │
                                          └────────┬─────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │  Insight saved   │
                                          │  to ch_polls DB  │
                                          │  (ai_insight)    │
                                          └──────────────────┘
```

### Step-by-Step Process

#### 1. Poll Creation
```
POST /api/polls/create
{
  "group_id": 1,
  "question": "Which ML framework is best for beginners?",
  "options": ["TensorFlow", "PyTorch", "Scikit-learn", "Keras"]
}
```
Creates a poll in `ch_polls` table with options in `ch_poll_options`.

#### 2. Voting with Reasons
```
POST /api/polls/{poll_id}/vote
{
  "option_id": 3,
  "reason": "Scikit-learn has the simplest API and best documentation for beginners"
}
```

Each vote is stored in `ch_votes` table:
| Column | Data |
|--------|------|
| `poll_id` | Reference to the poll |
| `option_id` | Which option was chosen |
| `user_id` | Who voted |
| `reason` | **Why they voted** (this is the AI input!) |
| `created_at` | Timestamp |

#### 3. AI Trigger (Automatic after 3+ votes)
When a poll reaches **3 or more votes**, the system automatically:

```python
# From poll_views.py (line 115-120)
if poll.total_votes >= 3 and not poll.ai_insight:
    all_reasons = list(Vote.objects.filter(poll=poll).values_list("reason", flat=True))
    insight = summarize_poll_reasons(all_reasons)
    if insight:
        poll.ai_insight = insight
        poll.save()
```

#### 4. AI Prompt
The AI receives ALL voting reasons and generates 3 bullet-point insights:

```
Prompt to AI:
"Analyze these voting reasons from a student campus poll and give exactly 3 bullet points
summarizing the main themes and sentiments. Be concise and insightful.

Voting Reasons:
- Great for production
- Better for research
- Easy to learn
- Perfect for beginners
- Industry standard
- Best docs
- Most flexible

Format:
• [Majority opinion insight]
• [Minority view or concern]
• [Possible compromise or action item]"
```

#### 5. Result
The AI returns structured insights like:
```
• Most students prioritize ease of learning and documentation quality
• A minority values research capabilities and flexibility over simplicity
• Consider starting with Scikit-learn for basics, then graduating to PyTorch for advanced work
```

This is saved to the `ai_insight` column in `ch_polls` and displayed in the UI with an "AI Powered" badge.

### Manual AI Insight (On-Demand)
Users can also click the **"AI Insight"** button in the UI, which calls:
```
POST /api/ai/poll-insight
{ "poll_id": 1 }
```
This triggers the same analysis on-demand, regardless of vote count.

---

## 3. AI Event Planner — How It Works

### The Data Flow

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  User Creates │────▶│  AI API called   │────▶│  Tasks stored    │
│  Event with   │     │  with event desc │     │  in ch_event_    │
│  description  │     │  + team size     │     │  tasks table     │
└──────────────┘     └──────────────────┘     └──────────────────┘
```

### Step-by-Step Process

#### 1. Event Creation with AI Tasks
```
POST /api/events/create
{
  "group_id": 1,
  "title": "AI Hackathon 2026",
  "description": "24-hour AI/ML hackathon with prizes worth 1 lakh",
  "budget": 100000,
  "attendee_count": 150,
  "generate_tasks": true    ← This triggers AI task generation
}
```

#### 2. AI Prompt
```
"Generate a task list for this campus event:

Event: AI Hackathon 2026
Description: 24-hour AI/ML hackathon with prizes worth 1 lakh
Budget: 100000

Team size: 15 people

Return ONLY a valid JSON array of 5-8 tasks:
[
  {"title": "Task Name", "description": "Brief description", "priority": "high|medium|low"},
  ...
]
No extra text, just the JSON array."
```

#### 3. AI Response (parsed JSON)
```json
[
  {"title": "Venue & Infrastructure", "description": "Book auditorium, ensure WiFi, power outlets, projectors", "priority": "high"},
  {"title": "Sponsor Outreach", "description": "Contact tech companies for sponsorship and prizes", "priority": "high"},
  {"title": "Judge Panel", "description": "Invite 3-5 industry experts as judges", "priority": "high"},
  {"title": "Registration Portal", "description": "Set up event registration with team formation", "priority": "medium"},
  {"title": "Marketing Campaign", "description": "Social media, posters, WhatsApp groups for promotion", "priority": "medium"},
  {"title": "Catering", "description": "Arrange food, snacks, and beverages for 24-hour event", "priority": "medium"},
  {"title": "Volunteer Briefing", "description": "Recruit and train 10 volunteers for event management", "priority": "low"}
]
```

#### 4. Tasks Saved to Database
Each task is stored in `ch_event_tasks` with:
| Column | Data |
|--------|------|
| `event_id` | Reference to the event |
| `title` | Task name from AI |
| `description` | Task description from AI |
| `priority` | high / medium / low |
| `status` | Starts as "todo" |
| `assigned_to` | NULL (can be assigned later) |

#### 5. Kanban Board
Tasks appear on the **Kanban board** in the frontend with 3 columns:
- **📋 To Do** → **🔄 In Progress** → **✅ Done**

Users can drag tasks between columns, updating status via:
```
PATCH /api/events/task/{task_id}/status
{ "status": "inprogress" }
```

### Fallback (When AI is Unavailable)
If the API key is missing or quota exceeded, the system returns **6 default tasks**:
```python
default_tasks = [
    {"title": "Venue Booking", "description": "Confirm and reserve the venue", "priority": "high"},
    {"title": "Sponsor Outreach", "description": "Contact potential sponsors", "priority": "high"},
    {"title": "Marketing Campaign", "description": "Create social media content", "priority": "medium"},
    {"title": "Catering Arrangements", "description": "Organize food and beverages", "priority": "medium"},
    {"title": "Registration Portal", "description": "Set up online registration", "priority": "high"},
    {"title": "Volunteer Coordination", "description": "Recruit and brief volunteers", "priority": "low"},
]
```

---

## 4. Database Tables Involved

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `ch_polls` | Stores polls | `question`, `ai_insight`, `total_votes` |
| `ch_poll_options` | Poll choices | `text`, `votes` (count) |
| `ch_votes` | Individual votes | `option_id`, `user_id`, `reason` ← **AI input** |
| `ch_events` | Events | `title`, `description`, `budget` |
| `ch_event_tasks` | Kanban tasks | `title`, `description`, `priority`, `status` |

---

## 5. Environment Configuration

```bash
# In backend/.env
GEMINI_API_KEY=your-api-key-here
```

### Getting an API Key
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy the key and paste in `.env`

### Testing AI
```bash
# From the backend directory, with venv activated:
python test_features.py
```

This tests both poll summarization and event task generation.

---

## 6. Key Points for Project Showcase

### What to Highlight:
1. **"Every vote includes a REASON — this is real qualitative data the AI analyzes"**
2. **"The AI doesn't just count votes — it understands WHY students voted and finds consensus"**
3. **"Event tasks are CONTEXT-AWARE — the AI reads your event description and generates relevant tasks, not generic ones"**
4. **"If AI is down, the system still works with smart fallbacks — never crashes"**

### Live Demo Flow:
1. Create a poll in a space → Vote 3+ times with different reasons → Show AI Insight appearing
2. Create an event with a description → Show AI-generated Kanban tasks → Drag a task to "Done"

---

*📁 Source: `backend/core/utils/ai_utils.py` | `backend/core/views/poll_views.py` | `backend/core/views/event_views.py`*
