"""Constants and error codes for Group Entities & Related Parties."""

SCHEMA_VERSION = 1

SECTION_IDS = (
    "group-structure-and-entity-master",
    "ownership-control-and-relationship-mapping",
    "group-company-and-materiality-classification",
    "related-party-universe-and-classification",
    "related-party-transactions-balances-and-commitments",
    "common-pursuits-dependencies-and-conflicts",
    "group-entity-financial-regulatory-and-litigation-readiness",
    "changes-rpt-readiness-and-confirmations",
)

SECTION_PAYLOAD_KEYS: dict[str, str] = {
    "group-structure-and-entity-master": "groupStructureAndEntityMaster",
    "ownership-control-and-relationship-mapping": "ownershipControlAndRelationshipMapping",
    "group-company-and-materiality-classification": "groupCompanyAndMaterialityClassification",
    "related-party-universe-and-classification": "relatedPartyUniverseAndClassification",
    "related-party-transactions-balances-and-commitments": (
        "relatedPartyTransactionsBalancesAndCommitments"
    ),
    "common-pursuits-dependencies-and-conflicts": "commonPursuitsDependenciesAndConflicts",
    "group-entity-financial-regulatory-and-litigation-readiness": (
        "groupEntityFinancialRegulatoryAndLitigationReadiness"
    ),
    "changes-rpt-readiness-and-confirmations": "changesRptReadinessAndConfirmations",
}

SECTION_LABELS: dict[str, str] = {
    "group-structure-and-entity-master": "Group Structure & Entity Master",
    "ownership-control-and-relationship-mapping": (
        "Ownership, Control & Relationship Mapping"
    ),
    "group-company-and-materiality-classification": (
        "Group Company & Materiality Classification"
    ),
    "related-party-universe-and-classification": (
        "Related Party Universe & Classification"
    ),
    "related-party-transactions-balances-and-commitments": (
        "Related Party Transactions, Balances & Commitments"
    ),
    "common-pursuits-dependencies-and-conflicts": (
        "Common Pursuits, Dependencies & Conflicts"
    ),
    "group-entity-financial-regulatory-and-litigation-readiness": (
        "Group Entity Financial, Regulatory & Litigation Readiness"
    ),
    "changes-rpt-readiness-and-confirmations": (
        "Changes, RPT Readiness & Confirmations"
    ),
}


class GroupEntitiesErrorCode:
    WORKSPACE_NOT_FOUND = "GROUP_ENTITIES_WORKSPACE_NOT_FOUND"
    WORKSPACE_VERSION_CONFLICT = "GROUP_ENTITIES_VERSION_CONFLICT"
    VALIDATION_FAILED = "GROUP_ENTITIES_VALIDATION_FAILED"
    UNKNOWN_SECTION = "GROUP_ENTITIES_UNKNOWN_SECTION"


GROUP_ENTITIES_SLUG = "group-entities-related-parties"

YES_NO_NOT_SURE = frozenset({"", "yes", "no", "not_sure"})

ENTITY_TYPE = frozenset(
    {
        "",
        "indian-company",
        "foreign-body-corporate",
        "llp",
        "partnership",
        "proprietorship",
        "trust",
        "huf",
        "joint-venture",
        "association-body-of-persons",
        "fund",
        "other",
    }
)

ENTITY_STATUS = frozenset(
    {
        "",
        "active",
        "dormant",
        "under-strike-off",
        "struck-off",
        "under-liquidation",
        "under-insolvency",
        "wound-up",
        "amalgamated",
        "dissolved",
        "other",
    }
)

LISTED_STATUS = frozenset({"", "listed", "unlisted", "delisted", "not-applicable"})

ENTITY_CLASSIFICATION_BADGE = frozenset(
    {
        "parent",
        "ultimate-parent",
        "subsidiary",
        "step-down-subsidiary",
        "associate",
        "jv",
        "common-control-entity",
        "promoter-group-entity",
        "related-party",
        "icdr-group-company",
        "material-subsidiary",
        "other",
    }
)

