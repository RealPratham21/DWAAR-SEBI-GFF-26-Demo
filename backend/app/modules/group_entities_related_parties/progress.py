"""Section completion for Group Entities & Related Parties."""

from __future__ import annotations

from typing import Any, Callable

from app.modules.group_entities_related_parties import decimal_utils as dm
from app.modules.group_entities_related_parties.constants import (
    GROUP_ENTITIES_CONFIRMATION_FIELDS,
    SECTION_IDS,
)


def _filled(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, bool):
        return value
    if isinstance(value, list):
        return len(value) > 0
    return True


def _status_from(answered: int, total: int, extra_complete: bool = True) -> str:
    if answered == 0:
        return "not_started"
    if answered < total or not extra_complete:
        return "in_progress"
    return "complete"


def evaluate_entity_master_status(payload: dict[str, Any]) -> str:
    section = payload.get("groupStructureAndEntityMaster") or {}
    snapshot = section.get("groupSnapshot") or {}
    core = [
        _filled(snapshot.get("structureAsOfDate")),
        _filled(snapshot.get("subsidiariesExist")) or _filled(snapshot.get("associatesExist")),
        len(section.get("entities") or []) > 0,
    ]
    answered = sum(1 for item in core if item)
    entities = [e for e in (section.get("entities") or []) if isinstance(e, dict)]
    entities_complete = all(
        _filled(entity.get("entityType")) and _filled((entity.get("identity") or {}).get("legalName"))
        for entity in entities
    )
    return _status_from(answered, len(core), entities_complete)


def evaluate_ownership_status(payload: dict[str, Any]) -> str:
    section = payload.get("ownershipControlAndRelationshipMapping") or {}
    has_data = bool(
        section.get("ownershipRelationships")
        or section.get("contractualArrangements")
        or section.get("commonPersonRelationships")
    )
    if not has_data:
        return "not_started"
    complete = all(
        _filled(rel.get("parentPartyEntityId"))
        and _filled(rel.get("investeeEntityId"))
        and _filled(rel.get("relationshipType"))
        for rel in (section.get("ownershipRelationships") or [])
        if isinstance(rel, dict)
    )
    return "complete" if complete else "in_progress"


def evaluate_classification_status(payload: dict[str, Any]) -> str:
    section = payload.get("groupCompanyAndMaterialityClassification") or {}
    policy = section.get("materialityPolicy") or {}
    core = [
        bool(section.get("entityClassifications") or section.get("icdrGroupCompanyDeterminations")),
        _filled(policy.get("policyExists")),
        bool(section.get("materialityCriteria")) or _filled(policy.get("adopted")),
    ]
    answered = sum(1 for item in core if item)
    return _status_from(answered, len(core))


def evaluate_related_party_universe_status(payload: dict[str, Any]) -> str:
    relationships = (payload.get("relatedPartyUniverseAndClassification") or {}).get(
        "relatedPartyRelationships"
    ) or []
    if not relationships:
        return "not_started"
    complete = all(
        _filled(rp.get("partyType"))
        and _filled(rp.get("relationshipCategory"))
        and (_filled(rp.get("linkedEntityId")) or _filled(rp.get("linkedPersonId")))
        and any(
            _filled(fc.get("framework")) and _filled(fc.get("related"))
            for fc in (rp.get("frameworkClassifications") or [])
            if isinstance(fc, dict)
        )
        for rp in relationships
        if isinstance(rp, dict)
    )
    return "complete" if complete else "in_progress"


def evaluate_rpt_status(payload: dict[str, Any]) -> str:
    section = payload.get("relatedPartyTransactionsBalancesAndCommitments") or {}
    transactions = section.get("transactions") or []
    balances = section.get("balances") or []
    if not transactions and not balances:
        return "not_started"
    tx_complete = all(
        _filled(tx.get("relatedPartyRelationshipId"))
        and _filled(tx.get("financialPeriod"))
        and (_filled(tx.get("transactionType")) or dm.is_filled(str(tx.get("transactionValue") or "")))
        for tx in transactions
        if isinstance(tx, dict)
    )
    return "complete" if tx_complete else "in_progress"


def evaluate_common_pursuits_status(payload: dict[str, Any]) -> str:
    section = payload.get("commonPursuitsDependenciesAndConflicts") or {}
    has_data = bool(
        section.get("commonPursuitScreenings")
        or section.get("commonPursuitRecords")
        or section.get("interCompanyDependencies")
    )
    if not has_data:
        return "not_started"
    return "in_progress"


def evaluate_financial_readiness_status(payload: dict[str, Any]) -> str:
    records = (payload.get("groupEntityFinancialRegulatoryAndLitigationReadiness") or {}).get(
        "entityFinancialReadiness"
    ) or []
    if not records:
        return "not_started"
    complete = all(
        _filled(record.get("entityId")) and _filled(record.get("financialInformationAvailable"))
        for record in records
        if isinstance(record, dict)
    )
    return "complete" if complete else "in_progress"


def evaluate_changes_confirmations_status(payload: dict[str, Any]) -> str:
    confirmations = (payload.get("changesRptReadinessAndConfirmations") or {}).get(
        "confirmations"
    ) or {}
    answered = sum(
        1 for key, _ in GROUP_ENTITIES_CONFIRMATION_FIELDS if confirmations.get(key) not in (None, "")
    )
    if answered == 0:
        return "not_started"
    if answered < len(GROUP_ENTITIES_CONFIRMATION_FIELDS):
        return "in_progress"
    return "complete"


SECTION_EVALUATORS: dict[str, Callable[[dict[str, Any]], str]] = {
    "group-structure-and-entity-master": evaluate_entity_master_status,
    "ownership-control-and-relationship-mapping": evaluate_ownership_status,
    "group-company-and-materiality-classification": evaluate_classification_status,
    "related-party-universe-and-classification": evaluate_related_party_universe_status,
    "related-party-transactions-balances-and-commitments": evaluate_rpt_status,
    "common-pursuits-dependencies-and-conflicts": evaluate_common_pursuits_status,
    "group-entity-financial-regulatory-and-litigation-readiness": evaluate_financial_readiness_status,
    "changes-rpt-readiness-and-confirmations": evaluate_changes_confirmations_status,
}


def calculate_group_entities_progress(payload: dict[str, Any]) -> dict[str, Any]:
    sections = {section_id: SECTION_EVALUATORS[section_id](payload) for section_id in SECTION_IDS}
    sections_complete = sum(1 for status in sections.values() if status == "complete")
    total_sections = len(sections)
    if sections_complete == 0:
        overall_status = "not_started"
    elif sections_complete == total_sections:
        overall_status = "complete"
    else:
        overall_status = "in_progress"
    return {
        "sections": sections,
        "sectionsComplete": sections_complete,
        "totalSections": total_sections,
        "overallStatus": overall_status,
    }
