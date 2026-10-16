"""Endpoints الزبائن."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerOut
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/api/customers", tags=["customers"])


# ============== endpoints ثابتة (قبل المتغيرة) ==============

@router.get("", response_model=List[CustomerOut])
def list_customers(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    return CustomerService.list_all(db, skip=skip, limit=limit)


@router.get("/count")
def count_customers(db: Session = Depends(get_db)):
    return {"count": CustomerService.count(db)}


@router.get("/count-archived")
def count_archived(db: Session = Depends(get_db)):
    return {"count": CustomerService.count_archived(db)}


@router.get("/archived", response_model=List[CustomerOut])
def list_archived(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    return CustomerService.list_archived(db, skip=skip, limit=limit)


@router.get("/search", response_model=List[CustomerOut])
def search_customers(
    q: str = Query(..., min_length=1),
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return CustomerService.search(db, q, limit=limit)


# ============== POST/CREATE ==============

@router.post("", response_model=CustomerOut, status_code=201)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    return CustomerService.create(db, data)


# ============== endpoints متغيرة (بعد الثابتة) ==============

@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = CustomerService.get(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, data: CustomerUpdate, db: Session = Depends(get_db)):
    customer = CustomerService.update(db, customer_id, data)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("/{customer_id}/archive")
def archive_customer(customer_id: int, reason: str = "", db: Session = Depends(get_db)):
    ok = CustomerService.archive(db, customer_id, reason=reason)
    if not ok:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"success": True, "message": "تم أرشفة الزبون"}


@router.post("/{customer_id}/restore")
def restore_customer(customer_id: int, db: Session = Depends(get_db)):
    ok = CustomerService.restore(db, customer_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"success": True, "message": "تم استعادة الزبون"}


@router.delete("/{customer_id}")
def delete_permanent(customer_id: int, db: Session = Depends(get_db)):
    ok = CustomerService.delete_permanent(db, customer_id)
    if not ok:
        raise HTTPException(status_code=400, detail="لا يمكن الحذف (الزبون غير مؤرشف)")
    return {"success": True, "message": "تم الحذف النهائي"}