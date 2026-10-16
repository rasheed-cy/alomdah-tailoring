"""نموذج الزبون."""
from sqlalchemy import Column, Integer, String, TIMESTAMP, Numeric, Date, text
from app.db.database import Base


class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True, autoincrement=True)
    measurement_page_no = Column(String(20), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone_number = Column(String(20), nullable=False)
    storage_number = Column(String(30), nullable=False)
    delivery_date = Column(Date)
    archived_at = Column(TIMESTAMP)
    archive_reason = Column(String(500))
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    created_by = Column(String(50))
    updated_by = Column(String(50))
    is_deleted = Column(Numeric(1), default=0, nullable=False)