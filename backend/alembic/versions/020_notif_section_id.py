"""Widen user_notifications.section_id for long workstream section slugs.

Revision ID: 020_notif_section_id
Revises: 019_intermediaries_filing
Create Date: 2026-08-08
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "020_notif_section_id"
down_revision: str | None = "019_intermediaries_filing"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "user_notifications",
        "section_id",
        existing_type=sa.String(length=64),
        type_=sa.String(length=128),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "user_notifications",
        "section_id",
        existing_type=sa.String(length=128),
        type_=sa.String(length=64),
        existing_nullable=True,
    )
