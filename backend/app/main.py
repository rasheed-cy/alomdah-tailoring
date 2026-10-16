"""Backend API — العمده للخياطة."""
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import text
from pathlib import Path

from app.core.config import CORS_ORIGINS
from app.db.database import engine
from app.api import (
    customers, images, auth, backup, settings,
    users, roles, app_settings,
)
from app.models import (
    customer, user, image, backup as backup_model, role, app_setting,
)  # noqa

app = FastAPI(
    title="العمده للخياطة — API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(images.router)
app.include_router(backup.router)
app.include_router(settings.router)
app.include_router(users.router)
app.include_router(roles.router)
app.include_router(app_settings.router)


@app.get("/api/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1 FROM DUAL")).fetchone()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# =====================================================================
# خدمة dist/ — يدعم .exe و Python مباشر
# =====================================================================
def get_frontend_dist() -> Path:
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS) / "frontend_dist"
    else:
        return Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


FRONTEND_DIST = get_frontend_dist()

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            return {"detail": "Not Found"}

        requested = FRONTEND_DIST / full_path
        if requested.exists() and requested.is_file():
            return FileResponse(str(requested))

        return FileResponse(str(FRONTEND_DIST / "index.html"))
