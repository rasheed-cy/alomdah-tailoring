"""خدمة الأدوار."""
import json
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.role import Role
from app.models.user import User
from app.schemas.role import RoleCreate, RoleUpdate


class RoleService:

    @staticmethod
    def _to_dict(role: Role) -> dict:
        """يحوّل دور إلى dict مع فك JSON."""
        perms = {}
        try:
            if role.permissions:
                perms = json.loads(role.permissions)
        except Exception:
            perms = {}
        return {
            "role_id": role.role_id,
            "role_code": role.role_code,
            "role_name_ar": role.role_name_ar,
            "description": role.description,
            "permissions": perms,
            "is_system": int(role.is_system or 0),
            "is_active": int(role.is_active or 1),
            "created_at": role.created_at,
        }

    @staticmethod
    def list_all(db: Session) -> List[dict]:
        roles = db.query(Role).order_by(Role.is_system.desc(), Role.role_id).all()
        result = []
        for r in roles:
            d = RoleService._to_dict(r)
            # عدد المستخدمين
            count = db.query(func.count(User.user_id)).filter(User.role == r.role_code).scalar() or 0
            d["users_count"] = count
            result.append(d)
        return result

    @staticmethod
    def get(db: Session, role_id: int) -> Optional[Role]:
        return db.query(Role).filter(Role.role_id == role_id).first()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[Role]:
        return db.query(Role).filter(Role.role_code == code).first()

    @staticmethod
    def create(db: Session, data: RoleCreate) -> tuple:
        # فحص أن الرمز غير موجود
        existing = RoleService.get_by_code(db, data.role_code)
        if existing:
            return None, "رمز الدور مستخدم مسبقاً"

        role = Role(
            role_code=data.role_code,
            role_name_ar=data.role_name_ar,
            description=data.description,
            permissions=json.dumps(data.permissions, ensure_ascii=False),
            is_system=0,
            is_active=data.is_active,
        )
        db.add(role)
        db.commit()
        db.refresh(role)
        return role, "تم إنشاء الدور"

    @staticmethod
    def update(db: Session, role_id: int, data: RoleUpdate) -> tuple:
        role = RoleService.get(db, role_id)
        if not role:
            return None, "الدور غير موجود"

        # حماية الأدوار النظامية
        if role.is_system == 1:
            if data.role_code and data.role_code != role.role_code:
                return None, "لا يمكن تغيير رمز دور نظامي"
            if data.is_active == 0:
                return None, "لا يمكن تعطيل دور نظامي"

        if data.role_name_ar:
            role.role_name_ar = data.role_name_ar
        if data.description is not None:
            role.description = data.description
        if data.permissions is not None:
            role.permissions = json.dumps(data.permissions, ensure_ascii=False)
        if data.is_active is not None and role.is_system != 1:
            role.is_active = data.is_active

        db.commit()
        db.refresh(role)
        return role, "تم التحديث"

    @staticmethod
    def delete(db: Session, role_id: int) -> tuple:
        role = RoleService.get(db, role_id)
        if not role:
            return False, "الدور غير موجود"
        if role.is_system == 1:
            return False, "لا يمكن حذف دور نظامي"

        # فحص وجود مستخدمين بهذا الدور
        count = db.query(func.count(User.user_id)).filter(User.role == role.role_code).scalar() or 0
        if count > 0:
            return False, f"لا يمكن الحذف — {count} مستخدم يستخدم هذا الدور"

        db.delete(role)
        db.commit()
        return True, "تم الحذف"