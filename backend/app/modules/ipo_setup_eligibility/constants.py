"""Constants and error codes for IPO Setup & Eligibility."""

SCHEMA_VERSION = 1

SECTION_IDS = (
    "ipo-direction",
    "offer-structure",
    "track-record-financial",
    "eligibility-declarations",
    "process-readiness",
    "issuer-confirmations",
)

SECTION_PAYLOAD_KEYS: dict[str, str] = {
    "ipo-direction": "ipoDirection",
    "offer-structure": "offerStructure",
    "track-record-financial": "trackRecordAndFinancialEligibility",
    "eligibility-declarations": "eligibilityDeclarations",
    "process-readiness": "processReadiness",
    "issuer-confirmations": "issuerConfirmations",
}

SECTION_LABELS: dict[str, str] = {
    "ipo-direction": "IPO Direction",
    "offer-structure": "Proposed Offer Structure",
    "track-record-financial": "Track Record & Financial Eligibility",
    "eligibility-declarations": "Eligibility Declarations",
    "process-readiness": "Process Readiness",
    "issuer-confirmations": "Issuer Confirmations",
}


class IpoSetupErrorCode:
    WORKSPACE_NOT_FOUND = "IPO_SETUP_WORKSPACE_NOT_FOUND"
    WORKSPACE_VERSION_CONFLICT = "IPO_SETUP_VERSION_CONFLICT"
    VALIDATION_FAILED = "IPO_SETUP_VALIDATION_FAILED"
    UNKNOWN_SECTION = "IPO_SETUP_UNKNOWN_SECTION"


YES_NO_NOT_SURE = frozenset({"", "yes", "no", "not-sure"})

PREPARATION_STAGES = frozenset(
    {
        "",
        "exploring-ipo",
        "preparing-internally",
        "advisers-being-appointed",
        "preparing-draft-offer-document",
        "preparing-exchange-application",
        "application-filed",
    }
)
TARGET_SME_PLATFORMS = frozenset({"", "nse-emerge", "bse-sme", "undecided"})
ELIGIBILITY_PROFILES = frozenset(
    {"", "standard-sme-ipo", "nse-technology-startup-route", "undecided"}
)
PROPOSED_OFFER_TYPES = frozenset(
    {"", "fresh-issue", "offer-for-sale", "fresh-and-ofs", "undecided"}
)
PRICING_METHODS = frozenset({"", "fixed-price", "book-built", "undecided"})
PUBLIC_CONVERSION_STATUSES = frozenset(
    {
        "",
        "not-started",
        "in-progress",
        "completed",
        "professional-confirmation-required",
    }
)
ISSUE_PRICE_STATUSES = frozenset(
    {
        "",
        "not-determined",
        "indicative",
        "finalised-internally",
        "to-be-determined-book-building",
    }
)
TRACK_RECORD_BASES = frozenset(
    {
        "",
        "issuer-company",
        "promoter-promoting-company",
        "predecessor-proprietorship",
        "predecessor-partnership-llp",
        "combination",
        "not-yet-established",
    }
)
FINANCIAL_SOURCE_TYPES = frozenset(
    {
        "",
        "audited-financial-statements",
        "auditor-certificate",
        "management-estimate",
        "not-yet-available",
    }
)
AUDITED_STATUSES = frozenset({"", "audited", "unaudited", "not-available"})
APPROVAL_STATUSES = frozenset({"", "not-started", "draft-prepared", "passed"})
SHAREHOLDER_APPROVAL_STATUSES = frozenset(
    {"", "not-started", "notice-issued", "passed"}
)
APPOINTMENT_STATUSES = frozenset(
    {
        "",
        "not-started",
        "discussions-ongoing",
        "appointed",
        "not-applicable",
        "not-sure",
    }
)
CONNECTIVITY_STATUSES = frozenset(
    {"", "not-started", "in-progress", "completed", "not-applicable", "not-sure"}
)
IN_PRINCIPLE_STATUSES = frozenset(
    {
        "",
        "not-started",
        "drafting",
        "filed",
        "clarifications-pending",
        "approved",
        "not-applicable",
        "not-sure",
    }
)
AMOUNT_UNITS = frozenset({"lakh", "crore"})

DECLARATION_FIELDS: tuple[tuple[str, str], ...] = (
    ("admittedIbcAgainstIssuer", "admittedIbcAgainstIssuerDetails"),
    ("admittedIbcAgainstPromotingCompany", "admittedIbcAgainstPromotingCompanyDetails"),
    ("admittedWindingUpPetition", "admittedWindingUpPetitionDetails"),
    ("issuerDebarredFromCapitalMarkets", "issuerDebarredFromCapitalMarketsDetails"),
    (
        "promoterDirectorSellingShareholderDebarred",
        "promoterDirectorSellingShareholderDebarredDetails",
    ),
    (
        "promoterDirectorAssociatedWithDebarredCompany",
        "promoterDirectorAssociatedWithDebarredCompanyDetails",
    ),
    ("wilfulDefaulterOrFraudulentBorrower", "wilfulDefaulterOrFraudulentBorrowerDetails"),
    ("fugitiveEconomicOffender", "fugitiveEconomicOffenderDetails"),
    (
        "materialRegulatoryOrDisciplinaryAction",
        "materialRegulatoryOrDisciplinaryActionDetails",
    ),
    (
        "seriousCriminalProceedingsInvolvingDirector",
        "seriousCriminalProceedingsInvolvingDirectorDetails",
    ),
    (
        "materialFinancialDefaultDuringRelevantPeriod",
        "materialFinancialDefaultDuringRelevantPeriodDetails",
    ),
    (
        "materialUnresolvedEligibilityLitigation",
        "materialUnresolvedEligibilityLitigationDetails",
    ),
    (
        "proceedsIncludeRelatedPartyLoanRepayment",
        "proceedsIncludeRelatedPartyLoanRepaymentDetails",
    ),
)

ISSUER_CONFIRMATION_KEYS = (
    "offerInputsAreLatestInternalProposal",
    "financialFiguresTraceableToSelectedSource",
    "knownEligibilityConcernsDisclosed",
    "missingAnswersMustNotBeInterpretedAsNegative",
    "proposedOfsIncludesAllIntendedSellingShareholders",
    "assessmentIsPreliminary",
    "professionalAndExchangeConfirmationRemainRequired",
)

# Indicative SME operating-profit screen (₹1 crore) — not a definitive eligibility rule.
OPERATING_PROFIT_THRESHOLD = 10_000_000
