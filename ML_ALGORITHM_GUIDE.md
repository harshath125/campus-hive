# 🧠 ML Vibe Matching Algorithm — Technical Guide

> How Campus Hive finds your perfect study buddy using Machine Learning

---

## 1. Overview

The **Vibe Matcher** is Campus Hive's core ML feature. It analyzes student interest tags, academic metadata, and behavioral signals to find the most compatible students for collaboration.

**Algorithm**: TF-IDF + Cosine Similarity + Weighted Multi-Factor Scoring

**File**: [`backend/core/utils/vibe_algorithm.py`](backend/core/utils/vibe_algorithm.py)

---

## 2. How the Algorithm Works (Step by Step)

### Step 1: Collect User Tags
Every student selects interest tags during signup (e.g., `Python`, `AI/ML`, `Hackathons`, `Night Owl`). These tags are stored as a JSON array in the `ch_users` table.

```
User A tags: ["Python", "AI/ML", "Hackathons", "Night Owl", "Chess"]
User B tags: ["Python", "AI/ML", "Data Science", "Kaggle", "NLP"]
User C tags: ["React", "JavaScript", "Web Dev", "Tailwind CSS", "Node.js"]
```

### Step 2: Build TF-IDF Vectors (for ALL users at once)
**TF-IDF** (Term Frequency–Inverse Document Frequency) converts tags into weighted numerical vectors.

```
TF (Term Frequency) = count of tag / total tags for that user
IDF (Inverse Document Frequency) = log(N / number of users with that tag) + 1
TF-IDF = TF × IDF
```

**Why TF-IDF?** It prioritizes **rare shared interests**. If 40 out of 50 students have "Python", it gets a low weight. But if only 3 students have "Robotics", that shared interest is much more meaningful.

```python
# Example TF-IDF computation (simplified)
# 50 students total, 30 have "Python", 3 have "Robotics"
#
# "Python" IDF  = log(50/30) + 1 = 1.51  (common → low weight)
# "Robotics" IDF = log(50/3)  + 1 = 3.81  (rare → high weight)
```

### Step 3: Compute Cosine Similarity
Cosine Similarity measures the angle between two TF-IDF vectors. A score of 1.0 = identical interests, 0.0 = completely different.

```
                    A · B
cos(θ) = ─────────────────────
          ||A|| × ||B||

Where:
  A · B     = sum of products of matching tag weights
  ||A||     = magnitude (length) of vector A
  ||B||     = magnitude (length) of vector B
```

### Step 4: Blend with Jaccard Similarity
Jaccard measures raw overlap: `|A ∩ B| / |A ∪ B|`. We blend both:

```
Tag Score = (0.6 × TF-IDF Cosine) + (0.4 × Jaccard)
```

This gives the best of both worlds — TF-IDF rewards rare shared interests while Jaccard ensures overall overlap matters.

### Step 5: Multi-Factor Weighted Score (0–100)

| Factor | Weight | How It's Scored |
|--------|--------|-----------------|
| **Tag Similarity** | 50% | TF-IDF + Jaccard blend |
| **Branch Match** | 15% | Same branch (CSE, IT, ECE) = 100%, different = 0% |
| **Year Proximity** | 15% | Same year = 100%, ±1 = 70%, ±2 = 40%, ±3+ = 10% |
| **Section Match** | 10% | Same section = 100%, different = 0% |
| **Shared Tag Count** | 10% | Each shared tag = 25% (capped at 100%) |

```python
final_score = (
    tag_score      × 0.50 +    # Most important
    branch_score   × 0.15 +    # Collaboration proximity
    year_score     × 0.15 +    # Peer cohort relevance
    section_score  × 0.10 +    # Class proximity
    tag_count_bonus × 0.10     # Raw overlap bonus
)
```

### Step 6: Rank & Return Top 10
Results are sorted by score (descending). The top 10 matches are returned with:
- Match score (0–100)
- Common tags list
- Match factor breakdown
- AI-generated compatibility insight

---

## 3. Seed Data — 50 Test Students

**File**: [`backend/seed_data.py`](backend/seed_data.py)

The seed data creates **50 diverse students** organized into **9 clusters** to test algorithm accuracy:

