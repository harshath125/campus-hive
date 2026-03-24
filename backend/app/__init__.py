"""
Flask Application Factory – creates and configures the app.
"""
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager

from app.config import get_config
from app.extensions import db, bcrypt, cors


def create_app():
    app = Flask(__name__)

    # Load configuration
    cfg = get_config()
    app.config.from_object(cfg)

    # Set JWT secret key explicitly
    app.config["JWT_SECRET_KEY"] = cfg.JWT_SECRET_KEY

    # ── Initialize extensions ──────────────────────────────────────────────
    db.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": cfg.CORS_ORIGINS}})

    # JWT manager
    jwt = JWTManager(app)

    # JWT error handlers
    @jwt.unauthorized_loader
    def missing_token_callback(reason):
        return jsonify({"error": "Authorization token is missing", "details": reason}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({"error": "Invalid token", "details": reason}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return jsonify({"error": "Token has expired"}), 401

    # ── Register Blueprints ────────────────────────────────────────────────
    from app.routers.auth import auth_bp
    from app.routers.groups import groups_bp
    from app.routers.polls import polls_bp
    from app.routers.events import events_bp
    from app.routers.vibe import vibe_bp
    from app.routers.incidents import incidents_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(groups_bp, url_prefix="/api/groups")
    app.register_blueprint(polls_bp, url_prefix="/api/polls")
    app.register_blueprint(events_bp, url_prefix="/api/events")
    app.register_blueprint(vibe_bp, url_prefix="/api/vibe")
    app.register_blueprint(incidents_bp, url_prefix="/api/incidents")

    # ── Health / Root ──────────────────────────────────────────────────────
    @app.route("/")
    def root():
        return jsonify({
            "message": "🐝 Campus Hive API is running",
            "version": "1.0.0",
            "docs": "See SETUP_GUIDE.md for API reference",
            "endpoints": {
                "auth": "/api/auth",
                "groups": "/api/groups",
                "polls": "/api/polls",
                "events": "/api/events",
                "vibe": "/api/vibe",
                "incidents": "/api/incidents",
            }
        })

    @app.route("/health")
    def health():
        return jsonify({"status": "healthy", "db": "supabase-connected"})

    # ── Create DB Tables ───────────────────────────────────────────────────
    with app.app_context():
        db.create_all()

    return app
