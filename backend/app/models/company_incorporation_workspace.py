import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class CompanyIncorporationWorkspace(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "company_incorporation_workspaces"
    __table_args__ = (Index("ix_company_incorporation_workspaces_user_id", "user_id", unique=True),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_onboarding_application_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("onboarding_applications.id", ondelete="RESTRICT"),
        nullable=False,
    )
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    schema_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    initialized_from_onboarding: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    initialized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    last_saved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="company_incorporation_workspace")
    source_onboarding_application: Mapped["OnboardingApplication"] = relationship()


if TYPE_CHECKING:
    from app.models.onboarding_application import OnboardingApplication
    from app.models.user import User
