"""Endpoints المصادقة + الجلسات."""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.db.database import get_db
from app.schemas.auth import (
    LoginRequest, LoginResponse, UserInfo,
    TokenRefreshResponse, SessionInfo,
)
from app.services.auth_service import AuthService
from app.services.session_service import SessionService

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _extract_token(authorization: Optional[str]) -> Optional[str]:
    """يستخرج الـ token من الـ header."""
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return authorization.strip()


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    ok, message, user = AuthService.login(db, data.username, data.password)
    if not ok:
        return LoginResponse(success=False, message=message, user=None)

    # إنشاء JWT
    token = SessionService.create_token(
        user_id=user["user_id"],
        username=user["username"],
        role=user["role"],
    )

    return LoginResponse(
        success=True,
        message=message,
        user=UserInfo(**user),
        token=token,
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
def refresh(
    authorization: Optional[str] = Header(None),
):
    token = _extract_token(authorization)
    if not token:
        return TokenRefreshResponse(success=False, message="لا يوجد token")

    ok, result = SessionService.refresh_token(token)
    if not ok:
        return TokenRefreshResponse(success=False, message=result)

    return TokenRefreshResponse(success=True, message="تم التجديد", token=result)


@router.get("/me", response_model=SessionInfo)
def me(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    token = _extract_token(authorization)
    if not token:
        return SessionInfo(valid=False)

    valid, payload = SessionService.verify_token(token)
    if not valid:
        return SessionInfo(valid=False)

    # حساب الوقت المتبقي
    exp = payload.get("exp")
    remaining = None
    if exp:
        try:
            remaining = int((datetime.utcfromtimestamp(exp) - datetime.utcnow()).total_seconds())
        except Exception:
            remaining = None

    return SessionInfo(
        valid=True,
        user=UserInfo(
            user_id=payload["user_id"],
            username=payload["username"],
            full_name=payload.get("full_name"),
            role=payload["role"],
        ),
        expires_in=remaining,
    )


@router.post("/logout")
def logout():
    return {"success": True, "message": "تم تسجيل الخروج"}


@router.get("/health")
def auth_health():
    return {"status": "ok", "module": "auth"}