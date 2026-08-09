"""Add generic Data Room stored document tables (G6).

Revision ID: 024_data_room_docs
Revises: 023_global_issue_ack
Create Date: 2026-08-09
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "024_data_room_docs"
down_revision: str | None = "023_global_issue_ack"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "data_room_stored_documents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("workstream_key", sa.String(length=64), nullable=False),
        sa.Column("requirement_key", sa.String(length=128), nullable=True),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("category", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("note", sa.String(length=1024), nullable=True),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
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
    op.create_index(
        "ix_data_room_stored_documents_user_id",
        "data_room_stored_documents",
        ["user_id"],
    )
    op.create_index(
        "ix_data_room_stored_documents_workstream",
        "data_room_stored_documents",
        ["user_id", "workstream_key"],
    )

    op.create_table(
        "data_room_stored_document_versions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("document_id", sa.Uuid(), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("original_filename", sa.String(length=512), nullable=False),
        sa.Column("content_type", sa.String(length=128), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=False),
        sa.Column("storage_key", sa.String(length=1024), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("uploaded_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("note", sa.String(length=1024), nullable=True),
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
        sa.ForeignKeyConstraint(["document_id"], ["data_room_stored_documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by_user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "document_id",
            "version_number",
            name="uq_data_room_doc_versions_document_version",
        ),
    )
    op.create_index(
        "ix_data_room_doc_versions_document_id",
        "data_room_stored_document_versions",
        ["document_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_data_room_doc_versions_document_id", table_name="data_room_stored_document_versions")
    op.drop_table("data_room_stored_document_versions")
    op.drop_index("ix_data_room_stored_documents_workstream", table_name="data_room_stored_documents")
    op.drop_index("ix_data_room_stored_documents_user_id", table_name="data_room_stored_documents")
    op.drop_table("data_room_stored_documents")
