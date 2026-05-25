import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.schemas.preferences.filter_preferences import (
    FilterPreferences as FilterPreferencesSchema,
)
from db.schemas.preferences.filter_preferences import (
    FilterPreferencesCreate,
    FilterPreferencesUpdate,
)
from db.session import get_db
from services.preferences import filter_preferences as filter_service

router = APIRouter(prefix="/filter-preferences", tags=["filter-preferences"])


@router.post("/", response_model=FilterPreferencesSchema, status_code=status.HTTP_201_CREATED)
def create_filter_preferences(
    payload: FilterPreferencesCreate, db: Session = Depends(get_db)
):
    prefs = filter_service.create(db, payload)
    if prefs is None:
        raise HTTPException(
            status_code=409, detail="Filter preferences already exist for this user"
        )
    return prefs


@router.get("/{pref_id}", response_model=FilterPreferencesSchema)
def get_filter_preferences(pref_id: uuid.UUID, db: Session = Depends(get_db)):
    prefs = filter_service.get_by_id(db, pref_id)
    if not prefs:
        raise HTTPException(status_code=404, detail="Filter preferences not found")
    return prefs


@router.get("/user/{user_id}", response_model=FilterPreferencesSchema)
def get_filter_preferences_by_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    prefs = filter_service.get_by_user_id(db, user_id)
    if not prefs:
        raise HTTPException(status_code=404, detail="Filter preferences not found")
    return prefs


@router.patch("/{pref_id}", response_model=FilterPreferencesSchema)
def update_filter_preferences(
    pref_id: uuid.UUID, payload: FilterPreferencesUpdate, db: Session = Depends(get_db)
):
    prefs = filter_service.update(db, pref_id, payload)
    if not prefs:
        raise HTTPException(status_code=404, detail="Filter preferences not found")
    return prefs
