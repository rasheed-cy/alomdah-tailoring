"""خدمة إدارة الصور — حفظ، التحقق، SHA-256."""
import hashlib
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

from app.models.image import CustomerImage
from app.core.config import IMAGES_DIR


ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
MAX_SIZE_MB = 20


class ImageService:

    @staticmethod
    def compute_sha256(file_path: Path) -> str:
        h = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()

    @staticmethod
    def _unique_name(customer_id: int, ext: str) -> str:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        return f"customer_{customer_id}_{ts}{ext}"

    @staticmethod
    def save_image(db: Session, customer_id: int, source_file: Path,
                   is_primary: int = 1) -> tuple:
        """ينسخ الصورة ويسجلها. يُرجع (image_id, message)."""

        if not source_file.exists():
            return None, f"الملف المصدر غير موجود: {source_file}"

        ext = source_file.suffix.lower()
        if ext not in ALLOWED_EXTS:
            return None, f"امتداد الصورة غير مدعوم: {ext}"

        size = source_file.stat().st_size
        if size > MAX_SIZE_MB * 1024 * 1024:
            return None, f"حجم الصورة كبير ({size // 1024 // 1024} MB)"

        new_name = ImageService._unique_name(customer_id, ext)
        customer_dir = IMAGES_DIR / f"customer_{customer_id}"
        customer_dir.mkdir(parents=True, exist_ok=True)
        dest = customer_dir / new_name

        try:
            shutil.copy2(source_file, dest)
        except Exception as e:
            return None, f"فشل نسخ الصورة: {e}"

        sha = ImageService.compute_sha256(dest)

        try:
            img = CustomerImage(
                customer_id=customer_id,
                file_path=str(dest),
                file_name=new_name,
                file_size=size,
                sha256_hash=sha,
                is_primary=is_primary,
            )
            db.add(img)
            db.commit()
            db.refresh(img)
            return img.image_id, "تم حفظ الصورة"
        except Exception as e:
            try:
                dest.unlink()
            except Exception:
                pass
            db.rollback()
            return None, f"فشل حفظ الصورة في DB: {e}"

    @staticmethod
    def list_by_customer(db: Session, customer_id: int) -> list:
        return (
            db.query(CustomerImage)
            .filter(CustomerImage.customer_id == customer_id)
            .order_by(CustomerImage.is_primary.desc(),
                      CustomerImage.captured_at.desc())
            .all()
        )

    @staticmethod
    def get(db: Session, image_id: int) -> Optional[CustomerImage]:
        return db.query(CustomerImage).filter(
            CustomerImage.image_id == image_id
        ).first()

    @staticmethod
    def get_primary(db: Session, customer_id: int) -> Optional[CustomerImage]:
        return (
            db.query(CustomerImage)
            .filter(
                CustomerImage.customer_id == customer_id,
                CustomerImage.is_primary == 1,
            )
            .order_by(CustomerImage.captured_at.desc())
            .first()
        )

    @staticmethod
    def delete(db: Session, image_id: int) -> bool:
        img = ImageService.get(db, image_id)
        if not img:
            return False
        try:
            p = Path(img.file_path)
            if p.exists():
                p.unlink()
        except Exception:
            pass
        db.delete(img)
        db.commit()
        return True