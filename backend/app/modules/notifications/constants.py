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
COMPANY_INCORPORATION_SLUG = "company-incorporation"
IPO_SETUP_SLUG = "ipo-setup-eligibility"
CAPITAL_OWNERSHIP_SLUG = "capital-ownership"
BUSINESS_OPERATIONS_SLUG = "business-operations"
OBJECTS_ISSUE_SLUG = "objects-of-issue"
FINANCIALS_KPIS_SLUG = "financials-kpis"

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
