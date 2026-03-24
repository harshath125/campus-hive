"""
Django Management Command: seed_test_users
Seeds 200 Indian test users with diverse skills/tags for Vibe Matcher validation.
Runs permutation-based vibe score tests to validate algorithm accuracy.
"""
import random
from django.core.management.base import BaseCommand
from core.models import User
from core.utils.vibe_algorithm import find_vibe_matches, calculate_vibe_score

# ── 200 Indian First Names ──────────────────────────────────────────────────
FIRST_NAMES = [
    "Aarav", "Aditi", "Aisha", "Akash", "Ananya", "Anil", "Anjali", "Arjun",
    "Arun", "Bhavya", "Chaitanya", "Deepa", "Deepak", "Devika", "Dhruv",
    "Divya", "Esha", "Gaurav", "Geeta", "Harish", "Himani", "Isha", "Jatin",
    "Kavya", "Kiran", "Kriti", "Kunal", "Lakshmi", "Lavanya", "Madhav",
    "Meera", "Mohan", "Nandini", "Naveen", "Neha", "Nikhil", "Nisha",
    "Pallavi", "Pankaj", "Pooja", "Pradeep", "Pranav", "Priyanka", "Rahul",
    "Rajesh", "Ravi", "Rekha", "Rishi", "Rohit", "Sakshi", "Sanjay",
    "Sarita", "Shivani", "Shreya", "Sneha", "Sonal", "Suresh", "Tanvi",
    "Uday", "Uma", "Varun", "Vidya", "Vikram", "Vinay", "Vivek", "Yash",
    "Zara", "Aarti", "Abhishek", "Amrita", "Ashok", "Bharat", "Chandni",
    "Darshan", "Ekta", "Farhan", "Gauri", "Harsh", "Indira", "Jayant",
    "Kamal", "Lata", "Manish", "Naman", "Om", "Payal", "Radhika",
    "Sameer", "Tara", "Ujjwal", "Vani", "Wasim", "Yogesh", "Zubin",
    "Aditya", "Bhavna", "Chirag", "Disha", "Ekansh", "Falguni", "Girish",
    "Hema", "Ishaan", "Juhi", "Kartik", "Latika", "Mihir", "Namrata",
    "Ojas", "Pragya", "Ritika", "Sahil", "Tushar", "Urmi", "Vishal",
    "Swati", "Trisha", "Rohan", "Siddharth", "Megha", "Karthik", "Nikita",
    "Manav", "Anusha", "Abhinav", "Rupal", "Saurabh", "Tanmay", "Akshay",
    "Preeti", "Ramesh", "Smita", "Tarun", "Aman", "Bindu", "Chandan",
    "Devi", "Ganesh", "Hemant", "Ila", "Jai", "Kamala", "Laxman",
    "Manju", "Narayan", "Omkar", "Padma", "Rajan", "Sandeep", "Trilok",
    "Usha", "Vijay", "Yamini", "Ajay", "Babita", "Chitra", "Dinesh",
    "Feroz", "Gopi", "Hans", "Iti", "Jagdish", "Kedar", "Lila",
    "Monika", "Nagesh", "Prem", "Qadir", "Revathi", "Shyam", "Tejas",
    "Urmila", "Vanita", "Yuvraj", "Aayush", "Bhoomika", "Charvi", "Dev",
    "Eshwar", "Gayatri", "Hitesh", "Indu", "Jaya", "Komal", "Laksh",
    "Mukesh", "Neeraj", "Prerna", "Rachna", "Sunil", "Tanushree",
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Nair", "Reddy", "Kumar", "Singh", "Gupta",
    "Iyer", "Rao", "Joshi", "Mishra", "Patil", "Deshmukh", "Chatterjee",
    "Banerjee", "Mukherjee", "Das", "Sen", "Bose", "Menon", "Pillai",
    "Agarwal", "Mehta", "Shah", "Trivedi", "Pandey", "Tiwari", "Dubey",
    "Saxena", "Kapoor", "Malhotra", "Khanna", "Chopra", "Bhatia", "Sood",
    "Arora", "Sethi", "Tandon", "Bajaj", "Sinha", "Prasad", "Thakur",
    "Chauhan", "Yadav", "Rathore", "Shekhawat", "Solanki", "Pawar", "Kulkarni",
]

