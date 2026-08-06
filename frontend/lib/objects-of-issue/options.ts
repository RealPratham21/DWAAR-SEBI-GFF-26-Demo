/**
 * UI option arrays and label maps for Objects of the Issue.
 *
 * Labels are presentation-only and must never be persisted inside the payload.
 */

import {
  APPRAISAL_STATUS_VALUES,
  APPROVAL_STATUS_VALUES,
  CAPEX_ITEM_TYPE_VALUES,
  DECLARED_OFFER_TYPE_VALUES,
  DEFINITIVE_AGREEMENT_STATUS_VALUES,
  EXPENSE_CATEGORY_VALUES,
  FUNDING_TIE_UP_STATUS_VALUES,
  LOAN_TYPE_VALUES,
  MEANS_OF_FINANCE_SOURCE_VALUES,
  MONITORING_AGENCY_STATUS_VALUES,
  OBJECT_CATEGORY_VALUES,
  QUOTATION_SOURCE_VALUES,
  TRANSACTION_TYPE_VALUES,
  WORKING_CAPITAL_METHODOLOGY_VALUES,
  YES_NO_NOT_SURE_VALUES,
} from '@/lib/schemas/objects-of-issue';
import type {
  ObjectsOfIssueConfirmations,
  ObjectsOfIssueSectionId,
} from '@/lib/schemas/objects-of-issue';

export type SelectOption = { value: string; label: string };

export const OBJECTS_OF_ISSUE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'information', label: 'Information' },
  { id: 'objects-assessment', label: 'Objects Assessment' },
] as const;

export type ObjectsOfIssueTabId = (typeof OBJECTS_OF_ISSUE_TABS)[number]['id'];

/** Alias used by URL hook and barrel exports. */
export const TABS = OBJECTS_OF_ISSUE_TABS;

export const OBJECTS_OF_ISSUE_INFORMATION_SECTIONS: Array<{
  id: ObjectsOfIssueSectionId;
  label: string;
  description: string;
}> = [
  {
    id: 'proceeds-and-funding-summary',
    label: 'Proceeds & Funding Summary',
    description:
      'Declared offer type, gross fresh-issue proceeds, issue expenses and the derived net proceeds available for the objects.',
  },
  {
    id: 'objects-register-and-allocation',
    label: 'Objects Register & Allocation',
    description:
      'The register of objects of the issue with estimated cost, allocation and appraisal status.',
  },
  {
    id: 'capital-expenditure-facilities-and-expansion',
    label: 'Capital Expenditure, Facilities & Expansion',
    description:
      'New plant and machinery, facility expansion, technology upgrades and branch or outlet expansion items.',
  },
  {
    id: 'working-capital-and-borrowing-repayment',
    label: 'Working Capital & Borrowing Repayment',
    description:
      'Working-capital requirement and repayment or prepayment of outstanding borrowings.',
  },
  {
    id: 'acquisitions-subsidiaries-jvs-and-investments',
    label: 'Acquisitions, Subsidiaries, JVs & Investments',
    description: 'Proposed acquisitions, new subsidiaries, joint ventures and investments.',
  },
  {
    id: 'means-of-finance-and-deployment-schedule',
    label: 'Means of Finance & Deployment Schedule',
    description:
      'Total project cost by source of finance, funding tie-up status and the year-wise deployment schedule.',
  },
  {
    id: 'expenses-gcp-monitoring-and-confirmations',
    label: 'Expenses, GCP, Monitoring & Confirmations',
    description:
      'Issue-expense break-up, General Corporate Purposes, monitoring agency and issuer confirmations.',
  },
];

/** Alias used by URL hook and barrel exports. */
export const INFORMATION_SECTIONS = OBJECTS_OF_ISSUE_INFORMATION_SECTIONS;

export const OBJECTS_OF_ISSUE_SECTION_LABELS: Record<ObjectsOfIssueSectionId, string> = {
  'proceeds-and-funding-summary': 'Proceeds & Funding Summary',
  'objects-register-and-allocation': 'Objects Register & Allocation',
  'capital-expenditure-facilities-and-expansion': 'Capital Expenditure, Facilities & Expansion',
  'working-capital-and-borrowing-repayment': 'Working Capital & Borrowing Repayment',
  'acquisitions-subsidiaries-jvs-and-investments': 'Acquisitions, Subsidiaries, JVs & Investments',
  'means-of-finance-and-deployment-schedule': 'Means of Finance & Deployment Schedule',
  'expenses-gcp-monitoring-and-confirmations': 'Expenses, GCP, Monitoring & Confirmations',
};

