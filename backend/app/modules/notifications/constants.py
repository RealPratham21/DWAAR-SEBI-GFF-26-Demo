class NotificationType:
    WORKSTREAM_SAVE = "workstream_save"
    WORKSTREAM_DOCUMENT = "workstream_document"


class NotificationErrorCode:
    NOT_FOUND = "NOTIFICATION_NOT_FOUND"


DEFAULT_NOTIFICATION_LIMIT = 20
MAX_NOTIFICATION_LIMIT = 50

WORKSTREAM_SAVE_MESSAGE = "Your Company & Incorporation information was saved successfully."
IPO_SETUP_SAVE_MESSAGE = "Your IPO Setup & Eligibility information was saved successfully."
CAPITAL_OWNERSHIP_SAVE_MESSAGE = "Your Capital & Ownership information was saved successfully."
BUSINESS_OPERATIONS_SAVE_MESSAGE = "Your Business & Operations information was saved successfully."
OBJECTS_ISSUE_SAVE_MESSAGE = "Your Objects of the Issue information was saved successfully."
FINANCIALS_KPIS_SAVE_MESSAGE = "Your Financials & KPIs information was saved successfully."
MANAGEMENT_GOVERNANCE_SAVE_MESSAGE = (
    "Your Management & Governance information was saved successfully."
)
INDUSTRY_MARKET_SAVE_MESSAGE = (
    "Your Industry & Market information was saved successfully."
)
GROUP_ENTITIES_SAVE_MESSAGE = (
    "Your Group Entities & Related Parties information was saved successfully."
)
BORROWINGS_ASSETS_SAVE_MESSAGE = (
    "Your Borrowings, Assets & Contracts information was saved successfully."
)
COMPANY_INCORPORATION_SLUG = "company-incorporation"
IPO_SETUP_SLUG = "ipo-setup-eligibility"
CAPITAL_OWNERSHIP_SLUG = "capital-ownership"
BUSINESS_OPERATIONS_SLUG = "business-operations"
OBJECTS_ISSUE_SLUG = "objects-of-issue"
FINANCIALS_KPIS_SLUG = "financials-kpis"
MANAGEMENT_GOVERNANCE_SLUG = "management-governance"
INDUSTRY_MARKET_SLUG = "industry-market"
GROUP_ENTITIES_SLUG = "group-entities-related-parties"
BORROWINGS_ASSETS_SLUG = "borrowings-assets-contracts"

SECTION_SAVE_TITLES: dict[str, str] = {
    "legal-identity": "Legal Identity saved",
    "corporate-history": "Corporate History saved",
    "offices-contact": "Offices & Contact Information saved",
    "constitutional-documents": "Constitutional Documents saved",
    "core-registrations": "Core Registrations saved",
    "issuer-confirmations": "Issuer Confirmations saved",
}

IPO_SETUP_SECTION_SAVE_TITLES: dict[str, str] = {
    "ipo-direction": "IPO Direction saved",
    "offer-structure": "Proposed Offer Structure saved",
    "track-record-financial": "Track Record & Financial Eligibility saved",
    "eligibility-declarations": "Eligibility Declarations saved",
    "process-readiness": "Process Readiness saved",
    "issuer-confirmations": "Issuer Confirmations saved",
}

CAPITAL_OWNERSHIP_SECTION_SAVE_TITLES: dict[str, str] = {
    "current-capital-structure": "Current Capital Structure saved",
    "share-capital-history": "Share Capital History saved",
    "shareholders-beneficial-ownership": "Shareholders & Beneficial Ownership saved",
    "promoters-and-control": "Promoters & Control saved",
    "pre-post-issue-ownership": "Pre & Post-Issue Ownership saved",
    "promoter-contribution-lock-in": "Promoter Contribution, Lock-In & Encumbrances saved",
    "outstanding-securities-confirmations": "Outstanding Securities, Transactions & Confirmations saved",
}

BUSINESS_OPERATIONS_SECTION_SAVE_TITLES: dict[str, str] = {
    "business-profile-operating-model": "Business Profile & Operating Model saved",
    "products-services-revenue-mix": "Products, Services & Revenue Mix saved",
    "customers-sales-distribution-geography": "Customers, Sales, Distribution & Geography saved",
    "suppliers-procurement-inventory-logistics": (
        "Suppliers, Procurement, Inventory & Logistics saved"
    ),
    "facilities-capacity-operational-process": "Facilities, Capacity & Operational Process saved",
    "technology-quality-rd-ip": "Technology, Quality, R&D & Intellectual Property saved",
    "workforce-collaborations-insurance-continuity": (
        "Workforce, Collaborations, Insurance & Continuity saved"
    ),
    "competitive-strengths-strategy-confirmations": (
        "Competitive Strengths, Strategy, Dependencies & Confirmations saved"
    ),
}

