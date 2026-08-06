"""Overview summary derived from persisted Business & Operations payload — ports
`buildOverviewSummary` from `frontend/lib/business-operations/context.tsx`.
"""

from __future__ import annotations

from typing import Any

from app.modules.business_operations.assessment import assess_business_operations
from app.modules.business_operations.compute import compute_business_operations_model
from app.modules.business_operations.constants import (
    BUSINESS_CLASSIFICATION_LABELS,
    CUSTOMER_MODEL_LABELS,
    REVENUE_MODEL_LABELS,
    SECTION_LABELS,
)
from app.modules.business_operations.progress import calculate_progress

SLUG = "business-operations"


def _target_route(section_id: str) -> str:
    return f"/projects/demo/workstreams/{SLUG}?tab=information&section={section_id}"


def _label_or_empty(value: str | None) -> str:
    return (value or "").strip()


def _ternary_label(value: str) -> str:
    if value == "yes":
        return "Yes"
    if value == "no":
        return "No"
    if value == "not_sure":
        return "Not sure"
    return ""


def build_overview_summary(
    payload: dict[str, Any],
    *,
    linked: dict[str, Any] | None = None,
    company_reference: dict[str, Any] | None = None,
) -> dict[str, Any]:
    company_reference = company_reference or {
        "available": False,
        "legalName": None,
        "companyClass": None,
        "cin": None,
    }
    model = compute_business_operations_model(payload)
    progress = calculate_progress(payload)
    assessment = assess_business_operations(payload, linked)

    profile = payload["businessProfileAndOperatingModel"]
    classification_labels = [
        BUSINESS_CLASSIFICATION_LABELS.get(value, value)
        for value in profile.get("businessClassifications") or []
    ]
    revenue_model_labels = [
        REVENUE_MODEL_LABELS.get(value, value) for value in profile.get("revenueModels") or []
    ]
    customer_model = profile.get("customerModel") or ""
    customer_model_label = CUSTOMER_MODEL_LABELS.get(customer_model, customer_model) if customer_model else ""

    business_model_parts = [
        part
        for part in [
            ", ".join(classification_labels),
            customer_model_label,
            ", ".join(revenue_model_labels),
            _label_or_empty(profile.get("primaryBusinessActivity")),
        ]
        if part
    ]

    unit_labels = [
        _label_or_empty(unit.get("unitName")) for unit in profile.get("businessUnits") or []
    ]
    unit_labels = [label for label in unit_labels if label]
    segment_labels = [
        _label_or_empty(row.get("productOrSegmentLabel"))
        for row in payload["productsServicesAndRevenueMix"]["revenueMixRows"]
    ]
    segment_labels = [label for label in segment_labels if label]
    operating_segments = list(dict.fromkeys([*unit_labels, *segment_labels]))

    current_customer = next(
        (row for row in model["customerConcentration"] if row["isCurrentPeriod"]), None
    )
    current_supplier = next(
        (row for row in model["supplierConcentration"] if row["isCurrentPeriod"]), None
    )
    current_utilisation = next(
        (row for row in model["capacityUtilisation"] if row["isCurrentPeriod"]), None
    )

    sections_in_progress = sum(1 for status in progress["sections"].values() if status == "in_progress")

    reconciliation_concerns = [
        {"key": check["id"], "label": check["label"], "explanation": check["message"]}
        for check in model["reconciliation"]
        if check["status"] in ("variance", "missing_information")
    ]

    incomplete_sections = [
        section_id for section_id, status in progress["sections"].items() if status != "complete"
    ]
    recommended_next_actions = [
        {
            "label": f"Continue {SECTION_LABELS[section_id]}",
            "sectionId": section_id,
            "href": _target_route(section_id),
        }
        for section_id in incomplete_sections[:3]
    ]

    return {
        "sectionsComplete": progress["sectionsComplete"],
        "sectionsInProgress": sections_in_progress,
        "totalSections": progress["totalSections"],
        "overallStatus": progress["overallStatus"],
        "sectionStatuses": progress["sections"],
        "businessModelSummary": " · ".join(business_model_parts),
        "operatingSegmentsSummary": ", ".join(operating_segments),
        "productsCount": model["counts"]["products"],
        "facilitiesCount": model["counts"]["facilities"],
        "employeesTotal": (model["workforceLatest"] or {}).get("totalHeadcount", ""),
        "domesticOperations": _ternary_label(profile.get("domesticOperations", "")),
        "exportOperations": _ternary_label(profile.get("exportOperations", "")),
        "largestSegmentLabel": (model["largestSegment"] or {}).get("label", ""),
        "largestSegmentPercentage": (model["largestSegment"] or {}).get("percentage", ""),
        "productConcentration": model["productConcentration"]["largestProductPercentage"],
        "customerConcentration": (
            (current_customer or {}).get("largestPercentage")
            or (model["customerConcentration"][0]["largestPercentage"] if model["customerConcentration"] else "")
            or ""
        ),
        "supplierConcentration": (
            (current_supplier or {}).get("largestPercentage")
            or (model["supplierConcentration"][0]["largestPercentage"] if model["supplierConcentration"] else "")
            or ""
        ),
        "capacityUtilisation": (
            (current_utilisation or {}).get("utilisationPercentage")
            or (model["capacityUtilisation"][0]["utilisationPercentage"] if model["capacityUtilisation"] else "")
            or ""
        ),
        "dependenciesCount": model["counts"]["dependencies"],
        "reconciledChecksCount": len(
            [check for check in model["reconciliation"] if check["status"] == "reconciled"]
        ),
        "varianceChecksCount": len(
            [check for check in model["reconciliation"] if check["status"] == "variance"]
        ),
        "missingInformationChecksCount": len(
            [check for check in model["reconciliation"] if check["status"] == "missing_information"]
        ),
        "reconciliationConcerns": reconciliation_concerns,
        "assessmentResult": assessment["result"],
        "assessmentResultLabel": assessment["resultLabel"],
        "assessmentSummary": assessment["summary"],
        "recommendedNextActions": recommended_next_actions,
        "companyReference": company_reference,
        "missingRequiredResponses": [],
        "missingRequiredCount": 0,
    }
