from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.schemas.identity.devices import Device as DeviceSchema
from db.schemas.identity.devices import DeviceCreate
from db.session import get_db
from services import devices as devices_service

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/", response_model=DeviceSchema, status_code=status.HTTP_201_CREATED)
def create_device(payload: DeviceCreate, db: Session = Depends(get_db)):
    device = devices_service.create(db, payload)
    if not device:
        raise HTTPException(status_code=404, detail="User not found")
    return device