OBJECTS_ISSUE_SECTION_SAVE_TITLES: dict[str, str] = {
    "proceeds-and-funding-summary": "Proceeds & Funding Summary saved",
    "objects-register-and-allocation": "Objects Register & Allocation saved",
    "capital-expenditure-facilities-and-expansion": (
        "Capital Expenditure, Facilities & Expansion saved"
    ),
    "working-capital-and-borrowing-repayment": "Working Capital & Borrowing Repayment saved",
    "acquisitions-subsidiaries-jvs-and-investments": (
        "Acquisitions, Subsidiaries, JVs & Investments saved"
    ),
    "means-of-finance-and-deployment-schedule": "Means of Finance & Deployment Schedule saved",
    "expenses-gcp-monitoring-and-confirmations": (
        "Expenses, GCP, Monitoring & Confirmations saved"
    ),
}

FINANCIALS_KPIS_SECTION_SAVE_TITLES: dict[str, str] = {
    "reporting-scope-periods-and-auditor-readiness": (
        "Reporting Scope, Periods & Auditor Readiness saved"
    ),
    "restated-statement-of-profit-and-loss": "Restated Statement of Profit & Loss saved",
    "assets-liabilities-equity-and-cash-flows": "Assets, Liabilities, Equity & Cash Flows saved",
    "restatement-adjustments-policies-and-auditor-matters": (
        "Restatement Adjustments, Policies & Auditor Matters saved"
    ),
    "other-financial-information": "Other Financial Information saved",
    "ratios-capitalisation-and-issue-price-metrics": (
        "Ratios, Capitalisation & Issue-Price Metrics saved"
    ),
    "kpi-selection-governance-and-peer-comparison": (
        "KPI Selection, Governance & Peer Comparison saved"
    ),
    "mda-trends-material-developments-and-confirmations": (
        "MD&A, Trends, Material Developments & Confirmations saved"
    ),
}

MANAGEMENT_GOVERNANCE_SECTION_SAVE_TITLES: dict[str, str] = {
    "board-structure-and-ipo-governance-readiness": (
        "Board Structure & IPO Governance Readiness saved"
    ),
    "directors-profiles-appointments-and-eligibility": (
        "Directors — Profiles, Appointments & Eligibility saved"
    ),
    "kmp-senior-management-and-organisation-structure": (
        "KMP, Senior Management & Organisation Structure saved"
    ),
    "board-committees-and-governance-bodies": "Board Committees & Governance Bodies saved",
    "remuneration-service-contracts-esops-and-benefits": (
        "Remuneration, Service Contracts, ESOPs & Benefits saved"
    ),
    "interests-conflicts-and-management-relationships": (
        "Interests, Conflicts & Management Relationships saved"
    ),
    "changes-continuity-and-succession": "Changes, Continuity & Succession saved",
    "governance-policies-rpt-oversight-and-confirmations": (
        "Governance Policies, RPT Oversight & Confirmations saved"
    ),
}


INDUSTRY_MARKET_SECTION_SAVE_TITLES: dict[str, str] = {
    "industry-scope-and-company-market-mapping": (
        "Industry Scope & Company-to-Market Mapping saved"
    ),
    "research-sources-and-industry-report-governance": (
        "Research Sources & Industry Report Governance saved"
    ),
    "macroeconomic-and-industry-context": "Macroeconomic & Industry Context saved",
    "market-size-segmentation-and-growth": "Market Size, Segmentation & Growth saved",
    "demand-drivers-end-markets-trends-and-policy": (
        "Demand Drivers, End Markets, Trends & Policy saved"
    ),
    "value-chain-supply-structure-and-entry-barriers": (
        "Value Chain, Supply Structure & Entry Barriers saved"
    ),
    "competition-market-share-and-issuer-positioning": (
        "Competition, Market Share & Issuer Positioning saved"
    ),
    "outlook-industry-risks-and-confirmations": (
        "Outlook, Industry Risks & Confirmations saved"
    ),
}

GROUP_ENTITIES_SECTION_SAVE_TITLES: dict[str, str] = {
    "group-structure-and-entity-master": "Group Structure & Entity Master saved",
    "ownership-control-and-relationship-mapping": (
        "Ownership, Control & Relationship Mapping saved"
    ),
    "group-company-and-materiality-classification": (
        "Group Company & Materiality Classification saved"
    ),
    "related-party-universe-and-classification": (
        "Related Party Universe & Classification saved"
    ),
    "related-party-transactions-balances-and-commitments": (
        "Related Party Transactions, Balances & Commitments saved"
    ),
    "common-pursuits-dependencies-and-conflicts": (
        "Common Pursuits, Dependencies & Conflicts saved"
    ),
    "group-entity-financial-regulatory-and-litigation-readiness": (
        "Group Entity Financial, Regulatory & Litigation Readiness saved"
    ),
    "changes-rpt-readiness-and-confirmations": (
        "Changes, RPT Readiness & Confirmations saved"
    ),
}

