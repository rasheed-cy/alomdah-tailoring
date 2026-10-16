"""Schemas — Auth + Session."""
from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class UserInfo(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str] = None
    role: str


class LoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[UserInfo] = None
    token: Optional[str] = None


class TokenRefreshResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None


class SessionInfo(BaseModel):
    valid: bool
    user: Optional[UserInfo] = None
    expires_in: Optional[int] = None