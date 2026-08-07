"""API schemas for Management & Governance — camelCase, mirrors Financials & KPIs."""

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
    available: bool = False
    legal_name: str | None = None
    company_class: str | None = None
    cin: str | None = None
    company_status: str | None = None
    incorporation_date: str | None = None


class LinkedPlaceholderResponse(ApiModel):
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
    target_listing_segment: str | None = None
    listing_platform: str | None = None


class CapitalOwnershipReferenceResponse(ApiModel):
    available: bool = False
    paid_up_equity_capital: str | None = None
    promoter_identity_available: bool = False


class FinancialsKpisReferenceResponse(ApiModel):
    available: bool = False
    net_worth: str | None = None
    rpt_summary_available: bool = False


class BusinessOperationsReferenceResponse(ApiModel):
    available: bool = False
    business_unit_context_available: bool = False


class LinkedWorkstreamReferencesResponse(ApiModel):
    company: CompanyReferenceResponse
    ipo_setup: IpoSetupReferenceResponse
    capital_ownership: CapitalOwnershipReferenceResponse
    financials_kpis: FinancialsKpisReferenceResponse
    business_operations: BusinessOperationsReferenceResponse
    group_entities: LinkedPlaceholderResponse
    litigation: LinkedPlaceholderResponse


class ComputationsResponse(ApiModel):
    board_size: int
    proposed_board_size: int
    vacant_seats: int
    pending_appointments: int
    kmp_count: int
    smp_count: int
    committees_ready_count: int
    committees_required_count: int
    policies_adopted_count: int
    policies_required_count: int
    potential_directorship_limit_flags: int
    listing_segment: str
    director_count: int
    current_director_count: int
    independent_director_count: int
    critical_role_vacancies: int


class ManagementGovernanceWorkspaceResponse(ApiModel):
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


class InitializeWorkspaceResponse(ManagementGovernanceWorkspaceResponse):
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
    section_statuses: dict[str, SectionStatus]
    sections_complete: int
    sections_in_progress: int = 0
    total_sections: int
    overall_status: OverallStatus
    board_size: int
    proposed_board_size: int
    executive_directors: int
    non_executive_directors: int
    independent_directors: int
    women_directors: int
    resident_directors: int
    chairman_name: str
    managing_director_name: str
    kmp_count: int
    senior_management_count: int
    critical_vacancies: int
    committees_ready: int
    committees_required: int
    policies_adopted: int
    policies_required: int
    board_changes_last_three_years: int
    kmp_changes_last_three_years: int
    pending_appointments: int
    potential_concerns: int
    professional_review_items: int
    listing_segment: str
    assessment_result: str
    assessment_result_label: str
    assessment_summary: str
    recommended_next_actions: list[OverviewNextAction]
    last_updated_at: datetime | None = None


class GovernanceAssessmentCriterionResponse(ApiModel):
    id: str
    group: str
    label: str
    state: str
    reason: str


class GovernanceAssessmentGroupResponse(ApiModel):
    group: str
    label: str
    headline_state: str
    criteria: list[GovernanceAssessmentCriterionResponse]


class GovernanceAssessmentCountsResponse(ApiModel):
    appears_ready: int = 0
    potential_concern: int = 0
    missing_information: int = 0
    pending_appointment: int = 0
    pending_board_approval: int = 0
    pending_shareholder_approval: int = 0
    pending_linked_workstream: int = 0
    pending_professional_confirmation: int = 0
    not_applicable: int = 0


class GovernanceAssessmentMetricsResponse(ApiModel):
    board_size: int
    sections_complete: int
    unanswered_confirmations: int
    pending_appointments: int
    potential_concerns: int


class GovernanceAssessmentResponse(ApiModel):
    result: str
    result_label: str
    summary: str
    criteria: list[GovernanceAssessmentCriterionResponse]
    groups: list[GovernanceAssessmentGroupResponse]
    counts: GovernanceAssessmentCountsResponse
    metrics: GovernanceAssessmentMetricsResponse


class DashboardManagementGovernanceProgress(ApiModel):
    overall_status: OverallStatus
    sections_complete: int
    total_sections: int
