"""Add document processing runs and pages.

Revision ID: 005_document_processing
Revises: 004_ci_documents
Create Date: 2026-08-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005_document_processing"
down_revision: str | None = "004_ci_documents"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "document_processing_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("document_version_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("processor_version", sa.String(length=64), nullable=False),
        sa.Column("queued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("available_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("heartbeat_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_code", sa.String(length=128), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "warnings",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
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
        sa.ForeignKeyConstraint(
            ["document_version_id"],
            ["document_versions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "document_version_id",
            "attempt_number",
            name="uq_document_processing_runs_version_attempt",
        ),
    )
    op.create_index(
        "ix_document_processing_runs_version_id",
        "document_processing_runs",
        ["document_version_id"],
    )
    op.create_index(
        "ix_document_processing_runs_status_available",
        "document_processing_runs",
        ["status", "available_at"],
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_document_processing_runs_active_version
        ON document_processing_runs (document_version_id)
        WHERE status IN ('queued', 'processing')
        """
    )

    op.create_table(
        "document_pages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("processing_run_id", sa.Uuid(), nullable=False),
        sa.Column("document_version_id", sa.Uuid(), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("extraction_method", sa.String(length=64), nullable=False),
        sa.Column("text", sa.Text(), server_default="", nullable=False),
        sa.Column(
            "text_blocks",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("page_width", sa.Float(), nullable=True),
        sa.Column("page_height", sa.Float(), nullable=True),
        sa.Column("detected_rotation", sa.Float(), server_default="0", nullable=False),
        sa.Column("native_text_length", sa.Integer(), server_default="0", nullable=False),
        sa.Column("average_ocr_confidence", sa.Float(), nullable=True),
        sa.Column(
            "warnings",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
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
        sa.ForeignKeyConstraint(
            ["document_version_id"],
            ["document_versions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["processing_run_id"],
            ["document_processing_runs.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "processing_run_id",
            "page_number",
            name="uq_document_pages_run_page",
        ),
    )
    op.create_index("ix_document_pages_version_id", "document_pages", ["document_version_id"])
    op.create_index("ix_document_pages_run_id", "document_pages", ["processing_run_id"])


def downgrade() -> None:
    op.drop_index("ix_document_pages_run_id", table_name="document_pages")
    op.drop_index("ix_document_pages_version_id", table_name="document_pages")
    op.drop_table("document_pages")
    op.execute("DROP INDEX IF EXISTS uq_document_processing_runs_active_version")
    op.drop_index(
        "ix_document_processing_runs_status_available",
        table_name="document_processing_runs",
    )
    op.drop_index(
        "ix_document_processing_runs_version_id",
        table_name="document_processing_runs",
    )
    op.drop_table("document_processing_runs")
