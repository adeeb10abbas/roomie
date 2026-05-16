import uuid

from sqlalchemy.orm import Session

from db.models.identity.devices import Device
from db.schemas.identity.devices import DeviceCreate


def create(db: Session, payload: DeviceCreate) -> Device:
    device = Device(**payload.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


def get_by_id(db: Session, device_id: uuid.UUID) -> Device | None:
    return db.query(Device).filter(Device.id == device_id).first()
