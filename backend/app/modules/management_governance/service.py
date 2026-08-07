"""Management & Governance workspace service — mirrors Financials & KPIs persistence."""

from __future__ import annotations

import uuid
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.business_operations_workspace import BusinessOperationsWorkspace
from app.models.capital_ownership_workspace import CapitalOwnershipWorkspace
from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.financials_kpis_workspace import FinancialsKpisWorkspace
from app.models.ipo_setup_eligibility_workspace import IpoSetupEligibilityWorkspace
from app.models.management_governance_workspace import ManagementGovernanceWorkspace
from app.models.user import User
from app.modules.capital_ownership.compute import ipo_setup_reference_from_payload
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.financials_kpis import decimal_math as dm
from app.modules.management_governance.assessment import assess_management_governance
from app.modules.management_governance.compute import compute_management_governance_model
from app.modules.management_governance.constants import (
    SECTION_IDS,
    SECTION_PAYLOAD_KEYS,
    ManagementGovernanceErrorCode,
)
from app.modules.management_governance.defaults import clone_empty_payload
from app.modules.management_governance.overview import build_overview_summary
from app.modules.management_governance.progress import calculate_management_governance_progress
from app.modules.management_governance.schemas import (
    BusinessOperationsReferenceResponse,
    CapitalOwnershipReferenceResponse,
    CompanyReferenceResponse,
    ComputationsResponse,
    FinancialsKpisReferenceResponse,
    GovernanceAssessmentResponse,
    InitializeWorkspaceResponse,
    IpoSetupReferenceResponse,
    LinkedPlaceholderResponse,
    LinkedWorkstreamReferencesResponse,
    ManagementGovernanceWorkspaceResponse,
    OverviewSummaryResponse,
    SectionSaveResponse,
    WorkspaceProgressResponse,
)
from app.modules.management_governance.validation import VALIDATORS, ValidationError
from app.modules.notifications.constants import MANAGEMENT_GOVERNANCE_SAVE_MESSAGE
from app.modules.notifications.schemas import SaveAcknowledgementResponse
from app.modules.notifications.service import (
    create_management_governance_save_notification,
    to_notification_response,
)

_EMPTY_LINKED_PLACEHOLDER = LinkedPlaceholderResponse(available=False)


def _now() -> datetime:
    return datetime.now(tz=UTC)


def get_workspace_for_user(
    db: Session,
    user_id: uuid.UUID,
) -> ManagementGovernanceWorkspace | None:
    return db.scalar(
        select(ManagementGovernanceWorkspace).where(
            ManagementGovernanceWorkspace.user_id == user_id,
        ),
    )


def _resolve_target_listing_segment(direction: dict[str, Any]) -> str:
    eligibility = str(direction.get("eligibilityProfile") or "").strip()
    if eligibility:
        return eligibility
    platform = str(direction.get("targetSmePlatform") or "").strip()
    if platform:
        return platform
    return ""


