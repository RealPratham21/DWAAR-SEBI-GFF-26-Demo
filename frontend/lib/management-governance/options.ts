/**
 * UI option arrays and label maps for Management & Governance.
 */

import {
  APPOINTMENT_STATUS_VALUES,
  BOARD_CHANGE_EVENT_VALUES,
  CHAIRMAN_CLASSIFICATION_VALUES,
  COMMITTEE_APPLICABILITY_VALUES,
  COMMITTEE_MEMBER_ROLE_VALUES,
  COMMITTEE_TYPE_VALUES,
  COMPANY_STATUS_VALUES,
  DIRECTOR_DESIGNATION_VALUES,
  EMPLOYMENT_TYPE_VALUES,
  ENTITY_LISTING_STATUS_VALUES,
  EXECUTIVE_NON_EXECUTIVE_VALUES,
  FAMILY_RELATIONSHIP_TYPE_VALUES,
  GENDER_VALUES,
  GOVERNANCE_POLICY_TYPE_VALUES,
  GOVERNANCE_READINESS_STATUS_VALUES,
  KMP_CLASSIFICATION_VALUES,
  PERSON_STATUS_VALUES,
  POLICY_ADOPTED_STATUS_VALUES,
  SOURCE_STATUS_VALUES,
  YES_NO_NOT_SURE_VALUES,
} from '@/lib/schemas/management-governance';
import type {
  ManagementGovernanceConfirmations,
  ManagementGovernanceSectionId,
} from '@/lib/schemas/management-governance';

export type SelectOption = { value: string; label: string };

export const MANAGEMENT_GOVERNANCE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'information', label: 'Information' },
  { id: 'governance-assessment', label: 'Governance Assessment' },
] as const;

export type ManagementGovernanceTabId = (typeof MANAGEMENT_GOVERNANCE_TABS)[number]['id'];

export const TABS = MANAGEMENT_GOVERNANCE_TABS;

export const MANAGEMENT_GOVERNANCE_INFORMATION_SECTIONS: Array<{
  id: ManagementGovernanceSectionId;
  label: string;
  description: string;
}> = [
  {
    id: 'board-structure-and-ipo-governance-readiness',
    label: 'Board Structure & IPO Governance Readiness',
    description:
      'Board snapshot, leadership roles, governance readiness and IPO committee structure.',
  },
  {
    id: 'directors-profiles-appointments-and-eligibility',
    label: 'Directors — Profiles, Appointments & Eligibility',
    description:
      'Director master register with biographies, other directorships and eligibility declarations.',
  },
  {
    id: 'kmp-senior-management-and-organisation-structure',
    label: 'KMP, Senior Management & Organisation Structure',
    description:
      'KMP/SMP register, organisation hierarchy, vacancies and family relationships.',
  },
  {
    id: 'board-committees-and-governance-bodies',
    label: 'Board Committees & Governance Bodies',
    description: 'Committee register, membership, terms of reference and meeting history.',
  },
  {
    id: 'remuneration-service-contracts-esops-and-benefits',
    label: 'Remuneration, Service Contracts, ESOPs & Benefits',
    description:
      'Director and KMP/SMP remuneration, incentive arrangements, service contracts and ESOP governance.',
  },
  {
    id: 'interests-conflicts-and-management-relationships',
    label: 'Interests, Conflicts & Management Relationships',
    description:
      'Interests in issuer, outside interests, appointment arrangements and financial arrangements.',
  },
  {
    id: 'changes-continuity-and-succession',
    label: 'Changes, Continuity & Succession',
    description:
      'Three-year Board and KMP/SMP changes, succession readiness and key-person dependencies.',
  },
  {
    id: 'governance-policies-rpt-oversight-and-confirmations',
    label: 'Governance Policies, RPT Oversight & Confirmations',
    description:
      'Governance policies register, RPT oversight, board-process readiness and issuer confirmations.',
  },
];

export const INFORMATION_SECTIONS = MANAGEMENT_GOVERNANCE_INFORMATION_SECTIONS;

export const MANAGEMENT_GOVERNANCE_SECTION_LABELS: Record<ManagementGovernanceSectionId, string> = {
  'board-structure-and-ipo-governance-readiness': 'Board Structure & IPO Governance Readiness',
  'directors-profiles-appointments-and-eligibility':
    'Directors — Profiles, Appointments & Eligibility',
  'kmp-senior-management-and-organisation-structure':
    'KMP, Senior Management & Organisation Structure',
  'board-committees-and-governance-bodies': 'Board Committees & Governance Bodies',
  'remuneration-service-contracts-esops-and-benefits':
    'Remuneration, Service Contracts, ESOPs & Benefits',
  'interests-conflicts-and-management-relationships':
    'Interests, Conflicts & Management Relationships',
  'changes-continuity-and-succession': 'Changes, Continuity & Succession',
  'governance-policies-rpt-oversight-and-confirmations':
    'Governance Policies, RPT Oversight & Confirmations',
};

