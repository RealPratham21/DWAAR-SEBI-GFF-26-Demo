"""Constants and error codes for Intermediaries & Filing."""

SCHEMA_VERSION = 1

SECTION_IDS = (
    "issue-team-and-intermediary-master",
    "issue-configuration-and-filing-snapshot",
    "filing-and-regulatory-milestone-tracker",
    "due-diligence-certificates-consents-and-signoffs",
    "depositories-banking-asba-upi-and-issue-infrastructure",
    "underwriting-market-making-and-distribution-arrangements",
    "issue-programme-allotment-listing-and-post-issue-execution",
    "final-offer-document-advertisements-material-documents-and-filing-readiness",
)

SECTION_PAYLOAD_KEYS: dict[str, str] = {
    "issue-team-and-intermediary-master": "issueTeamAndIntermediaryMaster",
    "issue-configuration-and-filing-snapshot": "issueConfigurationAndFilingSnapshot",
    "filing-and-regulatory-milestone-tracker": "filingAndRegulatoryMilestoneTracker",
    "due-diligence-certificates-consents-and-signoffs": (
        "dueDiligenceCertificatesConsentsAndSignoffs"
    ),
    "depositories-banking-asba-upi-and-issue-infrastructure": (
        "depositoriesBankingAsbaUpiAndIssueInfrastructure"
    ),
    "underwriting-market-making-and-distribution-arrangements": (
        "underwritingMarketMakingAndDistributionArrangements"
    ),
    "issue-programme-allotment-listing-and-post-issue-execution": (
        "issueProgrammeAllotmentListingAndPostIssueExecution"
    ),
    "final-offer-document-advertisements-material-documents-and-filing-readiness": (
        "finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness"
    ),
}

SECTION_LABELS: dict[str, str] = {
    "issue-team-and-intermediary-master": "Issue Team & Intermediary Master",
    "issue-configuration-and-filing-snapshot": "Issue Configuration & Filing Snapshot",
    "filing-and-regulatory-milestone-tracker": "Filing & Regulatory Milestone Tracker",
    "due-diligence-certificates-consents-and-signoffs": (
        "Due Diligence, Certificates, Consents & Sign-offs"
    ),
    "depositories-banking-asba-upi-and-issue-infrastructure": (
        "Depositories, Banking, ASBA/UPI & Issue Infrastructure"
    ),
    "underwriting-market-making-and-distribution-arrangements": (
        "Underwriting, Market Making & Distribution Arrangements"
    ),
    "issue-programme-allotment-listing-and-post-issue-execution": (
        "Issue Programme, Allotment, Listing & Post-Issue Execution"
    ),
    "final-offer-document-advertisements-material-documents-and-filing-readiness": (
        "Final Offer Document, Advertisements & Filing Readiness"
    ),
}


class IntermediariesFilingErrorCode:
    WORKSPACE_NOT_FOUND = "INTERMEDIARIES_FILING_WORKSPACE_NOT_FOUND"
    WORKSPACE_VERSION_CONFLICT = "INTERMEDIARIES_FILING_VERSION_CONFLICT"
    VALIDATION_FAILED = "INTERMEDIARIES_FILING_VALIDATION_FAILED"
    UNKNOWN_SECTION = "INTERMEDIARIES_FILING_UNKNOWN_SECTION"


IF_SLUG = "intermediaries-filing"

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

READINESS_STATE = frozenset(
    {
        "",
        "appears-consistent",
        "potential-concern",
        "missing-information",
        "pending-professional-confirmation",
    }
)

PRIMARY_SECONDARY = frozenset({"", "primary", "secondary"})

INTERMEDIARY_ROLE = frozenset(
    {
        "lead_manager",
        "book_running_lead_manager",
        "additional_lead_manager",
        "registrar_to_issue",
        "legal_adviser",
        "domestic_legal_counsel",
        "international_counsel",
        "statutory_auditor",
        "peer_review_auditor",
        "restated_financial_auditor",
        "kpi_certifying_professional",
        "industry_research_provider",
        "banker_to_issue",
        "escrow_collection_bank",
        "public_issue_account_bank",
        "refund_bank",
        "sponsor_bank",
        "market_maker",
        "underwriter",
        "syndicate_member",
        "sub_syndicate_member",
        "monitoring_agency",
        "advertising_publicity_agency",
        "stabilising_agent",
        "other_expert",
        "other_adviser",
    }
)

REGISTRATION_STATUS = frozenset(
    {
        "",
        "confirmed",
        "pending_verification",
        "not_sure",
        "professional_confirmation_required",
    }
)

