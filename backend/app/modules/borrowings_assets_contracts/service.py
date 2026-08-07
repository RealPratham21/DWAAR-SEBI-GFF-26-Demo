"""Borrowings, Assets & Contracts workspace service."""

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
from app.models.management_governance_workspace import ManagementGovernanceWorkspace
from app.models.objects_issue_workspace import ObjectsIssueWorkspace
from app.models.user import User
from app.modules.borrowings_assets_contracts.assessment import assess_borrowings_assets_contracts
from app.modules.borrowings_assets_contracts.compute import compute_borrowings_assets_contracts_model
from app.modules.borrowings_assets_contracts.constants import (
    SECTION_IDS,
    SECTION_PAYLOAD_KEYS,
    BorrowingsAssetsErrorCode,
)
from app.modules.borrowings_assets_contracts.defaults import clone_empty_payload
from app.modules.borrowings_assets_contracts.overview import build_overview_summary
from app.modules.borrowings_assets_contracts.progress import calculate_borrowings_assets_contracts_progress
from app.modules.borrowings_assets_contracts.schemas import (
    BacAssessmentResponse,
    BorrowingsAssetsContractsWorkspaceResponse,
    BusinessOperationsReferenceResponse,
    CapitalOwnershipReferenceResponse,
    ComputationsResponse,
    FinancialsKpisReferenceResponse,
    GroupEntitiesReferenceResponse,
    InitializeWorkspaceResponse,
    LinkedWorkstreamPlaceholderResponse,
    LinkedWorkstreamReferencesResponse,
    ManagementGovernanceReferenceResponse,
    ObjectsOfIssueReferenceResponse,
    OverviewSummaryResponse,
    SectionSaveResponse,
    WorkspaceProgressResponse,
)
from app.modules.borrowings_assets_contracts.validation import VALIDATORS, ValidationError
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.financials_kpis import decimal_math as fin_dm
from app.modules.financials_kpis.compute import _bs_amount, _line_amount
from app.modules.financials_kpis.periods import get_latest_period
from app.modules.group_entities_related_parties.rpt import (
    GUARANTEE_TYPES,
    LOAN_RECEIVED_TYPES,
)
from app.modules.notifications.constants import BORROWINGS_ASSETS_SAVE_MESSAGE
from app.modules.notifications.schemas import SaveAcknowledgementResponse
from app.modules.notifications.service import (
    create_borrowings_assets_save_notification,
    to_notification_response,
)


def _now() -> datetime:
    return datetime.now(tz=UTC)


def get_workspace_for_user(
    db: Session,
    user_id: uuid.UUID,
) -> BorrowingsAssetsContractsWorkspace | None:
    return db.scalar(
        select(BorrowingsAssetsContractsWorkspace).where(
            BorrowingsAssetsContractsWorkspace.user_id == user_id,
        ),
    )


