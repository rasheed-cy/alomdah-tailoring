"""Schemas — Backup."""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BackupOut(BaseModel):
    backup_id: int
    backup_type: str
    file_path: str
    file_size: Optional[int] = None
    status: str
    verification: Optional[str] = None
    sha256_hash: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class BackupCreateResponse(BaseModel):
    success: bool
    message: str
    backup_id: Optional[int] = None
    file_path: Optional[str] = None