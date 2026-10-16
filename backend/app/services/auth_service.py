"""خدمة المصادقة — Argon2id."""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.user import User

try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
    _ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
    HAS_ARGON = True
except ImportError:
    HAS_ARGON = False
    _ph = None


class AuthService:

    @staticmethod
    def hash_password(plain: str) -> str:
        if not HAS_ARGON:
            raise RuntimeError("argon2 غير متوفر")
        return _ph.hash(plain)

    @staticmethod
    def verify_password(stored_hash: str, plain: str) -> bool:
        if not HAS_ARGON:
            return False
        try:
            return _ph.verify(stored_hash, plain)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False

    @staticmethod
    def login(db: Session, username: str, password: str) -> tuple:
        """يُرجع (نجاح، رسالة، user dict)."""

        if not username or not password:
            return False, "أدخل اسم المستخدم وكلمة المرور", None

        user = db.query(User).filter(User.username == username.strip()).first()

        if not user:
            return False, "اسم المستخدم أو كلمة المرور غير صحيحة", None

        # قفل الحساب
        if user.locked_until and user.locked_until > datetime.now():
            return False, "الحساب مقفل مؤقتاً. حاول لاحقاً.", None

        # تفعيل
        if user.is_active != 1:
            return False, "الحساب غير مفعّل", None

        # كلمة المرور
        if not AuthService.verify_password(user.password_hash, password):
            user.failed_attempts = (user.failed_attempts or 0) + 1
            db.commit()
            return False, "اسم المستخدم أو كلمة المرور غير صحيحة", None

        # نجاح
        user.failed_attempts = 0
        user.locked_until = None
        user.last_login = datetime.now()
        db.commit()

        return True, "مرحباً بك", {
            "user_id": user.user_id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
        }