# ── Skill/Tag Pools (realistic ANITS student interests) ─────────────────────
SKILL_POOLS = {
    "tech": ["Python", "Java", "C++", "JavaScript", "React", "Node.js", "Django",
             "Flutter", "Machine Learning", "Deep Learning", "AI/ML", "Data Science",
             "Web Dev", "Android Dev", "iOS Dev", "Cloud Computing", "AWS", "Docker",
             "Kubernetes", "DevOps", "Cybersecurity", "Blockchain", "IoT",
             "TensorFlow", "PyTorch", "MongoDB", "SQL", "PostgreSQL", "Redis",
             "TypeScript", "Next.js", "Vue.js", "Angular", "Spring Boot", "FastAPI"],
    "academic": ["DSA", "Competitive Programming", "GATE Prep", "GRE Prep",
                 "Research Papers", "Open Source", "Hackathons", "LeetCode",
                 "CodeChef", "Codeforces", "IEEE", "ACM"],
    "creative": ["Photography", "Video Editing", "Graphic Design", "UI/UX Design",
                 "3D Modeling", "Animation", "Content Writing", "Blogging",
                 "Podcasting", "Music Production", "Guitar", "Singing"],
    "lifestyle": ["Fitness", "Yoga", "Basketball", "Cricket", "Football", "Chess",
                  "Gaming", "Esports", "Cooking", "Travel", "Reading",
                  "Night Owl", "Morning Person", "Coffee Lover", "Tea Lover"],
    "career": ["Placement Prep", "TCS", "Infosys", "Wipro", "Google", "Microsoft",
               "Amazon", "Startups", "Entrepreneurship", "Freelancing",
               "CAT Prep", "MBA Aspirant", "Civil Services"],
}

BRANCHES = ["CSE", "CSM", "CSD", "CSO", "IT", "ECE", "EEE", "ME", "CE"]
SECTIONS = ["A", "B", "C", "D"]
YEARS = [1, 2, 3, 4]
AVATARS = ["👾", "🎓", "🚀", "🎯", "⚡", "🌟", "🔥", "🌊", "🎮", "🦋", "🐉", "🦊"]


def _generate_tags():
    """Generate a realistic set of 4-8 interest tags from multiple pools."""
    n_tags = random.randint(4, 8)
    tags = []
    # Always pick from tech (most students are tech-oriented at ANITS)
    tags.extend(random.sample(SKILL_POOLS["tech"], min(random.randint(2, 4), len(SKILL_POOLS["tech"]))))
    # Pick from other pools
    other_pools = ["academic", "creative", "lifestyle", "career"]
    for pool in random.sample(other_pools, random.randint(1, 3)):
        tags.extend(random.sample(SKILL_POOLS[pool], min(random.randint(1, 2), len(SKILL_POOLS[pool]))))
    return list(set(tags))[:n_tags]


