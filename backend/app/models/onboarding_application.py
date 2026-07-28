import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import (
    OnboardingCurrentStep,
    OnboardingJourneyType,
    OnboardingStatus,
)


class OnboardingApplication(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "onboarding_applications"
    __table_args__ = (
        Index("ix_onboarding_applications_user_id", "user_id"),
        Index("ix_onboarding_applications_status", "status"),
        Index("ix_onboarding_applications_user_id_status", "user_id", "status"),
        Index(
            "uq_onboarding_applications_one_active_sme_per_user",
            "user_id",
            unique=True,
            postgresql_where=text("journey_type = 'sme' AND status IN ('draft', 'in_progress')"),
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    journey_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=OnboardingJourneyType.SME,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=OnboardingStatus.DRAFT,
    )
    current_step: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default=OnboardingCurrentStep.ROLE_AUTHORITY,
    )
    completed_steps: Mapped[list[Any]] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'[]'::jsonb"),
    )
    draft_data: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    schema_version: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="onboarding_applications")


if TYPE_CHECKING:
    from app.models.user import User
