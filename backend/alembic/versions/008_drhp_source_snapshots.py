"""Add immutable DRHP source snapshots.

Revision ID: 008_drhp_source_snapshots
Revises: 007_structured_extraction
Create Date: 2026-08-04
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "008_drhp_source_snapshots"
down_revision: str | None = "007_structured_extraction"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "drhp_source_snapshots",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("company_incorporation_workspace_id", sa.Uuid(), nullable=False),
        sa.Column("chapter_key", sa.String(length=128), nullable=False),
        sa.Column("registry_version", sa.String(length=32), nullable=False),
        sa.Column("snapshot_schema_version", sa.String(length=32), nullable=False),
        sa.Column("source_hash", sa.String(length=64), nullable=False),
        sa.Column("readiness_result", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_by", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["company_incorporation_workspace_id"],
            ["company_incorporation_workspaces.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "company_incorporation_workspace_id",
            "chapter_key",
            "source_hash",
            name="uq_drhp_source_snapshots_workspace_chapter_hash",
        ),
    )
    op.create_index(
        "ix_drhp_source_snapshots_user_id",
        "drhp_source_snapshots",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_drhp_source_snapshots_workspace_id",
        "drhp_source_snapshots",
        ["company_incorporation_workspace_id"],
        unique=False,
    )
    op.create_index(
        "ix_drhp_source_snapshots_chapter_key",
        "drhp_source_snapshots",
        ["chapter_key"],
        unique=False,
    )

    op.create_table(
        "drhp_snapshot_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("snapshot_id", sa.Uuid(), nullable=False),
        sa.Column("item_key", sa.String(length=128), nullable=False),
        sa.Column("requirement_key", sa.String(length=128), nullable=False),
        sa.Column("requirement_label", sa.String(length=256), nullable=False),
        sa.Column("applicability", sa.String(length=32), nullable=False),
        sa.Column("coverage_status", sa.String(length=32), nullable=False),
        sa.Column("selected_source_type", sa.String(length=32), nullable=False),
        sa.Column("selected_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "information_paths",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "assertion_ids",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "evidence_ids",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "document_ids",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "document_version_ids",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "document_requirement_keys",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "document_requirement_labels",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "page_numbers",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "quote_snapshots",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "issue_ids",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "evidence_refs",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("generation_permitted", sa.Boolean(), nullable=False),
        sa.Column("placeholder_allowed", sa.Boolean(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(
            ["snapshot_id"],
            ["drhp_source_snapshots.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "snapshot_id",
            "item_key",
            name="uq_drhp_snapshot_items_snapshot_item_key",
        ),
    )
    op.create_index(
        "ix_drhp_snapshot_items_snapshot_id",
        "drhp_snapshot_items",
        ["snapshot_id"],
        unique=False,
    )
    op.create_index(
        "ix_drhp_snapshot_items_requirement_key",
        "drhp_snapshot_items",
        ["requirement_key"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_drhp_snapshot_items_requirement_key", table_name="drhp_snapshot_items")
    op.drop_index("ix_drhp_snapshot_items_snapshot_id", table_name="drhp_snapshot_items")
    op.drop_table("drhp_snapshot_items")
    op.drop_index("ix_drhp_source_snapshots_chapter_key", table_name="drhp_source_snapshots")
    op.drop_index("ix_drhp_source_snapshots_workspace_id", table_name="drhp_source_snapshots")
    op.drop_index("ix_drhp_source_snapshots_user_id", table_name="drhp_source_snapshots")
    op.drop_table("drhp_source_snapshots")
