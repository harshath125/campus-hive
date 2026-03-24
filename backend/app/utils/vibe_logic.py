"""
Vibe matching logic using Jaccard Similarity.
Pure Python – no ML library required.
"""
from typing import List, Set


def calculate_jaccard_similarity(tags1: List[str], tags2: List[str]) -> float:
    """
    Jaccard Similarity = |A ∩ B| / |A ∪ B|
    Returns a percentage score 0.0 – 100.0
    """
    set1: Set[str] = {t.strip().lower() for t in tags1 if t.strip()}
    set2: Set[str] = {t.strip().lower() for t in tags2 if t.strip()}

    if not set1 and not set2:
        return 0.0

    intersection = set1 & set2
    union = set1 | set2

    if not union:
        return 0.0

    return round((len(intersection) / len(union)) * 100, 1)


def get_common_tags(tags1: List[str], tags2: List[str]) -> List[str]:
    """Return the list of tags common to both users (lowercase)."""
    set1 = {t.strip().lower() for t in tags1 if t.strip()}
    return [t.strip().lower() for t in tags2 if t.strip().lower() in set1]


def generate_vibe_insight(common_tags: List[str]) -> str:
    """Generate a human-readable insight string from shared interest tags."""
    if not common_tags:
        return "You might discover new interests together! 🌱"

    tags = [t.lower() for t in common_tags]

    # Specific interest-based insights
    insights = {
        "python": "Two Pythonistas! Perfect for hackathons and side projects 🐍🚀",
        "ai/ml": "AI enthusiasts united! Build something brilliant together 🤖",
        "machine learning": "AI enthusiasts united! Build something brilliant together 🤖",
        "hackathons": "Hackathon warriors in the making! 💻🏆",
        "night owl": "Night owls unite! Great study session partners 🦉",
        "music": "Music lovers! Time for a jam session 🎵",
        "gaming": "Gamers connect! Game night incoming 🎮",
        "design": "Creative minds! Collaborate on something beautiful 🎨",
        "web dev": "Full-stack duo! Let's build something cool 🌐",
        "entrepreneurship": "Future founders! The next startup is brewing ☕",
        "fitness": "Gym buddies! Stay fit, stay focused 💪",
        "photography": "Shutterbugs! Capture the world together 📸",
    }

    for tag, insight in insights.items():
        if tag in tags:
            return insight

    # Generic fallback
    top_tags = common_tags[:2]
    return f"You both vibe on {' & '.join(top_tags)}! Great match ✨"
