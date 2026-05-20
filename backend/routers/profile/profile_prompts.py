import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.schemas.profile.profile_prompts import ProfilePrompt as ProfilePromptSchema
from db.schemas.profile.profile_prompts import ProfilePromptCreate, ProfilePromptUpdate
from db.session import get_db
from services.profile import profile_prompts as profile_prompts_service

router = APIRouter(prefix="/profile-prompts", tags=["profile-prompts"])


@router.post("/", response_model=ProfilePromptSchema, status_code=status.HTTP_201_CREATED)
def create_profile_prompt(payload: ProfilePromptCreate, db: Session = Depends(get_db)):
    prompt = profile_prompts_service.create(db, payload)
    if not prompt:
        raise HTTPException(status_code=404, detail="Profile not found")
    return prompt


@router.get("/profile/{profile_id}", response_model=list[ProfilePromptSchema])
def list_profile_prompts(profile_id: uuid.UUID, db: Session = Depends(get_db)):
    prompts = profile_prompts_service.list_by_profile_id(db, profile_id)
    if prompts is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return prompts


@router.get("/{prompt_id}", response_model=ProfilePromptSchema)
def get_profile_prompt(prompt_id: uuid.UUID, db: Session = Depends(get_db)):
    prompt = profile_prompts_service.get_by_id(db, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Profile prompt not found")
    return prompt


@router.patch("/{prompt_id}", response_model=ProfilePromptSchema)
def update_profile_prompt(
    prompt_id: uuid.UUID, payload: ProfilePromptUpdate, db: Session = Depends(get_db)
):
    prompt = profile_prompts_service.update(db, prompt_id, payload)
    if not prompt:
        raise HTTPException(status_code=404, detail="Profile prompt not found")
    return prompt
