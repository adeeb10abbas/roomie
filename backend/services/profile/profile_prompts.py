import uuid

from sqlalchemy.orm import Session

from db.models.profile.profile_prompts import ProfilePrompt
from db.schemas.profile.profile_prompts import ProfilePromptCreate, ProfilePromptUpdate
from repositories.profile import profiles as profile_repository
from repositories.profile import profile_prompts as profile_prompt_repository


def create(db: Session, payload: ProfilePromptCreate) -> ProfilePrompt | None:
    profile = profile_repository.get_by_id(db, payload.profile_id)
    if not profile:
        return None
    return profile_prompt_repository.create(db, payload)


def get_by_id(db: Session, prompt_id: uuid.UUID) -> ProfilePrompt | None:
    return profile_prompt_repository.get_by_id(db, prompt_id)


def list_by_profile_id(db: Session, profile_id: uuid.UUID) -> list[ProfilePrompt] | None:
    profile = profile_repository.get_by_id(db, profile_id)
    if not profile:
        return None
    return profile_prompt_repository.list_by_profile_id(db, profile_id)


def update(
    db: Session, prompt_id: uuid.UUID, payload: ProfilePromptUpdate
) -> ProfilePrompt | None:
    prompt = profile_prompt_repository.get_by_id(db, prompt_id)
    if not prompt:
        return None
    return profile_prompt_repository.update(db, prompt, payload)
