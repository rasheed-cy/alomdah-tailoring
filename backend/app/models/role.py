"""نموذج الدور."""
from sqlalchemy import Column, Integer, String, TIMESTAMP, Numeric, text, Text
from app.db.database import Base


class Role(Base):
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True, autoincrement=True)
    role_code = Column(String(50), unique=True, nullable=False)
    role_name_ar = Column(String(100), nullable=False)
    description = Column(String(500))
    permissions = Column(Text)  # JSON string
    is_system = Column(Numeric(1), default=0, nullable=False)
    is_active = Column(Numeric(1), default=1, nullable=False)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(TIMESTAMP)