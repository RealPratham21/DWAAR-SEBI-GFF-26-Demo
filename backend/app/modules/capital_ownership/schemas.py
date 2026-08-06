"""API schemas for Capital & Ownership — camelCase, mirrors IPO Setup & Eligibility."""

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
    current_equity_shares: str
    paid_up_equity_capital_from_classes: str
    promoter_and_group_percentage: str
    public_percentage: str
    post_issue_shares: str
    promoter_pre_issue_percentage: str
    promoter_post_issue_percentage: str
    promoter_dilution_percentage_points: str
    offer_as_percentage_of_post_issue_capital: str
    total_shares_offered_for_sale: str
    potential_dilution_from_convertibles: str
    required_contribution_shares: str
    eligible_contribution_shares: str
    contribution_shortfall_shares: str
    total_encumbered_shares: str


class CapitalOwnershipWorkspaceResponse(ApiModel):
    id: str
    version: int
    schema_version: int
    last_saved_at: datetime | None = None
    payload: dict[str, Any]
    progress: WorkspaceProgressResponse
    computations: ComputationsResponse
    company_reference: CompanyReferenceResponse
    ipo_setup_reference: IpoSetupReferenceResponse


class InitializeWorkspaceResponse(CapitalOwnershipWorkspaceResponse):
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
    label: str
    section_id: str = ""
    href: str


class OverviewConcern(ApiModel):
    key: str
    label: str
    explanation: str


class OverviewSummaryResponse(ApiModel):
    sections_complete: int
    sections_in_progress: int = 0
    total_sections: int
    overall_status: OverallStatus
    section_statuses: dict[str, SectionStatus]
    current_equity_shares: str
    paid_up_equity_capital: str
    promoter_and_group_percentage: str
    post_issue_shares: str
    promoter_post_issue_percentage: str
    offer_as_percentage_of_post_issue_capital: str
    potential_dilution_from_convertibles: str
    total_shares_offered_for_sale: str
    selling_shareholders_count: int
    outstanding_instruments_count: int
    total_encumbered_shares: str
    reconciled_checks_count: int
    variance_checks_count: int
    missing_information_checks_count: int = 0
    reconciliation_concerns: list[OverviewConcern]
    ipo_setup_linked: bool
    ipo_setup_offer_type: str
    assessment_result: str
    assessment_result_label: str
    assessment_summary: str
    missing_required_responses: list[str]
    missing_required_count: int
    recommended_next_actions: list[OverviewNextAction]
    company_reference: CompanyReferenceResponse
    ipo_setup_reference: IpoSetupReferenceResponse


class AssessmentCriterionResponse(ApiModel):
    id: str
    group: str
    label: str
    state: str
    reason: str
    expected: str | None = None
    actual: str | None = None
    difference: str | None = None


class AssessmentGroupCountsResponse(ApiModel):
    reconciled: int
    potential_inconsistency: int
    missing_information: int
    pending_linked_workstream: int
    pending_professional_confirmation: int
    not_applicable: int


class AssessmentGroupResponse(ApiModel):
    group: str
    label: str
    criteria: list[AssessmentCriterionResponse]
    counts: AssessmentGroupCountsResponse
    headline_state: str


class AssessmentMetricsResponse(ApiModel):
    current_equity_shares: str
    paid_up_equity_capital: str
    post_issue_equity_shares: str
    promoter_pre_issue_percentage: str
    promoter_post_issue_percentage: str
    promoter_dilution_percentage_points: str
    total_shares_offered_for_sale: str
    minimum_contribution_required_shares: str
    eligible_contribution_shares: str
    contribution_shortfall_shares: str
    potential_dilution_from_convertibles: str
    unreconciled_checks: int
    unanswered_confirmations: int
    sections_complete: int


class CapitalAssessmentResponse(ApiModel):
    result: str
    result_label: str
    summary: str
    criteria: list[AssessmentCriterionResponse]
    groups: list[AssessmentGroupResponse]
    counts: AssessmentGroupCountsResponse
    metrics: AssessmentMetricsResponse
