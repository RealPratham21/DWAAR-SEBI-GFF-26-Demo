"""API schemas for Litigation, Approvals & Compliance — camelCase."""

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


class CompanyLegalReferenceResponse(ApiModel):
    available: bool = False
    legal_name: str | None = None
    cin: str | None = None


class IpoSetupReferenceResponse(ApiModel):
    available: bool = False
    target_drhp_filing_date: str | None = None
    proposed_offer_type: str | None = None


class CapitalOwnershipReferenceResponse(ApiModel):
    available: bool = False
    promoter_count: int | None = None
    pledged_shares_reported: bool | None = None


class ManagementGovernanceReferenceResponse(ApiModel):
    available: bool = False
    director_count: int | None = None
    kmp_count: int | None = None


class FinancialsKpisReferenceResponse(ApiModel):
    available: bool = False
    latest_financial_period: str | None = None
    contingent_liabilities_total: str | None = None
    provisions_total: str | None = None
    tax_disputes_total: str | None = None
    trade_payables_total: str | None = None


class BusinessOperationsReferenceResponse(ApiModel):
    available: bool = False
    facility_count: int | None = None
    operational_approval_context_available: bool | None = None


class ObjectsOfIssueReferenceResponse(ApiModel):
    available: bool = False
    capex_project_count: int | None = None
    approval_plan_linked: bool | None = None


class GroupEntitiesReferenceResponse(ApiModel):
    available: bool = False
    entity_count: int | None = None
    material_subsidiary_count: int | None = None


class BorrowingsAssetsContractsReferenceResponse(ApiModel):
    available: bool = False
    facility_count: int | None = None
    default_event_count: int | None = None
    contract_dispute_count: int | None = None


class LinkedWorkstreamReferencesResponse(ApiModel):
    company: CompanyLegalReferenceResponse = Field(default_factory=CompanyLegalReferenceResponse)
    ipo_setup: IpoSetupReferenceResponse = Field(default_factory=IpoSetupReferenceResponse)
    capital_ownership: CapitalOwnershipReferenceResponse = Field(
        default_factory=CapitalOwnershipReferenceResponse,
    )
    management_governance: ManagementGovernanceReferenceResponse = Field(
        default_factory=ManagementGovernanceReferenceResponse,
    )
    financials_kpis: FinancialsKpisReferenceResponse = Field(
        default_factory=FinancialsKpisReferenceResponse,
    )
    business_operations: BusinessOperationsReferenceResponse = Field(
        default_factory=BusinessOperationsReferenceResponse,
    )
    objects_of_issue: ObjectsOfIssueReferenceResponse = Field(
        default_factory=ObjectsOfIssueReferenceResponse,
    )
    group_entities: GroupEntitiesReferenceResponse = Field(default_factory=GroupEntitiesReferenceResponse)
    borrowings_assets_contracts: BorrowingsAssetsContractsReferenceResponse = Field(
        default_factory=BorrowingsAssetsContractsReferenceResponse,
    )


class MatterCategoryCountResponse(ApiModel):
    category: str
    count: int


class ExposureByCurrencyResponse(ApiModel):
    currency: str
    amount_unit: str
    matter_count: int
    total_exposure: str
    tax_exposure: str
    criminal_count: int
    pending_count: int


class TaxAggregateResponse(ApiModel):
    direct_tax_demand: str
    indirect_tax_demand: str
    total_demand: str
    total_balance_disputed: str
    proceeding_count: int


class ApprovalExpiryWindowEntryResponse(ApiModel):
    approval_id: str
    label: str
    expiry_date: str
    days_until_expiry: int | None = None
    window: str


class ApprovalExpiryWindowsResponse(ApiModel):
    within30_days: list[ApprovalExpiryWindowEntryResponse] = Field(default_factory=list)
    within90_days: list[ApprovalExpiryWindowEntryResponse] = Field(default_factory=list)
    within180_days: list[ApprovalExpiryWindowEntryResponse] = Field(default_factory=list)
    within365_days: list[ApprovalExpiryWindowEntryResponse] = Field(default_factory=list)


class ComplianceCountsResponse(ApiModel):
    domain_review_count: int = 0
    domains_with_known_exceptions: int = 0
    compliance_issue_count: int = 0
    continuing_issues: int = 0
    statutory_due_count: int = 0
    delayed_statutory_dues: int = 0
    approval_conditions_outstanding: int = 0


class CreditorTotalsResponse(ApiModel):
    material_creditor_count: int = 0
    msme_creditor_count: int = 0
    material_outstanding: str = ""
    msme_outstanding: str = ""
    aggregate_outstanding: str = ""
    reconciliation_difference: str = ""
    reconciliation_status: str = ""


class ReconciliationPreviewItemResponse(ApiModel):
    status: str
    detail: str


