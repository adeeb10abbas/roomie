from sqlalchemy.orm import Session

from db.models.identity.devices import Device
from db.schemas.identity.devices import DeviceCreate
from repositories import users as user_repository
from repositories import devices as device_repository


def create(db: Session, payload: DeviceCreate) -> Device | None:
    user = user_repository.get_by_id(db, payload.user_id)
    if not user:
        return None
    return device_repository.create(db, payload)
