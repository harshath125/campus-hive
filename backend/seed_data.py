"""
Campus Hive — 50 User Seed Data for ML Vibe Matcher Testing
Creates diverse users with realistic Indian college student profiles.
Tests vibe matching accuracy across different clustering scenarios.
"""
import os, sys, django, json, random
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campus_hive.settings")
django.setup()

from core.models import User, Group, Poll, PollOption, Vote, Event, EventTask, Incident, ActivityLog

# ======== CLEAR OLD TEST DATA ========
print("Clearing old test data...")
User.objects.exclude(email="admin@campushive.com").delete()
Group.objects.all().delete()
Poll.objects.all().delete()
Event.objects.all().delete()
Incident.objects.all().delete()
ActivityLog.objects.all().delete()

# ======== 50 DIVERSE STUDENT PROFILES ========
STUDENTS = [
    # --- CLUSTER 1: AI/ML Enthusiasts (CSE, heavy Python/AI) ---
    {"name": "Arjun Reddy",      "branch": "CSE", "section": "3-A", "year": 3, "tags": ["Python", "AI/ML", "Deep Learning", "Hackathons", "TensorFlow"]},
    {"name": "Priya Sharma",     "branch": "CSE", "section": "3-A", "year": 3, "tags": ["Python", "AI/ML", "Data Science", "Kaggle", "NLP"]},
    {"name": "Ravi Kumar",       "branch": "CSE", "section": "3-A", "year": 3, "tags": ["Python", "Machine Learning", "AI/ML", "Computer Vision", "Research"]},
    {"name": "Ananya Iyer",      "branch": "CSE", "section": "3-B", "year": 3, "tags": ["Python", "AI/ML", "Statistics", "R Programming", "Data Analysis"]},
    {"name": "Vikram Singh",     "branch": "CSE", "section": "3-B", "year": 3, "tags": ["AI/ML", "Deep Learning", "PyTorch", "Python", "Mathematics"]},
    {"name": "Sneha Patil",      "branch": "CSE", "section": "3-A", "year": 3, "tags": ["AI/ML", "Python", "Hackathons", "Open Source", "NLP"]},
    {"name": "Karthik Nair",     "branch": "CSE", "section": "3-B", "year": 3, "tags": ["Python", "AI/ML", "Cloud Computing", "AWS", "Data Engineering"]},

    # --- CLUSTER 2: Web Dev Wizards (CSE/IT, React/Node) ---
    {"name": "Divya Menon",      "branch": "CSE", "section": "2-A", "year": 2, "tags": ["React", "JavaScript", "Web Dev", "Tailwind CSS", "Node.js"]},
    {"name": "Aditya Joshi",     "branch": "IT",  "section": "2-A", "year": 2, "tags": ["React", "TypeScript", "Web Dev", "Next.js", "Firebase"]},
    {"name": "Meera Krishnan",   "branch": "CSE", "section": "2-A", "year": 2, "tags": ["React", "Web Dev", "UI/UX", "Figma", "JavaScript"]},
    {"name": "Rohit Verma",      "branch": "IT",  "section": "2-B", "year": 2, "tags": ["Node.js", "Express", "Web Dev", "MongoDB", "React"]},
    {"name": "Kavya Reddy",      "branch": "CSE", "section": "2-B", "year": 2, "tags": ["Vue.js", "Web Dev", "JavaScript", "CSS", "PHP"]},
    {"name": "Sai Prashanth",    "branch": "IT",  "section": "2-A", "year": 2, "tags": ["React", "Web Dev", "GraphQL", "TypeScript", "Docker"]},
    {"name": "Nisha Gupta",      "branch": "CSE", "section": "2-A", "year": 2, "tags": ["Web Dev", "React", "Python", "Django", "REST APIs"]},

    # --- CLUSTER 3: Competitive Programmers (DSA focused) ---
    {"name": "Harsh Agarwal",    "branch": "CSE", "section": "4-A", "year": 4, "tags": ["DSA", "C++", "Competitive Programming", "LeetCode", "CodeForces"]},
    {"name": "Tanvi Shah",       "branch": "CSE", "section": "4-A", "year": 4, "tags": ["DSA", "C++", "Competitive Programming", "HackerRank", "Algorithms"]},
    {"name": "Deepak Rao",       "branch": "CSE", "section": "4-B", "year": 4, "tags": ["DSA", "Java", "Competitive Programming", "System Design", "LeetCode"]},
    {"name": "Pooja Mishra",     "branch": "IT",  "section": "4-A", "year": 4, "tags": ["DSA", "Python", "Competitive Programming", "Interview Prep", "C++"]},
    {"name": "Suresh Babu",      "branch": "CSE", "section": "4-A", "year": 4, "tags": ["Competitive Programming", "DSA", "C++", "Mathematics", "CodeChef"]},
    {"name": "Lakshmi Devi",     "branch": "CSE", "section": "4-B", "year": 4, "tags": ["DSA", "Algorithms", "C++", "Competitive Programming", "LeetCode"]},

    # --- CLUSTER 4: Creative & Design (Mixed branches) ---
    {"name": "Ishaan Kapoor",    "branch": "CSE", "section": "1-A", "year": 1, "tags": ["UI/UX", "Figma", "Design", "Photography", "Blender"]},
    {"name": "Sia Malhotra",     "branch": "ECE", "section": "1-A", "year": 1, "tags": ["Graphic Design", "Photography", "Video Editing", "Canva", "Photoshop"]},
    {"name": "Aryan Mehta",      "branch": "ME",  "section": "1-B", "year": 1, "tags": ["3D Modeling", "AutoCAD", "Design", "Photography", "Sketching"]},
    {"name": "Ritika Saxena",    "branch": "CSE", "section": "1-A", "year": 1, "tags": ["UI/UX", "Figma", "Web Dev", "Illustration", "CSS"]},
    {"name": "Varun Patel",      "branch": "ECE", "section": "1-B", "year": 1, "tags": ["Music", "Guitar", "Photography", "Video Editing", "Content Creation"]},

    # --- CLUSTER 5: DevOps & Cloud Engineers ---
    {"name": "Manish Tiwari",    "branch": "CSE", "section": "3-A", "year": 3, "tags": ["DevOps", "Docker", "Kubernetes", "AWS", "CI/CD"]},
    {"name": "Swathi Rani",      "branch": "IT",  "section": "3-A", "year": 3, "tags": ["Cloud Computing", "AWS", "DevOps", "Linux", "Terraform"]},
    {"name": "Amit Kumar",       "branch": "CSE", "section": "3-B", "year": 3, "tags": ["DevOps", "Docker", "Jenkins", "AWS", "Python"]},
    {"name": "Priyanka Das",     "branch": "IT",  "section": "3-B", "year": 3, "tags": ["Cloud Computing", "Azure", "DevOps", "Microservices", "Kubernetes"]},

    # --- CLUSTER 6: Cybersecurity ---
    {"name": "Rahul Chauhan",    "branch": "CSE", "section": "4-A", "year": 4, "tags": ["Cybersecurity", "Ethical Hacking", "CTF", "Kali Linux", "Networking"]},
    {"name": "Neha Pandey",      "branch": "IT",  "section": "4-A", "year": 4, "tags": ["Cybersecurity", "Penetration Testing", "Bug Bounty", "OWASP", "Ethical Hacking"]},
    {"name": "Siddharth Jain",   "branch": "CSE", "section": "4-B", "year": 4, "tags": ["Cybersecurity", "CTF", "Cryptography", "Linux", "Forensics"]},

    # --- CLUSTER 7: Mobile App Dev ---
    {"name": "Akash Gupta",      "branch": "CSE", "section": "2-A", "year": 2, "tags": ["Flutter", "Mobile Dev", "Dart", "Firebase", "UI/UX"]},
    {"name": "Megha Srinivas",   "branch": "IT",  "section": "2-B", "year": 2, "tags": ["Android", "Kotlin", "Mobile Dev", "Java", "Firebase"]},
    {"name": "Vivek Sharma",     "branch": "CSE", "section": "2-B", "year": 2, "tags": ["React Native", "Mobile Dev", "JavaScript", "Expo", "REST APIs"]},

    # --- CLUSTER 8: Hardware & IoT (ECE/EEE) ---
    {"name": "Raj Malhotra",     "branch": "ECE", "section": "3-A", "year": 3, "tags": ["IoT", "Arduino", "Raspberry Pi", "Embedded Systems", "C"]},
    {"name": "Anjali Verma",     "branch": "ECE", "section": "3-A", "year": 3, "tags": ["IoT", "Embedded Systems", "VLSI", "Arduino", "Python"]},
    {"name": "Prasad Kulkarni",  "branch": "EEE", "section": "3-B", "year": 3, "tags": ["IoT", "Robotics", "Arduino", "Sensors", "3D Printing"]},
    {"name": "Shruti Nair",      "branch": "ECE", "section": "3-B", "year": 3, "tags": ["VLSI", "Embedded Systems", "Verilog", "FPGA", "IoT"]},

    # --- CLUSTER 9: Data & Analytics ---
    {"name": "Nitin Agarwal",    "branch": "CSE", "section": "4-A", "year": 4, "tags": ["Data Science", "SQL", "Tableau", "Python", "Power BI"]},
    {"name": "Radhika Joshi",    "branch": "IT",  "section": "4-B", "year": 4, "tags": ["Data Analytics", "Excel", "SQL", "Python", "Tableau"]},
    {"name": "Gaurav Pandey",    "branch": "CSE", "section": "4-B", "year": 4, "tags": ["Big Data", "Spark", "Hadoop", "Data Science", "Python"]},

    # --- CROSS-INTEREST STUDENTS (testing edge cases) ---
    {"name": "Aisha Khan",       "branch": "CSE", "section": "3-A", "year": 3, "tags": ["Python", "Web Dev", "AI/ML", "React", "DevOps"]},
    {"name": "Pranav Desai",     "branch": "ME",  "section": "2-A", "year": 2, "tags": ["Python", "AutoCAD", "3D Printing", "IoT", "Arduino"]},
    {"name": "Samira Patel",     "branch": "CE",  "section": "1-A", "year": 1, "tags": ["AutoCAD", "Revit", "Structural Design", "Mathematics", "Sketching"]},
    {"name": "Kunal Bhatt",      "branch": "CSE", "section": "2-A", "year": 2, "tags": ["Blockchain", "Web3", "Solidity", "Cryptocurrency", "JavaScript"]},
    {"name": "Tanya Oberoi",     "branch": "CSE", "section": "1-B", "year": 1, "tags": ["Open Source", "Linux", "Git", "Python", "Blogging"]},
    {"name": "Farhan Ahmed",     "branch": "IT",  "section": "3-A", "year": 3, "tags": ["Game Dev", "Unity", "C#", "Blender", "3D Modeling"]},
    {"name": "Simran Kaur",      "branch": "ECE", "section": "2-A", "year": 2, "tags": ["IoT", "Python", "Machine Learning", "Arduino", "Data Science"]},
]

