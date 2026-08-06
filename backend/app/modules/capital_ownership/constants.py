"""Constants and error codes for Capital & Ownership — mirrors frontend schema exactly."""

SCHEMA_VERSION = 1

SECTION_IDS = (
    "current-capital-structure",
    "share-capital-history",
    "shareholders-beneficial-ownership",
    "promoters-and-control",
    "pre-post-issue-ownership",
    "promoter-contribution-lock-in",
    "outstanding-securities-confirmations",
)

SECTION_PAYLOAD_KEYS: dict[str, str] = {
    "current-capital-structure": "currentCapitalStructure",
    "share-capital-history": "shareCapitalHistory",
    "shareholders-beneficial-ownership": "shareholdersAndBeneficialOwnership",
    "promoters-and-control": "promotersAndControl",
    "pre-post-issue-ownership": "preAndPostIssueOwnership",
    "promoter-contribution-lock-in": "promoterContributionLockInAndEncumbrances",
    "outstanding-securities-confirmations": "outstandingSecuritiesTransactionsAndConfirmations",
}

SECTION_LABELS: dict[str, str] = {
    "current-capital-structure": "Current Capital Structure",
    "share-capital-history": "Share Capital History",
    "shareholders-beneficial-ownership": "Shareholders & Beneficial Ownership",
    "promoters-and-control": "Promoters & Control",
    "pre-post-issue-ownership": "Pre & Post-Issue Ownership",
    "promoter-contribution-lock-in": "Promoter Contribution, Lock-In & Encumbrances",
    "outstanding-securities-confirmations": "Outstanding Securities, Transactions & Confirmations",
}


class CapitalOwnershipErrorCode:
    WORKSPACE_NOT_FOUND = "CAPITAL_OWNERSHIP_WORKSPACE_NOT_FOUND"
    WORKSPACE_VERSION_CONFLICT = "CAPITAL_OWNERSHIP_VERSION_CONFLICT"
    VALIDATION_FAILED = "CAPITAL_OWNERSHIP_VALIDATION_FAILED"
    UNKNOWN_SECTION = "CAPITAL_OWNERSHIP_UNKNOWN_SECTION"


# Frontend uses `not_sure` (UNDERSCORE), never `not-sure`.
YES_NO_NOT_SURE = frozenset({"", "yes", "no", "not_sure"})

CAPITAL_AMOUNT_UNIT_VALUES = frozenset({"rupees", "lakh", "crore"})

DEMAT_STATUS_VALUES = frozenset(
    {
        "",
        "fully-dematerialised",
        "partly-dematerialised",
        "fully-physical",
        "unknown",
    }
)

DEPOSITORY_CONNECTIVITY_VALUES = frozenset({"", "nsdl", "cdsl", "both", "none", "unknown"})

SECURITY_TYPE_VALUES = frozenset(
    {
        "",
        "equity",
        "preference",
        "convertible-instrument",
        "warrant",
        "debenture",
        "other",
    }
)

EQUITY_CLASS_TYPE_VALUES = frozenset(
    {
        "",
        "ordinary-equity",
        "equity-with-differential-voting-rights",
        "equity-with-superior-voting-rights",
        "partly-paid-equity",
        "other",
    }
)

PREFERENCE_CLASS_TYPE_VALUES = frozenset(
    {
        "",
        "cumulative-redeemable",
        "non-cumulative-redeemable",
        "cumulative-convertible",
        "non-cumulative-convertible",
        "compulsorily-convertible",
        "optionally-convertible",
        "other",
    }
)

CAPITAL_EVENT_TYPE_VALUES = frozenset(
    {
        "",
        "incorporation-initial-subscription",
        "further-allotment-cash",
        "rights-issue",
        "bonus-issue",
        "preferential-allotment",
        "private-placement",
        "esop-allotment",
        "sweat-equity-allotment",
        "conversion-of-securities",
        "conversion-of-loan",
        "scheme-of-arrangement",
        "share-split-subdivision",
        "share-consolidation",
        "buyback",
        "capital-reduction",
        "forfeiture-of-shares",
        "redemption-of-preference-shares",
        "cancellation-of-shares",
        "increase-in-authorised-capital",
        "other",
    }
)

