"""Intermediaries & Filing workspace service."""

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
from app.models.industry_market_workspace import IndustryMarketWorkspace
from app.models.intermediaries_filing_workspace import IntermediariesFilingWorkspace
from app.models.ipo_setup_eligibility_workspace import IpoSetupEligibilityWorkspace
from app.models.litigation_approvals_compliance_workspace import LitigationApprovalsComplianceWorkspace
from app.models.management_governance_workspace import ManagementGovernanceWorkspace
from app.models.objects_issue_workspace import ObjectsIssueWorkspace
from app.models.user import User
from app.modules.capital_ownership import decimal_math as co_dm
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.financials_kpis.periods import get_latest_period
from app.modules.group_entities_related_parties.entities import count_active_entities, count_entities_by_badge
from app.modules.intermediaries_filing.assessment import assess_intermediaries_filing
from app.modules.intermediaries_filing.compute import compute_intermediaries_filing_model
from app.modules.intermediaries_filing.constants import (
    SECTION_IDS,
    SECTION_PAYLOAD_KEYS,
    IntermediariesFilingErrorCode,
)
from app.modules.intermediaries_filing.defaults import clone_empty_payload
from app.modules.intermediaries_filing.overview import build_overview_summary
from app.modules.intermediaries_filing.progress import calculate_intermediaries_filing_progress
from app.modules.intermediaries_filing.schemas import (
    BorrowingsAssetsContractsReferenceResponse,
    BusinessOperationsReferenceResponse,
    CapitalOwnershipReferenceResponse,
    CompanyReferenceResponse,
    ComputationsResponse,
    FinancialsKpisReferenceResponse,
    GroupEntitiesReferenceResponse,
    IfAssessmentResponse,
    IndustryMarketReferenceResponse,
    InitializeWorkspaceResponse,
    IntermediariesFilingWorkspaceResponse,
    IpoSetupReferenceResponse,
    LinkedWorkstreamReferencesResponse,
    LitigationApprovalsComplianceReferenceResponse,
    ManagementGovernanceReferenceResponse,
    ObjectsOfIssueReferenceResponse,
    OverviewSummaryResponse,
    SectionSaveResponse,
    WorkspaceProgressResponse,
)
from app.modules.intermediaries_filing.validation import VALIDATORS, ValidationError
from app.modules.notifications.constants import IF_SAVE_MESSAGE
from app.modules.notifications.schemas import SaveAcknowledgementResponse
from app.modules.notifications.service import (
    create_intermediaries_filing_save_notification,
    to_notification_response,
)
from app.modules.objects_issue.compute import compute_objects_of_issue_model


def _now() -> datetime:
    return datetime.now(tz=UTC)


def _dec(value: Any) -> str | None:
    text = co_dm.to_decimal_string(value) if value is not None else ""
    return text or None


def get_workspace_for_user(
    db: Session,
    user_id: uuid.UUID,
) -> IntermediariesFilingWorkspace | None:
    return db.scalar(
        select(IntermediariesFilingWorkspace).where(
            IntermediariesFilingWorkspace.user_id == user_id,
        ),
    )


def get_company_reference(db: Session, user_id: uuid.UUID) -> CompanyReferenceResponse:
    application = get_submitted_sme_application(db, user_id)
    draft_data = dict(application.draft_data or {})
    company = draft_data.get("companyIdentity") or {}
    office = company.get("registeredOffice") or {}
    legal_name = str(company.get("legalName") or "").strip()
    cin = str(company.get("cin") or "").strip()
    if not legal_name and not cin:
        return CompanyReferenceResponse(available=False)
    address_parts = [
        str(office.get("addressLine1") or "").strip(),
        str(office.get("city") or "").strip(),
        str(office.get("state") or "").strip(),
    ]
    return CompanyReferenceResponse(
        available=True,
        legal_name=legal_name or None,
        cin=cin or None,
        registered_office=", ".join(part for part in address_parts if part) or None,
        public_private_status=str(company.get("companyClass") or "").strip() or None,
    )


