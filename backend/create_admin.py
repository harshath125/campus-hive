import os
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campus_hive.settings")
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

# Admin credentials
ADMIN_EMAIL = "admin@campushive.com"
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "adminpassword123")

print("Checking for admin user...")

if not User.objects.filter(email=ADMIN_EMAIL).exists():
    print(f"Creating superuser: {ADMIN_EMAIL}")
    # Create the superuser
    User.objects.create_superuser(
        email=ADMIN_EMAIL,
        password=ADMIN_PASSWORD,
        first_name="System",
        last_name="Admin"
    )
    print("✅ Superuser created successfully!")
else:
    print("✅ Superuser already exists!")

