"""API schemas for Borrowings, Assets & Contracts — camelCase."""

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


class FinancialsKpisReferenceResponse(ApiModel):
    available: bool = False
    latest_financial_period: str | None = None
    current_borrowings: str | None = None
    non_current_borrowings: str | None = None
    lease_liabilities: str | None = None
    total_debt: str | None = None
    related_party_debt: str | None = None
    finance_costs: str | None = None
    ppe: str | None = None
    cwip: str | None = None
    rou_assets: str | None = None


class ObjectsOfIssueReferenceResponse(ApiModel):
    available: bool = False
    debt_repayment_objects_count: int = 0
    total_proposed_repayment: str | None = None


class GroupEntitiesReferenceResponse(ApiModel):
    available: bool = False
    related_party_borrowings_count: int = 0
    inter_company_loans_count: int = 0
    corporate_guarantees_count: int = 0


class CapitalOwnershipReferenceResponse(ApiModel):
    available: bool = False
    promoter_count: int = 0
    pledged_shares_reported: bool = False
    guarantee_providers_count: int = 0


class BusinessOperationsReferenceResponse(ApiModel):
    available: bool = False
    facility_count: int = 0
    insurance_policy_count: int = 0
    ip_record_count: int = 0
    major_customer_supplier_context_available: bool = False


class ManagementGovernanceReferenceResponse(ApiModel):
    available: bool = False
    director_count: int = 0
    kmp_count: int = 0
    approval_context_available: bool = False


class LinkedWorkstreamPlaceholderResponse(ApiModel):
    available: bool = False


class LinkedWorkstreamReferencesResponse(ApiModel):
    financials_kpis: FinancialsKpisReferenceResponse
    objects_of_issue: ObjectsOfIssueReferenceResponse
    group_entities: GroupEntitiesReferenceResponse
    capital_ownership: CapitalOwnershipReferenceResponse
    business_operations: BusinessOperationsReferenceResponse
    management_governance: ManagementGovernanceReferenceResponse
    litigation_approvals_compliance: LinkedWorkstreamPlaceholderResponse = Field(
        default_factory=LinkedWorkstreamPlaceholderResponse,
    )
    intermediaries_filing: LinkedWorkstreamPlaceholderResponse = Field(
        default_factory=LinkedWorkstreamPlaceholderResponse,
    )


class FacilityCurrencyTotalsResponse(ApiModel):
    currency: str
    amount_unit: str
    facility_count: int
    total_sanctioned: str
    total_disbursed: str
    total_principal_outstanding: str
    total_accrued_interest: str
    total_outstanding: str
    total_undrawn: str
    secured_debt: str
    unsecured_debt: str
    fund_based_exposure: str
    non_fund_based_exposure: str
    related_party_borrowings: str


class InterestVarianceEntryResponse(ApiModel):
    facility_id: str
    facility_label: str
    calculated_effective_rate: str | None = None
    entered_effective_rate: str
    variance: str | None = None
    has_variance: bool


class ConsentCountsResponse(ApiModel):
    facilities_reviewed: int
    consent_required: int
    consent_requested: int
    consent_received: int
    consent_pending: int


class ExpiryWindowEntryResponse(ApiModel):
    id: str
    kind: str
    label: str
    expiry_date: str
    days_until_expiry: int | None = None


class ReconciliationPreviewItemResponse(ApiModel):
    status: str
    detail: str


class FinancialsReconciliationPreviewResponse(ReconciliationPreviewItemResponse):
    bac_facility_total: str
    financials_value: str | None = None
    difference: str


class ObjectsReconciliationPreviewResponse(ReconciliationPreviewItemResponse):
    repayment_item_count: int
    unresolved_count: int


class ReconciliationPreviewResponse(ApiModel):
    financials: FinancialsReconciliationPreviewResponse
    objects: ObjectsReconciliationPreviewResponse
    group_entities: ReconciliationPreviewItemResponse
    capital_ownership: ReconciliationPreviewItemResponse
    business_operations: ReconciliationPreviewItemResponse


