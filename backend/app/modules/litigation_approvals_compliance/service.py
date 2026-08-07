"""Litigation, Approvals & Compliance workspace service."""

from __future__ import annotations

import uuid
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.borrowings_assets_contracts_workspace import BorrowingsAssetsContractsWorkspace
from app.models.business_operations_workspace import BusinessOperationsWorkspace
from app.models.capital_ownership_workspace import CapitalOwnershipWorkspace
from app.models.financials_kpis_workspace import FinancialsKpisWorkspace
from app.models.group_entities_related_parties_workspace import GroupEntitiesRelatedPartiesWorkspace
from app.models.ipo_setup_eligibility_workspace import IpoSetupEligibilityWorkspace
from app.models.litigation_approvals_compliance_workspace import LitigationApprovalsComplianceWorkspace
from app.models.management_governance_workspace import ManagementGovernanceWorkspace
from app.models.objects_issue_workspace import ObjectsIssueWorkspace
from app.models.user import User
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.financials_kpis import decimal_math as fin_dm
from app.modules.financials_kpis.compute import _bs_amount
from app.modules.financials_kpis.periods import get_latest_period
from app.modules.group_entities_related_parties.entities import (
    count_active_entities,
    count_entities_by_badge,
)
from app.modules.litigation_approvals_compliance.assessment import assess_litigation_approvals_compliance
from app.modules.litigation_approvals_compliance.compute import compute_litigation_approvals_compliance_model
from app.modules.litigation_approvals_compliance.constants import (
    SECTION_IDS,
    SECTION_PAYLOAD_KEYS,
    LitigationApprovalsComplianceErrorCode,
)
from app.modules.litigation_approvals_compliance.defaults import clone_empty_payload
from app.modules.litigation_approvals_compliance.overview import build_overview_summary
from app.modules.litigation_approvals_compliance.progress import calculate_litigation_approvals_compliance_progress
from app.modules.litigation_approvals_compliance.schemas import (
    BorrowingsAssetsContractsReferenceResponse,
    BusinessOperationsReferenceResponse,
    CapitalOwnershipReferenceResponse,
    CompanyLegalReferenceResponse,
    ComputationsResponse,
    FinancialsKpisReferenceResponse,
    GroupEntitiesReferenceResponse,
    InitializeWorkspaceResponse,
    IpoSetupReferenceResponse,
    LacAssessmentResponse,
    LinkedWorkstreamReferencesResponse,
    LitigationApprovalsComplianceWorkspaceResponse,
    ManagementGovernanceReferenceResponse,
    ObjectsOfIssueReferenceResponse,
    OverviewSummaryResponse,
    SectionSaveResponse,
    WorkspaceProgressResponse,
)
from app.modules.litigation_approvals_compliance.validation import VALIDATORS, ValidationError
from app.modules.notifications.constants import LAC_SAVE_MESSAGE
from app.modules.notifications.schemas import SaveAcknowledgementResponse
from app.modules.notifications.service import (
    create_litigation_approvals_save_notification,
    to_notification_response,
)


def _now() -> datetime:
    return datetime.now(tz=UTC)


def get_workspace_for_user(
    db: Session,
    user_id: uuid.UUID,
) -> LitigationApprovalsComplianceWorkspace | None:
    return db.scalar(
        select(LitigationApprovalsComplianceWorkspace).where(
            LitigationApprovalsComplianceWorkspace.user_id == user_id,
        ),
    )


def get_company_reference(db: Session, user_id: uuid.UUID) -> CompanyLegalReferenceResponse:
    application = get_submitted_sme_application(db, user_id)
    draft_data = dict(application.draft_data or {})
    company = draft_data.get("companyIdentity") or {}
    legal_name = str(company.get("legalName") or "").strip()
    cin = str(company.get("cin") or "").strip()
    if not legal_name and not cin:
        return CompanyLegalReferenceResponse(available=False)
    return CompanyLegalReferenceResponse(
        available=True,
        legal_name=legal_name or None,
        cin=cin or None,
    )


