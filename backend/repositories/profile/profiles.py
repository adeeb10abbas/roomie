import uuid

from sqlalchemy.orm import Session

from db.models.profile.profiles import Profile
from db.schemas.profile.profiles import ProfileCreate, ProfileUpdate


def get_by_id(db: Session, profile_id: uuid.UUID) -> Profile | None:
    return db.query(Profile).filter(Profile.id == profile_id).first()


def get_by_user_id(db: Session, user_id: uuid.UUID) -> Profile | None:
    return db.query(Profile).filter(Profile.user_id == user_id).first()


def create(db: Session, payload: ProfileCreate) -> Profile:
    profile = Profile(**payload.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update(db: Session, profile: Profile, payload: ProfileUpdate) -> Profile:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
