"""Endpoints إعدادات التطبيق."""
import subprocess
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict

from app.db.database import get_db
from app.services.app_settings_service import AppSettingsService
from app.services.backup_service import BackupService

router = APIRouter(prefix="/api/app-settings", tags=["app-settings"])

SCRIPTS_DIR = Path(r"E:\Projects\Alomdah_Tailoring\scripts")
BACKUP_TASK_NAME = "Alomdah_Daily_Backup"


class SettingsUpdate(BaseModel):
    settings: Dict[str, str]


class BackupScheduleRequest(BaseModel):
    enabled: bool
    time: str = "02:00"
    keep_count: int = 30


class CameraSettings(BaseModel):
    device_id: str
    device_label: str


@router.get("")
def get_settings(db: Session = Depends(get_db)):
    return AppSettingsService.get_all(db)


@router.put("")
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db)):
    count = AppSettingsService.set_many(db, data.settings)
    return {"success": True, "updated": count}


@router.post("/reset")
def reset_settings(db: Session = Depends(get_db)):
    ok = AppSettingsService.reset_to_defaults(db)
    return {"success": ok}


@router.get("/backup/schedule")
def get_backup_schedule(db: Session = Depends(get_db)):
    enabled = AppSettingsService.get_bool(db, "backup_enabled")
    backup_time = AppSettingsService.get_value(db, "backup_time", "02:00")
    keep_count = AppSettingsService.get_int(db, "backup_keep_count", 30)
    last_run = AppSettingsService.get_value(db, "backup_last_run", "")
    last_status = AppSettingsService.get_value(db, "backup_last_status", "")

    task_exists = False
    try:
        result = subprocess.run(
            ["schtasks", "/query", "/tn", BACKUP_TASK_NAME],
            capture_output=True, text=True, timeout=5,
        )
        task_exists = result.returncode == 0
    except Exception:
        pass

    return {
        "enabled": enabled,
        "time": backup_time,
        "keep_count": keep_count,
        "last_run": last_run,
        "last_status": last_status,
        "task_exists": task_exists,
        "task_name": BACKUP_TASK_NAME,
    }


@router.post("/backup/schedule")
def set_backup_schedule(data: BackupScheduleRequest, db: Session = Depends(get_db)):
    AppSettingsService.set_many(db, {
        "backup_enabled": "true" if data.enabled else "false",
        "backup_time": data.time,
        "backup_keep_count": str(data.keep_count),
    })

    if data.enabled:
        script = SCRIPTS_DIR / "register_backup_task.ps1"
        if not script.exists():
            return {
                "success": False,
                "message": "سكربت التسجيل غير موجود",
                "path_expected": str(script),
            }
        try:
            result = subprocess.run(
                ["powershell", "-ExecutionPolicy", "Bypass", "-File", str(script),
                 "-Time", data.time, "-KeepCount", str(data.keep_count)],
                capture_output=True, text=True, timeout=30,
            )
            if result.returncode == 0:
                return {"success": True, "message": "تم تفعيل النسخ التلقائي"}
            return {"success": False, "message": "فشل التسجيل", "stderr": result.stderr[:500]}
        except Exception as e:
            return {"success": False, "message": f"خطأ: {e}"}
    else:
        script = SCRIPTS_DIR / "unregister_backup_task.ps1"
        if script.exists():
            try:
                subprocess.run(
                    ["powershell", "-ExecutionPolicy", "Bypass", "-File", str(script)],
                    capture_output=True, text=True, timeout=15,
                )
            except Exception:
                pass
        return {"success": True, "message": "تم تعطيل النسخ التلقائي"}


@router.post("/backup/run-now")
def run_backup_now(db: Session = Depends(get_db)):
    bid, path, msg = BackupService.create_backup(db, backup_type="MANUAL")
    if not path:
        raise HTTPException(status_code=500, detail=msg)

    AppSettingsService.set_many(db, {
        "backup_last_run": datetime.now().isoformat(),
        "backup_last_status": "SUCCESS",
    })
    return {"success": True, "message": msg, "backup_id": bid}


@router.get("/camera")
def get_camera_settings(db: Session = Depends(get_db)):
    return {
        "device_id": AppSettingsService.get_value(db, "camera_default_id", ""),
        "device_label": AppSettingsService.get_value(db, "camera_default_label", ""),
    }


@router.post("/camera")
def set_camera_settings(data: CameraSettings, db: Session = Depends(get_db)):
    AppSettingsService.set_many(db, {
        "camera_default_id": data.device_id,
        "camera_default_label": data.device_label,
    })
    return {"success": True, "message": "تم الحفظ"}


@router.delete("/camera")
def clear_camera_settings(db: Session = Depends(get_db)):
    AppSettingsService.set_many(db, {
        "camera_default_id": "",
        "camera_default_label": "",
    })
    return {"success": True, "message": "تم المسح"}