function optionsFrom(values: readonly string[], labels: Record<string, string>): SelectOption[] {
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

/* -------------------------------------------------------------------------- */
/* Label maps                                                                  */
/* -------------------------------------------------------------------------- */

export const YES_NO_NOT_SURE_LABELS: Record<(typeof YES_NO_NOT_SURE_VALUES)[number], string> = {
  yes: 'Yes',
  no: 'No',
  not_sure: 'Not sure',
};

export const DECLARED_OFFER_TYPE_LABELS: Record<
  (typeof DECLARED_OFFER_TYPE_VALUES)[number],
  string
> = {
  'fresh-issue': 'Fresh issue',
  'offer-for-sale': 'Offer for sale',
  'fresh-issue-and-offer-for-sale': 'Fresh issue and offer for sale',
};

export const OBJECT_CATEGORY_LABELS: Record<(typeof OBJECT_CATEGORY_VALUES)[number], string> = {
  'capital-expenditure': 'Capital expenditure',
  'working-capital': 'Working capital',
  'repayment-prepayment-of-borrowings': 'Repayment / prepayment of borrowings',
  'acquisition-or-investment': 'Acquisition or investment',
  'general-corporate-purposes': 'General corporate purposes',
  other: 'Other',
};

export const APPRAISAL_STATUS_LABELS: Record<(typeof APPRAISAL_STATUS_VALUES)[number], string> = {
  'appraised-by-bank-or-fi': 'Appraised by bank / financial institution',
  'not-appraised': 'Not appraised',
  not_sure: 'Not sure',
};

export const CAPEX_ITEM_TYPE_LABELS: Record<(typeof CAPEX_ITEM_TYPE_VALUES)[number], string> = {
  'new-plant-and-machinery': 'New plant and machinery',
  'facility-expansion': 'Facility expansion',
  'technology-or-it-upgrade': 'Technology or IT upgrade',
  'branch-or-outlet-expansion': 'Branch or outlet expansion',
  'land-and-building': 'Land and building',
  'research-and-development-infrastructure': 'Research and development infrastructure',
  other: 'Other',
};

export const QUOTATION_SOURCE_LABELS: Record<(typeof QUOTATION_SOURCE_VALUES)[number], string> = {
  'single-quotation': 'Single quotation',
  'multiple-quotations': 'Multiple quotations',
  'not-obtained': 'Not obtained',
};

export const APPROVAL_STATUS_LABELS: Record<(typeof APPROVAL_STATUS_VALUES)[number], string> = {
  'not-required': 'Not required',
  applied: 'Applied',
  received: 'Received',
  pending: 'Pending',
};

export const WORKING_CAPITAL_METHODOLOGY_LABELS: Record<
  (typeof WORKING_CAPITAL_METHODOLOGY_VALUES)[number],
  string
> = {
  'turnover-method': 'Turnover method',
  'lending-norms-method': 'Lending norms method',
  'management-estimate': 'Management estimate',
  other: 'Other',
};

export const LOAN_TYPE_LABELS: Record<(typeof LOAN_TYPE_VALUES)[number], string> = {
  'term-loan': 'Term loan',
  'working-capital-facility': 'Working capital facility',
  'unsecured-loan': 'Unsecured loan',
  debenture: 'Debenture',
  'inter-corporate-deposit': 'Inter-corporate deposit',
  other: 'Other',
};

export const TRANSACTION_TYPE_LABELS: Record<(typeof TRANSACTION_TYPE_VALUES)[number], string> = {
  acquisition: 'Acquisition',
  'subsidiary-investment': 'Subsidiary investment',
  'joint-venture': 'Joint venture',
  'strategic-investment': 'Strategic investment',
  other: 'Other',
};

export const DEFINITIVE_AGREEMENT_STATUS_LABELS: Record<
  (typeof DEFINITIVE_AGREEMENT_STATUS_VALUES)[number],
  string
> = {
  'definitive-agreement-executed': 'Definitive agreement executed',
  'term-sheet-or-mou-signed': 'Term sheet / MoU signed',
  'target-not-yet-identified': 'Target not yet identified',
  not_sure: 'Not sure',
};

export const MEANS_OF_FINANCE_SOURCE_LABELS: Record<
  (typeof MEANS_OF_FINANCE_SOURCE_VALUES)[number],
  string
> = {
  'net-proceeds-of-the-issue': 'Net proceeds of the issue',
  'internal-accruals': 'Internal accruals',
  'term-loan-or-debt': 'Term loan / debt',
  'existing-cash-and-bank-balances': 'Existing cash and bank balances',
  'promoter-or-promoter-group-contribution': 'Promoter / promoter group contribution',
  other: 'Other',
};

export const FUNDING_TIE_UP_STATUS_LABELS: Record<
  (typeof FUNDING_TIE_UP_STATUS_VALUES)[number],
  string
> = {
  'fully-tied-up': 'Fully tied up',
  'partially-tied-up': 'Partially tied up',
  'not-tied-up': 'Not tied up',
  not_sure: 'Not sure',
};

export const EXPENSE_CATEGORY_LABELS: Record<(typeof EXPENSE_CATEGORY_VALUES)[number], string> = {
  'lead-manager-and-underwriting-fees': 'Lead manager and underwriting fees',
  'registrar-fees': 'Registrar fees',
  'legal-and-professional-fees': 'Legal and professional fees',
  'advertising-and-marketing': 'Advertising and marketing',
  'printing-and-stationery': 'Printing and stationery',
  'listing-and-regulatory-fees': 'Listing and regulatory fees',
  other: 'Other',
};

export const MONITORING_AGENCY_STATUS_LABELS: Record<
  (typeof MONITORING_AGENCY_STATUS_VALUES)[number],
  string
> = {
  appointed: 'Appointed',
  'identified-not-appointed': 'Identified, not yet appointed',
  'not-yet-identified': 'Not yet identified',
  'not-applicable': 'Not applicable',
};

/* -------------------------------------------------------------------------- */
/* Select option arrays                                                        */
/* -------------------------------------------------------------------------- */

export const YES_NO_NOT_SURE_OPTIONS = optionsFrom(YES_NO_NOT_SURE_VALUES, YES_NO_NOT_SURE_LABELS);
export const DECLARED_OFFER_TYPE_OPTIONS = optionsFrom(
  DECLARED_OFFER_TYPE_VALUES,
  DECLARED_OFFER_TYPE_LABELS,
);
export const OBJECT_CATEGORY_OPTIONS = optionsFrom(OBJECT_CATEGORY_VALUES, OBJECT_CATEGORY_LABELS);
export const APPRAISAL_STATUS_OPTIONS = optionsFrom(
  APPRAISAL_STATUS_VALUES,
  APPRAISAL_STATUS_LABELS,
);
export const CAPEX_ITEM_TYPE_OPTIONS = optionsFrom(
  CAPEX_ITEM_TYPE_VALUES,
  CAPEX_ITEM_TYPE_LABELS,
);
export const QUOTATION_SOURCE_OPTIONS = optionsFrom(
  QUOTATION_SOURCE_VALUES,
  QUOTATION_SOURCE_LABELS,
);
export const APPROVAL_STATUS_OPTIONS = optionsFrom(APPROVAL_STATUS_VALUES, APPROVAL_STATUS_LABELS);
export const WORKING_CAPITAL_METHODOLOGY_OPTIONS = optionsFrom(
  WORKING_CAPITAL_METHODOLOGY_VALUES,
  WORKING_CAPITAL_METHODOLOGY_LABELS,
);
export const LOAN_TYPE_OPTIONS = optionsFrom(LOAN_TYPE_VALUES, LOAN_TYPE_LABELS);
export const TRANSACTION_TYPE_OPTIONS = optionsFrom(
  TRANSACTION_TYPE_VALUES,
  TRANSACTION_TYPE_LABELS,
);
export const DEFINITIVE_AGREEMENT_STATUS_OPTIONS = optionsFrom(
  DEFINITIVE_AGREEMENT_STATUS_VALUES,
  DEFINITIVE_AGREEMENT_STATUS_LABELS,
);
export const MEANS_OF_FINANCE_SOURCE_OPTIONS = optionsFrom(
  MEANS_OF_FINANCE_SOURCE_VALUES,
  MEANS_OF_FINANCE_SOURCE_LABELS,
);
export const FUNDING_TIE_UP_STATUS_OPTIONS = optionsFrom(
  FUNDING_TIE_UP_STATUS_VALUES,
  FUNDING_TIE_UP_STATUS_LABELS,
);
export const EXPENSE_CATEGORY_OPTIONS = optionsFrom(
  EXPENSE_CATEGORY_VALUES,
  EXPENSE_CATEGORY_LABELS,
);
export const MONITORING_AGENCY_STATUS_OPTIONS = optionsFrom(
  MONITORING_AGENCY_STATUS_VALUES,
  MONITORING_AGENCY_STATUS_LABELS,
);

export const OBJECTS_OF_ISSUE_CONFIRMATION_FIELDS: Array<{
  key: keyof ObjectsOfIssueConfirmations;
  label: string;
}> = [
  {
    key: 'objectsServeBonafideBusinessPurposes',
    label: 'The objects of the issue serve bona fide business purposes',
  },
  {
    key: 'noPartOfProceedsBenefitsRelatedPartiesBeyondDisclosed',
    label:
      'No part of the proceeds benefits related parties beyond what is disclosed in this workstream',
  },
  {
    key: 'deploymentScheduleIsManagementEstimate',
    label: "The deployment schedule is management's current estimate, subject to change",
  },
  {
    key: 'shortfallToBeMetFromInternalAccrualsOrOtherSources',
    label: 'Any shortfall in means of finance will be met from internal accruals or other sources',
  },
  {
    key: 'meansOfFinanceExcludingIssueProceedsAlreadyTiedUp',
    label: 'Means of finance excluding the issue proceeds are already tied up',
  },
  {
    key: 'monitoringAndUtilisationCertificationRequirementUnderstood',
    label: 'The monitoring and utilisation-certification requirement is understood',
  },
  {
    key: 'professionalReviewRemainsRequired',
    label: 'Professional review of this workstream remains required',
  },
];
