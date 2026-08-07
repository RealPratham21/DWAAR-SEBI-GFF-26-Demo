"""Constants and error codes for Litigation, Approvals & Compliance."""

SCHEMA_VERSION = 1

SECTION_IDS = (
    "legal-universe-materiality-policy-and-party-mapping",
    "litigation-and-proceedings-master",
    "criminal-regulatory-tax-and-enforcement-readiness",
    "government-regulatory-and-business-approvals-master",
    "approval-conditions-facility-compliance-and-renewal-readiness",
    "corporate-statutory-and-operational-compliance-exceptions",
    "material-creditors-penalties-and-material-developments",
    "reconciliation-remediation-and-issuer-confirmations",
)

SECTION_PAYLOAD_KEYS: dict[str, str] = {
    "legal-universe-materiality-policy-and-party-mapping": (
        "legalUniverseMaterialityPolicyAndPartyMapping"
    ),
    "litigation-and-proceedings-master": "litigationAndProceedingsMaster",
    "criminal-regulatory-tax-and-enforcement-readiness": (
        "criminalRegulatoryTaxAndEnforcementReadiness"
    ),
    "government-regulatory-and-business-approvals-master": (
        "governmentRegulatoryAndBusinessApprovalsMaster"
    ),
    "approval-conditions-facility-compliance-and-renewal-readiness": (
        "approvalConditionsFacilityComplianceAndRenewalReadiness"
    ),
    "corporate-statutory-and-operational-compliance-exceptions": (
        "corporateStatutoryAndOperationalComplianceExceptions"
    ),
    "material-creditors-penalties-and-material-developments": (
        "materialCreditorsPenaltiesAndMaterialDevelopments"
    ),
    "reconciliation-remediation-and-issuer-confirmations": (
        "reconciliationRemediationAndIssuerConfirmations"
    ),
}

SECTION_LABELS: dict[str, str] = {
    "legal-universe-materiality-policy-and-party-mapping": (
        "Legal Universe, Materiality Policy & Party Mapping"
    ),
    "litigation-and-proceedings-master": "Litigation & Proceedings Master",
    "criminal-regulatory-tax-and-enforcement-readiness": (
        "Criminal, Regulatory, Tax & Enforcement Readiness"
    ),
    "government-regulatory-and-business-approvals-master": (
        "Government, Regulatory & Business Approvals Master"
    ),
    "approval-conditions-facility-compliance-and-renewal-readiness": (
        "Approval Conditions, Facility Compliance & Renewal Readiness"
    ),
    "corporate-statutory-and-operational-compliance-exceptions": (
        "Corporate, Statutory & Operational Compliance Exceptions"
    ),
    "material-creditors-penalties-and-material-developments": (
        "Material Creditors, Penalties & Material Developments"
    ),
    "reconciliation-remediation-and-issuer-confirmations": (
        "Reconciliation, Remediation & Issuer Confirmations"
    ),
}


class LitigationApprovalsComplianceErrorCode:
    WORKSPACE_NOT_FOUND = "LITIGATION_APPROVALS_COMPLIANCE_WORKSPACE_NOT_FOUND"
    WORKSPACE_VERSION_CONFLICT = "LITIGATION_APPROVALS_COMPLIANCE_VERSION_CONFLICT"
    VALIDATION_FAILED = "LITIGATION_APPROVALS_COMPLIANCE_VALIDATION_FAILED"
    UNKNOWN_SECTION = "LITIGATION_APPROVALS_COMPLIANCE_UNKNOWN_SECTION"


LAC_SLUG = "litigation-approvals-compliance"

YES_NO_NOT_SURE = frozenset({"", "yes", "no", "not_sure"})

PROFESSIONAL_CONFIRMATION_STATUS = frozenset(
    {"", "confirmed", "pending", "not-required", "not-applicable"}
)

