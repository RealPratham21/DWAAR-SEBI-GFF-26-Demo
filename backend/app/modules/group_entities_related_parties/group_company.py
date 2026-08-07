"""ICDR Group Company determination and exclusion logic."""

from __future__ import annotations

from typing import Any

from app.modules.group_entities_related_parties.entities import get_entity_by_id


SUBSIDIARY_CLASSIFICATIONS = frozenset(
    {"subsidiary", "step-down-subsidiary", "holding-company"}
)
PROMOTER_EXCLUSION_BADGES = frozenset({"promoter-group-entity"})


def is_subsidiary_or_promoter_entity(payload: dict[str, Any], entity_id: str) -> bool:
    entity = get_entity_by_id(payload, entity_id)
    if entity is None:
        return False
    badges = set(entity.get("classificationBadges") or [])
    if badges & PROMOTER_EXCLUSION_BADGES:
        return True
    classification = payload.get("groupCompanyAndMaterialityClassification") or {}
    for record in classification.get("entityClassifications") or []:
        if not isinstance(record, dict) or record.get("entityId") != entity_id:
            continue
        if record.get("classificationType") in SUBSIDIARY_CLASSIFICATIONS:
            return True
    return False


def should_exclude_from_icdr_group_company(
    payload: dict[str, Any],
    determination: dict[str, Any],
) -> bool:
    entity_id = str(determination.get("entityId") or "")
    if not entity_id:
        return False
    if determination.get("isPromoter") == "yes":
        return True
    if determination.get("isCurrentSubsidiary") == "yes":
        return True
    return is_subsidiary_or_promoter_entity(payload, entity_id)


def evaluate_icdr_determination_readiness(
    payload: dict[str, Any],
    determination: dict[str, Any],
) -> dict[str, Any]:
    entity_id = str(determination.get("entityId") or "")
    excluded = should_exclude_from_icdr_group_company(payload, determination)
    state = str(determination.get("classificationState") or "")

    if excluded and state in ("identified", "potentially_identified"):
        return {
            "readinessState": "potential_inconsistency",
            "reason": "Subsidiary or promoter entity should not be duplicated as an ICDR Group Company.",
            "excluded": True,
        }

    if not entity_id:
        return {
            "readinessState": "missing_information",
            "reason": "Entity not selected for ICDR Group Company determination.",
            "excluded": False,
        }

    if determination.get("isCompany") != "yes":
        return {
            "readinessState": "not_applicable" if determination.get("isCompany") == "no" else "missing_information",
            "reason": "Entity is not treated as a company for ICDR Group Company analysis.",
            "excluded": excluded,
        }

    if excluded:
        return {
            "readinessState": "appears_consistent",
            "reason": "Entity excluded from ICDR Group Company list as subsidiary/promoter.",
            "excluded": True,
        }

    if state == "pending_board_determination":
        return {
            "readinessState": "pending_board_determination",
            "reason": "Board determination pending for ICDR Group Company classification.",
            "excluded": False,
        }

    if state == "pending_financial_reconciliation":
        return {
            "readinessState": "financial_reconciliation_pending",
            "reason": "Financial reconciliation pending before ICDR Group Company confirmation.",
            "excluded": False,
        }

    if state == "pending_professional_confirmation":
        return {
            "readinessState": "pending_professional_confirmation",
            "reason": "Professional confirmation pending for ICDR Group Company classification.",
            "excluded": False,
        }

    if state in ("identified", "potentially_identified"):
        return {
            "readinessState": "appears_consistent",
            "reason": "ICDR Group Company candidate recorded with supporting flags.",
            "excluded": False,
        }

    if state == "not_group_company":
        return {
            "readinessState": "appears_consistent",
            "reason": "Entity explicitly recorded as not a Group Company.",
            "excluded": False,
        }

    return {
        "readinessState": "missing_information",
        "reason": "ICDR Group Company classification not yet determined.",
        "excluded": False,
    }


def summarize_icdr_group_company_readiness(payload: dict[str, Any]) -> dict[str, Any]:
    classification = payload.get("groupCompanyAndMaterialityClassification") or {}
    determinations = [
        d for d in (classification.get("icdrGroupCompanyDeterminations") or []) if isinstance(d, dict)
    ]
    evaluations = [
        evaluate_icdr_determination_readiness(payload, determination)
        for determination in determinations
    ]
    excluded_count = sum(1 for item in evaluations if item.get("excluded"))
    pending_board = sum(
        1
        for determination in determinations
        if determination.get("classificationState") == "pending_board_determination"
    )
    identified_count = sum(
        1
        for determination in determinations
        if determination.get("classificationState") in ("identified", "potentially_identified")
        and not should_exclude_from_icdr_group_company(payload, determination)
    )
    return {
        "determinationCount": len(determinations),
        "identifiedCount": identified_count,
        "excludedCount": excluded_count,
        "pendingBoardCount": pending_board,
        "evaluations": evaluations,
    }
