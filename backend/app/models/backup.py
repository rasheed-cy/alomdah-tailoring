"""نموذج سجل النسخ الاحتياطي."""
from sqlalchemy import Column, Integer, String, TIMESTAMP, Numeric, text
from app.db.database import Base


class BackupLog(Base):
    __tablename__ = "backup_log"

    backup_id = Column(Integer, primary_key=True, autoincrement=True)
    backup_type = Column(String(20), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Numeric(15))
    status = Column(String(20), nullable=False)
    verification = Column(String(20))
    sha256_hash = Column(String(64))
    started_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    completed_at = Column(TIMESTAMP)
    notes = Column(String(1000))