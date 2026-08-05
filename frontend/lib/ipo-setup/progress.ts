import { ELIGIBILITY_DECLARATION_FIELDS } from '@/lib/ipo-setup/options';
import { offerTypeFlags } from '@/lib/ipo-setup/offer-compute';
import type {
  IpoSetupPayload,
  IpoSetupProgress,
  IpoSetupSectionId,
  SectionStatus,
} from '@/lib/ipo-setup/types';
import type { DeclarationDetail, EligibilityDeclarations } from '@/lib/schemas/ipo-setup';

function filled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value === 'boolean') return value;
  return true;
}

function detailsComplete(details: DeclarationDetail[]): boolean {
  if (details.length === 0) return false;
  return details.every(
    (detail) =>
      filled(detail.personOrEntityInvolved) &&
      filled(detail.authorityOrForum) &&
      filled(detail.currentStatus) &&
      filled(detail.explanation),
  );
}

function declarationSectionStatus(declarations: EligibilityDeclarations): SectionStatus {
  let answered = 0;
  let incompleteYes = false;
  for (const field of ELIGIBILITY_DECLARATION_FIELDS) {
    const answer = declarations[field.key];
    if (!filled(answer)) continue;
    answered += 1;
    if (answer === 'yes') {
      const details = declarations[field.detailsKey] as DeclarationDetail[];
      if (!detailsComplete(details)) incompleteYes = true;
    }
  }
  if (answered === 0) return 'not_started';
  if (answered < ELIGIBILITY_DECLARATION_FIELDS.length || incompleteYes) return 'in_progress';
  return 'complete';
}

export function evaluateIpoDirectionStatus(payload: IpoSetupPayload): SectionStatus {
  const d = payload.ipoDirection;
  const core = [
    d.preparationStage,
    d.targetSmePlatform,
    d.eligibilityProfile,
    d.proposedOfferType,
    d.proposedPricingMethod,
    d.publicCompanyConversionStatus,
  ];
  const any = core.some(filled) || filled(d.targetFilingQuarter) || filled(d.targetFilingFinancialYear);
  if (!any) return 'not_started';

  const coreComplete = core.every(filled);
  const conversion = d.publicCompanyConversionStatus;
  let conversionOk = true;
  if (conversion === 'in-progress') {
    conversionOk = filled(d.proposedConversionDate);
  } else if (conversion === 'completed') {
    conversionOk =
      filled(d.actualConversionDate) &&
      filled(d.freshCertificateOfIncorporationAvailable);
  }

  return coreComplete && conversionOk ? 'complete' : 'in_progress';
}

export function evaluateOfferStructureStatus(payload: IpoSetupPayload): SectionStatus {
  const o = payload.offerStructure;
  const offerType = payload.ipoDirection.proposedOfferType;
  const { includesFreshIssue, includesOfs } = offerTypeFlags(offerType);

  const base = [
    o.faceValuePerEquityShare,
    o.existingIssuedEquityShares,
    o.existingPaidUpEquityShareCapital,
    o.proposedIssuePriceStatus,
  ];
  const anyBase = base.some(filled);
  if (!anyBase && !filled(o.proposedFreshIssueShares) && !filled(o.proposedOfsShares)) {
    return 'not_started';
  }

  let complete = base.every(filled) && filled(offerType) && offerType !== 'undecided';
  if (o.proposedIssuePriceStatus === 'indicative' || o.proposedIssuePriceStatus === 'finalised-internally') {
    complete = complete && filled(o.proposedIssuePrice);
  }
  if (includesFreshIssue) {
    complete =
      complete &&
      filled(o.proposedFreshIssueShares) &&
      filled(o.proposedFreshIssueAmount) &&
      filled(o.preIpoPlacementBeingConsidered);
  }
  if (includesOfs) {
    complete =
      complete &&
      filled(o.proposedOfsShares) &&
      filled(o.proposedOfsAmount) &&
      filled(o.numberOfSellingShareholders) &&
      filled(o.sellerConsentsObtained);
  }
  return complete ? 'complete' : 'in_progress';
}