def get_ipo_setup_reference(db: Session, user_id: uuid.UUID) -> IpoSetupReferenceResponse:
    workspace = db.scalar(
        select(IpoSetupEligibilityWorkspace).where(IpoSetupEligibilityWorkspace.user_id == user_id),
    )
    if workspace is None:
        return IpoSetupReferenceResponse(available=False)

    payload = workspace.payload or {}
    direction = payload.get("ipoDirection") or {}
    target_drhp = str(direction.get("tentativeFilingDate") or "").strip()
    offer_type = str(direction.get("proposedOfferType") or "").strip()
    if not target_drhp and not offer_type:
        return IpoSetupReferenceResponse(available=False)
    return IpoSetupReferenceResponse(
        available=True,
        target_drhp_filing_date=target_drhp or None,
        proposed_offer_type=offer_type or None,
    )


def get_capital_ownership_reference(
    db: Session,
    user_id: uuid.UUID,
) -> CapitalOwnershipReferenceResponse:
    workspace = db.scalar(
        select(CapitalOwnershipWorkspace).where(CapitalOwnershipWorkspace.user_id == user_id),
    )
    if workspace is None:
        return CapitalOwnershipReferenceResponse(available=False)

    payload = workspace.payload or {}
    promoters = [
        item for item in ((payload.get("promotersAndControl") or {}).get("promoters") or []) if isinstance(item, dict)
    ]
    if not promoters:
        return CapitalOwnershipReferenceResponse(available=False)

    shareholders = [
        item
        for item in ((payload.get("shareholdingPatternAndCapitalStructure") or {}).get("shareholders") or [])
        if isinstance(item, dict)
    ]
    pledged_reported = any(fin_dm.is_filled(item.get("sharesEncumbered")) for item in shareholders)
    return CapitalOwnershipReferenceResponse(
        available=True,
        promoter_count=len(promoters),
        pledged_shares_reported=pledged_reported,
    )


def get_management_governance_reference(
    db: Session,
    user_id: uuid.UUID,
) -> ManagementGovernanceReferenceResponse:
    workspace = db.scalar(
        select(ManagementGovernanceWorkspace).where(ManagementGovernanceWorkspace.user_id == user_id),
    )
    if workspace is None:
        return ManagementGovernanceReferenceResponse(available=False)

    payload = workspace.payload or {}
    directors = (payload.get("directorsProfilesAppointmentsAndEligibility") or {}).get("directors") or []
    kmp = (payload.get("kmpSeniorManagementAndOrganisationStructure") or {}).get("kmpSmpRecords") or []
    if not directors and not kmp:
        return ManagementGovernanceReferenceResponse(available=False)

    return ManagementGovernanceReferenceResponse(
        available=True,
        director_count=len(directors),
        kmp_count=len(kmp),
    )


def get_financials_kpis_reference(db: Session, user_id: uuid.UUID) -> FinancialsKpisReferenceResponse:
    workspace = db.scalar(
        select(FinancialsKpisWorkspace).where(FinancialsKpisWorkspace.user_id == user_id),
    )
    if workspace is None:
        return FinancialsKpisReferenceResponse(available=False)

    payload = workspace.payload or {}
    latest_period = get_latest_period(payload)
    if latest_period is None:
        return FinancialsKpisReferenceResponse(available=False)

    period_id = str(latest_period.get("id") or "")
    period_label = str(latest_period.get("label") or period_id)

    trade_payables = fin_dm.sum_decimals(
        [
            _bs_amount(payload, period_id, "tradePayablesMsme"),
            _bs_amount(payload, period_id, "otherTradePayables"),
        ]
    )
    provisions_total = fin_dm.sum_decimals(
        [
            _bs_amount(payload, period_id, "longTermProvisions"),
            _bs_amount(payload, period_id, "shortTermProvisions"),
        ]
    )

    other = payload.get("otherFinancialInformation") or {}
    contingent_values = [
        str(item.get("contingentAmount") or item.get("amountClaimed") or "")
        for item in (other.get("contingentLiabilities") or [])
        if isinstance(item, dict)
    ]
    contingent_total = fin_dm.sum_decimals(contingent_values)

    tax_dispute_values = [
        str(item.get("taxDisputes") or "")
        for item in (other.get("taxByPeriod") or [])
        if isinstance(item, dict)
    ]
    tax_disputes_total = fin_dm.sum_decimals(tax_dispute_values)

    if not any(
        [
            fin_dm.is_filled(contingent_total),
            fin_dm.is_filled(provisions_total),
            fin_dm.is_filled(tax_disputes_total),
            fin_dm.is_filled(trade_payables),
        ]
    ):
        return FinancialsKpisReferenceResponse(available=False)

    return FinancialsKpisReferenceResponse(
        available=True,
        latest_financial_period=period_label,
        contingent_liabilities_total=contingent_total or None,
        provisions_total=provisions_total or None,
        tax_disputes_total=tax_disputes_total or None,
        trade_payables_total=trade_payables or None,
    )