def get_ipo_setup_reference(db: Session, user_id: uuid.UUID) -> IpoSetupReferenceResponse:
    workspace = db.scalar(
        select(IpoSetupEligibilityWorkspace).where(IpoSetupEligibilityWorkspace.user_id == user_id),
    )
    if workspace is None:
        return IpoSetupReferenceResponse(available=False)

    payload = workspace.payload or {}
    direction = payload.get("ipoDirection") or {}
    offer = payload.get("offerStructure") or {}
    fresh_issue = _dec(offer.get("proposedFreshIssueAmount"))
    ofs = _dec(offer.get("proposedOfsAmount"))
    total_offer = _dec(
        co_dm.sum_decimals([fresh_issue or "", ofs or ""]) if fresh_issue or ofs else None
    )
    if not any(
        [
            direction.get("targetSmePlatform"),
            direction.get("proposedOfferType"),
            fresh_issue,
            ofs,
        ]
    ):
        return IpoSetupReferenceResponse(available=False)

    return IpoSetupReferenceResponse(
        available=True,
        target_sme_platform=str(direction.get("targetSmePlatform") or "") or None,
        issue_method=str(direction.get("proposedOfferType") or "") or None,
        fresh_issue=fresh_issue,
        ofs=ofs,
        total_offer=total_offer,
        face_value=_dec(offer.get("faceValuePerEquityShare")),
        proposed_final_issue_price=_dec(offer.get("proposedIssuePrice")),
        target_filing_date=str(direction.get("tentativeFilingDate") or "") or None,
        issue_stage=str(direction.get("preparationStage") or "") or None,
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
    pre_post = payload.get("prePostIssueOwnership") or {}
    share_capital = payload.get("shareholdingPatternAndCapitalStructure") or {}
    pre_issue_shares = _dec(pre_post.get("preIssueEquityShares"))
    post_issue_shares = _dec(pre_post.get("postIssueEquityShares"))
    fresh_issue_shares = _dec(pre_post.get("freshIssueShares"))
    ofs_shares = _dec(pre_post.get("ofsShares"))
    promoter = payload.get("promoterContributionLockInAndEncumbrances") or {}
    if not any([pre_issue_shares, post_issue_shares, fresh_issue_shares, ofs_shares]):
        return CapitalOwnershipReferenceResponse(available=False)

    selling = share_capital.get("sellingShareholders") or []
    return CapitalOwnershipReferenceResponse(
        available=True,
        pre_issue_shares=pre_issue_shares,
        post_issue_shares=post_issue_shares,
        fresh_issue_shares=fresh_issue_shares,
        ofs_shares=ofs_shares,
        promoter_contribution=_dec(promoter.get("minimumPromoterContributionAmount")),
        selling_shareholders=str(len(selling)) if selling else None,
    )


def get_objects_of_issue_reference(db: Session, user_id: uuid.UUID) -> ObjectsOfIssueReferenceResponse:
    workspace = db.scalar(
        select(ObjectsIssueWorkspace).where(ObjectsIssueWorkspace.user_id == user_id),
    )
    if workspace is None:
        return ObjectsOfIssueReferenceResponse(available=False)

    model = compute_objects_of_issue_model(workspace.payload or {})
    total = model.get("totalDeploymentScheduled")
    if not total:
        return ObjectsOfIssueReferenceResponse(available=False)

    return ObjectsOfIssueReferenceResponse(
        available=True,
        total_objects_amount=str(total),
        capex_amount=str(model.get("totalCapexCost") or "") or None,
        working_capital_amount=None,
        debt_repayment_amount=str(model.get("totalBorrowingRepayment") or "") or None,
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

    restated = payload.get("restatedFinancialInformation") or {}
    kpi = payload.get("keyPerformanceIndicators") or {}
    return FinancialsKpisReferenceResponse(
        available=True,
        latest_financial_period=str(latest_period.get("label") or latest_period.get("id") or ""),
        restated_financials_ready=restated.get("restatedFinancialsPrepared") == "yes",
        kpi_readiness=str(kpi.get("kpiReadinessStatus") or "") or None,
        auditor_certificate_context=str(restated.get("auditorCertificateContext") or "") or None,
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

    cfo = next((item for item in kmp if isinstance(item, dict) and item.get("roleCategory") == "cfo"), None)
    cs = next(
        (item for item in kmp if isinstance(item, dict) and item.get("roleCategory") == "company_secretary"),
        None,
    )
    return ManagementGovernanceReferenceResponse(
        available=True,
        director_count=len(directors),
        kmp_count=len(kmp),
        cfo_name=str((cfo or {}).get("fullName") or "") or None,
        company_secretary_name=str((cs or {}).get("fullName") or "") or None,
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
        operational_dd_context_available=operational_context,
    )


def get_industry_market_reference(db: Session, user_id: uuid.UUID) -> IndustryMarketReferenceResponse:
    workspace = db.scalar(
        select(IndustryMarketWorkspace).where(IndustryMarketWorkspace.user_id == user_id),
    )
    if workspace is None:
        return IndustryMarketReferenceResponse(available=False)

    payload = workspace.payload or {}
    report = payload.get("industryResearchReportsAndMarketContext") or {}
    provider = str(report.get("researchProviderName") or report.get("provider") or "").strip()
    ready = report.get("industryReportAvailable") == "yes" or bool(report.get("reports"))
    if not provider and not ready:
        return IndustryMarketReferenceResponse(available=False)

    return IndustryMarketReferenceResponse(
        available=True,
        industry_report_ready=ready,
        research_provider=provider or None,
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
    materiality = payload.get("contractMaterialityExpiryAndInspectionReadiness") or {}
    contracts = (payload.get("materialContractsAndArrangementsMaster") or {}).get("contracts") or []
    inspection_candidates = materiality.get("inspectionCandidates") or []
    consents = (payload.get("covenantsDefaultsWaiversAndLenderConsents") or {}).get("lenderConsents") or []

    if not facilities and not contracts and not inspection_candidates:
        return BorrowingsAssetsContractsReferenceResponse(available=False)

    return BorrowingsAssetsContractsReferenceResponse(
        available=True,
        material_contract_count=len(contracts),
        inspection_candidate_count=len(inspection_candidates),
        financing_consent_count=len(consents),
    )


def get_litigation_approvals_compliance_reference(
    db: Session,
    user_id: uuid.UUID,
) -> LitigationApprovalsComplianceReferenceResponse:
    workspace = db.scalar(
        select(LitigationApprovalsComplianceWorkspace).where(
            LitigationApprovalsComplianceWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return LitigationApprovalsComplianceReferenceResponse(available=False)

    payload = workspace.payload or {}
    matters = (payload.get("litigationAndProceedingsMaster") or {}).get("matters") or []
    developments = (
        (payload.get("materialCreditorsPenaltiesAndMaterialDevelopments") or {}).get("materialDevelopments")
        or []
    )
    approvals = (
        (payload.get("governmentRegulatoryAndBusinessApprovalsMaster") or {}).get("approvals") or []
    )
    open_matters = sum(
        1
        for matter in matters
        if isinstance(matter, dict)
        and (matter.get("statusOutcome") or {}).get("outcomeStatus") in {"", "pending", "appeal-pending"}
    )
    approval_gaps = sum(
        1
        for approval in approvals
        if isinstance(approval, dict)
        and (approval.get("statusRenewal") or {}).get("status")
        in {"required-not-applied", "expired-renewal-not-applied", "renewal-pending"}
    )
    legal_dd = (
        (payload.get("legalUniverseMaterialityPolicyAndPartyMapping") or {}).get("legalDdSnapshot") or {}
    )
    if not matters and not developments and not approvals:
        return LitigationApprovalsComplianceReferenceResponse(available=False)

    return LitigationApprovalsComplianceReferenceResponse(
        available=True,
        open_matter_count=open_matters,
        material_development_count=len(developments),
        approval_gap_count=approval_gaps,
        filing_cut_off_updated=bool(legal_dd.get("legalDdAsOfDate")),
    )


def get_linked_references(db: Session, user_id: uuid.UUID) -> LinkedWorkstreamReferencesResponse:
    return LinkedWorkstreamReferencesResponse(
        company=get_company_reference(db, user_id),
        ipo_setup=get_ipo_setup_reference(db, user_id),
        capital_ownership=get_capital_ownership_reference(db, user_id),
        objects_of_issue=get_objects_of_issue_reference(db, user_id),
        financials_kpis=get_financials_kpis_reference(db, user_id),
        management_governance=get_management_governance_reference(db, user_id),
        business_operations=get_business_operations_reference(db, user_id),
        industry_market=get_industry_market_reference(db, user_id),
        group_entities=get_group_entities_reference(db, user_id),
        borrowings_assets_contracts=get_borrowings_assets_contracts_reference(db, user_id),
        litigation_approvals_compliance=get_litigation_approvals_compliance_reference(db, user_id),
    )


def _linked_dict(linked: LinkedWorkstreamReferencesResponse) -> dict[str, Any]:
    return linked.model_dump(by_alias=True)


def _build_progress(payload: dict[str, Any]) -> WorkspaceProgressResponse:
    return WorkspaceProgressResponse.model_validate(calculate_intermediaries_filing_progress(payload))


def _build_computations(payload: dict[str, Any], linked_references: dict[str, Any]) -> ComputationsResponse:
    model = compute_intermediaries_filing_model(payload, linked_references)
    return ComputationsResponse.model_validate(model)


def _build_workspace_response(
    db: Session,
    workspace: IntermediariesFilingWorkspace,
) -> IntermediariesFilingWorkspaceResponse:
    linked_references = get_linked_references(db, workspace.user_id)
    linked_dict = _linked_dict(linked_references)
    payload = workspace.payload
    return IntermediariesFilingWorkspaceResponse(
        id=str(workspace.id),
        version=workspace.version,
        schema_version=workspace.schema_version,
        last_saved_at=workspace.last_saved_at,
        payload=payload,
        progress=_build_progress(payload),
        computations=_build_computations(payload, linked_dict),
        linked_references=linked_references,
    )


def _insert_workspace(db: Session, user: User) -> IntermediariesFilingWorkspace | None:
    application = get_submitted_sme_application(db, user.id)
    payload = clone_empty_payload()
    now = _now()
    workspace = IntermediariesFilingWorkspace(
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
            code=IntermediariesFilingErrorCode.WORKSPACE_NOT_FOUND,
            message="Intermediaries & Filing workspace could not be initialized.",
        )

    base = _build_workspace_response(db, existing)
    return InitializeWorkspaceResponse(**base.model_dump(), created=False)


def get_workspace(db: Session, user: User) -> IntermediariesFilingWorkspaceResponse:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=IntermediariesFilingErrorCode.WORKSPACE_NOT_FOUND,
            message="Intermediaries & Filing workspace has not been initialized.",
        )
    return _build_workspace_response(db, workspace)


def _require_workspace(db: Session, user: User) -> IntermediariesFilingWorkspace:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=IntermediariesFilingErrorCode.WORKSPACE_NOT_FOUND,
            message="Intermediaries & Filing workspace has not been initialized.",
        )
    return workspace


def _assert_version(
    db: Session,
    workspace: IntermediariesFilingWorkspace,
    expected_version: int,
) -> None:
    if workspace.version != expected_version:
        linked_references = get_linked_references(db, workspace.user_id)
        linked_dict = _linked_dict(linked_references)
        raise AppException(
            status_code=409,
            code=IntermediariesFilingErrorCode.WORKSPACE_VERSION_CONFLICT,
            message="The workspace was updated elsewhere. Refresh and try again.",
            details={
                "currentVersion": workspace.version,
                "payload": workspace.payload,
                "progress": calculate_intermediaries_filing_progress(workspace.payload),
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
            code=IntermediariesFilingErrorCode.UNKNOWN_SECTION,
            message=f"Unknown Intermediaries & Filing section: {section_id}",
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
            code=IntermediariesFilingErrorCode.VALIDATION_FAILED,
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
    notification = create_intermediaries_filing_save_notification(
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
            message=IF_SAVE_MESSAGE,
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


def get_filing_readiness(db: Session, user: User) -> IfAssessmentResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, workspace.user_id)
    assessment = assess_intermediaries_filing(workspace.payload, _linked_dict(linked_references))
    return IfAssessmentResponse.model_validate(assessment)