RECONCILIATION_STATUS = frozenset(
    {
        "",
        "reconciled",
        "potential-inconsistency",
        "missing-information",
        "pending-linked-workstream",
        "pending-professional-confirmation",
    }
)

CURRENT_HISTORICAL = frozenset({"", "current", "historical"})
STANDALONE_CONSOLIDATED = frozenset({"", "standalone", "consolidated", "both"})
READINESS_STATE = frozenset(
    {
        "",
        "appears-consistent",
        "potential-concern",
        "missing-information",
        "pending-professional-confirmation",
    }
)

LEGAL_PARTY_CATEGORY = frozenset(
    {
        "",
        "issuer",
        "promoter",
        "director",
        "kmp",
        "smp",
        "former-director",
        "former-kmp",
        "selling-shareholder",
        "subsidiary",
        "material-subsidiary",
        "group-company",
        "promoter-group-entity",
        "associate",
        "joint-venture",
        "other-relevant-person",
        "other-relevant-entity",
    }
)

MATERIALITY_METRIC_TYPE = frozenset(
    {
        "",
        "pat",
        "revenue",
        "turnover",
        "net-worth",
        "total-assets",
        "absolute-amount",
        "other",
    }
)

QUALITATIVE_CRITERION_TYPE = frozenset(
    {
        "",
        "business-operations",
        "reputation",
        "licence-approval",
        "key-asset",
        "management",
        "financing",
        "ipo-listing",
        "ability-to-continue-material-activity",
        "financial-position",
        "future-operations",
        "other",
    }
)

MATTER_CATEGORY = frozenset(
    {
        "",
        "criminal",
        "civil",
        "commercial",
        "arbitration",
        "tax",
        "regulatory",
        "statutory",
        "administrative",
        "consumer",
        "labour-employment",
        "environmental",
        "intellectual-property",
        "property-land",
        "insolvency-ibc",
        "competition-antitrust",
        "data-privacy-cyber",
        "customs",
        "foreign-exchange-fema",
        "company-law-nclt",
        "securities-law",
        "economic-offence",
        "other",
    }
)

MATTER_DIRECTION = frozenset(
    {
        "",
        "filed-by-relevant-party",
        "filed-against-relevant-party",
        "cross-proceedings",
        "investigation-enquiry",
        "notice-or-proceeding-by-authority",
        "suo-motu-authority-action",
        "other",
    }
)

MATTER_PARTY_ROLE = frozenset(
    {
        "",
        "petitioner",
        "claimant",
        "complainant",
        "appellant",
        "respondent",
        "defendant",
        "accused",
        "co-accused",
        "noticee",
        "investigated-party",
        "other",
    }
)

FORUM_CATEGORY = frozenset(
    {
        "",
        "supreme-court",
        "high-court",
        "district-or-civil-court",
        "magistrate-or-criminal-court",
        "nclt",
        "nclat",
        "drt",
        "drat",
        "arbitral-tribunal",
        "consumer-commission",
        "income-tax-authority",
        "gst-authority",
        "customs-authority",
        "sebi",
        "stock-exchange",
        "roc-mca",
        "rbi",
        "competition-commission",
        "pollution-control-board",
        "labour-authority",
        "police-or-investigating-agency",
        "other",
    }
)

PROCEEDING_STAGE = frozenset(
    {
        "",
        "complaint",
        "fir",
        "investigation",
        "show-cause",
        "adjudication",
        "trial",
        "appeal",
        "revision",
        "arbitration",
        "order-passed",
        "stayed",
        "settlement-discussions",
        "closed-or-disposed",
        "other",
    }
)

MATTER_OUTCOME_STATUS = frozenset(
    {
        "",
        "pending",
        "partly-decided",
        "decided-in-favour",
        "decided-against",
        "dismissed",
        "withdrawn",
        "settled",
        "compounded",
        "quashed",
        "appeal-pending",
        "closed",
        "other",
    }
)

