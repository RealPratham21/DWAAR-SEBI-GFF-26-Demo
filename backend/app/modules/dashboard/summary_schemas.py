"""Dashboard summary schemas (G8)."""

from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.modules.dashboard.schemas import ApiModel


class IssuerContextResponse(ApiModel):
    issuer_name: str
    company_class: str = ""
    target_exchange: str = ""
    issue_type: str = ""
    target_timeline: str = ""
    preparation_stage: str = ""


class DashboardWorkstreamItemResponse(ApiModel):
    key: str
    label: str
    order: int
    completed_sections: int
    total_sections: int
    progress_state: str
    progress_state_label: str
    open_issues: int = 0
    document_provided: int = 0
    document_expected: int = 0
    primary_review_state: str = ""
    href: str


class DashboardWorkstreamsResponse(ApiModel):
    total: int = 12
    complete: int = 0
    in_progress: int = 0
    not_started: int = 0
    total_sections: int = 0
    completed_sections: int = 0
    items: list[DashboardWorkstreamItemResponse] = Field(default_factory=list)


class DashboardTopIssueResponse(ApiModel):
    issue_id: str
    title: str
    severity: str
    severity_label: str
    workstream_key: str = ""
    workstream_label: str = ""
    reason: str = ""
    href: str


class DashboardIssuesResponse(ApiModel):
    open: int = 0
    blocking: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    professional_review: int = 0
    top_issues: list[DashboardTopIssueResponse] = Field(default_factory=list)


class DashboardFactsEvidenceResponse(ApiModel):
    canonical_facts: int = 0
    document_backed_facts: int = 0
    structured_input_facts: int = 0
    calculated_facts: int = 0
    professional_confirmation_facts: int = 0
    facts_used_in_latest_drhp: int = 0
    evidence_documents: int = 0
    evidence_items: int = 0


class DashboardDataRoomResponse(ApiModel):
    uploaded_documents: int = 0
    expected_applicable: int = 0
    provided_requirements: int = 0
    missing_requirements: int = 0
    review_applicability: int = 0
    processed_documents: int = 0
    stored_only_documents: int = 0


class DashboardDrhpResponse(ApiModel):
    exists: bool = False
    version_id: str | None = None
    version_number: int | None = None
    status: str | None = None
    status_label: str = "Not generated"
    generated_at: datetime | None = None
    chapter_total: int = 0
    generated: int = 0
    generated_with_warnings: int = 0
    blocked: int = 0
    failed: int = 0
    stale: bool = False
    affected_chapter_count: int = 0
    export_available: bool = False
    open_url: str = "/projects/demo/drhp"


class DashboardNextActionResponse(ApiModel):
    id: str
    priority: int
    title: str
    description: str
    source_type: str
    workstream_key: str | None = None
    issue_id: str | None = None
    action_label: str
    href: str


class DashboardSummaryResponse(ApiModel):
    issuer_context: IssuerContextResponse
    workstreams: DashboardWorkstreamsResponse
    issues: DashboardIssuesResponse
    facts_evidence: DashboardFactsEvidenceResponse
    data_room: DashboardDataRoomResponse
    drhp: DashboardDrhpResponse
    next_actions: list[DashboardNextActionResponse] = Field(default_factory=list)
    generated_at: datetime
    warnings: list[str] = Field(default_factory=list)
