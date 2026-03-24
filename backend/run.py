"""
Entry point for Campus Hive Flask API.
Run with:  python run.py
Or:        flask run --port 5000
"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    import os
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    print(f"🐝 Campus Hive API starting on http://localhost:{port}")
    print(f"   Debug mode: {debug}")
    print(f"   Endpoints:")
    print(f"     POST /api/auth/signup")
    print(f"     POST /api/auth/login")
    print(f"     GET  /api/auth/me")
    print(f"     ---------------------------")
    print(f"     /api/groups    /api/polls")
    print(f"     /api/events    /api/vibe")
    print(f"     /api/incidents")
    app.run(host="0.0.0.0", port=port, debug=debug)