OWNERSHIP_RELATIONSHIP_TYPE = frozenset(
    {
        "",
        "direct-holding",
        "indirect-holding",
        "subsidiary",
        "step-down-subsidiary",
        "associate",
        "joint-venture",
        "holding-company",
        "fellow-subsidiary",
        "common-control-entity",
        "promoter-controlled",
        "significant-influence",
        "other",
    }
)

CURRENT_HISTORICAL = frozenset({"", "current", "historical"})

PROFESSIONAL_CONFIRMATION_STATUS = frozenset(
    {"", "confirmed", "pending", "not-required", "not-applicable"}
)

AGREEMENT_TYPE = frozenset(
    {
        "",
        "shareholders-agreement",
        "voting-agreement",
        "management-agreement",
        "joint-control-arrangement",
        "other",
    }
)

COMMON_PERSON_RELATIONSHIP_TYPE = frozenset(
    {
        "",
        "common-promoter",
        "common-director",
        "common-kmp",
        "common-beneficial-owner",
        "promoter-relative",
        "nominee-director",
    }
)

REGULATORY_CLASSIFICATION_TYPE = frozenset(
    {
        "",
        "subsidiary",
        "step-down-subsidiary",
        "associate",
        "joint-venture",
        "holding-company",
        "common-control-entity",
        "promoter-group-entity",
        "icdr-group-company",
        "material-subsidiary",
    }
)

CLASSIFICATION_READINESS_STATE = frozenset(
    {
        "",
        "appears_consistent",
        "potential_classification",
        "potential_inconsistency",
        "missing_information",
        "pending_professional_confirmation",
    }
)

ICDR_GROUP_COMPANY_STATE = frozenset(
    {
        "",
        "identified",
        "potentially_identified",
        "not_group_company",
        "pending_financial_reconciliation",
        "pending_board_determination",
        "pending_professional_confirmation",
    }
)

ICDR_IDENTIFICATION_BASIS = frozenset({"", "rpt-based", "board-materiality", "both", "other"})

MATERIALITY_METRIC_TYPE = frozenset(
    {
        "",
        "revenue",
        "net-worth",
        "turnover",
        "rpt-amount",
        "qualitative-materiality",
        "material-adverse-effect",
        "other",
    }
)

THRESHOLD_TYPE = frozenset({"", "percentage", "amount", "qualitative"})

STANDALONE_CONSOLIDATED = frozenset({"", "standalone", "consolidated", "both"})

MATERIAL_SUBSIDIARY_PURPOSE = frozenset(
    {
        "",
        "lodr",
        "subsidiary-financial-publication",
        "tax-benefit-disclosure",
        "approval-due-diligence",
        "offer-document-purpose",
        "other",
    }
)

RELATED_PARTY_PARTY_TYPE = frozenset({"", "entity", "person"})

LINKED_PERSON_ROLE = frozenset(
    {
        "",
        "promoter",
        "director",
        "kmp",
        "smp",
        "relative-of-director",
        "relative-of-kmp",
        "other",
    }
)

RELATED_PARTY_CATEGORY = frozenset(
    {
        "",
        "parent",
        "subsidiary",
        "fellow-subsidiary",
        "associate",
        "joint-venture",
        "promoter",
        "promoter-group-entity",
        "director",
        "kmp",
        "relative-of-director",
        "relative-of-kmp",
        "entity-controlled-by-director-kmp-relative",
        "entity-under-significant-influence",
        "common-control-entity",
        "management-entity",
        "post-employment-benefit-plan",
        "other",
    }
)

CLASSIFICATION_FRAMEWORK = frozenset(
    {
        "",
        "companies-act",
        "ind-as-24",
        "as-18",
        "other-accounting-standard",
        "sebi-lodr",
        "sebi-icdr-group-company",
        "promoter-group",
        "other",
    }
)

RELATIONSHIP_SOURCE_TYPE = frozenset(
    {
        "",
        "financial-statements",
        "rpt-schedule",
        "register-of-members",
        "director-kmp-declaration",
        "mbp-1",
        "group-structure",
        "agreement",
        "mca-record",
        "management-representation",
        "other",
    }
)

