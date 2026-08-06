"""Overview summary derived from persisted Capital & Ownership payload."""

from __future__ import annotations

from typing import Any

from app.modules.capital_ownership import decimal_math as dm
from app.modules.capital_ownership.assessment import assess_capital_ownership
from app.modules.capital_ownership.compute import compute_capital_ownership_model
from app.modules.capital_ownership.progress import calculate_progress, list_missing_required

SLUG = "capital-ownership"


def _target_route(section_id: str) -> str:
    return f"/projects/demo/workstreams/{SLUG}?tab=information&section={section_id}"


def build_overview_summary(
    payload: dict[str, Any],
    ipo_reference: dict[str, Any],
    company_reference: dict[str, Any],
) -> dict[str, Any]:
    progress = calculate_progress(payload)
    model = compute_capital_ownership_model(payload, ipo_reference)
    assessment = assess_capital_ownership(payload, ipo_reference)
    missing = list_missing_required(payload)

    variance_checks = [c for c in model["reconciliation"] if c["status"] == "variance"]

    selling_shareholders_count = sum(
        1 for row in model["prePost"]["rows"] if dm.is_positive(row["sharesOfferedForSale"])
    )
    outstanding_section = payload.get("outstandingSecuritiesTransactionsAndConfirmations") or {}
    outstanding_instruments_count = len(outstanding_section.get("outstandingInstruments") or [])

    section_statuses: dict[str, str] = progress["sections"]
    sections_in_progress = sum(1 for status in section_statuses.values() if status == "in_progress")

    # Prefer continuing a section already started over jumping back to the first blank one.
    next_section_id = next(
        (section_id for section_id, status in section_statuses.items() if status == "in_progress"),
        None,
    ) or next(
        (section_id for section_id, status in section_statuses.items() if status == "not_started"),
        None,
    )

    next_actions: list[dict[str, str]] = []
    if next_section_id is not None:
        next_actions.append(
            {
                "label": f"Continue with {_section_label(next_section_id)}",
                "sectionId": next_section_id,
                "href": _target_route(next_section_id),
            }
        )
    if variance_checks or assessment["result"] not in {
        "insufficient_information",
        "appears_reconciled",
    }:
        next_actions.append(
            {
                "label": "Review Capital Assessment",
                "sectionId": "",
                "href": f"/projects/demo/workstreams/{SLUG}?tab=capital-assessment",
            }
        )

    reconciliation_concerns = [
        {"key": check["id"], "label": check["label"], "explanation": check["message"]}
        for check in variance_checks
    ]
    assessment_counts = assessment.get("counts") or {}

    return {
        "sectionsComplete": progress["sectionsComplete"],
        "sectionsInProgress": sections_in_progress,
        "totalSections": progress["totalSections"],
        "overallStatus": progress["overallStatus"],
        "sectionStatuses": section_statuses,
        "currentEquityShares": model["totals"]["currentEquityShares"],
        "paidUpEquityCapital": model["totals"]["paidUpEquityCapitalFromClasses"],
        "promoterAndGroupPercentage": model["capTable"]["groups"]["promoterAndGroupPercentage"],
        "postIssueShares": model["prePost"]["postIssueShares"],
        "promoterPostIssuePercentage": model["dilution"]["promoterPostIssuePercentage"],
        "offerAsPercentageOfPostIssueCapital": model["prePost"]["offerAsPercentageOfPostIssueCapital"],
        "potentialDilutionFromConvertibles": model["outstanding"]["potentialDilutionPercentage"],
        "totalSharesOfferedForSale": model["prePost"]["totalSharesOfferedForSale"],
        "sellingShareholdersCount": selling_shareholders_count,
        "outstandingInstrumentsCount": outstanding_instruments_count,
        "totalEncumberedShares": model["lockIn"]["totalEncumberedShares"],
        "reconciledChecksCount": int(assessment_counts.get("reconciled") or 0),
        "varianceChecksCount": int(assessment_counts.get("potential_inconsistency") or 0),
        "missingInformationChecksCount": int(assessment_counts.get("missing_information") or 0),
        "reconciliationConcerns": reconciliation_concerns,
        "ipoSetupLinked": bool(ipo_reference.get("available")),
        "ipoSetupOfferType": ipo_reference.get("proposedOfferType") or "",
        "assessmentResult": assessment["result"],
        "assessmentResultLabel": assessment["resultLabel"],
        "assessmentSummary": assessment["summary"],
        "missingRequiredResponses": missing,
        "missingRequiredCount": len(missing),
        "recommendedNextActions": next_actions,
        "companyReference": company_reference,
        "ipoSetupReference": ipo_reference,
    }


def _section_label(section_id: str) -> str:
    from app.modules.capital_ownership.constants import SECTION_LABELS

    return SECTION_LABELS.get(section_id, section_id)
