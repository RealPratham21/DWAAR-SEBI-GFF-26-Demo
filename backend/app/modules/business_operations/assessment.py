"""Deterministic Business Assessment for Business & Operations — ports
`frontend/lib/business-operations/assessment.ts`.

Disclosure-focused: never returns strong/weak or investment-quality scores. An unanswered
question is `missing_information`, never a negative answer.
"""

from __future__ import annotations

from typing import Any

from app.modules.business_operations.compute import compute_business_operations_model
from app.modules.business_operations.constants import BUSINESS_OPERATIONS_CONFIRMATION_FIELDS
from app.modules.business_operations.progress import calculate_progress

BUSINESS_CRITERION_STATES = (
    "substantiated",
    "potential_inconsistency",
    "missing_information",
    "pending_linked_workstream",
    "pending_supporting_source",
    "pending_professional_confirmation",
    "not_applicable",
)

BUSINESS_ASSESSMENT_GROUPS = (
    "business_model_coverage",
    "products_and_revenue",
    "customers_and_sales",
    "suppliers_and_procurement",
    "facilities_and_capacity",
    "technology_quality_ip",
    "workforce_insurance_continuity",
    "strategy_substantiation",
)

BUSINESS_ASSESSMENT_GROUP_LABELS: dict[str, str] = {
    "business_model_coverage": "Business-model coverage",
    "products_and_revenue": "Products and revenue",
    "customers_and_sales": "Customers and sales",
    "suppliers_and_procurement": "Suppliers and procurement",
    "facilities_and_capacity": "Facilities and capacity",
    "technology_quality_ip": "Technology, quality and IP",
    "workforce_insurance_continuity": "Workforce, insurance and continuity",
    "strategy_substantiation": "Strategy substantiation",
}

BUSINESS_CRITERION_STATE_LABELS: dict[str, str] = {
    "substantiated": "Substantiated",
    "potential_inconsistency": "Potential inconsistency",
    "missing_information": "Missing information",
    "pending_linked_workstream": "Pending linked workstream",
    "pending_supporting_source": "Pending supporting source",
    "pending_professional_confirmation": "Pending professional confirmation",
    "not_applicable": "Not applicable",
}

BUSINESS_ASSESSMENT_RESULT_STATES = (
    "insufficient_information",
    "broadly_substantiated",
    "inconsistencies_identified",
    "professional_confirmation_required",
    "pending_supporting_source",
)


def _empty_linked_workstream_references() -> dict[str, Any]:
    return {
        "company": {"available": False, "legalName": None, "companyClass": None, "cin": None},
        "financials": {"available": False},
        "industry": {"available": False},
        "objectsOfTheIssue": {"available": False},
        "assets": {"available": False},
        "compliance": {"available": False},
    }


def _state_from_check(check: dict[str, Any]) -> str:
    status = check["status"]
    if status == "reconciled":
        return "substantiated"
    if status == "variance":
        return "potential_inconsistency"
    if status == "not_applicable":
        return "not_applicable"
    return "missing_information"


def _state_from_ternary(answer: str, *, no_state: str = "potential_inconsistency") -> str:
    if answer == "yes":
        return "substantiated"
    if answer == "no":
        return no_state
    if answer == "not_sure":
        return "pending_professional_confirmation"
    return "missing_information"


def _empty_counts() -> dict[str, int]:
    return {state: 0 for state in BUSINESS_CRITERION_STATES}


def _headline_state_for(counts: dict[str, int]) -> str:
    if counts["potential_inconsistency"] > 0:
        return "potential_inconsistency"
    if counts["missing_information"] > 0:
        return "missing_information"
    if counts["pending_linked_workstream"] > 0:
        return "pending_linked_workstream"
    if counts["pending_supporting_source"] > 0:
        return "pending_supporting_source"
    if counts["pending_professional_confirmation"] > 0:
        return "pending_professional_confirmation"
    if counts["substantiated"] > 0:
        return "substantiated"
    return "not_applicable"


def _label_for_result(result: str) -> str:
    if result == "insufficient_information":
        return "Insufficient information"
    if result == "inconsistencies_identified":
        return "Potential inconsistencies identified"
    if result == "professional_confirmation_required":
        return "Professional confirmation required"
    if result == "pending_supporting_source":
        return "Pending supporting source"
    return "Broadly substantiated on current entries"


def _summary_for_result(result: str) -> str:
    if result == "insufficient_information":
        return (
            "Too much of the business and operations record is still blank to draw a "
            "meaningful disclosure view. Blank answers are not read as negative."
        )
    if result == "inconsistencies_identified":
        return (
            "One or more figures or claims do not reconcile across sections. These are "
            "indicative differences, not conclusions — review the underlying records."
        )
    if result == "professional_confirmation_required":
        return (
            'Entries marked "not sure" or awaiting professional sign-off need confirmation '
            "before this view can be relied upon."
        )
    if result == "pending_supporting_source":
        return "Material claims or figures still need a supporting source or linked workstream input."
    return (
        "On currently entered values the business and operations disclosure appears broadly "
        "substantiated. Professional confirmation remains required."
    )


