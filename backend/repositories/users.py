import uuid

from sqlalchemy.orm import Session

from db.models.users import User
from db.schemas.users import UserCreate, UserUpdate


def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_by_clerk_id(db: Session, clerk_id: str) -> User | None:
    return db.query(User).filter(User.clerk_id == clerk_id).first()


def get_by_clerk_id_or_email(db: Session, clerk_id: str, email: str) -> User | None:
    return db.query(User).filter(
        (User.clerk_id == clerk_id) | (User.email == email)
    ).first()


def create(db: Session, payload: UserCreate) -> User:
    user = User(**payload.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update(db: Session, user: User, payload: UserUpdate) -> User:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def delete(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()
