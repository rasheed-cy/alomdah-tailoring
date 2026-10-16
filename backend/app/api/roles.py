"""Endpoints الأدوار."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.role import RoleCreate, RoleUpdate, RoleOut
from app.services.role_service import RoleService

router = APIRouter(prefix="/api/roles", tags=["roles"])


@router.get("")
def list_roles(db: Session = Depends(get_db)):
    return RoleService.list_all(db)


@router.get("/{role_id}")
def get_role(role_id: int, db: Session = Depends(get_db)):
    role = RoleService.get(db, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return RoleService._to_dict(role)


@router.post("", status_code=201)
def create_role(data: RoleCreate, db: Session = Depends(get_db)):
    role, msg = RoleService.create(db, data)
    if not role:
        raise HTTPException(status_code=400, detail=msg)
    return RoleService._to_dict(role)


@router.put("/{role_id}")
def update_role(role_id: int, data: RoleUpdate, db: Session = Depends(get_db)):
    role, msg = RoleService.update(db, role_id, data)
    if not role:
        raise HTTPException(status_code=400, detail=msg)
    return RoleService._to_dict(role)


@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    ok, msg = RoleService.delete(db, role_id)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}