export function evaluateTrackRecordStatus(payload: IpoSetupPayload): SectionStatus {
  const t = payload.trackRecordAndFinancialEligibility;
  if (!filled(t.operatingTrackRecordBasis)) return 'not_started';

  const needsEntity =
    t.operatingTrackRecordBasis !== 'issuer-company' &&
    t.operatingTrackRecordBasis !== 'not-yet-established' &&
    t.operatingTrackRecordBasis !== '';

  let complete =
    filled(t.threeCompleteFinancialYearsAvailable) &&
    filled(t.auditedRecordsAvailable) &&
    t.financialYears.length >= 3 &&
    t.financialYears.every(
      (row) =>
        filled(row.financialYearEnding) &&
        filled(row.auditedStatus) &&
        filled(row.sourceType),
    );

  if (needsEntity) {
    complete =
      complete &&
      filled(t.trackRecordEntityName) &&
      filled(t.sameLineOfBusiness) &&
      filled(t.relationshipToIssuer);
  }

  if (t.modifiedAuditOpinionRelevantToEligibility === 'yes') {
    complete = complete && filled(t.modifiedAuditOpinionExplanation);
  }

  return complete ? 'complete' : 'in_progress';
}

export function evaluateProcessReadinessStatus(payload: IpoSetupPayload): SectionStatus {
  const p = payload.processReadiness;
  const keys: Array<keyof typeof p> = [
    'boardApprovalStatus',
    'shareholderApprovalStatus',
    'existingSharesFullyDematerialised',
    'isinAllotted',
    'leadManagerAppointmentStatus',
    'registrarAppointmentStatus',
    'inPrincipleApplicationStatus',
  ];
  const answered = keys.filter((key) => filled(p[key])).length;
  if (answered === 0) return 'not_started';
  return answered === keys.length ? 'complete' : 'in_progress';
}

export function evaluateIssuerConfirmationsStatus(payload: IpoSetupPayload): SectionStatus {
  const c = payload.issuerConfirmations;
  const values = Object.values(c);
  const checked = values.filter(Boolean).length;
  if (checked === 0) return 'not_started';
  return checked === values.length ? 'complete' : 'in_progress';
}

export function calculateIpoSetupProgress(payload: IpoSetupPayload): IpoSetupProgress {
  const sections: Record<IpoSetupSectionId, SectionStatus> = {
    'ipo-direction': evaluateIpoDirectionStatus(payload),
    'offer-structure': evaluateOfferStructureStatus(payload),
    'track-record-financial': evaluateTrackRecordStatus(payload),
    'eligibility-declarations': declarationSectionStatus(payload.eligibilityDeclarations),
    'process-readiness': evaluateProcessReadinessStatus(payload),
    'issuer-confirmations': evaluateIssuerConfirmationsStatus(payload),
  };
  const statuses = Object.values(sections);
  const sectionsComplete = statuses.filter((status) => status === 'complete').length;
  const totalSections = statuses.length;
  let overallStatus: SectionStatus = 'not_started';
  if (sectionsComplete === totalSections) overallStatus = 'complete';
  else if (statuses.some((status) => status !== 'not_started')) overallStatus = 'in_progress';

  return { sections, sectionsComplete, totalSections, overallStatus };
}

export function listMissingRequiredResponses(payload: IpoSetupPayload): string[] {
  const missing: string[] = [];
  const progress = calculateIpoSetupProgress(payload);
  const labels: Record<IpoSetupSectionId, string> = {
    'ipo-direction': 'IPO Direction',
    'offer-structure': 'Proposed Offer Structure',
    'track-record-financial': 'Track Record & Financial Eligibility',
    'eligibility-declarations': 'Eligibility Declarations',
    'process-readiness': 'Process Readiness',
    'issuer-confirmations': 'Issuer Confirmations',
  };
  for (const [id, status] of Object.entries(progress.sections) as Array<
    [IpoSetupSectionId, SectionStatus]
  >) {
    if (status !== 'complete') {
      missing.push(`${labels[id]} incomplete`);
    }
  }
  return missing;
}
