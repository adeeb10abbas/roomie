from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field


class FilterPreferencesBase(BaseModel):
    budget_min: int
    budget_max: int
    move_in_from: date
    move_in_to: date
    max_distance_km: int
    neighborhoods: list[str] = Field(default_factory=list)
    cleanliness_min: int
    social_level_min: int
    smoking_ok: bool = False
    languages: list[str] = Field(default_factory=list)
    religion_filter: str | None = None
    university_filter: str | None = None
    same_gender_only: bool = False
    listing_types: list[str] = Field(default_factory=list)


class FilterPreferencesCreate(FilterPreferencesBase):
    user_id: UUID


class FilterPreferencesUpdate(BaseModel):
    budget_min: int | None = None
    budget_max: int | None = None
    move_in_from: date | None = None
    move_in_to: date | None = None
    max_distance_km: int | None = None
    neighborhoods: list[str] | None = None
    cleanliness_min: int | None = None
    social_level_min: int | None = None
    smoking_ok: bool | None = None
    languages: list[str] | None = None
    religion_filter: str | None = None
    university_filter: str | None = None
    same_gender_only: bool | None = None
    listing_types: list[str] | None = None


class FilterPreferences(FilterPreferencesBase):
    id: UUID
    user_id: UUID

    model_config = {"from_attributes": True}