class LacReconciliationPreviewResponse(ApiModel):
    financials: ReconciliationPreviewItemResponse
    group_entities: ReconciliationPreviewItemResponse
    management_governance: ReconciliationPreviewItemResponse
    bac: ReconciliationPreviewItemResponse
    business_operations: ReconciliationPreviewItemResponse
    objects_of_issue: ReconciliationPreviewItemResponse
    ipo_setup: ReconciliationPreviewItemResponse


class ComputationsResponse(ApiModel):
    matter_count: int = 0
    matters_by_category: list[MatterCategoryCountResponse] = Field(default_factory=list)
    criminal_matter_count: int = 0
    tax_matter_count: int = 0
    pending_outcome_count: int = 0
    exposure_by_currency: list[ExposureByCurrencyResponse] = Field(default_factory=list)
    tax_aggregates: TaxAggregateResponse = Field(default_factory=TaxAggregateResponse)
    approval_count: int = 0
    expired_approval_count: int = 0
    renewal_pending_count: int = 0
    approval_expiry_windows: ApprovalExpiryWindowsResponse = Field(
        default_factory=ApprovalExpiryWindowsResponse,
    )
    compliance_counts: ComplianceCountsResponse = Field(default_factory=ComplianceCountsResponse)
    creditor_totals: CreditorTotalsResponse = Field(default_factory=CreditorTotalsResponse)
    remediation_open_count: int = 0
    legal_dd_as_of_date: str = ""
    reconciliation: LacReconciliationPreviewResponse


class LitigationApprovalsComplianceWorkspaceResponse(ApiModel):
    id: str
    version: int
    schema_version: int
    last_saved_at: datetime | None = None
    payload: dict[str, Any]
    progress: WorkspaceProgressResponse
    computations: ComputationsResponse
    linked_references: LinkedWorkstreamReferencesResponse


class InitializeWorkspaceResponse(LitigationApprovalsComplianceWorkspaceResponse):
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
    legal_dd_as_of_date: str = ""
    matter_count: int = 0
    criminal_matter_count: int = 0
    tax_matter_count: int = 0
    pending_outcome_count: int = 0
    primary_exposure: str = ""
    tax_aggregate_demand: str = ""
    approval_count: int = 0
    expired_approval_count: int = 0
    renewal_pending_count: int = 0
    approvals_expiring_within30_days: int = 0
    approvals_expiring_within90_days: int = 0
    compliance_issue_count: int = 0
    delayed_statutory_dues: int = 0
    approval_conditions_outstanding: int = 0
    material_creditor_count: int = 0
    msme_creditor_count: int = 0
    creditor_aggregate_outstanding: str = ""
    material_development_count: int = 0
    remediation_open_count: int = 0
    financials_reconciliation_status: str = ""
    group_entities_reconciliation_status: str = ""
    management_governance_reconciliation_status: str = ""
    bac_reconciliation_status: str = ""
    business_operations_reconciliation_status: str = ""
    objects_reconciliation_status: str = ""
    ipo_setup_reconciliation_status: str = ""
    assessment_concerns: int = 0
    pending_professional_review_items: int = 0
    assessment_result: str = ""
    assessment_result_label: str = ""
    assessment_summary: str = ""
    recommended_next_actions: list[OverviewNextAction] = Field(default_factory=list)
    last_updated_at: datetime | None = None


class LacAssessmentCriterionResponse(ApiModel):
    id: str
    group: str
    label: str
    state: str
    reason: str
    related_section: str


class LacAssessmentGroupResponse(ApiModel):
    group: str
    label: str
    headline_state: str
    criteria: list[LacAssessmentCriterionResponse]


class LacAssessmentCountsResponse(ApiModel):
    reconciled: int = 0
    potential_concern: int = 0
    missing_information: int = 0
    materiality_review_required: int = 0
    pending_legal_review: int = 0
    approval_renewal_review_required: int = 0
    compliance_review_required: int = 0
    financial_reconciliation_pending: int = 0
    pending_linked_workstream: int = 0
    pending_professional_confirmation: int = 0
    pending_board_determination: int = 0
    not_applicable: int = 0


class LacAssessmentMetricsResponse(ApiModel):
    matter_count: int = 0
    approval_count: int = 0
    sections_complete: int = 0
    unanswered_confirmations: int = 0
    expiring_approvals30_days: int = 0
    delayed_statutory_dues: int = 0
    potential_concerns: int = 0


class LacAssessmentResponse(ApiModel):
    result: str
    result_label: str
    summary: str
    criteria: list[LacAssessmentCriterionResponse]
    groups: list[LacAssessmentGroupResponse]
    counts: LacAssessmentCountsResponse
    metrics: LacAssessmentMetricsResponse


class DashboardLitigationApprovalsComplianceProgress(ApiModel):
    overall_status: OverallStatus
    sections_complete: int
    total_sections: int
