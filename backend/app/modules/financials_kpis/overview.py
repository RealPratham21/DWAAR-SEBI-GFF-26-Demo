"""Overview summary derived from Financials & KPIs payload — ports frontend overview.ts."""

from __future__ import annotations

from typing import Any

from app.modules.financials_kpis.assessment import build_financial_assessment
from app.modules.financials_kpis.compute import compute_financials_kpis_model
from app.modules.financials_kpis.constants import SECTION_LABELS
from app.modules.financials_kpis.periods import get_financial_periods
from app.modules.financials_kpis.progress import calculate_progress


def _reconciliation_concerns_from(checks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "id": check["id"],
            "label": check["label"],
            "message": check["message"],
            "periodLabel": check["periodId"],
        }
        for check in checks
        if check["status"] in {"variance", "missing_information"}
    ]


def build_overview_summary(
    payload: dict[str, Any],
    linked_references: dict[str, Any] | None = None,
) -> dict[str, Any]:
    linked = linked_references or {}
    progress = calculate_progress(payload)
    model = compute_financials_kpis_model(payload, linked)
    assessment = build_financial_assessment(payload, model, progress, linked)

    periods = get_financial_periods(payload)
    pl_rows = model.get("plByPeriod") or []
    latest_pl = pl_rows[-1] if pl_rows else None

    sections_in_progress = sum(
        1 for status in progress["sections"].values() if status == "in_progress"
    )
    reconciliation = model.get("reconciliation") or []
    reconciled_checks_count = sum(1 for check in reconciliation if check["status"] == "reconciled")
    variance_checks_count = sum(1 for check in reconciliation if check["status"] == "variance")
    missing_information_checks_count = sum(
        1 for check in reconciliation if check["status"] == "missing_information"
    )

    incomplete_sections = [
        (section_id, status)
        for section_id, status in progress["sections"].items()
        if status != "complete"
    ]
    recommended_next_actions = [
        {
            "sectionId": section_id,
            "label": f"Continue with {SECTION_LABELS[section_id]}",
        }
        for section_id, _status in incomplete_sections[:4]
    ]

    return {
        "sectionStatuses": progress["sections"],
        "sectionsComplete": progress["sectionsComplete"],
        "sectionsInProgress": sections_in_progress,
        "totalSections": progress["totalSections"],
        "overallStatus": progress["overallStatus"],
        "periodLabels": [
            str(period.get("label") or "")
            for period in periods
            if str(period.get("label") or "").strip()
        ],
        "latestPeriodLabel": model.get("latestPeriodLabel") or "",
        "displayUnit": model.get("displayUnit") or "",
        "fullYearPeriodCount": sum(
            1 for period in periods if period.get("fullYearOrInterim") == "full-year"
        ),
        "interimPeriodCount": sum(
            1 for period in periods if period.get("fullYearOrInterim") == "interim"
        ),
        "entityCount": len(
            (payload.get("reportingScopePeriodsAndAuditorReadiness") or {}).get("reportingEntities")
            or []
        ),
        "plLineCount": len(
            (payload.get("restatedStatementOfProfitAndLoss") or {}).get("plLineValues") or []
        ),
        "kpiCount": len(
            (payload.get("kpiSelectionGovernanceAndPeerComparison") or {}).get("kpiRegister") or []
        ),
        "reconciledChecksCount": reconciled_checks_count,
        "varianceChecksCount": variance_checks_count,
        "missingInformationChecksCount": missing_information_checks_count,
        "reconciliationConcerns": _reconciliation_concerns_from(reconciliation),
        "periodComparisonWarnings": model.get("periodComparisonWarnings") or [],
        "assessmentResult": assessment["result"],
        "assessmentResultLabel": assessment["resultLabel"],
        "assessmentSummary": assessment["summary"],
        "recommendedNextActions": recommended_next_actions,
        "latestRevenue": (latest_pl or {}).get("revenueFromOperations") or "",
        "latestProfitAfterTax": (latest_pl or {}).get("profitAfterTax") or "",
        "latestEbitda": (latest_pl or {}).get("ebitda") or "",
    }
