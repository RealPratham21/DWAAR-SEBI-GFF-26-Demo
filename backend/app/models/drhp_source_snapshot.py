"""SQLAlchemy models for immutable DRHP source snapshots."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import UUIDPrimaryKeyMixin


class DrhpSourceSnapshot(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "drhp_source_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "company_incorporation_workspace_id",
            "chapter_key",
            "source_hash",
            name="uq_drhp_source_snapshots_workspace_chapter_hash",
        ),
        Index("ix_drhp_source_snapshots_user_id", "user_id"),
        Index("ix_drhp_source_snapshots_workspace_id", "company_incorporation_workspace_id"),
        Index("ix_drhp_source_snapshots_chapter_key", "chapter_key"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    company_incorporation_workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("company_incorporation_workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    chapter_key: Mapped[str] = mapped_column(String(128), nullable=False)
    registry_version: Mapped[str] = mapped_column(String(32), nullable=False)
    snapshot_schema_version: Mapped[str] = mapped_column(String(32), nullable=False)
    source_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    readiness_result: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
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

    items: Mapped[list[DrhpSnapshotItem]] = relationship(
        back_populates="snapshot",
        cascade="all, delete-orphan",
        order_by="DrhpSnapshotItem.item_key",
    )


class DrhpSnapshotItem(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "drhp_snapshot_items"
    __table_args__ = (
        UniqueConstraint(
            "snapshot_id",
            "item_key",
            name="uq_drhp_snapshot_items_snapshot_item_key",
        ),
        Index("ix_drhp_snapshot_items_snapshot_id", "snapshot_id"),
        Index("ix_drhp_snapshot_items_requirement_key", "requirement_key"),
    )

    snapshot_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("drhp_source_snapshots.id", ondelete="CASCADE"),
        nullable=False,
    )
    item_key: Mapped[str] = mapped_column(String(128), nullable=False)
    requirement_key: Mapped[str] = mapped_column(String(128), nullable=False)
    requirement_label: Mapped[str] = mapped_column(String(256), nullable=False)
    applicability: Mapped[str] = mapped_column(String(32), nullable=False)
    coverage_status: Mapped[str] = mapped_column(String(32), nullable=False)
    selected_source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    selected_value: Mapped[Any] = mapped_column(JSONB, nullable=True)
    information_paths: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    assertion_ids: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    evidence_ids: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    document_ids: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    document_version_ids: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    document_requirement_keys: Mapped[list[Any]] = mapped_column(
        JSONB, nullable=False, default=list
    )
    document_requirement_labels: Mapped[list[Any]] = mapped_column(
        JSONB, nullable=False, default=list
    )
    page_numbers: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    quote_snapshots: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    issue_ids: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    evidence_refs: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    generation_permitted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    placeholder_allowed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")

    snapshot: Mapped[DrhpSourceSnapshot] = relationship(back_populates="items")
