"""Derived model for Group Entities & Related Parties."""

from __future__ import annotations

from typing import Any

from app.modules.group_entities_related_parties.entities import (
    count_active_entities,
    count_entities_by_badge,
)
from app.modules.group_entities_related_parties.group_company import summarize_icdr_group_company_readiness
from app.modules.group_entities_related_parties.materiality import summarize_materiality_evaluation
from app.modules.group_entities_related_parties.ownership import (
    derive_ownership_chain_summary,
    summarize_ownership_paths,
)
from app.modules.group_entities_related_parties.rpt import calculate_rpt_summary


def compute_group_entities_model(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    rpt_summary = calculate_rpt_summary(payload, linked_references)
    related_parties = (payload.get("relatedPartyUniverseAndClassification") or {}).get(
        "relatedPartyRelationships"
    ) or []

    classification = payload.get("groupCompanyAndMaterialityClassification") or {}
    icdr_determinations = [
        d for d in (classification.get("icdrGroupCompanyDeterminations") or []) if isinstance(d, dict)
    ]
    icdr_pending_board_count = sum(
        1 for d in icdr_determinations if d.get("classificationState") == "pending_board_determination"
    )
    icdr_group_company_count = sum(
        1
        for d in icdr_determinations
        if d.get("classificationState") in ("identified", "potentially_identified")
    )

    financial_readiness = (
        payload.get("groupEntityFinancialRegulatoryAndLitigationReadiness") or {}
    ).get("entityFinancialReadiness") or []

    ownership_summary = summarize_ownership_paths(payload)
    icdr_summary = summarize_icdr_group_company_readiness(payload)
    materiality_summary = summarize_materiality_evaluation(payload)

    return {
        "entityCount": count_active_entities(payload),
        "subsidiaryCount": count_entities_by_badge(payload, "subsidiary"),
        "stepDownSubsidiaryCount": count_entities_by_badge(payload, "step-down-subsidiary"),
        "associateCount": count_entities_by_badge(payload, "associate"),
        "jvCount": count_entities_by_badge(payload, "jv"),
        "promoterGroupEntityCount": count_entities_by_badge(payload, "promoter-group-entity"),
        "icdrGroupCompanyCount": icdr_group_company_count,
        "icdrPendingBoardCount": icdr_pending_board_count,
        "relatedPartyCount": sum(
            1
            for rp in related_parties
            if isinstance(rp, dict)
            and any(
                isinstance(fc, dict)
                and fc.get("currentHistorical") != "historical"
                and fc.get("related") == "yes"
                for fc in (rp.get("frameworkClassifications") or [])
            )
        ),
        "historicalRelatedPartyCount": sum(
            1
            for rp in related_parties
            if isinstance(rp, dict)
            and any(
                isinstance(fc, dict) and fc.get("currentHistorical") == "historical"
                for fc in (rp.get("frameworkClassifications") or [])
            )
        ),
        "ownershipRelationshipCount": len(
            (payload.get("ownershipControlAndRelationshipMapping") or {}).get(
                "ownershipRelationships"
            )
            or []
        ),
        "rptTransactionCount": len(
            (payload.get("relatedPartyTransactionsBalancesAndCommitments") or {}).get("transactions")
            or []
        ),
        "commonPursuitEntityCount": len(
            (payload.get("commonPursuitsDependenciesAndConflicts") or {}).get("commonPursuitRecords")
            or []
        ),
        "dependencyCount": len(
            (payload.get("commonPursuitsDependenciesAndConflicts") or {}).get(
                "interCompanyDependencies"
            )
            or []
        ),
        "negativeNetWorthCount": sum(
            1 for r in financial_readiness if isinstance(r, dict) and r.get("negativeNetWorth") == "yes"
        ),
        "lossMakingCount": sum(
            1 for r in financial_readiness if isinstance(r, dict) and r.get("lossMaking") == "yes"
        ),
        "auditorQualifiedCount": sum(
            1
            for r in financial_readiness
            if isinstance(r, dict) and r.get("auditorQualification") == "yes"
        ),
        "incompleteInformationCount": sum(
            1
            for r in financial_readiness
            if isinstance(r, dict)
            and r.get("informationStatus") in ("partial", "unavailable")
        ),
        "ibcConcernCount": sum(
            1
            for r in financial_readiness
            if isinstance(r, dict)
            and (
                r.get("ibcProceeding") == "yes"
                or r.get("windingUpPetition") == "yes"
                or r.get("liquidation") == "yes"
            )
        ),
        "pendingEntityInformationCount": sum(
            1
            for r in financial_readiness
            if isinstance(r, dict)
            and (
                r.get("informationStatus") == "not-requested"
                or r.get("informationReceived") == "no"
            )
        ),
        "rptSummary": rpt_summary,
        "ownershipChainSummary": derive_ownership_chain_summary(payload),
        "ownershipPathSummaries": ownership_summary,
        "icdrReadinessSummary": icdr_summary,
        "materialitySummary": materiality_summary,
    }
