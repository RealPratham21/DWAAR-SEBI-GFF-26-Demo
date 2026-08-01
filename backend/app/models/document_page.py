import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Float,
    ForeignKey,
    ForeignKeyConstraint,
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


class DocumentPage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "document_pages"
    __table_args__ = (
        UniqueConstraint(
            "processing_run_id",
            "page_number",
            name="uq_document_pages_run_page",
        ),
        ForeignKeyConstraint(
            ["processing_run_id", "document_version_id"],
            ["document_processing_runs.id", "document_processing_runs.document_version_id"],
            ondelete="CASCADE",
            name="fk_document_pages_run_version",
        ),
        Index("ix_document_pages_version_id", "document_version_id"),
        Index("ix_document_pages_run_id", "processing_run_id"),
    )

    processing_run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("document_processing_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    document_version_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("document_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    extraction_method: Mapped[str] = mapped_column(String(64), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    text_blocks: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    page_width: Mapped[float | None] = mapped_column(Float, nullable=True)
    page_height: Mapped[float | None] = mapped_column(Float, nullable=True)
    detected_rotation: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    native_text_length: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    average_ocr_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    warnings: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    coordinate_metadata: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )

    processing_run: Mapped["DocumentProcessingRun"] = relationship(
        back_populates="pages",
        foreign_keys=[processing_run_id],
    )
    document_version: Mapped["DocumentVersion"] = relationship(
        back_populates="pages",
        foreign_keys=[document_version_id],
    )


if TYPE_CHECKING:
    from app.models.document_processing_run import DocumentProcessingRun
    from app.models.document_version import DocumentVersion
