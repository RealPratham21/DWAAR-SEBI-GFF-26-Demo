"""Harden document processing for evidence-ready schema v2.

Revision ID: 006_document_processing_evidence
Revises: 005_document_processing
Create Date: 2026-08-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006_document_processing_evidence"
down_revision: str | None = "005_document_processing"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "document_processing_runs",
        sa.Column(
            "output_schema_version",
            sa.Integer(),
            server_default="1",
            nullable=False,
        ),
    )
    op.add_column(
        "document_pages",
        sa.Column(
            "coordinate_metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
    )

    # Composite identity so pages cannot reference a run from another version.
    op.create_unique_constraint(
        "uq_document_processing_runs_id_version",
        "document_processing_runs",
        ["id", "document_version_id"],
    )
    op.create_foreign_key(
        "fk_document_pages_run_version",
        "document_pages",
        "document_processing_runs",
        ["processing_run_id", "document_version_id"],
        ["id", "document_version_id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_document_pages_run_version", "document_pages", type_="foreignkey")
    op.drop_constraint(
        "uq_document_processing_runs_id_version",
        "document_processing_runs",
        type_="unique",
    )
    op.drop_column("document_pages", "coordinate_metadata")
    op.drop_column("document_processing_runs", "output_schema_version")
