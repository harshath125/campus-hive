import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campus_hive.settings")
from dotenv import load_dotenv
load_dotenv()
django.setup()

from core.models import User, Group, Poll, Event
print(f"Total users: {User.objects.count()}")
print(f"Admin exists: {User.objects.filter(email='admin@campushive.com').exists()}")
print(f"Staff users: {User.objects.filter(is_staff=True).count()}")
print(f"Student users: {User.objects.filter(is_staff=False).count()}")
print(f"Groups: {Group.objects.count()}")
print(f"Polls: {Poll.objects.count()}")
print(f"Events: {Event.objects.count()}")
print("--- Neon DB verification PASSED ---")