CONSIDERATION_TYPE_VALUES = frozenset(
    {
        "",
        "cash",
        "other-than-cash",
        "part-cash-part-other",
        "bonus-capitalisation",
        "conversion",
        "scheme-of-arrangement",
        "nil-consideration",
        "unknown",
    }
)

RESOLUTION_TYPE_VALUES = frozenset(
    {
        "",
        "board-resolution",
        "shareholder-ordinary-resolution",
        "shareholder-special-resolution",
        "nclt-order",
        "court-order",
        "not-applicable",
        "unknown",
    }
)

HOLDER_TYPE_VALUES = frozenset(
    {
        "",
        "individual",
        "hindu-undivided-family",
        "body-corporate",
        "limited-liability-partnership",
        "partnership-firm",
        "trust",
        "bank",
        "financial-institution",
        "insurance-company",
        "mutual-fund",
        "alternative-investment-fund",
        "venture-capital-fund",
        "foreign-venture-capital-investor",
        "foreign-portfolio-investor",
        "foreign-company",
        "non-resident-indian",
        "employee",
        "employee-welfare-trust",
        "government-or-government-body",
        "other",
    }
)

RESIDENTIAL_STATUS_VALUES = frozenset(
    {
        "",
        "resident",
        "non-resident-indian",
        "foreign-national",
        "foreign-entity",
        "unknown",
    }
)

SHAREHOLDER_CATEGORY_VALUES = frozenset(
    {
        "",
        "promoter",
        "promoter-group",
        "public",
        "employee",
        "institutional-investor",
        "body-corporate",
        "other",
    }
)

ACQUISITION_MODE_VALUES = frozenset(
    {
        "",
        "subscription-to-memorandum",
        "cash-subscription-allotment",
        "rights-issue",
        "bonus-issue",
        "preferential-allotment",
        "private-placement",
        "secondary-purchase",
        "gift",
        "transmission",
        "scheme-of-arrangement",
        "conversion-of-securities",
        "esop-exercise",
        "sweat-equity",
        "other-than-cash",
        "other",
    }
)

IDENTIFIER_TYPE_VALUES = frozenset(
    {
        "",
        "pan",
        "cin",
        "llpin",
        "passport",
        "foreign-registration-number",
        "other",
    }
)

BENEFICIAL_INTEREST_NATURE_VALUES = frozenset(
    {
        "",
        "shares",
        "voting-rights",
        "right-to-distributions",
        "significant-influence-or-control",
        "other",
    }
)

PROMOTER_TYPE_VALUES = frozenset(
    {
        "",
        "individual",
        "body-corporate",
        "hindu-undivided-family",
        "partnership-firm",
        "limited-liability-partnership",
        "trust",
        "other",
    }
)

PROMOTER_STATUS_BASIS_VALUES = frozenset(
    {
        "",
        "shareholding",
        "control-over-affairs",
        "named-in-offer-document",
        "board-representation",
        "shareholders-agreement-rights",
        "management-control",
        "other",
    }
)

PROMOTER_GROUP_RELATIONSHIP_VALUES = frozenset(
    {
        "",
        "spouse",
        "father",
        "mother",
        "brother",
        "sister",
        "son",
        "daughter",
        "spouse-father",
        "spouse-mother",
        "spouse-brother",
        "spouse-sister",
        "hindu-undivided-family-member",
        "body-corporate-controlled-by-promoter",
        "body-corporate-in-which-promoter-holds-twenty-percent",
        "body-corporate-holding-twenty-percent-in-promoter",
        "firm-in-which-promoter-is-partner",
        "llp-in-which-promoter-is-partner",
        "trust-with-promoter-as-trustee-or-beneficiary",
        "other",
    }
)