MATTER_MATERIALITY_STATE = frozenset(
    {
        "",
        "potentially-material",
        "appears-below-entered-threshold",
        "material-by-board-determination",
        "mandatory-category-review",
        "missing-information",
        "pending-board-determination",
        "pending-professional-confirmation",
    }
)

REGULATORY_ACTION_TYPE = frozenset(
    {
        "",
        "notice",
        "show-cause-notice",
        "inspection",
        "investigation",
        "enquiry",
        "adjudication",
        "warning",
        "direction",
        "penalty",
        "suspension",
        "cancellation",
        "restriction",
        "search-seizure",
        "prosecution",
        "compounding",
        "other",
    }
)

TAX_TYPE = frozenset(
    {
        "",
        "direct-tax",
        "gst",
        "customs",
        "excise",
        "vat-sales-tax",
        "service-tax",
        "stamp-duty",
        "professional-tax",
        "other",
    }
)

APPROVAL_CATEGORY = frozenset(
    {
        "",
        "corporate",
        "business-sector",
        "factory",
        "labour",
        "environment",
        "pollution",
        "fire",
        "municipal-local",
        "shops-establishments",
        "tax",
        "import-export",
        "customs",
        "foreign-exchange-rbi",
        "fdi-investment",
        "food-drug",
        "telecom",
        "technology",
        "data-privacy",
        "safety",
        "building-occupancy",
        "land-use",
        "electricity-utilities",
        "boiler",
        "waste-hazardous-materials",
        "quality-certification",
        "intellectual-property-registration",
        "sector-regulator",
        "other",
    }
)

APPROVAL_HOLDER_TYPE = frozenset(
    {
        "",
        "issuer",
        "subsidiary",
        "material-subsidiary",
        "group-company",
        "business-facility-site",
        "business-unit",
        "product",
        "other-linked-entity",
    }
)

APPROVAL_STATUS = frozenset(
    {
        "",
        "valid",
        "application-pending",
        "renewal-pending",
        "expired-renewal-applied",
        "expired-renewal-not-applied",
        "required-not-applied",
        "not-yet-required",
        "suspended",
        "revoked",
        "cancelled",
        "not-sure",
        "pending-professional-confirmation",
    }
)

CONTINUATION_PENDING_RENEWAL = frozenset(
    {
        "",
        "confirmed",
        "management-believes-yes",
        "no",
        "not-sure",
        "pending-professional-confirmation",
    }
)

APPROVAL_CONDITION_CATEGORY = frozenset(
    {
        "",
        "periodic-filing",
        "reporting",
        "capacity-limit",
        "environmental-standard",
        "staffing",
        "safety",
        "inspection",
        "testing",
        "display-publication",
        "record-maintenance",
        "fee",
        "insurance",
        "site-specific",
        "other",
    }
)

CONDITION_COMPLIANCE_STATUS = frozenset(
    {"", "met", "pending", "delayed", "not-sure", "not-applicable"}
)

REQUIRED_BEFORE = frozenset(
    {
        "",
        "construction",
        "installation",
        "commissioning",
        "operations",
        "acquisition-completion",
        "other",
    }
)

COMPLIANCE_DOMAIN = frozenset(
    {
        "",
        "companies-act-mca",
        "securities-law",
        "fema-fdi",
        "labour-employment",
        "provident-fund",
        "esi",
        "wages",
        "posh",
        "occupational-health-safety",
        "factories",
        "environment-pollution",
        "tax",
        "gst",
        "customs-import-export",
        "consumer",
        "competition",
        "data-privacy",
        "cybersecurity",
        "sector-specific",
        "product-standards",
        "legal-metrology",
        "local-municipal",
        "other",
    }
)

COMPLIANCE_ISSUE_TYPE = frozenset(
    {
        "",
        "late-filing",
        "missing-filing",
        "incorrect-filing",
        "missing-register",
        "approval-lapse",
        "non-renewal",
        "delayed-payment",
        "underpayment",
        "governance-lapse",
        "reporting-failure",
        "recordkeeping-issue",
        "operational-non-compliance",
        "other",
    }
)

