"""Schemas — Customer."""
from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional


class CustomerBase(BaseModel):
    measurement_page_no: str = Field(..., min_length=1, max_length=20)
    full_name: str = Field(..., min_length=4, max_length=150)
    phone_number: str = Field(..., min_length=7, max_length=20)
    storage_number: str = Field(..., min_length=1, max_length=30)
    delivery_date: Optional[date] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    customer_id: int
    is_deleted: int = 0
    archived_at: Optional[datetime] = None
    archive_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True