import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.schemas.profile.profiles import Profile as ProfileSchema
from db.schemas.profile.profiles import ProfileCreate, ProfileUpdate
from db.session import get_db
from services.profile import profiles as profiles_service

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.post("/", response_model=ProfileSchema, status_code=status.HTTP_201_CREATED)
def create_profile(payload: ProfileCreate, db: Session = Depends(get_db)):
    profile = profiles_service.create(db, payload)
    if profile is None:
        existing = profiles_service.get_by_user_id(db, payload.user_id)
        if existing:
            raise HTTPException(status_code=409, detail="Profile already exists for this user")
        raise HTTPException(status_code=404, detail="User not found")
    return profile


@router.get("/{profile_id}", response_model=ProfileSchema)
def get_profile(profile_id: uuid.UUID, db: Session = Depends(get_db)):
    profile = profiles_service.get_by_id(db, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/user/{user_id}", response_model=ProfileSchema)
def get_profile_by_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    profile = profiles_service.get_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.patch("/{profile_id}", response_model=ProfileSchema)
def update_profile(
    profile_id: uuid.UUID, payload: ProfileUpdate, db: Session = Depends(get_db)
):
    profile = profiles_service.update(db, profile_id, payload)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
