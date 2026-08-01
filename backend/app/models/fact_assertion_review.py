import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import UUIDPrimaryKeyMixin


class FactAssertionReview(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "fact_assertion_reviews"
    __table_args__ = (Index("ix_fact_assertion_reviews_assertion_id", "fact_assertion_id"),)

    fact_assertion_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("fact_assertions.id", ondelete="CASCADE"),
        nullable=False,
    )
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default="now()",
    )

    fact_assertion: Mapped["FactAssertion"] = relationship(back_populates="reviews")


if TYPE_CHECKING:
    from app.models.fact_assertion import FactAssertion
