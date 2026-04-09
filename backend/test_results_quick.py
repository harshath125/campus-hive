# -*- coding: utf-8 -*-
"""Quick ML accuracy results + AI test"""
import os, sys, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campus_hive.settings")
django.setup()
import requests

BASE = "http://localhost:8000"

def login(e):
    r = requests.post(BASE + "/api/auth/login", json={"email": e, "password": "test123"}, timeout=10)
    return r.json().get("access_token", "")

def get_matches(e):
    t = login(e)
    r = requests.get(BASE + "/api/vibe/matches", headers={"Authorization": "Bearer " + t}, timeout=30)
    return r.json() if r.status_code == 200 else {}

CLUSTERS = {
    "AI/ML":      (range(1, 8),   "student01@campushive.com"),
    "Web Dev":    (range(8, 15),  "student08@campushive.com"),
    "Comp Prog":  (range(15, 21), "student15@campushive.com"),
    "Creative":   (range(21, 26), "student21@campushive.com"),
    "DevOps":     (range(26, 30), "student26@campushive.com"),
    "Security":   (range(30, 33), "student30@campushive.com"),
    "Mobile":     (range(33, 36), "student33@campushive.com"),
    "IoT/HW":     (range(36, 40), "student36@campushive.com"),
    "Data":       (range(40, 43), "student40@campushive.com"),
}

print("=" * 70)
print("CAMPUS HIVE ML VIBE MATCHER - CLUSTER ACCURACY REPORT")
print("50 Users | 9 Clusters | TF-IDF + Cosine Similarity")
print("=" * 70)

results = {}
for cname, (rng, email) in CLUSTERS.items():
    own = set("student%02d@campushive.com" % i for i in rng)
    data = get_matches(email)
    matches = data.get("matches", [])
    if not matches:
        print("%-10s | NO MATCHES" % cname)
        continue
    ins = [m["score"] for m in matches if m.get("user", {}).get("email") in own]
    outs = [m["score"] for m in matches if m.get("user", {}).get("email") not in own]
    ai = sum(ins) / len(ins) if ins else 0
    ao = sum(outs) / len(outs) if outs else 0
    sep = ai - ao
    t1_email = matches[0].get("user", {}).get("email", "")
    t1 = t1_email in own
    t3 = sum(1 for m in matches[:3] if m.get("user", {}).get("email") in own)
    ok = sep > 0
    results[cname] = {"in_avg": ai, "out_avg": ao, "sep": sep, "top1": t1, "top3": t3, "ok": ok, "total": len(matches)}

print()
print("%-10s | %7s | %7s | %7s | %5s | %5s" % ("Cluster", "In-Avg", "Out-Avg", "Sep", "Top-1", "Top-3"))
print("-" * 60)
for cname, s in results.items():
    mark = "[OK]" if s["ok"] else ""
    print("%-10s | %5.1f%% | %5.1f%%  | %+5.1f%% | %5s | %d/3 %s" % (
        cname, s["in_avg"], s["out_avg"], s["sep"],
        "YES" if s["top1"] else "no", s["top3"], mark))

correct = sum(1 for s in results.values() if s["ok"])
total = len(results)
print()
print("Cluster accuracy: %d/%d (%d%%)" % (correct, total, (correct * 100 // total) if total else 0))
avg_sep = sum(s["sep"] for s in results.values()) / total if total else 0
print("Average separation: %+.1f percentage points" % avg_sep)

# Show Arjun Reddy top 5
print()
print("=" * 70)
print("ARJUN REDDY (AI/ML) - TOP 5 DETAILED MATCHES")
print("=" * 70)
data1 = get_matches("student01@campushive.com")
for i, m in enumerate(data1.get("matches", [])[:5]):
    u = m.get("user", {})
    n = u.get("name", "?")
    sc = m.get("score", 0)
    br = u.get("branch", "")
    yr = u.get("year", "")
    ct = m.get("common_tags", [])
    ins = m.get("insight", "")
    print("  #%d: %-20s %5.1f%% | %s Y%s | Shared: %s" % (i + 1, n, sc, br, yr, ct))
    if ins:
        safe_ins = ins.encode("ascii", "replace").decode("ascii")
        print("     -> %s" % safe_ins[:80])

# Show Divya Menon top 5
print()
print("=" * 70)
print("DIVYA MENON (Web Dev) - TOP 5 DETAILED MATCHES")
print("=" * 70)
data2 = get_matches("student08@campushive.com")
for i, m in enumerate(data2.get("matches", [])[:5]):
    u = m.get("user", {})
    print("  #%d: %-20s %5.1f%% | %s Y%s | Shared: %s" % (
        i + 1, u.get("name", "?"), m.get("score", 0),
        u.get("branch", ""), u.get("year", ""),
        m.get("common_tags", [])))

# AI test
print()
print("=" * 70)
print("AI TEST")
print("=" * 70)
from core.models import Poll, Vote
from core.utils.ai_utils import generate_poll_summary, generate_event_tasks

poll = Poll.objects.first()
if poll:
    votes = []
    for v in Vote.objects.filter(poll=poll).select_related("option"):
        votes.append({"option": v.option.text, "reason": v.reason or ""})
    print("Poll: %s (%d votes)" % (poll.question, len(votes)))
    try:
        summary = generate_poll_summary(poll.question, votes)
        safe_summary = summary.encode("ascii", "replace").decode("ascii")
        print("AI Summary: %s" % safe_summary)
    except Exception as e:
        print("AI Error: %s" % str(e)[:100])

try:
    tasks = generate_event_tasks("Tech Fest", "Hackathon and workshops", 100000)
    print("AI Tasks generated: %d" % len(tasks))
    for t in tasks[:3]:
        print("  [%s] %s" % (t.get("priority", "med"), t.get("title", "?")))
except Exception as e:
    print("AI Tasks Error: %s" % str(e)[:100])

print()
print("ALL TESTS COMPLETE")