RPT_TRANSACTION_TYPE = frozenset(
    {
        "",
        "sale-of-goods-materials",
        "purchase-of-goods-materials",
        "sale-of-services",
        "purchase-receipt-of-services",
        "property-purchase",
        "property-sale",
        "lease-rent-paid",
        "lease-rent-received",
        "agent-arrangement",
        "management-services",
        "employee-deputation",
        "rd-transfer",
        "licence-royalty",
        "loan-given",
        "loan-received",
        "advance-given",
        "advance-received",
        "equity-contribution",
        "investment",
        "share-security-issuance",
        "guarantee",
        "corporate-guarantee",
        "collateral-security",
        "reimbursement-of-expenses",
        "remuneration",
        "dividend",
        "office-place-of-profit",
        "underwriting",
        "asset-transfer",
        "other",
    }
)

ARMS_LENGTH_STATUS = frozenset(
    {
        "",
        "confirmed",
        "management_believes_yes",
        "no",
        "not_sure",
        "pending_professional_confirmation",
    }
)

RECURRING_NON_RECURRING = frozenset({"", "recurring", "non-recurring", "not-applicable"})

CASH_NON_CASH = frozenset({"", "cash", "non-cash", "mixed", "not-applicable"})

RPT_BALANCE_TYPE = frozenset(
    {
        "",
        "receivable",
        "payable",
        "loan-receivable",
        "loan-payable",
        "advance",
        "deposit",
        "accrued-income",
        "accrued-expense",
        "guarantee-exposure",
        "security-collateral",
        "commitment",
        "other",
    }
)

SECURED_UNSECURED = frozenset({"", "secured", "unsecured", "not-applicable"})

INTEREST_BEARING = frozenset(
    {"", "interest-bearing", "non-interest-bearing", "not-applicable"}
)

DEPENDENCY_TYPE = frozenset(
    {
        "",
        "supplier",
        "customer",
        "service-provider",
        "distributor",
        "manufacturer",
        "technology-provider",
        "lender",
        "landlord",
        "licensor",
        "employee-resource-sharing",
        "shared-facility",
        "shared-brand",
        "shared-ip",
        "shared-infrastructure",
        "other",
    }
)

OTHER_BUSINESS_INTEREST_TYPE = frozenset(
    {
        "",
        "commercial-business-with-issuer",
        "proposed-future-business",
        "interest-in-issuer-property",
        "interest-in-assets-machinery-supplied",
        "land-building-relationship",
        "ip-licence-relationship",
        "financing-relationship",
        "other",
    }
)

ENTITY_INFORMATION_STATUS = frozenset(
    {"", "complete", "partial", "refused", "unavailable", "not-requested"}
)

AUDIT_STATUS = frozenset({"", "audited", "unaudited", "reviewed", "not-available"})

RELATIONSHIP_CHANGE_EVENT = frozenset(
    {
        "",
        "became-subsidiary",
        "ceased-subsidiary",
        "became-associate",
        "ceased-associate",
        "jv-formed",
        "jv-terminated",
        "entity-acquired",
        "entity-disposed",
        "merger",
        "demerger",
        "amalgamation",
        "promoter-relationship-created",
        "promoter-relationship-ceased",
        "became-related-party",
        "ceased-related-party",
        "became-group-company",
        "ceased-group-company",
        "control-acquired",
        "control-lost",
        "renamed-reconstituted",
        "other",
    }
)

GROUP_CRITERION_STATES = (
    "reconciled",
    "potential_concern",
    "missing_information",
    "unresolved_relationship",
    "classification_review_required",
    "financial_reconciliation_pending",
    "pending_entity_information",
    "pending_linked_workstream",
    "pending_board_determination",
    "pending_professional_confirmation",
    "not_applicable",
)

GROUP_ASSESSMENT_GROUPS = (
    "group_structure",
    "ownership_control",
    "regulatory_classifications",
    "related_party_completeness",
    "rpt_reconciliation",
    "common_pursuits_conflicts",
    "group_company_information",
    "cross_workstream_consistency",
    "final_readiness",
)

