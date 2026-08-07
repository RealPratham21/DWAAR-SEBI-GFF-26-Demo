"""Deterministic Financial Assessment for Financials & KPIs — ports frontend assessment.ts."""

from __future__ import annotations

from typing import Any

from app.modules.financials_kpis.compute import compute_financials_kpis_model
from app.modules.financials_kpis.constants import FINANCIALS_KPIS_CONFIRMATION_FIELDS
from app.modules.financials_kpis.periods import get_financial_periods
from app.modules.financials_kpis.progress import calculate_progress

FINANCIAL_CRITERION_STATES = (
    "reconciled",
    "potential_inconsistency",
    "missing_information",
    "pending_restatement",
    "pending_auditor_confirmation",
    "pending_linked_workstream",
    "pending_kpi_certification",
    "pending_professional_confirmation",
    "not_applicable",
)

FINANCIAL_ASSESSMENT_GROUPS = (
    "reporting_scope_and_periods",
    "financial_statements",
    "restatement_and_audit",
    "other_disclosures",
    "ratios_and_metrics",
    "kpi_governance",
    "mda_and_confirmations",
)

FINANCIAL_ASSESSMENT_GROUP_LABELS = {
    "reporting_scope_and_periods": "Reporting scope and periods",
    "financial_statements": "Financial statements",
    "restatement_and_audit": "Restatement and audit",
    "other_disclosures": "Other disclosures",
    "ratios_and_metrics": "Ratios and metrics",
    "kpi_governance": "KPI governance",
    "mda_and_confirmations": "MD&A and confirmations",
}


def _worst_state(states: list[str]) -> str:
    priority = [
        "potential_inconsistency",
        "missing_information",
        "pending_restatement",
        "pending_auditor_confirmation",
        "pending_linked_workstream",
        "pending_kpi_certification",
        "pending_professional_confirmation",
        "reconciled",
        "not_applicable",
    ]
    for state in priority:
        if state in states:
            return state
    return "missing_information"


def _derive_result(criteria: list[dict[str, Any]]) -> dict[str, str]:
    has_inconsistency = any(c["state"] == "potential_inconsistency" for c in criteria)
    has_pending_restatement = any(c["state"] == "pending_restatement" for c in criteria)
    has_professional = any(
        c["state"]
        in {
            "pending_professional_confirmation",
            "pending_auditor_confirmation",
            "pending_kpi_certification",
        }
        for c in criteria
    )
    missing_count = sum(1 for c in criteria if c["state"] == "missing_information")

    if has_inconsistency:
        return {
            "result": "inconsistencies_identified",
            "resultLabel": "Inconsistencies identified",
            "summary": (
                "One or more reconciliation or cross-workstream checks show a difference "
                "that needs review."
            ),
        }
    if has_pending_restatement:
        return {
            "result": "pending_restatement",
            "resultLabel": "Pending restatement",
            "summary": "Restated financial information is still being prepared or reviewed.",
        }
    if has_professional:
        return {
            "result": "professional_confirmation_required",
            "resultLabel": "Professional confirmation required",
            "summary": "Some items still need auditor, KPI or other professional confirmation.",
        }
    if missing_count > len(criteria) / 2:
        return {
            "result": "insufficient_information",
            "resultLabel": "Disclosure readiness in progress",
            "summary": "Much of the financial and KPI record is still blank or unanswered.",
        }
    return {
        "result": "broadly_reconciled",
        "resultLabel": "Broadly reconciled",
        "summary": "Entered information is largely consistent; remaining gaps are noted below.",
    }


def _reconciliation_state(status: str) -> str:
    if status == "reconciled":
        return "reconciled"
    if status == "variance":
        return "potential_inconsistency"
    if status == "missing_information":
        return "missing_information"
    return "not_applicable"


