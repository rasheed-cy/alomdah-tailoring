"""Schemas — Role."""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict


class RoleBase(BaseModel):
    role_code: str = Field(..., min_length=2, max_length=50)
    role_name_ar: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    permissions: Dict[str, bool] = {}
    is_active: int = 1


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    role_name_ar: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[Dict[str, bool]] = None
    is_active: Optional[int] = None


class RoleOut(BaseModel):
    role_id: int
    role_code: str
    role_name_ar: str
    description: Optional[str] = None
    permissions: Dict[str, bool] = {}
    is_system: int
    is_active: int
    created_at: Optional[datetime] = None
    users_count: int = 0

    class Config:
        from_attributes = True