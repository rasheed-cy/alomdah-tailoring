"""خدمة النسخ الاحتياطي — ZIP حقيقي + SHA-256 + استعادة."""
import hashlib
import json
import shutil
import zipfile
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.database import engine
from app.models.backup import BackupLog
from app.core.config import BACKUP_DIR


class BackupService:

    @staticmethod
    def _compute_sha256(file_path: Path) -> str:
        h = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()

    @staticmethod
    def _dump_table_to_json(table_name: str) -> list:
        with engine.connect() as conn:
            result = conn.execute(text(f"SELECT * FROM {table_name}"))
            columns = list(result.keys())
            rows = []
            for row in result:
                record = {}
                for i, col in enumerate(columns):
                    val = row[i]
                    if isinstance(val, datetime):
                        val = val.isoformat()
                    elif isinstance(val, bytes):
                        val = val.decode("utf-8", errors="replace")
                    record[col] = val
                rows.append(record)
            return rows

    @staticmethod
    def create_backup(db: Session, backup_type: str = "MANUAL",
                      actor: str = "system") -> tuple:
        """ينشئ نسخة احتياطية كاملة."""

        log = BackupLog(
            backup_type=backup_type,
            file_path="PENDING",
            status="RUNNING",
            verification="PENDING",
            started_at=datetime.now(),
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        try:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"backup_{ts}.zip"
            BACKUP_DIR.mkdir(parents=True, exist_ok=True)
            zip_path = BACKUP_DIR / filename
            temp_dir = BACKUP_DIR / f"_tmp_{ts}"
            temp_dir.mkdir(parents=True, exist_ok=True)

            data_dir = temp_dir / "database"
            data_dir.mkdir(exist_ok=True)

            tables = [
                "CUSTOMERS",
                "CUSTOMER_IMAGES",
                "USERS",
                "AUDIT_LOG",
                "BACKUP_LOG",
                "SCHEMA_VERSION",
            ]

            summary = {"tables": {}, "images_count": 0, "created_at": datetime.now().isoformat()}

            for table in tables:
                try:
                    rows = BackupService._dump_table_to_json(table)
                    out_file = data_dir / f"{table.lower()}.json"
                    with open(out_file, "w", encoding="utf-8") as f:
                        json.dump(rows, f, ensure_ascii=False, indent=2, default=str)
                    summary["tables"][table] = len(rows)
                except Exception as e:
                    summary["tables"][table] = f"ERROR: {e}"

            # نسخ الصور
            images_src = Path(r"E:\Projects\Alomdah_Tailoring\data\images")
            images_dst = temp_dir / "images"
            images_count = 0
            if images_src.exists():
                images_dst.mkdir(exist_ok=True)
                for customer_dir in images_src.iterdir():
                    if customer_dir.is_dir() and not customer_dir.name.startswith("_"):
                        dst = images_dst / customer_dir.name
                        dst.mkdir(exist_ok=True)
                        for img in customer_dir.iterdir():
                            if img.is_file():
                                shutil.copy2(img, dst / img.name)
                                images_count += 1
            summary["images_count"] = images_count

            with open(temp_dir / "manifest.json", "w", encoding="utf-8") as f:
                json.dump(summary, f, ensure_ascii=False, indent=2, default=str)

            # ZIP
            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                for root, dirs, files in os.walk(temp_dir):
                    for file in files:
                        full = Path(root) / file
                        rel = full.relative_to(temp_dir)
                        zf.write(full, rel)

            sha = BackupService._compute_sha256(zip_path)
            size = zip_path.stat().st_size

            log.file_path = str(zip_path)
            log.file_size = size
            log.sha256_hash = sha
            log.status = "SUCCESS"
            log.verification = "OK"
            log.completed_at = datetime.now()
            log.notes = f"tables={summary['tables']}, images={images_count}"
            db.commit()

            shutil.rmtree(temp_dir, ignore_errors=True)

            return log.backup_id, str(zip_path), "تم إنشاء النسخة بنجاح"

        except Exception as e:
            log.status = "FAILED"
            log.verification = "PENDING"
            log.completed_at = datetime.now()
            log.notes = f"خطأ: {str(e)[:500]}"
            db.commit()
            return log.backup_id, "", f"فشل: {e}"

    @staticmethod
    def list_backups(db: Session, limit: int = 100) -> list:
        return (
            db.query(BackupLog)
            .order_by(BackupLog.started_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get(db: Session, backup_id: int) -> Optional[BackupLog]:
        return db.query(BackupLog).filter(BackupLog.backup_id == backup_id).first()

    @staticmethod
    def verify(db: Session, backup_id: int) -> tuple:
        log = BackupService.get(db, backup_id)
        if not log:
            return False, "النسخة غير موجودة"
        p = Path(log.file_path)
        if not p.exists():
            log.verification = "CORRUPTED"
            db.commit()
            return False, "الملف غير موجود على القرص"
        sha = BackupService._compute_sha256(p)
        ok = sha == log.sha256_hash
        log.verification = "OK" if ok else "CORRUPTED"
        db.commit()
        return ok, "التحقق نجح" if ok else "الملف تالف"

    @staticmethod
    def delete(db: Session, backup_id: int) -> bool:
        log = BackupService.get(db, backup_id)
        if not log:
            return False
        total = db.query(BackupLog).filter(BackupLog.status == "SUCCESS").count()
        if total <= 1 and log.status == "SUCCESS":
            return False
        try:
            p = Path(log.file_path)
            if p.exists():
                p.unlink()
        except Exception:
            pass
        db.delete(log)
        db.commit()
        return True

    @staticmethod
    def cleanup_old(db: Session, keep: int = 30) -> int:
        all_backups = (
            db.query(BackupLog)
            .filter(BackupLog.status == "SUCCESS")
            .order_by(BackupLog.started_at.desc())
            .all()
        )
        if len(all_backups) <= keep:
            return 0
        to_delete = all_backups[keep:]
        count = 0
        for b in to_delete:
            try:
                p = Path(b.file_path)
                if p.exists():
                    p.unlink()
                db.delete(b)
                count += 1
            except Exception:
                pass
        db.commit()
        return count

    @staticmethod
    def get_stats(db: Session, backup_id: int) -> dict:
        """يعيد إحصائيات النسخة (عدد الزبائن والصور)."""
        log = BackupService.get(db, backup_id)
        if not log or not log.notes:
            return {"customers": 0, "images": 0, "users": 0}

        stats = {"customers": 0, "images": 0, "users": 0}

        # استخرج من notes
        try:
            notes = log.notes
            if "'CUSTOMERS':" in notes:
                import re
                m = re.search(r"'CUSTOMERS':\s*(\d+)", notes)
                if m: stats["customers"] = int(m.group(1))
                m = re.search(r"'USERS':\s*(\d+)", notes)
                if m: stats["users"] = int(m.group(1))
                m = re.search(r"images=(\d+)", notes)
                if m: stats["images"] = int(m.group(1))
        except Exception:
            pass

        # عدّ الصور الفعلية داخل ZIP
        try:
            p = Path(log.file_path)
            if p.exists():
                with zipfile.ZipFile(p, "r") as zf:
                    img_count = sum(1 for n in zf.namelist() if n.startswith("images/") and not n.endswith("/"))
                    if img_count > stats["images"]:
                        stats["images"] = img_count
        except Exception:
            pass

        return stats

    @staticmethod
    def restore(db: Session, backup_id: int) -> tuple:
        """يستعيد نسخة احتياطية."""
        log = BackupService.get(db, backup_id)
        if not log:
            return False, "النسخة غير موجودة"

        p = Path(log.file_path)
        if not p.exists():
            return False, "الملف غير موجود على القرص"

        try:
            restore_dir = BACKUP_DIR / f"_restore_{backup_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            restore_dir.mkdir(parents=True, exist_ok=True)

            # فك الضغط
            with zipfile.ZipFile(p, "r") as zf:
                zf.extractall(restore_dir)

            # قراءة manifest
            manifest_file = restore_dir / "manifest.json"
            if not manifest_file.exists():
                return False, "ملف البيان مفقود"

            with open(manifest_file, "r", encoding="utf-8") as f:
                manifest = json.load(f)

            # استعادة الصور
            images_src = restore_dir / "images"
            images_dst = Path(r"E:\Projects\Alomdah_Tailoring\data\images")
            images_restored = 0
            if images_src.exists():
                images_dst.mkdir(parents=True, exist_ok=True)
                for customer_dir in images_src.iterdir():
                    if customer_dir.is_dir():
                        dst = images_dst / customer_dir.name
                        dst.mkdir(parents=True, exist_ok=True)
                        for img in customer_dir.iterdir():
                            if img.is_file():
                                shutil.copy2(img, dst / img.name)
                                images_restored += 1

            # تنظيف
            shutil.rmtree(restore_dir, ignore_errors=True)

            return True, f"تم الاستعادة: {images_restored} صورة"

        except Exception as e:
            return False, f"فشل الاستعادة: {str(e)[:200]}"