| Cluster | Students | Key Tags | Expected Behavior |
|---------|----------|----------|-------------------|
| **1. AI/ML Enthusiasts** | 7 | Python, AI/ML, Deep Learning | Should match strongly within cluster |
| **2. Web Dev Wizards** | 7 | React, JavaScript, Web Dev | Strong intra-cluster matching |
| **3. Competitive Programmers** | 6 | DSA, C++, LeetCode | Year 4 students, tight cluster |
| **4. Creative & Design** | 5 | UI/UX, Photography, Design | Cross-branch (CSE, ECE, ME) |
| **5. DevOps & Cloud** | 4 | Docker, AWS, Kubernetes | Should match with Web Dev partially |
| **6. Cybersecurity** | 3 | Ethical Hacking, CTF | Niche cluster, clear separation |
| **7. Mobile App Dev** | 3 | Flutter, Android, React Native | Some overlap with Web Dev |
| **8. Hardware & IoT** | 4 | Arduino, IoT, Embedded | ECE/EEE students only |
| **9. Data & Analytics** | 3 | SQL, Tableau, Data Science | Partial overlap with AI/ML |
| **Cross-Interest** | 8 | Mixed tags | Tests edge cases and blur |

### How to Run Seed Data

```bash
cd backend
python seed_data.py
```

This creates:
- 50 student accounts (`student01@campushive.com` to `student50@campushive.com`, password: `test123`)
- 1 admin account (`admin@campushive.com`, password: `admin123`)
- 3 sample groups, 2 polls with votes, 2 events with tasks, 3 incidents

---

## 4. Testing Algorithm Accuracy

### Manual Test
Login as `student01@campushive.com` (Arjun Reddy — AI/ML cluster):
1. Go to **Vibe Matcher** → Click **Find My Vibes**
2. Top matches should be other AI/ML students (Priya, Ravi, Ananya) with 70–90% scores
3. Web Dev students should appear lower (30–50%)
4. IoT/Hardware students should be even lower (<30%)

### Verification Checklist

| Test Case | Expected Result |
|-----------|-----------------|
| AI/ML student matches | Top 5 are AI/ML cluster members |
| Branch bonus works | Same-branch students score higher |
| Year proximity works | Same-year students score higher than ±2 years |
| Rare tag boost | "Robotics" shared interest scores higher than "Python" |
| Cross-interest students | Appear in multiple cluster results |
| No self-match | User never appears in their own results |

---

## 5. How This Helps the Project

### For Project Showcase:
- **"Our ML algorithm processes all 50 students simultaneously using TF-IDF vectorization — this is the same technique used by Google Search"**
- **"We blend Cosine Similarity with 4 additional weighted factors for 5-dimensional matching"**
- **"The algorithm prioritizes RARE shared interests over common ones — if everyone knows Python, it won't inflate your score"**

### Key Technical Highlights:
1. **Batch TF-IDF** — Vectors computed for all users at once (O(n) efficiency, not O(n²))
2. **Multi-Factor Scoring** — Not just tags, but branch, year, section all contribute
3. **AI Insight Layer** — Each match gets an AI-generated compatibility sentence
4. **Real ML Pipeline** — This is actual NLP (TF-IDF + Cosine Sim), not random matching

---

## 6. Algorithm Flow Diagram

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│  User Signs  │────▶│  Tags Stored  │────▶│  TF-IDF Vectors  │
│  Up + Tags   │     │  in Database  │     │  Computed (ALL)   │
└──────────────┘     └───────────────┘     └────────┬─────────┘
                                                     │
                                                     ▼
                                          ┌──────────────────┐
                                          │  Cosine Sim +    │
                                          │  Jaccard Blend   │
                                          │  (60/40 split)   │
                                          └────────┬─────────┘
                                                     │
                     ┌───────────────────────────────┼──────────────────────┐
                     ▼                               ▼                      ▼
              ┌─────────────┐               ┌──────────────┐        ┌────────────┐
              │ Branch Match │               │ Year Proxim. │        │ Section +  │
              │   (15%)     │               │    (15%)     │        │ Tag Count  │
              └──────┬──────┘               └──────┬───────┘        │  (10%+10%) │
                     │                              │                └──────┬─────┘
                     └──────────────┬───────────────┘                       │
                                    ▼                                       │
                           ┌────────────────┐                               │
                           │  Final Score   │◀──────────────────────────────┘
                           │  (0 – 100%)   │
                           └───────┬────────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │  Top 10 Ranked │
                           │  + AI Insight  │
                           └────────────────┘
```

---

*📁 Source: `backend/core/utils/vibe_algorithm.py` (246 lines)*
