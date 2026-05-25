import uuid

from sqlalchemy.orm import Session

from db.models.preferences.filter_preferences import FilterPreferences
from db.schemas.preferences.filter_preferences import (
    FilterPreferencesCreate,
    FilterPreferencesUpdate,
)


def get_by_id(db: Session, pref_id: uuid.UUID) -> FilterPreferences | None:
    return db.query(FilterPreferences).filter(FilterPreferences.id == pref_id).first()


def get_by_user_id(db: Session, user_id: uuid.UUID) -> FilterPreferences | None:
    return (
        db.query(FilterPreferences)
        .filter(FilterPreferences.user_id == user_id)
        .first()
    )


def create(db: Session, payload: FilterPreferencesCreate) -> FilterPreferences:
    prefs = FilterPreferences(**payload.model_dump())
    db.add(prefs)
    db.commit()
    db.refresh(prefs)
    return prefs


def update(
    db: Session, prefs: FilterPreferences, payload: FilterPreferencesUpdate
) -> FilterPreferences:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)
    db.commit()
    db.refresh(prefs)
    return prefs
