"""Schemas — Image."""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ImageOut(BaseModel):
    image_id: int
    customer_id: int
    file_name: str
    file_size: int
    sha256_hash: str
    is_primary: int
    captured_at: Optional[datetime] = None

    class Config:
        from_attributes = True