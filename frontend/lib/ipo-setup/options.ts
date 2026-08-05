import type { IpoSetupSectionId } from '@/lib/schemas/ipo-setup';
import {
  APPOINTMENT_STATUS_VALUES,
  APPROVAL_STATUS_VALUES,
  AUDITED_STATUS_VALUES,
  CONNECTIVITY_STATUS_VALUES,
  ELIGIBILITY_PROFILE_VALUES,
  FINANCIAL_SOURCE_TYPE_VALUES,
  IN_PRINCIPLE_STATUS_VALUES,
  ISSUE_PRICE_STATUS_VALUES,
  PREPARATION_STAGE_VALUES,
  PRICING_METHOD_VALUES,
  PROPOSED_OFFER_TYPE_VALUES,
  PUBLIC_CONVERSION_STATUS_VALUES,
  SHAREHOLDER_APPROVAL_STATUS_VALUES,
  TARGET_SME_PLATFORM_VALUES,
  TRACK_RECORD_BASIS_VALUES,
  YES_NO_NOT_SURE_VALUES,
} from '@/lib/schemas/ipo-setup';

export const IPO_SETUP_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'information', label: 'Information' },
  { id: 'eligibility-assessment', label: 'Eligibility Assessment' },
] as const;

export type IpoSetupTabId = (typeof IPO_SETUP_TABS)[number]['id'];

export const IPO_SETUP_INFORMATION_SECTIONS: Array<{
  id: IpoSetupSectionId;
  label: string;
  description: string;
}> = [
  {
    id: 'ipo-direction',
    label: 'IPO Direction',
    description: 'Preparation stage, platform, offer type and conversion status.',
  },
  {
    id: 'offer-structure',
    label: 'Proposed Offer Structure',
    description: 'Equity offer sizing for fresh issue and/or offer for sale.',
  },
  {
    id: 'track-record-financial',
    label: 'Track Record & Financial Eligibility',
    description: 'Operating track record and three-year financial eligibility inputs.',
  },
  {
    id: 'eligibility-declarations',
    label: 'Eligibility Declarations',
    description: 'Explicit yes / no / not-sure disclosures for eligibility concerns.',
  },
  {
    id: 'process-readiness',
    label: 'Process Readiness',
    description: 'Corporate approvals, dematerialisation and appointment statuses.',
  },
  {
    id: 'issuer-confirmations',
    label: 'Issuer Confirmations',
    description: 'Issuer acknowledgements that this assessment remains preliminary.',
  },
];

function optionsFrom(
  values: readonly string[],
  labels: Record<string, string>,
): Array<{ value: string; label: string }> {
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

export const PREPARATION_STAGE_LABELS: Record<(typeof PREPARATION_STAGE_VALUES)[number], string> = {
  'exploring-ipo': 'Exploring an IPO',
  'preparing-internally': 'Preparing internally',
  'advisers-being-appointed': 'Advisers being appointed',
  'preparing-draft-offer-document': 'Preparing draft offer document',
  'preparing-exchange-application': 'Preparing exchange application',
  'application-filed': 'Application filed',
};

export const TARGET_SME_PLATFORM_LABELS: Record<
  (typeof TARGET_SME_PLATFORM_VALUES)[number],
  string
> = {
  'nse-emerge': 'NSE Emerge',
  'bse-sme': 'BSE SME',
  undecided: 'Undecided',
};

export const ELIGIBILITY_PROFILE_LABELS: Record<
  (typeof ELIGIBILITY_PROFILE_VALUES)[number],
  string
> = {
  'standard-sme-ipo': 'Standard SME IPO',
  'nse-technology-startup-route': 'NSE technology-startup route',
  undecided: 'Undecided',
};

export const PROPOSED_OFFER_TYPE_LABELS: Record<
  (typeof PROPOSED_OFFER_TYPE_VALUES)[number],
  string
> = {
  'fresh-issue': 'Fresh issue',
  'offer-for-sale': 'Offer for sale',
  'fresh-and-ofs': 'Fresh issue and offer for sale',
  undecided: 'Undecided',
};

export const PRICING_METHOD_LABELS: Record<(typeof PRICING_METHOD_VALUES)[number], string> = {
  'fixed-price': 'Fixed-price issue',
  'book-built': 'Book-built issue',
  undecided: 'Undecided',
};

export const PUBLIC_CONVERSION_STATUS_LABELS: Record<
  (typeof PUBLIC_CONVERSION_STATUS_VALUES)[number],
  string
> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
  'professional-confirmation-required': 'Professional confirmation required',
};

