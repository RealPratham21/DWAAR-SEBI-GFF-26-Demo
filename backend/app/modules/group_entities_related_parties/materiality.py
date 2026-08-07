"""Group Company materiality evaluation helpers."""

from __future__ import annotations

from typing import Any

from app.modules.group_entities_related_parties import decimal_utils as dm


def _metric_value_from_readiness(
    readiness: dict[str, Any] | None,
    metric_type: str,
) -> str:
    if readiness is None:
        return ""
    for summary in readiness.get("financialPeriodSummaries") or []:
        if not isinstance(summary, dict):
            continue
        if metric_type == "revenue" and dm.is_filled(str(summary.get("revenueTurnover") or "")):
            return str(summary.get("revenueTurnover") or "")
        if metric_type == "net-worth" and dm.is_filled(str(summary.get("netWorth") or "")):
            return str(summary.get("netWorth") or "")
        if metric_type == "turnover" and dm.is_filled(str(summary.get("revenueTurnover") or "")):
            return str(summary.get("revenueTurnover") or "")
    return ""


def evaluate_materiality_criterion(
    payload: dict[str, Any],
    criterion: dict[str, Any],
) -> dict[str, Any]:
    metric_type = str(criterion.get("metricType") or "")
    threshold_type = str(criterion.get("thresholdType") or "")
    threshold_value = str(criterion.get("thresholdValue") or "")

    if not metric_type or not threshold_type:
        return {
            "state": "missing_information",
            "reason": "Materiality criterion metric or threshold type not captured.",
            "meetsThreshold": None,
        }

    if threshold_type == "qualitative":
        return {
            "state": "appears_consistent" if threshold_value.strip() else "missing_information",
            "reason": "Qualitative materiality criterion recorded."
            if threshold_value.strip()
            else "Qualitative materiality criterion lacks description.",
            "meetsThreshold": None,
        }

    if not dm.is_filled(threshold_value):
        return {
            "state": "missing_information",
            "reason": "Materiality threshold value not captured.",
            "meetsThreshold": None,
        }

    readiness_section = payload.get("groupEntityFinancialRegulatoryAndLitigationReadiness") or {}
    readiness_records = [
        r for r in (readiness_section.get("entityFinancialReadiness") or []) if isinstance(r, dict)
    ]
    observed_values = [
        _metric_value_from_readiness(record, metric_type)
        for record in readiness_records
        if _metric_value_from_readiness(record, metric_type)
    ]

    if not observed_values:
        return {
            "state": "missing_information",
            "reason": "No entity financial values available to evaluate this materiality criterion.",
            "meetsThreshold": None,
        }

    threshold = dm.parse_decimal(threshold_value)
    if threshold is None:
        return {
            "state": "potential_inconsistency",
            "reason": "Materiality threshold is not a valid decimal value.",
            "meetsThreshold": None,
        }

    meets_any = False
    for value in observed_values:
        parsed = dm.parse_decimal(value)
        if parsed is None:
            continue
        if threshold_type == "percentage":
            if parsed >= threshold:
                meets_any = True
                break
        elif threshold_type == "amount":
            if parsed >= threshold:
                meets_any = True
                break

    return {
        "state": "appears_consistent" if meets_any else "potential_classification",
        "reason": "At least one entity meets the recorded materiality threshold."
        if meets_any
        else "No entity values currently meet the recorded materiality threshold.",
        "meetsThreshold": meets_any,
    }


def evaluate_materiality_policy_readiness(policy: dict[str, Any]) -> dict[str, Any]:
    if policy.get("policyExists") != "yes":
        return {
            "state": "missing_information",
            "label": "Not captured",
            "reason": "Group Company Materiality Policy not yet captured.",
        }
    if policy.get("adopted") == "yes":
        return {
            "state": "appears_consistent",
            "label": "Adopted",
            "reason": "Materiality Policy recorded and marked as adopted.",
        }
    return {
        "state": "potential_classification",
        "label": "Recorded — adoption pending",
        "reason": "Materiality Policy recorded but adoption not confirmed.",
    }


def summarize_materiality_evaluation(payload: dict[str, Any]) -> dict[str, Any]:
    classification = payload.get("groupCompanyAndMaterialityClassification") or {}
    criteria = [
        c for c in (classification.get("materialityCriteria") or []) if isinstance(c, dict)
    ]
    evaluations = [evaluate_materiality_criterion(payload, criterion) for criterion in criteria]
    policy = evaluate_materiality_policy_readiness(classification.get("materialityPolicy") or {})
    return {
        "policy": policy,
        "criteriaCount": len(criteria),
        "criteriaEvaluations": evaluations,
        "criteriaMeetingThreshold": sum(1 for item in evaluations if item.get("meetsThreshold") is True),
    }
