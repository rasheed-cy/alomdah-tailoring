"""Endpoints النسخ الاحتياطي."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from typing import List

from app.db.database import get_db
from app.schemas.backup import BackupOut, BackupCreateResponse
from app.services.backup_service import BackupService

router = APIRouter(prefix="/api/backup", tags=["backup"])


@router.post("/create", response_model=BackupCreateResponse)
def create_backup(db: Session = Depends(get_db)):
    bid, path, msg = BackupService.create_backup(db, backup_type="MANUAL")
    if not path:
        raise HTTPException(status_code=500, detail=msg)
    try:
        BackupService.cleanup_old(db, keep=30)
    except Exception:
        pass
    return BackupCreateResponse(success=True, message=msg, backup_id=bid, file_path=path)


@router.get("/list")
def list_backups(db: Session = Depends(get_db)):
    """يعيد قائمة النسخ مع الإحصائيات."""
    backups = BackupService.list_backups(db)
    result = []
    for b in backups:
        stats = BackupService.get_stats(db, b.backup_id)
        result.append({
            "backup_id": b.backup_id,
            "backup_type": b.backup_type,
            "file_path": b.file_path,
            "file_size": int(b.file_size) if b.file_size else 0,
            "status": b.status,
            "verification": b.verification,
            "sha256_hash": b.sha256_hash,
            "started_at": b.started_at.isoformat() if b.started_at else None,
            "completed_at": b.completed_at.isoformat() if b.completed_at else None,
            "stats": stats,
        })
    return result


@router.get("/{backup_id}")
def get_backup(backup_id: int, db: Session = Depends(get_db)):
    log = BackupService.get(db, backup_id)
    if not log:
        raise HTTPException(status_code=404, detail="Backup not found")
    stats = BackupService.get_stats(db, backup_id)
    return {
        "backup_id": log.backup_id,
        "backup_type": log.backup_type,
        "file_size": int(log.file_size) if log.file_size else 0,
        "status": log.status,
        "verification": log.verification,
        "started_at": log.started_at.isoformat() if log.started_at else None,
        "stats": stats,
    }


@router.get("/{backup_id}/download")
def download_backup(backup_id: int, db: Session = Depends(get_db)):
    log = BackupService.get(db, backup_id)
    if not log:
        raise HTTPException(status_code=404, detail="Backup not found")
    p = Path(log.file_path)
    if not p.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(p), filename=p.name, media_type="application/zip")


@router.post("/{backup_id}/verify")
def verify_backup(backup_id: int, db: Session = Depends(get_db)):
    ok, msg = BackupService.verify(db, backup_id)
    return {"success": ok, "message": msg}


@router.post("/{backup_id}/restore")
def restore_backup(backup_id: int, db: Session = Depends(get_db)):
    ok, msg = BackupService.restore(db, backup_id)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}


@router.delete("/{backup_id}")
def delete_backup(backup_id: int, db: Session = Depends(get_db)):
    ok = BackupService.delete(db, backup_id)
    if not ok:
        raise HTTPException(
            status_code=400,
            detail="لا يمكن حذف النسخة (قد تكون الوحيدة الصالحة)",
        )
    return {"success": True, "message": "تم الحذف"}