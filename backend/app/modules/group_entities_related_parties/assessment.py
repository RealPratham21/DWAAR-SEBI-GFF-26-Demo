"""Deterministic Group & RPT Assessment — authoritative backend implementation."""

from __future__ import annotations

from typing import Any

from app.modules.group_entities_related_parties.compute import compute_group_entities_model
from app.modules.group_entities_related_parties.constants import (
    GROUP_ASSESSMENT_GROUP_LABELS,
    GROUP_ASSESSMENT_GROUPS,
    GROUP_ASSESSMENT_RESULT_STATES,
    GROUP_CRITERION_STATE_LABELS,
    GROUP_ENTITIES_CONFIRMATION_FIELDS,
)
from app.modules.group_entities_related_parties.entities import get_entities, get_entity_by_id
from app.modules.group_entities_related_parties.progress import calculate_group_entities_progress

RESULT_LABELS = {
    "insufficient_information": "Insufficient information",
    "readiness_in_progress": "Disclosure readiness in progress",
    "classification_gaps_identified": "Classification gaps identified",
    "rpt_gaps_identified": "RPT gaps identified",
    "entity_information_gaps": "Entity information gaps identified",
    "professional_confirmation_required": "Professional confirmation required",
    "pending_linked_workstream": "Pending linked workstream data",
}

WORST_STATE_PRIORITY = [
    "potential_concern",
    "unresolved_relationship",
    "classification_review_required",
    "financial_reconciliation_pending",
    "pending_entity_information",
    "pending_board_determination",
    "pending_linked_workstream",
    "pending_professional_confirmation",
    "missing_information",
    "reconciled",
    "not_applicable",
]


def _worst_state(states: list[str]) -> str:
    for state in WORST_STATE_PRIORITY:
        if state in states:
            return state
    return "missing_information"


def _criterion(
    criterion_id: str,
    group: str,
    label: str,
    state: str,
    reason: str,
    related_section: str,
) -> dict[str, Any]:
    return {
        "id": criterion_id,
        "group": group,
        "label": label,
        "state": state,
        "reason": reason,
        "relatedSection": related_section,
    }


