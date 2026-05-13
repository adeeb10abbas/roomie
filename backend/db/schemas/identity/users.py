from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    clerk_id: str
    email: str
    phone: str | None = None
    university_verified: bool = False
    is_banned: bool = False
    onboarding_complete: bool = False


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    phone: str | None = None
    university_verified: bool | None = None
    is_banned: bool | None = None
    onboarding_complete: bool | None = None
    last_active_at: datetime | None = None


class User(UserBase):
    id: UUID
    created_at: datetime
    last_active_at: datetime | None = None

    model_config = {"from_attributes": True}
