from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProfileBase(BaseModel):
    name: str
    age: int
    gender: str
    university_name: str | None = None
    occupation: str | None = None
    bio: str | None = None
    photos: list[str] = Field(default_factory=list)
    communication_style: str | None = None
    embedding: list[float] | None = None
    is_visible: bool = True


class ProfileCreate(ProfileBase):
    user_id: UUID


class ProfileUpdate(BaseModel):
    name: str | None = None
    age: int | None = None
    gender: str | None = None
    university_name: str | None = None
    occupation: str | None = None
    bio: str | None = None
    photos: list[str] | None = None
    communication_style: str | None = None
    embedding: list[float] | None = None
    is_visible: bool | None = None


class Profile(ProfileBase):
    id: UUID
    user_id: UUID
    updated_at: datetime

    model_config = {"from_attributes": True}
