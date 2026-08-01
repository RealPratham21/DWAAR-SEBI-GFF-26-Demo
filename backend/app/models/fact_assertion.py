import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Float,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class FactAssertion(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "fact_assertions"
    __table_args__ = (
        UniqueConstraint(
            "structured_extraction_run_id",
            "assertion_fingerprint",
            name="uq_fact_assertions_run_fingerprint",
        ),
        ForeignKeyConstraint(
            ["structured_extraction_run_id", "document_version_id"],
            [
                "structured_extraction_runs.id",
                "structured_extraction_runs.document_version_id",
            ],
            ondelete="CASCADE",
            name="fk_fact_assertions_run_version",
        ),
        ForeignKeyConstraint(
            ["structured_extraction_run_id", "workspace_id"],
            [
                "structured_extraction_runs.id",
                "structured_extraction_runs.workspace_id",
            ],
            ondelete="CASCADE",
            name="fk_fact_assertions_run_workspace",
        ),
        ForeignKeyConstraint(
            ["structured_extraction_run_id", "document_processing_run_id"],
            [
                "structured_extraction_runs.id",
                "structured_extraction_runs.document_processing_run_id",
            ],
            ondelete="CASCADE",
            name="fk_fact_assertions_run_processing",
        ),
        Index("ix_fact_assertions_workspace_id", "workspace_id"),
        Index("ix_fact_assertions_fact_key", "fact_key"),
        Index("ix_fact_assertions_run_id", "structured_extraction_run_id"),
        Index("ix_fact_assertions_version_id", "document_version_id"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("company_incorporation_workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    structured_extraction_run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("structured_extraction_runs.id", ondelete="CASCADE"),
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
    requirement_key: Mapped[str] = mapped_column(String(128), nullable=False)
    fact_key: Mapped[str] = mapped_column(String(128), nullable=False)
    value_type: Mapped[str] = mapped_column(String(32), nullable=False)
    raw_value: Mapped[dict[str, Any] | list[Any] | str | int | float | bool | None] = (
        mapped_column(JSONB, nullable=False)
    )
    normalized_value: Mapped[dict[str, Any] | list[Any] | str | int | float | bool | None] = (
        mapped_column(JSONB, nullable=False)
    )
    display_value: Mapped[str] = mapped_column(Text, nullable=False)
    extractor_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    validation_status: Mapped[str] = mapped_column(String(32), nullable=False)
    comparison_status: Mapped[str] = mapped_column(String(32), nullable=False)
    review_status: Mapped[str] = mapped_column(String(32), nullable=False)
    quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    quality_category: Mapped[str] = mapped_column(String(32), nullable=False)
    assertion_fingerprint: Mapped[str] = mapped_column(String(64), nullable=False)
    source_temporality: Mapped[str] = mapped_column(String(32), nullable=False)
    quality_signals: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)

    structured_extraction_run: Mapped["StructuredExtractionRun"] = relationship(
        back_populates="assertions",
        foreign_keys=[structured_extraction_run_id],
    )
    evidence_references: Mapped[list["FactEvidenceReference"]] = relationship(
        back_populates="fact_assertion",
        cascade="all, delete-orphan",
    )
    reviews: Mapped[list["FactAssertionReview"]] = relationship(
        back_populates="fact_assertion",
        cascade="all, delete-orphan",
    )


if TYPE_CHECKING:
    from app.models.fact_assertion_review import FactAssertionReview
    from app.models.fact_evidence_reference import FactEvidenceReference
    from app.models.structured_extraction_run import StructuredExtractionRun
