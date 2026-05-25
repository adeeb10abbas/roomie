import uuid
from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class LifestylePreferences(Base):
    __tablename__ = "lifestyle_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), unique=True, nullable=False
    )
    budget_min: Mapped[int] = mapped_column(Integer, nullable=False)
    budget_max: Mapped[int] = mapped_column(Integer, nullable=False)
    move_in_date: Mapped[date] = mapped_column(Date, nullable=False)
    move_in_flexibility: Mapped[int] = mapped_column(Integer, nullable=False)
    preferred_neighborhoods: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default="{}"
    )
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    city_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    cleanliness: Mapped[int] = mapped_column(Integer, nullable=False)
    social_level: Mapped[int] = mapped_column(Integer, nullable=False)
    guest_frequency: Mapped[str] = mapped_column(Text, nullable=False)
    smoking: Mapped[str] = mapped_column(Text, nullable=False)
    drinking: Mapped[str] = mapped_column(Text, nullable=False)
    languages: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default="{}"
    )
    religion: Mapped[str | None] = mapped_column(Text, nullable=True)
    same_gender_only: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    lifestyle_tags: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default="{}"
    )
    pets: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default="{}"
    )