function optionsFrom(values: readonly string[], labels: Record<string, string>): SelectOption[] {
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

export const YES_NO_NOT_SURE_LABELS: Record<(typeof YES_NO_NOT_SURE_VALUES)[number], string> = {
  yes: 'Yes',
  no: 'No',
  not_sure: 'Not sure',
};

export const COMPANY_STATUS_LABELS: Record<(typeof COMPANY_STATUS_VALUES)[number], string> = {
  'private-company': 'Private company',
  'public-unlisted-company': 'Public unlisted company',
  'proposed-listed-public-company': 'Proposed listed public company',
};

export const CHAIRMAN_CLASSIFICATION_LABELS: Record<
  (typeof CHAIRMAN_CLASSIFICATION_VALUES)[number],
  string
> = {
  executive: 'Executive',
  'non-executive': 'Non-executive',
  independent: 'Independent',
};

export const GOVERNANCE_READINESS_STATUS_LABELS: Record<
  (typeof GOVERNANCE_READINESS_STATUS_VALUES)[number],
  string
> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  not_applicable: 'Not applicable',
  not_sure: 'Not sure',
  professional_confirmation_required: 'Professional confirmation required',
};

export const APPOINTMENT_STATUS_LABELS: Record<(typeof APPOINTMENT_STATUS_VALUES)[number], string> =
  {
    current: 'Current',
    'proposed-for-drhp-filing': 'Proposed for DRHP filing',
    'proposed-before-listing': 'Proposed before listing',
  };

export const DIRECTOR_DESIGNATION_LABELS: Record<
  (typeof DIRECTOR_DESIGNATION_VALUES)[number],
  string
> = {
  chairman: 'Chairman',
  'managing-director': 'Managing Director',
  'whole-time-director': 'Whole-Time Director',
  'executive-director': 'Executive Director',
  'non-executive-director': 'Non-Executive Director',
  'independent-director': 'Independent Director',
  'nominee-director': 'Nominee Director',
  'additional-director': 'Additional Director',
  other: 'Other',
};

export const EXECUTIVE_NON_EXECUTIVE_LABELS: Record<
  (typeof EXECUTIVE_NON_EXECUTIVE_VALUES)[number],
  string
> = {
  executive: 'Executive',
  'non-executive': 'Non-executive',
};

export const GENDER_LABELS: Record<(typeof GENDER_VALUES)[number], string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  'prefer-not-to-say': 'Prefer not to say',
};

export const ENTITY_LISTING_STATUS_LABELS: Record<
  (typeof ENTITY_LISTING_STATUS_VALUES)[number],
  string
> = {
  'public-listed': 'Public listed',
  'public-unlisted': 'Public unlisted',
  private: 'Private',
  other: 'Other',
};

export const KMP_CLASSIFICATION_LABELS: Record<(typeof KMP_CLASSIFICATION_VALUES)[number], string> =
  {
    kmp: 'KMP',
    'senior-management': 'Senior Management',
    both: 'Both',
  };

export const EMPLOYMENT_TYPE_LABELS: Record<(typeof EMPLOYMENT_TYPE_VALUES)[number], string> = {
  permanent: 'Permanent',
  contract: 'Contract',
  consultant: 'Consultant',
  other: 'Other',
};

export const PERSON_STATUS_LABELS: Record<(typeof PERSON_STATUS_VALUES)[number], string> = {
  current: 'Current',
  vacant: 'Vacant',
  proposed: 'Proposed',
  ceased: 'Ceased',
};

export const COMMITTEE_TYPE_LABELS: Record<(typeof COMMITTEE_TYPE_VALUES)[number], string> = {
  'audit-committee': 'Audit Committee',
  'nomination-remuneration-committee': 'Nomination & Remuneration Committee',
  'stakeholders-relationship-committee': "Stakeholders' Relationship Committee",
  'csr-committee': 'CSR Committee',
  'risk-management-committee': 'Risk Management Committee',
  'ipo-committee': 'IPO Committee',
  'independent-directors-price-band-committee': 'Independent Directors / Price Band Committee',
  'finance-borrowing-committee': 'Finance / Borrowing Committee',
  other: 'Other',
};

export const COMMITTEE_APPLICABILITY_LABELS: Record<
  (typeof COMMITTEE_APPLICABILITY_VALUES)[number],
  string
> = {
  required: 'Required',
  'voluntarily-constituted': 'Voluntarily constituted',
  'potentially-applicable': 'Potentially applicable',
  'not-applicable': 'Not applicable',
  'professional-confirmation-required': 'Professional confirmation required',
};

export const COMMITTEE_MEMBER_ROLE_LABELS: Record<
  (typeof COMMITTEE_MEMBER_ROLE_VALUES)[number],
  string
