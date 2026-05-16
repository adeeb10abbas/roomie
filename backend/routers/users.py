import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.schemas.identity.users import User as UserSchema
from db.schemas.identity.users import UserCreate, UserUpdate
from db.session import get_db
from services import users as users_service

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = users_service.create(db, payload)
    if not user:
        raise HTTPException(status_code=409, detail="User with this clerk_id or email already exists")
    return user


@router.get("/{user_id}", response_model=UserSchema)
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    user = users_service.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/clerk/{clerk_id}", response_model=UserSchema)
def get_user_by_clerk_id(clerk_id: str, db: Session = Depends(get_db)):
    user = users_service.get_by_clerk_id(db, clerk_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserSchema)
def update_user(user_id: uuid.UUID, payload: UserUpdate, db: Session = Depends(get_db)):
    user = users_service.update(db, user_id, payload)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    deleted = users_service.delete(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
