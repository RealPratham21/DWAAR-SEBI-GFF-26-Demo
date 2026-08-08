"""User acknowledgement overlay for derived global issues (G4)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class GlobalIssueAcknowledgement(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "global_issue_acknowledgements"
    __table_args__ = (
        Index("ix_global_issue_ack_user_id", "user_id"),
        Index("ix_global_issue_ack_fingerprint", "fingerprint"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        nullable=False,
    )
    fingerprint: Mapped[str] = mapped_column(String(128), nullable=False)
    acknowledged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
