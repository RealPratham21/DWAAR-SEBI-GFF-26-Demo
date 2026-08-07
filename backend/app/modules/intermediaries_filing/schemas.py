"""API schemas for Intermediaries & Filing — camelCase."""

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


SectionStatus = Literal[
    "not_started",
    "in_progress",
    "complete",
    "not_yet_due",
    "not_applicable",
]
OverallStatus = Literal["not_started", "in_progress", "complete"]


class WorkspaceProgressResponse(ApiModel):
    sections: dict[str, SectionStatus]
    sections_complete: int
    total_sections: int
    overall_status: OverallStatus
    current_filing_stage: str = ""


class CompanyReferenceResponse(ApiModel):
    available: bool = False
    legal_name: str | None = None
    cin: str | None = None
    registered_office: str | None = None
    public_private_status: str | None = None


class IpoSetupReferenceResponse(ApiModel):
    available: bool = False
    target_sme_platform: str | None = None
    issue_method: str | None = None
    fresh_issue: str | None = None
    ofs: str | None = None
    total_offer: str | None = None
    face_value: str | None = None
    proposed_final_issue_price: str | None = None
    target_filing_date: str | None = None
    issue_stage: str | None = None


class CapitalOwnershipReferenceResponse(ApiModel):
    available: bool = False
    pre_issue_shares: str | None = None
    post_issue_shares: str | None = None
    fresh_issue_shares: str | None = None
    ofs_shares: str | None = None
    promoter_contribution: str | None = None
    selling_shareholders: str | None = None


class ObjectsOfIssueReferenceResponse(ApiModel):
    available: bool = False
    total_objects_amount: str | None = None
    capex_amount: str | None = None
    working_capital_amount: str | None = None
    debt_repayment_amount: str | None = None


class FinancialsKpisReferenceResponse(ApiModel):
    available: bool = False
    latest_financial_period: str | None = None
    restated_financials_ready: bool | None = None
    kpi_readiness: str | None = None
    auditor_certificate_context: str | None = None


class ManagementGovernanceReferenceResponse(ApiModel):
    available: bool = False
    director_count: int | None = None
    kmp_count: int | None = None
    cfo_name: str | None = None
    company_secretary_name: str | None = None


class BusinessOperationsReferenceResponse(ApiModel):
    available: bool = False
    facility_count: int | None = None
    operational_dd_context_available: bool | None = None


class IndustryMarketReferenceResponse(ApiModel):
    available: bool = False
    industry_report_ready: bool | None = None
    research_provider: str | None = None


class GroupEntitiesReferenceResponse(ApiModel):
    available: bool = False
    entity_count: int | None = None
    material_subsidiary_count: int | None = None


class BorrowingsAssetsContractsReferenceResponse(ApiModel):
    available: bool = False
    material_contract_count: int | None = None
    inspection_candidate_count: int | None = None
    financing_consent_count: int | None = None


class LitigationApprovalsComplianceReferenceResponse(ApiModel):
    available: bool = False
    open_matter_count: int | None = None
    material_development_count: int | None = None
    approval_gap_count: int | None = None
    filing_cut_off_updated: bool | None = None


class LinkedWorkstreamReferencesResponse(ApiModel):
    company: CompanyReferenceResponse = Field(default_factory=CompanyReferenceResponse)
    ipo_setup: IpoSetupReferenceResponse = Field(default_factory=IpoSetupReferenceResponse)
    capital_ownership: CapitalOwnershipReferenceResponse = Field(
        default_factory=CapitalOwnershipReferenceResponse,
    )
    objects_of_issue: ObjectsOfIssueReferenceResponse = Field(
        default_factory=ObjectsOfIssueReferenceResponse,
    )
    financials_kpis: FinancialsKpisReferenceResponse = Field(
        default_factory=FinancialsKpisReferenceResponse,
    )
    management_governance: ManagementGovernanceReferenceResponse = Field(
        default_factory=ManagementGovernanceReferenceResponse,
    )
    business_operations: BusinessOperationsReferenceResponse = Field(
        default_factory=BusinessOperationsReferenceResponse,
    )
    industry_market: IndustryMarketReferenceResponse = Field(default_factory=IndustryMarketReferenceResponse)
    group_entities: GroupEntitiesReferenceResponse = Field(default_factory=GroupEntitiesReferenceResponse)
    borrowings_assets_contracts: BorrowingsAssetsContractsReferenceResponse = Field(
        default_factory=BorrowingsAssetsContractsReferenceResponse,
    )
    litigation_approvals_compliance: LitigationApprovalsComplianceReferenceResponse = Field(
        default_factory=LitigationApprovalsComplianceReferenceResponse,
    )


class ReconciliationMismatchResponse(ApiModel):
    workstream: str
    field: str
    if_value: str
    linked_value: str
    status: str
    message: str


class ReconciliationWorkstreamPreviewResponse(ApiModel):
    status: str
    detail: str
    mismatch_count: int = 0
    mismatches: list[ReconciliationMismatchResponse] = Field(default_factory=list)


