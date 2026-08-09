"""Workstream progress aggregation for reports (G7)."""

from __future__ import annotations

from typing import Any

from app.modules.borrowings_assets_contracts.progress import calculate_borrowings_assets_contracts_progress
from app.modules.business_operations.progress import calculate_progress as calculate_business_operations_progress
from app.modules.capital_ownership.progress import calculate_progress as calculate_capital_ownership_progress
from app.modules.company_incorporation.progress import calculate_progress as calculate_ci_progress
from app.modules.drhp.constants import WORKSTREAM_SLUGS
from app.modules.drhp.workstreams import WorkstreamSnapshot, load_all_workstreams
from app.modules.financials_kpis.progress import calculate_progress as calculate_financials_progress
from app.modules.group_entities_related_parties.progress import calculate_group_entities_progress
from app.modules.industry_market.progress import calculate_industry_market_progress
from app.modules.intermediaries_filing.progress import calculate_intermediaries_filing_progress
from app.modules.ipo_setup_eligibility.progress import calculate_progress as calculate_ipo_progress
from app.modules.litigation_approvals_compliance.progress import (
    calculate_litigation_approvals_compliance_progress,
)
from app.modules.management_governance.progress import calculate_management_governance_progress
from app.modules.objects_issue.progress import calculate_progress as calculate_objects_progress
from app.modules.data_room.constants import WORKSTREAM_LABELS
from sqlalchemy.orm import Session

_PROGRESS_CALCULATORS: dict[str, Any] = {
    "company-incorporation": calculate_ci_progress,
    "ipo-setup-eligibility": calculate_ipo_progress,
    "capital-ownership": calculate_capital_ownership_progress,
    "business-operations": calculate_business_operations_progress,
    "objects-of-issue": calculate_objects_progress,
    "financials-kpis": calculate_financials_progress,
    "management-governance": calculate_management_governance_progress,
    "industry-market": calculate_industry_market_progress,
    "group-entities-related-parties": calculate_group_entities_progress,
    "borrowings-assets-contracts": calculate_borrowings_assets_contracts_progress,
    "litigation-approvals-compliance": calculate_litigation_approvals_compliance_progress,
    "intermediaries-filing": calculate_intermediaries_filing_progress,
}


def workstream_label(slug: str) -> str:
    return WORKSTREAM_LABELS.get(slug, slug.replace("-", " ").title())


def build_workstream_progress(db: Session, user_id) -> list[dict[str, Any]]:
    snapshots = load_all_workstreams(db, user_id)
    rows: list[dict[str, Any]] = []
    for slug in WORKSTREAM_SLUGS:
        snapshot = snapshots.get(slug)
        if snapshot is None:
            rows.append(
                {
                    "workstreamKey": slug,
                    "workstreamLabel": workstream_label(slug),
                    "overallStatus": "not_started",
                    "sectionsComplete": 0,
                    "totalSections": 0,
                }
            )
            continue
        calc = _PROGRESS_CALCULATORS[slug]
        progress = calc(snapshot.payload)
        rows.append(
            {
                "workstreamKey": slug,
                "workstreamLabel": workstream_label(slug),
                "overallStatus": progress.get("overallStatus", "not_started"),
                "sectionsComplete": int(progress.get("sectionsComplete") or 0),
                "totalSections": int(progress.get("totalSections") or 0),
            }
        )
    return rows


def summarize_workstreams(rows: list[dict[str, Any]]) -> dict[str, int]:
    complete = sum(1 for row in rows if row["overallStatus"] == "complete")
    in_progress = sum(1 for row in rows if row["overallStatus"] == "in_progress")
    not_started = sum(1 for row in rows if row["overallStatus"] == "not_started")
    return {
        "complete": complete,
        "inProgress": in_progress,
        "notStarted": not_started,
        "total": len(rows),
    }
