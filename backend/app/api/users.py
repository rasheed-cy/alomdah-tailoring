"""Endpoints المستخدمين."""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.schemas.user import UserCreate, UserUpdate, UserOut, PasswordChange
from app.services.user_service import UserService

router = APIRouter(prefix="/api/users", tags=["users"])


def _get_current_user_id(authorization: Optional[str] = Header(None)) -> Optional[int]:
    """يستخرج user_id من الـ header — حالياً بسيط."""
    if not authorization:
        return None
    try:
        # تنسيق: "Bearer user_id"
        parts = authorization.split()
        if len(parts) == 2:
            return int(parts[1])
    except Exception:
        pass
    return None


@router.get("")
def list_users(db: Session = Depends(get_db)):
    users = UserService.list_all(db)
    return [
        {
            "user_id": u.user_id,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": int(u.is_active or 0),
            "failed_attempts": int(u.failed_attempts or 0),
            "last_login": u.last_login,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.get("/count")
def count_users(db: Session = Depends(get_db)):
    return {"count": UserService.count(db)}


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = UserService.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user.user_id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": int(user.is_active or 0),
    }


@router.post("", status_code=201)
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    user, msg = UserService.create(db, data)
    if not user:
        raise HTTPException(status_code=400, detail=msg)
    return {
        "user_id": user.user_id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": int(user.is_active or 0),
    }


@router.put("/{user_id}")
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    user, msg = UserService.update(db, user_id, data)
    if not user:
        raise HTTPException(status_code=400, detail=msg)
    return {
        "user_id": user.user_id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": int(user.is_active or 0),
    }


@router.post("/{user_id}/password")
def change_password(user_id: int, data: PasswordChange, db: Session = Depends(get_db)):
    ok, msg = UserService.change_password(db, user_id, data)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    current_id = _get_current_user_id(authorization) or 0
    ok, msg = UserService.delete(db, user_id, current_id)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}