APPOINTMENT_STATUS = frozenset(
    {
        "",
        "proposed",
        "appointed",
        "agreement_pending",
        "active",
        "replaced",
        "resigned",
        "terminated",
    }
)

RESPONSIBILITY_AREA = frozenset(
    {
        "due_diligence",
        "offer_document_coordination",
        "capital_structure",
        "objects",
        "business_due_diligence",
        "legal_due_diligence",
        "financial_due_diligence",
        "industry",
        "marketing",
        "syndication",
        "underwriting",
        "registrar_coordination",
        "exchange_coordination",
        "sebi_coordination",
        "post_issue",
        "other",
    }
)

FILING_STAGE = frozenset(
    {
        "",
        "preparation",
        "internal_due_diligence",
        "adviser_review",
        "board_approval",
        "exchange_draft_filing",
        "exchange_vetting",
        "revision",
        "in_principle_stage",
        "pre_issue_filing",
        "roc_filing",
        "issue_open",
        "issue_closed",
        "allotment",
        "listing_application",
        "listed",
        "other",
    }
)

OFFER_DOCUMENT_FORM = frozenset(
    {
        "",
        "draft_prospectus",
        "drhp",
        "rhp",
        "prospectus",
        "abridged_prospectus",
        "addendum",
        "corrigendum",
        "other",
    }
)

INVESTOR_CATEGORY = frozenset(
    {
        "",
        "retail",
        "nii",
        "qib",
        "anchor",
        "market_maker",
        "employee",
        "shareholder",
        "other",
    }
)

FILING_STATUS = frozenset(
    {
        "",
        "working_draft",
        "adviser_review",
        "board_approved",
        "filed",
        "returned",
        "queries_received",
        "response_submitted",
        "revised",
        "approved_for_next_stage",
        "superseded",
    }
)

FILING_AUTHORITY = frozenset({"", "sme_exchange", "sebi", "roc", "depository", "other"})

EXCHANGE_QUERY_STATUS = frozenset(
    {
        "",
        "open",
        "drafting_response",
        "adviser_review",
        "response_submitted",
        "follow_up_received",
        "closed",
        "superseded",
    }
)

DUE_DILIGENCE_AREA = frozenset(
    {
        "",
        "company_incorporation",
        "ipo_eligibility",
        "capital_structure",
        "promoters_promoter_group",
        "objects",
        "business",
        "industry_market",
        "financials",
        "kpis",
        "management_governance",
        "group_entities",
        "related_parties",
        "borrowings",
        "assets_properties",
        "material_contracts",
        "litigation",
        "approvals",
        "tax",
        "material_creditors",
        "risk_factors",
        "other",
    }
)

CERTIFICATE_TYPE = frozenset(
    {
        "",
        "merchant_banker_due_diligence",
        "sme_additional_due_diligence_or_form_h",
        "restated_financials_auditor",
        "kpi",
        "share_capital",
        "capital_structure",
        "objects_means_of_finance",
        "working_capital",
        "debt_repayment_aup",
        "tax_benefits",
        "promoter_contribution",
        "industry_report",
        "legal_opinion_or_certificate",
        "secretarial",
        "eligibility_or_default",
        "other",
    }
)

CERTIFICATE_STATUS = frozenset(
    {"", "not_started", "draft", "under_review", "final", "signed", "superseded"}
)

CERTIFICATE_FILED_TO = frozenset({"", "exchange", "sebi", "roc", "not_filed", "other"})

CONSENT_PARTY_TYPE = frozenset(
    {
        "",
        "director",
        "promoter",
        "cfo",
        "company_secretary",
        "compliance_officer",
        "lead_manager",
        "registrar",
        "legal_adviser",
        "statutory_auditor",
        "peer_review_auditor",
        "expert",
        "industry_research_provider",
        "banker_to_issue",
        "sponsor_bank",
        "market_maker",
        "underwriter",
        "monitoring_agency",
        "other",
    }
)

ISIN_STATUS = frozenset({"", "not_started", "application_pending", "allotted", "active", "not_sure"})

ISSUE_BANK_ROLE = frozenset(
    {
        "",
        "banker_to_issue",
        "escrow_collection_bank",
        "public_issue_account_bank",
        "refund_bank",
        "sponsor_bank",
    }
)

ACCOUNT_SETUP_STATUS = frozenset({"", "not_started", "pending", "configured", "tested", "ready"})