print(f"Creating {len(STUDENTS)} student profiles...")
users = []
for i, s in enumerate(STUDENTS):
    email = f"student{i+1:02d}@campushive.com"
    u = User.objects.create_user(
        email=email, password="test123",
        name=s["name"], branch=s["branch"],
        section=s["section"], year=s["year"],
        tags=s["tags"]
    )
    users.append(u)
    print(f"  [{i+1:02d}] {s['name']:20s} | {s['branch']:4s} {s['section']:4s} Y{s['year']} | {', '.join(s['tags'][:3])}...")

# ======== RECREATE ADMIN ========
if not User.objects.filter(email="admin@campushive.com").exists():
    User.objects.create_superuser(email="admin@campushive.com", password="admin123", name="Admin")
    print("\nAdmin superuser created")

print(f"\nTotal users: {User.objects.count()}")

# ======== CREATE SAMPLE GROUPS, POLLS, EVENTS, INCIDENTS ========
print("\n--- Creating sample data ---")

g1 = Group.objects.create(name="AI/ML Club", type="club", description="For AI and ML enthusiasts", admin=users[0])
g2 = Group.objects.create(name="Web Dev Society", type="club", description="Frontend and backend developers", admin=users[7])
g3 = Group.objects.create(name="CSE 3rd Year", type="branch", description="CSE Year 3 official group", admin=users[0])
print(f"  Groups created: {Group.objects.count()}")

