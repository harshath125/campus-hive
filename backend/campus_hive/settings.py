"""
Django settings for Campus Hive project.
Connects to Supabase PostgreSQL, configures JWT, CORS, AI.
"""
import os
import re
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Security ────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "campus-hive-super-secret-jwt-key-2024-change-in-prod")
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() == "true"
ALLOWED_HOSTS = ["*"]

# Allow CSRF for admin login on Render
CSRF_TRUSTED_ORIGINS = ["https://*.onrender.com", "http://localhost:5173", "http://localhost:8000"]

# ── Installed Apps ──────────────────────────────────────────────────────────
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    # Local
    "core",
]

# ── Middleware ──────────────────────────────────────────────────────────────
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "campus_hive.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "campus_hive.wsgi.application"

# ── Database ────────────────────────────────────────────────────────────────
# Tries Supabase PostgreSQL first; falls back to SQLite if unavailable.
DATABASE_URL = os.getenv("DATABASE_URL", "")

SQLITE_DB = {
    "ENGINE": "django.db.backends.sqlite3",
    "NAME": str(BASE_DIR / "db.sqlite3"),
}

def _build_pg_config(url):
    pattern = r"postgresql://(?P<user>[^:]+):(?P<password>[^@]+)@(?P<host>[^:]+):(?P<port>\d+)/(?P<name>.+)"
    match = re.match(pattern, url)
    if not match:
        return None
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": match.group("name"),
        "USER": match.group("user"),
        "PASSWORD": match.group("password"),
        "HOST": match.group("host"),
        "PORT": match.group("port"),
        "OPTIONS": {"sslmode": "require"},
    }

def _get_database():
    pg = _build_pg_config(DATABASE_URL)
    if pg:
        # Quick connectivity test
        import socket
        try:
            socket.create_connection((pg["HOST"], int(pg["PORT"])), timeout=3)
            print("  [OK] Connected to Supabase PostgreSQL")
            return pg
        except (OSError, socket.timeout):
            print("  [WARN] Supabase unreachable - using local SQLite")
    return SQLITE_DB

DATABASES = {"default": _get_database()}

# ── Custom User Model ──────────────────────────────────────────────────────
AUTH_USER_MODEL = "core.User"

# ── Password Validation ────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 6}},
]

# ── REST Framework ──────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
}

# ── Simple JWT ──────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "24"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ALGORITHM": os.getenv("JWT_ALGORITHM", "HS256"),
    "SIGNING_KEY": SECRET_KEY,
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "AUTH_HEADER_TYPES": ("Bearer",),
    "TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainPairSerializer",
}

# ── CORS ────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
]
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True

# ── AI Integration ──────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ── Static Files ────────────────────────────────────────────────────────────
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ── Internationalization ────────────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# ── Default Auto Field ─────────────────────────────────────────────────────
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── Logging ─────────────────────────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO"},
        "core": {"handlers": ["console"], "level": "DEBUG"},
    },
}
