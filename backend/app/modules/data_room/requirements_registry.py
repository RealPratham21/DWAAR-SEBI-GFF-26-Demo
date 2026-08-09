"""Central Data Room requirement registry (G6)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from app.modules.company_incorporation.documents.requirements_config import REQUIREMENT_DEFINITIONS
from app.modules.data_room.constants import PROCESSING_DOCUMENT_EXTRACTION, PROCESSING_STORED_ONLY

ApplicabilityKind = Literal["default", "conditional", "professional"]
EvidenceCapability = Literal["document_extraction", "stored_only"]


@dataclass(frozen=True, slots=True)
class DataRoomRequirementDefinition:
    key: str
    workstream_key: str
    category: str
    title: str
    description: str
    purpose: str
    expected_stage: str
    applicability: ApplicabilityKind
    source_section_keys: tuple[str, ...] = field(default_factory=tuple)
    evidence_pipeline_capability: EvidenceCapability = PROCESSING_STORED_ONLY
    allow_multiple: bool = False
    sort_order: int = 0
    ci_requirement_key: str | None = None


def _req(
    workstream: str,
    key: str,
    category: str,
    title: str,
    description: str,
    *,
    purpose: str = "",
    expected_stage: str = "Information",
    applicability: ApplicabilityKind = "default",
    sections: tuple[str, ...] = (),
    capability: EvidenceCapability = PROCESSING_STORED_ONLY,
    allow_multiple: bool = False,
    sort: int = 0,
) -> DataRoomRequirementDefinition:
    return DataRoomRequirementDefinition(
        key=f"{workstream}:{key}",
        workstream_key=workstream,
        category=category,
        title=title,
        description=description,
        purpose=purpose or description,
        expected_stage=expected_stage,
        applicability=applicability,
        source_section_keys=sections,
        evidence_pipeline_capability=capability,
        allow_multiple=allow_multiple,
        sort_order=sort,
    )


def _build_ci_requirements() -> list[DataRoomRequirementDefinition]:
    items: list[DataRoomRequirementDefinition] = []
    for idx, definition in enumerate(REQUIREMENT_DEFINITIONS.values()):
        applicability: ApplicabilityKind = (
            "conditional" if definition.requirement_level == "conditional" else "default"
        )
        items.append(
            DataRoomRequirementDefinition(
                key=f"company-incorporation:{definition.key}",
                workstream_key="company-incorporation",
                category=definition.group_title,
                title=definition.name,
                description=definition.explanation,
                purpose=definition.explanation,
                expected_stage="Documents",
                applicability=applicability,
                source_section_keys=("documents",),
                evidence_pipeline_capability=PROCESSING_DOCUMENT_EXTRACTION,
                allow_multiple=definition.allow_multiple,
                sort_order=idx,
                ci_requirement_key=definition.key,
            )
        )
    return items


_OTHER_REQUIREMENTS: tuple[DataRoomRequirementDefinition, ...] = (
    # IPO Setup & Eligibility
    _req(
        "ipo-setup-eligibility",
        "board-ipo-authorisation",
        "IPO Direction",
        "Board / IPO authorisation records",
        "Common supporting material for IPO direction and board approvals.",
        sections=("ipo-direction",),
        sort=1,
    ),
    _req(
        "ipo-setup-eligibility",
        "eligibility-working-papers",
        "Eligibility",
        "Eligibility working papers",
        "Working papers supporting SME platform and eligibility assessment.",
        sections=("eligibility-assessment",),
        sort=2,
    ),
    _req(
        "ipo-setup-eligibility",
        "track-record-support",
        "Track Record",
        "Track record supporting documents",
        "Supporting records for operating and financial track record.",
        applicability="conditional",
        sections=("operating-track-record",),
        sort=3,
    ),
    _req(
        "ipo-setup-eligibility",
        "ofs-selling-shareholder-support",
        "Offer Structure",
        "Selling shareholder supporting records",
        "Supporting records for offer-for-sale shareholders.",
        applicability="conditional",
        sections=("offer-structure",),
        sort=4,
    ),
    # Capital & Ownership
    _req(
        "capital-ownership",
        "register-of-members",
        "Shareholding",
        "Register of Members / cap table",
        "Current shareholding and beneficial ownership records.",
        sections=("shareholders-beneficial-ownership",),
        sort=1,
    ),
    _req(
        "capital-ownership",
        "share-capital-history",
        "Share Capital",
        "Share capital history support",
        "Allotment, transfer, and capital change records.",
        sections=("share-capital-history",),
        allow_multiple=True,
        sort=2,
    ),
    _req(
        "capital-ownership",
        "promoter-contribution-support",
        "Promoters",
        "Promoter contribution support",
        "Supporting records for promoter contribution and lock-in.",
        sections=("promoters-and-control",),
        sort=3,
    ),
    _req(
        "capital-ownership",
        "esop-outstanding-securities",
        "Securities",
        "ESOP / outstanding securities records",
        "Records of ESOPs and other outstanding convertible instruments.",
        applicability="conditional",
        sections=("outstanding-securities-and-convertibles",),
        sort=4,
    ),
    # Business & Operations
    _req(
        "business-operations",
        "major-customer-agreements",
        "Customers",
        "Major customer agreements",
        "Key customer contracts or purchase orders.",
        sections=("customers-sales-distribution-geography",),
        allow_multiple=True,
        sort=1,
    ),
    _req(
        "business-operations",
        "supplier-agreements",
        "Suppliers",
        "Supplier agreements",
        "Material supplier or procurement agreements.",
        sections=("suppliers-procurement",),
        allow_multiple=True,
        sort=2,
    ),
    _req(
        "business-operations",
        "facility-operational-records",
        "Facilities",
        "Facility / operational records",
        "Factory, lease, or occupancy support for operating facilities.",
        sections=("facilities-capacity-and-utilisation",),
        sort=3,
    ),
    _req(
        "business-operations",
        "insurance-policies",
        "Insurance",
        "Insurance policies",
        "Material insurance policies covering operations and assets.",
        sections=("workforce-insurance-and-statutory",),
        sort=4,
    ),
    _req(
        "business-operations",
        "ip-technology-records",
        "IP & Technology",
        "IP / technology records",
        "Patent, trademark, or technology ownership records where relevant.",
        applicability="conditional",
        sections=("technology-quality-and-ip",),
        sort=5,
    ),
    # Objects of the Issue
    _req(
        "objects-of-issue",
        "capex-quotations",
        "Capex",
        "Capex quotations / estimates",
        "Quotations or estimates supporting capital expenditure objects.",
        sections=("objects-register-and-allocation",),
        allow_multiple=True,
        sort=1,
    ),
    _req(
        "objects-of-issue",
        "working-capital-papers",
        "Working Capital",
        "Working capital working papers",
        "Working capital requirement support for issue objects.",
        sections=("objects-register-and-allocation",),
        sort=2,
    ),
    _req(
        "objects-of-issue",
        "acquisition-documents",
        "Acquisition",
        "Acquisition / investment documents",
        "Documents supporting acquisition or investment objects.",
        applicability="conditional",
        sections=("objects-register-and-allocation",),
        sort=3,
    ),
    # Financials & KPIs
    _req(
        "financials-kpis",
        "audited-financial-statements",
        "Financial Statements",
        "Audited financial statements",
        "Audited financial statements for disclosed reporting periods.",
        sections=("restated-statement-of-profit-and-loss", "restated-balance-sheet"),
        allow_multiple=True,
        sort=1,
    ),
    _req(
        "financials-kpis",
        "restatement-working-papers",
        "Restatement",
        "Restatement working papers",
        "Working papers supporting restated financial information.",
        sections=("restated-statement-of-profit-and-loss",),
        sort=2,
    ),
    _req(
        "financials-kpis",
        "auditor-report",
        "Audit",
        "Auditor reports",
        "Independent auditor reports for disclosed periods.",
        sections=("restated-statement-of-profit-and-loss",),
        sort=3,
    ),
    _req(
        "financials-kpis",
        "kpi-working-papers",
        "KPIs",
        "KPI working papers",
        "Working papers supporting disclosed KPIs and ratios.",
        sections=("ratios-capitalisation-and-issue-price-metrics",),
        sort=4,
    ),
    _req(
        "financials-kpis",
        "kpi-certification",
        "KPIs",
        "KPI certification / auditor confirmation",
        "Professional confirmation for selected KPI disclosures.",
        applicability="professional",
        sections=("ratios-capitalisation-and-issue-price-metrics",),
        sort=5,
    ),
    # Management & Governance
    _req(
        "management-governance",
        "director-appointment-records",
        "Directors",
        "Director / KMP appointment records",
        "Appointment letters, consents, and eligibility records.",
        sections=("directors-profiles-appointments-and-eligibility",),
        allow_multiple=True,
        sort=1,
    ),
    _req(
        "management-governance",
        "board-resolutions",
        "Governance",
        "Board resolutions",
        "Material board resolutions supporting governance disclosures.",
        allow_multiple=True,
        sort=2,
    ),
    _req(
        "management-governance",
        "governance-policies",
        "Governance",
        "Governance policies",
        "Key governance policies referenced in disclosures.",
        applicability="conditional",
        sort=3,
    ),
    # Industry & Market
    _req(
        "industry-market",
        "industry-reports",
        "Research",
        "Industry reports",
        "Third-party or commissioned industry research sources.",
        sections=("research-sources-and-industry-report-governance",),
        allow_multiple=True,
        sort=1,
    ),
    _req(
        "industry-market",
        "market-studies",
        "Market Size",
        "Market studies",
        "Market sizing or segmentation studies supporting disclosures.",
        sections=("market-size-segmentation-and-growth",),
        sort=2,
    ),
    # Group Entities & Related Parties
    _req(
        "group-entities-related-parties",
        "group-structure-chart",
        "Group Structure",
        "Group structure / organisation chart",
        "Organisation chart and entity relationship support.",
        sections=("group-structure-and-entity-master",),
        sort=1,
    ),
    _req(
        "group-entities-related-parties",
        "related-party-register",
        "Related Parties",
        "Related-party register",
        "Register of related parties and relationship support.",
        sections=("related-party-transactions-and-disclosures",),
        sort=2,
    ),
    _req(
        "group-entities-related-parties",
        "rpt-agreements",
        "Related Parties",
        "RPT agreements",
        "Material related-party transaction agreements.",
        applicability="conditional",
        allow_multiple=True,
        sort=3,
    ),
    _req(
        "group-entities-related-parties",
        "subsidiary-records",
        "Group Entities",
        "Subsidiary / associate records",
        "Constitutional and ownership records for group entities.",
        applicability="conditional",
        sort=4,
    ),
    # Borrowings, Assets & Contracts
    _req(
        "borrowings-assets-contracts",
        "sanction-letters",
        "Borrowings",
        "Sanction letters",
        "Sanction letters for outstanding borrowing facilities.",
        sections=("financial-indebtedness-and-facility-master",),
        allow_multiple=True,
        sort=1,
    ),
    _req(
        "borrowings-assets-contracts",
        "loan-agreements",
        "Borrowings",
        "Loan agreements",
        "Executed loan or credit facility agreements.",
        sections=("financial-indebtedness-and-facility-master",),
        allow_multiple=True,
        sort=2,
    ),
    _req(
        "borrowings-assets-contracts",
        "security-documents",
        "Security",
        "Security / charge documents",
        "Security creation and charge registration documents.",
        sections=("security-charges-guarantees-and-borrowing-powers",),
        allow_multiple=True,
        sort=3,
    ),
    _req(
        "borrowings-assets-contracts",
        "title-lease-documents",
        "Assets",
        "Title / lease documents",
        "Title deeds or lease agreements for material assets.",
        sections=("immovable-properties-and-occupancy-rights",),
        allow_multiple=True,
        sort=4,
    ),
    _req(
        "borrowings-assets-contracts",
        "material-contracts",
        "Contracts",
        "Material commercial contracts",
        "Material business or strategic contracts.",
        sections=("material-business-strategic-and-other-contracts",),
        allow_multiple=True,
        sort=5,
    ),
    # Litigation, Approvals & Compliance
    _req(
        "litigation-approvals-compliance",
        "legal-notices-pleadings",
        "Litigation",
        "Legal notices / pleadings",
        "Notices, petitions, and pleadings for material matters.",
        sections=("litigation-and-proceedings-master",),
        allow_multiple=True,
        sort=1,
    ),
    _req(
        "litigation-approvals-compliance",
        "regulatory-licences",
        "Approvals",
        "Licences and approvals",
        "Material licences, registrations, and renewal records.",
        sections=("licences-registrations-and-statutory-approvals",),
        allow_multiple=True,
        sort=2,
    ),
    _req(
        "litigation-approvals-compliance",
        "tax-notices-orders",
        "Tax & Compliance",
        "Tax notices / orders",
        "Material tax notices, orders, or assessments.",
        applicability="conditional",
        allow_multiple=True,
        sort=3,
    ),
    # Intermediaries & Filing
    _req(
        "intermediaries-filing",
        "lead-manager-mandate",
        "Intermediaries",
        "Lead Manager engagement / mandate",
        "Engagement or mandate documentation for the BRLM.",
        sections=("issue-team-and-intermediary-master",),
        sort=1,
    ),
    _req(
        "intermediaries-filing",
        "registrar-engagement",
        "Intermediaries",
        "Registrar engagement",
        "Registrar to the Issue appointment support.",
        sections=("issue-team-and-intermediary-master",),
        sort=2,
    ),
    _req(
        "intermediaries-filing",
        "due-diligence-certificates",
        "Filing",
        "Due diligence certificates",
        "DD certificates and professional confirmations for filing.",
        applicability="professional",
        sections=("due-diligence-certificates-and-professional-confirmations",),
        sort=3,
    ),
    _req(
        "intermediaries-filing",
        "offer-document-versions",
        "Offer Document",
        "Offer document versions",
        "Draft offer document versions and filing correspondence.",
        sections=("final-offer-document-advertisements-material-documents-and-filing-readiness",),
        sort=4,
    ),
)


def all_requirement_definitions() -> list[DataRoomRequirementDefinition]:
    return _build_ci_requirements() + list(_OTHER_REQUIREMENTS)


REQUIREMENT_REGISTRY: dict[str, DataRoomRequirementDefinition] = {
    item.key: item for item in all_requirement_definitions()
}


def requirements_for_workstream(workstream_key: str) -> list[DataRoomRequirementDefinition]:
    return sorted(
        [item for item in REQUIREMENT_REGISTRY.values() if item.workstream_key == workstream_key],
        key=lambda item: item.sort_order,
    )
