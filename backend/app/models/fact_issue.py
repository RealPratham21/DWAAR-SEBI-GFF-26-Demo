import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class FactIssue(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "fact_issues"
    __table_args__ = (
        Index("ix_fact_issues_workspace_id", "workspace_id"),
        Index("ix_fact_issues_fact_key", "fact_key"),
        Index("ix_fact_issues_status", "status"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("company_incorporation_workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    fact_key: Mapped[str] = mapped_column(String(128), nullable=False)
    issue_type: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False)
    blocking: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    information_value_snapshot: Mapped[dict[str, Any] | list[Any] | str | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    information_normalized_snapshot: Mapped[dict[str, Any] | list[Any] | str | None] = (
        mapped_column(JSONB, nullable=True)
    )
    issue_fingerprint: Mapped[str] = mapped_column(String(64), nullable=False)
    suggested_actions: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    issue_assertions: Mapped[list["FactIssueAssertion"]] = relationship(
        back_populates="issue",
        cascade="all, delete-orphan",
    )
    resolutions: Mapped[list["FactIssueResolution"]] = relationship(
        back_populates="issue",
        cascade="all, delete-orphan",
    )


class FactIssueAssertion(Base):
    __tablename__ = "fact_issue_assertions"

    issue_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("fact_issues.id", ondelete="CASCADE"),
        primary_key=True,
    )
    fact_assertion_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("fact_assertions.id", ondelete="CASCADE"),
        primary_key=True,
    )
    role: Mapped[str] = mapped_column(String(32), primary_key=True)

    issue: Mapped["FactIssue"] = relationship(back_populates="issue_assertions")


class FactIssueResolution(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "fact_issue_resolutions"
    __table_args__ = (Index("ix_fact_issue_resolutions_issue_id", "fact_issue_id"),)

    fact_issue_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("fact_issues.id", ondelete="CASCADE"),
        nullable=False,
    )
    decision: Mapped[str] = mapped_column(String(64), nullable=False)
    selected_assertion_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("fact_assertions.id", ondelete="SET NULL"),
        nullable=True,
    )
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    resolved_by_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    information_value_snapshot: Mapped[dict[str, Any] | list[Any] | str | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    document_value_snapshot: Mapped[dict[str, Any] | list[Any] | str | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default="now()",
    )

    issue: Mapped["FactIssue"] = relationship(back_populates="resolutions")


if TYPE_CHECKING:
    pass