p1 = Poll.objects.create(group=g1, question="Which ML framework is best for beginners?", created_by=users[0])
PollOption.objects.create(poll=p1, text="TensorFlow")
PollOption.objects.create(poll=p1, text="PyTorch")
PollOption.objects.create(poll=p1, text="Scikit-learn")
PollOption.objects.create(poll=p1, text="Keras")

p2 = Poll.objects.create(group=g2, question="Best frontend framework in 2026?", created_by=users[7])
PollOption.objects.create(poll=p2, text="React")
PollOption.objects.create(poll=p2, text="Vue.js")
PollOption.objects.create(poll=p2, text="Svelte")
PollOption.objects.create(poll=p2, text="Angular")
print(f"  Polls created: {Poll.objects.count()}")

# Add votes to trigger AI summarization
opts1 = list(p1.options.all())
for i, voter in enumerate(users[:7]):
    Vote.objects.create(poll=p1, option=opts1[i % len(opts1)], user=voter,
                       reason=["Great for production", "Better for research", "Easy to learn", "Perfect for beginners", "Industry standard", "Best docs", "Most flexible"][i])
print(f"  Votes on ML poll: {Vote.objects.filter(poll=p1).count()}")

opts2 = list(p2.options.all())
for i, voter in enumerate(users[7:14]):
    Vote.objects.create(poll=p2, option=opts2[i % len(opts2)], user=voter,
                       reason=["Component model is great", "Simplicity wins", "Reactive by default", "Enterprise ready", "Hooks are amazing", "Lightweight", "Fast compilation"][i])