ISSUE_IDENTIFIED_BY = frozenset(
    {
        "",
        "internal-review",
        "auditor",
        "secretarial-auditor",
        "authority-inspection",
        "legal-counsel",
        "management",
        "other",
    }
)

STATUTORY_DUE_TYPE = frozenset(
    {
        "",
        "gst",
        "tds",
        "income-tax",
        "pf",
        "esi",
        "customs",
        "excise",
        "vat",
        "professional-tax",
        "labour-welfare-fund",
        "cess",
        "stamp-duty",
        "other",
    }
)

MATERIAL_CREDITOR_THRESHOLD_TYPE = frozenset(
    {
        "",
        "percentage-of-trade-payables",
        "percentage-of-revenue",
        "absolute-amount",
        "custom",
    }
)

MATERIAL_DEVELOPMENT_CATEGORY = frozenset(
    {
        "",
        "litigation",
        "regulatory-action",
        "tax",
        "approval",
        "business-disruption",
        "material-contract",
        "borrowing-default",
        "accident-fire",
        "fraud-misconduct",
        "cyber-incident",
        "acquisition-disposal",
        "management",
        "financial",
        "government-policy-change",
        "other",
    }
)

REMEDIATION_LINKED_RECORD_TYPE = frozenset(
    {
        "",
        "matter",
        "regulatory-action",
        "approval",
        "approval-condition",
        "compliance-issue",
        "statutory-due",
        "material-creditor",
        "material-development",
        "other",
    }
)

REMEDIATION_PRIORITY = frozenset(
    {"", "critical-for-filing", "high", "medium", "low", "professional-review"}
)

REMEDIATION_STATUS = frozenset(
    {"", "open", "in-progress", "blocked", "completed", "not-applicable"}
)

LAC_CRITERION_STATES = (
    "reconciled",
    "potential_concern",
    "missing_information",
    "materiality_review_required",
    "pending_legal_review",
    "approval_renewal_review_required",
    "compliance_review_required",
    "financial_reconciliation_pending",
    "pending_linked_workstream",
    "pending_professional_confirmation",
    "pending_board_determination",
    "not_applicable",
)

LAC_ASSESSMENT_GROUPS = (
    "legal_universe_materiality",
    "litigation_proceedings",
    "criminal_regulatory_tax",
    "approvals_master",
    "approval_conditions_renewal",
    "compliance_exceptions",
    "creditors_penalties_developments",
    "cross_workstream_reconciliation",
)

LAC_ASSESSMENT_RESULT_STATES = (
    "insufficient_information",
    "broadly_reconciled",
    "litigation_disclosure_gaps_identified",
    "approval_compliance_gaps_identified",
    "materiality_review_required",
    "professional_confirmation_required",
    "pending_linked_workstream",
)

LAC_CRITERION_STATE_LABELS: dict[str, str] = {
    "reconciled": "Reconciled",
    "potential_concern": "Potential concern",
    "missing_information": "Missing information",
    "materiality_review_required": "Materiality review required",
    "pending_legal_review": "Pending legal review",
    "approval_renewal_review_required": "Approval/renewal review required",
    "compliance_review_required": "Compliance review required",
    "financial_reconciliation_pending": "Financial reconciliation pending",
    "pending_linked_workstream": "Pending linked workstream",
    "pending_professional_confirmation": "Pending professional confirmation",
    "pending_board_determination": "Pending Board determination",
    "not_applicable": "Not applicable",
}

LAC_ASSESSMENT_GROUP_LABELS: dict[str, str] = {
    "legal_universe_materiality": "Legal universe & materiality",
    "litigation_proceedings": "Litigation & proceedings",
    "criminal_regulatory_tax": "Criminal, regulatory & tax",
    "approvals_master": "Approvals master",
    "approval_conditions_renewal": "Approval conditions & renewal",
    "compliance_exceptions": "Compliance exceptions",
    "creditors_penalties_developments": "Creditors, penalties & developments",
    "cross_workstream_reconciliation": "Cross-workstream reconciliation",
}

