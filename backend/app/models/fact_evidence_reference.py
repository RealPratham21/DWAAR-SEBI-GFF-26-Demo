import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    DateTime,
    Float,
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
from app.db.mixins import UUIDPrimaryKeyMixin


class FactEvidenceReference(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "fact_evidence_references"
    __table_args__ = (
        UniqueConstraint(
            "fact_assertion_id",
            "block_id",
            "evidence_role",
            name="uq_fact_evidence_assertion_block_role",
        ),
        Index("ix_fact_evidence_references_assertion_id", "fact_assertion_id"),
    )

    fact_assertion_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("fact_assertions.id", ondelete="CASCADE"),
        nullable=False,
    )
    document_page_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("document_pages.id", ondelete="CASCADE"),
        nullable=False,
    )
    block_id: Mapped[str] = mapped_column(String(64), nullable=False)
    evidence_role: Mapped[str] = mapped_column(String(32), nullable=False)
    quote_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    bbox_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    extraction_method: Mapped[str] = mapped_column(String(64), nullable=False)
    ocr_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    block_order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default="now()",
    )

    fact_assertion: Mapped["FactAssertion"] = relationship(back_populates="evidence_references")


if TYPE_CHECKING:
    from app.models.fact_assertion import FactAssertion
