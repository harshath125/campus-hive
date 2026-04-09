"""
Campus Hive - ML Accuracy + AI Feature Test
Validates vibe matcher accuracy with 50 users across 9 clusters.
Tests AI poll summarization and event task generation.
"""
import os, sys, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campus_hive.settings")
django.setup()

import requests, json, traceback

BASE = "http://localhost:8000"

def login(email):
    r = requests.post(f"{BASE}/api/auth/login", json={"email": email, "password": "test123"}, timeout=10)
    return r.json().get("access_token", "")

def test_vibe(email, name, cluster_name, cluster_emails):
    """Test vibe matches for a user and analyze cluster accuracy."""
    token = login(email)
    auth = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE}/api/vibe/matches", headers=auth, timeout=30)
    if r.status_code != 200:
        print(f"  ERROR: {r.status_code} — {r.text[:100]}")
        return None

    data = r.json()
    matches = data.get("matches", [])
    tags = data.get("your_tags", [])
    algo = data.get("algorithm", "unknown")

    print(f"\n{'='*55}")
    print(f"{name} ({cluster_name})")
    print(f"{'='*55}")
    print(f"  Tags: {tags}")
    print(f"  Algorithm: {algo}")
    print(f"  Total matches: {len(matches)}")

    print(f"\n  TOP 5 MATCHES:")
    for i, m in enumerate(matches[:5]):
        u = m.get("user", {})
        mname = u.get("name", "?")
        mscore = m.get("score", 0)
        mbranch = u.get("branch", "")
        common = m.get("common_tags", [])
        insight = m.get("insight", "")
        print(f"    #{i+1}: {mname:20s} | {mscore:5.1f}% | {mbranch:4s} | Shared: {common}")
        if insight and i < 3:
            print(f"         AI: {insight[:70]}")

    # Cluster accuracy
    own_emails = set(cluster_emails)
    in_scores = [m["score"] for m in matches if m.get("user", {}).get("email") in own_emails]
    out_scores = [m["score"] for m in matches if m.get("user", {}).get("email") not in own_emails]
    avg_in = sum(in_scores) / len(in_scores) if in_scores else 0
    avg_out = sum(out_scores) / len(out_scores) if out_scores else 0
    sep = avg_in - avg_out

    print(f"\n  CLUSTER ACCURACY:")
    print(f"    In-cluster:  avg {avg_in:.1f}% ({len(in_scores)} matches)")
    print(f"    Out-cluster: avg {avg_out:.1f}% ({len(out_scores)} matches)")
    print(f"    Separation:  {sep:+.1f} pts {'[GOOD]' if sep > 0 else '[REVIEW]'}")

    # Top-3 in-cluster count
    top3_in = sum(1 for m in matches[:3] if m.get("user", {}).get("email") in own_emails)
    print(f"    Top-3 in-cluster: {top3_in}/3")

    return {"in_avg": avg_in, "out_avg": avg_out, "sep": sep, "top3": top3_in, "total": len(matches)}


# ============================================================
print("*" * 60)
print("   CAMPUS HIVE — ML VIBE MATCHER ACCURACY REPORT")
print("   50 Users | 9 Clusters | TF-IDF + Cosine Similarity")
print("*" * 60)

# Cluster definitions
CLUSTERS = {
    "AI/ML":    ([f"student{i:02d}@campushive.com" for i in range(1, 8)], "student01@campushive.com", "Arjun Reddy"),
    "Web Dev":  ([f"student{i:02d}@campushive.com" for i in range(8, 15)], "student08@campushive.com", "Divya Menon"),
    "CompProg": ([f"student{i:02d}@campushive.com" for i in range(15, 21)], "student15@campushive.com", "Harsh Agarwal"),
    "Creative": ([f"student{i:02d}@campushive.com" for i in range(21, 26)], "student21@campushive.com", "Ishaan Kapoor"),
    "DevOps":   ([f"student{i:02d}@campushive.com" for i in range(26, 30)], "student26@campushive.com", "Manish Tiwari"),
    "Security": ([f"student{i:02d}@campushive.com" for i in range(30, 33)], "student30@campushive.com", "Rahul Chauhan"),
    "Mobile":   ([f"student{i:02d}@campushive.com" for i in range(33, 36)], "student33@campushive.com", "Akash Gupta"),
    "IoT/HW":   ([f"student{i:02d}@campushive.com" for i in range(36, 40)], "student36@campushive.com", "Raj Malhotra"),
    "Data":     ([f"student{i:02d}@campushive.com" for i in range(40, 43)], "student40@campushive.com", "Nitin Agarwal"),
}

results = {}
for cname, (emails, test_email, test_name) in CLUSTERS.items():
    r = test_vibe(test_email, test_name, cname, emails)
    if r:
        results[cname] = r

# Also test cross-interest user
cross_emails = [f"student{i:02d}@campushive.com" for i in range(43, 50)]
r_cross = test_vibe("student43@campushive.com", "Aisha Khan", "Cross-Interest", cross_emails)

# ============================================================
print("\n\n" + "=" * 60)
print("OVERALL ACCURACY SUMMARY")
print("=" * 60)
print(f"\n{'Cluster':12s} | {'In-Avg':7s} | {'Out-Avg':7s} | {'Sep':7s} | Top-3")
print(f"{'-'*12}-+-{'-'*7}-+-{'-'*7}-+-{'-'*7}-+-{'-'*5}")
correct = 0
for cname, stats in results.items():
    ok = stats["sep"] > 0
    if ok:
        correct += 1
    print(f"{cname:12s} | {stats['in_avg']:5.1f}% | {stats['out_avg']:5.1f}% | {stats['sep']:+5.1f}% | {stats['top3']}/3 {'[OK]' if ok else ''}")

total = len(results)
print(f"\nClusters with correct separation: {correct}/{total} ({correct/total*100:.0f}%)")
avg_sep = sum(r["sep"] for r in results.values()) / total if total else 0
print(f"Average in/out separation: {avg_sep:+.1f} percentage points")

# ============================================================
print("\n\n" + "=" * 60)
print("AI — POLL SUMMARIZATION TEST")
print("=" * 60)
from core.models import Poll, Vote
from core.utils.ai_utils import generate_poll_summary

poll = Poll.objects.first()
if poll:
    print(f"Poll: {poll.question}")
    votes_data = []
    for v in Vote.objects.filter(poll=poll).select_related("option"):
        votes_data.append({"option": v.option.text, "reason": v.reason or ""})
    print(f"Votes: {len(votes_data)}")
    for vd in votes_data:
        print(f"  - {vd['option']}: {vd['reason']}")
    try:
        summary = generate_poll_summary(poll.question, votes_data)
        print(f"\nAI Summary: {summary}")
    except Exception as e:
        print(f"\nAI Summary (fallback): {e}")

# ============================================================
print("\n\n" + "=" * 60)
print("AI — EVENT TASK GENERATION TEST")
print("=" * 60)
from core.utils.ai_utils import generate_event_tasks
try:
    tasks = generate_event_tasks("Annual Tech Fest 2026", "3-day tech festival with workshops, hackathon, guest lectures, and prize pool of 2 lakhs", 200000)
    print(f"Generated {len(tasks)} tasks:")
    for t in tasks:
        print(f"  [{t.get('priority', 'medium'):6s}] {t.get('title', '?')}")
except Exception as e:
    print(f"AI Tasks (fallback): {e}")

print("\n" + "=" * 60)
print("ALL FEATURE TESTS COMPLETE")
print("=" * 60)
