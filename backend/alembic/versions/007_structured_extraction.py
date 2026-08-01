"""Add structured fact extraction, assertions, evidence, and issues.

Revision ID: 007_structured_extraction
Revises: 006_document_processing_evidence
Create Date: 2026-08-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "007_structured_extraction"
down_revision: str | None = "006_document_processing_evidence"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "structured_extraction_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("document_version_id", sa.Uuid(), nullable=False),
        sa.Column("document_processing_run_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("extractor_version", sa.String(length=64), nullable=False),
        sa.Column("fact_schema_version", sa.String(length=64), nullable=False),
        sa.Column("prompt_version", sa.String(length=64), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=True),
        sa.Column("model_name", sa.String(length=128), nullable=True),
        sa.Column("input_fingerprint", sa.String(length=64), nullable=False),
        sa.Column("deterministic_status", sa.String(length=32), nullable=False),
        sa.Column("semantic_status", sa.String(length=32), nullable=False),
        sa.Column("queued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("available_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("heartbeat_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("provider_latency_ms", sa.Integer(), nullable=True),
        sa.Column(
            "provider_usage",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "warnings",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "audit_metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("error_code", sa.String(length=128), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
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
            ["workspace_id"],
            ["company_incorporation_workspaces.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["document_version_id"],
            ["document_versions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["document_processing_run_id"],
            ["document_processing_runs.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "document_processing_run_id",
            "attempt_number",
            name="uq_structured_extraction_runs_processing_attempt",
        ),
        sa.UniqueConstraint(
            "id",
            "document_version_id",
            name="uq_structured_extraction_runs_id_version",
        ),
        sa.UniqueConstraint(
            "id",
            "workspace_id",
            name="uq_structured_extraction_runs_id_workspace",
        ),
        sa.UniqueConstraint(
            "id",
            "document_processing_run_id",
            name="uq_structured_extraction_runs_id_processing",
        ),
    )
    op.create_index(
        "ix_structured_extraction_runs_workspace_id",
        "structured_extraction_runs",
        ["workspace_id"],
    )
    op.create_index(
        "ix_structured_extraction_runs_version_id",
        "structured_extraction_runs",
        ["document_version_id"],
    )
    op.create_index(
        "ix_structured_extraction_runs_processing_run_id",
        "structured_extraction_runs",
        ["document_processing_run_id"],
    )
    op.create_index(
        "ix_structured_extraction_runs_status_available",
        "structured_extraction_runs",
        ["status", "available_at"],
    )
    op.create_index(
        "ix_structured_extraction_runs_fingerprint",
        "structured_extraction_runs",
        ["input_fingerprint"],
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_structured_extraction_runs_active_processing
        ON structured_extraction_runs (document_processing_run_id)
        WHERE status IN ('queued', 'running')
        """
    )

    op.create_table(
        "fact_assertions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("structured_extraction_run_id", sa.Uuid(), nullable=False),
        sa.Column("document_version_id", sa.Uuid(), nullable=False),
        sa.Column("document_processing_run_id", sa.Uuid(), nullable=False),
        sa.Column("requirement_key", sa.String(length=128), nullable=False),
        sa.Column("fact_key", sa.String(length=128), nullable=False),
        sa.Column("value_type", sa.String(length=32), nullable=False),
        sa.Column("raw_value", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "normalized_value",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("display_value", sa.Text(), nullable=False),
        sa.Column("extractor_kind", sa.String(length=32), nullable=False),
        sa.Column("validation_status", sa.String(length=32), nullable=False),
        sa.Column("comparison_status", sa.String(length=32), nullable=False),
        sa.Column("review_status", sa.String(length=32), nullable=False),
        sa.Column("quality_score", sa.Float(), nullable=True),
        sa.Column("quality_category", sa.String(length=32), nullable=False),
        sa.Column("assertion_fingerprint", sa.String(length=64), nullable=False),
        sa.Column("source_temporality", sa.String(length=32), nullable=False),
        sa.Column(
            "quality_signals",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
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
            ["workspace_id"],
            ["company_incorporation_workspaces.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["structured_extraction_run_id", "document_version_id"],
            [
                "structured_extraction_runs.id",
                "structured_extraction_runs.document_version_id",
            ],
            ondelete="CASCADE",
            name="fk_fact_assertions_run_version",
        ),
        sa.ForeignKeyConstraint(
            ["structured_extraction_run_id", "workspace_id"],
            [
                "structured_extraction_runs.id",
                "structured_extraction_runs.workspace_id",
            ],
            ondelete="CASCADE",
            name="fk_fact_assertions_run_workspace",
        ),
        sa.ForeignKeyConstraint(
            ["structured_extraction_run_id", "document_processing_run_id"],
            [
                "structured_extraction_runs.id",
                "structured_extraction_runs.document_processing_run_id",
            ],
            ondelete="CASCADE",
            name="fk_fact_assertions_run_processing",
        ),
        sa.ForeignKeyConstraint(
            ["document_version_id"],
            ["document_versions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["document_processing_run_id"],
            ["document_processing_runs.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "structured_extraction_run_id",
            "assertion_fingerprint",
            name="uq_fact_assertions_run_fingerprint",
        ),
    )
    op.create_index("ix_fact_assertions_workspace_id", "fact_assertions", ["workspace_id"])
    op.create_index("ix_fact_assertions_fact_key", "fact_assertions", ["fact_key"])
    op.create_index(
        "ix_fact_assertions_run_id",
        "fact_assertions",
        ["structured_extraction_run_id"],
    )
    op.create_index(
        "ix_fact_assertions_version_id",
        "fact_assertions",
        ["document_version_id"],
    )

    op.create_table(
        "fact_evidence_references",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("fact_assertion_id", sa.Uuid(), nullable=False),
        sa.Column("document_page_id", sa.Uuid(), nullable=False),
        sa.Column("block_id", sa.String(length=64), nullable=False),
        sa.Column("evidence_role", sa.String(length=32), nullable=False),
        sa.Column("quote_snapshot", sa.Text(), nullable=False),
        sa.Column("bbox_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("extraction_method", sa.String(length=64), nullable=False),
        sa.Column("ocr_confidence", sa.Float(), nullable=True),
        sa.Column("block_order_index", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["fact_assertion_id"],
            ["fact_assertions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["document_page_id"],
            ["document_pages.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "fact_assertion_id",
            "block_id",
            "evidence_role",
            name="uq_fact_evidence_assertion_block_role",
        ),
    )
    op.create_index(
        "ix_fact_evidence_references_assertion_id",
        "fact_evidence_references",
        ["fact_assertion_id"],
    )

    op.create_table(
        "fact_assertion_reviews",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("fact_assertion_id", sa.Uuid(), nullable=False),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column("reviewed_by_user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["fact_assertion_id"],
            ["fact_assertions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by_user_id"],
            ["users.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_fact_assertion_reviews_assertion_id",
        "fact_assertion_reviews",
        ["fact_assertion_id"],
    )

    op.create_table(
        "fact_issues",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("fact_key", sa.String(length=128), nullable=False),
        sa.Column("issue_type", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(length=32), nullable=False),
        sa.Column("blocking", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column(
            "information_value_snapshot",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column(
            "information_normalized_snapshot",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column("issue_fingerprint", sa.String(length=64), nullable=False),
        sa.Column(
            "suggested_actions",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
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
            ["workspace_id"],
            ["company_incorporation_workspaces.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_fact_issues_workspace_id", "fact_issues", ["workspace_id"])
    op.create_index("ix_fact_issues_fact_key", "fact_issues", ["fact_key"])
    op.create_index("ix_fact_issues_status", "fact_issues", ["status"])
    op.execute(
        """
        CREATE UNIQUE INDEX uq_fact_issues_active_fingerprint
        ON fact_issues (workspace_id, issue_fingerprint)
        WHERE status IN ('open', 'awaiting_clarification', 'escalated')
        """
    )

    op.create_table(
        "fact_issue_assertions",
        sa.Column("issue_id", sa.Uuid(), nullable=False),
        sa.Column("fact_assertion_id", sa.Uuid(), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.ForeignKeyConstraint(["issue_id"], ["fact_issues.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["fact_assertion_id"],
            ["fact_assertions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("issue_id", "fact_assertion_id", "role"),
    )

    op.create_table(
        "fact_issue_resolutions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("fact_issue_id", sa.Uuid(), nullable=False),
        sa.Column("decision", sa.String(length=64), nullable=False),
        sa.Column("selected_assertion_id", sa.Uuid(), nullable=True),
        sa.Column("rationale", sa.Text(), nullable=False),
        sa.Column("resolved_by_user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "information_value_snapshot",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column(
            "document_value_snapshot",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["fact_issue_id"], ["fact_issues.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["selected_assertion_id"],
            ["fact_assertions.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["resolved_by_user_id"],
            ["users.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_fact_issue_resolutions_issue_id",
        "fact_issue_resolutions",
        ["fact_issue_id"],
    )


def downgrade() -> None:
    op.drop_table("fact_issue_resolutions")
    op.drop_table("fact_issue_assertions")
    op.execute("DROP INDEX IF EXISTS uq_fact_issues_active_fingerprint")
    op.drop_table("fact_issues")
    op.drop_table("fact_assertion_reviews")
    op.drop_table("fact_evidence_references")
    op.drop_table("fact_assertions")
    op.execute("DROP INDEX IF EXISTS uq_structured_extraction_runs_active_processing")
    op.drop_table("structured_extraction_runs")
