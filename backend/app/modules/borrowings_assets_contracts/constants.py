"""Constants and error codes for Borrowings, Assets & Contracts."""

SCHEMA_VERSION = 1

SECTION_IDS = (
    "financial-indebtedness-and-facility-master",
    "security-charges-guarantees-and-borrowing-powers",
    "covenants-defaults-waivers-and-lender-consents",
    "immovable-properties-and-occupancy-rights",
    "material-assets-encumbrance-and-insurance-linkage",
    "material-business-strategic-and-other-contracts",
    "contract-materiality-expiry-and-inspection-readiness",
    "reconciliation-changes-and-issuer-confirmations",
)

SECTION_PAYLOAD_KEYS: dict[str, str] = {
    "financial-indebtedness-and-facility-master": "financialIndebtednessAndFacilityMaster",
    "security-charges-guarantees-and-borrowing-powers": "securityChargesGuaranteesAndBorrowingPowers",
    "covenants-defaults-waivers-and-lender-consents": "covenantsDefaultsWaiversAndLenderConsents",
    "immovable-properties-and-occupancy-rights": "immovablePropertiesAndOccupancyRights",
    "material-assets-encumbrance-and-insurance-linkage": "materialAssetsEncumbranceAndInsuranceLinkage",
    "material-business-strategic-and-other-contracts": "materialBusinessStrategicAndOtherContracts",
    "contract-materiality-expiry-and-inspection-readiness": (
        "contractMaterialityExpiryAndInspectionReadiness"
    ),
    "reconciliation-changes-and-issuer-confirmations": (
        "reconciliationChangesAndIssuerConfirmations"
    ),
}

SECTION_LABELS: dict[str, str] = {
    "financial-indebtedness-and-facility-master": "Financial Indebtedness & Facility Master",
    "security-charges-guarantees-and-borrowing-powers": (
        "Security, Charges, Guarantees & Borrowing Powers"
    ),
    "covenants-defaults-waivers-and-lender-consents": (
        "Covenants, Defaults, Waivers & Lender Consents"
    ),
    "immovable-properties-and-occupancy-rights": "Immovable Properties & Occupancy Rights",
    "material-assets-encumbrance-and-insurance-linkage": (
        "Material Assets, Encumbrance & Insurance Linkage"
    ),
    "material-business-strategic-and-other-contracts": (
        "Material Business, Strategic & Other Contracts"
    ),
    "contract-materiality-expiry-and-inspection-readiness": (
        "Contract Materiality, Expiry & Inspection Readiness"
    ),
    "reconciliation-changes-and-issuer-confirmations": (
        "Reconciliation, Changes & Issuer Confirmations"
    ),
}


class BorrowingsAssetsErrorCode:
    WORKSPACE_NOT_FOUND = "BORROWINGS_ASSETS_WORKSPACE_NOT_FOUND"
    WORKSPACE_VERSION_CONFLICT = "BORROWINGS_ASSETS_VERSION_CONFLICT"
    VALIDATION_FAILED = "BORROWINGS_ASSETS_VALIDATION_FAILED"
    UNKNOWN_SECTION = "BORROWINGS_ASSETS_UNKNOWN_SECTION"


BORROWINGS_ASSETS_SLUG = "borrowings-assets-contracts"

YES_NO_NOT_SURE = frozenset({"", "yes", "no", "not_sure"})

PROFESSIONAL_CONFIRMATION_STATUS = frozenset(
    {"", "confirmed", "pending", "not-required", "not-applicable"}
)

RECONCILIATION_STATUS = frozenset(
    {
        "",
        "reconciled",
        "potential-inconsistency",
        "pending-linked-workstream",
        "pending-professional-confirmation",
    }
)

READINESS_STATE = frozenset(
    {
        "",
        "appears-consistent",
        "potential-concern",
        "missing-information",
        "pending-professional-confirmation",
    }
)

CURRENT_NON_CURRENT = frozenset({"", "current", "non-current"})
FUND_NON_FUND = frozenset({"", "fund-based", "non-fund-based"})
SECURED_CLASSIFICATION = frozenset({"", "secured", "unsecured", "partially-secured"})
RATE_TYPE = frozenset({"", "fixed", "floating"})
INTEREST_BENCHMARK = frozenset(
    {"", "mclr", "repo-linked", "external-benchmark", "sofr-or-foreign-benchmark", "fixed", "other"}
)
REPAYMENT_TYPE = frozenset(
    {"", "bullet", "emi", "equal-principal", "instalments", "on-demand", "revolving", "other"}
)
FACILITY_PURPOSE = frozenset(
    {
        "working-capital",
        "capital-expenditure",
        "machinery",
        "acquisition",
        "refinancing",
        "general-corporate-purposes",
        "project-financing",
        "inventory",
        "receivables",
        "export-financing",
        "vehicle-or-equipment",
        "property",
        "other",
    }
)