def assess_group_entities(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    progress = calculate_group_entities_progress(payload)
    model = compute_group_entities_model(payload, linked_references)
    criteria: list[dict[str, Any]] = []
    entities = get_entities(payload)

    criteria.append(
        _criterion(
            "entity-master",
            "group_structure",
            "Entity Master created",
            "reconciled" if entities else "missing_information",
            f"{len(entities)} entity record(s) in the canonical Entity Master."
            if entities
            else "No entities recorded in the Entity Master.",
            "group-structure-and-entity-master",
        )
    )

    snapshot = (payload.get("groupStructureAndEntityMaster") or {}).get("groupSnapshot") or {}
    parent_state = "not_applicable"
    if snapshot.get("holdingParentCompanyExists") == "yes":
        parent_state = (
            "missing_information"
            if not any("parent" in (e.get("classificationBadges") or []) for e in entities)
            else "reconciled"
        )
    elif snapshot.get("holdingParentCompanyExists") == "":
        parent_state = "missing_information"
    criteria.append(
        _criterion(
            "parent-identified",
            "group_structure",
            "Parent identified where applicable",
            parent_state,
            "Parent/holding company presence should align with Entity Master badges.",
            "group-structure-and-entity-master",
        )
    )

    subsidiary_state = "not_applicable"
    if snapshot.get("subsidiariesExist") == "yes":
        subsidiary_state = "reconciled" if model["subsidiaryCount"] > 0 else "missing_information"
    criteria.append(
        _criterion(
            "subsidiaries-captured",
            "group_structure",
            "Subsidiaries captured",
            subsidiary_state,
            "Subsidiary snapshot flag should align with subsidiary entities or classifications.",
            "group-structure-and-entity-master",
        )
    )

    ownership = payload.get("ownershipControlAndRelationshipMapping") or {}
    orphan_relationships = [
        rel
        for rel in (ownership.get("ownershipRelationships") or [])
        if isinstance(rel, dict)
        and (
            (rel.get("parentPartyEntityId") and not get_entity_by_id(payload, str(rel.get("parentPartyEntityId"))))
            or (rel.get("investeeEntityId") and not get_entity_by_id(payload, str(rel.get("investeeEntityId"))))
        )
    ]
    criteria.append(
        _criterion(
            "ownership-consistency",
            "ownership_control",
            "Ownership relationships internally consistent",
            "unresolved_relationship"
            if orphan_relationships
            else ("reconciled" if model["ownershipRelationshipCount"] > 0 else "missing_information"),
            f"{len(orphan_relationships)} relationship(s) reference unknown Entity IDs."
            if orphan_relationships
            else (
                "Ownership relationships reference valid Entity IDs."
                if model["ownershipRelationshipCount"] > 0
                else "No ownership relationships recorded."
            ),
            "ownership-control-and-relationship-mapping",
        )
    )

    classification = payload.get("groupCompanyAndMaterialityClassification") or {}
    classifications_without_basis = [
        c
        for c in (classification.get("entityClassifications") or [])
        if isinstance(c, dict) and not str(c.get("basis") or "").strip()
    ]
    criteria.append(
        _criterion(
            "classification-basis",
            "regulatory_classifications",
            "Classifications have stated basis",
            "classification_review_required"
            if classifications_without_basis
            else (
                "reconciled"
                if classification.get("entityClassifications")
                else "missing_information"
            ),
            f"{len(classifications_without_basis)} classification(s) lack a basis."
            if classifications_without_basis
            else "Classification basis captured where classifications exist.",
            "group-company-and-materiality-classification",
        )
    )

    icdr_pending = [
        d
        for d in (classification.get("icdrGroupCompanyDeterminations") or [])
        if isinstance(d, dict) and d.get("classificationState") == "pending_board_determination"
    ]
    criteria.append(
        _criterion(
            "icdr-board-determination",
            "regulatory_classifications",
            "ICDR Group Company Board determinations",
            "pending_board_determination"
            if icdr_pending
            else ("reconciled" if model["icdrGroupCompanyCount"] > 0 else "missing_information"),
            f"{len(icdr_pending)} entity(ies) pending Board determination."
            if icdr_pending
            else "ICDR Group Company candidates reviewed.",
            "group-company-and-materiality-classification",
        )
    )

    policy = classification.get("materialityPolicy") or {}
    criteria.append(
        _criterion(
            "materiality-policy",
            "regulatory_classifications",
            "Group Company Materiality Policy captured",
            "classification_review_required"
            if policy.get("policyExists") == "yes" and policy.get("adopted") != "yes"
            else ("reconciled" if policy.get("policyExists") == "yes" else "missing_information"),
            "Materiality Policy recorded."
            if policy.get("policyExists") == "yes"
            else "Materiality Policy not yet captured.",
            "group-company-and-materiality-classification",
        )
    )

    related_parties = payload.get("relatedPartyUniverseAndClassification") or {}
    rp_without_basis = [
        rp
        for rp in (related_parties.get("relatedPartyRelationships") or [])
        if isinstance(rp, dict)
        and all(not str(fc.get("basisRationale") or "").strip() for fc in (rp.get("frameworkClassifications") or []) if isinstance(fc, dict))
    ]
    criteria.append(
        _criterion(
            "rp-classification-basis",
            "related_party_completeness",
            "Related-party classifications have rationale",
            "classification_review_required"
            if rp_without_basis
            else ("reconciled" if model["relatedPartyCount"] > 0 else "missing_information"),
            f"{len(rp_without_basis)} related-party relationship(s) lack classification rationale."
            if rp_without_basis
            else "Related-party rationale captured where relationships exist.",
            "related-party-universe-and-classification",
        )
    )

    mg = linked_references.get("managementGovernance") or {}
    if not mg.get("available"):
        criteria.append(
            _criterion(
                "linked-mg",
                "related_party_completeness",
                "Directors/KMP from Management & Governance",
                "pending_linked_workstream",
                "Management & Governance linked data not yet available.",
                "related-party-universe-and-classification",
            )
        )

    rpt_section = payload.get("relatedPartyTransactionsBalancesAndCommitments") or {}
    rp_ids = {
        str(rp.get("id"))
        for rp in (related_parties.get("relatedPartyRelationships") or [])
        if isinstance(rp, dict) and rp.get("id")
    }
    orphan_transactions = [
        tx
        for tx in (rpt_section.get("transactions") or [])
        if isinstance(tx, dict)
        and tx.get("relatedPartyRelationshipId")
        and tx.get("relatedPartyRelationshipId") not in rp_ids
    ]
    criteria.append(
        _criterion(
            "rpt-linked-parties",
            "rpt_reconciliation",
            "Transactions linked to valid related parties",
            "unresolved_relationship"
            if orphan_transactions
            else ("reconciled" if model["rptTransactionCount"] > 0 else "missing_information"),
            f"{len(orphan_transactions)} transaction(s) reference unknown related-party IDs."
            if orphan_transactions
            else "RPT transactions reference valid related-party relationships.",
            "related-party-transactions-balances-and-commitments",
        )
    )

    if model["rptSummary"].get("financialsRevenueDifference"):
        criteria.append(
            _criterion(
                "rpt-financials-revenue",
                "rpt_reconciliation",
                "RPT revenue reconciles with Financials",
                "financial_reconciliation_pending",
                f"Calculated RPT sales differ from Financials RPT revenue by "
                f"{model['rptSummary']['financialsRevenueDifference']}.",
                "related-party-transactions-balances-and-commitments",
            )
        )
    elif (linked_references.get("financialsKpis") or {}).get("available") and model["rptTransactionCount"] > 0:
        criteria.append(
            _criterion(
                "rpt-financials-revenue",
                "rpt_reconciliation",
                "RPT revenue reconciles with Financials",
                "reconciled",
                "No material revenue reconciliation difference detected.",
                "related-party-transactions-balances-and-commitments",
            )
        )

    pursuits = payload.get("commonPursuitsDependenciesAndConflicts") or {}
    criteria.append(
        _criterion(
            "common-pursuits-reviewed",
            "common_pursuits_conflicts",
            "Similar businesses reviewed",
            "reconciled"
            if pursuits.get("commonPursuitScreenings")
            else ("missing_information" if len(entities) > 1 else "not_applicable"),
            "Common-pursuit screening should cover relevant group entities.",
            "common-pursuits-dependencies-and-conflicts",
        )
    )

    criteria.append(
        _criterion(
            "entity-information-gaps",
            "group_company_information",
            "Group Company information availability",
            "pending_entity_information"
            if model["pendingEntityInformationCount"] > 0
            else (
                "potential_concern"
                if model["incompleteInformationCount"] > 0
                else (
                    "reconciled"
                    if (payload.get("groupEntityFinancialRegulatoryAndLitigationReadiness") or {}).get(
                        "entityFinancialReadiness"
                    )
                    else "missing_information"
                )
            ),
            f"{model['pendingEntityInformationCount']} entity(ies) with pending/unavailable information."
            if model["pendingEntityInformationCount"] > 0
            else "Entity information status captured.",
            "group-entity-financial-regulatory-and-litigation-readiness",
        )
    )

    if model["negativeNetWorthCount"] > 0:
        criteria.append(
            _criterion(
                "negative-net-worth",
                "group_company_information",
                "Negative net-worth entities disclosed",
                "potential_concern",
                f"{model['negativeNetWorthCount']} entity(ies) flagged with negative net worth.",
                "group-entity-financial-regulatory-and-litigation-readiness",
            )
        )

    fin = linked_references.get("financialsKpis") or {}
    if not fin.get("available"):
        criteria.append(
            _criterion(
                "linked-financials",
                "cross_workstream_consistency",
                "Financials & KPIs linked for RPT reconciliation",
                "pending_linked_workstream",
                "Financials & KPIs linked data not yet available.",
                "related-party-transactions-balances-and-commitments",
            )
        )

    confirmations = (payload.get("changesRptReadinessAndConfirmations") or {}).get("confirmations") or {}
    unanswered_confirmations = sum(
        1 for key, _ in GROUP_ENTITIES_CONFIRMATION_FIELDS if confirmations.get(key) in (None, "")
    )
    criteria.append(
        _criterion(
            "issuer-confirmations",
            "final_readiness",
            "Issuer confirmations",
            "reconciled" if unanswered_confirmations == 0 else "missing_information",
            "All issuer confirmations answered."
            if unanswered_confirmations == 0
            else f"{unanswered_confirmations} confirmation(s) still unanswered.",
            "changes-rpt-readiness-and-confirmations",
        )
    )

    rpt_readiness = (payload.get("changesRptReadinessAndConfirmations") or {}).get("rptReadiness") or {}
    criteria.append(
        _criterion(
            "rpt-readiness",
            "final_readiness",
            "RPT register readiness",
            "reconciled" if rpt_readiness.get("completeRptScheduleAvailable") == "yes" else "missing_information",
            "Complete RPT schedule indicated as available."
            if rpt_readiness.get("completeRptScheduleAvailable") == "yes"
            else "RPT schedule completeness not yet confirmed.",
            "changes-rpt-readiness-and-confirmations",
        )
    )

    counts = {
        "reconciled": 0,
        "potentialConcern": 0,
        "missingInformation": 0,
        "unresolvedRelationship": 0,
        "classificationReviewRequired": 0,
        "financialReconciliationPending": 0,
        "pendingEntityInformation": 0,
        "pendingLinkedWorkstream": 0,
        "pendingBoardDetermination": 0,
        "pendingProfessionalConfirmation": 0,
        "notApplicable": 0,
    }
    state_to_count = {
        "reconciled": "reconciled",
        "potential_concern": "potentialConcern",
        "missing_information": "missingInformation",
        "unresolved_relationship": "unresolvedRelationship",
        "classification_review_required": "classificationReviewRequired",
        "financial_reconciliation_pending": "financialReconciliationPending",
        "pending_entity_information": "pendingEntityInformation",
        "pending_linked_workstream": "pendingLinkedWorkstream",
        "pending_board_determination": "pendingBoardDetermination",
        "pending_professional_confirmation": "pendingProfessionalConfirmation",
        "not_applicable": "notApplicable",
    }
    for item in criteria:
        key = state_to_count.get(item["state"])
        if key:
            counts[key] += 1

    groups = []
    for group in GROUP_ASSESSMENT_GROUPS:
        group_criteria = [item for item in criteria if item["group"] == group]
        if not group_criteria:
            continue
        groups.append(
            {
                "group": group,
                "label": GROUP_ASSESSMENT_GROUP_LABELS[group],
                "headlineState": _worst_state([item["state"] for item in group_criteria]),
                "criteria": group_criteria,
            }
        )

    potential_concerns = (
        counts["potentialConcern"]
        + counts["unresolvedRelationship"]
        + counts["classificationReviewRequired"]
        + counts["financialReconciliationPending"]
    )

    result = "readiness_in_progress"
    if counts["pendingLinkedWorkstream"] > 0 and progress["sectionsComplete"] == 0:
        result = "pending_linked_workstream"
    elif counts["pendingBoardDetermination"] > 0 or counts["pendingProfessionalConfirmation"] > 0:
        result = "professional_confirmation_required"
    elif counts["pendingEntityInformation"] > 0:
        result = "entity_information_gaps"
    elif counts["financialReconciliationPending"] > 0 or counts["unresolvedRelationship"] > 0:
        result = "rpt_gaps_identified"
    elif counts["classificationReviewRequired"] > 0:
        result = "classification_gaps_identified"
    elif progress["sectionsComplete"] == 0:
        result = "insufficient_information"

    if result not in GROUP_ASSESSMENT_RESULT_STATES:
        result = "readiness_in_progress"

    return {
        "result": result,
        "resultLabel": RESULT_LABELS[result],
        "summary": (
            "This is a disclosure readiness view derived from the current draft, not a "
            "compliant/non-compliant or investment-quality score. Unanswered questions are "
            "treated as missing information."
        ),
        "criteria": criteria,
        "groups": groups,
        "counts": counts,
        "metrics": {
            "entityCount": model["entityCount"],
            "sectionsComplete": progress["sectionsComplete"],
            "unansweredConfirmations": unanswered_confirmations,
            "rptTransactionCount": model["rptTransactionCount"],
            "pendingBoardDeterminations": model["icdrPendingBoardCount"],
            "potentialConcerns": potential_concerns,
        },
    }
