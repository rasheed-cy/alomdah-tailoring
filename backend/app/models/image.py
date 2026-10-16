"""نموذج صورة الزبون."""
from sqlalchemy import Column, Integer, String, TIMESTAMP, Numeric, text, ForeignKey
from app.db.database import Base


class CustomerImage(Base):
    __tablename__ = "customer_images"

    image_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(200), nullable=False)
    captured_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    file_size = Column(Numeric(12), nullable=False)
    sha256_hash = Column(String(64), nullable=False)
    is_primary = Column(Numeric(1), default=1, nullable=False)
    notes = Column(String(500))