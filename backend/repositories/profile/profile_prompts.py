import uuid

from sqlalchemy.orm import Session

from db.models.profile.profile_prompts import ProfilePrompt
from db.schemas.profile.profile_prompts import ProfilePromptCreate, ProfilePromptUpdate


def get_by_id(db: Session, prompt_id: uuid.UUID) -> ProfilePrompt | None:
    return db.query(ProfilePrompt).filter(ProfilePrompt.id == prompt_id).first()


def list_by_profile_id(db: Session, profile_id: uuid.UUID) -> list[ProfilePrompt]:
    return (
        db.query(ProfilePrompt)
        .filter(ProfilePrompt.profile_id == profile_id)
        .order_by(ProfilePrompt.display_order)
        .all()
    )


def create(db: Session, payload: ProfilePromptCreate) -> ProfilePrompt:
    prompt = ProfilePrompt(**payload.model_dump())
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


def update(db: Session, prompt: ProfilePrompt, payload: ProfilePromptUpdate) -> ProfilePrompt:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prompt, field, value)
    db.commit()
    db.refresh(prompt)
    return prompt
