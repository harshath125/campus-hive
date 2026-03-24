"""
Campus Hive — ML Vibe Matcher Accuracy Test
Tests the TF-IDF + Cosine Similarity algorithm across 50 users with known clusters.
Validates that in-cluster matches score higher than cross-cluster matches.
"""
import os, sys, django, json
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campus_hive.settings")
django.setup()

import requests

BASE = "http://localhost:8000"

# Define expected clusters for accuracy validation
CLUSTERS = {
    "AI/ML":       ["student01", "student02", "student03", "student04", "student05", "student06", "student07"],
    "Web Dev":     ["student08", "student09", "student10", "student11", "student12", "student13", "student14"],
    "Comp Prog":   ["student15", "student16", "student17", "student18", "student19", "student20"],
    "Creative":    ["student21", "student22", "student23", "student24", "student25"],
    "DevOps":      ["student26", "student27", "student28", "student29"],
    "Security":    ["student30", "student31", "student32"],
    "Mobile":      ["student33", "student34", "student35"],
    "IoT/HW":      ["student36", "student37", "student38", "student39"],
    "Data":        ["student40", "student41", "student42"],
}

# Build reverse lookup: email prefix -> cluster name
EMAIL_TO_CLUSTER = {}
for cluster, members in CLUSTERS.items():
    for m in members:
        EMAIL_TO_CLUSTER[f"{m}@campushive.com"] = cluster

print("=" * 70)
print("VIBE MATCHER ML ACCURACY TEST — 50 Users, 9 Clusters")
print("=" * 70)

# Test 10 representative users from different clusters
TEST_USERS = [
    ("student01@campushive.com", "AI/ML"),      # Arjun Reddy
    ("student08@campushive.com", "Web Dev"),     # Divya Menon
    ("student15@campushive.com", "Comp Prog"),   # Harsh Agarwal
    ("student21@campushive.com", "Creative"),    # Ishaan Kapoor
    ("student26@campushive.com", "DevOps"),      # Manish Tiwari
    ("student30@campushive.com", "Security"),    # Rahul Chauhan
    ("student33@campushive.com", "Mobile"),      # Akash Gupta
    ("student36@campushive.com", "IoT/HW"),      # Raj Malhotra
    ("student40@campushive.com", "Data"),         # Nitin Agarwal
    ("student43@campushive.com", "Cross"),        # Aisha Khan (cross-interest)
]

all_results = []
total_in_cluster_correct = 0
total_in_cluster_checks = 0
total_top3_correct = 0
score_distributions = {}

for email, expected_cluster in TEST_USERS:
    # Login
    r = requests.post(f"{BASE}/api/auth/login", json={"email": email, "password": "test123"}, timeout=10)
    if r.status_code != 200:
        print(f"  [SKIP] Cannot login: {email}")
        continue

    token = r.json().get("access_token", "")
    auth = {"Authorization": f"Bearer {token}"}

    # Get matches
    r2 = requests.get(f"{BASE}/api/vibe/matches", headers=auth, timeout=30)
    if r2.status_code != 200:
        print(f"  [SKIP] Matches failed for {email}: {r2.status_code}")
        continue

    data = r2.json()
    matches = data.get("matches", [])
    user_name = email.split("@")[0]
    user_display = f"{data.get('user', {}).get('name', user_name)} ({expected_cluster})"

    print(f"\n--- {user_display} ---")
    print(f"  Tags: {data.get('user', {}).get('tags', [])}")
    print(f"  Total matches: {len(matches)}")

    # Analyze top 5
    top5_clusters = []
    for i, m in enumerate(matches[:5]):
        match_email = m.get("user", {}).get("email", "")
        match_cluster = EMAIL_TO_CLUSTER.get(match_email, "Unknown")
        match_name = m.get("user", {}).get("name", "?")
        score = m.get("score", 0)
        common = m.get("common_tags", [])
        in_cluster = "+++" if match_cluster == expected_cluster else ""
        top5_clusters.append(match_cluster)
        print(f"  #{i+1}: {match_name:20s} | {score:5.1f}% | {match_cluster:10s} {in_cluster} | {', '.join(common[:3])}")

    # Score analysis
    if matches:
        scores = [m["score"] for m in matches]
        in_cluster_scores = [m["score"] for m in matches if EMAIL_TO_CLUSTER.get(m["user"]["email"]) == expected_cluster]
        out_cluster_scores = [m["score"] for m in matches if EMAIL_TO_CLUSTER.get(m["user"]["email"]) != expected_cluster]

        avg_in = sum(in_cluster_scores) / len(in_cluster_scores) if in_cluster_scores else 0
        avg_out = sum(out_cluster_scores) / len(out_cluster_scores) if out_cluster_scores else 0
        max_score = max(scores)
        min_score = min(scores)

        # Check if top match is from same cluster
        top1_cluster = EMAIL_TO_CLUSTER.get(matches[0]["user"]["email"], "Unknown")
        top3_in = sum(1 for m in matches[:3] if EMAIL_TO_CLUSTER.get(m["user"]["email"]) == expected_cluster)

        if top1_cluster == expected_cluster:
            total_in_cluster_correct += 1
        total_in_cluster_checks += 1
        total_top3_correct += top3_in

        print(f"  --- Cluster accuracy ---")
        print(f"  In-cluster avg score: {avg_in:.1f}%")
        print(f"  Out-cluster avg score: {avg_out:.1f}%")
        print(f"  Score range: {min_score:.1f}% - {max_score:.1f}%")
        print(f"  Top-1 same cluster: {'YES' if top1_cluster == expected_cluster else 'NO'}")
        print(f"  Top-3 same cluster: {top3_in}/3")

        score_distributions[expected_cluster] = {
            "in_avg": round(avg_in, 1),
            "out_avg": round(avg_out, 1),
            "max": round(max_score, 1),
            "top1_correct": top1_cluster == expected_cluster,
            "top3_correct": top3_in,
        }

# ======== OVERALL RESULTS ========
print("\n" + "=" * 70)
print("ML VIBE MATCHER — ACCURACY SUMMARY")
print("=" * 70)

print(f"\n  Top-1 Accuracy: {total_in_cluster_correct}/{total_in_cluster_checks}")
print(f"  Top-3 In-Cluster: {total_top3_correct}/{total_in_cluster_checks * 3}")

if total_in_cluster_checks > 0:
    top1_pct = (total_in_cluster_correct / total_in_cluster_checks) * 100
    top3_pct = (total_top3_correct / (total_in_cluster_checks * 3)) * 100
    print(f"  Top-1 Rate: {top1_pct:.0f}%")
    print(f"  Top-3 Rate: {top3_pct:.0f}%")

print("\n  Per-Cluster Breakdown:")
print(f"  {'Cluster':12s} | {'In-Avg':7s} | {'Out-Avg':7s} | {'Max':5s} | Top-1 | Top-3")
print(f"  {'-'*12}-+-{'-'*7}-+-{'-'*7}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}")
for cluster, stats in score_distributions.items():
    t1 = "YES" if stats["top1_correct"] else "NO"
    print(f"  {cluster:12s} | {stats['in_avg']:5.1f}% | {stats['out_avg']:5.1f}% | {stats['max']:4.1f}% | {t1:5s} | {stats['top3_correct']}/3")

print("\n" + "=" * 70)
print("KEY FINDING: In-cluster avg scores should be HIGHER than out-cluster")
in_better = sum(1 for s in score_distributions.values() if s["in_avg"] > s["out_avg"])
print(f"  Clusters with in > out: {in_better}/{len(score_distributions)}")
print("=" * 70)
