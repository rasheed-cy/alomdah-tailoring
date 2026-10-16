"""نموذج المستخدم."""
from sqlalchemy import Column, Integer, String, TIMESTAMP, Numeric, text
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150))
    role = Column(String(20), nullable=False)
    is_active = Column(Numeric(1), default=1, nullable=False)
    failed_attempts = Column(Numeric(3), default=0, nullable=False)
    locked_until = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    last_login = Column(TIMESTAMP)