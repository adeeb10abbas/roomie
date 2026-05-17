from uuid import UUID

from pydantic import BaseModel


class ProfilePromptBase(BaseModel):
    prompt_text: str
    answer: str
    display_order: int


class ProfilePromptCreate(ProfilePromptBase):
    profile_id: UUID


class ProfilePromptUpdate(BaseModel):
    prompt_text: str | None = None
    answer: str | None = None
    display_order: int | None = None


class ProfilePrompt(ProfilePromptBase):
    id: UUID
    profile_id: UUID

    model_config = {"from_attributes": True}