BORROWER_TYPE = frozenset(
    {"", "issuer", "subsidiary", "material-subsidiary", "other-linked-entity"}
)
LENDER_TYPE = frozenset(
    {
        "",
        "scheduled-bank",
        "cooperative-bank",
        "nbfc",
        "financial-institution",
        "related-party",
        "promoter",
        "group-entity",
        "director",
        "inter-corporate-lender",
        "debenture-holder-or-trustee",
        "other",
    }
)
FACILITY_TYPE = frozenset(
    {
        "",
        "term-loan",
        "cash-credit",
        "overdraft",
        "working-capital-demand-loan",
        "packing-credit",
        "bill-discounting",
        "buyers-credit",
        "external-commercial-borrowing",
        "inter-corporate-deposit",
        "unsecured-loan",
        "promoter-loan",
        "related-party-loan",
        "equipment-finance",
        "vehicle-finance",
        "lease-financing",
        "non-convertible-debenture",
        "commercial-paper",
        "letter-of-credit",
        "bank-guarantee",
        "forex-derivative-facility",
        "other",
    }
)

SECURITY_TYPE = frozenset(
    {
        "",
        "mortgage",
        "hypothecation",
        "pledge",
        "assignment",
        "lien",
        "fixed-charge",
        "floating-charge",
        "negative-lien",
        "escrow-account-control",
        "dsra",
        "other",
    }
)
SECURED_OBJECT = frozenset(
    {
        "",
        "existing-assets",
        "future-assets",
        "receivables",
        "current-assets",
        "movable-fixed-assets",
        "immovable-property",
        "shares-securities",
        "inventory",
        "bank-account",
        "insurance-proceeds",
        "other",
    }
)
CHARGE_RANKING = frozenset(
    {"", "exclusive", "first-charge", "second-charge", "pari-passu", "subservient", "residual", "not-sure"}
)
CHARGE_STATUS = frozenset(
    {
        "",
        "registered",
        "pending-registration",
        "modified-pending-filing",
        "satisfied",
        "satisfaction-pending",
        "not-applicable",
        "not-sure",
        "professional-confirmation-required",
    }
)
GUARANTEE_TYPE = frozenset(
    {"", "personal", "corporate", "issuer-given", "counter-guarantee", "other"}
)
BORROWING_AUTHORITY_STATE = frozenset(
    {
        "",
        "appears-within-entered-authority",
        "potential-concern",
        "missing-information",
        "pending-professional-confirmation",
    }
)

COVENANT_TYPE = frozenset({"", "financial", "restrictive", "information-reporting", "security", "promoter", "other"})
FINANCIAL_COVENANT_CATEGORY = frozenset(
    {
        "",
        "debt-equity",
        "dscr",
        "interest-coverage",
        "current-ratio",
        "tangible-net-worth",
        "minimum-net-worth",
        "tol-tnw",
        "working-capital",
        "ebitda-debt",
        "security-cover",
        "promoter-contribution",
        "custom",
    }
)
COVENANT_COMPLIANCE_STATUS = frozenset({"", "satisfied", "breached", "not-tested", "not-sure"})
RESTRICTIVE_COVENANT_TRIGGER = frozenset(
    {
        "",
        "additional-borrowing",
        "additional-security",
        "capital-expenditure",
        "dividends",
        "change-in-share-capital",
        "issue-of-securities",
        "ipo-listing",
        "promoter-dilution",
        "change-in-promoter-holding",
        "change-in-control",
        "change-in-management",
        "board-reconstitution",
        "constitutional-document-changes",
        "merger-demerger",
        "acquisition-investment",
        "subsidiary-creation",
        "loans-advances",
        "guarantees-security",
        "asset-disposal",
        "business-diversification",
        "rpts",
        "registered-office-change",
        "bank-account-changes",
        "prepayment-of-other-debt",
        "other",
    }
)
IPO_CONSENT_REQUIREMENT = frozenset(
    {"", "required", "not-required", "not-sure", "pending-professional-review"}
)
DEFAULT_EVENT_TYPE = frozenset(
    {
        "",
        "principal-delay",
        "interest-delay",
        "covenant-breach",
        "security-perfection-issue",
        "documentation-breach",
        "reporting-delay",
        "cross-default",
        "account-irregularity",
        "npa-classification",
        "recall-notice",
        "guarantee-invocation",
        "other",
    }
)
RESTRUCTURING_EVENT_TYPE = frozenset(
    {"", "restructuring", "rescheduling", "one-time-settlement", "waiver", "compromise", "refinancing"}
)
EVENT_CONTINUING_STATUS = frozenset({"", "continuing", "resolved"})

