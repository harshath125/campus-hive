"""
AI utilities for Campus Hive (Django version).
Integrates with google-generativeai for poll summarization, event tasks, and vibe insights.
"""
import json
import os
from typing import List, Optional

try:
    import google.generativeai as genai
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False


def _get_model():
    """Lazily configure and return the AI model."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not AI_AVAILABLE or not api_key:
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.0-flash")


import re

def summarize_poll_reasons(reasons: List[str]) -> Optional[str]:
    """Summarize poll voting reasons into deep, conversational insights using AI."""
    model = _get_model()
    if not model or not reasons:
        return None

    prompt = f"""Read these voting reasons from a campus poll. I want you to act as an expert community analyst.
Give a brief, natural-sounding paragraph explaining exactly how the users are thinking.
Focus on:
1. What the majority of people are thinking and their main motivation.
2. The most likely path chosen based on sentiment.
3. Any interesting minority opinion or concern.

Voting Reasons:
{chr(10).join(f'- {r}' for r in reasons)}

Do not use generic bullet points. Start directly with "The majority of people are thinking..." or similar."""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[AI] summarize_poll_reasons error: {e}")
        return None


def generate_event_tasks(event_details: str, member_count: int) -> List[dict]:
    """Generate a dynamic Kanban task list for an event using AI, ensuring valid JSON extraction."""
    default_tasks = [
        {"title": "Venue Booking", "description": "Confirm and reserve the venue", "priority": "high"},
        {"title": "Sponsor Outreach", "description": "Contact potential sponsors", "priority": "high"},
        {"title": "Marketing Campaign", "description": "Create social media and poster content", "priority": "medium"},
    ]

    model = _get_model()
    if not model:
        return default_tasks

    prompt = f"""You are a professional event planner. Generate a highly specific task board for this campus event:

{event_details}
Team size: {member_count} people

Return ONLY a valid JSON array of 5-8 tasks. No markdown formatting, no explanations, just raw JSON.
Example format:
[
  {{"title": "Specific Task Name", "description": "What exactly needs to be done", "priority": "high"}},
  {{"title": "Another Task", "description": "Details", "priority": "medium"}}
]"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Aggressively extract JSON array using Regex to bypass Markdown blocks
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            extracted_json = match.group(0)
            return json.loads(extracted_json)
        else:
            print("[AI] Failed to parse JSON array from Gemini response")
            return default_tasks
    except Exception as e:
        print(f"[AI] generate_event_tasks error: {e}")
        return default_tasks


def generate_vibe_insight(user1_name: str, user2_name: str, common_tags: List[str], score: float) -> str:
    """Generate an AI-powered compatibility insight for two users."""
    model = _get_model()
    if not model or not common_tags:
        return _fallback_insight(common_tags)

    prompt = f"""Two students on a campus platform have been matched with a {score:.0f}% vibe compatibility score.
Their shared interests are: {', '.join(common_tags)}.

Write ONE short, fun, encouraging sentence (max 15 words) about their compatibility. 
Use an emoji. Be specific to their shared interests. No generic responses.
Return ONLY the sentence, nothing else."""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Take only first line
        return text.split("\n")[0].strip('"').strip()
    except Exception as e:
        print(f"[AI] generate_vibe_insight error: {e}")
        return _fallback_insight(common_tags)


def _fallback_insight(common_tags: List[str]) -> str:
    """Fallback insight when AI is unavailable."""
    if not common_tags:
        return "You might discover new interests together! 🌱"

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
        "react": "React devs unite! Component magic awaits ⚛️",
        "entrepreneurship": "Future founders! The next startup is brewing ☕",
        "fitness": "Gym buddies! Stay fit, stay focused 💪",
        "photography": "Shutterbugs! Capture the world together 📸",
    }

    tags = [t.lower() for t in common_tags]
    for tag, insight in insights.items():
        if tag in tags:
            return insight

    top_tags = common_tags[:2]
    return f"You both vibe on {' & '.join(top_tags)}! Great match ✨"
