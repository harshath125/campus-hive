import csv
import random
import os

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
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Nair", "Reddy", "Kumar", "Singh", "Gupta",
    "Iyer", "Rao", "Joshi", "Mishra", "Patil", "Deshmukh", "Chatterjee",
    "Banerjee", "Mukherjee", "Das", "Sen", "Bose", "Menon", "Pillai",
]

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

def _generate_tags():
    n_tags = random.randint(4, 8)
    tags = []
    tags.extend(random.sample(SKILL_POOLS["tech"], min(random.randint(2, 4), len(SKILL_POOLS["tech"]))))
    other_pools = ["academic", "creative", "lifestyle", "career"]
    for pool in random.sample(other_pools, random.randint(1, 3)):
        tags.extend(random.sample(SKILL_POOLS[pool], min(random.randint(1, 2), len(SKILL_POOLS[pool]))))
    return list(set(tags))[:n_tags]

def generate_csv(filename, count=200):
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        # Match exactly what admin_views.py expects: name, email, password, role, branch, section, year, tags
        writer.writerow(["name", "email", "password", "role", "branch", "section", "year", "tags"])
        
        for i in range(count):
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            name = f"{first} {last}"
            email = f"{first.lower()}.{last.lower()}{i}@anits.edu.in"
            password = "testpassword123!"
            role = "student"
            branch = random.choice(BRANCHES)
            section = random.choice(SECTIONS)
            year = random.choice(YEARS)
            
            # Convert list of tags to a JSON-like string format like '["Python", "Django", "React"]' 
            # Or comma-separated string based on what admin_views.py parsing logic is.
            # wait, checking admin_views.py -> it does tags.split(",") if it's a string, or json.loads
            # Let's write them cleanly as comma separated so admin_views can understand it easily
            tags_list = _generate_tags()
            tags_str = ", ".join(tags_list)
            
            writer.writerow([name, email, password, role, branch, section, year, tags_str])

    print(f"Generated {count} users in {filename} successfully.")

if __name__ == "__main__":
    generate_csv("anits_students_200.csv", 200)