PLACEHOLDER_TYPE = frozenset(
    {
        "",
        "unresolved_dot",
        "missing_date",
        "missing_intermediary",
        "missing_price",
        "missing_agreement",
        "missing_certificate",
        "missing_approval_reference",
        "missing_page_reference",
        "missing_financial_value",
        "other",
    }
)

PLACEHOLDER_STATUS = frozenset({"", "open", "in_progress", "resolved", "not_applicable"})

INSPECTION_ITEM_TYPE = frozenset({"", "material_contract", "material_document"})

INSPECTION_INCLUSION_STATUS = frozenset({"", "included", "excluded", "pending_review"})

INSPECTION_FORMAT = frozenset({"", "physical", "digital", "both"})

ISSUE_AGREEMENT_TYPE = frozenset(
    {
        "",
        "lead_manager_issue_agreement",
        "registrar_agreement",
        "underwriting_agreement",
        "market_making_agreement",
        "banker_to_issue_escrow_public_issue_account_agreement",
        "sponsor_bank_agreement",
        "syndicate_agreement",
        "inter_se_agreement",
        "nsdl_tripartite_agreement",
        "cdsl_tripartite_agreement",
        "monitoring_agency_agreement",
        "other_issue_agreement",
    }
)

ISSUE_AGREEMENT_STATUS = frozenset(
    {
        "",
        "not_started",
        "drafting",
        "under_review",
        "executed",
        "amendment_required",
        "superseded",
        "not_applicable",
    }
)

PUBLIC_COMMUNICATION_TYPE = frozenset(
    {
        "",
        "pre_issue_advertisement",
        "price_band_advertisement",
        "issue_opening_advertisement",
        "issue_closing_advertisement",
        "allotment_advertisement",
        "corrigendum",
        "material_development_notice",
        "other",
    }
)

AV_APPLICABILITY = frozenset(
    {
        "",
        "required",
        "not_applicable",
        "potentially_applicable",
        "pending_professional_confirmation",
    }
)

POST_ISSUE_ACTION_TYPE = frozenset(
    {
        "",
        "post_issue_lead_manager_report",
        "final_post_issue_documentation",
        "underwriting_devolvement",
        "market_maker_inventory_allocation",
        "investor_grievances",
        "allotment_advertisement",
        "website_allotment_disclosure",
        "issue_proceeds_account_movement",
        "monitoring_agency_handover",
        "final_issue_expense_reconciliation",
        "issue_closure_sign_off",
    }
)

POST_ISSUE_ACTION_STATUS = frozenset(
    {"", "not_yet_due", "not_applicable", "pending", "in_progress", "complete"}
)

IF_CRITERION_STATES = (
    "ready",
    "potential_concern",
    "missing_information",
    "appointment_pending",
    "agreement_pending",
    "certificate_pending",
    "consent_pending",
    "exchange_query_pending",
    "filing_pending",
    "approval_pending",
    "underwriting_pending",
    "market_making_pending",
    "issue_infrastructure_pending",
    "listing_action_pending",
    "pending_linked_workstream",
    "pending_professional_confirmation",
    "not_applicable",
    "not_yet_due",
)

IF_ASSESSMENT_GROUPS = (
    "intermediary_readiness",
    "issue_configuration",
    "filing_readiness",
    "due_diligence_signoffs",
    "issue_infrastructure",
    "underwriting_market_making",
    "issue_listing_programme",
    "final_offer_document_readiness",
)

IF_ASSESSMENT_RESULT_STATES = (
    "insufficient_information",
    "preparation_in_progress",
    "intermediary_actions_pending",
    "due_diligence_pending",
    "exchange_review_in_progress",
    "filing_actions_pending",
    "issue_infrastructure_pending",
    "underwriting_or_market_making_pending",
    "pre_issue_readiness",
    "issue_execution_in_progress",
    "listing_actions_pending",
    "broadly_ready_for_current_stage",
    "professional_confirmation_required",
)

IF_CRITERION_STATE_LABELS: dict[str, str] = {
    "ready": "Ready",
    "potential_concern": "Potential concern",
    "missing_information": "Missing information",
    "appointment_pending": "Appointment pending",
    "agreement_pending": "Agreement pending",
    "certificate_pending": "Certificate pending",
    "consent_pending": "Consent pending",
    "exchange_query_pending": "Exchange query pending",
    "filing_pending": "Filing pending",
    "approval_pending": "Approval pending",
    "underwriting_pending": "Underwriting pending",
    "market_making_pending": "Market making pending",
    "issue_infrastructure_pending": "Issue infrastructure pending",
    "listing_action_pending": "Listing action pending",
    "pending_linked_workstream": "Pending linked workstream",
    "pending_professional_confirmation": "Pending professional confirmation",
    "not_applicable": "Not applicable",
    "not_yet_due": "Not yet due",
}