_CHECK_GROUP: dict[str, str] = {
    "primary-activity-revenue-model": "business_model_coverage",
    "revenue-mix-reconcile": "products_and_revenue",
    "material-products-represented": "products_and_revenue",
    "customer-concentration": "customers_and_sales",
    "supplier-concentration": "suppliers_and_procurement",
    "geographic-revenue": "customers_and_sales",
    "order-book-source": "customers_and_sales",
    "facilities-recorded": "facilities_and_capacity",
    "capacity-utilisation": "facilities_and_capacity",
    "strength-sources": "strategy_substantiation",
    "strategy-projections": "strategy_substantiation",
}


def assess_business_operations(
    payload: dict[str, Any], linked: dict[str, Any] | None = None
) -> dict[str, Any]:
    linked = linked if linked is not None else _empty_linked_workstream_references()
    model = compute_business_operations_model(payload)
    progress = calculate_progress(payload)
    profile = payload["businessProfileAndOperatingModel"]
    tech = payload["technologyQualityResearchAndIntellectualProperty"]
    workforce = payload["workforceCollaborationsInsuranceAndContinuity"]
    strategy = payload["competitiveStrengthsStrategyDependenciesAndConfirmations"]

    criteria: list[dict[str, Any]] = []

    for check in model["reconciliation"]:
        criteria.append(
            {
                "id": check["id"],
                "group": _CHECK_GROUP.get(check["id"], "business_model_coverage"),
                "label": check["label"],
                "state": _state_from_check(check),
                "reason": check["message"],
            }
        )

    company = linked.get("company") or {}
    criteria.append(
        {
            "id": "company-identity-link",
            "group": "business_model_coverage",
            "label": "Company legal identity available from linked workstream",
            "state": "substantiated" if company.get("available") else "pending_linked_workstream",
            "reason": (
                f"Linked company identity: {company.get('legalName') or 'available'}."
                if company.get("available")
                else "Company & Incorporation identity is not yet linked for this session."
            ),
        }
    )

    third_party = profile.get("materialThirdPartyDependence", "")
    criteria.append(
        {
            "id": "third-party-dependence-disclosed",
            "group": "business_model_coverage",
            "label": "Material third-party dependence is disclosed",
            "state": _state_from_ternary(third_party, no_state="substantiated"),
            "reason": (
                "Whether the business has material third-party dependence has not been answered."
                if third_party == ""
                else (
                    profile.get("materialThirdPartyDependenceDetails")
                    or "Material third-party dependence is reported."
                    if third_party == "yes"
                    else "Issuer indicates no material third-party dependence."
                )
            ),
        }
    )

    has_cert_or_ip = len(tech["certifications"]) > 0 or len(tech["intellectualPropertyRecords"]) > 0
    criteria.append(
        {
            "id": "certifications-and-ip",
            "group": "technology_quality_ip",
            "label": "Material certifications and IP are recorded",
            "state": (
                ("not_applicable" if tech.get("rdFunctionExists") == "no" else "missing_information")
                if not has_cert_or_ip
                else "substantiated"
            ),
            "reason": (
                "No certifications or intellectual-property records have been added yet."
                if not has_cert_or_ip
                else f"{len(tech['certifications'])} certification(s) and {len(tech['intellectualPropertyRecords'])} IP record(s) captured."
            ),
        }
    )

    tech_dependence = tech.get("thirdPartyTechnologyDependence", "")
    criteria.append(
        {
            "id": "technology-dependence",
            "group": "technology_quality_ip",
            "label": "Third-party technology dependence is disclosed",
            "state": _state_from_ternary(tech_dependence, no_state="substantiated"),
            "reason": (
                "Third-party technology dependence has not been answered."
                if tech_dependence == ""
                else (
                    tech.get("thirdPartyTechnologyDependenceDetails")
                    or "Third-party technology dependence is reported."
                    if tech_dependence == "yes"
                    else "Issuer indicates no material third-party technology dependence."
                )
            ),
        }
    )

    recall_declaration = tech.get("materialRecallDeclaration", "")
    criteria.append(
        {
            "id": "quality-recalls",
            "group": "technology_quality_ip",
            "label": "Quality incidents and recalls are disclosed",
            "state": _state_from_ternary(recall_declaration, no_state="substantiated"),
            "reason": (
                "Material recall declaration has not been answered."
                if recall_declaration == ""
                else (
                    tech.get("materialRecallDetails") or "A material recall is reported."
                    if recall_declaration == "yes"
                    else "Issuer indicates no material recall declaration."
                )
            ),
        }
    )

    coverage_adequate = workforce.get("managementConsidersCoverageAdequate", "")
    criteria.append(
        {
            "id": "insurance-adequacy",
            "group": "workforce_insurance_continuity",
            "label": "Insurance coverage adequacy considered",
            "state": _state_from_ternary(coverage_adequate),
            "reason": (
                "Whether management considers insurance coverage adequate has not been answered."
                if coverage_adequate == ""
                else (
                    "Management considers coverage adequate."
                    if coverage_adequate == "yes"
                    else "Insurance coverage adequacy needs attention or confirmation."
                )
            ),
        }
    )

    bcp = workforce.get("businessContinuityPlanExists", "")
    drp = workforce.get("disasterRecoveryPlanExists", "")
    if bcp == "" or drp == "":
        continuity_state = "missing_information"
    elif bcp == "not_sure" or drp == "not_sure":
        continuity_state = "pending_professional_confirmation"
    elif bcp == "yes" and drp == "yes":
        continuity_state = "substantiated"
    else:
        continuity_state = "potential_inconsistency"
    criteria.append(
        {
            "id": "continuity-plans",
            "group": "workforce_insurance_continuity",
            "label": "Business continuity and disaster recovery",
            "state": continuity_state,
            "reason": (
                "Continuity or disaster-recovery plan status has not been answered."
                if bcp == "" or drp == ""
                else "Continuity and disaster-recovery responses recorded."
            ),
        }
    )

    strengths_pending_source = len(
        [
            item
            for item in strategy["competitiveStrengths"]
            if (item.get("title") or "").strip() and not (item.get("supportingSource") or "").strip()
        ]
    )
    if strengths_pending_source > 0:
        criteria.append(
            {
                "id": "strength-supporting-source-pending",
                "group": "strategy_substantiation",
                "label": "Strength claims pending supporting source",
                "state": "pending_supporting_source",
                "reason": f"{strengths_pending_source} strength claim(s) still need a supporting source.",
            }
        )

    confirmations = strategy.get("confirmations") or {}
    confirmations_checked = sum(
        1 for key in BUSINESS_OPERATIONS_CONFIRMATION_FIELDS if confirmations.get(key)
    )
    unanswered_confirmations = len(BUSINESS_OPERATIONS_CONFIRMATION_FIELDS) - confirmations_checked
    criteria.append(
        {
            "id": "issuer-confirmations",
            "group": "strategy_substantiation",
            "label": "Issuer confirmations",
            "state": "substantiated" if unanswered_confirmations == 0 else "missing_information",
            "reason": (
                "All issuer confirmations are acknowledged."
                if unanswered_confirmations == 0
                else f"{unanswered_confirmations} confirmation(s) remain unchecked, so this view stays preliminary."
            ),
        }
    )

    if confirmations.get("professionalReviewRemainsRequired"):
        criteria.append(
            {
                "id": "professional-review-flag",
                "group": "strategy_substantiation",
                "label": "Professional review remains required",
                "state": "pending_professional_confirmation",
                "reason": (
                    "The issuer has confirmed that professional review of this workstream "
                    "remains required."
                ),
            }
        )

    counts = _empty_counts()
    for criterion in criteria:
        counts[criterion["state"]] += 1

    groups: list[dict[str, Any]] = []
    for group in BUSINESS_ASSESSMENT_GROUPS:
        group_criteria = [criterion for criterion in criteria if criterion["group"] == group]
        group_counts = _empty_counts()
        for criterion in group_criteria:
            group_counts[criterion["state"]] += 1
        groups.append(
            {
                "group": group,
                "label": BUSINESS_ASSESSMENT_GROUP_LABELS[group],
                "criteria": group_criteria,
                "counts": group_counts,
                "headlineState": _headline_state_for(group_counts),
            }
        )

    # Insufficient information wins while the workspace is still mostly blank so a single
    # inconsistency cannot dominate the headline before enough sections exist to judge.
    result = "broadly_substantiated"
    if counts["missing_information"] >= 6 or progress["sectionsComplete"] < 2:
        result = "insufficient_information"
    elif counts["potential_inconsistency"] > 0:
        result = "inconsistencies_identified"
    elif counts["pending_professional_confirmation"] > 0:
        result = "professional_confirmation_required"
    elif counts["pending_supporting_source"] > 0 or counts["pending_linked_workstream"] > 0:
        result = "pending_supporting_source"
    elif counts["missing_information"] > 0:
        result = "insufficient_information"

    return {
        "result": result,
        "resultLabel": _label_for_result(result),
        "summary": _summary_for_result(result),
        "criteria": criteria,
        "groups": groups,
        "counts": counts,
        "metrics": {
            "products": model["counts"]["products"],
            "facilities": model["counts"]["facilities"],
            "sectionsComplete": progress["sectionsComplete"],
            "unansweredConfirmations": unanswered_confirmations,
            "unreconciledChecks": len(
                [check for check in model["reconciliation"] if check["status"] == "variance"]
            ),
            "largestSegmentLabel": (model["largestSegment"] or {}).get("label", ""),
            "latestHeadcount": (model["workforceLatest"] or {}).get("totalHeadcount", ""),
        },
        "model": model,
    }
