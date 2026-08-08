"""Persisted DRHP generated document models."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class DrhpDocument(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "drhp_documents"
    __table_args__ = (Index("ix_drhp_documents_user_id", "user_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )


class DrhpDocumentVersion(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "drhp_document_versions"
    __table_args__ = (
        Index("ix_drhp_document_versions_document_id", "document_id"),
        Index("ix_drhp_document_versions_user_id", "user_id"),
        Index("ix_drhp_document_versions_status", "status"),
    )

    document_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("drhp_documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    generation_snapshot_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("drhp_generation_snapshots.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(48), nullable=False, default="queued")
    generation_started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_chapters: Mapped[int] = mapped_column(Integer, nullable=False, default=18)
    completed_chapters: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warning_chapters: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_chapters: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    blocked_chapters: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    generation_model: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    prompt_version: Mapped[str] = mapped_column(String(32), nullable=False, default="drhp-g2-v1")
    rules_version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0.0")
    error_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    generation_metadata: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class DrhpChapterVersion(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "drhp_chapter_versions"
    __table_args__ = (
        Index("ix_drhp_chapter_versions_document_version_id", "document_version_id"),
        Index("ix_drhp_chapter_versions_chapter_key", "chapter_key"),
        Index("ix_drhp_chapter_versions_status", "status"),
    )

    document_version_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("drhp_document_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    chapter_key: Mapped[str] = mapped_column(String(64), nullable=False)
    chapter_version_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    source_bundle_hash: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    generation_mode: Mapped[str] = mapped_column(String(32), nullable=False, default="deterministic")
    status: Mapped[str] = mapped_column(String(48), nullable=False, default="queued")
    generation_started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    model: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    prompt_version: Mapped[str] = mapped_column(String(32), nullable=False, default="drhp-g2-v1")
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    input_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    output_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ast_payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    chapter_digest: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    source_refs_summary: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    evidence_refs_summary: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    generation_warnings: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    validation_warnings: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