IF_ASSESSMENT_GROUP_LABELS: dict[str, str] = {
    "intermediary_readiness": "Intermediary readiness",
    "issue_configuration": "Issue configuration",
    "filing_readiness": "Filing readiness",
    "due_diligence_signoffs": "Due diligence & sign-offs",
    "issue_infrastructure": "Issue infrastructure",
    "underwriting_market_making": "Underwriting & Market Making",
    "issue_listing_programme": "Issue / listing programme",
    "final_offer_document_readiness": "Final offer-document readiness",
}

IF_CONFIRMATION_FIELDS: tuple[tuple[str, str], ...] = (
    ("leadManagerAppointedCurrent", "Lead Manager appointed/current"),
    ("registrarAppointedCurrent", "Registrar appointed/current"),
    ("legalCounselAppointedCurrent", "Legal counsel appointed/current"),
    ("auditorsCertifyingProfessionalsEngaged", "Auditors/certifying professionals engaged"),
    ("applicableIntermediaryRegistrationsReviewed", "Applicable intermediary registrations reviewed"),
    ("interSeResponsibilitiesDocumentedWhereNeeded", "Inter-se responsibilities documented where needed"),
    ("issueBankingArrangementsReady", "Issue banking arrangements ready"),
    ("sponsorBankReady", "Sponsor Bank ready"),
    ("depositoryArrangementsReady", "Depository arrangements ready"),
    ("isinReady", "ISIN ready"),
    ("underwritingArrangementComplete", "Underwriting arrangement complete"),
    ("applicableSmeUnderwritingCoverageReviewed", "Applicable SME underwriting coverage reviewed"),
    ("merchantBankerOwnAccountRequirementReviewed", "Merchant banker own-account requirement reviewed"),
    ("marketMakerAppointed", "Market Maker appointed"),
    ("marketMakingAgreementExecuted", "Market Making Agreement executed"),
    ("applicableMarketMakingPeriodAddressed", "Applicable market-making period addressed"),
    (
        "nominatedInvestorArrangementsDisclosedWhereApplicable",
        "Nominated investor arrangements disclosed where applicable",
    ),
    ("exchangeFilingChecklistComplete", "Exchange filing checklist complete"),
    ("openExchangeQueriesAccuratelyShown", "Open Exchange queries accurately shown"),
    ("inPrincipleApprovalStatusAccuratelyShown", "In-principle approval status accurately shown"),
    ("sebiSmeFilingStatusAccuratelyShown", "SEBI SME filing status accurately shown"),
    ("ddCertificatesCurrent", "DD certificates current"),
    ("applicableProfessionalCertificatesCurrent", "Applicable professional certificates current"),
    ("intermediaryExpertConsentsCurrent", "Intermediary/expert consents current"),
    ("rocFilingReadinessReviewed", "RoC filing readiness reviewed"),
    ("issueStructureReconcilesWithIpoSetup", "Issue structure reconciles with IPO Setup"),
    ("capitalStructureReconcilesWithCapital", "Capital structure reconciles with Capital"),
    ("objectsReconcile", "Objects reconcile"),
    ("financialsReconcile", "Financials reconcile"),
    ("managementDataReconcile", "Management data reconcile"),
    ("groupEntitiesReconcile", "Group Entities reconcile"),
    ("bacMattersReconcile", "BAC matters reconcile"),
    ("lacUpdatedThroughFilingCutOff", "LAC updated through filing cut-off"),
    ("materialDevelopmentsReviewed", "Material developments reviewed"),
    ("finalInspectionListReviewed", "Final inspection list reviewed"),
    ("applicableIssueAgreementsExecutedCurrent", "Applicable issue agreements executed/current"),
    ("publicCommunicationsReadinessReviewed", "Public communications readiness reviewed"),
    ("applicableT3ExecutionPlanReviewed", "Applicable T+3 execution plan reviewed"),
    ("unresolvedPlaceholdersAccuratelyShown", "Unresolved placeholders accurately shown"),
    ("noCriticalFilingItemIntentionallyOmitted", "No critical filing item intentionally omitted"),
    (
        "finalProfessionalLeadManagerLegalAuditorReviewRemainsRequired",
        "Professional legal/BRLM/secretarial/accounting confirmation remains required",
    ),
)

RECONCILIATION_TOLERANCE = 1

LEAD_MANAGER_ROLES = frozenset(
    {"lead_manager", "book_running_lead_manager", "additional_lead_manager"}
)
