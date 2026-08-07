"""API schemas for Industry & Market — camelCase, mirrors Financials & KPIs."""

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


class BusinessOperationsReferenceResponse(ApiModel):
    available: bool = False
    product_service_context_available: bool = False
    business_segment_context_available: bool = False
    segment_ids: list[str] = Field(default_factory=list)


class FinancialsKpisReferenceResponse(ApiModel):
    available: bool = False
    reporting_segment_context_available: bool = False
    certified_kpi_context_available: bool = False
    segment_ids: list[str] = Field(default_factory=list)


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
    business_operations: BusinessOperationsReferenceResponse
    financials_kpis: FinancialsKpisReferenceResponse
    ipo_setup: IpoSetupReferenceResponse


class ComputationsResponse(ApiModel):
    primary_industry: str = ""
    relevant_market: str = ""
    geography: str = ""
    latest_market_size: str = ""
    latest_market_size_period: str = ""
    latest_market_size_unit: str = ""
    forecast_market_size: str = ""
    forecast_period: str = ""
    forecast_cagr: str = ""
    market_series_count: int = 0
    market_segment_count: int = 0
    issuer_linked_segment_count: int = 0
    competitor_count: int = 0
    calculated_issuer_market_share: str = ""
    market_share_basis: str = ""
    market_share_period: str = ""
    source_count: int = 0
    current_source_count: int = 0
    potentially_stale_source_count: int = 0
    pending_verification_source_count: int = 0
    commissioned_report_count: int = 0
    claims_proposed: int = 0
    claims_substantiated: int = 0
    claims_needing_evidence: int = 0
    conflicting_source_count: int = 0


class IndustryMarketWorkspaceResponse(ApiModel):
    id: str
    version: int
    schema_version: int
    last_saved_at: datetime | None = None
    payload: dict[str, Any]
    progress: WorkspaceProgressResponse
    computations: ComputationsResponse
    company_reference: CompanyReferenceResponse
    linked_references: LinkedWorkstreamReferencesResponse


class InitializeWorkspaceResponse(IndustryMarketWorkspaceResponse):
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
    primary_industry: str = ""
    relevant_market: str = ""
    geography: str = ""
    latest_market_size: str = ""
    latest_market_size_period: str = ""
    latest_market_size_unit: str = ""
    forecast_market_size: str = ""
    forecast_period: str = ""
    forecast_cagr: str = ""
    relevant_market_segment_count: int = 0
    issuer_linked_segment_count: int = 0
    competitors_identified: int = 0
    calculated_issuer_market_share: str = ""
    market_share_basis: str = ""
    market_share_period: str = ""
    external_source_count: int = 0
    current_source_count: int = 0
    potentially_stale_source_count: int = 0
    pending_verification_source_count: int = 0
    commissioned_report_count: int = 0
    claims_proposed: int = 0
    claims_substantiated: int = 0
    claims_needing_evidence: int = 0
    conflicting_source_count: int = 0
    assessment_concerns: int = 0
    assessment_result: str = ""
    assessment_result_label: str = ""
    assessment_summary: str = ""
    recommended_next_actions: list[OverviewNextAction] = Field(default_factory=list)
    last_updated_at: datetime | None = None


class IndustryAssessmentCriterionResponse(ApiModel):
    id: str
    group: str
    label: str
    state: str
    reason: str


class IndustryAssessmentGroupResponse(ApiModel):
    group: str
    label: str
    headline_state: str
    criteria: list[IndustryAssessmentCriterionResponse]


class IndustryAssessmentCountsResponse(ApiModel):
    substantiated: int
    potential_inconsistency: int
    missing_information: int
    missing_source: int
    stale_source: int
    methodology_concern: int
    conflicting_sources: int
    pending_industry_report: int
    pending_linked_workstream: int
    pending_professional_confirmation: int
    not_applicable: int


class IndustryAssessmentMetricsResponse(ApiModel):
    source_count: int
    sections_complete: int
    unanswered_confirmations: int
    unsupported_claims: int
    conflicting_source_count: int
    stale_source_count: int


class IndustryAssessmentResponse(ApiModel):
    result: str
    result_label: str
    summary: str
    criteria: list[IndustryAssessmentCriterionResponse]
    groups: list[IndustryAssessmentGroupResponse]
    counts: IndustryAssessmentCountsResponse
    metrics: IndustryAssessmentMetricsResponse


class DashboardIndustryMarketProgress(ApiModel):
    overall_status: OverallStatus
    sections_complete: int
    total_sections: int