def get_business_operations_reference(
    db: Session,
    user_id: uuid.UUID,
) -> BusinessOperationsReferenceResponse:
    workspace = db.scalar(
        select(BusinessOperationsWorkspace).where(BusinessOperationsWorkspace.user_id == user_id),
    )
    if workspace is None:
        return BusinessOperationsReferenceResponse(available=False)

    payload = workspace.payload or {}
    facilities = (payload.get("facilitiesCapacityAndOperationalProcess") or {}).get("facilities") or []
    operational_context = any(
        isinstance(facility, dict) and facility.get("materialLicencesRequired") == "yes"
        for facility in facilities
    )
    if not facilities and not operational_context:
        return BusinessOperationsReferenceResponse(available=False)

    return BusinessOperationsReferenceResponse(
        available=True,
        facility_count=len(facilities),
        operational_approval_context_available=operational_context,
    )


def get_objects_of_issue_reference(
    db: Session,
    user_id: uuid.UUID,
) -> ObjectsOfIssueReferenceResponse:
    workspace = db.scalar(
        select(ObjectsIssueWorkspace).where(ObjectsIssueWorkspace.user_id == user_id),
    )
    if workspace is None:
        return ObjectsOfIssueReferenceResponse(available=False)

    payload = workspace.payload or {}
    capex_section = payload.get("capitalExpenditureFacilitiesAndExpansion") or {}
    capex_items = [item for item in (capex_section.get("capexItems") or []) if isinstance(item, dict)]
    if not capex_items:
        return ObjectsOfIssueReferenceResponse(available=False)

    approval_plan_linked = any(item.get("governmentApprovalsRequired") == "yes" for item in capex_items)
    return ObjectsOfIssueReferenceResponse(
        available=True,
        capex_project_count=len(capex_items),
        approval_plan_linked=approval_plan_linked,
    )


