"""Group Entities & Related Parties workspace service."""

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
from app.models.group_entities_related_parties_workspace import GroupEntitiesRelatedPartiesWorkspace
from app.models.management_governance_workspace import ManagementGovernanceWorkspace
from app.models.objects_issue_workspace import ObjectsIssueWorkspace
from app.models.user import User
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.financials_kpis import decimal_math as fin_dm
from app.modules.financials_kpis.compute import _bs_amount, _line_amount
from app.modules.financials_kpis.periods import get_latest_period
from app.modules.group_entities_related_parties.assessment import assess_group_entities
from app.modules.group_entities_related_parties.compute import compute_group_entities_model
from app.modules.group_entities_related_parties.constants import (
    SECTION_IDS,
    SECTION_PAYLOAD_KEYS,
    GroupEntitiesErrorCode,
)
from app.modules.group_entities_related_parties.defaults import clone_empty_payload
from app.modules.group_entities_related_parties.overview import build_overview_summary
from app.modules.group_entities_related_parties.progress import calculate_group_entities_progress
from app.modules.group_entities_related_parties.schemas import (
    BusinessOperationsReferenceResponse,
    CapitalOwnershipReferenceResponse,
    CompanyReferenceResponse,
    ComputationsResponse,
    FinancialsKpisReferenceResponse,
    GroupAssessmentResponse,
    GroupEntitiesWorkspaceResponse,
    InitializeWorkspaceResponse,
    LinkedPersonReferenceResponse,
    LinkedWorkstreamReferencesResponse,
    ManagementGovernanceReferenceResponse,
    ObjectsOfIssueReferenceResponse,
    OverviewSummaryResponse,
    RptSummaryResponse,
    SectionSaveResponse,
    WorkspaceProgressResponse,
)
from app.modules.group_entities_related_parties.validation import VALIDATORS, ValidationError
from app.modules.notifications.constants import GROUP_ENTITIES_SAVE_MESSAGE
from app.modules.notifications.schemas import SaveAcknowledgementResponse
from app.modules.notifications.service import (
    create_group_entities_save_notification,
    to_notification_response,
)

_FIN_SALES_KEYWORDS = ("sale", "revenue", "income", "dividend", "rent-received", "royalty")
_FIN_PURCHASE_KEYWORDS = ("purchase", "expense", "service", "rent-paid", "management")


def _now() -> datetime:
    return datetime.now(tz=UTC)


def get_workspace_for_user(
    db: Session,
    user_id: uuid.UUID,
) -> GroupEntitiesRelatedPartiesWorkspace | None:
    return db.scalar(
        select(GroupEntitiesRelatedPartiesWorkspace).where(
            GroupEntitiesRelatedPartiesWorkspace.user_id == user_id,
        ),
    )


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
    cin = str(identity.get("cin") or "").strip() or None
    if not legal_name and not cin:
        return CompanyReferenceResponse(available=False)
    return CompanyReferenceResponse(available=True, legal_name=legal_name, cin=cin)


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
    promoters_section = payload.get("promotersAndControl") or {}
    promoters_raw = promoters_section.get("promoters") or []
    promoters: list[LinkedPersonReferenceResponse] = []
    for item in promoters_raw:
        if not isinstance(item, dict):
            continue
        promoters.append(
            LinkedPersonReferenceResponse(
                id=str(item.get("id") or ""),
                name=str(item.get("fullLegalName") or item.get("name") or "").strip(),
                role="promoter",
                source="capital-ownership",
            )
        )

    if not promoters:
        return CapitalOwnershipReferenceResponse(available=False)

    return CapitalOwnershipReferenceResponse(
        available=True,
        promoter_count=len(promoters),
        promoters=promoters,
    )