PROPERTY_TYPE = frozenset(
    {
        "",
        "land",
        "factory",
        "warehouse",
        "office",
        "registered-office",
        "corporate-office",
        "branch",
        "store",
        "data-centre",
        "other",
    }
)
OCCUPANCY_BASIS = frozenset(
    {
        "",
        "owned",
        "leased",
        "leave-and-licence",
        "rented",
        "subleased",
        "licence",
        "informal-arrangement",
        "shared-premises",
        "other",
    }
)
PROPERTY_ISSUE_TYPE = frozenset(
    {
        "",
        "title-not-in-issuer-name",
        "missing-registered-deed",
        "stamp-issue",
        "expired-lease",
        "renewal-pending",
        "informal-occupancy",
        "lessor-title-unverified",
        "encumbrance",
        "property-dispute",
        "mortgage-inconsistency",
        "related-party-lease",
        "approval-or-noc-pending",
        "other",
    }
)

ASSET_CLASS = frozenset(
    {
        "",
        "plant-machinery",
        "production-line",
        "critical-equipment",
        "vehicle-fleet",
        "it-server-infrastructure",
        "furniture-equipment",
        "specialised-tooling",
        "pledged-inventory",
        "other",
    }
)
ASSET_OWNERSHIP_BASIS = frozenset({"", "owned", "leased", "hire-purchase", "other"})
INSURANCE_COVERAGE_STATUS = frozenset(
    {"", "current", "expired", "renewal-pending", "not-applicable", "not-sure"}
)

CONTRACT_CATEGORY = frozenset(
    {
        "",
        "key-customer",
        "key-supplier",
        "distribution-dealership",
        "franchise",
        "manufacturing",
        "contract-manufacturing",
        "epc-project",
        "technology",
        "saas-cloud",
        "ip-trademark-licence",
        "patent-software-licence",
        "service",
        "shared-service",
        "logistics",
        "outsourcing",
        "strategic-alliance",
        "collaboration",
        "joint-venture",
        "shareholders-agreement",
        "business-transfer",
        "asset-purchase-sale",
        "acquisition",
        "non-compete",
        "business-allocation",
        "government-concession",
        "property-lease",
        "related-party-commercial",
        "other",
    }
)
COUNTERPARTY_ROLE = frozenset(
    {"", "customer", "supplier", "distributor", "partner", "licensor", "licensee", "service-provider", "other"}
)
CONTRACT_STATUS = frozenset({"", "current", "expired", "terminated", "pending-execution", "other"})
MATERIALITY_STATUS = frozenset(
    {
        "",
        "material",
        "potentially-material",
        "not-material",
        "pending-information",
        "pending-professional-confirmation",
    }
)
INSPECTION_CANDIDATE_TYPE = frozenset({"", "material-contract", "material-document"})

BAC_CHANGE_EVENT_TYPE = frozenset(
    {
        "",
        "new-facility",
        "facility-enhancement",
        "refinancing",
        "facility-closure",
        "charge-creation",
        "charge-modification",
        "charge-satisfaction",
        "guarantee-created",
        "guarantee-released",
        "covenant-amended",
        "default-or-waiver",
        "property-acquired",
        "property-disposed",
        "lease-entered",
        "lease-renewed",
        "lease-terminated",
        "contract-entered",
        "contract-amended",
        "contract-renewed",
        "contract-terminated",
        "other",
    }
)
RELATED_RECORD_TYPE = frozenset(
    {
        "",
        "facility",
        "security",
        "charge",
        "guarantee",
        "covenant",
        "consent",
        "default",
        "property",
        "asset",
        "contract",
        "other",
    }
)

BAC_CRITERION_STATES = (
    "reconciled",
    "potential_concern",
    "missing_information",
    "pending_charge_registration",
    "pending_lender_consent",
    "covenant_review_required",
    "financial_reconciliation_pending",
    "title_review_required",
    "contract_review_required",
    "pending_linked_workstream",
    "pending_professional_confirmation",
    "not_applicable",
)

BAC_ASSESSMENT_GROUPS = (
    "financial_indebtedness",
    "security_and_charges",
    "borrowing_authority",
    "covenants_defaults",
    "ipo_lender_readiness",
    "properties_assets",
    "contracts",
    "cross_workstream_reconciliation",
)

