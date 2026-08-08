"""SQLAlchemy model for immutable DRHP generation snapshots."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import UUIDPrimaryKeyMixin


class DrhpGenerationSnapshot(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "drhp_generation_snapshots"
    __table_args__ = (
        Index("ix_drhp_generation_snapshots_user_id", "user_id"),
        Index("ix_drhp_generation_snapshots_created_at", "created_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    snapshot_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    registry_version: Mapped[str] = mapped_column(String(32), nullable=False)
    snapshot_schema_version: Mapped[str] = mapped_column(String(32), nullable=False)
    source_workstream_versions: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    normalized_payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    canonical_context: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    source_registry: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    aggregate_source_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    readiness_summary: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