> = {
  chair: 'Chair',
  member: 'Member',
};

export const FAMILY_RELATIONSHIP_TYPE_LABELS: Record<
  (typeof FAMILY_RELATIONSHIP_TYPE_VALUES)[number],
  string
> = {
  spouse: 'Spouse',
  parent: 'Parent',
  child: 'Child',
  sibling: 'Sibling',
  'other-statutory-relative': 'Other statutory relative',
  'no-relationship': 'No relationship',
  'not-sure': 'Not sure',
};

export const BOARD_CHANGE_EVENT_LABELS: Record<(typeof BOARD_CHANGE_EVENT_VALUES)[number], string> =
  {
    appointment: 'Appointment',
    reappointment: 'Reappointment',
    resignation: 'Resignation',
    cessation: 'Cessation',
    retirement: 'Retirement',
    're-designation': 'Re-designation',
    death: 'Death',
    removal: 'Removal',
    'nominee-withdrawal': 'Nominee withdrawal',
    other: 'Other',
  };

export const GOVERNANCE_POLICY_TYPE_LABELS: Record<
  (typeof GOVERNANCE_POLICY_TYPE_VALUES)[number],
  string
> = {
  'nomination-remuneration-policy': 'Nomination & Remuneration Policy',
  'related-party-transaction-policy': 'Related Party Transaction Policy',
  'code-of-conduct-board-senior-management': 'Code of Conduct for Board / Senior Management',
  'vigil-mechanism-whistleblower-policy': 'Vigil Mechanism / Whistleblower Policy',
  'insider-trading-code': 'Insider Trading Code',
  'code-of-fair-disclosure': 'Code of Fair Disclosure',
  'materiality-policy': 'Materiality Policy',
  'document-preservation-policy': 'Document Preservation Policy',
  'independent-director-familiarisation-programme':
    'Independent Director Familiarisation Programme',
  'board-diversity-policy': 'Board Diversity Policy',
  'succession-policy': 'Succession Policy',
  'risk-management-framework': 'Risk Management Framework',
  'csr-policy': 'CSR Policy',
  'posh-policy': 'POSH Policy',
  'investor-grievance-mechanism': 'Investor Grievance Mechanism',
  other: 'Other',
};

export const POLICY_ADOPTED_STATUS_LABELS: Record<
  (typeof POLICY_ADOPTED_STATUS_VALUES)[number],
  string
> = {
  adopted: 'Adopted',
  draft: 'Draft',
  'under-review': 'Under review',
  'not-adopted': 'Not adopted',
  'not-applicable': 'Not applicable',
  'professional-confirmation-required': 'Professional confirmation required',
};

export const SOURCE_STATUS_LABELS: Record<(typeof SOURCE_STATUS_VALUES)[number], string> = {
  'audited-financial-statements': 'Audited financial statements',
  'annual-report': 'Annual report',
  'board-resolution': 'Board resolution',
  'management-estimate': 'Management estimate',
  'pending-confirmation': 'Pending confirmation',
  'not-available': 'Not available',
};