BAC_ASSESSMENT_RESULT_STATES = (
    "insufficient_information",
    "readiness_in_progress",
    "borrowing_gaps_identified",
    "security_charge_gaps_identified",
    "contract_property_gaps_identified",
    "professional_confirmation_required",
    "pending_linked_workstream",
)

BAC_CRITERION_STATE_LABELS: dict[str, str] = {
    "reconciled": "Reconciled",
    "potential_concern": "Potential concern",
    "missing_information": "Missing information",
    "pending_charge_registration": "Pending charge registration",
    "pending_lender_consent": "Pending lender consent",
    "covenant_review_required": "Covenant review required",
    "financial_reconciliation_pending": "Financial reconciliation pending",
    "title_review_required": "Title review required",
    "contract_review_required": "Contract review required",
    "pending_linked_workstream": "Pending linked workstream",
    "pending_professional_confirmation": "Pending professional confirmation",
    "not_applicable": "Not applicable",
}

BAC_ASSESSMENT_GROUP_LABELS: dict[str, str] = {
    "financial_indebtedness": "Financial indebtedness",
    "security_and_charges": "Security and charges",
    "borrowing_authority": "Borrowing authority",
    "covenants_defaults": "Covenants/defaults",
    "ipo_lender_readiness": "IPO lender readiness",
    "properties_assets": "Properties/assets",
    "contracts": "Contracts",
    "cross_workstream_reconciliation": "Cross-workstream reconciliation",
}

BAC_CONFIRMATION_FIELDS: tuple[tuple[str, str], ...] = (
    ("allMaterialBorrowingsDisclosed", "All material borrowings are disclosed"),
    ("fundNonFundFacilitiesIncluded", "Fund and non-fund facilities included"),
    ("securedUnsecuredFacilitiesIncluded", "Secured and unsecured facilities included"),
    ("relatedPartyBorrowingsIncluded", "Related-party borrowings included"),
    ("sanctionOutstandingAmountsCurrent", "Sanction and outstanding amounts are current"),
    ("repaymentTermsComplete", "Repayment terms are complete"),
    ("prepaymentRestrictionsDisclosed", "Prepayment restrictions disclosed"),
    ("allSecuritiesCollateralDisclosed", "All securities/collateral disclosed"),
    ("personalGuaranteesDisclosed", "Personal guarantees disclosed"),
    ("corporateGuaranteesDisclosed", "Corporate guarantees disclosed"),
    ("registrableChargesConsidered", "Registrable charges considered"),
    ("chargeModificationsSatisfactionsDisclosed", "Charge modifications/satisfactions disclosed"),
    ("financialCovenantsDisclosed", "Financial covenants disclosed"),
    ("restrictiveCovenantsDisclosed", "Restrictive covenants disclosed"),
    ("defaultsDelaysDisclosed", "Defaults/delays disclosed"),
    ("waiversCuresDisclosed", "Waivers/cures disclosed"),
    ("crossDefaultsDisclosed", "Cross-defaults disclosed"),
    (
        "ipoChangeOfControlLenderConsentRequirementsReviewed",
        "IPO/change-of-control lender consent requirements reviewed",
    ),
    ("lenderConsentsAccuratelyShown", "Lender consents accurately shown"),
    (
        "debtProposedForIpoRepaymentReconcilesWithObjects",
        "Debt proposed for IPO repayment reconciles with Objects of the Issue",
    ),
    ("materialOwnedPropertiesDisclosed", "Material owned properties disclosed"),
    ("materialLeasedLicensedPremisesDisclosed", "Material leased/licensed premises disclosed"),
    ("relatedPartyPropertyArrangementsDisclosed", "Related-party property arrangements disclosed"),
    ("titleLeaseIssuesDisclosed", "Title/lease issues disclosed"),
    ("materialAssetEncumbrancesDisclosed", "Material asset encumbrances disclosed"),
    ("criticalInsuranceLinkageCaptured", "Critical insurance linkage captured"),
    ("materialContractsDisclosed", "Material contracts disclosed"),
    (
        "nonOrdinaryCourseMaterialAgreementsConsidered",
        "Non-ordinary-course material agreements considered",
    ),
    ("expiryRenewalRisksDisclosed", "Expiry/renewal risks disclosed"),
    ("changeOfControlIpoClausesConsidered", "Change-of-control/IPO clauses considered"),
    ("contractBreachesDisputesIdentified", "Contract breaches/disputes identified"),
    ("linkedWorkstreamDifferencesFlagged", "Linked-workstream differences flagged"),
    (
        "professionalConfirmationRequired",
        "Professional/legal/accounting/merchant-banker confirmation remains required",
    ),
)

RECONCILIATION_TOLERANCE = 1
