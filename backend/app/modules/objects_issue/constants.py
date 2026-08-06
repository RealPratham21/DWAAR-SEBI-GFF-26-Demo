"""Constants and error codes for Objects of the Issue — mirrors frontend schema exactly."""

SCHEMA_VERSION = 1

SECTION_IDS = (
    "proceeds-and-funding-summary",
    "objects-register-and-allocation",
    "capital-expenditure-facilities-and-expansion",
    "working-capital-and-borrowing-repayment",
    "acquisitions-subsidiaries-jvs-and-investments",
    "means-of-finance-and-deployment-schedule",
    "expenses-gcp-monitoring-and-confirmations",
)

SECTION_PAYLOAD_KEYS: dict[str, str] = {
    "proceeds-and-funding-summary": "proceedsAndFundingSummary",
    "objects-register-and-allocation": "objectsRegisterAndAllocation",
    "capital-expenditure-facilities-and-expansion": "capitalExpenditureFacilitiesAndExpansion",
    "working-capital-and-borrowing-repayment": "workingCapitalAndBorrowingRepayment",
    "acquisitions-subsidiaries-jvs-and-investments": "acquisitionsSubsidiariesJvsAndInvestments",
    "means-of-finance-and-deployment-schedule": "meansOfFinanceAndDeploymentSchedule",
    "expenses-gcp-monitoring-and-confirmations": "expensesGcpMonitoringAndConfirmations",
}

SECTION_LABELS: dict[str, str] = {
    "proceeds-and-funding-summary": "Proceeds & Funding Summary",
    "objects-register-and-allocation": "Objects Register & Allocation",
    "capital-expenditure-facilities-and-expansion": (
        "Capital Expenditure, Facilities & Expansion"
    ),
    "working-capital-and-borrowing-repayment": "Working Capital & Borrowing Repayment",
    "acquisitions-subsidiaries-jvs-and-investments": (
        "Acquisitions, Subsidiaries, JVs & Investments"
    ),
    "means-of-finance-and-deployment-schedule": "Means of Finance & Deployment Schedule",
    "expenses-gcp-monitoring-and-confirmations": (
        "Expenses, GCP, Monitoring & Confirmations"
    ),
}


class ObjectsIssueErrorCode:
    WORKSPACE_NOT_FOUND = "OBJECTS_ISSUE_WORKSPACE_NOT_FOUND"
    WORKSPACE_VERSION_CONFLICT = "OBJECTS_ISSUE_VERSION_CONFLICT"
    VALIDATION_FAILED = "OBJECTS_ISSUE_VALIDATION_FAILED"
    UNKNOWN_SECTION = "OBJECTS_ISSUE_UNKNOWN_SECTION"


# Frontend uses `not_sure` (UNDERSCORE), never `not-sure`.
YES_NO_NOT_SURE = frozenset({"", "yes", "no", "not_sure"})

OBJECTS_OF_ISSUE_CONFIRMATION_FIELDS = (
    "objectsServeBonafideBusinessPurposes",
    "noPartOfProceedsBenefitsRelatedPartiesBeyondDisclosed",
    "deploymentScheduleIsManagementEstimate",
    "shortfallToBeMetFromInternalAccrualsOrOtherSources",
    "meansOfFinanceExcludingIssueProceedsAlreadyTiedUp",
    "monitoringAndUtilisationCertificationRequirementUnderstood",
    "professionalReviewRemainsRequired",
)

# --------------------------------------------------------------------------- #
# Enums — mirrors `frontend/lib/schemas/objects-of-issue.ts` exactly.         #
# --------------------------------------------------------------------------- #

DECLARED_OFFER_TYPE = frozenset(
    {
        "",
        "fresh-issue",
        "offer-for-sale",
        "fresh-issue-and-offer-for-sale",
    }
)

OBJECT_CATEGORY = frozenset(
    {
        "",
        "capital-expenditure",
        "working-capital",
        "repayment-prepayment-of-borrowings",
        "acquisition-or-investment",
        "general-corporate-purposes",
        "other",
    }
)

APPRAISAL_STATUS = frozenset({"", "appraised-by-bank-or-fi", "not-appraised", "not_sure"})

CAPEX_ITEM_TYPE = frozenset(
    {
        "",
        "new-plant-and-machinery",
        "facility-expansion",
        "technology-or-it-upgrade",
        "branch-or-outlet-expansion",
        "land-and-building",
        "research-and-development-infrastructure",
        "other",
    }
)

QUOTATION_SOURCE = frozenset(
    {"", "single-quotation", "multiple-quotations", "not-obtained"}
)

APPROVAL_STATUS = frozenset({"", "not-required", "applied", "received", "pending"})

WORKING_CAPITAL_METHODOLOGY = frozenset(
    {
        "",
        "turnover-method",
        "lending-norms-method",
        "management-estimate",
        "other",
    }
)

LOAN_TYPE = frozenset(
    {
        "",
        "term-loan",
        "working-capital-facility",
        "unsecured-loan",
        "debenture",
        "inter-corporate-deposit",
        "other",
    }
)

TRANSACTION_TYPE = frozenset(
    {
        "",
        "acquisition",
        "subsidiary-investment",
        "joint-venture",
        "strategic-investment",
        "other",
    }
)

DEFINITIVE_AGREEMENT_STATUS = frozenset(
    {
        "",
        "definitive-agreement-executed",
        "term-sheet-or-mou-signed",
        "target-not-yet-identified",
        "not_sure",
    }
)

MEANS_OF_FINANCE_SOURCE = frozenset(
    {
        "",
        "net-proceeds-of-the-issue",
        "internal-accruals",
        "term-loan-or-debt",
        "existing-cash-and-bank-balances",
        "promoter-or-promoter-group-contribution",
        "other",
    }
)

FUNDING_TIE_UP_STATUS = frozenset(
    {
        "",
        "fully-tied-up",
        "partially-tied-up",
        "not-tied-up",
        "not_sure",
    }
)

EXPENSE_CATEGORY = frozenset(
    {
        "",
        "lead-manager-and-underwriting-fees",
        "registrar-fees",
        "legal-and-professional-fees",
        "advertising-and-marketing",
        "printing-and-stationery",
        "listing-and-regulatory-fees",
        "other",
    }
)

MONITORING_AGENCY_STATUS = frozenset(
    {
        "",
        "appointed",
        "identified-not-appointed",
        "not-yet-identified",
        "not-applicable",
    }
)

# IPO Setup uses `fresh-and-ofs`; Objects of the Issue uses `fresh-issue-and-offer-for-sale`.
IPO_TO_OBJECTS_OFFER_TYPE: dict[str, str] = {
    "fresh-issue": "fresh-issue",
    "offer-for-sale": "offer-for-sale",
    "fresh-and-ofs": "fresh-issue-and-offer-for-sale",
    "undecided": "",
}