export const YES_NO_NOT_SURE_OPTIONS = optionsFrom(YES_NO_NOT_SURE_VALUES, YES_NO_NOT_SURE_LABELS);
export const COMPANY_STATUS_OPTIONS = optionsFrom(COMPANY_STATUS_VALUES, COMPANY_STATUS_LABELS);
export const CHAIRMAN_CLASSIFICATION_OPTIONS = optionsFrom(
  CHAIRMAN_CLASSIFICATION_VALUES,
  CHAIRMAN_CLASSIFICATION_LABELS,
);
export const GOVERNANCE_READINESS_STATUS_OPTIONS = optionsFrom(
  GOVERNANCE_READINESS_STATUS_VALUES,
  GOVERNANCE_READINESS_STATUS_LABELS,
);
export const APPOINTMENT_STATUS_OPTIONS = optionsFrom(
  APPOINTMENT_STATUS_VALUES,
  APPOINTMENT_STATUS_LABELS,
);
export const DIRECTOR_DESIGNATION_OPTIONS = optionsFrom(
  DIRECTOR_DESIGNATION_VALUES,
  DIRECTOR_DESIGNATION_LABELS,
);
export const EXECUTIVE_NON_EXECUTIVE_OPTIONS = optionsFrom(
  EXECUTIVE_NON_EXECUTIVE_VALUES,
  EXECUTIVE_NON_EXECUTIVE_LABELS,
);
export const GENDER_OPTIONS = optionsFrom(GENDER_VALUES, GENDER_LABELS);
export const ENTITY_LISTING_STATUS_OPTIONS = optionsFrom(
  ENTITY_LISTING_STATUS_VALUES,
  ENTITY_LISTING_STATUS_LABELS,
);
export const KMP_CLASSIFICATION_OPTIONS = optionsFrom(
  KMP_CLASSIFICATION_VALUES,
  KMP_CLASSIFICATION_LABELS,
);
export const EMPLOYMENT_TYPE_OPTIONS = optionsFrom(EMPLOYMENT_TYPE_VALUES, EMPLOYMENT_TYPE_LABELS);
export const PERSON_STATUS_OPTIONS = optionsFrom(PERSON_STATUS_VALUES, PERSON_STATUS_LABELS);
export const COMMITTEE_TYPE_OPTIONS = optionsFrom(COMMITTEE_TYPE_VALUES, COMMITTEE_TYPE_LABELS);
export const COMMITTEE_APPLICABILITY_OPTIONS = optionsFrom(
  COMMITTEE_APPLICABILITY_VALUES,
  COMMITTEE_APPLICABILITY_LABELS,
);
export const COMMITTEE_MEMBER_ROLE_OPTIONS = optionsFrom(
  COMMITTEE_MEMBER_ROLE_VALUES,
  COMMITTEE_MEMBER_ROLE_LABELS,
);
export const FAMILY_RELATIONSHIP_TYPE_OPTIONS = optionsFrom(
  FAMILY_RELATIONSHIP_TYPE_VALUES,
  FAMILY_RELATIONSHIP_TYPE_LABELS,
);
export const BOARD_CHANGE_EVENT_OPTIONS = optionsFrom(
  BOARD_CHANGE_EVENT_VALUES,
  BOARD_CHANGE_EVENT_LABELS,
);
export const GOVERNANCE_POLICY_TYPE_OPTIONS = optionsFrom(
  GOVERNANCE_POLICY_TYPE_VALUES,
  GOVERNANCE_POLICY_TYPE_LABELS,
);
export const POLICY_ADOPTED_STATUS_OPTIONS = optionsFrom(
  POLICY_ADOPTED_STATUS_VALUES,
  POLICY_ADOPTED_STATUS_LABELS,
);
export const SOURCE_STATUS_OPTIONS = optionsFrom(SOURCE_STATUS_VALUES, SOURCE_STATUS_LABELS);

export const MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS: Array<{
  key: keyof ManagementGovernanceConfirmations;
  label: string;
}> = [
  { key: 'currentBoardCompletelyDisclosed', label: 'Current Board is completely disclosed' },
  {
    key: 'proposedAppointmentsAndCessationsDisclosed',
    label: 'Proposed appointments and cessations are disclosed',
  },
  { key: 'directorBiographiesAccurate', label: 'Director biographies are accurate' },
  { key: 'otherDirectorshipsComplete', label: 'Other directorships are complete' },
  {
    key: 'eligibilityAndDebarmentDeclarationsComplete',
    label: 'Eligibility and debarment declarations are complete',
  },
  {
    key: 'independentDirectorRelationshipsDisclosed',
    label: 'Independent-director relationships are disclosed',
  },
  { key: 'allKmpAndSmpIdentified', label: 'All KMP/SMP are identified' },
  { key: 'organisationStructureComplete', label: 'Organisation structure is complete' },
  { key: 'committeesCompletelyDisclosed', label: 'Committees are completely disclosed' },
  { key: 'remunerationAndBenefitsComplete', label: 'Remuneration and benefits are complete' },
  {
    key: 'serviceContractsAndSpecialCompensationDisclosed',
    label: 'Service contracts and special compensation are disclosed',
  },
  {
    key: 'managementShareholdingAndOptionsDisclosed',
    label: 'Shareholding and options of management are disclosed',
  },
  { key: 'familyRelationshipsDisclosed', label: 'Family relationships are disclosed' },
  { key: 'appointmentArrangementsDisclosed', label: 'Appointment arrangements are disclosed' },
  { key: 'conflictsAndInterestsDisclosed', label: 'Conflicts and interests are disclosed' },
  {
    key: 'threeYearManagementChangesComplete',
    label: 'Three-year management changes are complete',
  },
  {
    key: 'governancePoliciesReflectCurrentStatus',
    label: 'Governance policies reflect current status',
  },
  {
    key: 'proposedAppointmentsNotRepresentedAsCompleted',
    label: 'Proposed appointments are not represented as completed',
  },
  {
    key: 'professionalLegalSecretarialConfirmationRemainsRequired',
    label: 'Professional, legal or secretarial confirmation remains required',
  },
  { key: 'rptGovernanceDisclosuresComplete', label: 'RPT governance disclosures are complete' },
  { key: 'boardProcessReadinessCaptured', label: 'Board process readiness is captured' },
  {
    key: 'governanceApplicabilityProfileReviewed',
    label: 'Governance applicability profile has been reviewed',
  },
];

export const SESSION_SAVE_NOTICE_M2 =
  'Changes are kept in this browser session only. Permanent saving will be connected in M2.';
