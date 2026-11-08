import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

load_dotenv()
db = SQLAlchemy()


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.update(
        SECRET_KEY=os.getenv("SECRET_KEY", "development-only-change-me"),
        SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL", ""),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        DEBUG=os.getenv("FLASK_DEBUG", "0") == "1",
    )

    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    allowed_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    CORS(app, resources={r"/api/*": {"origins": allowed_origin}})

    @app.get("/api/health")
    def health():
        result = {"status": "ok", "service": "WorkerCare API", "database": "not_configured"}
        if not app.config.get("SQLALCHEMY_DATABASE_URI"):
            return jsonify(result), 200
        try:
            db.session.execute(text("SELECT 1"))
            result["database"] = "connected"
            return jsonify(result), 200
        except SQLAlchemyError:
            db.session.rollback()
            result["status"] = "degraded"
            result["database"] = "unavailable"
            return jsonify(result), 503

    return app
