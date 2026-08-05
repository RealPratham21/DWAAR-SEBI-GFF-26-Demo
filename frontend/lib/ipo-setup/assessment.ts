/**
 * Deterministic preliminary eligibility assessment (frontend-only).
 * Keep rules here so I2 can mirror them on the backend.
 */

import { computeOfferFromPayload } from '@/lib/ipo-setup/offer-compute';
import { ELIGIBILITY_DECLARATION_FIELDS } from '@/lib/ipo-setup/options';
import { calculateIpoSetupProgress } from '@/lib/ipo-setup/progress';
import type { IpoSetupPayload } from '@/lib/schemas/ipo-setup';

export const CRITERION_STATES = [
  'appears_satisfied',
  'potential_concern',
  'missing_information',
  'pending_supporting_document',
  'pending_linked_workstream',
  'not_applicable',
  'professional_confirmation_required',
] as const;

export type CriterionState = (typeof CRITERION_STATES)[number];

export const ASSESSMENT_RESULT_STATES = [
  'insufficient_information',
  'preliminary_criteria_appear_satisfied',
  'eligibility_concerns_identified',
  'professional_assessment_required',
] as const;

export type AssessmentResultState = (typeof ASSESSMENT_RESULT_STATES)[number];

export type AssessmentCriterion = {
  id: string;
  group:
    | 'issuer_eligibility'
    | 'financial_eligibility'
    | 'offer_eligibility'
    | 'legal_disqualification'
    | 'process_readiness';
  label: string;
  state: CriterionState;
  reason: string;
};

export type EligibilityAssessment = {
  result: AssessmentResultState;
  resultLabel: string;
  summary: string;
  criteria: AssessmentCriterion[];
  metrics: {
    proposedPostIssuePaidUpCapital: number | null;
    ofsPercentageOfOffer: number | null;
    yearsMeetingOperatingProfitThreshold: number;
    positiveNetWorthAvailable: boolean | null;
    yearsWithPositiveFcfe: number;
    threeYearTrackRecordEstablished: boolean | null;
    publicCompanyConversionStatus: string;
    unresolvedAdverseDeclarations: number;
  };
};

const OPERATING_PROFIT_THRESHOLD = 1_00_00_000; // ₹1 crore — indicative SME screen only

function labelForResult(result: AssessmentResultState): string {
  switch (result) {
    case 'insufficient_information':
      return 'Insufficient information';
    case 'preliminary_criteria_appear_satisfied':
      return 'Preliminary criteria appear satisfied';
    case 'eligibility_concerns_identified':
      return 'Eligibility concerns identified';
    case 'professional_assessment_required':
      return 'Professional assessment required';
    default:
      return 'Insufficient information';
  }
}

