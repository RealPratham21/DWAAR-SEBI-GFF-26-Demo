"""Add DRHP generation snapshots table.

Revision ID: 021_drhp_gen_snapshots
Revises: 020_notif_section_id
Create Date: 2026-08-08
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "021_drhp_gen_snapshots"
down_revision: str | None = "020_notif_section_id"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "drhp_generation_snapshots",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("snapshot_version", sa.Integer(), nullable=False),
        sa.Column("registry_version", sa.String(length=32), nullable=False),
        sa.Column("snapshot_schema_version", sa.String(length=32), nullable=False),
        sa.Column(
            "source_workstream_versions",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "normalized_payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "canonical_context",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "source_registry",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("aggregate_source_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "readiness_summary",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("created_by", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_drhp_generation_snapshots_user_id",
        "drhp_generation_snapshots",
        ["user_id"],
    )
    op.create_index(
        "ix_drhp_generation_snapshots_created_at",
        "drhp_generation_snapshots",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_drhp_generation_snapshots_created_at", table_name="drhp_generation_snapshots")
    op.drop_index("ix_drhp_generation_snapshots_user_id", table_name="drhp_generation_snapshots")
    op.drop_table("drhp_generation_snapshots")
