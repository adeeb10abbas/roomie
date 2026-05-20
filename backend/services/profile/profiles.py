import uuid

from sqlalchemy.orm import Session

from db.models.profile.profiles import Profile
from db.schemas.profile.profiles import ProfileCreate, ProfileUpdate
from repositories import users as user_repository
from repositories.profile import profiles as profile_repository


def create(db: Session, payload: ProfileCreate) -> Profile | None:
    user = user_repository.get_by_id(db, payload.user_id)
    if not user:
        return None
    if profile_repository.get_by_user_id(db, payload.user_id):
        return None
    return profile_repository.create(db, payload)


def get_by_id(db: Session, profile_id: uuid.UUID) -> Profile | None:
    return profile_repository.get_by_id(db, profile_id)


def get_by_user_id(db: Session, user_id: uuid.UUID) -> Profile | None:
    return profile_repository.get_by_user_id(db, user_id)


def update(db: Session, profile_id: uuid.UUID, payload: ProfileUpdate) -> Profile | None:
    profile = profile_repository.get_by_id(db, profile_id)
    if not profile:
        return None
    return profile_repository.update(db, profile, payload)
