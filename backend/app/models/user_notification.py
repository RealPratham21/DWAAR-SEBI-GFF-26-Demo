import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class UserNotification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_notifications"
    __table_args__ = (
        Index("ix_user_notifications_user_id", "user_id"),
        Index("ix_user_notifications_user_id_read_at", "user_id", "read_at"),
        Index("ix_user_notifications_user_id_created_at", "user_id", "created_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    notification_type: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(String(512), nullable=False)
    workstream_slug: Mapped[str | None] = mapped_column(String(128), nullable=True)
    section_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    target_route: Mapped[str | None] = mapped_column(String(512), nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="notifications")


if TYPE_CHECKING:
    from app.models.user import User
