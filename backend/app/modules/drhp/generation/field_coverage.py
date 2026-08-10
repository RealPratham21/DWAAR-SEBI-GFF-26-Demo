"""Field-path coverage audit for DRHP disclosure assembly (P2.2)."""

from __future__ import annotations

from typing import Any

from app.modules.drhp.constants import ALL_CHAPTER_KEYS
from app.modules.drhp.generation.content_plan import build_chapter_content_plan
from app.modules.drhp.workstreams import WorkstreamSnapshot

WORKSTREAM_SECTION_PREFIXES: dict[str, tuple[str, ...]] = {
    "company-incorporation": ("legalIdentity", "officesAndContact", "corporateEvents"),
    "ipo-setup-eligibility": ("ipoDirectionAndEligibility", "offerStructureAndPricingInputs"),
    "capital-ownership": ("currentCapitalStructure", "shareholdersBeneficialOwnershipAndVoting", "promotersAndPromoterGroup"),
    "business-operations": (
        "businessProfileAndOperatingModel",
        "productsServicesAndRevenueMix",
        "customersSalesDistributionAndGeography",
        "suppliersProcurementInventoryAndLogistics",
        "facilitiesCapacityAndOperationalProcess",
        "technologyQualityResearchAndIntellectualProperty",
        "workforceHumanResourcesAndIndustrialRelations",
        "competitiveStrengthsStrategyDependenciesAndConfirmations",
    ),
    "objects-of-issue": ("objectsRegisterAndAllocation",),
    "financials-kpis": (
        "restatedStatementOfProfitAndLoss",
        "restatedBalanceSheet",
        "restatedCashFlowStatement",
        "ratiosCapitalisationAndIssuePriceMetrics",
        "mdaTrendsMaterialDevelopmentsAndConfirmations",
    ),
    "management-governance": (
        "directorsProfilesAppointmentsAndEligibility",
        "keyManagerialPersonnelAndSeniorManagement",
        "boardCommitteesAndGovernanceStructure",
    ),
    "industry-market": ("marketSizeSegmentationAndGrowth", "industryStructureAndCompetition"),
    "group-entities-related-parties": ("groupStructureAndEntityMaster", "relatedPartyTransactionsRegister"),
    "borrowings-assets-contracts": ("borrowingsFacilitiesAndSecurityMaster", "materialBusinessStrategicAndOtherContracts"),
    "litigation-approvals-compliance": ("litigationAndProceedingsMaster", "governmentRegulatoryAndBusinessApprovalsMaster"),
    "intermediaries-filing": ("issueTeamAndIntermediaryMaster", "finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness"),
}


def _populated_section_fields(payload: dict[str, Any], section_key: str) -> list[str]:
    section = payload.get(section_key)
    if not isinstance(section, dict):
        return []
    populated: list[str] = []
    for key, value in section.items():
        if key in {"notes", "confirmations", "schemaVersion"}:
            continue
        if value in (None, "", [], {}):
            continue
        if isinstance(value, list) and not value:
            continue
        populated.append(f"{section_key}.{key}")
    return populated


def _collect_mapped_paths(snapshots: dict[str, WorkstreamSnapshot]) -> set[str]:
    mapped: set[str] = set()
    for chapter_key in ALL_CHAPTER_KEYS:
        plan = build_chapter_content_plan(chapter_key, snapshots)
        mapped.update(plan.mapped_field_paths)
        for item in plan.items:
            mapped.update(item.field_paths)
    return mapped


def workstream_coverage_report(snapshots: dict[str, WorkstreamSnapshot]) -> dict[str, Any]:
    global_mapped = _collect_mapped_paths(snapshots)
    by_workstream: dict[str, Any] = {}

    for slug, prefixes in WORKSTREAM_SECTION_PREFIXES.items():
        ws = snapshots.get(slug)
        if ws is None:
            continue
        populated: list[str] = []
        for prefix in prefixes:
            populated.extend(_populated_section_fields(ws.payload, prefix))
        mapped = [p for p in populated if any(p.startswith(m.split(".")[0]) or m.startswith(p.split(".")[0]) for m in global_mapped)]
        unmapped = [p for p in populated if p not in mapped and not p.endswith(".notes")]
        by_workstream[slug] = {
            "populatedFields": populated,
            "mappedFields": mapped,
            "unmappedFields": unmapped,
        }

    return {"byWorkstream": by_workstream, "globalMappedPaths": sorted(global_mapped)}


def generation_coverage_metrics(chapter_metrics: dict[str, dict[str, Any]]) -> dict[str, Any]:
    totals = {
        "disclosureItemsSupported": 0,
        "disclosureItemsMissing": 0,
        "disclosureItemsNotApplicable": 0,
        "deterministicBlocks": 0,
        "cohereNarrativeBlocks": 0,
        "deterministicFallbackBlocks": 0,
        "placeholderBlocks": 0,
    }
    for metrics in chapter_metrics.values():
        for key in totals:
            totals[key] += int(metrics.get(key, 0))
    return {"totals": totals, "byChapter": chapter_metrics}
