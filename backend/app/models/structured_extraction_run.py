import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class StructuredExtractionRun(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "structured_extraction_runs"
    __table_args__ = (
        UniqueConstraint(
            "document_processing_run_id",
            "attempt_number",
            name="uq_structured_extraction_runs_processing_attempt",
        ),
        UniqueConstraint(
            "id",
            "document_version_id",
            name="uq_structured_extraction_runs_id_version",
        ),
        UniqueConstraint(
            "id",
            "workspace_id",
            name="uq_structured_extraction_runs_id_workspace",
        ),
        UniqueConstraint(
            "id",
            "document_processing_run_id",
            name="uq_structured_extraction_runs_id_processing",
        ),
        Index("ix_structured_extraction_runs_workspace_id", "workspace_id"),
        Index("ix_structured_extraction_runs_version_id", "document_version_id"),
        Index(
            "ix_structured_extraction_runs_processing_run_id",
            "document_processing_run_id",
        ),
        Index("ix_structured_extraction_runs_status_available", "status", "available_at"),
        Index("ix_structured_extraction_runs_fingerprint", "input_fingerprint"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("company_incorporation_workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    document_version_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("document_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    document_processing_run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("document_processing_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)
    extractor_version: Mapped[str] = mapped_column(String(64), nullable=False)
    fact_schema_version: Mapped[str] = mapped_column(String(64), nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(64), nullable=False)
    provider: Mapped[str | None] = mapped_column(String(64), nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    input_fingerprint: Mapped[str] = mapped_column(String(64), nullable=False)
    deterministic_status: Mapped[str] = mapped_column(String(32), nullable=False)
    semantic_status: Mapped[str] = mapped_column(String(32), nullable=False)
    queued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    claimed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    heartbeat_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    provider_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    provider_usage: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    warnings: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    audit_metadata: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    error_code: Mapped[str | None] = mapped_column(String(128), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    assertions: Mapped[list["FactAssertion"]] = relationship(
        back_populates="structured_extraction_run",
        cascade="all, delete-orphan",
        foreign_keys="FactAssertion.structured_extraction_run_id",
    )


if TYPE_CHECKING:
    from app.models.fact_assertion import FactAssertion
