"""خدمة إدارة الجلسات — JWT مع تمديد تلقائي."""
import jwt
from datetime import datetime, timedelta
from typing import Optional

from app.core.config import JWT_SECRET_KEY, JWT_ALGORITHM

# مدة الجلسة = 20 دقيقة
SESSION_MINUTES = 20


class SessionService:

    @staticmethod
    def create_token(user_id: int, username: str, role: str) -> str:
        """ينشئ JWT صالحاً لـ 20 دقيقة."""
        now = datetime.utcnow()
        payload = {
            "user_id": user_id,
            "username": username,
            "role": role,
            "iat": now,
            "exp": now + timedelta(minutes=SESSION_MINUTES),
        }
        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        if isinstance(token, bytes):
            token = token.decode("utf-8")
        return token

    @staticmethod
    def verify_token(token: str) -> tuple:
        """
        يتحقق من JWT.
        يُرجع (صالح، بيانات_أو_رسالة).
        """
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            return True, payload
        except jwt.ExpiredSignatureError:
            return False, "انتهت صلاحية الجلسة"
        except jwt.InvalidTokenError as e:
            return False, f"رمز غير صالح: {str(e)[:100]}"

    @staticmethod
    def refresh_token(token: str) -> tuple:
        """
        يجدّد الجلسة إذا كانت لا تزال صالحة.
        يُرجع (نجاح، token_جديد_أو_رسالة).
        """
        valid, payload = SessionService.verify_token(token)
        if not valid:
            return False, payload

        # أنشئ token جديد
        new_token = SessionService.create_token(
            user_id=payload["user_id"],
            username=payload["username"],
            role=payload["role"],
        )
        return True, new_token

    @staticmethod
    def decode_without_verify(token: str) -> Optional[dict]:
        """يفك الترميز بدون التحقق — للاستخدام في الحالات الخاصة."""
        try:
            return jwt.decode(token, options={"verify_signature": False})
        except Exception:
            return None