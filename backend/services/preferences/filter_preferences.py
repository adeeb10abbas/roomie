import uuid

from sqlalchemy.orm import Session

from db.models.preferences.filter_preferences import FilterPreferences
from db.schemas.preferences.filter_preferences import (
    FilterPreferencesCreate,
    FilterPreferencesUpdate,
)
from repositories.preferences import filter_preferences as repo


def create(db: Session, payload: FilterPreferencesCreate) -> FilterPreferences | None:
    if repo.get_by_user_id(db, payload.user_id):
        return None
    return repo.create(db, payload)


def get_by_id(db: Session, pref_id: uuid.UUID) -> FilterPreferences | None:
    return repo.get_by_id(db, pref_id)


def get_by_user_id(db: Session, user_id: uuid.UUID) -> FilterPreferences | None:
    return repo.get_by_user_id(db, user_id)


def update(
    db: Session, pref_id: uuid.UUID, payload: FilterPreferencesUpdate
) -> FilterPreferences | None:
    prefs = repo.get_by_id(db, pref_id)
    if not prefs:
        return None
    return repo.update(db, prefs, payload)
