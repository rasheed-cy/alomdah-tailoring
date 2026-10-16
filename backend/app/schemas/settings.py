"""Schemas — Settings."""
from pydantic import BaseModel
from typing import Optional


class SystemInfo(BaseModel):
    app_name: str
    app_version: str
    python_version: str
    oracle_version: str
    fastapi_version: str
    sqlalchemy_version: str
    os_info: str
    hostname: str
    database_connected: bool
    tables_count: int
    customers_count: int
    images_count: int
    users_count: int
    last_backup: Optional[str] = None
    backups_count: int
    paths: dict