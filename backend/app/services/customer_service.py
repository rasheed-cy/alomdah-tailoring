"""خدمة الزبائن — أرشفة + فرز بالتاريخ."""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc, asc, nullslast

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CustomerService:

    @staticmethod
    def list_all(db: Session, skip: int = 0, limit: int = 200) -> List[Customer]:
        """يعيد الزبائن النشطين — مرتبين حسب تاريخ التسليم (الأقرب أولاً)."""
        return (
            db.query(Customer)
            .filter(Customer.is_deleted == 0)
            .order_by(nullslast(asc(Customer.delivery_date)), desc(Customer.customer_id))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def list_archived(db: Session, skip: int = 0, limit: int = 200) -> List[Customer]:
        """الزبائن المؤرشفون."""
        return (
            db.query(Customer)
            .filter(Customer.is_deleted == 1)
            .order_by(desc(Customer.archived_at), desc(Customer.customer_id))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def count(db: Session) -> int:
        return db.query(func.count(Customer.customer_id)).filter(
            Customer.is_deleted == 0
        ).scalar() or 0

    @staticmethod
    def count_archived(db: Session) -> int:
        return db.query(func.count(Customer.customer_id)).filter(
            Customer.is_deleted == 1
        ).scalar() or 0

    @staticmethod
    def get(db: Session, customer_id: int) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.customer_id == customer_id).first()

    @staticmethod
    def search(db: Session, query: str, limit: int = 100) -> List[Customer]:
        if not query or not query.strip():
            return CustomerService.list_all(db, limit=limit)

        q = f"%{query.strip()}%"
        return (
            db.query(Customer)
            .filter(
                Customer.is_deleted == 0,
                or_(
                    func.to_char(Customer.customer_id).like(q),
                    Customer.measurement_page_no.like(q),
                    Customer.full_name.like(q),
                    Customer.phone_number.like(q),
                    Customer.storage_number.like(q),
                ),
            )
            .order_by(nullslast(asc(Customer.delivery_date)), desc(Customer.customer_id))
            .limit(limit)
            .all()
        )

    @staticmethod
    def create(db: Session, data: CustomerCreate, actor: str = "api") -> Customer:
        customer = Customer(
            measurement_page_no=data.measurement_page_no,
            full_name=data.full_name,
            phone_number=data.phone_number,
            storage_number=data.storage_number,
            delivery_date=data.delivery_date,
            created_by=actor,
            updated_by=actor,
            is_deleted=0,
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def update(db: Session, customer_id: int, data: CustomerUpdate, actor: str = "api") -> Optional[Customer]:
        customer = CustomerService.get(db, customer_id)
        if not customer:
            return None

        customer.measurement_page_no = data.measurement_page_no
        customer.full_name = data.full_name
        customer.phone_number = data.phone_number
        customer.storage_number = data.storage_number
        customer.delivery_date = data.delivery_date
        customer.updated_by = actor

        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def archive(db: Session, customer_id: int, reason: str = "", actor: str = "api") -> bool:
        """أرشفة الزبون (بدل الحذف)."""
        customer = CustomerService.get(db, customer_id)
        if not customer:
            return False
        customer.is_deleted = 1
        customer.archived_at = datetime.now()
        customer.archive_reason = reason or "أرشفة يدوية"
        customer.updated_by = actor
        db.commit()
        return True

    @staticmethod
    def restore(db: Session, customer_id: int, actor: str = "api") -> bool:
        """استعادة من الأرشيف."""
        customer = CustomerService.get(db, customer_id)
        if not customer:
            return False
        customer.is_deleted = 0
        customer.archived_at = None
        customer.archive_reason = None
        customer.updated_by = actor
        db.commit()
        return True

    @staticmethod
    def delete_permanent(db: Session, customer_id: int) -> bool:
        """حذف نهائي (من الأرشيف فقط)."""
        customer = CustomerService.get(db, customer_id)
        if not customer or customer.is_deleted != 1:
            return False
        db.delete(customer)
        db.commit()
        return True