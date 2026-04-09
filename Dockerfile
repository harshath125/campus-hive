# ============================================
# Campus Hive — Production Dockerfile
# Single container: Node builds React → Python serves Django + React
# ============================================

FROM python:3.11-slim

WORKDIR /app

# Install system deps + Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# ── Backend Dependencies ──
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt gunicorn

# ── Copy Backend ──
COPY backend/ ./backend/

# ── Frontend Build ──
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --silent
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# ── Django Setup ──
ENV DJANGO_SETTINGS_MODULE=campus_hive.settings
ENV PYTHONUNBUFFERED=1
ENV DJANGO_DEBUG=False

WORKDIR /app/backend

# Collect static files
RUN python manage.py collectstatic --noinput 2>/dev/null || true

EXPOSE 8000

# Migrate + Seed (if empty) + Start Gunicorn
CMD python manage.py migrate --noinput 2>/dev/null || true && \
    python create_admin.py && \
    gunicorn campus_hive.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120
