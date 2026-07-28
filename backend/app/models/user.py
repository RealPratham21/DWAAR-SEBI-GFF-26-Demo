from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email_lower", func.lower("email"), unique=True),
        Index("ix_users_email", "email"),
    )

    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    phone_e164: Mapped[str] = mapped_column(String(20), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    email_verified_at: Mapped[datetime | None] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    refresh_sessions: Mapped[list["RefreshSession"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    onboarding_applications: Mapped[list["OnboardingApplication"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


if TYPE_CHECKING:
    from app.models.onboarding_application import OnboardingApplication
    from app.models.refresh_session import RefreshSession
