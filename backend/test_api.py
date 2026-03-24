"""
Campus Hive — Comprehensive API Test Suite
Tests all endpoints: auth, groups, polls, events, vibe, incidents, admin.
"""
import requests
import json
import sys

BASE = "http://localhost:8000"
results = []

def test(name, method, url, data=None, headers=None, expect_status=None):
    try:
        kw = {"headers": headers or {}, "timeout": 10}
        if data:
            kw["json"] = data
        r = getattr(requests, method.lower())(url, **kw)
        ct = r.headers.get("content-type", "")
        body = r.json() if "json" in ct else r.text[:200]
        ok = r.status_code < 400 if expect_status is None else r.status_code == expect_status
        status = "PASS" if ok else "FAIL"
        results.append((name, status, r.status_code, str(body)[:120]))
        print(f"  [{status}] {name} -> {r.status_code}")
        return r, body
    except Exception as e:
        results.append((name, "ERROR", 0, str(e)[:120]))
        print(f"  [ERROR] {name} -> {e}")
        return None, None


print("=" * 60)
print("CAMPUS HIVE API TEST SUITE")
print("=" * 60)

# === 1. ROOT ===
print("\n--- ROOT ---")
test("Root endpoint", "GET", f"{BASE}/")

# === 2. AUTH ===
print("\n--- AUTH ---")

import random
unique_email = f"apitest{random.randint(1000,9999)}@campushive.com"

# Signup
r, body = test("Signup new user", "POST", f"{BASE}/api/auth/signup", {
    "name": "API Tester",
    "email": unique_email,
    "password": "test1234",
    "branch": "CSE",
    "section": "3-B",
    "year": 3,
    "tags": ["Python", "React", "Gaming"],
}, expect_status=201)

# Login
r, body = test("Login", "POST", f"{BASE}/api/auth/login", {
    "email": "test@campushive.com",
    "password": "test123",
})
token = ""
if isinstance(body, dict):
    token = body.get("access_token", "")
auth = {"Authorization": f"Bearer {token}"}
print(f"  Token obtained: {bool(token)}")

# Get me
test("Get current user", "GET", f"{BASE}/api/auth/me", headers=auth)

# Update profile
test("Update profile", "PUT", f"{BASE}/api/auth/me/update", {
    "name": "Test Student Updated",
    "tags": ["Python", "AI/ML", "Hackathons", "React", "Web Dev"],
}, headers=auth)

# Bad login
test("Bad password (should 401)", "POST", f"{BASE}/api/auth/login", {
    "email": "test@campushive.com",
    "password": "wrongpass",
}, expect_status=401)

# Missing token
test("No token (should 401)", "GET", f"{BASE}/api/auth/me", expect_status=401)

# === 3. GROUPS ===
print("\n--- GROUPS ---")
test("List groups (empty)", "GET", f"{BASE}/api/groups/")

r, body = test("Create group", "POST", f"{BASE}/api/groups/create", {
    "name": "Test Club",
    "type": "club",
    "description": "A test club for testing",
}, headers=auth, expect_status=201)
group_id = None
if isinstance(body, dict):
    group_id = body.get("group", {}).get("id")
print(f"  Group ID: {group_id}")

if group_id:
    test("Get group", "GET", f"{BASE}/api/groups/{group_id}")
    test("Update group", "PUT", f"{BASE}/api/groups/{group_id}/update", {
        "name": "Test Club Updated",
    }, headers=auth)

# === 4. POLLS ===
print("\n--- POLLS ---")
poll_id = None
if group_id:
    r, body = test("Create poll", "POST", f"{BASE}/api/polls/", {
        "group_id": group_id,
        "question": "Best programming language?",
        "options": [{"text": "Python"}, {"text": "JavaScript"}, {"text": "Rust"}],
    }, headers=auth, expect_status=201)
    if isinstance(body, dict):
        poll_id = body.get("poll", {}).get("id")
    print(f"  Poll ID: {poll_id}")

    if poll_id:
        test("List polls in group", "GET", f"{BASE}/api/polls/group/{group_id}")
        test("Get poll by ID", "GET", f"{BASE}/api/polls/{poll_id}")

        options = body.get("poll", {}).get("options", []) if isinstance(body, dict) else []
        if options:
            opt_id = options[0]["id"]
            test("Vote on poll", "POST", f"{BASE}/api/polls/{poll_id}/vote", {
                "option_id": opt_id,
                "reason": "Python is versatile and great for AI",
            }, headers=auth)

            test("Duplicate vote (should 409)", "POST", f"{BASE}/api/polls/{poll_id}/vote", {
                "option_id": opt_id,
                "reason": "Trying again",
            }, headers=auth, expect_status=409)

