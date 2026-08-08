"""Add DRHP document and generation version tables.

Revision ID: 022_drhp_documents
Revises: 021_drhp_gen_snapshots
Create Date: 2026-08-08
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "022_drhp_documents"
down_revision: str | None = "021_drhp_gen_snapshots"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "drhp_documents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
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
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_drhp_documents_user_id", "drhp_documents", ["user_id"])

    op.create_table(
        "drhp_document_versions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("document_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("generation_snapshot_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=48), nullable=False),
        sa.Column("generation_started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_chapters", sa.Integer(), nullable=False),
        sa.Column("completed_chapters", sa.Integer(), nullable=False),
        sa.Column("warning_chapters", sa.Integer(), nullable=False),
        sa.Column("failed_chapters", sa.Integer(), nullable=False),
        sa.Column("blocked_chapters", sa.Integer(), nullable=False),
        sa.Column("generation_model", sa.String(length=128), nullable=False),
        sa.Column("prompt_version", sa.String(length=32), nullable=False),
        sa.Column("rules_version", sa.String(length=32), nullable=False),
        sa.Column("error_summary", sa.Text(), nullable=True),
        sa.Column(
            "generation_metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["document_id"], ["drhp_documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["generation_snapshot_id"], ["drhp_generation_snapshots.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_drhp_document_versions_document_id", "drhp_document_versions", ["document_id"])
    op.create_index("ix_drhp_document_versions_user_id", "drhp_document_versions", ["user_id"])
    op.create_index("ix_drhp_document_versions_status", "drhp_document_versions", ["status"])

    op.create_table(
        "drhp_chapter_versions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("document_version_id", sa.Uuid(), nullable=False),
        sa.Column("chapter_key", sa.String(length=64), nullable=False),
        sa.Column("chapter_version_number", sa.Integer(), nullable=False),
        sa.Column("source_bundle_hash", sa.String(length=64), nullable=False),
        sa.Column("generation_mode", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=48), nullable=False),
        sa.Column("generation_started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("model", sa.String(length=128), nullable=False),
        sa.Column("prompt_version", sa.String(length=32), nullable=False),
        sa.Column("retry_count", sa.Integer(), nullable=False),
        sa.Column("input_tokens", sa.Integer(), nullable=True),
        sa.Column("output_tokens", sa.Integer(), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("ast_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("chapter_digest", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "source_refs_summary",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "evidence_refs_summary",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "generation_warnings",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "validation_warnings",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("error_code", sa.String(length=64), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["document_version_id"], ["drhp_document_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_version_id", "chapter_key", name="uq_drhp_chapter_versions_doc_chapter"),
    )
    op.create_index(
        "ix_drhp_chapter_versions_document_version_id",
        "drhp_chapter_versions",
        ["document_version_id"],
    )
    op.create_index("ix_drhp_chapter_versions_chapter_key", "drhp_chapter_versions", ["chapter_key"])
    op.create_index("ix_drhp_chapter_versions_status", "drhp_chapter_versions", ["status"])


def downgrade() -> None:
    op.drop_index("ix_drhp_chapter_versions_status", table_name="drhp_chapter_versions")
    op.drop_index("ix_drhp_chapter_versions_chapter_key", table_name="drhp_chapter_versions")
    op.drop_index("ix_drhp_chapter_versions_document_version_id", table_name="drhp_chapter_versions")
    op.drop_table("drhp_chapter_versions")
    op.drop_index("ix_drhp_document_versions_status", table_name="drhp_document_versions")
    op.drop_index("ix_drhp_document_versions_user_id", table_name="drhp_document_versions")
    op.drop_index("ix_drhp_document_versions_document_id", table_name="drhp_document_versions")
    op.drop_table("drhp_document_versions")
    op.drop_index("ix_drhp_documents_user_id", table_name="drhp_documents")
    op.drop_table("drhp_documents")