def get_financials_kpis_reference(
    db: Session,
    user_id: uuid.UUID,
) -> FinancialsKpisReferenceResponse:
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
    pl_rows = (payload.get("restatedStatementOfProfitAndLoss") or {}).get("plLineValues") or []

    current_borrowings = _bs_amount(payload, period_id, "currentBorrowings")
    non_current_borrowings = _bs_amount(payload, period_id, "nonCurrentBorrowings")
    lease_liabilities = _bs_amount(payload, period_id, "leaseLiabilities")
    ppe = _bs_amount(payload, period_id, "propertyPlantAndEquipment")
    cwip = _bs_amount(payload, period_id, "capitalWorkInProgress")
    rou_assets = _bs_amount(payload, period_id, "rightOfUseAssets")
    finance_costs = _line_amount(pl_rows, period_id, "financeCosts")

    indebtedness = (payload.get("otherFinancialInformation") or {}).get("indebtednessSummary") or {}
    total_debt = str(indebtedness.get("totalDebt") or "").strip()
    if not fin_dm.is_filled(total_debt):
        total_debt = fin_dm.sum_decimals(
            [
                non_current_borrowings,
                current_borrowings,
                _bs_amount(payload, period_id, "currentMaturitiesLongTermDebt"),
            ]
        )

    other = payload.get("otherFinancialInformation") or {}
    rpt_rows = [row for row in (other.get("relatedPartyTransactions") or []) if isinstance(row, dict)]
    related_party_debt_values: list[str] = []
    for row in rpt_rows:
        tx_type = str(row.get("transactionType") or "").lower().replace("_", "-")
        outstanding = str(row.get("outstandingBalance") or "")
        if tx_type in LOAN_RECEIVED_TYPES and fin_dm.is_filled(outstanding):
            related_party_debt_values.append(outstanding)

    related_party_debt = fin_dm.sum_decimals(related_party_debt_values)

    if not any(
        [
            fin_dm.is_filled(current_borrowings),
            fin_dm.is_filled(non_current_borrowings),
            fin_dm.is_filled(total_debt),
            fin_dm.is_filled(lease_liabilities),
        ]
    ):
        return FinancialsKpisReferenceResponse(available=False)

    return FinancialsKpisReferenceResponse(
        available=True,
        latest_financial_period=period_label,
        current_borrowings=current_borrowings or None,
        non_current_borrowings=non_current_borrowings or None,
        lease_liabilities=lease_liabilities or None,
        total_debt=total_debt or None,
        related_party_debt=related_party_debt or None,
        finance_costs=finance_costs or None,
        ppe=ppe or None,
        cwip=cwip or None,
        rou_assets=rou_assets or None,
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
    working_capital = payload.get("workingCapitalAndBorrowingRepayment") or {}
    borrowing_items = [item for item in (working_capital.get("borrowingRepaymentItems") or []) if isinstance(item, dict)]
    if not borrowing_items:
        return ObjectsOfIssueReferenceResponse(available=False)

    total_proposed = fin_dm.sum_decimals(
        [str(item.get("proposedRepaymentAmount") or item.get("amount") or "") for item in borrowing_items]
    )
    return ObjectsOfIssueReferenceResponse(
        available=True,
        debt_repayment_objects_count=len(borrowing_items),
        total_proposed_repayment=total_proposed or None,
    )


def get_group_entities_reference(
    db: Session,
    user_id: uuid.UUID,
) -> GroupEntitiesReferenceResponse:
    workspace = db.scalar(
        select(GroupEntitiesRelatedPartiesWorkspace).where(
            GroupEntitiesRelatedPartiesWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return GroupEntitiesReferenceResponse(available=False)

    payload = workspace.payload or {}
    transactions = (payload.get("relatedPartyTransactionsBalancesAndCommitments") or {}).get("transactions") or []
    related_party_borrowings = 0
    inter_company_loans = 0
    corporate_guarantees = 0
    for tx in transactions:
        if not isinstance(tx, dict):
            continue
        tx_type = str(tx.get("transactionType") or "").lower().replace("_", "-")
        if tx_type in LOAN_RECEIVED_TYPES:
            related_party_borrowings += 1
        elif tx_type in {"loan-given"}:
            inter_company_loans += 1
        elif tx_type in GUARANTEE_TYPES:
            corporate_guarantees += 1

    if related_party_borrowings == 0 and inter_company_loans == 0 and corporate_guarantees == 0:
        return GroupEntitiesReferenceResponse(available=False)

    return GroupEntitiesReferenceResponse(
        available=True,
        related_party_borrowings_count=related_party_borrowings,
        inter_company_loans_count=inter_company_loans,
        corporate_guarantees_count=corporate_guarantees,
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
    promoters_section = payload.get("promotersAndControl") or {}
    promoters = [item for item in (promoters_section.get("promoters") or []) if isinstance(item, dict)]
    if not promoters:
        return CapitalOwnershipReferenceResponse(available=False)

    shareholding = payload.get("shareholdingPatternAndCapitalStructure") or {}
    shareholders = [item for item in (shareholding.get("shareholders") or []) if isinstance(item, dict)]
    pledged_reported = any(fin_dm.is_filled(item.get("sharesEncumbered")) for item in shareholders)

    guarantees_section = payload.get("promoterContributionLockInAndOtherObligations") or {}
    guarantee_records = [
        item
        for item in (guarantees_section.get("promoterUndertakingRecords") or [])
        if isinstance(item, dict)
    ]

    return CapitalOwnershipReferenceResponse(
        available=True,
        promoter_count=len(promoters),
        pledged_shares_reported=pledged_reported,
        guarantee_providers_count=len(guarantee_records),
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
    facilities_section = payload.get("facilitiesCapacityAndOperationalProcess") or {}
    workforce_section = payload.get("workforceCollaborationsInsuranceAndContinuity") or {}
    ip_section = payload.get("intellectualPropertyBrandingAndTechnology") or {}
    suppliers_section = payload.get("suppliersProcurementAndInputDependencies") or {}
    customers_section = payload.get("customersSalesChannelsAndMarketing") or {}

    facilities = facilities_section.get("facilities") or []
    insurance_policies = workforce_section.get("insurancePolicies") or []
    ip_records = ip_section.get("intellectualPropertyRecords") or []
    has_supplier_customer = bool(suppliers_section.get("keySuppliers")) or bool(
        customers_section.get("customerSegments")
    )

    if not facilities and not insurance_policies and not ip_records and not has_supplier_customer:
        return BusinessOperationsReferenceResponse(available=False)

    return BusinessOperationsReferenceResponse(
        available=True,
        facility_count=len(facilities),
        insurance_policy_count=len(insurance_policies),
        ip_record_count=len(ip_records),
        major_customer_supplier_context_available=has_supplier_customer,
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
    directors_section = payload.get("directorsProfilesAppointmentsAndEligibility") or {}
    directors = directors_section.get("directors") or []
    kmp_section = payload.get("kmpSeniorManagementAndOrganisationStructure") or {}
    kmp = kmp_section.get("kmpSmpRecords") or []
    approvals_section = payload.get("boardCommitteesGovernanceProcessesAndApprovals") or {}
    approval_context = bool(
        approvals_section.get("auditCommitteeExists") == "yes"
        or approvals_section.get("boardApprovalProcessDocumented") == "yes"
    )

    if not directors and not kmp:
        return ManagementGovernanceReferenceResponse(available=False)

    return ManagementGovernanceReferenceResponse(
        available=True,
        director_count=len(directors),
        kmp_count=len(kmp),
        approval_context_available=approval_context,
    )


def get_linked_references(db: Session, user_id: uuid.UUID) -> LinkedWorkstreamReferencesResponse:
    return LinkedWorkstreamReferencesResponse(
        financials_kpis=get_financials_kpis_reference(db, user_id),
        objects_of_issue=get_objects_of_issue_reference(db, user_id),
        group_entities=get_group_entities_reference(db, user_id),
        capital_ownership=get_capital_ownership_reference(db, user_id),
        business_operations=get_business_operations_reference(db, user_id),
        management_governance=get_management_governance_reference(db, user_id),
        litigation_approvals_compliance=LinkedWorkstreamPlaceholderResponse(available=False),
        intermediaries_filing=LinkedWorkstreamPlaceholderResponse(available=False),
    )


def _linked_dict(linked: LinkedWorkstreamReferencesResponse) -> dict[str, Any]:
    return linked.model_dump(by_alias=True)


def _build_progress(payload: dict[str, Any]) -> WorkspaceProgressResponse:
    return WorkspaceProgressResponse.model_validate(
        calculate_borrowings_assets_contracts_progress(payload),
    )


def _build_computations(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> ComputationsResponse:
    model = compute_borrowings_assets_contracts_model(payload, linked_references)
    return ComputationsResponse.model_validate(model)


def _build_workspace_response(
    db: Session,
    workspace: BorrowingsAssetsContractsWorkspace,
) -> BorrowingsAssetsContractsWorkspaceResponse:
    linked_references = get_linked_references(db, workspace.user_id)
    linked_dict = _linked_dict(linked_references)
    payload = workspace.payload
    return BorrowingsAssetsContractsWorkspaceResponse(
        id=str(workspace.id),
        version=workspace.version,
        schema_version=workspace.schema_version,
        last_saved_at=workspace.last_saved_at,
        payload=payload,
        progress=_build_progress(payload),
        computations=_build_computations(payload, linked_dict),
        linked_references=linked_references,
    )


def _insert_workspace(db: Session, user: User) -> BorrowingsAssetsContractsWorkspace | None:
    application = get_submitted_sme_application(db, user.id)
    payload = clone_empty_payload()
    now = _now()
    workspace = BorrowingsAssetsContractsWorkspace(
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
            code=BorrowingsAssetsErrorCode.WORKSPACE_NOT_FOUND,
            message="Borrowings, Assets & Contracts workspace could not be initialized.",
        )

    base = _build_workspace_response(db, existing)
    return InitializeWorkspaceResponse(**base.model_dump(), created=False)


def get_workspace(db: Session, user: User) -> BorrowingsAssetsContractsWorkspaceResponse:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=BorrowingsAssetsErrorCode.WORKSPACE_NOT_FOUND,
            message="Borrowings, Assets & Contracts workspace has not been initialized.",
        )
    return _build_workspace_response(db, workspace)


def _require_workspace(db: Session, user: User) -> BorrowingsAssetsContractsWorkspace:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=BorrowingsAssetsErrorCode.WORKSPACE_NOT_FOUND,
            message="Borrowings, Assets & Contracts workspace has not been initialized.",
        )
    return workspace


def _assert_version(
    db: Session,
    workspace: BorrowingsAssetsContractsWorkspace,
    expected_version: int,
) -> None:
    if workspace.version != expected_version:
        linked_references = get_linked_references(db, workspace.user_id)
        linked_dict = _linked_dict(linked_references)
        raise AppException(
            status_code=409,
            code=BorrowingsAssetsErrorCode.WORKSPACE_VERSION_CONFLICT,
            message="The workspace was updated elsewhere. Refresh and try again.",
            details={
                "currentVersion": workspace.version,
                "payload": workspace.payload,
                "progress": calculate_borrowings_assets_contracts_progress(workspace.payload),
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
            code=BorrowingsAssetsErrorCode.UNKNOWN_SECTION,
            message=f"Unknown Borrowings, Assets & Contracts section: {section_id}",
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
            code=BorrowingsAssetsErrorCode.VALIDATION_FAILED,
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
    notification = create_borrowings_assets_save_notification(
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
            message=BORROWINGS_ASSETS_SAVE_MESSAGE,
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


def get_assessment(db: Session, user: User) -> BacAssessmentResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, workspace.user_id)
    assessment = assess_borrowings_assets_contracts(workspace.payload, _linked_dict(linked_references))
    return BacAssessmentResponse.model_validate(assessment)