BORROWINGS_ASSETS_SECTION_SAVE_TITLES: dict[str, str] = {
    "financial-indebtedness-and-facility-master": "Financial Indebtedness & Facility Master saved",
    "security-charges-guarantees-and-borrowing-powers": (
        "Security, Charges, Guarantees & Borrowing Powers saved"
    ),
    "covenants-defaults-waivers-and-lender-consents": (
        "Covenants, Defaults, Waivers & Lender Consents saved"
    ),
    "immovable-properties-and-occupancy-rights": (
        "Immovable Properties & Occupancy Rights saved"
    ),
    "material-assets-encumbrance-and-insurance-linkage": (
        "Material Assets, Encumbrance & Insurance Linkage saved"
    ),
    "material-business-strategic-and-other-contracts": (
        "Material Business, Strategic & Other Contracts saved"
    ),
    "contract-materiality-expiry-and-inspection-readiness": (
        "Contract Materiality, Expiry & Inspection Readiness saved"
    ),
    "reconciliation-changes-and-issuer-confirmations": (
        "Reconciliation, Changes & Issuer Confirmations saved"
    ),
}


def build_company_incorporation_target_route(section_id: str) -> str:
    return (
        f"/projects/demo/workstreams/{COMPANY_INCORPORATION_SLUG}"
        f"?tab=information&section={section_id}"
    )


def build_ipo_setup_target_route(section_id: str) -> str:
    return (
        f"/projects/demo/workstreams/{IPO_SETUP_SLUG}"
        f"?tab=information&section={section_id}"
    )


def build_capital_ownership_target_route(section_id: str) -> str:
    return (
        f"/projects/demo/workstreams/{CAPITAL_OWNERSHIP_SLUG}"
        f"?tab=information&section={section_id}"
    )


def build_business_operations_target_route(section_id: str) -> str:
    return (
        f"/projects/demo/workstreams/{BUSINESS_OPERATIONS_SLUG}"
        f"?tab=information&section={section_id}"
    )


def build_objects_issue_target_route(section_id: str) -> str:
    return (
        f"/projects/demo/workstreams/{OBJECTS_ISSUE_SLUG}"
        f"?tab=information&section={section_id}"
    )


def build_financials_kpis_target_route(section_id: str) -> str:
    return (
        f"/projects/demo/workstreams/{FINANCIALS_KPIS_SLUG}"
        f"?tab=information&section={section_id}"
    )


def build_management_governance_target_route(section_id: str) -> str:
    return (
        f"/projects/demo/workstreams/{MANAGEMENT_GOVERNANCE_SLUG}"
        f"?tab=information&section={section_id}"
    )


def build_industry_market_target_route(section_id: str) -> str:
    return (
        f"/projects/demo/workstreams/{INDUSTRY_MARKET_SLUG}"
        f"?tab=information&section={section_id}"
    )


def build_group_entities_target_route(section_id: str) -> str:
    return (
        f"/projects/demo/workstreams/{GROUP_ENTITIES_SLUG}"
        f"?tab=information&section={section_id}"
    )


def build_borrowings_assets_target_route(section_id: str) -> str:
    return (
        f"/projects/demo/workstreams/{BORROWINGS_ASSETS_SLUG}"
        f"?tab=information&section={section_id}"
    )


def build_company_incorporation_documents_route() -> str:
    return f"/projects/demo/workstreams/{COMPANY_INCORPORATION_SLUG}?tab=documents"


def build_company_incorporation_questions_route(*, issue_id: str | None = None) -> str:
    route = f"/projects/demo/workstreams/{COMPANY_INCORPORATION_SLUG}?tab=questions"
    if issue_id:
        return f"{route}&issueId={issue_id}"
    return route


def build_company_incorporation_facts_route(
    *,
    assertion_id: str | None = None,
    document_version_id: str | None = None,
) -> str:
    route = f"/projects/demo/workstreams/{COMPANY_INCORPORATION_SLUG}?tab=facts"
    if assertion_id:
        return f"{route}&assertionId={assertion_id}"
    if document_version_id:
        return f"{route}&documentVersionId={document_version_id}"
    return route


DOCUMENT_UPLOAD_TITLE = "Document uploaded"
DOCUMENT_REPLACE_TITLE = "Document replaced"
DOCUMENT_ARCHIVE_TITLE = "Document archived"
DOCUMENT_PROCESSING_FAILED_PREFIX = "We could not process"
STRUCTURED_EXTRACTION_FAILED_PREFIX = "We could not extract facts from"
STRUCTURED_ISSUE_TITLE_PREFIX = "Review needed"