def build_financial_assessment(
    payload: dict[str, Any],
    model: dict[str, Any],
    progress: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    criteria: list[dict[str, Any]] = []
    periods = get_financial_periods(payload)
    scope = payload.get("reportingScopePeriodsAndAuditorReadiness") or {}
    auditor = scope.get("auditorReadiness") or {}

    criteria.append(
        {
            "id": "periods-defined",
            "group": "reporting_scope_and_periods",
            "label": "Financial periods defined",
            "state": "reconciled" if len(periods) >= 3 else "missing_information",
            "reason": (
                f"{len(periods)} period(s) in the shared registry."
                if len(periods) >= 3
                else "At least three full-year periods plus interim are expected for DRHP financials."
            ),
        }
    )

    criteria.append(
        {
            "id": "auditor-readiness",
            "group": "reporting_scope_and_periods",
            "label": "Auditor readiness captured",
            "state": (
                "reconciled"
                if str(auditor.get("currentStatutoryAuditor") or "").strip()
                else "missing_information"
            ),
            "reason": (
                "Current statutory auditor is recorded."
                if str(auditor.get("currentStatutoryAuditor") or "").strip()
                else "Current statutory auditor is not recorded yet."
            ),
        }
    )

    for check in model.get("reconciliation") or []:
        criteria.append(
            {
                "id": check["id"],
                "group": "financial_statements",
                "label": check["label"],
                "state": _reconciliation_state(check["status"]),
                "reason": check["message"],
            }
        )

    if auditor.get("restatementExerciseStatus") == "under-preparation":
        criteria.append(
            {
                "id": "restatement-in-progress",
                "group": "restatement_and_audit",
                "label": "Restatement exercise in progress",
                "state": "pending_restatement",
                "reason": "Restated financial information is still under preparation.",
            }
        )

    capital = linked_references.get("capitalOwnership") or {}
    if not capital.get("available"):
        criteria.append(
            {
                "id": "capital-ownership-link",
                "group": "other_disclosures",
                "label": "Capital & Ownership link",
                "state": "pending_linked_workstream",
                "reason": "Share capital cross-check awaits Capital & Ownership workspace.",
            }
        )

    ipo = linked_references.get("ipoSetup") or {}
    if not ipo.get("available"):
        criteria.append(
            {
                "id": "ipo-setup-link",
                "group": "ratios_and_metrics",
                "label": "Issue price vs IPO Setup",
                "state": "pending_linked_workstream",
                "reason": "IPO Setup issue price is not yet available for P/E and price/NAV metrics.",
            }
        )

    for row in model.get("smeEligibility") or []:
        states = [row["operatingProfitState"], row["netWorthState"], row["fcfeState"]]
        if "potential_concern" in states:
            state = "potential_inconsistency"
        elif "missing_information" in states:
            state = "missing_information"
        elif "pending_auditor_confirmation" in states:
            state = "pending_auditor_confirmation"
        elif "professional_confirmation_required" in states:
            state = "pending_professional_confirmation"
        else:
            state = "reconciled"
        criteria.append(
            {
                "id": f"sme-{row['periodId']}",
                "group": "ratios_and_metrics",
                "label": f"SME eligibility — {row['periodLabel']}",
                "state": state,
                "reason": (
                    f"Operating profit: {row['operatingProfitState']}; "
                    f"net worth: {row['netWorthState']}; FCFE: {row['fcfeState']}."
                ),
            }
        )

    if model.get("periodComparisonWarnings"):
        criteria.append(
            {
                "id": "period-comparison-warnings",
                "group": "mda_and_confirmations",
                "label": "Invalid period comparisons flagged",
                "state": "potential_inconsistency",
                "reason": (
                    f"{len(model['periodComparisonWarnings'])} variance or comparable-period "
                    "warning(s) require review."
                ),
            }
        )

    confirmations = (
        (payload.get("mdaTrendsMaterialDevelopmentsAndConfirmations") or {}).get("confirmations")
        or {}
    )
    unanswered_confirmations = sum(
        1 for key, _label in FINANCIALS_KPIS_CONFIRMATION_FIELDS if not confirmations.get(key)
    )

    for key, label in FINANCIALS_KPIS_CONFIRMATION_FIELDS:
        criteria.append(
            {
                "id": f"confirmation-{key}",
                "group": "mda_and_confirmations",
                "label": label,
                "state": "reconciled" if confirmations.get(key) else "missing_information",
                "reason": "Confirmed." if confirmations.get(key) else "Not confirmed yet.",
            }
        )

    groups = []
    for group in FINANCIAL_ASSESSMENT_GROUPS:
        group_criteria = [c for c in criteria if c["group"] == group]
        groups.append(
            {
                "group": group,
                "label": FINANCIAL_ASSESSMENT_GROUP_LABELS[group],
                "headlineState": _worst_state([c["state"] for c in group_criteria]),
                "criteria": group_criteria,
            }
        )

    for group in groups:
        group["counts"] = {
            "reconciled": sum(1 for item in group["criteria"] if item["state"] == "reconciled"),
            "potentialInconsistency": sum(
                1 for item in group["criteria"] if item["state"] == "potential_inconsistency"
            ),
            "missingInformation": sum(
                1 for item in group["criteria"] if item["state"] == "missing_information"
            ),
            "pendingRestatement": sum(
                1 for item in group["criteria"] if item["state"] == "pending_restatement"
            ),
            "pendingAuditorConfirmation": sum(
                1 for item in group["criteria"] if item["state"] == "pending_auditor_confirmation"
            ),
            "pendingLinkedWorkstream": sum(
                1 for item in group["criteria"] if item["state"] == "pending_linked_workstream"
            ),
            "pendingKpiCertification": sum(
                1 for item in group["criteria"] if item["state"] == "pending_kpi_certification"
            ),
            "pendingProfessionalConfirmation": sum(
                1
                for item in group["criteria"]
                if item["state"] == "pending_professional_confirmation"
            ),
            "notApplicable": sum(1 for item in group["criteria"] if item["state"] == "not_applicable"),
        }

    counts = {
        "reconciled": sum(1 for c in criteria if c["state"] == "reconciled"),
        "potentialInconsistency": sum(1 for c in criteria if c["state"] == "potential_inconsistency"),
        "missingInformation": sum(1 for c in criteria if c["state"] == "missing_information"),
        "pendingRestatement": sum(1 for c in criteria if c["state"] == "pending_restatement"),
        "pendingAuditorConfirmation": sum(
            1 for c in criteria if c["state"] == "pending_auditor_confirmation"
        ),
        "pendingLinkedWorkstream": sum(
            1 for c in criteria if c["state"] == "pending_linked_workstream"
        ),
        "pendingKpiCertification": sum(
            1 for c in criteria if c["state"] == "pending_kpi_certification"
        ),
        "pendingProfessionalConfirmation": sum(
            1 for c in criteria if c["state"] == "pending_professional_confirmation"
        ),
        "notApplicable": sum(1 for c in criteria if c["state"] == "not_applicable"),
    }

    result_info = _derive_result(criteria)
    unreconciled = sum(
        1 for check in model.get("reconciliation") or [] if check["status"] != "reconciled"
    )

    return {
        **result_info,
        "criteria": criteria,
        "groups": groups,
        "counts": counts,
        "metrics": {
            "periods": len(periods),
            "sectionsComplete": progress["sectionsComplete"],
            "unansweredConfirmations": unanswered_confirmations,
            "unreconciledChecks": unreconciled,
            "blockingConcerns": counts["potentialInconsistency"],
        },
    }


def assess_financials_kpis(
    payload: dict[str, Any],
    linked_references: dict[str, Any] | None = None,
) -> dict[str, Any]:
    linked = linked_references or {}
    progress = calculate_progress(payload)
    model = compute_financials_kpis_model(payload, linked)
    return build_financial_assessment(payload, model, progress, linked)
