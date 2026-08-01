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


class DocumentProcessingRun(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "document_processing_runs"
    __table_args__ = (
        Index("ix_document_processing_runs_version_id", "document_version_id"),
        Index("ix_document_processing_runs_status_available", "status", "available_at"),
        UniqueConstraint(
            "document_version_id",
            "attempt_number",
            name="uq_document_processing_runs_version_attempt",
        ),
        UniqueConstraint(
            "id",
            "document_version_id",
            name="uq_document_processing_runs_id_version",
        ),
    )

    document_version_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("document_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)
    processor_version: Mapped[str] = mapped_column(String(64), nullable=False)
    output_schema_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    queued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    claimed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    heartbeat_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(128), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    warnings: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)

    document_version: Mapped["DocumentVersion"] = relationship(back_populates="processing_runs")
    pages: Mapped[list["DocumentPage"]] = relationship(
        back_populates="processing_run",
        cascade="all, delete-orphan",
        foreign_keys="DocumentPage.processing_run_id",
    )


if TYPE_CHECKING:
    from app.models.document_page import DocumentPage
    from app.models.document_version import DocumentVersion
