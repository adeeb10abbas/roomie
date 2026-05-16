import uuid

from sqlalchemy.orm import Session

from db.models.identity.users import User
from db.schemas.identity.users import UserCreate, UserUpdate
from repositories import users as user_repository


def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return user_repository.get_by_id(db, user_id)


def get_by_clerk_id(db: Session, clerk_id: str) -> User | None:
    return user_repository.get_by_clerk_id(db, clerk_id)


def create(db: Session, payload: UserCreate) -> User | None:
    existing = user_repository.get_by_clerk_id_or_email(db, payload.clerk_id, payload.email)
    if existing:
        return None
    return user_repository.create(db, payload)


def update(db: Session, user_id: uuid.UUID, payload: UserUpdate) -> User | None:
    user = user_repository.get_by_id(db, user_id)
    if not user:
        return None
    return user_repository.update(db, user, payload)


def delete(db: Session, user_id: uuid.UUID) -> bool:
    user = user_repository.get_by_id(db, user_id)
    if not user:
        return False
    user_repository.delete(db, user)
    return True
