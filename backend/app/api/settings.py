"""Endpoints الإعدادات."""
import sys
import platform
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.database import get_db, engine
from app.schemas.settings import SystemInfo
from app.core.config import BACKUP_DIR

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/system-info", response_model=SystemInfo)
def get_system_info(db: Session = Depends(get_db)):
    """معلومات النظام الكاملة."""

    # إصدارات Python
    py_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"

    # إصدارات المكتبات
    try:
        import fastapi
        fastapi_ver = fastapi.__version__
    except Exception:
        fastapi_ver = "—"

    try:
        import sqlalchemy
        sqlalchemy_ver = sqlalchemy.__version__
    except Exception:
        sqlalchemy_ver = "—"

    # إصدار Oracle
    oracle_ver = "—"
    db_connected = False
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT banner FROM v$version WHERE ROWNUM = 1"))
            row = result.fetchone()
            if row:
                oracle_ver = str(row[0])[:80]
            db_connected = True
    except Exception as e:
        oracle_ver = f"خطأ: {str(e)[:60]}"

    # عدد الجداول
    tables_count = 0
    customers_count = 0
    images_count = 0
    users_count = 0
    try:
        with engine.connect() as conn:
            tables_count = conn.execute(text("SELECT COUNT(*) FROM user_tables")).scalar() or 0
            customers_count = conn.execute(text("SELECT COUNT(*) FROM customers WHERE is_deleted = 0")).scalar() or 0
            try:
                images_count = conn.execute(text("SELECT COUNT(*) FROM customer_images")).scalar() or 0
            except Exception:
                images_count = 0
            try:
                users_count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar() or 0
            except Exception:
                users_count = 0
    except Exception:
        pass

    # آخر نسخة احتياطية
    last_backup = None
    backups_count = 0
    try:
        from app.models.backup import BackupLog
        last = db.query(BackupLog).filter(BackupLog.status == "SUCCESS").order_by(BackupLog.started_at.desc()).first()
        if last and last.started_at:
            last_backup = last.started_at.isoformat()
        backups_count = db.query(BackupLog).filter(BackupLog.status == "SUCCESS").count()
    except Exception:
        pass

    # المسارات
    paths = {
        "images": str(Path(r"E:\Projects\Alomdah_Tailoring\data\images")),
        "backups": str(BACKUP_DIR),
        "logs": str(Path(r"E:\Projects\Alomdah_Tailoring\logs")),
        "oracle_home": str(Path(r"E:\Projects\Alomdah_Tailoring\Oracle\dbhomeFree")),
        "project_root": str(Path(r"E:\Projects\Alomdah_Tailoring")),
    }

    return SystemInfo(
        app_name="العمده للخياطة الرجالية",
        app_version="0.1.0",
        python_version=py_version,
        oracle_version=oracle_ver,
        fastapi_version=fastapi_ver,
        sqlalchemy_version=sqlalchemy_ver,
        os_info=f"{platform.system()} {platform.release()} ({platform.machine()})",
        hostname=platform.node(),
        database_connected=db_connected,
        tables_count=tables_count,
        customers_count=customers_count,
        images_count=images_count,
        users_count=users_count,
        last_backup=last_backup,
        backups_count=backups_count,
        paths=paths,
    )


@router.post("/test-connection")
def test_connection():
    """اختبار اتصال قاعدة البيانات."""
    try:
        with engine.connect() as conn:
            row = conn.execute(text("SELECT banner FROM v$version WHERE ROWNUM = 1")).fetchone()
            return {
                "success": True,
                "message": "الاتصال ناجح",
                "version": str(row[0])[:80] if row else "—",
                "timestamp": datetime.now().isoformat(),
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"فشل الاتصال: {str(e)[:200]}",
            "timestamp": datetime.now().isoformat(),
        }


@router.get("/db-stats")
def get_db_stats():
    """إحصائيات قاعدة البيانات."""
    try:
        with engine.connect() as conn:
            result = {}
            for table in ["CUSTOMERS", "CUSTOMER_IMAGES", "USERS", "BACKUP_LOG", "AUDIT_LOG"]:
                try:
                    count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar() or 0
                    result[table.lower()] = count
                except Exception:
                    result[table.lower()] = 0

            # حجم الجداول (بالكيلوبايت)
            try:
                size_result = conn.execute(text(
                    "SELECT segment_name, bytes/1024 FROM user_segments WHERE segment_type='TABLE'"
                ))
                sizes = {}
                for row in size_result:
                    sizes[row[0].lower()] = round(row[1], 1)
                result["sizes_kb"] = sizes
            except Exception:
                result["sizes_kb"] = {}

            return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)[:200]}