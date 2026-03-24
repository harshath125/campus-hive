#!/usr/bin/env python
"""Django's command-line utility for Campus Hive."""
import os
import sys

def main():
    # Strip whitespace to prevent CRLF issues from .env
    settings = os.environ.get("DJANGO_SETTINGS_MODULE", "campus_hive.settings").strip()
    os.environ["DJANGO_SETTINGS_MODULE"] = settings
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Make sure it's installed and "
            "available on your PYTHONPATH environment variable."
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == "__main__":
    main()
