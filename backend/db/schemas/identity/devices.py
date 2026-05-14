from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


DevicePlatform = Literal["ios", "android"]


class DeviceBase(BaseModel):
    expo_push_token: str
    platform: DevicePlatform
    device_name: str | None = None
    app_version: str | None = None
    device_os_version: str | None = None
    is_active: bool = True


class DeviceCreate(DeviceBase):
    user_id: UUID


class DeviceUpdate(BaseModel):
    expo_push_token: str | None = None
    platform: DevicePlatform | None = None
    device_name: str | None = None
    app_version: str | None = None
    device_os_version: str | None = None
    is_active: bool | None = None
    last_seen_at: datetime | None = None


class Device(DeviceBase):
    id: UUID
    user_id: UUID
    last_seen_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
