"""
Gemini AI utilities for Campus Hive.
Integrates with google-generativeai library.
"""
import json
import os
from typing import List, Optional

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


def _get_model():
    """Lazily configure and return the Gemini Pro model."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not GEMINI_AVAILABLE or not api_key:
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-pro")


def summarize_poll_reasons(reasons: List[str]) -> Optional[str]:
    """
    Summarize poll voting reasons into 3 key insights using Gemini.
    Falls back to None if API is unavailable.
    """
    model = _get_model()
    if not model or not reasons:
        return None

    prompt = f"""Analyze these voting reasons from a student campus poll and give exactly 3 bullet points 
summarizing the main themes and sentiments. Be concise and insightful.

Voting Reasons:
{chr(10).join(f'- {r}' for r in reasons)}

Format:
• [Majority opinion insight]
• [Minority view or concern]  
• [Possible compromise or action item]"""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini] summarize_poll_reasons error: {e}")
        return None


def generate_event_tasks(event_details: str, member_count: int) -> List[dict]:
    """
    Generate a Kanban task list for an event using Gemini.
    Falls back to sensible defaults if API is unavailable.
    """
    default_tasks = [
        {"title": "Venue Booking", "description": "Confirm and reserve the venue", "priority": "high"},
        {"title": "Sponsor Outreach", "description": "Contact potential sponsors", "priority": "high"},
        {"title": "Marketing Campaign", "description": "Create social media and poster content", "priority": "medium"},
        {"title": "Catering Arrangements", "description": "Organize food and beverages", "priority": "medium"},
        {"title": "Registration Portal", "description": "Set up online registration form", "priority": "high"},
        {"title": "Volunteer Coordination", "description": "Recruit and brief volunteers", "priority": "low"},
    ]

    model = _get_model()
    if not model:
        return default_tasks

    prompt = f"""Generate a task list for this campus event:

{event_details}
Team size: {member_count} people

Return ONLY a valid JSON array of 5-8 tasks:
[
  {{"title": "Task Name", "description": "Brief description", "priority": "high|medium|low"}},
  ...
]
No extra text, just the JSON array."""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Strip markdown code blocks if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip().rstrip("```")
        return json.loads(text)
    except Exception as e:
        print(f"[Gemini] generate_event_tasks error: {e}")
        return default_tasks