PROMOTER_GROUP_BASIS_VALUES = frozenset(
    {
        "",
        "immediate-relative",
        "shareholding-threshold",
        "common-control",
        "hindu-undivided-family",
        "firm-or-llp",
        "trust",
        "other",
    }
)

CONTROL_ARRANGEMENT_TYPE_VALUES = frozenset(
    {
        "",
        "shareholders-agreement",
        "voting-agreement",
        "share-subscription-agreement",
        "joint-venture-agreement",
        "articles-of-association-special-rights",
        "board-nomination-right",
        "affirmative-vote-rights",
        "veto-rights",
        "put-or-call-option",
        "right-of-first-refusal",
        "tag-along-right",
        "drag-along-right",
        "anti-dilution-right",
        "share-pledge-with-voting-rights",
        "power-of-attorney",
        "family-arrangement",
        "management-agreement",
        "other",
    }
)

LOCK_IN_PERIOD_VALUES = frozenset(
    {
        "",
        "three-years",
        "eighteen-months",
        "one-year",
        "six-months",
        "not-applicable",
    }
)

CONTRIBUTION_ACQUISITION_MODE_VALUES = frozenset(
    {
        "",
        "cash-subscription",
        "cash-purchase",
        "bonus-out-of-free-reserves",
        "bonus-out-of-revaluation-reserves",
        "conversion-of-convertible-security",
        "consideration-other-than-cash",
        "gift",
        "transmission",
        "scheme-of-arrangement",
        "esop-exercise",
        "other",
    }
)

ENCUMBRANCE_TYPE_VALUES = frozenset(
    {
        "",
        "pledge",
        "lien",
        "non-disposal-undertaking",
        "negative-lien",
        "mortgage",
        "charge",
        "option-arrangement",
        "other",
    }
)

OUTSTANDING_INSTRUMENT_TYPE_VALUES = frozenset(
    {
        "",
        "employee-stock-option-scheme",
        "employee-stock-purchase-scheme",
        "sweat-equity",
        "compulsorily-convertible-preference-shares",
        "optionally-convertible-preference-shares",
        "compulsorily-convertible-debentures",
        "optionally-convertible-debentures",
        "warrants",
        "convertible-loan",
        "share-purchase-option",
        "right-to-subscribe",
        "other",
    }
)

INSTRUMENT_HOLDER_CATEGORY_VALUES = frozenset(
    {
        "",
        "promoter",
        "promoter-group",
        "directors",
        "key-managerial-personnel",
        "employees",
        "investors",
        "lenders",
        "other",
    }
)

TRANSACTION_TYPE_VALUES = frozenset(
    {
        "",
        "primary-allotment",
        "secondary-transfer",
        "gift",
        "transmission",
        "buyback",
        "pledge-invocation",
        "conversion",
        "esop-exercise",
        "capital-reduction",
        "other",
    }
)

CAPITAL_OWNERSHIP_CONFIRMATION_KEYS = (
    "capitalStructureFiguresMatchStatutoryRegisters",
    "shareCapitalHistoryIsComplete",
    "shareholdingDetailsAreCurrentAsOnStatedDate",
    "promoterAndPromoterGroupIdentificationIsComplete",
    "allOutstandingConvertibleInstrumentsDisclosed",
    "allEncumbrancesOnPromoterSharesDisclosed",
    "noUndisclosedShareholderAgreementsOrControlArrangements",
    "offerForSaleSharesAreWithinExistingHoldings",
    "missingAnswersMustNotBeInterpretedAsNegative",
    "computedFiguresAreIndicativeOnly",
    "professionalAndRegistrarConfirmationRemainRequired",
)

# SEBI minimum promoter contribution benchmark used when the issuer states no target.
DEFAULT_MINIMUM_CONTRIBUTION_PERCENTAGE = "20"