export function assessIpoEligibility(payload: IpoSetupPayload): EligibilityAssessment {
  const offer = computeOfferFromPayload(payload);
  const progress = calculateIpoSetupProgress(payload);
  const track = payload.trackRecordAndFinancialEligibility;
  const direction = payload.ipoDirection;
  const declarations = payload.eligibilityDeclarations;
  const process = payload.processReadiness;

  const yearsMeetingOperatingProfitThreshold = track.financialYears.filter(
    (row) =>
      typeof row.operatingProfitFromOperations === 'number' &&
      row.operatingProfitFromOperations >= OPERATING_PROFIT_THRESHOLD,
  ).length;

  const yearsWithPositiveFcfe = track.financialYears.filter(
    (row) => typeof row.freeCashFlowToEquity === 'number' && row.freeCashFlowToEquity > 0,
  ).length;

  const netWorthValues = track.financialYears
    .map((row) => row.netWorth)
    .filter((value): value is number => typeof value === 'number');
  const positiveNetWorthAvailable =
    netWorthValues.length === 0 ? null : netWorthValues.some((value) => value > 0);

  const threeYearTrackRecordEstablished =
    track.operatingTrackRecordBasis === ''
      ? null
      : track.operatingTrackRecordBasis === 'not-yet-established'
        ? false
        : track.threeCompleteFinancialYearsAvailable === 'yes';

  let unresolvedAdverseDeclarations = 0;
  for (const field of ELIGIBILITY_DECLARATION_FIELDS) {
    if (declarations[field.key] === 'yes') unresolvedAdverseDeclarations += 1;
  }

  const criteria: AssessmentCriterion[] = [];

  // Issuer eligibility
  if (!direction.publicCompanyConversionStatus) {
    criteria.push({
      id: 'public-company-status',
      group: 'issuer_eligibility',
      label: 'Public-company conversion status',
      state: 'missing_information',
      reason: 'Conversion status has not been provided.',
    });
  } else if (direction.publicCompanyConversionStatus === 'completed') {
    criteria.push({
      id: 'public-company-status',
      group: 'issuer_eligibility',
      label: 'Public-company conversion status',
      state: 'appears_satisfied',
      reason: 'Issuer reports conversion as completed.',
    });
  } else if (direction.publicCompanyConversionStatus === 'professional-confirmation-required') {
    criteria.push({
      id: 'public-company-status',
      group: 'issuer_eligibility',
      label: 'Public-company conversion status',
      state: 'professional_confirmation_required',
      reason: 'Conversion status requires professional confirmation.',
    });
  } else if (direction.referencedCompanyClass === 'public') {
    criteria.push({
      id: 'public-company-status',
      group: 'issuer_eligibility',
      label: 'Public-company conversion status',
      state: 'appears_satisfied',
      reason: 'Company & Incorporation currently records company class as public.',
    });
  } else {
    criteria.push({
      id: 'public-company-status',
      group: 'issuer_eligibility',
      label: 'Public-company conversion status',
      state: 'pending_linked_workstream',
      reason: `Conversion is ${direction.publicCompanyConversionStatus.replaceAll('-', ' ')}. Company class remains governed by Company & Incorporation.`,
    });
  }

  if (!direction.targetSmePlatform || direction.targetSmePlatform === 'undecided') {
    criteria.push({
      id: 'target-platform',
      group: 'issuer_eligibility',
      label: 'Target SME platform',
      state: 'missing_information',
      reason: 'Target platform is undecided or not provided.',
    });
  } else {
    criteria.push({
      id: 'target-platform',
      group: 'issuer_eligibility',
      label: 'Target SME platform',
      state: 'appears_satisfied',
      reason: `Target platform recorded as ${direction.targetSmePlatform}.`,
    });
  }

  // Financial
  if (track.operatingTrackRecordBasis === '') {
    criteria.push({
      id: 'track-record',
      group: 'financial_eligibility',
      label: 'Three-year operating track record',
      state: 'missing_information',
      reason: 'Track-record basis has not been selected.',
    });
  } else if (threeYearTrackRecordEstablished === false) {
    criteria.push({
      id: 'track-record',
      group: 'financial_eligibility',
      label: 'Three-year operating track record',
      state: 'potential_concern',
      reason: 'Track record is not yet established or three complete years are not available.',
    });
  } else if (track.threeCompleteFinancialYearsAvailable === 'not-sure') {
    criteria.push({
      id: 'track-record',
      group: 'financial_eligibility',
      label: 'Three-year operating track record',
      state: 'professional_confirmation_required',
      reason: 'Availability of three complete financial years is marked not sure.',
    });
  } else {
    criteria.push({
      id: 'track-record',
      group: 'financial_eligibility',
      label: 'Three-year operating track record',
      state: 'appears_satisfied',
      reason: 'Issuer indicates three complete financial years are available on the selected basis.',
    });
  }

  if (yearsMeetingOperatingProfitThreshold === 0 && track.financialYears.every((r) => r.operatingProfitFromOperations === null)) {
    criteria.push({
      id: 'operating-profit',
      group: 'financial_eligibility',
      label: 'Operating profit threshold years',
      state: 'missing_information',
      reason: 'Operating profit figures have not been entered for the three-year grid.',
    });
  } else if (yearsMeetingOperatingProfitThreshold >= 2) {
    criteria.push({
      id: 'operating-profit',
      group: 'financial_eligibility',
      label: 'Operating profit threshold years',
      state: 'appears_satisfied',
      reason: `${yearsMeetingOperatingProfitThreshold} year(s) meet the indicative ₹1 crore operating-profit screen.`,
    });
  } else {
    criteria.push({
      id: 'operating-profit',
      group: 'financial_eligibility',
      label: 'Operating profit threshold years',
      state: 'potential_concern',
      reason: `Only ${yearsMeetingOperatingProfitThreshold} year(s) meet the indicative ₹1 crore operating-profit screen.`,
    });
  }

  if (positiveNetWorthAvailable === null) {
    criteria.push({
      id: 'net-worth',
      group: 'financial_eligibility',
      label: 'Positive net worth',
      state: 'missing_information',
      reason: 'Net worth figures are not yet available in the financial grid.',
    });
  } else if (positiveNetWorthAvailable) {
    criteria.push({
      id: 'net-worth',
      group: 'financial_eligibility',
      label: 'Positive net worth',
      state: 'appears_satisfied',
      reason: 'At least one year shows positive net worth.',
    });
  } else {
    criteria.push({
      id: 'net-worth',
      group: 'financial_eligibility',
      label: 'Positive net worth',
      state: 'potential_concern',
      reason: 'Entered net worth figures are not positive.',
    });
  }

  criteria.push({
    id: 'fcfe',
    group: 'financial_eligibility',
    label: 'Positive free cash flow to equity',
    state:
      yearsWithPositiveFcfe === 0 &&
      track.financialYears.every((row) => row.freeCashFlowToEquity === null)
        ? 'missing_information'
        : yearsWithPositiveFcfe > 0
          ? 'appears_satisfied'
          : 'potential_concern',
    reason:
      yearsWithPositiveFcfe === 0 &&
      track.financialYears.every((row) => row.freeCashFlowToEquity === null)
        ? 'FCFE figures have not been entered.'
        : `${yearsWithPositiveFcfe} year(s) show positive FCFE.`,
  });

  const hasManagementEstimate = track.financialYears.some(
    (row) => row.sourceType === 'management-estimate',
  );
  if (hasManagementEstimate) {
    criteria.push({
      id: 'management-estimates',
      group: 'financial_eligibility',
      label: 'Management estimates',
      state: 'pending_supporting_document',
      reason: 'One or more years rely on management estimates pending documentary/professional confirmation.',
    });
  }

  if (track.auditorHasConfirmedEligibilityFigures === 'yes') {
    criteria.push({
      id: 'auditor-confirmation',
      group: 'financial_eligibility',
      label: 'Auditor confirmation of eligibility figures',
      state: 'appears_satisfied',
      reason: 'Issuer indicates the auditor has confirmed eligibility figures.',
    });
  } else if (track.auditorHasConfirmedEligibilityFigures === 'no') {
    criteria.push({
      id: 'auditor-confirmation',
      group: 'financial_eligibility',
      label: 'Auditor confirmation of eligibility figures',
      state: 'pending_supporting_document',
      reason: 'Auditor confirmation of eligibility figures is not yet obtained.',
    });
  } else {
    criteria.push({
      id: 'auditor-confirmation',
      group: 'financial_eligibility',
      label: 'Auditor confirmation of eligibility figures',
      state: 'missing_information',
      reason: 'Auditor confirmation status is unanswered (not treated as No).',
    });
  }

  // Offer
  if (offer.proposedPostIssuePaidUpCapital === null) {
    criteria.push({
      id: 'post-issue-capital',
      group: 'offer_eligibility',
      label: 'Proposed post-issue paid-up capital',
      state: 'missing_information',
      reason: 'Existing paid-up capital and/or fresh-issue inputs are incomplete.',
    });
  } else {
    criteria.push({
      id: 'post-issue-capital',
      group: 'offer_eligibility',
      label: 'Proposed post-issue paid-up capital',
      state: 'appears_satisfied',
      reason: 'Post-issue paid-up capital can be computed from current inputs. OFS does not increase paid-up capital.',
    });
  }

  if (!offer.includesOfs) {
    criteria.push({
      id: 'ofs-share',
      group: 'offer_eligibility',
      label: 'OFS percentage of total offer',
      state: 'not_applicable',
      reason: 'Proposed offer type does not include an offer for sale.',
    });
  } else if (offer.ofsPercentageOfOffer === null) {
    criteria.push({
      id: 'ofs-share',
      group: 'offer_eligibility',
      label: 'OFS percentage of total offer',
      state: 'missing_information',
      reason: 'OFS share counts are incomplete.',
    });
  } else {
    criteria.push({
      id: 'ofs-share',
      group: 'offer_eligibility',
      label: 'OFS percentage of total offer',
      state: 'appears_satisfied',
      reason: `OFS is ${offer.ofsPercentageOfOffer.toFixed(2)}% of total shares offered (indicative).`,
    });
  }

  // Legal / declarations
  const unansweredDeclarations = ELIGIBILITY_DECLARATION_FIELDS.filter(
    (field) => !declarations[field.key],
  ).length;
  if (unansweredDeclarations > 0) {
    criteria.push({
      id: 'declarations-completeness',
      group: 'legal_disqualification',
      label: 'Eligibility declarations completeness',
      state: 'missing_information',
      reason: `${unansweredDeclarations} declaration(s) remain unanswered. Unanswered is not treated as No.`,
    });
  } else {
    criteria.push({
      id: 'declarations-completeness',
      group: 'legal_disqualification',
      label: 'Eligibility declarations completeness',
      state: 'appears_satisfied',
      reason: 'All eligibility declarations have an explicit yes / no / not-sure response.',
    });
  }

  if (unresolvedAdverseDeclarations > 0) {
    criteria.push({
      id: 'adverse-declarations',
      group: 'legal_disqualification',
      label: 'Unresolved adverse declarations',
      state: 'potential_concern',
      reason: `${unresolvedAdverseDeclarations} declaration(s) answered Yes. Materiality is not decided automatically — professional review is required.`,
    });
  } else if (unansweredDeclarations === 0) {
    criteria.push({
      id: 'adverse-declarations',
      group: 'legal_disqualification',
      label: 'Unresolved adverse declarations',
      state: 'appears_satisfied',
      reason: 'No declaration is currently answered Yes.',
    });
  }

  const notSureDeclarations = ELIGIBILITY_DECLARATION_FIELDS.filter(
    (field) => declarations[field.key] === 'not-sure',
  ).length;
  if (notSureDeclarations > 0) {
    criteria.push({
      id: 'not-sure-declarations',
      group: 'legal_disqualification',
      label: 'Declarations marked not sure',
      state: 'professional_confirmation_required',
      reason: `${notSureDeclarations} declaration(s) are marked not sure and need professional follow-up.`,
    });
  }

  // Process
  if (!process.leadManagerAppointmentStatus || process.leadManagerAppointmentStatus === 'not-started') {
    criteria.push({
      id: 'lead-manager',
      group: 'process_readiness',
      label: 'Lead manager appointment',
      state: 'missing_information',
      reason: 'Lead manager appointment has not progressed.',
    });
  } else if (process.leadManagerAppointmentStatus === 'appointed') {
    criteria.push({
      id: 'lead-manager',
      group: 'process_readiness',
      label: 'Lead manager appointment',
      state: 'appears_satisfied',
      reason: 'Lead manager is marked appointed.',
    });
  } else {
    criteria.push({
      id: 'lead-manager',
      group: 'process_readiness',
      label: 'Lead manager appointment',
      state: 'pending_supporting_document',
      reason: `Lead manager status: ${process.leadManagerAppointmentStatus.replaceAll('-', ' ')}.`,
    });
  }

  if (progress.sections['issuer-confirmations'] !== 'complete') {
    criteria.push({
      id: 'issuer-confirmations',
      group: 'process_readiness',
      label: 'Issuer confirmations',
      state: 'missing_information',
      reason: 'Not all issuer confirmations are checked. Incomplete confirmations keep the assessment preliminary.',
    });
  } else {
    criteria.push({
      id: 'issuer-confirmations',
      group: 'process_readiness',
      label: 'Issuer confirmations',
      state: 'appears_satisfied',
      reason: 'All issuer confirmations are acknowledged.',
    });
  }

  const states = criteria.map((item) => item.state);
  const hasConcern = states.includes('potential_concern');
  const hasProfessional = states.includes('professional_confirmation_required');
  const missingCount = states.filter(
    (state) =>
      state === 'missing_information' ||
      state === 'pending_supporting_document' ||
      state === 'pending_linked_workstream',
  ).length;

  let result: AssessmentResultState = 'preliminary_criteria_appear_satisfied';
  if (hasConcern) result = 'eligibility_concerns_identified';
  else if (hasProfessional) result = 'professional_assessment_required';
  else if (missingCount >= 3 || progress.sectionsComplete < 2) {
    result = 'insufficient_information';
  }

  return {
    result,
    resultLabel: labelForResult(result),
    summary:
      result === 'insufficient_information'
        ? 'Too many required inputs remain unanswered for a meaningful preliminary view.'
        : result === 'eligibility_concerns_identified'
          ? 'One or more potential concerns were identified. This is not a final eligibility decision.'
          : result === 'professional_assessment_required'
            ? 'Inputs require professional or exchange confirmation before reliance.'
            : 'Based on currently entered values, preliminary criteria appear satisfied. Professional confirmation remains required.',
    criteria,
    metrics: {
      proposedPostIssuePaidUpCapital: offer.proposedPostIssuePaidUpCapital,
      ofsPercentageOfOffer: offer.ofsPercentageOfOffer,
      yearsMeetingOperatingProfitThreshold,
      positiveNetWorthAvailable,
      yearsWithPositiveFcfe,
      threeYearTrackRecordEstablished,
      publicCompanyConversionStatus: direction.publicCompanyConversionStatus || 'not provided',
      unresolvedAdverseDeclarations,
    },
  };
}