export const ISSUE_PRICE_STATUS_LABELS: Record<
  (typeof ISSUE_PRICE_STATUS_VALUES)[number],
  string
> = {
  'not-determined': 'Not determined',
  indicative: 'Indicative',
  'finalised-internally': 'Finalised internally',
  'to-be-determined-book-building': 'To be determined through book building',
};

export const TRACK_RECORD_BASIS_LABELS: Record<
  (typeof TRACK_RECORD_BASIS_VALUES)[number],
  string
> = {
  'issuer-company': 'Issuer company',
  'promoter-promoting-company': 'Promoter/promoting company',
  'predecessor-proprietorship': 'Predecessor proprietorship',
  'predecessor-partnership-llp': 'Predecessor partnership/LLP',
  combination: 'Combination',
  'not-yet-established': 'Not yet established',
};

export const YES_NO_NOT_SURE_LABELS: Record<(typeof YES_NO_NOT_SURE_VALUES)[number], string> = {
  yes: 'Yes',
  no: 'No',
  'not-sure': 'Not sure',
};

export const preparationStageOptions = optionsFrom(
  PREPARATION_STAGE_VALUES,
  PREPARATION_STAGE_LABELS,
);
export const targetSmePlatformOptions = optionsFrom(
  TARGET_SME_PLATFORM_VALUES,
  TARGET_SME_PLATFORM_LABELS,
);
export const eligibilityProfileOptions = optionsFrom(
  ELIGIBILITY_PROFILE_VALUES,
  ELIGIBILITY_PROFILE_LABELS,
);
export const proposedOfferTypeOptions = optionsFrom(
  PROPOSED_OFFER_TYPE_VALUES,
  PROPOSED_OFFER_TYPE_LABELS,
);
export const pricingMethodOptions = optionsFrom(PRICING_METHOD_VALUES, PRICING_METHOD_LABELS);
export const publicConversionStatusOptions = optionsFrom(
  PUBLIC_CONVERSION_STATUS_VALUES,
  PUBLIC_CONVERSION_STATUS_LABELS,
);
export const issuePriceStatusOptions = optionsFrom(
  ISSUE_PRICE_STATUS_VALUES,
  ISSUE_PRICE_STATUS_LABELS,
);
export const trackRecordBasisOptions = optionsFrom(
  TRACK_RECORD_BASIS_VALUES,
  TRACK_RECORD_BASIS_LABELS,
);
export const yesNoNotSureOptions = optionsFrom(YES_NO_NOT_SURE_VALUES, YES_NO_NOT_SURE_LABELS);

export const auditedStatusOptions = optionsFrom(AUDITED_STATUS_VALUES, {
  audited: 'Audited',
  unaudited: 'Unaudited',
  'not-available': 'Not available',
});

export const financialSourceTypeOptions = optionsFrom(FINANCIAL_SOURCE_TYPE_VALUES, {
  'audited-financial-statements': 'Audited financial statements',
  'auditor-certificate': 'Auditor certificate',
  'management-estimate': 'Management estimate',
  'not-yet-available': 'Not yet available',
});

export const approvalStatusOptions = optionsFrom(APPROVAL_STATUS_VALUES, {
  'not-started': 'Not started',
  'draft-prepared': 'Draft prepared',
  passed: 'Passed',
});

export const shareholderApprovalStatusOptions = optionsFrom(SHAREHOLDER_APPROVAL_STATUS_VALUES, {
  'not-started': 'Not started',
  'notice-issued': 'Notice issued',
  passed: 'Passed',
});

export const appointmentStatusOptions = optionsFrom(APPOINTMENT_STATUS_VALUES, {
  'not-started': 'Not started',
  'discussions-ongoing': 'Discussions ongoing',
  appointed: 'Appointed',
  'not-applicable': 'Not applicable',
  'not-sure': 'Not sure',
});

export const connectivityStatusOptions = optionsFrom(CONNECTIVITY_STATUS_VALUES, {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
  'not-applicable': 'Not applicable',
  'not-sure': 'Not sure',
});

export const inPrincipleStatusOptions = optionsFrom(IN_PRINCIPLE_STATUS_VALUES, {
  'not-started': 'Not started',
  drafting: 'Drafting',
  filed: 'Filed',
  'clarifications-pending': 'Clarifications pending',
  approved: 'Approved',
  'not-applicable': 'Not applicable',
  'not-sure': 'Not sure',
});

