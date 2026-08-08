"""18-chapter centralized mapping registry."""

from __future__ import annotations

from dataclasses import dataclass, field

from app.modules.drhp.constants import (
    ALL_CHAPTER_KEYS,
    CHAPTER_TITLES,
    GenerationPhase,
    SourceAdapterKey,
)


@dataclass(frozen=True)
class ChapterMapping:
    chapter_key: str
    display_name: str
    order: int
    description: str
    primary_workstreams: tuple[str, ...]
    supporting_workstreams: tuple[str, ...]
    deterministic_content_types: tuple[str, ...]
    narrative_content_types: tuple[str, ...]
    required_source_groups: tuple[str, ...]
    optional_source_groups: tuple[str, ...]
    dependency_chapters: tuple[str, ...]
    generation_phase: str
    source_adapter: str
    g1_legacy_adapter: bool = False


def _m(
    key: str,
    order: int,
    description: str,
    primary: tuple[str, ...],
    supporting: tuple[str, ...] = (),
    deterministic: tuple[str, ...] = (),
    narrative: tuple[str, ...] = (),
    required_groups: tuple[str, ...] = (),
    optional_groups: tuple[str, ...] = (),
    dependencies: tuple[str, ...] = (),
    phase: str = GenerationPhase.CORE_SUBSTANTIVE,
    adapter: str = SourceAdapterKey.GENERATION_SNAPSHOT,
    g1_legacy: bool = False,
) -> ChapterMapping:
    return ChapterMapping(
        chapter_key=key,
        display_name=CHAPTER_TITLES[key],
        order=order,
        description=description,
        primary_workstreams=primary,
        supporting_workstreams=supporting,
        deterministic_content_types=deterministic,
        narrative_content_types=narrative,
        required_source_groups=required_groups,
        optional_source_groups=optional_groups,
        dependency_chapters=dependencies,
        generation_phase=phase,
        source_adapter=adapter,
        g1_legacy_adapter=g1_legacy,
    )


SUBSTANTIVE_CHAPTER_KEYS: tuple[str, ...] = (
    "cover-page-front-matter",
    "general-information-issue",
    "capital-structure-ownership",
    "objects-of-the-issue",
    "basis-for-issue-price",
    "industry-overview",
    "business-operations",
    "company-history-promoters-structure",
    "management-governance",
    "financial-information-mda",
    "legal-regulatory-approvals",
    "group-companies-rpt",
    "terms-structure-procedure",
    "material-contracts-inspection",
)


