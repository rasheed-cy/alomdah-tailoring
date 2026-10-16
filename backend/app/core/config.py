"""إعدادات Backend."""
import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(BACKEND_ROOT / ".env")

DB_USER = os.getenv("DB_USER", "alomdah_app")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_DSN = os.getenv("DB_DSN", "localhost:1521/FREEPDB1")

# JWT
JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "alomdah-super-secret-key-change-in-production-2026",
)
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "20"))

# Session
SESSION_MINUTES = 20

IMAGES_DIR = Path(os.getenv("IMAGES_DIR", str(BACKEND_ROOT.parent / "data" / "images")))
BACKUP_DIR = Path(os.getenv("BACKUP_DIR", str(BACKEND_ROOT.parent / "backups")))

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:8000,http://127.0.0.1:5173,file://"
).split(",")

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))