print(f"  Votes on Web Dev poll: {Vote.objects.filter(poll=p2).count()}")

e1 = Event.objects.create(group=g1, title="AI Hackathon 2026", description="24-hour AI/ML hackathon with prizes worth 1 lakh", budget=100000, created_by=users[0])
EventTask.objects.create(event=e1, title="Book auditorium", priority="high", status="done", assigned_to=users[2])
EventTask.objects.create(event=e1, title="Arrange sponsors", priority="high", status="inprogress", assigned_to=users[1])
EventTask.objects.create(event=e1, title="Design posters", priority="medium", status="todo", assigned_to=users[3])

e2 = Event.objects.create(group=g2, title="Web Dev Workshop", description="2-day Next.js + Tailwind workshop", budget=25000, created_by=users[7])
print(f"  Events created: {Event.objects.count()}")

Incident.objects.create(severity="orange", description="Broken AC in computer lab", location="CS Lab 101")
Incident.objects.create(severity="red", description="Water leakage damaging server room equipment", location="Server Room B2")
Incident.objects.create(severity="green", description="Suggestion: Add more power outlets in library", location="Central Library")
print(f"  Incidents created: {Incident.objects.count()}")

print("\n==============================")
print("SEED DATA COMPLETE!")
print(f"  Users: {User.objects.count()}")
print(f"  Groups: {Group.objects.count()}")
print(f"  Polls: {Poll.objects.count()}")
print(f"  Votes: {Vote.objects.count()}")
print(f"  Events: {Event.objects.count()}")
print(f"  Event Tasks: {EventTask.objects.count()}")
print(f"  Incidents: {Incident.objects.count()}")
print("==============================")
