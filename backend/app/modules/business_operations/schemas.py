"""API schemas for Business & Operations — camelCase, mirrors Capital & Ownership."""

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
    financials: LinkedPlaceholderResponse
    industry: LinkedPlaceholderResponse
    objects_of_the_issue: LinkedPlaceholderResponse
    assets: LinkedPlaceholderResponse
    compliance: LinkedPlaceholderResponse


class ComputationsResponse(ApiModel):
    products_count: int
    facilities_count: int
    employees_total: str
    largest_segment_label: str
    largest_segment_percentage: str
    product_concentration: str
    revenue_percentages_reconcile: bool
    customer_concentration_largest: str
    supplier_concentration_largest: str
    capacity_utilisation_latest: str
    dependencies_count: int
    certifications_count: int
    ip_records_count: int
    reconciled_checks_count: int
    variance_checks_count: int
    missing_information_checks_count: int


class BusinessOperationsWorkspaceResponse(ApiModel):
    id: str
    version: int
    schema_version: int
    last_saved_at: datetime | None = None
    payload: dict[str, Any]
    progress: WorkspaceProgressResponse
    computations: ComputationsResponse
    company_reference: CompanyReferenceResponse
    linked_references: LinkedWorkstreamReferencesResponse


class InitializeWorkspaceResponse(BusinessOperationsWorkspaceResponse):
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
    business_model_summary: str
    operating_segments_summary: str
    products_count: int
    facilities_count: int
    employees_total: str
    domestic_operations: str
    export_operations: str
    largest_segment_label: str
    largest_segment_percentage: str
    product_concentration: str
    customer_concentration: str
    supplier_concentration: str
    capacity_utilisation: str
    dependencies_count: int
    reconciled_checks_count: int
    variance_checks_count: int
    missing_information_checks_count: int = 0
    reconciliation_concerns: list[OverviewConcern]
    assessment_result: str
    assessment_result_label: str
    assessment_summary: str
    missing_required_responses: list[str] = Field(default_factory=list)
    missing_required_count: int = 0
    recommended_next_actions: list[OverviewNextAction]
    company_reference: CompanyReferenceResponse
    last_updated_at: datetime | None = None


class AssessmentCriterionResponse(ApiModel):
    id: str
    group: str
    label: str
    state: str
    reason: str
    explanation: str | None = None
    values_used: dict[str, Any] | None = None
    missing_fields: list[str] | None = None
    related_section: str | None = None
    deep_link: str | None = None


class AssessmentGroupCountsResponse(ApiModel):
    substantiated: int
    potential_inconsistency: int
    missing_information: int
    pending_linked_workstream: int
    pending_supporting_source: int
    pending_professional_confirmation: int
    not_applicable: int


class AssessmentGroupResponse(ApiModel):
    group: str
    label: str
    criteria: list[AssessmentCriterionResponse]
    counts: AssessmentGroupCountsResponse
    headline_state: str


class AssessmentMetricsResponse(ApiModel):
    products: int
    facilities: int
    sections_complete: int
    unanswered_confirmations: int
    unreconciled_checks: int
    largest_segment_label: str
    latest_headcount: str


class BusinessAssessmentResponse(ApiModel):
    result: str
    result_label: str
    summary: str
    criteria: list[AssessmentCriterionResponse]
    groups: list[AssessmentGroupResponse]
    counts: AssessmentGroupCountsResponse
    metrics: AssessmentMetricsResponse


class DashboardBusinessOperationsProgress(ApiModel):
    overall_status: OverallStatus
    sections_complete: int
    total_sections: int
