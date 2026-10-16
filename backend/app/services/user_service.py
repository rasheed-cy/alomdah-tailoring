"""خدمة المستخدمين."""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, PasswordChange
from app.services.auth_service import AuthService


class UserService:

    @staticmethod
    def list_all(db: Session) -> List[User]:
        return db.query(User).order_by(User.user_id.desc()).all()

    @staticmethod
    def get(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.user_id == user_id).first()

    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def create(db: Session, data: UserCreate) -> tuple:
        # فحص اسم المستخدم
        existing = UserService.get_by_username(db, data.username)
        if existing:
            return None, "اسم المستخدم موجود مسبقاً"

        # فحص كلمة المرور
        if len(data.password) < 6:
            return None, "كلمة المرور قصيرة (6 أحرف على الأقل)"

        try:
            ph = AuthService.hash_password(data.password)
        except Exception as e:
            return None, f"فشل تشفير كلمة المرور: {e}"

        user = User(
            username=data.username,
            password_hash=ph,
            full_name=data.full_name or data.username,
            role=data.role,
            is_active=data.is_active,
            failed_attempts=0,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, "تم إنشاء المستخدم"

    @staticmethod
    def update(db: Session, user_id: int, data: UserUpdate) -> tuple:
        user = UserService.get(db, user_id)
        if not user:
            return None, "المستخدم غير موجود"

        if data.full_name is not None:
            user.full_name = data.full_name
        if data.role is not None:
            user.role = data.role
        if data.is_active is not None:
            user.is_active = data.is_active

        db.commit()
        db.refresh(user)
        return user, "تم التحديث"

    @staticmethod
    def change_password(db: Session, user_id: int, data: PasswordChange) -> tuple:
        user = UserService.get(db, user_id)
        if not user:
            return False, "المستخدم غير موجود"

        if len(data.new_password) < 6:
            return False, "كلمة المرور قصيرة"

        try:
            user.password_hash = AuthService.hash_password(data.new_password)
            user.failed_attempts = 0
            user.locked_until = None
            db.commit()
            return True, "تم تغيير كلمة المرور"
        except Exception as e:
            return False, f"فشل: {e}"

    @staticmethod
    def delete(db: Session, user_id: int, current_user_id: int) -> tuple:
        user = UserService.get(db, user_id)
        if not user:
            return False, "المستخدم غير موجود"

        if user.user_id == current_user_id:
            return False, "لا يمكن حذف حسابك الحالي"

        # لا تحذف آخر مدير
        if user.role == "ADMIN":
            admins = db.query(func.count(User.user_id)).filter(
                User.role == "ADMIN", User.is_active == 1
            ).scalar() or 0
            if admins <= 1:
                return False, "لا يمكن حذف آخر مدير"

        db.delete(user)
        db.commit()
        return True, "تم الحذف"

    @staticmethod
    def count(db: Session) -> int:
        return db.query(func.count(User.user_id)).scalar() or 0