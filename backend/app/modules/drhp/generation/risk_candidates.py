"""Build grounded risk candidates for Risk Factors chapter."""

from __future__ import annotations

from typing import Any

from app.modules.drhp.generation.source_refs import make_source_ref
from app.modules.drhp.sources.models import SourceRef
from app.modules.drhp.workstreams import WorkstreamSnapshot


def build_risk_candidate_registry(
    snapshots: dict[str, WorkstreamSnapshot],
) -> tuple[list[dict[str, Any]], list[SourceRef]]:
    candidates: list[dict[str, Any]] = []
    refs: list[SourceRef] = []

    bo = snapshots.get("business-operations")
    if bo:
        payload = bo.payload
        section = payload.get("customersSalesDistributionAndGeography") or payload.get(
            "customersSalesDistributionGeography"
        )
        if isinstance(section, dict):
            periods = section.get("customerConcentrationPeriods") or []
            if periods:
                period = periods[0]
                share = period.get("largestCustomerPercentage") or period.get("top3Percentage")
                if share:
                    ref = make_source_ref(
                        workstream="business-operations",
                        section="customers-sales-distribution-geography",
                        field_path="customerConcentrationPeriods[0].largestCustomerPercentage",
                        label="Top customer concentration",
                        value=share,
                        record_id=str(period.get("id") or ""),
                        version=bo.version,
                    )
                    refs.append(ref)
                    candidates.append(
                        {
                            "riskCandidateId": "risk:customer-concentration",
                            "category": "business_concentration",
                            "headingSeed": "Customer concentration",
                            "sourceRefIds": [ref.ref_id],
                            "priorityScore": 80,
                        }
                    )
            customers = section.get("materialCustomers") or section.get("customers") or []
            if customers and not candidates:
                top = customers[0]
                share = top.get("revenueContributionPercentage") or top.get("revenueContributionPct")
                if share:
                    ref = make_source_ref(
                        workstream="business-operations",
                        section="customers-sales-distribution-geography",
                        field_path="materialCustomers[0].revenueContributionPercentage",
                        label="Top customer concentration",
                        value=share,
                        record_id=str(top.get("id") or ""),
                        version=bo.version,
                    )
                    refs.append(ref)
                    candidates.append(
                        {
                            "riskCandidateId": "risk:customer-concentration",
                            "category": "business_concentration",
                            "headingSeed": "Customer concentration",
                            "sourceRefIds": [ref.ref_id],
                            "priorityScore": 80,
                        }
                    )

    fin = snapshots.get("financials-kpis")
    if fin:
        ratios = fin.payload.get("ratiosCapitalisationAndIssuePriceMetrics") or {}
        debt_equity = ratios.get("debtEquityRatio") or ratios.get("totalDebtToEquity") or ratios.get(
            "totalDebtEquityRatio"
        )
        if debt_equity:
            ref = make_source_ref(
                workstream="financials-kpis",
                section="ratios-capitalisation-issue-price",
                field_path="ratiosCapitalisationAndIssuePriceMetrics.debtEquityRatio",
                label="Debt-equity ratio",
                value=debt_equity,
                version=fin.version,
            )
            refs.append(ref)
            candidates.append(
                {
                    "riskCandidateId": "risk:leverage",
                    "category": "financial_leverage",
                    "headingSeed": "Leverage and indebtedness",
                    "sourceRefIds": [ref.ref_id],
                    "priorityScore": 75,
                }
            )

    lac = snapshots.get("litigation-approvals-compliance")
    if lac:
        matters = (
            (lac.payload.get("litigationAndProceedingsMaster") or {}).get("matters")
            or lac.payload.get("litigationProceedingsMaster", {}).get("matters")
            or []
        )
        for matter in matters[:5]:
            if not isinstance(matter, dict):
                continue
            identity = matter.get("identity") if isinstance(matter.get("identity"), dict) else matter
            stage = matter.get("datesAndStage") if isinstance(matter.get("datesAndStage"), dict) else {}
            subsisting = str(stage.get("currentSubsisting") or "").lower()
            current_stage = str(stage.get("currentStage") or matter.get("status") or "").lower()
            if subsisting not in {"yes", "true", "1"} and current_stage in {"closed", "disposed", "settled"}:
                continue
            title = identity.get("matterTitle") or matter.get("matterTitle") or "Legal proceeding"
            ref = make_source_ref(
                workstream="litigation-approvals-compliance",
                section="litigation-proceedings",
                field_path=f"litigationAndProceedingsMaster.matters[{matter.get('matterId', '0')}]",
                label="Legal proceeding",
                value=title,
                record_id=str(matter.get("matterId") or matter.get("id") or ""),
                version=lac.version,
            )
            refs.append(ref)
            candidates.append(
                {
                    "riskCandidateId": f"risk:legal:{matter.get('matterId', matter.get('id', '0'))}",
                    "category": "legal_regulatory",
                    "headingSeed": title[:120],
                    "sourceRefIds": [ref.ref_id],
                    "priorityScore": 90,
                }
            )
            break

    candidates.sort(key=lambda item: item.get("priorityScore", 0), reverse=True)
    return candidates, refs
