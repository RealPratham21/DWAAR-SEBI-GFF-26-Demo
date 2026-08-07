"""Constants and error codes for Management & Governance — mirrors frontend schema exactly."""

SCHEMA_VERSION = 1

SECTION_IDS = (
    "board-structure-and-ipo-governance-readiness",
    "directors-profiles-appointments-and-eligibility",
    "kmp-senior-management-and-organisation-structure",
    "board-committees-and-governance-bodies",
    "remuneration-service-contracts-esops-and-benefits",
    "interests-conflicts-and-management-relationships",
    "changes-continuity-and-succession",
    "governance-policies-rpt-oversight-and-confirmations",
)

SECTION_PAYLOAD_KEYS: dict[str, str] = {
    "board-structure-and-ipo-governance-readiness": "boardStructureAndIpoGovernanceReadiness",
    "directors-profiles-appointments-and-eligibility": (
        "directorsProfilesAppointmentsAndEligibility"
    ),
    "kmp-senior-management-and-organisation-structure": (
        "kmpSeniorManagementAndOrganisationStructure"
    ),
    "board-committees-and-governance-bodies": "boardCommitteesAndGovernanceBodies",
    "remuneration-service-contracts-esops-and-benefits": (
        "remunerationServiceContractsEsopsAndBenefits"
    ),
    "interests-conflicts-and-management-relationships": (
        "interestsConflictsAndManagementRelationships"
    ),
    "changes-continuity-and-succession": "changesContinuityAndSuccession",
    "governance-policies-rpt-oversight-and-confirmations": (
        "governancePoliciesRptOversightAndConfirmations"
    ),
}

SECTION_LABELS: dict[str, str] = {
    "board-structure-and-ipo-governance-readiness": (
        "Board Structure & IPO Governance Readiness"
    ),
    "directors-profiles-appointments-and-eligibility": (
        "Directors — Profiles, Appointments & Eligibility"
    ),
    "kmp-senior-management-and-organisation-structure": (
        "KMP, Senior Management & Organisation Structure"
    ),
    "board-committees-and-governance-bodies": "Board Committees & Governance Bodies",
    "remuneration-service-contracts-esops-and-benefits": (
        "Remuneration, Service Contracts, ESOPs & Benefits"
    ),
    "interests-conflicts-and-management-relationships": (
        "Interests, Conflicts & Management Relationships"
    ),
    "changes-continuity-and-succession": "Changes, Continuity & Succession",
    "governance-policies-rpt-oversight-and-confirmations": (
        "Governance Policies, RPT Oversight & Confirmations"
    ),
}


class ManagementGovernanceErrorCode:
    WORKSPACE_NOT_FOUND = "MANAGEMENT_GOVERNANCE_WORKSPACE_NOT_FOUND"
    WORKSPACE_VERSION_CONFLICT = "MANAGEMENT_GOVERNANCE_VERSION_CONFLICT"
    VALIDATION_FAILED = "MANAGEMENT_GOVERNANCE_VALIDATION_FAILED"
    UNKNOWN_SECTION = "MANAGEMENT_GOVERNANCE_UNKNOWN_SECTION"


YES_NO_NOT_SURE = frozenset({"", "yes", "no", "not_sure"})

COMPANY_STATUS = frozenset(
    {
        "",
        "private-company",
        "public-unlisted-company",
        "proposed-listed-public-company",
    }
)

CHAIRMAN_CLASSIFICATION = frozenset({"", "executive", "non-executive", "independent"})

GOVERNANCE_READINESS_STATUS = frozenset(
    {
        "",
        "not_started",
        "in_progress",
        "completed",
        "not_applicable",
        "not_sure",
        "professional_confirmation_required",
    }
)

APPOINTMENT_STATUS = frozenset(
    {
        "",
        "current",
        "proposed-for-drhp-filing",
        "proposed-before-listing",
    }
)

DIRECTOR_DESIGNATION = frozenset(
    {
        "",
        "chairman",
        "managing-director",
        "whole-time-director",
        "executive-director",
        "non-executive-director",
        "independent-director",
        "nominee-director",
        "additional-director",
        "other",
    }
)

EXECUTIVE_NON_EXECUTIVE = frozenset({"", "executive", "non-executive"})

GENDER = frozenset({"", "male", "female", "other", "prefer-not-to-say"})

ENTITY_LISTING_STATUS = frozenset(
    {"", "public-listed", "public-unlisted", "private", "other"}
)

KMP_CLASSIFICATION = frozenset({"", "kmp", "senior-management", "both"})

EMPLOYMENT_TYPE = frozenset({"", "permanent", "contract", "consultant", "other"})

PERSON_STATUS = frozenset({"", "current", "vacant", "proposed", "ceased"})

COMMITTEE_TYPE = frozenset(
    {
        "",
        "audit-committee",
        "nomination-remuneration-committee",
        "stakeholders-relationship-committee",
        "csr-committee",
        "risk-management-committee",
        "ipo-committee",
        "independent-directors-price-band-committee",
        "finance-borrowing-committee",
        "other",
    }
)

COMMITTEE_APPLICABILITY = frozenset(
    {
        "",
        "required",
        "voluntarily-constituted",
        "potentially-applicable",
        "not-applicable",
        "professional-confirmation-required",
    }
)

COMMITTEE_MEMBER_ROLE = frozenset({"", "chair", "member"})

FAMILY_RELATIONSHIP_TYPE = frozenset(
    {
        "",
        "spouse",
        "parent",
        "child",
        "sibling",
        "other-statutory-relative",
        "no-relationship",
        "not-sure",
    }
)

