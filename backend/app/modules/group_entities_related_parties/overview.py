"""Overview summary derived from Group Entities draft."""

from __future__ import annotations

from typing import Any

from app.modules.group_entities_related_parties.assessment import assess_group_entities
from app.modules.group_entities_related_parties.compute import compute_group_entities_model
from app.modules.group_entities_related_parties.constants import SECTION_LABELS, SECTION_IDS
from app.modules.group_entities_related_parties.progress import calculate_group_entities_progress


def build_overview_summary(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    progress = calculate_group_entities_progress(payload)
    model = compute_group_entities_model(payload, linked_references)
    assessment = assess_group_entities(payload, linked_references)

    sections_in_progress = sum(
        1 for status in progress["sections"].values() if status == "in_progress"
    )
    incomplete_sections = [
        section_id
        for section_id in SECTION_IDS
        if progress["sections"].get(section_id) != "complete"
    ]
    recommended_next_actions = [
        {
            "sectionId": section_id,
            "label": f"Continue with {SECTION_LABELS[section_id]}",
        }
        for section_id in incomplete_sections[:4]
    ]

    policy = (payload.get("groupCompanyAndMaterialityClassification") or {}).get(
        "materialityPolicy"
    ) or {}
    if policy.get("policyExists") == "yes" and policy.get("adopted") == "yes":
        materiality_policy_status = "Adopted"
    elif policy.get("policyExists") == "yes":
        materiality_policy_status = "Recorded — adoption pending"
    else:
        materiality_policy_status = "Not captured"

    rpt_summary = model["rptSummary"]
    fin_available = bool((linked_references.get("financialsKpis") or {}).get("available"))
    if rpt_summary.get("financialsRevenueDifference") or rpt_summary.get("financialsPurchasesDifference"):
        rpt_financials_reconciliation_status = "Reconciliation differences identified"
    elif fin_available:
        rpt_financials_reconciliation_status = "No material differences detected"
    else:
        rpt_financials_reconciliation_status = "Pending Financials linkage"

    financial_readiness = (
        payload.get("groupEntityFinancialRegulatoryAndLitigationReadiness") or {}
    ).get("entityFinancialReadiness") or []
    group_companies_with_complete_financial_info = sum(
        1
        for record in financial_readiness
        if isinstance(record, dict) and record.get("informationStatus") == "complete"
    )

    transactions = (payload.get("relatedPartyTransactionsBalancesAndCommitments") or {}).get(
        "transactions"
    ) or []
    first_tx = transactions[0] if transactions and isinstance(transactions[0], dict) else {}

    counts = assessment["counts"]
    assessment_concerns = (
        counts["potentialConcern"]
        + counts["unresolvedRelationship"]
        + counts["classificationReviewRequired"]
        + counts["financialReconciliationPending"]
        + counts["pendingEntityInformation"]
    )
    professional_review_items = (
        counts["pendingProfessionalConfirmation"] + counts["pendingBoardDetermination"]
    )

    fin = linked_references.get("financialsKpis") or {}
    return {
        "sectionStatuses": progress["sections"],
        "sectionsComplete": progress["sectionsComplete"],
        "sectionsInProgress": sections_in_progress,
        "totalSections": progress["totalSections"],
        "overallStatus": progress["overallStatus"],
        "entityCount": model["entityCount"],
        "subsidiaryCount": model["subsidiaryCount"],
        "stepDownSubsidiaryCount": model["stepDownSubsidiaryCount"],
        "associateCount": model["associateCount"],
        "jvCount": model["jvCount"],
        "promoterGroupEntityCount": model["promoterGroupEntityCount"],
        "icdrGroupCompanyCount": model["icdrGroupCompanyCount"],
        "icdrPendingBoardCount": model["icdrPendingBoardCount"],
        "relatedPartyCount": model["relatedPartyCount"],
        "historicalRelatedPartyCount": model["historicalRelatedPartyCount"],
        "latestFinancialYearRptTotal": rpt_summary.get("latestFinancialYearTotal") or "",
        "rptRevenuePercent": rpt_summary.get("rptRevenuePercent"),
        "rptPurchasesPercent": rpt_summary.get("rptPurchasesPercent"),
        "relatedPartyReceivables": rpt_summary.get("closingReceivables") or "",
        "relatedPartyPayables": rpt_summary.get("closingPayables") or "",
        "relatedPartyLoans": rpt_summary.get("closingLoans") or "",
        "guaranteesCommitments": rpt_summary.get("guarantees") or "",
        "commonPursuitEntityCount": model["commonPursuitEntityCount"],
        "materialDependencyCount": model["dependencyCount"],
        "potentialConflictItems": model["commonPursuitEntityCount"],
        "groupCompaniesWithCompleteFinancialInfo": group_companies_with_complete_financial_info,
        "negativeNetWorthCount": model["negativeNetWorthCount"],
        "auditorQualifiedCount": model["auditorQualifiedCount"],
        "ibcConcernCount": model["ibcConcernCount"],
        "pendingEntityInformationCount": model["pendingEntityInformationCount"],
        "rptFinancialsReconciliationStatus": rpt_financials_reconciliation_status,
        "materialityPolicyStatus": materiality_policy_status,
        "assessmentConcerns": assessment_concerns,
        "professionalReviewItems": professional_review_items,
        "assessmentResult": assessment["result"],
        "assessmentResultLabel": assessment["resultLabel"],
        "assessmentSummary": assessment["summary"],
        "recommendedNextActions": recommended_next_actions,
        "latestFinancialPeriod": fin.get("latestFinancialPeriod")
        or first_tx.get("financialPeriod")
        or None,
        "currency": first_tx.get("currency") or "INR",
        "amountUnit": first_tx.get("amountUnit") or "lakhs",
    }
