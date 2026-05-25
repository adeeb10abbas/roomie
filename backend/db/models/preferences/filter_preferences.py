import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class FilterPreferences(Base):
    __tablename__ = "filter_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    budget_min: Mapped[int] = mapped_column(Integer, nullable=False)
    budget_max: Mapped[int] = mapped_column(Integer, nullable=False)
    move_in_from: Mapped[date] = mapped_column(Date, nullable=False)
    move_in_to: Mapped[date] = mapped_column(Date, nullable=False)
    max_distance_km: Mapped[int] = mapped_column(Integer, nullable=False)
    neighborhoods: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default="{}"
    )
    cleanliness_min: Mapped[int] = mapped_column(Integer, nullable=False)
    social_level_min: Mapped[int] = mapped_column(Integer, nullable=False)
    smoking_ok: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    languages: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default="{}"
    )
    religion_filter: Mapped[str | None] = mapped_column(Text, nullable=True)
    university_filter: Mapped[str | None] = mapped_column(Text, nullable=True)
    same_gender_only: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    listing_types: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default="{}"
    )
