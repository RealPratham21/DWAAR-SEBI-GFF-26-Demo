"""API schemas for Objects of the Issue — camelCase, mirrors Business & Operations."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.modules.notifications.schemas import NotificationResponse, SaveAcknowledgementResponse


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


SectionStatus = Literal["not_started", "in_progress", "complete"]
OverallStatus = Literal["not_started", "in_progress", "complete"]


class WorkspaceProgressResponse(ApiModel):
    sections: dict[str, SectionStatus]
    sections_complete: int
    total_sections: int
    overall_status: OverallStatus


class CompanyReferenceResponse(ApiModel):
    legal_name: str | None = None
    company_class: str | None = None
    cin: str | None = None
    available: bool = False


class LinkedPlaceholderResponse(ApiModel):
    available: bool = False


class LinkedWorkstreamReferencesResponse(ApiModel):
    company: CompanyReferenceResponse
    business_operations: LinkedPlaceholderResponse
    capital_ownership: LinkedPlaceholderResponse
    borrowings: LinkedPlaceholderResponse


class IpoSetupReferenceResponse(ApiModel):
    available: bool = False
    proposed_offer_type: str = ""
    face_value_per_equity_share: str = ""
    existing_issued_equity_shares: str = ""
    existing_paid_up_equity_share_capital: str = ""
    proposed_issue_price: str = ""
    proposed_fresh_issue_shares: str = ""
    proposed_fresh_issue_amount: str = ""
    proposed_ofs_shares: str = ""
    proposed_ofs_amount: str = ""


class ComputationsResponse(ApiModel):
    is_pure_ofs: bool
    net_fresh_issue_proceeds: str
    total_estimated_objects_cost: str
    total_allocated_from_net_proceeds: str
    total_allocated_from_all_sources: str
    unallocated_net_proceeds: str
    allocation_reconciles: bool
    total_means_of_finance: str
    total_deployment_scheduled: str
    means_of_finance_reconciles: bool
    total_issue_expenses: str
    gcp_percentage_of_fresh_issue: str
    gcp_applicable_cap: str
    gcp_within_limit: bool
    objects_count: int
    capex_items_count: int
    borrowing_repayment_items_count: int
    investment_items_count: int
    reconciled_checks_count: int
    variance_checks_count: int
    pending_checks_count: int


class ObjectsIssueWorkspaceResponse(ApiModel):
    id: str
    version: int
    schema_version: int
    last_saved_at: datetime | None = None
    payload: dict[str, Any]
    progress: WorkspaceProgressResponse
    computations: ComputationsResponse
    ipo_setup_reference: IpoSetupReferenceResponse
    company_reference: CompanyReferenceResponse
    linked_references: LinkedWorkstreamReferencesResponse


class InitializeWorkspaceResponse(ObjectsIssueWorkspaceResponse):
    created: bool


class SectionSaveRequest(ApiModel):
    version: int = Field(ge=1)
    data: dict[str, Any]


class SectionSaveResponse(ApiModel):
    version: int
    last_saved_at: datetime
    saved_section_id: str
    saved_section: dict[str, Any]
    progress: WorkspaceProgressResponse
    payload: dict[str, Any]
    computations: ComputationsResponse
    acknowledgement: SaveAcknowledgementResponse
    notification: NotificationResponse


class OverviewNextAction(ApiModel):
    section_id: str
    label: str


class OverviewSummaryResponse(ApiModel):
    is_pure_ofs: bool
    section_statuses: dict[str, SectionStatus]
    sections_complete: int
    sections_in_progress: int = 0
    total_sections: int
    objects_count: int
    net_fresh_issue_proceeds: str
    total_estimated_objects_cost: str
    total_allocated_from_net_proceeds: str
    gcp_percentage_of_fresh_issue: str
    gcp_applicable_cap: str
    has_capex_relevant_objects: bool
    has_acquisition_relevant_objects: bool
    company_reference: CompanyReferenceResponse
    assessment_result: str
    assessment_result_label: str
    assessment_summary: str
    blocking_concern_count: int
    reconciled_checks_count: int
    variance_checks_count: int
    missing_information_checks_count: int = 0
    recommended_next_actions: list[OverviewNextAction]
    last_updated_at: datetime | None = None


class AssessmentCriterionResponse(ApiModel):
    id: str
    label: str
    state: str
    reason: str


class AssessmentGroupCountsResponse(ApiModel):
    reconciled: int = 0
    potential_concern: int = 0
    missing_information: int = 0
    pending_linked_workstream: int = 0
    pending_supporting_source: int = 0
    blocked: int = 0
    pending_professional_confirmation: int = 0
    not_applicable: int = 0


class AssessmentGroupResponse(ApiModel):
    group: str
    label: str
    criteria: list[AssessmentCriterionResponse]
    counts: AssessmentGroupCountsResponse
    headline_state: str


class AssessmentMetricsResponse(ApiModel):
    objects: int
    sections_complete: int
    unanswered_confirmations: int
    unreconciled_checks: int
    blocking_concerns: int
    net_fresh_issue_proceeds: str
    total_estimated_objects_cost: str


class ObjectsAssessmentResponse(ApiModel):
    result: str
    result_label: str
    summary: str
    criteria: list[AssessmentCriterionResponse]
    groups: list[AssessmentGroupResponse]
    counts: AssessmentGroupCountsResponse
    metrics: AssessmentMetricsResponse


class DashboardObjectsIssueProgress(ApiModel):
    overall_status: OverallStatus
    sections_complete: int
    total_sections: int