def get_group_entities_reference(db: Session, user_id: uuid.UUID) -> GroupEntitiesReferenceResponse:
    workspace = db.scalar(
        select(GroupEntitiesRelatedPartiesWorkspace).where(
            GroupEntitiesRelatedPartiesWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return GroupEntitiesReferenceResponse(available=False)

    payload = workspace.payload or {}
    entity_count = count_active_entities(payload)
    material_subsidiary_count = count_entities_by_badge(payload, "material-subsidiary")
    if entity_count == 0:
        return GroupEntitiesReferenceResponse(available=False)

    return GroupEntitiesReferenceResponse(
        available=True,
        entity_count=entity_count,
        material_subsidiary_count=material_subsidiary_count,
    )


def get_borrowings_assets_contracts_reference(
    db: Session,
    user_id: uuid.UUID,
) -> BorrowingsAssetsContractsReferenceResponse:
    workspace = db.scalar(
        select(BorrowingsAssetsContractsWorkspace).where(
            BorrowingsAssetsContractsWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return BorrowingsAssetsContractsReferenceResponse(available=False)

    payload = workspace.payload or {}
    facilities = (payload.get("financialIndebtednessAndFacilityMaster") or {}).get("facilities") or []
    covenant_section = payload.get("covenantsDefaultsWaiversAndLenderConsents") or {}
    default_events = covenant_section.get("defaultEvents") or []
    materiality_section = payload.get("contractMaterialityExpiryAndInspectionReadiness") or {}
    contract_disputes = [
        item
        for item in (materiality_section.get("breachDisputeReadiness") or [])
        if isinstance(item, dict)
    ]

    if not facilities and not default_events and not contract_disputes:
        return BorrowingsAssetsContractsReferenceResponse(available=False)

    return BorrowingsAssetsContractsReferenceResponse(
        available=True,
        facility_count=len(facilities),
        default_event_count=len(default_events),
        contract_dispute_count=len(contract_disputes),
    )


def get_linked_references(db: Session, user_id: uuid.UUID) -> LinkedWorkstreamReferencesResponse:
    return LinkedWorkstreamReferencesResponse(
        company=get_company_reference(db, user_id),
        ipo_setup=get_ipo_setup_reference(db, user_id),
        capital_ownership=get_capital_ownership_reference(db, user_id),
        management_governance=get_management_governance_reference(db, user_id),
        financials_kpis=get_financials_kpis_reference(db, user_id),
        business_operations=get_business_operations_reference(db, user_id),
        objects_of_issue=get_objects_of_issue_reference(db, user_id),
        group_entities=get_group_entities_reference(db, user_id),
        borrowings_assets_contracts=get_borrowings_assets_contracts_reference(db, user_id),
    )


def _linked_dict(linked: LinkedWorkstreamReferencesResponse) -> dict[str, Any]:
    return linked.model_dump(by_alias=True)


def _build_progress(payload: dict[str, Any]) -> WorkspaceProgressResponse:
    return WorkspaceProgressResponse.model_validate(
        calculate_litigation_approvals_compliance_progress(payload),
    )


def _build_computations(payload: dict[str, Any], linked_references: dict[str, Any]) -> ComputationsResponse:
    model = compute_litigation_approvals_compliance_model(payload, linked_references)
    return ComputationsResponse.model_validate(model)


def _build_workspace_response(
    db: Session,
    workspace: LitigationApprovalsComplianceWorkspace,
) -> LitigationApprovalsComplianceWorkspaceResponse:
    linked_references = get_linked_references(db, workspace.user_id)
    linked_dict = _linked_dict(linked_references)
    payload = workspace.payload
    return LitigationApprovalsComplianceWorkspaceResponse(
        id=str(workspace.id),
        version=workspace.version,
        schema_version=workspace.schema_version,
        last_saved_at=workspace.last_saved_at,
        payload=payload,
        progress=_build_progress(payload),
        computations=_build_computations(payload, linked_dict),
        linked_references=linked_references,
    )


def _insert_workspace(db: Session, user: User) -> LitigationApprovalsComplianceWorkspace | None:
    application = get_submitted_sme_application(db, user.id)
    payload = clone_empty_payload()
    now = _now()
    workspace = LitigationApprovalsComplianceWorkspace(
        user_id=user.id,
        source_onboarding_application_id=application.id,
        payload=payload,
        schema_version=payload["schemaVersion"],
        version=1,
        last_saved_at=now,
    )
    try:
        with db.begin_nested():
            db.add(workspace)
            db.flush()
    except IntegrityError:
        return None
    db.refresh(workspace)
    return workspace


def initialize_or_get_workspace(db: Session, user: User) -> InitializeWorkspaceResponse:
    existing = get_workspace_for_user(db, user.id)

    if existing is None:
        created = _insert_workspace(db, user)
        if created is not None:
            base = _build_workspace_response(db, created)
            return InitializeWorkspaceResponse(**base.model_dump(), created=True)
        existing = get_workspace_for_user(db, user.id)

    if existing is None:
        raise AppException(
            status_code=404,
            code=LitigationApprovalsComplianceErrorCode.WORKSPACE_NOT_FOUND,
            message="Litigation, Approvals & Compliance workspace could not be initialized.",
        )

    base = _build_workspace_response(db, existing)
    return InitializeWorkspaceResponse(**base.model_dump(), created=False)


def get_workspace(db: Session, user: User) -> LitigationApprovalsComplianceWorkspaceResponse:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=LitigationApprovalsComplianceErrorCode.WORKSPACE_NOT_FOUND,
            message="Litigation, Approvals & Compliance workspace has not been initialized.",
        )
    return _build_workspace_response(db, workspace)


def _require_workspace(db: Session, user: User) -> LitigationApprovalsComplianceWorkspace:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=LitigationApprovalsComplianceErrorCode.WORKSPACE_NOT_FOUND,
            message="Litigation, Approvals & Compliance workspace has not been initialized.",
        )
    return workspace


def _assert_version(
    db: Session,
    workspace: LitigationApprovalsComplianceWorkspace,
    expected_version: int,
) -> None:
    if workspace.version != expected_version:
        linked_references = get_linked_references(db, workspace.user_id)
        linked_dict = _linked_dict(linked_references)
        raise AppException(
            status_code=409,
            code=LitigationApprovalsComplianceErrorCode.WORKSPACE_VERSION_CONFLICT,
            message="The workspace was updated elsewhere. Refresh and try again.",
            details={
                "currentVersion": workspace.version,
                "payload": workspace.payload,
                "progress": calculate_litigation_approvals_compliance_progress(workspace.payload),
                "computations": _build_computations(workspace.payload, linked_dict).model_dump(
                    by_alias=True,
                ),
            },
        )


def save_section(
    db: Session,
    user: User,
    *,
    section_id: str,
    expected_version: int,
    data: dict[str, Any],
) -> SectionSaveResponse:
    if section_id not in SECTION_IDS:
        raise AppException(
            status_code=404,
            code=LitigationApprovalsComplianceErrorCode.UNKNOWN_SECTION,
            message=f"Unknown Litigation, Approvals & Compliance section: {section_id}",
        )

    workspace = _require_workspace(db, user)
    payload_key = SECTION_PAYLOAD_KEYS[section_id]
    next_payload = deepcopy(workspace.payload)
    section_data = deepcopy(data)

    validator = VALIDATORS[section_id]
    try:
        validator(section_data, next_payload)
    except ValidationError as exc:
        raise AppException(
            status_code=422,
            code=LitigationApprovalsComplianceErrorCode.VALIDATION_FAILED,
            message=f"{section_id} contains invalid values.",
            details={"fieldErrors": exc.field_errors},
        ) from exc

    next_payload[payload_key] = section_data
    _assert_version(db, workspace, expected_version)

    now = _now()
    workspace.payload = next_payload
    workspace.version = expected_version + 1
    workspace.last_saved_at = now
    db.flush()
    db.refresh(workspace)

    linked_references = get_linked_references(db, user.id)
    linked_dict = _linked_dict(linked_references)
    notification = create_litigation_approvals_save_notification(
        db,
        user=user,
        section_id=section_id,
        saved_at=now,
    )
    progress = _build_progress(workspace.payload)
    return SectionSaveResponse(
        version=workspace.version,
        last_saved_at=now,
        saved_section_id=section_id,
        saved_section={payload_key: section_data},
        progress=progress,
        payload=workspace.payload,
        computations=_build_computations(workspace.payload, linked_dict),
        acknowledgement=SaveAcknowledgementResponse(
            message=LAC_SAVE_MESSAGE,
            saved_at=now,
        ),
        notification=to_notification_response(notification),
    )


def get_overview(db: Session, user: User) -> OverviewSummaryResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, workspace.user_id)
    summary = build_overview_summary(workspace.payload, _linked_dict(linked_references))
    summary["lastUpdatedAt"] = workspace.last_saved_at
    return OverviewSummaryResponse.model_validate(summary)


def get_assessment(db: Session, user: User) -> LacAssessmentResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, workspace.user_id)
    assessment = assess_litigation_approvals_compliance(workspace.payload, _linked_dict(linked_references))
    return LacAssessmentResponse.model_validate(assessment)
