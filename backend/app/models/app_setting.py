"""نموذج إعدادات التطبيق."""
from sqlalchemy import Column, Integer, String, TIMESTAMP, text
from app.db.database import Base


class AppSetting(Base):
    __tablename__ = "app_settings"

    setting_id = Column(Integer, primary_key=True, autoincrement=True)
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(String(2000))
    setting_type = Column(String(20), default="string", nullable=False)
    description = Column(String(500))
    updated_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))