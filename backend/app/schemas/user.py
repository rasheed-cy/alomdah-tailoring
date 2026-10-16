"""Schemas — User."""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None
    role: str = Field(..., min_length=2, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    is_active: int = 1


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[int] = None


class PasswordChange(BaseModel):
    new_password: str = Field(..., min_length=6, max_length=100)


class UserOut(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str] = None
    role: str
    is_active: int
    failed_attempts: int = 0
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True