"""خدمة إعدادات التطبيق."""
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.app_setting import AppSetting


class AppSettingsService:

    @staticmethod
    def get_all(db: Session) -> dict:
        settings = db.query(AppSetting).all()
        result = {}
        for s in settings:
            result[s.setting_key] = {
                "value": s.setting_value,
                "type": s.setting_type,
                "description": s.description,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            }
        return result

    @staticmethod
    def get_value(db: Session, key: str, default: Optional[str] = None) -> Optional[str]:
        s = db.query(AppSetting).filter(AppSetting.setting_key == key).first()
        return s.setting_value if s else default

    @staticmethod
    def get_bool(db: Session, key: str, default: bool = False) -> bool:
        val = AppSettingsService.get_value(db, key)
        if val is None:
            return default
        return val.lower() in ("true", "1", "yes", "on")

    @staticmethod
    def get_int(db: Session, key: str, default: int = 0) -> int:
        val = AppSettingsService.get_value(db, key)
        try:
            return int(val) if val else default
        except (ValueError, TypeError):
            return default

    @staticmethod
    def set_many(db: Session, settings: dict) -> int:
        count = 0
        try:
            for key, value in settings.items():
                s = db.query(AppSetting).filter(AppSetting.setting_key == key).first()
                if s:
                    s.setting_value = str(value) if value is not None else ""
                    s.updated_at = datetime.now()
                else:
                    s = AppSetting(
                        setting_key=key,
                        setting_value=str(value) if value is not None else "",
                    )
                    db.add(s)
                count += 1
            db.commit()
            return count
        except Exception:
            db.rollback()
            return 0

    @staticmethod
    def reset_to_defaults(db: Session) -> bool:
        defaults = {
            "backup_enabled": "false",
            "backup_time": "02:00",
            "backup_keep_count": "30",
            "camera_default_id": "",
            "camera_default_label": "",
            "app_currency": "YER",
            "app_language": "ar",
            "app_theme": "light",
            "app_shop_name": "العمده للخياطة الرجالية",
            "app_shop_phone": "01-272382",
        }
        return AppSettingsService.set_many(db, defaults) > 0