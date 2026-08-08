"""Add global issue acknowledgement overlay table (G4).

Revision ID: 023_global_issue_ack
Revises: 022_drhp_documents
Create Date: 2026-08-08
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "023_global_issue_ack"
down_revision: str | None = "022_drhp_documents"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "global_issue_acknowledgements",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("fingerprint", sa.String(length=128), nullable=False),
        sa.Column("acknowledged", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.UniqueConstraint("user_id", "fingerprint", name="uq_global_issue_ack_user_fingerprint"),
    )
    op.create_index(
        "ix_global_issue_ack_user_id",
        "global_issue_acknowledgements",
        ["user_id"],
    )
    op.create_index(
        "ix_global_issue_ack_fingerprint",
        "global_issue_acknowledgements",
        ["fingerprint"],
    )


def downgrade() -> None:
    op.drop_index("ix_global_issue_ack_fingerprint", table_name="global_issue_acknowledgements")
    op.drop_index("ix_global_issue_ack_user_id", table_name="global_issue_acknowledgements")
    op.drop_table("global_issue_acknowledgements")