BOARD_CHANGE_EVENT = frozenset(
    {
        "",
        "appointment",
        "reappointment",
        "resignation",
        "cessation",
        "retirement",
        "re-designation",
        "death",
        "removal",
        "nominee-withdrawal",
        "other",
    }
)

GOVERNANCE_POLICY_TYPE = frozenset(
    {
        "",
        "nomination-remuneration-policy",
        "related-party-transaction-policy",
        "code-of-conduct-board-senior-management",
        "vigil-mechanism-whistleblower-policy",
        "insider-trading-code",
        "code-of-fair-disclosure",
        "materiality-policy",
        "document-preservation-policy",
        "independent-director-familiarisation-programme",
        "board-diversity-policy",
        "succession-policy",
        "risk-management-framework",
        "csr-policy",
        "posh-policy",
        "investor-grievance-mechanism",
        "other",
    }
)

POLICY_ADOPTED_STATUS = frozenset(
    {
        "",
        "adopted",
        "draft",
        "under-review",
        "not-adopted",
        "not-applicable",
        "professional-confirmation-required",
    }
)

SOURCE_STATUS = frozenset(
    {
        "",
        "audited-financial-statements",
        "annual-report",
        "board-resolution",
        "management-estimate",
        "pending-confirmation",
        "not-available",
    }
)

PERSON_TYPE = frozenset({"", "director", "kmp", "smp", "promoter"})
INTEREST_PERSON_TYPE = frozenset({"", "director", "kmp", "smp"})
CURRENT_OR_CEASED = frozenset({"", "current", "ceased"})

GOVERNANCE_CRITERION_STATES = (
    "appears_ready",
    "potential_concern",
    "missing_information",
    "pending_appointment",
    "pending_board_approval",
    "pending_shareholder_approval",
    "pending_linked_workstream",
    "pending_professional_confirmation",
    "not_applicable",
)

GOVERNANCE_ASSESSMENT_GROUPS = (
    "board_composition",
    "director_eligibility",
    "management_coverage",
    "board_committees",
    "remuneration_and_interests",
    "management_continuity",
    "governance_processes",
    "ipo_specific_governance",
)

GOVERNANCE_ASSESSMENT_RESULT_STATES = (
    "insufficient_information",
    "readiness_in_progress",
    "potential_concerns_identified",
    "professional_confirmation_required",
    "pending_appointments",
)

GOVERNANCE_CRITERION_STATE_LABELS: dict[str, str] = {
    "appears_ready": "Appears ready",
    "potential_concern": "Potential concern",
    "missing_information": "Missing information",
    "pending_appointment": "Pending appointment",
    "pending_board_approval": "Pending board approval",
    "pending_shareholder_approval": "Pending shareholder approval",
    "pending_linked_workstream": "Pending linked workstream",
    "pending_professional_confirmation": "Pending professional confirmation",
    "not_applicable": "Not applicable",
}

GOVERNANCE_ASSESSMENT_GROUP_LABELS: dict[str, str] = {
    "board_composition": "Board composition",
    "director_eligibility": "Director eligibility",
    "management_coverage": "Management coverage",
    "board_committees": "Board committees",
    "remuneration_and_interests": "Remuneration and interests",
    "management_continuity": "Management continuity",
    "governance_processes": "Governance processes",
    "ipo_specific_governance": "IPO-specific governance",
}

MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS = (
    ("currentBoardCompletelyDisclosed", "Current Board is completely disclosed"),
    (
        "proposedAppointmentsAndCessationsDisclosed",
        "Proposed appointments and cessations are disclosed",
    ),
    ("directorBiographiesAccurate", "Director biographies are accurate"),
    ("otherDirectorshipsComplete", "Other directorships are complete"),
    (
        "eligibilityAndDebarmentDeclarationsComplete",
        "Eligibility and debarment declarations are complete",
    ),
    (
        "independentDirectorRelationshipsDisclosed",
        "Independent-director relationships are disclosed",
    ),
    ("allKmpAndSmpIdentified", "All KMP/SMP are identified"),
    ("organisationStructureComplete", "Organisation structure is complete"),
    ("committeesCompletelyDisclosed", "Committees are completely disclosed"),
    ("remunerationAndBenefitsComplete", "Remuneration and benefits are complete"),
    (
        "serviceContractsAndSpecialCompensationDisclosed",
        "Service contracts and special compensation are disclosed",
    ),
    (
        "managementShareholdingAndOptionsDisclosed",
        "Shareholding and options of management are disclosed",
    ),
    ("familyRelationshipsDisclosed", "Family relationships are disclosed"),
    ("appointmentArrangementsDisclosed", "Appointment arrangements are disclosed"),
    ("conflictsAndInterestsDisclosed", "Conflicts and interests are disclosed"),
    (
        "threeYearManagementChangesComplete",
        "Three-year management changes are complete",
    ),
    (
        "governancePoliciesReflectCurrentStatus",
        "Governance policies reflect current status",
    ),
    (
        "proposedAppointmentsNotRepresentedAsCompleted",
        "Proposed appointments are not represented as completed",
    ),
    (
        "professionalLegalSecretarialConfirmationRemainsRequired",
        "Professional, legal or secretarial confirmation remains required",
    ),
    ("rptGovernanceDisclosuresComplete", "RPT governance disclosures are complete"),
    ("boardProcessReadinessCaptured", "Board process readiness is captured"),
    (
        "governanceApplicabilityProfileReviewed",
        "Governance applicability profile has been reviewed",
    ),
)

GOVERNANCE_APPLICABILITY_RULES_VERSION = 1

MANAGEMENT_GOVERNANCE_SLUG = "management-governance"
