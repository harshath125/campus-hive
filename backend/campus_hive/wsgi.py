"""
WSGI config for Campus Hive project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campus_hive.settings")
application = get_wsgi_application()
