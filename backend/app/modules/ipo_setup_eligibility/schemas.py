"""API schemas for IPO Setup & Eligibility."""

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


class OfferComputationsResponse(ApiModel):
    includes_fresh_issue: bool
    includes_ofs: bool
    amount_display_unit: str
    total_shares_offered: str | None = None
    total_offer_amount: str | None = None
    fresh_issue_percentage_of_offer: str | None = None
    ofs_percentage_of_offer: str | None = None
    proposed_post_issue_shares: str | None = None
    proposed_post_issue_paid_up_capital: str | None = None
    offer_as_percentage_of_post_issue_capital: str | None = None
    paid_up_capital_increase_from_offer: str | None = None


class IpoSetupWorkspaceResponse(ApiModel):
    id: str
    version: int
    schema_version: int
    last_saved_at: datetime | None = None
    payload: dict[str, Any]
    progress: WorkspaceProgressResponse
    offer_computations: OfferComputationsResponse
    company_reference: CompanyReferenceResponse


class InitializeWorkspaceResponse(IpoSetupWorkspaceResponse):
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
    offer_computations: OfferComputationsResponse
    acknowledgement: SaveAcknowledgementResponse
    notification: NotificationResponse


class AssessmentCriterionResponse(ApiModel):
    key: str
    label: str
    group: str
    result: str
    explanation: str
    values_used: dict[str, Any] = Field(default_factory=dict)
    missing_fields: list[str] = Field(default_factory=list)
    related_section: str | None = None
    deep_link: str


class AssessmentMetricsResponse(ApiModel):
    proposed_post_issue_paid_up_capital: str | None = None
    ofs_percentage_of_offer: str | None = None
    years_meeting_operating_profit_threshold: int
    positive_net_worth_available: bool | None = None
    years_with_positive_fcfe: int
    three_year_track_record_established: bool | None = None
    public_company_conversion_status: str
    unresolved_adverse_declarations: int


class EligibilityAssessmentResponse(ApiModel):
    result: str
    result_label: str
    summary: str
    criteria: list[AssessmentCriterionResponse]
    grouped_criteria: dict[str, list[AssessmentCriterionResponse]]
    metrics: AssessmentMetricsResponse
    offer_computations: OfferComputationsResponse


class OverviewNextAction(ApiModel):
    label: str
    section_id: str = ""
    href: str


class OverviewConcern(ApiModel):
    key: str
    label: str
    explanation: str


class OverviewSummaryResponse(ApiModel):
    preparation_stage: str
    preparation_stage_label: str
    target_platform: str
    target_platform_label: str
    offer_type: str
    offer_type_label: str
    pricing_method: str
    pricing_method_label: str
    sections_complete: int
    total_sections: int
    overall_status: OverallStatus
    section_statuses: dict[str, SectionStatus]
    preliminary_assessment_result: str
    preliminary_assessment_label: str
    potential_concerns: list[OverviewConcern]
    missing_required_responses: list[str]
    missing_required_count: int
    process_readiness_status: SectionStatus
    recommended_next_actions: list[OverviewNextAction]
    offer_computations: OfferComputationsResponse
    company_reference: CompanyReferenceResponse