GROUP_ASSESSMENT_RESULT_STATES = (
    "insufficient_information",
    "readiness_in_progress",
    "classification_gaps_identified",
    "rpt_gaps_identified",
    "entity_information_gaps",
    "professional_confirmation_required",
    "pending_linked_workstream",
)

GROUP_CRITERION_STATE_LABELS: dict[str, str] = {
    "reconciled": "Reconciled",
    "potential_concern": "Potential concern",
    "missing_information": "Missing information",
    "unresolved_relationship": "Unresolved relationship",
    "classification_review_required": "Classification review required",
    "financial_reconciliation_pending": "Financial reconciliation pending",
    "pending_entity_information": "Pending entity information",
    "pending_linked_workstream": "Pending linked workstream",
    "pending_board_determination": "Pending Board determination",
    "pending_professional_confirmation": "Pending professional confirmation",
    "not_applicable": "Not applicable",
}

GROUP_ASSESSMENT_GROUP_LABELS: dict[str, str] = {
    "group_structure": "Group structure",
    "ownership_control": "Ownership/control relationships",
    "regulatory_classifications": "Regulatory classifications",
    "related_party_completeness": "Related-party completeness",
    "rpt_reconciliation": "RPT reconciliation",
    "common_pursuits_conflicts": "Common pursuits and conflicts",
    "group_company_information": "Group Company information",
    "cross_workstream_consistency": "Cross-workstream consistency",
    "final_readiness": "Final readiness",
}

GROUP_ENTITIES_CONFIRMATION_FIELDS = (
    ("allSubsidiariesDisclosed", "All subsidiaries disclosed"),
    ("stepDownSubsidiariesDisclosed", "Step-down subsidiaries disclosed"),
    ("associatesJvsDisclosed", "Associates and JVs disclosed"),
    (
        "ultimateParentControlStructureAccurate",
        "Ultimate parent/control structure accurate",
    ),
    ("promoterGroupRelationshipsComplete", "Promoter-group relationships complete"),
    (
        "accountingStandardRelatedPartiesIdentified",
        "Applicable accounting-standard related parties identified",
    ),
    (
        "companiesActRelatedPartiesConsidered",
        "Companies Act related parties considered",
    ),
    ("historicalRelatedPartiesIncluded", "Historical related parties included"),
    (
        "icdrGroupCompaniesIdentified",
        "ICDR Group Companies identified using applicable criteria and Board policy",
    ),
    (
        "subsidiariesPromotersNotDuplicatedAsGroupCompanies",
        "Subsidiaries/promoters not incorrectly duplicated as Group Companies",
    ),
    ("currentMaterialityPolicyCaptured", "Current Materiality Policy captured"),
    ("rptRegisterComplete", "RPT register complete"),
    ("outstandingBalancesComplete", "Outstanding balances complete"),
    ("commitmentsComplete", "Commitments complete"),
    ("guaranteesCollateralComplete", "Guarantees/collateral complete"),
    ("loansAdvancesComplete", "Loans and advances complete"),
    ("commonPursuitsDisclosed", "Common pursuits disclosed"),
    (
        "groupCompanyDependenciesDisclosed",
        "Group-company dependencies disclosed",
    ),
    (
        "competingGroupBusinessesDisclosed",
        "Competing group businesses disclosed",
    ),
    (
        "groupCompanyFinancialInformationCurrent",
        "Group-company financial information current to extent available",
    ),
    (
        "negativeNetWorthAuditorConcernsDisclosed",
        "Negative net-worth/auditor concerns disclosed",
    ),
    (
        "ibcWindingUpStrikeOffDisclosed",
        "IBC/winding-up/strike-off matters disclosed",
    ),
    (
        "informationUnavailableFromGroupCompaniesIdentified",
        "Information unavailable from Group Companies identified",
    ),
    ("conflictingClassificationsFlagged", "Conflicting classifications flagged"),
    ("linkedWorkstreamValuesReconciled", "Linked-workstream values reconciled"),
    (
        "professionalConfirmationRequired",
        "Professional/accounting/legal/merchant-banker confirmation remains required",
    ),
)