LAC_CONFIRMATION_FIELDS: tuple[tuple[str, str], ...] = (
    (
        "allCriminalProceedingsInvolvingRelevantPartiesDisclosed",
        "All criminal proceedings involving relevant parties are disclosed",
    ),
    ("firComplaintProsecutionMattersConsidered", "FIR/complaint/prosecution matters considered"),
    (
        "allMaterialCivilArbitrationProceedingsDisclosed",
        "All material civil/arbitration proceedings disclosed",
    ),
    (
        "currentBoardApprovedLitigationMaterialityPolicyCaptured",
        "Current board-approved litigation materiality policy captured",
    ),
    (
        "allStatutoryRegulatoryProceedingsDisclosed",
        "All statutory/regulatory proceedings disclosed",
    ),
    ("showCauseNoticesConsidered", "Show-cause notices considered"),
    (
        "inspectionsInvestigationsEnquiriesConsidered",
        "Inspections/investigations/enquiries considered",
    ),
    (
        "sebiAndStockExchangeActionsDisclosed",
        "SEBI and stock exchange actions disclosed",
    ),
    ("taxProceedingsComplete", "Tax proceedings complete"),
    ("directTaxTotalsReconciled", "Direct tax totals reconciled"),
    ("indirectTaxTotalsReconciled", "Indirect tax totals reconciled"),
    (
        "historicalPenaltiesMaterialRegulatoryActionsDisclosed",
        "Historical penalties/material regulatory actions disclosed",
    ),
    (
        "materialSubsidiariesGroupCompaniesIncludedInLegalDd",
        "Material subsidiaries/group companies included in legal DD",
    ),
    (
        "allMaterialBusinessApprovalsDisclosed",
        "All material business approvals disclosed",
    ),
    ("approvalExpiriesAccurate", "Approval expiries accurate"),
    (
        "pendingRenewalApplicationsDisclosed",
        "Pending renewal applications disclosed",
    ),
    (
        "requiredButNotAppliedApprovalsDisclosed",
        "Required but not applied approvals disclosed",
    ),
    (
        "approvalConditionNonCompliancesDisclosed",
        "Approval condition non-compliances disclosed",
    ),
    (
        "materialStatutorySecretarialExceptionsDisclosed",
        "Material statutory/secretarial exceptions disclosed",
    ),
    (
        "statutoryDuesDelaysDefaultsDisclosed",
        "Statutory dues delays/defaults disclosed",
    ),
    ("materialCreditorsCaptured", "Material creditors captured"),
    ("msmeDuesCaptured", "MSME dues captured"),
    (
        "materialDevelopmentsSinceLatestFinancialsDisclosed",
        "Material developments since latest financials disclosed",
    ),
    (
        "postPreparationLegalDevelopmentsWillContinueToBeUpdated",
        "Post-preparation legal developments will continue to be updated",
    ),
    (
        "contingentLiabilitiesProvisionsReconciledWithFinancials",
        "Contingent liabilities/provisions reconciled with Financials",
    ),
    (
        "borrowingDefaultLegalMattersReconciledWithBac",
        "Borrowing/default legal matters reconciled with BAC",
    ),
    (
        "managementLegalDeclarationsReconciled",
        "Management legal declarations reconciled",
    ),
    (
        "groupEntityLegalDeclarationsReconciled",
        "Group entity legal declarations reconciled",
    ),
    (
        "unresolvedInconsistenciesFlagged",
        "Unresolved inconsistencies flagged",
    ),
    (
        "professionalLegalBrlmSecretarialAccountingConfirmationRequired",
        "Professional legal/BRLM/secretarial/accounting confirmation remains required",
    ),
)

RECONCILIATION_TOLERANCE = 1
