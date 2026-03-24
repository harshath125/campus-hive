FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

ENV DJANGO_SETTINGS_MODULE=campus_hive.settings
ENV PYTHONUNBUFFERED=1
ENV DJANGO_DEBUG=False

RUN python manage.py collectstatic --noinput 2>/dev/null || true

EXPOSE 8000

CMD ["gunicorn", "campus_hive.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
