"""API schemas for Group Entities & Related Parties — camelCase."""

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
    cin: str | None = None


class LinkedPersonReferenceResponse(ApiModel):
    id: str
    name: str
    role: str
    source: str


class CapitalOwnershipReferenceResponse(ApiModel):
    available: bool = False
    promoter_count: int = 0
    promoters: list[LinkedPersonReferenceResponse] = Field(default_factory=list)


class ManagementGovernanceReferenceResponse(ApiModel):
    available: bool = False
    director_count: int = 0
    kmp_count: int = 0
    directors: list[LinkedPersonReferenceResponse] = Field(default_factory=list)
    kmp: list[LinkedPersonReferenceResponse] = Field(default_factory=list)
    rpt_oversight_available: bool = False


class FinancialsKpisReferenceResponse(ApiModel):
    available: bool = False
    latest_financial_period: str | None = None
    revenue_from_operations: str | None = None
    total_purchases: str | None = None
    total_receivables: str | None = None
    total_payables: str | None = None
    rpt_revenue_total: str | None = None
    rpt_purchases_total: str | None = None
    rpt_receivables_total: str | None = None
    rpt_payables_total: str | None = None


class BusinessOperationsReferenceResponse(ApiModel):
    available: bool = False
    product_service_context_available: bool = False
    supplier_customer_context_available: bool = False


class ObjectsOfIssueReferenceResponse(ApiModel):
    available: bool = False
    subsidiary_investment_proposed: bool = False
    related_party_debt_repayment_proposed: bool = False


class LinkedWorkstreamReferencesResponse(ApiModel):
    company: CompanyReferenceResponse
    capital_ownership: CapitalOwnershipReferenceResponse
    management_governance: ManagementGovernanceReferenceResponse
    financials_kpis: FinancialsKpisReferenceResponse
    business_operations: BusinessOperationsReferenceResponse
    objects_of_issue: ObjectsOfIssueReferenceResponse


class RptSummaryResponse(ApiModel):
    total_by_party: dict[str, str] = Field(default_factory=dict)
    total_by_type: dict[str, str] = Field(default_factory=dict)
    total_by_financial_year: dict[str, str] = Field(default_factory=dict)
    rpt_sales: str = ""
    rpt_purchases: str = ""
    rpt_loans_given: str = ""
    rpt_loans_received: str = ""
    guarantees: str = ""
    closing_receivables: str = ""
    closing_payables: str = ""
    closing_loans: str = ""
    latest_financial_year_total: str = ""
    rpt_revenue_percent: str | None = None
    rpt_purchases_percent: str | None = None
    rpt_receivables_percent: str | None = None
    rpt_payables_percent: str | None = None
    financials_revenue_difference: str | None = None
    financials_purchases_difference: str | None = None


class ComputationsResponse(ApiModel):
    entity_count: int = 0
    subsidiary_count: int = 0
    step_down_subsidiary_count: int = 0
    associate_count: int = 0
    jv_count: int = 0
    promoter_group_entity_count: int = 0
    icdr_group_company_count: int = 0
    icdr_pending_board_count: int = 0
    related_party_count: int = 0
    historical_related_party_count: int = 0
    ownership_relationship_count: int = 0
    rpt_transaction_count: int = 0
    common_pursuit_entity_count: int = 0
    dependency_count: int = 0
    negative_net_worth_count: int = 0
    loss_making_count: int = 0
    auditor_qualified_count: int = 0
    incomplete_information_count: int = 0
    ibc_concern_count: int = 0
    pending_entity_information_count: int = 0
    rpt_summary: RptSummaryResponse = Field(default_factory=RptSummaryResponse)
    ownership_chain_summary: list[str] = Field(default_factory=list)


class GroupEntitiesWorkspaceResponse(ApiModel):
    id: str
    version: int
    schema_version: int
    last_saved_at: datetime | None = None
    payload: dict[str, Any]
    progress: WorkspaceProgressResponse
    computations: ComputationsResponse
    company_reference: CompanyReferenceResponse
    linked_references: LinkedWorkstreamReferencesResponse


class InitializeWorkspaceResponse(GroupEntitiesWorkspaceResponse):
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
    entity_count: int = 0
    subsidiary_count: int = 0
    step_down_subsidiary_count: int = 0
    associate_count: int = 0
    jv_count: int = 0
    promoter_group_entity_count: int = 0
    icdr_group_company_count: int = 0
    icdr_pending_board_count: int = 0
    related_party_count: int = 0
    historical_related_party_count: int = 0
    latest_financial_year_rpt_total: str = ""
    rpt_revenue_percent: str | None = None
    rpt_purchases_percent: str | None = None
    related_party_receivables: str = ""
    related_party_payables: str = ""
    related_party_loans: str = ""
    guarantees_commitments: str = ""
    common_pursuit_entity_count: int = 0
    material_dependency_count: int = 0
    potential_conflict_items: int = 0
    group_companies_with_complete_financial_info: int = 0
    negative_net_worth_count: int = 0
    auditor_qualified_count: int = 0
    ibc_concern_count: int = 0
    pending_entity_information_count: int = 0
    rpt_financials_reconciliation_status: str = ""
    materiality_policy_status: str = ""
    assessment_concerns: int = 0
    professional_review_items: int = 0
    assessment_result: str = ""
    assessment_result_label: str = ""
    assessment_summary: str = ""
    recommended_next_actions: list[OverviewNextAction] = Field(default_factory=list)
    last_updated_at: datetime | None = None
    latest_financial_period: str | None = None
    currency: str = "INR"
    amount_unit: str = "lakhs"


class GroupAssessmentCriterionResponse(ApiModel):
    id: str
    group: str
    label: str
    state: str
    reason: str
    related_section: str


class GroupAssessmentGroupResponse(ApiModel):
    group: str
    label: str
    headline_state: str
    criteria: list[GroupAssessmentCriterionResponse]


class GroupAssessmentCountsResponse(ApiModel):
    reconciled: int
    potential_concern: int
    missing_information: int
    unresolved_relationship: int
    classification_review_required: int
    financial_reconciliation_pending: int
    pending_entity_information: int
    pending_linked_workstream: int
    pending_board_determination: int
    pending_professional_confirmation: int
    not_applicable: int


class GroupAssessmentMetricsResponse(ApiModel):
    entity_count: int
    sections_complete: int
    unanswered_confirmations: int
    rpt_transaction_count: int
    pending_board_determinations: int
    potential_concerns: int


class GroupAssessmentResponse(ApiModel):
    result: str
    result_label: str
    summary: str
    criteria: list[GroupAssessmentCriterionResponse]
    groups: list[GroupAssessmentGroupResponse]
    counts: GroupAssessmentCountsResponse
    metrics: GroupAssessmentMetricsResponse


class DashboardGroupEntitiesProgress(ApiModel):
    overall_status: OverallStatus
    sections_complete: int
    total_sections: int
