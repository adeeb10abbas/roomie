import uuid

from sqlalchemy.orm import Session

from db.models.preferences.lifestyle_preferences import LifestylePreferences
from db.schemas.preferences.lifestyle_preferences import (
    LifestylePreferencesCreate,
    LifestylePreferencesUpdate,
)


def get_by_id(db: Session, pref_id: uuid.UUID) -> LifestylePreferences | None:
    return db.query(LifestylePreferences).filter(LifestylePreferences.id == pref_id).first()


def get_by_profile_id(db: Session, profile_id: uuid.UUID) -> LifestylePreferences | None:
    return (
        db.query(LifestylePreferences)
        .filter(LifestylePreferences.profile_id == profile_id)
        .first()
    )


def create(db: Session, payload: LifestylePreferencesCreate) -> LifestylePreferences:
    prefs = LifestylePreferences(**payload.model_dump())
    db.add(prefs)
    db.commit()
    db.refresh(prefs)
    return prefs


def update(
    db: Session, prefs: LifestylePreferences, payload: LifestylePreferencesUpdate
) -> LifestylePreferences:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)
    db.commit()
    db.refresh(prefs)
    return prefs
