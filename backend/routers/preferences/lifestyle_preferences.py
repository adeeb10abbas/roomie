import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.schemas.preferences.lifestyle_preferences import (
    LifestylePreferences as LifestylePreferencesSchema,
)
from db.schemas.preferences.lifestyle_preferences import (
    LifestylePreferencesCreate,
    LifestylePreferencesUpdate,
)
from db.session import get_db
from services.preferences import lifestyle_preferences as lifestyle_service

router = APIRouter(prefix="/lifestyle-preferences", tags=["lifestyle-preferences"])


@router.post("/", response_model=LifestylePreferencesSchema, status_code=status.HTTP_201_CREATED)
def create_lifestyle_preferences(
    payload: LifestylePreferencesCreate, db: Session = Depends(get_db)
):
    prefs = lifestyle_service.create(db, payload)
    if prefs is None:
        raise HTTPException(
            status_code=409, detail="Lifestyle preferences already exist for this profile"
        )
    return prefs


@router.get("/{pref_id}", response_model=LifestylePreferencesSchema)
def get_lifestyle_preferences(pref_id: uuid.UUID, db: Session = Depends(get_db)):
    prefs = lifestyle_service.get_by_id(db, pref_id)
    if not prefs:
        raise HTTPException(status_code=404, detail="Lifestyle preferences not found")
    return prefs


@router.get("/profile/{profile_id}", response_model=LifestylePreferencesSchema)
def get_lifestyle_preferences_by_profile(
    profile_id: uuid.UUID, db: Session = Depends(get_db)
):
    prefs = lifestyle_service.get_by_profile_id(db, profile_id)
    if not prefs:
        raise HTTPException(status_code=404, detail="Lifestyle preferences not found")
    return prefs


@router.patch("/{pref_id}", response_model=LifestylePreferencesSchema)
def update_lifestyle_preferences(
    pref_id: uuid.UUID, payload: LifestylePreferencesUpdate, db: Session = Depends(get_db)
):
    prefs = lifestyle_service.update(db, pref_id, payload)
    if not prefs:
        raise HTTPException(status_code=404, detail="Lifestyle preferences not found")
    return prefs
