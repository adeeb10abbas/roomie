from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field


class LifestylePreferencesBase(BaseModel):
    budget_min: int
    budget_max: int
    move_in_date: date
    move_in_flexibility: int
    preferred_neighborhoods: list[str] = Field(default_factory=list)
    latitude: float | None = None
    longitude: float | None = None
    city_name: str | None = None
    cleanliness: int
    social_level: int
    guest_frequency: str
    smoking: str
    drinking: str
    languages: list[str] = Field(default_factory=list)
    religion: str | None = None
    same_gender_only: bool = False
    lifestyle_tags: list[str] = Field(default_factory=list)
    pets: list[str] = Field(default_factory=list)


class LifestylePreferencesCreate(LifestylePreferencesBase):
    profile_id: UUID


class LifestylePreferencesUpdate(BaseModel):
    budget_min: int | None = None
    budget_max: int | None = None
    move_in_date: date | None = None
    move_in_flexibility: int | None = None
    preferred_neighborhoods: list[str] | None = None
    latitude: float | None = None
    longitude: float | None = None
    city_name: str | None = None
    cleanliness: int | None = None
    social_level: int | None = None
    guest_frequency: str | None = None
    smoking: str | None = None
    drinking: str | None = None
    languages: list[str] | None = None
    religion: str | None = None
    same_gender_only: bool | None = None
    lifestyle_tags: list[str] | None = None
    pets: list[str] | None = None


class LifestylePreferences(LifestylePreferencesBase):
    id: UUID
    profile_id: UUID

    model_config = {"from_attributes": True}