export const FILING_QUARTER_OPTIONS = [
  { value: 'Q1', label: 'Q1 (Apr–Jun)' },
  { value: 'Q2', label: 'Q2 (Jul–Sep)' },
  { value: 'Q3', label: 'Q3 (Oct–Dec)' },
  { value: 'Q4', label: 'Q4 (Jan–Mar)' },
];

/** Declarations that require structured details when answered Yes. */
export const ELIGIBILITY_DECLARATION_FIELDS = [
  {
    key: 'admittedIbcAgainstIssuer',
    detailsKey: 'admittedIbcAgainstIssuerDetails',
    label: 'Admitted IBC proceeding against the issuer',
  },
  {
    key: 'admittedIbcAgainstPromotingCompany',
    detailsKey: 'admittedIbcAgainstPromotingCompanyDetails',
    label: 'Admitted IBC proceeding against a promoting company',
  },
  {
    key: 'admittedWindingUpPetition',
    detailsKey: 'admittedWindingUpPetitionDetails',
    label: 'Admitted winding-up petition',
  },
  {
    key: 'issuerDebarredFromCapitalMarkets',
    detailsKey: 'issuerDebarredFromCapitalMarketsDetails',
    label: 'Issuer debarred from accessing capital markets',
  },
  {
    key: 'promoterDirectorSellingShareholderDebarred',
    detailsKey: 'promoterDirectorSellingShareholderDebarredDetails',
    label: 'Promoter/director/selling shareholder debarred',
  },
  {
    key: 'promoterDirectorAssociatedWithDebarredCompany',
    detailsKey: 'promoterDirectorAssociatedWithDebarredCompanyDetails',
    label: 'Promoter/director associated with another debarred company',
  },
  {
    key: 'wilfulDefaulterOrFraudulentBorrower',
    detailsKey: 'wilfulDefaulterOrFraudulentBorrowerDetails',
    label: 'Wilful defaulter or fraudulent borrower classification',
  },
  {
    key: 'fugitiveEconomicOffender',
    detailsKey: 'fugitiveEconomicOffenderDetails',
    label: 'Fugitive economic offender',
  },
  {
    key: 'materialRegulatoryOrDisciplinaryAction',
    detailsKey: 'materialRegulatoryOrDisciplinaryActionDetails',
    label: 'Material regulatory or disciplinary action',
  },
  {
    key: 'seriousCriminalProceedingsInvolvingDirector',
    detailsKey: 'seriousCriminalProceedingsInvolvingDirectorDetails',
    label: 'Serious criminal proceedings involving a director',
  },
  {
    key: 'materialFinancialDefaultDuringRelevantPeriod',
    detailsKey: 'materialFinancialDefaultDuringRelevantPeriodDetails',
    label: 'Material financial default during the relevant period',
  },
  {
    key: 'materialUnresolvedEligibilityLitigation',
    detailsKey: 'materialUnresolvedEligibilityLitigationDetails',
    label: 'Material unresolved eligibility-related litigation',
  },
  {
    key: 'proceedsIncludeRelatedPartyLoanRepayment',
    detailsKey: 'proceedsIncludeRelatedPartyLoanRepaymentDetails',
    label:
      'Proposed use of proceeds includes repayment of promoter/promoter-group/related-party loans',
  },
] as const;

export const ISSUER_CONFIRMATION_FIELDS = [
  {
    key: 'offerInputsAreLatestInternalProposal',
    label: 'Offer inputs are the latest internal proposal',
  },
  {
    key: 'financialFiguresTraceableToSelectedSource',
    label: 'Financial figures are traceable to the selected source',
  },
  {
    key: 'knownEligibilityConcernsDisclosed',
    label: 'Known eligibility concerns have been disclosed',
  },
  {
    key: 'missingAnswersMustNotBeInterpretedAsNegative',
    label: 'Missing answers must not be interpreted as negative declarations',
  },
  {
    key: 'proposedOfsIncludesAllIntendedSellingShareholders',
    label: 'Proposed OFS includes all currently intended selling shareholders',
  },
  {
    key: 'assessmentIsPreliminary',
    label: 'This assessment is preliminary only',
  },
  {
    key: 'professionalAndExchangeConfirmationRemainRequired',
    label: 'Professional and exchange confirmation remain required',
  },
] as const;
