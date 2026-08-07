"""Cross-record reference integrity for Group Entities & Related Parties."""

from __future__ import annotations

from typing import Any

from app.modules.group_entities_related_parties.constants import SECTION_LABELS


def count_entity_references(payload: dict[str, Any], entity_id: str) -> list[dict[str, Any]]:
    if not entity_id:
        return []
    deps: list[dict[str, Any]] = []

    def push(
        category: str,
        record_id: str,
        section_id: str,
        label: str,
    ) -> None:
        deps.append(
            {
                "category": category,
                "recordId": record_id,
                "sectionId": section_id,
                "label": label,
            }
        )

    ownership = payload.get("ownershipControlAndRelationshipMapping") or {}
    for rel in ownership.get("ownershipRelationships") or []:
        if not isinstance(rel, dict):
            continue
        if rel.get("parentPartyEntityId") == entity_id or rel.get("investeeEntityId") == entity_id:
            push(
                "ownership-relationship",
                str(rel.get("id") or ""),
                "ownership-control-and-relationship-mapping",
                "Ownership relationship",
            )

    for arrangement in ownership.get("contractualArrangements") or []:
        if not isinstance(arrangement, dict):
            continue
        if entity_id in (arrangement.get("partyEntityIds") or []):
            push(
                "contractual-arrangement",
                str(arrangement.get("id") or ""),
                "ownership-control-and-relationship-mapping",
                "Contractual arrangement",
            )

    for rel in ownership.get("commonPersonRelationships") or []:
        if not isinstance(rel, dict):
            continue
        if entity_id in (rel.get("entityIds") or []):
            push(
                "ownership-relationship",
                str(rel.get("id") or ""),
                "ownership-control-and-relationship-mapping",
                "Common-person relationship",
            )

    classification = payload.get("groupCompanyAndMaterialityClassification") or {}
    for record in classification.get("entityClassifications") or []:
        if isinstance(record, dict) and record.get("entityId") == entity_id:
            push(
                "entity-classification",
                str(record.get("id") or ""),
                "group-company-and-materiality-classification",
                "Entity classification",
            )

    for determination in classification.get("icdrGroupCompanyDeterminations") or []:
        if isinstance(determination, dict) and determination.get("entityId") == entity_id:
            push(
                "icdr-determination",
                str(determination.get("entityId") or ""),
                "group-company-and-materiality-classification",
                "ICDR Group Company determination",
            )

    for record in classification.get("materialSubsidiaryPurposeRecords") or []:
        if isinstance(record, dict) and record.get("entityId") == entity_id:
            push(
                "material-subsidiary-purpose",
                str(record.get("id") or ""),
                "group-company-and-materiality-classification",
                "Material-subsidiary purpose record",
            )

    related_parties = payload.get("relatedPartyUniverseAndClassification") or {}
    for rp in related_parties.get("relatedPartyRelationships") or []:
        if isinstance(rp, dict) and rp.get("linkedEntityId") == entity_id:
            push(
                "related-party-relationship",
                str(rp.get("id") or ""),
                "related-party-universe-and-classification",
                "Related-party relationship",
            )

    rpt_section = payload.get("relatedPartyTransactionsBalancesAndCommitments") or {}
    for tx in rpt_section.get("transactions") or []:
        if isinstance(tx, dict) and tx.get("linkedEntityId") == entity_id:
            push(
                "rpt-transaction",
                str(tx.get("id") or ""),
                "related-party-transactions-balances-and-commitments",
                "RPT transaction",
            )

    for balance in rpt_section.get("balances") or []:
        if isinstance(balance, dict) and balance.get("linkedEntityId") == entity_id:
            push(
                "rpt-balance",
                str(balance.get("id") or ""),
                "related-party-transactions-balances-and-commitments",
                "RPT balance",
            )

    pursuits = payload.get("commonPursuitsDependenciesAndConflicts") or {}
    for screening in pursuits.get("commonPursuitScreenings") or []:
        if isinstance(screening, dict) and screening.get("entityId") == entity_id:
            push(
                "common-pursuit",
                str(screening.get("entityId") or ""),
                "common-pursuits-dependencies-and-conflicts",
                "Common-pursuit screening",
            )

    for record in pursuits.get("commonPursuitRecords") or []:
        if isinstance(record, dict) and record.get("entityId") == entity_id:
            push(
                "common-pursuit",
                str(record.get("id") or ""),
                "common-pursuits-dependencies-and-conflicts",
                "Common-pursuit record",
            )

    for dep in pursuits.get("interCompanyDependencies") or []:
        if isinstance(dep, dict) and dep.get("entityId") == entity_id:
            push(
                "dependency",
                str(dep.get("id") or ""),
                "common-pursuits-dependencies-and-conflicts",
                "Inter-company dependency",
            )

    for interest in pursuits.get("otherBusinessInterests") or []:
        if isinstance(interest, dict) and interest.get("entityId") == entity_id:
            push(
                "other-business-interest",
                str(interest.get("id") or ""),
                "common-pursuits-dependencies-and-conflicts",
                "Other business interest",
            )

    readiness_section = payload.get("groupEntityFinancialRegulatoryAndLitigationReadiness") or {}
    for readiness in readiness_section.get("entityFinancialReadiness") or []:
        if isinstance(readiness, dict) and readiness.get("entityId") == entity_id:
            push(
                "financial-readiness",
                str(readiness.get("id") or ""),
                "group-entity-financial-regulatory-and-litigation-readiness",
                "Entity financial readiness",
            )

    changes = payload.get("changesRptReadinessAndConfirmations") or {}
    for change in changes.get("relationshipChanges") or []:
        if isinstance(change, dict) and change.get("entityId") == entity_id:
            push(
                "relationship-change",
                str(change.get("id") or ""),
                "changes-rpt-readiness-and-confirmations",
                "Relationship change",
            )

    return deps


def format_entity_dependency_message(deps: list[dict[str, Any]]) -> str:
    if not deps:
        return ""
    sections = sorted(
        {SECTION_LABELS.get(str(dep.get("sectionId") or ""), str(dep.get("sectionId") or "")) for dep in deps}
    )
    return (
        f"This entity is referenced in {len(deps)} record(s) across: "
        f"{', '.join(sections)}. Remove or reassign dependent records first."
    )


def count_related_party_references(payload: dict[str, Any], related_party_id: str) -> int:
    if not related_party_id:
        return 0
    count = 0
    rpt_section = payload.get("relatedPartyTransactionsBalancesAndCommitments") or {}
    for tx in rpt_section.get("transactions") or []:
        if isinstance(tx, dict) and tx.get("relatedPartyRelationshipId") == related_party_id:
            count += 1
    for balance in rpt_section.get("balances") or []:
        if isinstance(balance, dict) and balance.get("relatedPartyRelationshipId") == related_party_id:
            count += 1
    return count