CHAPTER_MAPPINGS: dict[str, ChapterMapping] = {
    "cover-page-front-matter": _m(
        "cover-page-front-matter",
        1,
        "Cover page disclosures: issuer identity, offer structure, intermediaries, exchange.",
        ("company-incorporation", "ipo-setup-eligibility", "intermediaries-filing"),
        ("capital-ownership", "management-governance"),
        ("cover_header", "issuer_identity", "offer_summary", "intermediary_list"),
        (),
        ("issuer_identity", "offer_configuration", "intermediaries"),
        ("pricing_final", "issue_dates"),
        (),
        GenerationPhase.CORE_SUBSTANTIVE,
        SourceAdapterKey.COMPANY_INCORPORATION,
        g1_legacy=True,
    ),
    "definitions-abbreviations": _m(
        "definitions-abbreviations",
        2,
        "Document-wide defined terms and abbreviations from Term Registry.",
        (),
        tuple(ALL_CHAPTER_KEYS),
        ("term_table",),
        ("term_descriptions",),
        ("term_registry",),
        (),
        dependencies=SUBSTANTIVE_CHAPTER_KEYS + ("risk-factors",),
        phase=GenerationPhase.WHOLE_DOCUMENT_SYNTHESIS,
    ),
    "summary-of-drhp": _m(
        "summary-of-drhp",
        3,
        "Executive summary synthesized from substantive generated chapters.",
        (),
        tuple(ALL_CHAPTER_KEYS),
        ("summary_sections",),
        ("executive_narrative",),
        ("generated_chapter_outputs",),
        (),
        dependencies=SUBSTANTIVE_CHAPTER_KEYS + ("risk-factors",),
        phase=GenerationPhase.WHOLE_DOCUMENT_SYNTHESIS,
    ),
    "risk-factors": _m(
        "risk-factors",
        4,
        "Risk candidate registry transformed into DRHP-style risk factors.",
        (
            "business-operations",
            "financials-kpis",
            "borrowings-assets-contracts",
            "litigation-approvals-compliance",
            "industry-market",
        ),
        (
            "objects-of-issue",
            "group-entities-related-parties",
            "capital-ownership",
            "management-governance",
            "ipo-setup-eligibility",
        ),
        ("risk_candidate_registry",),
        ("risk_narrative",),
        ("risk_candidates",),
        ("qualitative_risks",),
        (
            "business-operations",
            "financial-information-mda",
            "legal-regulatory-approvals",
            "industry-overview",
        ),
        GenerationPhase.DERIVED_ANALYTICAL,
    ),
    "general-information-issue": _m(
        "general-information-issue",
        5,
        "Issuer identity, contacts, intermediaries, and issue overview.",
        ("company-incorporation", "ipo-setup-eligibility", "intermediaries-filing"),
        ("capital-ownership", "management-governance"),
        ("issuer_identity", "contact_details", "intermediary_table", "issue_overview"),
        ("introductory_narrative",),
        ("issuer_identity", "issue_configuration"),
        ("officer_details",),
    ),
    "capital-structure-ownership": _m(
        "capital-structure-ownership",
        6,
        "Share capital, ownership, promoters, lock-in, and encumbrances.",
        ("capital-ownership",),
        ("ipo-setup-eligibility", "group-entities-related-parties", "company-incorporation"),
        ("capital_tables", "shareholding_tables", "lock_in_tables"),
        ("ownership_narrative",),
        ("capital_structure", "shareholders", "promoters"),
        ("outstanding_securities",),
    ),
    "objects-of-the-issue": _m(
        "objects-of-the-issue",
        7,
        "Objects register, allocations, deployment schedule, means of finance.",
        ("objects-of-issue",),
        (
            "ipo-setup-eligibility",
            "borrowings-assets-contracts",
            "business-operations",
            "financials-kpis",
            "intermediaries-filing",
        ),
        ("objects_table", "deployment_schedule", "means_of_finance"),
        ("objects_narrative",),
        ("objects_register", "proceeds_summary"),
        ("gcp_monitoring",),
    ),
    "basis-for-issue-price": _m(
        "basis-for-issue-price",
        8,
        "Issue price basis, EPS, P/E, RoNW, NAV, peer comparison.",
        ("financials-kpis", "ipo-setup-eligibility"),
        ("industry-market", "business-operations", "capital-ownership"),
        ("price_metrics_table", "peer_comparison_table", "capitalisation_table"),
        ("qualitative_justification",),
        ("issue_price_metrics", "financial_ratios"),
        ("peer_comparison",),
    ),
    "industry-overview": _m(
        "industry-overview",
        9,
        "Industry structure, market size, competition, outlook.",
        ("industry-market",),
        ("business-operations", "financials-kpis"),
        ("market_size_tables", "competition_tables", "source_methodology"),
        ("industry_narrative",),
        ("industry_scope", "market_data", "competition"),
        ("outlook",),
    ),
    "business-operations": _m(
        "business-operations",
        10,
        "Business overview, operations, facilities, strategy.",
        ("business-operations",),
        (
            "borrowings-assets-contracts",
            "industry-market",
            "financials-kpis",
            "objects-of-issue",
            "litigation-approvals-compliance",
        ),
        ("revenue_mix_tables", "facility_tables", "customer_concentration"),
        ("business_narrative",),
        ("business_profile", "operations"),
        ("material_contracts_context",),
    ),
    "company-history-promoters-structure": _m(
        "company-history-promoters-structure",
        11,
        "Company history, promoters, and corporate structure.",
        ("company-incorporation", "capital-ownership", "group-entities-related-parties"),
        ("management-governance", "business-operations"),
        ("corporate_history", "promoter_table", "group_structure"),
        ("history_narrative",),
        required_groups=("incorporation_history", "promoters", "group_structure"),
        optional_groups=("milestones",),
        adapter=SourceAdapterKey.COMPANY_INCORPORATION,
        g1_legacy=True,
    ),
    "management-governance": _m(
        "management-governance",
        12,
        "Board, KMP, committees, remuneration, governance.",
        ("management-governance",),
        ("capital-ownership", "group-entities-related-parties", "litigation-approvals-compliance"),
        ("director_tables", "kmp_tables", "committee_tables", "org_structure"),
        ("governance_narrative",),
        ("directors", "kmp", "committees"),
        ("remuneration", "interests"),
    ),
    "financial-information-mda": _m(
        "financial-information-mda",
        13,
        "Restated financials, ratios, KPIs, MD&A.",
        ("financials-kpis",),
        (
            "borrowings-assets-contracts",
            "business-operations",
            "objects-of-issue",
            "group-entities-related-parties",
            "litigation-approvals-compliance",
        ),
        (
            "financial_statements",
            "ratio_tables",
            "kpi_tables",
            "capitalisation_statement",
        ),
        ("mda_narrative",),
        ("financial_statements", "ratios", "kpis"),
        ("mda", "material_developments"),
    ),
    "legal-regulatory-approvals": _m(
        "legal-regulatory-approvals",
        14,
        "Litigation, approvals, compliance, material creditors.",
        ("litigation-approvals-compliance",),
        (
            "borrowings-assets-contracts",
            "group-entities-related-parties",
            "management-governance",
            "business-operations",
            "company-incorporation",
            "industry-market",
        ),
        ("litigation_tables", "approval_tables", "compliance_tables"),
        ("legal_narrative",),
        ("litigation", "approvals", "compliance"),
        ("material_creditors",),
    ),
    "group-companies-rpt": _m(
        "group-companies-rpt",
        15,
        "Group structure, group companies, related party transactions.",
        ("group-entities-related-parties",),
        ("financials-kpis", "capital-ownership", "management-governance", "borrowings-assets-contracts", "litigation-approvals-compliance"),
        ("group_structure_tables", "rpt_tables", "balance_tables"),
        ("group_narrative",),
        ("group_structure", "rpt_register"),
        ("common_pursuits",),
    ),
    "terms-structure-procedure": _m(
        "terms-structure-procedure",
        16,
        "Issue terms, procedure, underwriting, allotment, listing.",
        ("ipo-setup-eligibility", "intermediaries-filing"),
        ("capital-ownership",),
        ("issue_terms_tables", "procedure_sections", "underwriting_tables"),
        (),
        ("issue_structure", "offer_procedure"),
        ("depository_infrastructure",),
    ),
    "material-contracts-inspection": _m(
        "material-contracts-inspection",
        17,
        "Material contracts and documents for inspection.",
        ("intermediaries-filing",),
        (
            "borrowings-assets-contracts",
            "litigation-approvals-compliance",
            "objects-of-issue",
            "financials-kpis",
            "company-incorporation",
            "management-governance",
            "industry-market",
        ),
        ("inspection_register", "material_contracts_table"),
        (),
        ("inspection_register",),
        ("contract_candidates",),
    ),
    "declarations-aoa-miscellaneous": _m(
        "declarations-aoa-miscellaneous",
        18,
        "Declarations, AOA provisions, consents, final confirmations.",
        ("intermediaries-filing", "company-incorporation", "management-governance"),
        ("ipo-setup-eligibility", "litigation-approvals-compliance"),
        ("declarations", "consent_register", "aoa_excerpts"),
        (),
        ("declarations", "consents"),
        ("miscellaneous",),
        dependencies=SUBSTANTIVE_CHAPTER_KEYS
        + ("risk-factors", "summary-of-drhp", "definitions-abbreviations"),
        phase=GenerationPhase.FINAL_ASSEMBLY,
    ),
}


def get_chapter_mapping(chapter_key: str) -> ChapterMapping | None:
    return CHAPTER_MAPPINGS.get(chapter_key)


def iter_chapter_mappings() -> list[ChapterMapping]:
    return [CHAPTER_MAPPINGS[key] for key in ALL_CHAPTER_KEYS if key in CHAPTER_MAPPINGS]
