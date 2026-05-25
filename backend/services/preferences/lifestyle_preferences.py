import uuid

from sqlalchemy.orm import Session

from db.models.preferences.lifestyle_preferences import LifestylePreferences
from db.schemas.preferences.lifestyle_preferences import (
    LifestylePreferencesCreate,
    LifestylePreferencesUpdate,
)
from repositories.preferences import lifestyle_preferences as repo


def create(db: Session, payload: LifestylePreferencesCreate) -> LifestylePreferences | None:
    if repo.get_by_profile_id(db, payload.profile_id):
        return None
    return repo.create(db, payload)


def get_by_id(db: Session, pref_id: uuid.UUID) -> LifestylePreferences | None:
    return repo.get_by_id(db, pref_id)


def get_by_profile_id(db: Session, profile_id: uuid.UUID) -> LifestylePreferences | None:
    return repo.get_by_profile_id(db, profile_id)


def update(
    db: Session, pref_id: uuid.UUID, payload: LifestylePreferencesUpdate
) -> LifestylePreferences | None:
    prefs = repo.get_by_id(db, pref_id)
    if not prefs:
        return None
    return repo.update(db, prefs, payload)