class ComputationsResponse(ApiModel):
    facility_count: int = 0
    currency_totals: list[FacilityCurrencyTotalsResponse] = Field(default_factory=list)
    primary_currency: str | None = None
    primary_amount_unit: str | None = None
    position_as_of_date: str = ""
    interest_variances: list[InterestVarianceEntryResponse] = Field(default_factory=list)
    interest_variance_count: int = 0
    consent_counts: ConsentCountsResponse = Field(default_factory=ConsentCountsResponse)
    charge_count: int = 0
    charges_registered: int = 0
    charges_pending_registration: int = 0
    personal_guarantee_count: int = 0
    corporate_guarantee_count: int = 0
    financial_covenant_count: int = 0
    covenants_requiring_review: int = 0
    recorded_breaches: int = 0
    waivers_pending: int = 0
    property_count: int = 0
    owned_property_count: int = 0
    leased_property_count: int = 0
    property_leases_expiring_within12_months: list[ExpiryWindowEntryResponse] = Field(
        default_factory=list,
    )
    contract_count: int = 0
    contracts_expiring_within12_months: list[ExpiryWindowEntryResponse] = Field(default_factory=list)
    contracts_with_change_of_control_clauses: int = 0
    material_asset_count: int = 0
    encumbered_material_asset_count: int = 0
    title_occupancy_review_items: int = 0
    material_contract_review_items: int = 0
    debt_proposed_for_ipo_repayment: str = ""
    reconciliation: ReconciliationPreviewResponse


class BorrowingsAssetsContractsWorkspaceResponse(ApiModel):
    id: str
    version: int
    schema_version: int
    last_saved_at: datetime | None = None
    payload: dict[str, Any]
    progress: WorkspaceProgressResponse
    computations: ComputationsResponse
    linked_references: LinkedWorkstreamReferencesResponse


class InitializeWorkspaceResponse(BorrowingsAssetsContractsWorkspaceResponse):
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
    position_as_of_date: str = ""
    reporting_currency: str | None = None
    amount_unit: str | None = None
    currency_totals: list[FacilityCurrencyTotalsResponse] = Field(default_factory=list)
    facility_count: int = 0
    total_sanctioned: str = ""
    total_outstanding: str = ""
    secured_debt: str = ""
    unsecured_debt: str = ""
    total_undrawn: str = ""
    fund_based_exposure: str = ""
    non_fund_based_exposure: str = ""
    related_party_borrowings: str = ""
    charge_count: int = 0
    charges_registered: int = 0
    charges_pending_registration: int = 0
    personal_guarantee_count: int = 0
    corporate_guarantee_count: int = 0
    financial_covenants_requiring_review: int = 0
    recorded_breaches: int = 0
    waivers_pending: int = 0
    lender_consents_required: int = 0
    lender_consents_received: int = 0
    debt_proposed_for_ipo_repayment: str = ""
    objects_reconciliation_status: str = ""
    material_properties: int = 0
    owned_properties: int = 0
    leased_licensed_properties: int = 0
    property_leases_expiring_within12_months: int = 0
    title_occupancy_review_items: int = 0
    material_assets: int = 0
    encumbered_material_assets: int = 0
    material_contracts: int = 0
    contracts_expiring_within12_months: int = 0
    contracts_with_change_of_control_clauses: int = 0
    material_contract_review_items: int = 0
    financials_reconciliation_status: str = ""
    interest_variance_count: int = 0
    assessment_concerns: int = 0
    pending_professional_review_items: int = 0
    assessment_result: str = ""
    assessment_result_label: str = ""
    assessment_summary: str = ""
    recommended_next_actions: list[OverviewNextAction] = Field(default_factory=list)
    last_updated_at: datetime | None = None


class BacAssessmentCriterionResponse(ApiModel):
    id: str
    group: str
    label: str
    state: str
    reason: str
    related_section: str


class BacAssessmentGroupResponse(ApiModel):
    group: str
    label: str
    headline_state: str
    criteria: list[BacAssessmentCriterionResponse]


class BacAssessmentCountsResponse(ApiModel):
    reconciled: int
    potential_concern: int
    missing_information: int
    pending_charge_registration: int
    pending_lender_consent: int
    covenant_review_required: int
    financial_reconciliation_pending: int
    title_review_required: int
    contract_review_required: int
    pending_linked_workstream: int
    pending_professional_confirmation: int
    not_applicable: int


class BacAssessmentMetricsResponse(ApiModel):
    facility_count: int
    sections_complete: int
    unanswered_confirmations: int
    consent_pending: int
    charges_pending_registration: int
    potential_concerns: int


class BacAssessmentResponse(ApiModel):
    result: str
    result_label: str
    summary: str
    criteria: list[BacAssessmentCriterionResponse]
    groups: list[BacAssessmentGroupResponse]
    counts: BacAssessmentCountsResponse
    metrics: BacAssessmentMetricsResponse


class DashboardBorrowingsAssetsContractsProgress(ApiModel):
    overall_status: OverallStatus
    sections_complete: int
    total_sections: int
