"""API schemas for Financials & KPIs — camelCase, mirrors Objects of the Issue."""

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


class CapitalOwnershipReferenceResponse(ApiModel):
    available: bool = False
    equity_share_capital: str | None = None
    face_value: str | None = None


class BusinessOperationsReferenceResponse(ApiModel):
    available: bool = False
    segment_ids: list[str] = Field(default_factory=list)


class ObjectsOfIssueReferenceResponse(ApiModel):
    available: bool = False
    working_capital_requirement: str | None = None
    borrowing_repayment_total: str | None = None


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


class LinkedWorkstreamReferencesResponse(ApiModel):
    company: CompanyReferenceResponse
    capital_ownership: CapitalOwnershipReferenceResponse
    ipo_setup: IpoSetupReferenceResponse
    business_operations: BusinessOperationsReferenceResponse
    objects_of_issue: ObjectsOfIssueReferenceResponse
    borrowings: LinkedPlaceholderResponse
    group_entities: LinkedPlaceholderResponse


class ComputationsResponse(ApiModel):
    period_count: int
    pl_period_count: int
    latest_period_label: str
    display_unit: str
    latest_revenue: str
    latest_profit_after_tax: str
    latest_ebitda: str
    reconciled_checks_count: int
    variance_checks_count: int
    missing_information_checks_count: int
    period_comparison_warnings_count: int
    restatement_checks_count: int
    restatement_checks_reconciled_count: int
    sme_eligibility_count: int
    kpi_count: int
    pl_line_count: int


class FinancialsKpisWorkspaceResponse(ApiModel):
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


class InitializeWorkspaceResponse(FinancialsKpisWorkspaceResponse):
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


class ReconciliationConcernResponse(ApiModel):
    id: str
    label: str
    message: str
    period_label: str


class PeriodComparisonWarningResponse(ApiModel):
    id: str
    previous_period_id: str
    current_period_id: str
    previous_label: str
    current_label: str
    warning: str


class OverviewSummaryResponse(ApiModel):
    section_statuses: dict[str, SectionStatus]
    sections_complete: int
    sections_in_progress: int = 0
    total_sections: int
    overall_status: OverallStatus
    period_labels: list[str]
    latest_period_label: str
    display_unit: str
    full_year_period_count: int
    interim_period_count: int
    entity_count: int
    pl_line_count: int
    kpi_count: int
    reconciled_checks_count: int
    variance_checks_count: int
    missing_information_checks_count: int
    reconciliation_concerns: list[ReconciliationConcernResponse]
    period_comparison_warnings: list[PeriodComparisonWarningResponse]
    assessment_result: str
    assessment_result_label: str
    assessment_summary: str
    recommended_next_actions: list[OverviewNextAction]
    latest_revenue: str
    latest_profit_after_tax: str
    latest_ebitda: str
    last_updated_at: datetime | None = None


class AssessmentCriterionResponse(ApiModel):
    id: str
    group: str
    label: str
    state: str
    reason: str


class AssessmentGroupCountsResponse(ApiModel):
    reconciled: int = 0
    potential_inconsistency: int = 0
    missing_information: int = 0
    pending_restatement: int = 0
    pending_auditor_confirmation: int = 0
    pending_linked_workstream: int = 0
    pending_kpi_certification: int = 0
    pending_professional_confirmation: int = 0
    not_applicable: int = 0


class AssessmentGroupResponse(ApiModel):
    group: str
    label: str
    criteria: list[AssessmentCriterionResponse]
    counts: AssessmentGroupCountsResponse
    headline_state: str


class AssessmentMetricsResponse(ApiModel):
    periods: int
    sections_complete: int
    unanswered_confirmations: int
    unreconciled_checks: int
    blocking_concerns: int


class FinancialAssessmentResponse(ApiModel):
    result: str
    result_label: str
    summary: str
    criteria: list[AssessmentCriterionResponse]
    groups: list[AssessmentGroupResponse]
    counts: AssessmentGroupCountsResponse
    metrics: AssessmentMetricsResponse


class DashboardFinancialsKpisProgress(ApiModel):
    overall_status: OverallStatus
    sections_complete: int
    total_sections: int