def get_ipo_setup_reference(db: Session, user_id: uuid.UUID) -> dict[str, Any]:
    workspace = db.scalar(
        select(IpoSetupEligibilityWorkspace).where(
            IpoSetupEligibilityWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        base = ipo_setup_reference_from_payload(None)
        base["targetListingSegment"] = None
        base["listingPlatform"] = None
        return base

    base = ipo_setup_reference_from_payload(workspace.payload)
    direction = (workspace.payload or {}).get("ipoDirection") or {}
    base["targetListingSegment"] = _resolve_target_listing_segment(direction) or None
    base["listingPlatform"] = str(direction.get("targetSmePlatform") or "").strip() or None
    return base


def get_company_reference(db: Session, user_id: uuid.UUID) -> CompanyReferenceResponse:
    workspace = db.scalar(
        select(CompanyIncorporationWorkspace).where(
            CompanyIncorporationWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return CompanyReferenceResponse(available=False)

    identity = (workspace.payload or {}).get("identity") or {}
    legal_name = str(identity.get("legalName") or "").strip() or None
    company_class = str(identity.get("companyClass") or "").strip() or None
    cin = str(identity.get("cin") or "").strip() or None
    company_status = str(identity.get("companyStatus") or identity.get("companyClass") or "").strip() or None
    incorporation_date = str(identity.get("incorporationDate") or "").strip() or None

    if not any([legal_name, company_class, cin]):
        return CompanyReferenceResponse(available=False)

    return CompanyReferenceResponse(
        available=True,
        legal_name=legal_name,
        company_class=company_class,
        cin=cin,
        company_status=company_status,
        incorporation_date=incorporation_date,
    )


def get_capital_ownership_reference(
    db: Session,
    user_id: uuid.UUID,
) -> CapitalOwnershipReferenceResponse:
    workspace = db.scalar(
        select(CapitalOwnershipWorkspace).where(
            CapitalOwnershipWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return CapitalOwnershipReferenceResponse(available=False)

    payload = workspace.payload or {}
    structure = payload.get("currentCapitalStructure") or {}
    paid_up = dm.to_decimal_string(structure.get("paidUpEquityShareCapital"))
    promoters = payload.get("promotersAndControl") or {}
    promoter_identity_available = bool(
        (promoters.get("promoterIndividuals") or [])
        or (promoters.get("promoterEntities") or [])
    )

    if not dm.is_filled(paid_up) and not promoter_identity_available:
        return CapitalOwnershipReferenceResponse(available=False)

    return CapitalOwnershipReferenceResponse(
        available=True,
        paid_up_equity_capital=paid_up or None,
        promoter_identity_available=promoter_identity_available,
    )


def get_financials_kpis_reference(
    db: Session,
    user_id: uuid.UUID,
) -> FinancialsKpisReferenceResponse:
    workspace = db.scalar(
        select(FinancialsKpisWorkspace).where(
            FinancialsKpisWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return FinancialsKpisReferenceResponse(available=False)

    payload = workspace.payload or {}
    other = payload.get("otherFinancialInformation") or {}
    rpt_rows = other.get("relatedPartyTransactions") or []
    rpt_summary_available = len(rpt_rows) > 0

    net_worth = ""
    ratios = payload.get("ratiosCapitalisationAndIssuePriceMetrics") or {}
    for row in ratios.get("capitalisationMetrics") or []:
        if isinstance(row, dict) and dm.is_filled(row.get("netWorth")):
            net_worth = dm.to_decimal_string(row.get("netWorth"))
            break

    if not dm.is_filled(net_worth) and not rpt_summary_available:
        return FinancialsKpisReferenceResponse(available=False)

    return FinancialsKpisReferenceResponse(
        available=True,
        net_worth=net_worth or None,
        rpt_summary_available=rpt_summary_available,
    )


def get_business_operations_reference(
    db: Session,
    user_id: uuid.UUID,
) -> BusinessOperationsReferenceResponse:
    workspace = db.scalar(
        select(BusinessOperationsWorkspace).where(
            BusinessOperationsWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return BusinessOperationsReferenceResponse(available=False)

    products_section = (workspace.payload or {}).get("productsServicesAndRevenueMix") or {}
    has_products = bool(products_section.get("productsServices"))
    has_revenue = bool(products_section.get("revenueMixRows"))
    business_unit_context_available = has_products or has_revenue

    if not business_unit_context_available:
        return BusinessOperationsReferenceResponse(available=False)

    return BusinessOperationsReferenceResponse(
        available=True,
        business_unit_context_available=True,
    )


def get_linked_references(db: Session, user_id: uuid.UUID) -> LinkedWorkstreamReferencesResponse:
    ipo_reference = get_ipo_setup_reference(db, user_id)
    return LinkedWorkstreamReferencesResponse(
        company=get_company_reference(db, user_id),
        ipo_setup=IpoSetupReferenceResponse.model_validate(ipo_reference),
        capital_ownership=get_capital_ownership_reference(db, user_id),
        financials_kpis=get_financials_kpis_reference(db, user_id),
        business_operations=get_business_operations_reference(db, user_id),
        group_entities=_EMPTY_LINKED_PLACEHOLDER,
        litigation=_EMPTY_LINKED_PLACEHOLDER,
    )


def _linked_dict(linked: LinkedWorkstreamReferencesResponse) -> dict[str, Any]:
    return linked.model_dump(by_alias=True)


def _build_progress(payload: dict[str, Any]) -> WorkspaceProgressResponse:
    return WorkspaceProgressResponse.model_validate(
        calculate_management_governance_progress(payload),
    )


def _build_computations(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> ComputationsResponse:
    model = compute_management_governance_model(payload, linked_references)
    board_counts = model.get("boardCounts") or {}
    continuity = model.get("continuity") or {}
    applicability = model.get("applicability") or {}
    return ComputationsResponse(
        board_size=model.get("boardSize", 0),
        proposed_board_size=model.get("proposedBoardSize", 0),
        vacant_seats=model.get("vacantSeats", 0),
        pending_appointments=model.get("pendingAppointments", 0),
        kmp_count=model.get("kmpCount", 0),
        smp_count=model.get("smpCount", 0),
        committees_ready_count=model.get("committeesReadyCount", 0),
        committees_required_count=model.get("committeesRequiredCount", 0),
        policies_adopted_count=model.get("policiesAdoptedCount", 0),
        policies_required_count=model.get("policiesRequiredCount", 0),
        potential_directorship_limit_flags=model.get("potentialDirectorshipLimitFlags", 0),
        listing_segment=applicability.get("listingSegment", "unknown"),
        director_count=board_counts.get("total", 0),
        current_director_count=board_counts.get("current", 0),
        independent_director_count=board_counts.get("independent", 0),
        critical_role_vacancies=continuity.get("criticalRoleVacancies", 0),
    )


def _build_workspace_response(
    db: Session,
    workspace: ManagementGovernanceWorkspace,
) -> ManagementGovernanceWorkspaceResponse:
    linked_references = get_linked_references(db, workspace.user_id)
    linked_dict = _linked_dict(linked_references)
    payload = workspace.payload
    return ManagementGovernanceWorkspaceResponse(
        id=str(workspace.id),
        version=workspace.version,
        schema_version=workspace.schema_version,
        last_saved_at=workspace.last_saved_at,
        payload=payload,
        progress=_build_progress(payload),
        computations=_build_computations(payload, linked_dict),
        ipo_setup_reference=linked_references.ipo_setup,
        company_reference=linked_references.company,
        linked_references=linked_references,
    )


def _insert_workspace(db: Session, user: User) -> ManagementGovernanceWorkspace | None:
    application = get_submitted_sme_application(db, user.id)
    payload = clone_empty_payload()
    now = _now()
    workspace = ManagementGovernanceWorkspace(
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
            code=ManagementGovernanceErrorCode.WORKSPACE_NOT_FOUND,
            message="Management & Governance workspace could not be initialized.",
        )

    base = _build_workspace_response(db, existing)
    return InitializeWorkspaceResponse(**base.model_dump(), created=False)


def get_workspace(db: Session, user: User) -> ManagementGovernanceWorkspaceResponse:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=ManagementGovernanceErrorCode.WORKSPACE_NOT_FOUND,
            message="Management & Governance workspace has not been initialized.",
        )
    return _build_workspace_response(db, workspace)


def _require_workspace(db: Session, user: User) -> ManagementGovernanceWorkspace:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=ManagementGovernanceErrorCode.WORKSPACE_NOT_FOUND,
            message="Management & Governance workspace has not been initialized.",
        )
    return workspace


def _assert_version(
    db: Session,
    workspace: ManagementGovernanceWorkspace,
    expected_version: int,
) -> None:
    if workspace.version != expected_version:
        linked_references = get_linked_references(db, workspace.user_id)
        linked_dict = _linked_dict(linked_references)
        raise AppException(
            status_code=409,
            code=ManagementGovernanceErrorCode.WORKSPACE_VERSION_CONFLICT,
            message="The workspace was updated elsewhere. Refresh and try again.",
            details={
                "currentVersion": workspace.version,
                "payload": workspace.payload,
                "progress": calculate_management_governance_progress(workspace.payload),
                "computations": _build_computations(
                    workspace.payload,
                    linked_dict,
                ).model_dump(by_alias=True),
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
            code=ManagementGovernanceErrorCode.UNKNOWN_SECTION,
            message=f"Unknown Management & Governance section: {section_id}",
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
            code=ManagementGovernanceErrorCode.VALIDATION_FAILED,
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
    notification = create_management_governance_save_notification(
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
            message=MANAGEMENT_GOVERNANCE_SAVE_MESSAGE,
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


def get_assessment(db: Session, user: User) -> GovernanceAssessmentResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, workspace.user_id)
    assessment = assess_management_governance(
        workspace.payload,
        _linked_dict(linked_references),
    )
    return GovernanceAssessmentResponse.model_validate(assessment)