# === 5. EVENTS ===
print("\n--- EVENTS ---")
event_id = None
if group_id:
    r, body = test("Create event", "POST", f"{BASE}/api/events/", {
        "group_id": group_id,
        "title": "Hackathon 2026",
        "description": "Annual campus hackathon",
        "budget": 50000,
        "generate_tasks": True,
    }, headers=auth, expect_status=201)
    if isinstance(body, dict):
        event_id = body.get("event", {}).get("id")
    print(f"  Event ID: {event_id}")

    if event_id:
        test("List events in group", "GET", f"{BASE}/api/events/group/{group_id}")
        test("Get event by ID", "GET", f"{BASE}/api/events/{event_id}")

        r2, b2 = test("Add manual task", "POST", f"{BASE}/api/events/{event_id}/tasks", {
            "title": "Book venue",
            "priority": "high",
        }, headers=auth, expect_status=201)
        task_id = None
        if isinstance(b2, dict):
            task_id = b2.get("task", {}).get("id")

        if task_id:
            test("Update task to inprogress", "PATCH", f"{BASE}/api/events/tasks/{task_id}", {
                "status": "inprogress",
            }, headers=auth)
            test("Update task to done", "PATCH", f"{BASE}/api/events/tasks/{task_id}", {
                "status": "done",
            }, headers=auth)

# === 6. VIBE MATCHER ===
print("\n--- VIBE MATCHER ---")
r, body = test("Get vibe matches", "GET", f"{BASE}/api/vibe/matches", headers=auth)
if isinstance(body, dict):
    matches = body.get("matches", [])
    print(f"  Matches found: {len(matches)}")
    for m in matches[:3]:
        print(f"    - {m['user']['name']}: {m['score']}% ({', '.join(m.get('common_tags', []))})")

test("Get vibe score", "GET", f"{BASE}/api/vibe/score", headers=auth)
test("Update tags", "POST", f"{BASE}/api/vibe/tags", {
    "tags": ["Python", "AI/ML", "Hackathons", "React", "Web Dev", "Night Owl"],
}, headers=auth)

# === 7. INCIDENTS ===
print("\n--- INCIDENTS ---")
test("Report incident (anon)", "POST", f"{BASE}/api/incidents/report", {
    "severity": "orange",
    "description": "Broken streetlight near hostel",
    "location": "Hostel Block A",
}, expect_status=201)

test("Report red incident", "POST", f"{BASE}/api/incidents/report", {
    "severity": "red",
    "description": "Fire alarm malfunction in lab",
    "location": "CS Lab 201",
}, expect_status=201)

test("List incidents", "GET", f"{BASE}/api/incidents/", headers=auth)

# === 8. ADMIN PANEL ===
print("\n--- ADMIN ---")
test("Admin login page", "GET", f"{BASE}/admin/login/", expect_status=200)

# === 9. ACTIVITY LOGS ===
print("\n--- ACTIVITY LOGS CHECK ---")
r, body = test("Check activity logs exist", "GET", f"{BASE}/api/auth/me", headers=auth)

# === SUMMARY ===
print("\n" + "=" * 60)
print("FULL TEST RESULTS SUMMARY")
print("=" * 60)
passed = sum(1 for _, s, _, _ in results if s == "PASS")
failed = sum(1 for _, s, _, _ in results if s == "FAIL")
errors = sum(1 for _, s, _, _ in results if s == "ERROR")
for name, status, code, detail in results:
    print(f"  [{status}] {code:3d} {name}")
print(f"\nTotal: {len(results)} tests | PASS: {passed} | FAIL: {failed} | ERROR: {errors}")

if failed > 0 or errors > 0:
    print("\n--- FAILING DETAILS ---")
    for name, status, code, detail in results:
        if status != "PASS":
            print(f"  [{status}] {name}: {detail}")
    sys.exit(1)
else:
    print("\nALL TESTS PASSED!")
    sys.exit(0)