class IfReconciliationPreviewResponse(ApiModel):
    ipo_setup: ReconciliationWorkstreamPreviewResponse
    capital_ownership: ReconciliationWorkstreamPreviewResponse
    objects_of_issue: ReconciliationWorkstreamPreviewResponse
    financials_kpis: ReconciliationWorkstreamPreviewResponse
    litigation_approvals_compliance: ReconciliationWorkstreamPreviewResponse
    borrowings_assets_contracts: ReconciliationWorkstreamPreviewResponse
    items: list[ReconciliationMismatchResponse] = Field(default_factory=list)
    total_mismatch_count: int = 0


class ComputationsResponse(ApiModel):
    intermediary_aggregates: dict[str, Any]
    filing_aggregates: dict[str, Any]
    certificate_consent_aggregates: dict[str, Any]
    due_diligence_aggregates: dict[str, Any]
    infrastructure_aggregates: dict[str, Any]
    underwriting_aggregates: dict[str, Any]
    market_making_aggregates: dict[str, Any]
    programme_aggregates: dict[str, Any]
    final_document_aggregates: dict[str, Any]
    reconciliation: IfReconciliationPreviewResponse
    current_filing_stage: str = ""


class IntermediariesFilingWorkspaceResponse(ApiModel):
    id: str
    version: int
    schema_version: int
    last_saved_at: datetime | None = None
    payload: dict[str, Any]
    progress: WorkspaceProgressResponse
    computations: ComputationsResponse
    linked_references: LinkedWorkstreamReferencesResponse


class InitializeWorkspaceResponse(IntermediariesFilingWorkspaceResponse):
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
    current_filing_stage: str = ""
    target_sme_platform: str = ""
    issue_method: str = ""
    fresh_issue_amount: str = ""
    ofs_amount: str = ""
    total_offer_amount: str = ""
    current_price_band_status: str = ""
    authoritative_document_version: str = ""
    intermediary_count: int = 0
    lead_manager_count: int = 0
    active_intermediary_count: int = 0
    agreements_pending_count: int = 0
    registrations_pending_review: int = 0
    dd_areas_signed_off: int = 0
    dd_areas_total: int = 0
    open_dd_areas: int = 0
    certificates_ready: int = 0
    certificates_pending: int = 0
    consents_required: int = 0
    consents_received: int = 0
    chapter_signoffs_complete: int = 0
    chapter_signoffs_total: int = 0
    filing_count: int = 0
    open_exchange_queries: int = 0
    overdue_exchange_queries: int = 0
    in_principle_status: str = ""
    sebi_sme_filing_status: str = ""
    roc_filing_status: str = ""
    isin_status: str = ""
    sponsor_bank_ready: bool = False
    upi_ready: bool = False
    asba_ready: bool = False
    bank_roles_ready: int = 0
    bank_roles_total: int = 0
    underwriting_coverage: str = ""
    uncovered_shares: str = ""
    merchant_banker_own_account_percentage: str = ""
    market_maker_appointed: bool = False
    market_making_agreement_executed: bool = False
    market_making_reservation_status: str = ""
    issue_opening_date: str = ""
    issue_closing_date: str = ""
    preliminary_t_plus3_listing_date: str = ""
    basis_status: str = ""
    demat_status: str = ""
    listing_status: str = ""
    unresolved_placeholders: int = 0
    inspection_items_pending: int = 0
    issue_agreements_pending: int = 0
    advertisements_pending: int = 0
    repository_readiness: str = ""
    reconciliation_mismatch_count: int = 0
    assessment_concerns: int = 0
    pending_professional_confirmations: int = 0
    assessment_result: str = ""
    assessment_result_label: str = ""
    assessment_summary: str = ""
    recommended_next_actions: list[OverviewNextAction] = Field(default_factory=list)
    last_updated_at: datetime | None = None


class IfAssessmentCriterionResponse(ApiModel):
    id: str
    group: str
    label: str
    state: str
    reason: str
    related_section: str


class IfAssessmentGroupResponse(ApiModel):
    group: str
    label: str
    headline_state: str
    criteria: list[IfAssessmentCriterionResponse]


class IfAssessmentCountsResponse(ApiModel):
    ready: int = 0
    potential_concern: int = 0
    missing_information: int = 0
    appointment_pending: int = 0
    agreement_pending: int = 0
    certificate_pending: int = 0
    consent_pending: int = 0
    exchange_query_pending: int = 0
    filing_pending: int = 0
    approval_pending: int = 0
    underwriting_pending: int = 0
    market_making_pending: int = 0
    issue_infrastructure_pending: int = 0
    listing_action_pending: int = 0
    pending_linked_workstream: int = 0
    pending_professional_confirmation: int = 0
    not_applicable: int = 0
    not_yet_due: int = 0


class IfAssessmentMetricsResponse(ApiModel):
    intermediary_count: int = 0
    filing_count: int = 0
    open_query_count: int = 0
    sections_complete: int = 0
    unanswered_confirmations: int = 0
    reconciliation_mismatch_count: int = 0
    potential_concerns: int = 0


class IfAssessmentResponse(ApiModel):
    result: str
    result_label: str
    summary: str
    criteria: list[IfAssessmentCriterionResponse]
    groups: list[IfAssessmentGroupResponse]
    counts: IfAssessmentCountsResponse
    metrics: IfAssessmentMetricsResponse
    rules_version: str = ""
    rules_as_of: str = ""


class DashboardIntermediariesFilingProgress(ApiModel):
    overall_status: OverallStatus
    sections_complete: int
    total_sections: int