def get_management_governance_reference(
    db: Session,
    user_id: uuid.UUID,
) -> ManagementGovernanceReferenceResponse:
    workspace = db.scalar(
        select(ManagementGovernanceWorkspace).where(
            ManagementGovernanceWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return ManagementGovernanceReferenceResponse(available=False)

    payload = workspace.payload or {}
    directors_section = payload.get("directorsProfilesAppointmentsAndEligibility") or {}
    directors_raw = directors_section.get("directors") or []
    directors: list[LinkedPersonReferenceResponse] = []
    for item in directors_raw:
        if not isinstance(item, dict):
            continue
        directors.append(
            LinkedPersonReferenceResponse(
                id=str(item.get("id") or ""),
                name=str(item.get("fullLegalName") or "").strip(),
                role=str(item.get("designation") or "director"),
                source="management-governance",
            )
        )

    kmp_section = payload.get("kmpSeniorManagementAndOrganisationStructure") or {}
    kmp_raw = kmp_section.get("kmpSmpRecords") or []
    kmp: list[LinkedPersonReferenceResponse] = []
    for item in kmp_raw:
        if not isinstance(item, dict):
            continue
        kmp.append(
            LinkedPersonReferenceResponse(
                id=str(item.get("id") or ""),
                name=str(item.get("fullLegalName") or "").strip(),
                role=str(item.get("roleTitle") or "kmp"),
                source="management-governance",
            )
        )

    rpt_section = payload.get("relatedPartyGovernanceAndBoardOversight") or {}
    rpt_oversight_available = bool(
        rpt_section.get("relatedPartyTransactionsRegisterMaintained") == "yes"
        or rpt_section.get("auditCommitteeOverseesRelatedPartyTransactions") == "yes"
    )

    if not directors and not kmp:
        return ManagementGovernanceReferenceResponse(available=False)

    return ManagementGovernanceReferenceResponse(
        available=True,
        director_count=len(directors),
        kmp_count=len(kmp),
        directors=directors,
        kmp=kmp,
        rpt_oversight_available=rpt_oversight_available,
    )


def _classify_financial_rpt_amount(transaction_type: str) -> str:
    normalized = transaction_type.lower().replace("_", "-")
    if any(keyword in normalized for keyword in _FIN_SALES_KEYWORDS):
        return "sales"
    if any(keyword in normalized for keyword in _FIN_PURCHASE_KEYWORDS):
        return "purchase"
    return "other"


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
    latest_period = get_latest_period(payload)
    if latest_period is None:
        return FinancialsKpisReferenceResponse(available=False)

    period_id = str(latest_period.get("id") or "")
    period_label = str(latest_period.get("label") or period_id)
    pl_rows = (payload.get("restatedStatementOfProfitAndLoss") or {}).get("plLineValues") or []

    revenue = _line_amount(pl_rows, period_id, "revenueFromOperations")
    purchases = fin_dm.sum_decimals(
        [
            _line_amount(pl_rows, period_id, "costOfMaterialsConsumed"),
            _line_amount(pl_rows, period_id, "purchasesOfStockInTrade"),
        ]
    )
    receivables = _bs_amount(payload, period_id, "tradeReceivables")
    payables = fin_dm.sum_decimals(
        [
            _bs_amount(payload, period_id, "tradePayablesMsme"),
            _bs_amount(payload, period_id, "tradePayablesOthers"),
        ]
    )

    other = payload.get("otherFinancialInformation") or {}
    rpt_rows = [row for row in (other.get("relatedPartyTransactions") or []) if isinstance(row, dict)]
    latest_rpt_rows = [
        row for row in rpt_rows if not str(row.get("periodId") or "").strip() or row.get("periodId") == period_id
    ]
    if not latest_rpt_rows:
        latest_rpt_rows = rpt_rows

    rpt_sales_values: list[str] = []
    rpt_purchase_values: list[str] = []
    rpt_receivable_values: list[str] = []
    rpt_payable_values: list[str] = []
    for row in latest_rpt_rows:
        tx_type = str(row.get("transactionType") or "")
        amount = str(row.get("transactionAmount") or "")
        outstanding = str(row.get("outstandingBalance") or "")
        bucket = _classify_financial_rpt_amount(tx_type)
        if bucket == "sales" and fin_dm.is_filled(amount):
            rpt_sales_values.append(amount)
        elif bucket == "purchase" and fin_dm.is_filled(amount):
            rpt_purchase_values.append(amount)
        if fin_dm.is_filled(outstanding):
            if "receivable" in tx_type.lower() or "loan-given" in tx_type.lower():
                rpt_receivable_values.append(outstanding)
            elif "payable" in tx_type.lower() or "loan-received" in tx_type.lower():
                rpt_payable_values.append(outstanding)

    rpt_revenue_total = fin_dm.sum_decimals(rpt_sales_values)
    rpt_purchases_total = fin_dm.sum_decimals(rpt_purchase_values)
    rpt_receivables_total = fin_dm.sum_decimals(rpt_receivable_values)
    rpt_payables_total = fin_dm.sum_decimals(rpt_payable_values)

    if not any(
        [
            fin_dm.is_filled(revenue),
            fin_dm.is_filled(purchases),
            fin_dm.is_filled(receivables),
            fin_dm.is_filled(payables),
            fin_dm.is_filled(rpt_revenue_total),
            fin_dm.is_filled(rpt_purchases_total),
        ]
    ):
        return FinancialsKpisReferenceResponse(available=False)

    return FinancialsKpisReferenceResponse(
        available=True,
        latest_financial_period=period_label,
        revenue_from_operations=revenue or None,
        total_purchases=purchases or None,
        total_receivables=receivables or None,
        total_payables=payables or None,
        rpt_revenue_total=rpt_revenue_total or None,
        rpt_purchases_total=rpt_purchases_total or None,
        rpt_receivables_total=rpt_receivables_total or None,
        rpt_payables_total=rpt_payables_total or None,
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

    payload = workspace.payload or {}
    products_section = payload.get("productsServicesAndRevenueMix") or {}
    suppliers_section = payload.get("suppliersProcurementAndInputDependencies") or {}
    customers_section = payload.get("customersSalesChannelsAndMarketing") or {}

    has_products = bool(products_section.get("productsServices"))
    has_suppliers = bool(suppliers_section.get("keySuppliers"))
    has_customers = bool(customers_section.get("customerSegments"))

    if not has_products and not has_suppliers and not has_customers:
        return BusinessOperationsReferenceResponse(available=False)

    return BusinessOperationsReferenceResponse(
        available=True,
        product_service_context_available=has_products,
        supplier_customer_context_available=has_suppliers or has_customers,
    )


def get_objects_of_issue_reference(
    db: Session,
    user_id: uuid.UUID,
) -> ObjectsOfIssueReferenceResponse:
    workspace = db.scalar(
        select(ObjectsIssueWorkspace).where(
            ObjectsIssueWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return ObjectsOfIssueReferenceResponse(available=False)

    payload = workspace.payload or {}
    objects = payload.get("objectsOfTheIssue") or {}
    object_items = objects.get("objectItems") or []
    acquisitions = payload.get("acquisitionsSubsidiariesJvsAndInvestments") or {}
    investment_items = acquisitions.get("investmentItems") or []
    working_capital = payload.get("workingCapitalAndBorrowingRepayment") or {}
    borrowing_items = working_capital.get("borrowingRepaymentItems") or []

    subsidiary_investment_proposed = any(
        isinstance(item, dict) and item.get("objectCategory") == "acquisition-or-investment"
        for item in object_items
    ) or bool(investment_items)
    related_party_debt_repayment = any(
        isinstance(item, dict) and item.get("isRelatedPartyLender") == "yes"
        for item in borrowing_items
    )

    if not subsidiary_investment_proposed and not related_party_debt_repayment:
        return ObjectsOfIssueReferenceResponse(available=False)

    return ObjectsOfIssueReferenceResponse(
        available=True,
        subsidiary_investment_proposed=subsidiary_investment_proposed,
        related_party_debt_repayment_proposed=related_party_debt_repayment,
    )


def get_linked_references(db: Session, user_id: uuid.UUID) -> LinkedWorkstreamReferencesResponse:
    return LinkedWorkstreamReferencesResponse(
        company=get_company_reference(db, user_id),
        capital_ownership=get_capital_ownership_reference(db, user_id),
        management_governance=get_management_governance_reference(db, user_id),
        financials_kpis=get_financials_kpis_reference(db, user_id),
        business_operations=get_business_operations_reference(db, user_id),
        objects_of_issue=get_objects_of_issue_reference(db, user_id),
    )


def _linked_dict(linked: LinkedWorkstreamReferencesResponse) -> dict[str, Any]:
    return linked.model_dump(by_alias=True)


def _build_progress(payload: dict[str, Any]) -> WorkspaceProgressResponse:
    return WorkspaceProgressResponse.model_validate(calculate_group_entities_progress(payload))


def _build_computations(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> ComputationsResponse:
    model = compute_group_entities_model(payload, linked_references)
    rpt_summary = model.pop("rptSummary", {})
    model.pop("ownershipPathSummaries", None)
    model.pop("icdrReadinessSummary", None)
    model.pop("materialitySummary", None)
    return ComputationsResponse(
        **model,
        rpt_summary=RptSummaryResponse.model_validate(rpt_summary),
    )


def _build_workspace_response(
    db: Session,
    workspace: GroupEntitiesRelatedPartiesWorkspace,
) -> GroupEntitiesWorkspaceResponse:
    linked_references = get_linked_references(db, workspace.user_id)
    linked_dict = _linked_dict(linked_references)
    payload = workspace.payload
    return GroupEntitiesWorkspaceResponse(
        id=str(workspace.id),
        version=workspace.version,
        schema_version=workspace.schema_version,
        last_saved_at=workspace.last_saved_at,
        payload=payload,
        progress=_build_progress(payload),
        computations=_build_computations(payload, linked_dict),
        company_reference=linked_references.company,
        linked_references=linked_references,
    )


def _insert_workspace(db: Session, user: User) -> GroupEntitiesRelatedPartiesWorkspace | None:
    application = get_submitted_sme_application(db, user.id)
    payload = clone_empty_payload()
    now = _now()
    workspace = GroupEntitiesRelatedPartiesWorkspace(
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
            code=GroupEntitiesErrorCode.WORKSPACE_NOT_FOUND,
            message="Group Entities & Related Parties workspace could not be initialized.",
        )

    base = _build_workspace_response(db, existing)
    return InitializeWorkspaceResponse(**base.model_dump(), created=False)


def get_workspace(db: Session, user: User) -> GroupEntitiesWorkspaceResponse:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=GroupEntitiesErrorCode.WORKSPACE_NOT_FOUND,
            message="Group Entities & Related Parties workspace has not been initialized.",
        )
    return _build_workspace_response(db, workspace)


def _require_workspace(db: Session, user: User) -> GroupEntitiesRelatedPartiesWorkspace:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=GroupEntitiesErrorCode.WORKSPACE_NOT_FOUND,
            message="Group Entities & Related Parties workspace has not been initialized.",
        )
    return workspace


def _assert_version(
    db: Session,
    workspace: GroupEntitiesRelatedPartiesWorkspace,
    expected_version: int,
) -> None:
    if workspace.version != expected_version:
        linked_references = get_linked_references(db, workspace.user_id)
        linked_dict = _linked_dict(linked_references)
        raise AppException(
            status_code=409,
            code=GroupEntitiesErrorCode.WORKSPACE_VERSION_CONFLICT,
            message="The workspace was updated elsewhere. Refresh and try again.",
            details={
                "currentVersion": workspace.version,
                "payload": workspace.payload,
                "progress": calculate_group_entities_progress(workspace.payload),
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
            code=GroupEntitiesErrorCode.UNKNOWN_SECTION,
            message=f"Unknown Group Entities section: {section_id}",
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
            code=GroupEntitiesErrorCode.VALIDATION_FAILED,
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
    notification = create_group_entities_save_notification(
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
            message=GROUP_ENTITIES_SAVE_MESSAGE,
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


def get_assessment(db: Session, user: User) -> GroupAssessmentResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, workspace.user_id)
    assessment = assess_group_entities(workspace.payload, _linked_dict(linked_references))
    return GroupAssessmentResponse.model_validate(assessment)
