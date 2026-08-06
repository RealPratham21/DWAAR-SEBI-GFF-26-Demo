/**
 * UI option arrays and label maps for Capital & Ownership.
 *
 * Labels are presentation-only and must never be persisted inside the payload.
 */

import type { CapitalOwnershipSectionId } from '@/lib/schemas/capital-ownership';
import {
  ACQUISITION_MODE_VALUES,
  BENEFICIAL_INTEREST_NATURE_VALUES,
  CAPITAL_AMOUNT_UNIT_VALUES,
  CAPITAL_EVENT_TYPE_VALUES,
  CONSIDERATION_TYPE_VALUES,
  CONTRIBUTION_ACQUISITION_MODE_VALUES,
  CONTROL_ARRANGEMENT_TYPE_VALUES,
  DEMAT_STATUS_VALUES,
  DEPOSITORY_CONNECTIVITY_VALUES,
  ENCUMBRANCE_TYPE_VALUES,
  EQUITY_CLASS_TYPE_VALUES,
  HOLDER_TYPE_VALUES,
  IDENTIFIER_TYPE_VALUES,
  INSTRUMENT_HOLDER_CATEGORY_VALUES,
  LOCK_IN_PERIOD_VALUES,
  OUTSTANDING_INSTRUMENT_TYPE_VALUES,
  PREFERENCE_CLASS_TYPE_VALUES,
  PROMOTER_GROUP_BASIS_VALUES,
  PROMOTER_GROUP_RELATIONSHIP_VALUES,
  PROMOTER_STATUS_BASIS_VALUES,
  PROMOTER_TYPE_VALUES,
  RESIDENTIAL_STATUS_VALUES,
  RESOLUTION_TYPE_VALUES,
  SECURITY_TYPE_VALUES,
  SHAREHOLDER_CATEGORY_VALUES,
  TRANSACTION_TYPE_VALUES,
  YES_NO_NOT_SURE_VALUES,
} from '@/lib/schemas/capital-ownership';

export type SelectOption = { value: string; label: string };

export const CAPITAL_OWNERSHIP_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'information', label: 'Information' },
  { id: 'capital-assessment', label: 'Capital Assessment' },
] as const;

export type CapitalOwnershipTabId = (typeof CAPITAL_OWNERSHIP_TABS)[number]['id'];

export const CAPITAL_OWNERSHIP_INFORMATION_SECTIONS: Array<{
  id: CapitalOwnershipSectionId;
  label: string;
  description: string;
}> = [
  {
    id: 'current-capital-structure',
    label: 'Current Capital Structure',
    description:
      'Authorised, issued, subscribed and paid-up capital by class as on the stated date.',
  },
  {
    id: 'share-capital-history',
    label: 'Share Capital History',
    description:
      'Every allotment, split, bonus, buyback and reduction since incorporation, with filings.',
  },
  {
    id: 'shareholders-beneficial-ownership',
    label: 'Shareholders & Beneficial Ownership',
    description:
      'Register of members, category-wise holdings and significant beneficial owner details.',
  },
  {
    id: 'promoters-and-control',
    label: 'Promoters & Control',
    description:
      'Promoters, promoter group members and agreements or rights that confer control.',
  },
  {
    id: 'pre-post-issue-ownership',
    label: 'Pre & Post-Issue Ownership',
    description:
      'Offer-for-sale intentions and expected transfers used to derive the pre/post-issue cap table.',
  },
  {
    id: 'promoter-contribution-lock-in',
    label: 'Promoter Contribution, Lock-In & Encumbrances',
    description:
      'Shares earmarked for minimum promoter contribution, lock-in eligibility and encumbrances.',
  },
  {
    id: 'outstanding-securities-confirmations',
    label: 'Outstanding Securities, Transactions & Confirmations',
    description:
      'Convertibles and options, recent share transactions, and issuer confirmations.',
  },
];

