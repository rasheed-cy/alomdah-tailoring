"""Endpoints الصور."""
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.image import ImageOut
from app.services.image_service import ImageService

router = APIRouter(tags=["images"])


@router.get("/api/customers/{customer_id}/images", response_model=List[ImageOut])
def list_customer_images(customer_id: int, db: Session = Depends(get_db)):
    return ImageService.list_by_customer(db, customer_id)


@router.post("/api/customers/{customer_id}/images", response_model=ImageOut, status_code=201)
async def upload_customer_image(
    customer_id: int,
    file: UploadFile = File(...),
    is_primary: int = 1,
    db: Session = Depends(get_db),
):
    # اكتب الملف المؤقت
    suffix = Path(file.filename or "image.jpg").suffix or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        iid, msg = ImageService.save_image(
            db, customer_id, tmp_path, is_primary=is_primary
        )
    finally:
        try:
            tmp_path.unlink()
        except Exception:
            pass

    if iid is None:
        raise HTTPException(status_code=400, detail=msg)

    img = ImageService.get(db, iid)
    return img


@router.get("/api/images/{image_id}")
def get_image(image_id: int, db: Session = Depends(get_db)):
    img = ImageService.get(db, image_id)
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    p = Path(img.file_path)
    if not p.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(str(p))


@router.get("/api/customers/{customer_id}/images/primary")
def get_primary_image(customer_id: int, db: Session = Depends(get_db)):
    img = ImageService.get_primary(db, customer_id)
    if not img:
        raise HTTPException(status_code=404, detail="No primary image")
    p = Path(img.file_path)
    if not p.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(str(p))


@router.delete("/api/images/{image_id}")
def delete_image(image_id: int, db: Session = Depends(get_db)):
    ok = ImageService.delete(db, image_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"success": True, "message": "Image deleted"}