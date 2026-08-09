"""Generic Data Room stored documents (G6) — non-C&I uploads."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class DataRoomStoredDocument(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "data_room_stored_documents"
    __table_args__ = (
        Index("ix_data_room_stored_documents_user_id", "user_id"),
        Index("ix_data_room_stored_documents_workstream", "user_id", "workstream_key"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    workstream_key: Mapped[str] = mapped_column(String(64), nullable=False)
    requirement_key: Mapped[str | None] = mapped_column(String(128), nullable=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    category: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="uploaded")
    note: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship()
    versions: Mapped[list["DataRoomStoredDocumentVersion"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
    )


if TYPE_CHECKING:
    from app.models.data_room_stored_document_version import DataRoomStoredDocumentVersion
    from app.models.user import User