export const CAPITAL_OWNERSHIP_SECTION_LABELS: Record<CapitalOwnershipSectionId, string> = {
  'current-capital-structure': 'Current Capital Structure',
  'share-capital-history': 'Share Capital History',
  'shareholders-beneficial-ownership': 'Shareholders & Beneficial Ownership',
  'promoters-and-control': 'Promoters & Control',
  'pre-post-issue-ownership': 'Pre & Post-Issue Ownership',
  'promoter-contribution-lock-in': 'Promoter Contribution, Lock-In & Encumbrances',
  'outstanding-securities-confirmations': 'Outstanding Securities, Transactions & Confirmations',
};

function optionsFrom(
  values: readonly string[],
  labels: Record<string, string>,
): SelectOption[] {
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

export const CAPITAL_AMOUNT_UNIT_LABELS: Record<
  (typeof CAPITAL_AMOUNT_UNIT_VALUES)[number],
  string
> = {
  rupees: 'Rupees (₹)',
  lakh: 'Lakh (₹ 1,00,000)',
  crore: 'Crore (₹ 1,00,00,000)',
};

export const DEMAT_STATUS_LABELS: Record<(typeof DEMAT_STATUS_VALUES)[number], string> = {
  'fully-dematerialised': 'Fully dematerialised',
  'partly-dematerialised': 'Partly dematerialised',
  'fully-physical': 'Fully physical',
  unknown: 'Not known',
};

export const DEPOSITORY_CONNECTIVITY_LABELS: Record<
  (typeof DEPOSITORY_CONNECTIVITY_VALUES)[number],
  string
> = {
  nsdl: 'NSDL only',
  cdsl: 'CDSL only',
  both: 'Both NSDL and CDSL',
  none: 'No depository connectivity',
  unknown: 'Not known',
};

export const SECURITY_TYPE_LABELS: Record<(typeof SECURITY_TYPE_VALUES)[number], string> = {
  equity: 'Equity shares',
  preference: 'Preference shares',
  'convertible-instrument': 'Convertible instrument',
  warrant: 'Warrants',
  debenture: 'Debentures',
  other: 'Other securities',
};

export const EQUITY_CLASS_TYPE_LABELS: Record<
  (typeof EQUITY_CLASS_TYPE_VALUES)[number],
  string
> = {
  'ordinary-equity': 'Ordinary voting rights',
  'equity-with-differential-voting-rights': 'Differential voting rights',
  'equity-with-superior-voting-rights': 'Superior voting rights',
  'partly-paid-equity': 'Partly paid-up equity',
  other: 'Other',
};

export const PREFERENCE_CLASS_TYPE_LABELS: Record<
  (typeof PREFERENCE_CLASS_TYPE_VALUES)[number],
  string
> = {
  'cumulative-redeemable': 'Cumulative redeemable preference shares',
  'non-cumulative-redeemable': 'Non-cumulative redeemable preference shares',
  'cumulative-convertible': 'Cumulative convertible preference shares',
  'non-cumulative-convertible': 'Non-cumulative convertible preference shares',
  'compulsorily-convertible': 'Compulsorily convertible preference shares',
  'optionally-convertible': 'Optionally convertible preference shares',
  other: 'Other preference class',
};

export const CAPITAL_EVENT_TYPE_LABELS: Record<
  (typeof CAPITAL_EVENT_TYPE_VALUES)[number],
  string
> = {
  'incorporation-initial-subscription': 'Subscription to memorandum (incorporation)',
  'further-allotment-cash': 'Further allotment for cash',
  'rights-issue': 'Rights issue',
  'bonus-issue': 'Bonus issue',
  'preferential-allotment': 'Preferential allotment',
  'private-placement': 'Private placement',
  'esop-allotment': 'Allotment on ESOP exercise',
  'sweat-equity-allotment': 'Sweat equity allotment',
  'conversion-of-securities': 'Conversion of securities',
  'conversion-of-loan': 'Conversion of loan into equity',
  'scheme-of-arrangement': 'Scheme of arrangement',
  'share-split-subdivision': 'Share split / sub-division',
  'share-consolidation': 'Share consolidation',
  buyback: 'Buyback',
  'capital-reduction': 'Capital reduction',
  'forfeiture-of-shares': 'Forfeiture of shares',
  'redemption-of-preference-shares': 'Redemption of preference shares',
  'cancellation-of-shares': 'Cancellation of shares',
  'increase-in-authorised-capital': 'Increase in authorised capital',
  other: 'Other capital event',
};

export const CONSIDERATION_TYPE_LABELS: Record<
  (typeof CONSIDERATION_TYPE_VALUES)[number],
  string
> = {
  cash: 'Cash',
  'other-than-cash': 'Other than cash',
  'part-cash-part-other': 'Part cash, part other than cash',
  'bonus-capitalisation': 'Capitalisation of reserves (bonus)',
  conversion: 'Conversion of an existing instrument',
  'scheme-of-arrangement': 'Pursuant to a scheme of arrangement',
  'nil-consideration': 'Nil consideration',
  unknown: 'Not known',
};

export const RESOLUTION_TYPE_LABELS: Record<(typeof RESOLUTION_TYPE_VALUES)[number], string> = {
  'board-resolution': 'Board resolution',
  'shareholder-ordinary-resolution': 'Shareholders — ordinary resolution',
  'shareholder-special-resolution': 'Shareholders — special resolution',
  'nclt-order': 'NCLT order',
  'court-order': 'Court order',
  'not-applicable': 'Not applicable',
  unknown: 'Not known',
};

export const HOLDER_TYPE_LABELS: Record<(typeof HOLDER_TYPE_VALUES)[number], string> = {
  individual: 'Individual',
  'hindu-undivided-family': 'Hindu undivided family',
  'body-corporate': 'Body corporate',
  'limited-liability-partnership': 'Limited liability partnership',
  'partnership-firm': 'Partnership firm',
  trust: 'Trust',
  bank: 'Bank',
  'financial-institution': 'Financial institution',
  'insurance-company': 'Insurance company',
  'mutual-fund': 'Mutual fund',
  'alternative-investment-fund': 'Alternative investment fund',
  'venture-capital-fund': 'Venture capital fund',
  'foreign-venture-capital-investor': 'Foreign venture capital investor',
  'foreign-portfolio-investor': 'Foreign portfolio investor',
  'foreign-company': 'Foreign company',
  'non-resident-indian': 'Non-resident Indian',
  employee: 'Employee',
  'employee-welfare-trust': 'Employee welfare trust',
  'government-or-government-body': 'Government or government body',
  other: 'Other',
};

export const RESIDENTIAL_STATUS_LABELS: Record<
  (typeof RESIDENTIAL_STATUS_VALUES)[number],
  string
> = {
  resident: 'Resident',
  'non-resident-indian': 'Non-resident Indian',
  'foreign-national': 'Foreign national',
  'foreign-entity': 'Foreign entity',
  unknown: 'Not known',
};

export const SHAREHOLDER_CATEGORY_LABELS: Record<
  (typeof SHAREHOLDER_CATEGORY_VALUES)[number],
  string
> = {
  promoter: 'Promoter',
  'promoter-group': 'Promoter group',
  public: 'Public',
  employee: 'Employee',
  'institutional-investor': 'Institutional investor',
  'body-corporate': 'Body corporate',
  other: 'Other',
};

export const ACQUISITION_MODE_LABELS: Record<(typeof ACQUISITION_MODE_VALUES)[number], string> = {
  'subscription-to-memorandum': 'Subscription to memorandum',
  'cash-subscription-allotment': 'Allotment for cash',
  'rights-issue': 'Rights issue',
  'bonus-issue': 'Bonus issue',
  'preferential-allotment': 'Preferential allotment',
  'private-placement': 'Private placement',
  'secondary-purchase': 'Secondary purchase',
  gift: 'Gift',
  transmission: 'Transmission',
  'scheme-of-arrangement': 'Scheme of arrangement',
  'conversion-of-securities': 'Conversion of securities',
  'esop-exercise': 'ESOP exercise',
  'sweat-equity': 'Sweat equity',
  'other-than-cash': 'Consideration other than cash',
  other: 'Other',
};

export const IDENTIFIER_TYPE_LABELS: Record<(typeof IDENTIFIER_TYPE_VALUES)[number], string> = {
  pan: 'PAN',
  cin: 'CIN',
  llpin: 'LLPIN',
  passport: 'Passport number',
  'foreign-registration-number': 'Foreign registration number',
  other: 'Other identifier',
};

export const BENEFICIAL_INTEREST_NATURE_LABELS: Record<
  (typeof BENEFICIAL_INTEREST_NATURE_VALUES)[number],
  string
> = {
  shares: 'Shares',
  'voting-rights': 'Voting rights',
  'right-to-distributions': 'Right to distributions',
  'significant-influence-or-control': 'Significant influence or control',
  other: 'Other interest',
};

export const PROMOTER_TYPE_LABELS: Record<(typeof PROMOTER_TYPE_VALUES)[number], string> = {
  individual: 'Individual',
  'body-corporate': 'Body corporate',
  'hindu-undivided-family': 'Hindu undivided family',
  'partnership-firm': 'Partnership firm',
  'limited-liability-partnership': 'Limited liability partnership',
  trust: 'Trust',
  other: 'Other',
};

export const PROMOTER_STATUS_BASIS_LABELS: Record<
  (typeof PROMOTER_STATUS_BASIS_VALUES)[number],
  string
> = {
  shareholding: 'Shareholding',
  'control-over-affairs': 'Control over the affairs of the issuer',
  'named-in-offer-document': 'Named as promoter in the offer document',
  'board-representation': 'Board representation',
  'shareholders-agreement-rights': 'Rights under a shareholders agreement',
  'management-control': 'Management control',
  other: 'Other basis',
};

export const PROMOTER_GROUP_RELATIONSHIP_LABELS: Record<
  (typeof PROMOTER_GROUP_RELATIONSHIP_VALUES)[number],
  string
> = {
  spouse: 'Spouse',
  father: 'Father',
  mother: 'Mother',
  brother: 'Brother',
  sister: 'Sister',
  son: 'Son',
  daughter: 'Daughter',
  'spouse-father': "Spouse's father",
  'spouse-mother': "Spouse's mother",
  'spouse-brother': "Spouse's brother",
  'spouse-sister': "Spouse's sister",
  'hindu-undivided-family-member': 'Member of the promoter HUF',
  'body-corporate-controlled-by-promoter': 'Body corporate controlled by the promoter',
  'body-corporate-in-which-promoter-holds-twenty-percent':
    'Body corporate in which the promoter holds 20% or more',
  'body-corporate-holding-twenty-percent-in-promoter':
    'Body corporate holding 20% or more in the promoter',
  'firm-in-which-promoter-is-partner': 'Firm in which the promoter is a partner',
  'llp-in-which-promoter-is-partner': 'LLP in which the promoter is a partner',
  'trust-with-promoter-as-trustee-or-beneficiary':
    'Trust with the promoter as trustee or beneficiary',
  other: 'Other relationship',
};

export const PROMOTER_GROUP_BASIS_LABELS: Record<
  (typeof PROMOTER_GROUP_BASIS_VALUES)[number],
  string
> = {
  'immediate-relative': 'Immediate relative of a promoter',
  'shareholding-threshold': 'Shareholding threshold',
  'common-control': 'Common control',
  'hindu-undivided-family': 'Hindu undivided family',
  'firm-or-llp': 'Firm or LLP connection',
  trust: 'Trust connection',
  other: 'Other basis',
};

export const CONTROL_ARRANGEMENT_TYPE_LABELS: Record<
  (typeof CONTROL_ARRANGEMENT_TYPE_VALUES)[number],
  string
> = {
  'shareholders-agreement': 'Shareholders agreement',
  'voting-agreement': 'Voting agreement',
  'share-subscription-agreement': 'Share subscription agreement',
  'joint-venture-agreement': 'Joint venture agreement',
  'articles-of-association-special-rights': 'Special rights in the articles of association',
  'board-nomination-right': 'Board nomination right',
  'affirmative-vote-rights': 'Affirmative vote rights',
  'veto-rights': 'Veto rights',
  'put-or-call-option': 'Put or call option',
  'right-of-first-refusal': 'Right of first refusal',
  'tag-along-right': 'Tag-along right',
  'drag-along-right': 'Drag-along right',
  'anti-dilution-right': 'Anti-dilution right',
  'share-pledge-with-voting-rights': 'Share pledge carrying voting rights',
  'power-of-attorney': 'Power of attorney',
  'family-arrangement': 'Family arrangement',
  'management-agreement': 'Management agreement',
  other: 'Other arrangement',
};

export const LOCK_IN_PERIOD_LABELS: Record<(typeof LOCK_IN_PERIOD_VALUES)[number], string> = {
  'three-years': 'Three years',
  'eighteen-months': 'Eighteen months',
  'one-year': 'One year',
  'six-months': 'Six months',
  'not-applicable': 'Not applicable',
};

export const CONTRIBUTION_ACQUISITION_MODE_LABELS: Record<
  (typeof CONTRIBUTION_ACQUISITION_MODE_VALUES)[number],
  string
> = {
  'cash-subscription': 'Subscription for cash',
  'cash-purchase': 'Purchase for cash',
  'bonus-out-of-free-reserves': 'Bonus out of free reserves',
  'bonus-out-of-revaluation-reserves': 'Bonus out of revaluation reserves',
  'conversion-of-convertible-security': 'Conversion of a convertible security',
  'consideration-other-than-cash': 'Consideration other than cash',
  gift: 'Gift',
  transmission: 'Transmission',
  'scheme-of-arrangement': 'Scheme of arrangement',
  'esop-exercise': 'ESOP exercise',
  other: 'Other mode',
};

export const ENCUMBRANCE_TYPE_LABELS: Record<(typeof ENCUMBRANCE_TYPE_VALUES)[number], string> = {
  pledge: 'Pledge',
  lien: 'Lien',
  'non-disposal-undertaking': 'Non-disposal undertaking',
  'negative-lien': 'Negative lien',
  mortgage: 'Mortgage',
  charge: 'Charge',
  'option-arrangement': 'Option arrangement',
  other: 'Other encumbrance',
};

export const OUTSTANDING_INSTRUMENT_TYPE_LABELS: Record<
  (typeof OUTSTANDING_INSTRUMENT_TYPE_VALUES)[number],
  string
> = {
  'employee-stock-option-scheme': 'Employee stock option scheme',
  'employee-stock-purchase-scheme': 'Employee stock purchase scheme',
  'sweat-equity': 'Sweat equity',
  'compulsorily-convertible-preference-shares': 'Compulsorily convertible preference shares',
  'optionally-convertible-preference-shares': 'Optionally convertible preference shares',
  'compulsorily-convertible-debentures': 'Compulsorily convertible debentures',
  'optionally-convertible-debentures': 'Optionally convertible debentures',
  warrants: 'Warrants',
  'convertible-loan': 'Convertible loan',
  'share-purchase-option': 'Share purchase option',
  'right-to-subscribe': 'Right to subscribe',
  other: 'Other instrument',
};

export const INSTRUMENT_HOLDER_CATEGORY_LABELS: Record<
  (typeof INSTRUMENT_HOLDER_CATEGORY_VALUES)[number],
  string
> = {
  promoter: 'Promoter',
  'promoter-group': 'Promoter group',
  directors: 'Directors',
  'key-managerial-personnel': 'Key managerial personnel',
  employees: 'Employees',
  investors: 'Investors',
  lenders: 'Lenders',
  other: 'Other holders',
};

export const TRANSACTION_TYPE_LABELS: Record<(typeof TRANSACTION_TYPE_VALUES)[number], string> = {
  'primary-allotment': 'Primary allotment',
  'secondary-transfer': 'Secondary transfer',
  gift: 'Gift',
  transmission: 'Transmission',
  buyback: 'Buyback',
  'pledge-invocation': 'Pledge invocation',
  conversion: 'Conversion',
  'esop-exercise': 'ESOP exercise',
  'capital-reduction': 'Capital reduction',
  other: 'Other transaction',
};

/* -------------------------------------------------------------------------- */
/* Option arrays                                                               */
/* -------------------------------------------------------------------------- */

export const yesNoNotSureOptions = optionsFrom(YES_NO_NOT_SURE_VALUES, YES_NO_NOT_SURE_LABELS);
export const capitalAmountUnitOptions = optionsFrom(
  CAPITAL_AMOUNT_UNIT_VALUES,
  CAPITAL_AMOUNT_UNIT_LABELS,
);
export const dematStatusOptions = optionsFrom(DEMAT_STATUS_VALUES, DEMAT_STATUS_LABELS);
export const depositoryConnectivityOptions = optionsFrom(
  DEPOSITORY_CONNECTIVITY_VALUES,
  DEPOSITORY_CONNECTIVITY_LABELS,
);
export const securityTypeOptions = optionsFrom(SECURITY_TYPE_VALUES, SECURITY_TYPE_LABELS);
export const equityClassTypeOptions = optionsFrom(
  EQUITY_CLASS_TYPE_VALUES,
  EQUITY_CLASS_TYPE_LABELS,
);
export const preferenceClassTypeOptions = optionsFrom(
  PREFERENCE_CLASS_TYPE_VALUES,
  PREFERENCE_CLASS_TYPE_LABELS,
);
export const capitalEventTypeOptions = optionsFrom(
  CAPITAL_EVENT_TYPE_VALUES,
  CAPITAL_EVENT_TYPE_LABELS,
);
export const considerationTypeOptions = optionsFrom(
  CONSIDERATION_TYPE_VALUES,
  CONSIDERATION_TYPE_LABELS,
);
export const resolutionTypeOptions = optionsFrom(RESOLUTION_TYPE_VALUES, RESOLUTION_TYPE_LABELS);
export const holderTypeOptions = optionsFrom(HOLDER_TYPE_VALUES, HOLDER_TYPE_LABELS);
export const residentialStatusOptions = optionsFrom(
  RESIDENTIAL_STATUS_VALUES,
  RESIDENTIAL_STATUS_LABELS,
);
export const shareholderCategoryOptions = optionsFrom(
  SHAREHOLDER_CATEGORY_VALUES,
  SHAREHOLDER_CATEGORY_LABELS,
);
export const acquisitionModeOptions = optionsFrom(
  ACQUISITION_MODE_VALUES,
  ACQUISITION_MODE_LABELS,
);
export const identifierTypeOptions = optionsFrom(IDENTIFIER_TYPE_VALUES, IDENTIFIER_TYPE_LABELS);
export const beneficialInterestNatureOptions = optionsFrom(
  BENEFICIAL_INTEREST_NATURE_VALUES,
  BENEFICIAL_INTEREST_NATURE_LABELS,
);
export const promoterTypeOptions = optionsFrom(PROMOTER_TYPE_VALUES, PROMOTER_TYPE_LABELS);
export const promoterStatusBasisOptions = optionsFrom(
  PROMOTER_STATUS_BASIS_VALUES,
  PROMOTER_STATUS_BASIS_LABELS,
);
export const promoterGroupRelationshipOptions = optionsFrom(
  PROMOTER_GROUP_RELATIONSHIP_VALUES,
  PROMOTER_GROUP_RELATIONSHIP_LABELS,
);
export const promoterGroupBasisOptions = optionsFrom(
  PROMOTER_GROUP_BASIS_VALUES,
  PROMOTER_GROUP_BASIS_LABELS,
);
export const controlArrangementTypeOptions = optionsFrom(
  CONTROL_ARRANGEMENT_TYPE_VALUES,
  CONTROL_ARRANGEMENT_TYPE_LABELS,
);
export const lockInPeriodOptions = optionsFrom(LOCK_IN_PERIOD_VALUES, LOCK_IN_PERIOD_LABELS);
export const contributionAcquisitionModeOptions = optionsFrom(
  CONTRIBUTION_ACQUISITION_MODE_VALUES,
  CONTRIBUTION_ACQUISITION_MODE_LABELS,
);
export const encumbranceTypeOptions = optionsFrom(
  ENCUMBRANCE_TYPE_VALUES,
  ENCUMBRANCE_TYPE_LABELS,
);
export const outstandingInstrumentTypeOptions = optionsFrom(
  OUTSTANDING_INSTRUMENT_TYPE_VALUES,
  OUTSTANDING_INSTRUMENT_TYPE_LABELS,
);
export const instrumentHolderCategoryOptions = optionsFrom(
  INSTRUMENT_HOLDER_CATEGORY_VALUES,
  INSTRUMENT_HOLDER_CATEGORY_LABELS,
);
export const transactionTypeOptions = optionsFrom(
  TRANSACTION_TYPE_VALUES,
  TRANSACTION_TYPE_LABELS,
);

/* -------------------------------------------------------------------------- */
/* Confirmation checkboxes                                                     */
/* -------------------------------------------------------------------------- */

export const CAPITAL_OWNERSHIP_CONFIRMATION_FIELDS = [
  {
    key: 'capitalStructureFiguresMatchStatutoryRegisters',
    label: 'Capital structure figures match the statutory registers and MCA records',
  },
  {
    key: 'shareCapitalHistoryIsComplete',
    label: 'Share capital history is complete for the period covered',
  },
  {
    key: 'shareholdingDetailsAreCurrentAsOnStatedDate',
    label: 'Shareholding details are current as on the stated date',
  },
  {
    key: 'promoterAndPromoterGroupIdentificationIsComplete',
    label: 'Promoter and promoter group identification is complete',
  },
  {
    key: 'allOutstandingConvertibleInstrumentsDisclosed',
    label: 'All outstanding convertible instruments and options are disclosed',
  },
  {
    key: 'allEncumbrancesOnPromoterSharesDisclosed',
    label: 'All encumbrances on promoter shares are disclosed',
  },
  {
    key: 'noUndisclosedShareholderAgreementsOrControlArrangements',
    label: 'There are no undisclosed shareholder agreements or control arrangements',
  },
  {
    key: 'offerForSaleSharesAreWithinExistingHoldings',
    label: 'Offer-for-sale shares are within the existing holdings of each selling shareholder',
  },
  {
    key: 'missingAnswersMustNotBeInterpretedAsNegative',
    label: 'Missing answers must not be interpreted as negative declarations',
  },
  {
    key: 'computedFiguresAreIndicativeOnly',
    label: 'Computed capital and ownership figures are indicative only',
  },
  {
    key: 'professionalAndRegistrarConfirmationRemainRequired',
    label: 'Professional, registrar and depository confirmation remain required',
  },
] as const;

/** Ternary questions whose "yes" answer requires supporting free-text detail. */
export const CAPITAL_OWNERSHIP_DETAIL_TRIGGERS = [
  { section: 'current-capital-structure', key: 'partlyPaidSharesOutstanding', detailKey: 'partlyPaidSharesDetails' },
  {
    section: 'current-capital-structure',
    key: 'sharesWithDifferentialVotingRightsExist',
    detailKey: 'differentialVotingRightsDetails',
  },
  { section: 'share-capital-history', key: 'anyPendingAllotments', detailKey: 'pendingAllotmentDetails' },
  {
    section: 'shareholders-beneficial-ownership',
    key: 'nomineeShareholdersExist',
    detailKey: 'nomineeShareholderDetails',
  },
  {
    section: 'promoters-and-control',
    key: 'anyPersonExercisingControlWithoutShareholding',
    detailKey: 'controlWithoutShareholdingDetails',
  },
  {
    section: 'promoters-and-control',
    key: 'changeInControlInLastThreeYears',
    detailKey: 'changeInControlDetails',
  },
  {
    section: 'promoter-contribution-lock-in',
    key: 'sharesIneligibleForContributionExist',
    detailKey: 'ineligibleSharesDetails',
  },
  {
    section: 'outstanding-securities-confirmations',
    key: 'anyPendingShareTransfers',
    detailKey: 'pendingShareTransferDetails',
  },
  {
    section: 'outstanding-securities-confirmations',
    key: 'anyDisputesOverTitleToShares',
    detailKey: 'titleDisputeDetails',
  },
] as const;
