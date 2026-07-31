"""Add user notifications table.

Revision ID: 003_user_notifications
Revises: 002_ci_workspaces
Create Date: 2026-07-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "003_user_notifications"
down_revision: str | None = "002_ci_workspaces"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_notifications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("notification_type", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.String(length=512), nullable=False),
        sa.Column("workstream_slug", sa.String(length=128), nullable=True),
        sa.Column("section_id", sa.String(length=64), nullable=True),
        sa.Column("target_route", sa.String(length=512), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_notifications_user_id", "user_notifications", ["user_id"])
    op.create_index(
        "ix_user_notifications_user_id_read_at",
        "user_notifications",
        ["user_id", "read_at"],
    )
    op.create_index(
        "ix_user_notifications_user_id_created_at",
        "user_notifications",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_notifications_user_id_created_at", table_name="user_notifications")
    op.drop_index("ix_user_notifications_user_id_read_at", table_name="user_notifications")
    op.drop_index("ix_user_notifications_user_id", table_name="user_notifications")
    op.drop_table("user_notifications")