class Command(BaseCommand):
    help = "Seed 200 Indian test users and run vibe matcher permutation tests"

    def add_arguments(self, parser):
        parser.add_argument('--skip-test', action='store_true', help='Skip vibe score testing')
        parser.add_argument('--count', type=int, default=200, help='Number of users to seed')

    def handle(self, *args, **options):
        count = min(options['count'], 200)
        self.stdout.write(self.style.WARNING(f"\n{'='*60}"))
        self.stdout.write(self.style.WARNING(f"  CAMPUS HIVE — Seeding {count} Test Users"))
        self.stdout.write(self.style.WARNING(f"{'='*60}\n"))

        created = 0
        users_created = []

        for i in range(count):
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            name = f"{first} {last}"
            email = f"{first.lower()}.{last.lower()}{i}@anits.edu.in"
            branch = random.choice(BRANCHES)
            section = random.choice(SECTIONS)
            year = random.choice(YEARS)
            tags = _generate_tags()

            if User.objects.filter(email=email).exists():
                continue

            user = User(
                email=email,
                name=name,
                branch=branch,
                section=section,
                year=year,
                tags=tags,
                avatar=random.choice(AVATARS),
                role="student",
            )
            user.set_password("test1234")
            user.save()
            users_created.append(user)
            created += 1

            if (i + 1) % 50 == 0:
                self.stdout.write(f"  ✅ Created {i+1}/{count} users...")

        self.stdout.write(self.style.SUCCESS(f"\n  ✅ Successfully created {created} test users!\n"))

        # ── Branch Distribution ──────────────────────────────────────────
        self.stdout.write(self.style.WARNING("  📊 Branch Distribution:"))
        for branch in BRANCHES:
            cnt = User.objects.filter(branch=branch).count()
            bar = "█" * (cnt // 2)
            self.stdout.write(f"    {branch:4s} | {bar} ({cnt})")

        # ── Year Distribution ────────────────────────────────────────────
        self.stdout.write(self.style.WARNING("\n  📊 Year Distribution:"))
        for yr in YEARS:
            cnt = User.objects.filter(year=yr).count()
            bar = "█" * (cnt // 2)
            self.stdout.write(f"    Y{yr}   | {bar} ({cnt})")

        if options['skip_test']:
            self.stdout.write(self.style.WARNING("\n  ⏭  Skipping vibe score tests (--skip-test)\n"))
            return

        # ── Vibe Matcher Permutation Tests ───────────────────────────────
        self.stdout.write(self.style.WARNING(f"\n{'='*60}"))
        self.stdout.write(self.style.WARNING("  🧪 VIBE MATCHER ACCURACY TESTS"))
        self.stdout.write(self.style.WARNING(f"{'='*60}\n"))

        all_users = list(User.objects.filter(role="student", is_active=True))
        if len(all_users) < 10:
            self.stdout.write(self.style.ERROR("  Not enough users for testing."))
            return

        # Test 1: Pick 10 random users and compute their top matches
        test_users = random.sample(all_users, min(10, len(all_users)))
        all_scores = []
        high_match_count = 0
        zero_match_count = 0

        self.stdout.write("  Test 1: Top Matches for 10 Random Users\n")
        for tu in test_users:
            others = [u for u in all_users if u.id != tu.id]
            matches = find_vibe_matches(tu, others, top_n=5)
            if matches:
                top = matches[0]
                self.stdout.write(
                    f"    👤 {tu.name:20s} ({tu.branch}/{tu.section}/Y{tu.year}) "
                    f"→ Best: {top['user']['name']:20s} Score: {top['score']:5.1f}% "
                    f"Common: {', '.join(top['common_tags'][:4])}"
                )
                all_scores.append(top["score"])
                if top["score"] > 60:
                    high_match_count += 1
            else:
                self.stdout.write(f"    👤 {tu.name:20s} → No matches found")
                zero_match_count += 1

        # Test 2: Same-branch, same-year users should score higher
        self.stdout.write(self.style.WARNING("\n  Test 2: Same-Branch Same-Year vs Cross-Branch Scores\n"))
        same_scores = []
        diff_scores = []
        for _ in range(50):
            u1, u2 = random.sample(all_users, 2)
            score = calculate_vibe_score(
                u1.tags or [], u2.tags or [],
                u1.branch or "", u2.branch or "",
                u1.year, u2.year,
                u1.section or "", u2.section or "",
            )
            if u1.branch == u2.branch and u1.year == u2.year:
                same_scores.append(score)
            else:
                diff_scores.append(score)

        avg_same = sum(same_scores) / len(same_scores) if same_scores else 0
        avg_diff = sum(diff_scores) / len(diff_scores) if diff_scores else 0
        self.stdout.write(f"    Same branch+year avg score : {avg_same:.1f}%  ({len(same_scores)} pairs)")
        self.stdout.write(f"    Diff branch/year avg score : {avg_diff:.1f}%  ({len(diff_scores)} pairs)")
        if avg_same > avg_diff:
            self.stdout.write(self.style.SUCCESS("    ✅ PASS: Same-context users score higher (as expected)"))
        else:
            self.stdout.write(self.style.WARNING("    ⚠️  WARN: Cross-context scores unexpectedly high"))

        # Test 3: Users with identical tags → should be near max score
        self.stdout.write(self.style.WARNING("\n  Test 3: Identical Tags → Maximum Score Validation\n"))
        clone_tags = ["Python", "AI/ML", "Hackathons", "React", "DSA"]
        perfect_score = calculate_vibe_score(
            clone_tags, clone_tags, "CSE", "CSE", 3, 3, "A", "A"
        )
        self.stdout.write(f"    Identical tags + same context → Score: {perfect_score:.1f}%")
        if perfect_score >= 90:
            self.stdout.write(self.style.SUCCESS("    ✅ PASS: Perfect match yields 90%+ score"))
        else:
            self.stdout.write(self.style.WARNING(f"    ⚠️  Score lower than expected: {perfect_score}%"))

        # Test 4: Users with zero overlap → should be low
        self.stdout.write(self.style.WARNING("\n  Test 4: Zero Tag Overlap → Low Score Validation\n"))
        zero_score = calculate_vibe_score(
            ["Python", "AI/ML", "Hackathons"], ["Photography", "Cooking", "Singing"],
            "CSE", "ME", 1, 4, "A", "D"
        )
        self.stdout.write(f"    Zero overlap + diff context → Score: {zero_score:.1f}%")
        if zero_score < 20:
            self.stdout.write(self.style.SUCCESS("    ✅ PASS: No-overlap yields <20% score"))
        else:
            self.stdout.write(self.style.WARNING(f"    ⚠️  Score higher than expected: {zero_score}%"))

        # Summary
        avg_top = sum(all_scores) / len(all_scores) if all_scores else 0
        self.stdout.write(self.style.WARNING(f"\n{'='*60}"))
        self.stdout.write(self.style.WARNING("  📈 TEST SUMMARY"))
        self.stdout.write(self.style.WARNING(f"{'='*60}"))
        self.stdout.write(f"    Total users in DB     : {User.objects.count()}")
        self.stdout.write(f"    Users seeded this run : {created}")
        self.stdout.write(f"    Avg top-match score   : {avg_top:.1f}%")
        self.stdout.write(f"    High matches (>60%)   : {high_match_count}/10")
        self.stdout.write(f"    Zero matches          : {zero_match_count}/10")
        self.stdout.write(f"    Perfect match test    : {'PASS' if perfect_score >= 90 else 'WARN'}")
        self.stdout.write(f"    Zero overlap test     : {'PASS' if zero_score < 20 else 'WARN'}")
        self.stdout.write(f"    Context bias test     : {'PASS' if avg_same > avg_diff else 'WARN'}")
        self.stdout.write(self.style.SUCCESS(f"\n  🎯 Vibe Matcher validation complete!\n"))
