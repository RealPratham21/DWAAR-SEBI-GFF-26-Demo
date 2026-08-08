"""DRHP coverage manifest — maps source groups to chapter outputs (G2R)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.modules.drhp.constants import ALL_CHAPTER_KEYS
from app.modules.drhp.generation.source_extractors import (
    extract_basis_metrics,
    extract_business_profile,
    extract_capital_structure,
    extract_directors,
    extract_group_entities,
    extract_identity,
    extract_ipo_offer,
    extract_lead_manager,
    extract_litigation_matters,
    extract_objects,
    extract_products,
    extract_promoters,
    extract_registered_office,
    extract_shareholders,
    pivot_pl_table,
)
from app.modules.drhp.workstreams import WorkstreamSnapshot


@dataclass(frozen=True)
class CoverageEntry:
    workstream: str
    section: str
    field_group: str
    target_chapters: tuple[str, ...]
    output_mode: str
    required: bool = True
    intentionally_excluded: bool = False
    exclusion_reason: str = ""


COVERAGE_MANIFEST: tuple[CoverageEntry, ...] = (
    CoverageEntry("company-incorporation", "legal-identity", "identity.legalName,cin", ("cover-page-front-matter", "general-information-issue"), "deterministic_text"),
    CoverageEntry("company-incorporation", "offices-contact", "offices.registered", ("cover-page-front-matter",), "deterministic_text"),
    CoverageEntry("ipo-setup-eligibility", "ipo-direction", "issueMethod,targetPlatform", ("cover-page-front-matter", "terms-structure-procedure"), "deterministic_table"),
    CoverageEntry("ipo-setup-eligibility", "offer-structure", "faceValue,freshIssue", ("cover-page-front-matter", "terms-structure-procedure", "basis-for-issue-price"), "deterministic_table"),
    CoverageEntry("intermediaries-filing", "issue-team", "leadManager,registrar", ("cover-page-front-matter", "terms-structure-procedure"), "deterministic_table"),
    CoverageEntry("capital-ownership", "current-capital-structure", "authorised,issued,paidUp", ("capital-structure-ownership",), "deterministic_table"),
    CoverageEntry("capital-ownership", "shareholders", "shareholdingPattern", ("capital-structure-ownership",), "deterministic_table"),
    CoverageEntry("capital-ownership", "promoters-and-control", "promoters", ("capital-structure-ownership", "company-history-promoters-structure"), "deterministic_table"),
    CoverageEntry("business-operations", "business-profile", "overview,operatingModel", ("business-operations", "summary-of-drhp"), "narrative"),
    CoverageEntry("business-operations", "products-services", "productsServices", ("business-operations",), "deterministic_table"),
    CoverageEntry("business-operations", "customers-sales", "customers,concentration", ("business-operations", "risk-factors"), "narrative"),
    CoverageEntry("objects-of-issue", "objects-register", "objects,allocation", ("objects-of-the-issue", "summary-of-drhp"), "deterministic_table"),
    CoverageEntry("financials-kpis", "restated-pl", "plLineValues", ("financial-information-mda", "basis-for-issue-price", "summary-of-drhp"), "deterministic_table"),
    CoverageEntry("financials-kpis", "balance-sheet", "balanceSheetLineValues", ("financial-information-mda",), "deterministic_table"),
    CoverageEntry("financials-kpis", "ratios", "issuePriceMetrics", ("basis-for-issue-price",), "deterministic_table"),
    CoverageEntry("industry-market", "market-size", "marketSeries", ("industry-overview",), "deterministic_table"),
    CoverageEntry("management-governance", "directors", "directors", ("management-governance",), "deterministic_table"),
    CoverageEntry("litigation-approvals-compliance", "litigation", "matters", ("legal-regulatory-approvals", "risk-factors"), "deterministic_table"),
    CoverageEntry("group-entities-related-parties", "group-structure", "entities", ("group-companies-rpt",), "deterministic_table"),
    CoverageEntry("group-entities-related-parties", "rpt", "transactions", ("group-companies-rpt",), "deterministic_table"),
    CoverageEntry("intermediaries-filing", "inspection", "inspectionItems", ("material-contracts-inspection",), "deterministic_table"),
    CoverageEntry("company-incorporation", "issuer-confirmations", "confirmations", (), "deterministic_text", False, True, "workflow-only readiness confirmations"),
)


def _group_populated(snapshots: dict[str, WorkstreamSnapshot], entry: CoverageEntry) -> bool:
    checks = {
        "identity.legalName,cin": lambda: bool(extract_identity(snapshots).get("legalName")),
        "offices.registered": lambda: bool(extract_registered_office(snapshots)),
        "issueMethod,targetPlatform": lambda: bool(extract_ipo_offer(snapshots).get("issueMethod")),
        "faceValue,freshIssue": lambda: bool(extract_ipo_offer(snapshots).get("faceValue")),
        "leadManager,registrar": lambda: bool(extract_lead_manager(snapshots)),
        "authorised,issued,paidUp": lambda: bool(extract_capital_structure(snapshots).get("authorisedEquityShareCapital")),
        "shareholdingPattern": lambda: len(extract_shareholders(snapshots)) > 0,
        "promoters": lambda: len(extract_promoters(snapshots)) > 0,
        "overview,operatingModel": lambda: bool(extract_business_profile(snapshots).get("briefBusinessOverview")),
        "productsServices": lambda: len(extract_products(snapshots)) > 0,
        "objects,allocation": lambda: len(extract_objects(snapshots)) > 0,
        "plLineValues": lambda: len(pivot_pl_table(snapshots)[1]) > 0,
        "directors": lambda: len(extract_directors(snapshots)) > 0,
        "matters": lambda: len(extract_litigation_matters(snapshots)) > 0,
        "entities": lambda: len(extract_group_entities(snapshots)) > 0,
        "issuePriceMetrics": lambda: len(extract_basis_metrics(snapshots)) > 0,
    }
    fn = checks.get(entry.field_group)
    return fn() if fn else False


def chapter_coverage_report(
    chapter_key: str,
    snapshots: dict[str, WorkstreamSnapshot],
    *,
    source_ref_count: int = 0,
    deterministic_blocks: int = 0,
    narrative_blocks: int = 0,
    placeholder_count: int = 0,
) -> dict[str, Any]:
    entries = [e for e in COVERAGE_MANIFEST if chapter_key in e.target_chapters and not e.intentionally_excluded]
    populated = [e for e in entries if _group_populated(snapshots, e)]
    return {
        "chapterKey": chapter_key,
        "mappedSourceGroups": len(entries),
        "populatedMappedGroups": len(populated),
        "unusedPopulatedGroups": max(0, len(populated) - min(len(populated), deterministic_blocks + narrative_blocks)),
        "sourceRefCount": source_ref_count,
        "sourceCoveragePct": round(100 * len(populated) / len(entries), 1) if entries else 0.0,
        "deterministicBlockCount": deterministic_blocks,
        "narrativeBlockCount": narrative_blocks,
        "placeholderCount": placeholder_count,
    }


def manifest_summary() -> dict[str, Any]:
    by_chapter: dict[str, list[str]] = {k: [] for k in ALL_CHAPTER_KEYS}
    excluded = 0
    for entry in COVERAGE_MANIFEST:
        if entry.intentionally_excluded:
            excluded += 1
            continue
        for ch in entry.target_chapters:
            if ch in by_chapter:
                by_chapter[ch].append(entry.field_group)
    return {
        "totalEntries": len(COVERAGE_MANIFEST),
        "intentionallyExcluded": excluded,
        "chaptersCovered": sum(1 for groups in by_chapter.values() if groups),
        "byChapter": {k: len(v) for k, v in by_chapter.items()},
    }
