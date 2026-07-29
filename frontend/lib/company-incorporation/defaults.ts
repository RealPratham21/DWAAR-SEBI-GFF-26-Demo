import type { CompanyIdentityInput } from '@/lib/schemas/company-incorporation';
import type { ConstitutionalRecordInput } from '@/lib/schemas/company-incorporation';
import type {
  CompanyRegistration,
  ConstitutionalAmendment,
  CorporateEvent,
  OfficeAddress,
} from '@/lib/schemas/company-incorporation';

export const emptyCompanyIncorporationFormData = {
  identity: {
    legalName: '',
    shortName: '',
    cin: '',
    registrationNumber: '',
    incorporationDate: '',
    incorporationCity: '',
    incorporationState: '',
    registrarOfCompanies: '',
    companyClass: '',
    companyCategory: '',
    companySubCategory: '',
    specialCompanyType: 'none',
    companyStatus: '',
    listedStatus: '',
    commencementDate: '',
    governingAct: '',
    website: '',
    email: '',
    telephone: '',
    issuerContactPersonId: '',
  } satisfies CompanyIdentityInput,
  corporateEvents: [] as CorporateEvent[],
  offices: [] as OfficeAddress[],
  constitutionalRecord: {
    moaVersionDate: '',
    aoaVersionDate: '',
    moaCertifiedCopyStatus: '',
    aoaCertifiedCopyStatus: '',
    mainObjectClauseNumbers: [],
    mainObjectText: '',
    latestMoaAmendmentDate: '',
    latestAoaAmendmentDate: '',
    operationsAlignmentStatus: '',
    legalReviewStatus: '',
  } satisfies ConstitutionalRecordInput,
  constitutionalAmendments: [] as ConstitutionalAmendment[],
  registrations: [] as CompanyRegistration[],
  confirmations: {
    allFormerNamesDisclosed: false,
    allCompanyClassChangesDisclosed: false,
    allRegisteredOfficeChangesDisclosed: false,
    currentMoaWillBeProvided: false,
    currentAoaWillBeProvided: false,
    mainObjectsReflectCurrentBusiness: false,
    registrationsUseCurrentLegalName: false,
    noMaterialCorporateEventOmitted: false,
    authorisedRepresentativeDeclaration: false,
  },
};

export type CompanyIncorporationSessionData = typeof emptyCompanyIncorporationFormData;

export const SESSION_SAVE_MESSAGE = 'Changes saved successfully.';

export function createRecordId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `record-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function sortByDateDesc<T extends { effectiveDate?: string; amendmentDate?: string }>(
  records: T[],
  dateKey: 'effectiveDate' | 'amendmentDate',
) {
  return [...records].sort((left, right) => {
    const leftDate = left[dateKey] ?? '';
    const rightDate = right[dateKey] ?? '';
    return rightDate.localeCompare(leftDate);
  });
}

function getCorporateEventSortDate(event: CorporateEvent): string {
  return (
    event.effectiveDate ??
    event.certificateOrOrderDate ??
    event.filingDate ??
    event.shareholderResolutionDate ??
    event.boardResolutionDate ??
    ''
  );
}

export function sortCorporateEvents(events: CorporateEvent[]) {
  return [...events].sort((left, right) => {
    const leftDate = getCorporateEventSortDate(left);
    const rightDate = getCorporateEventSortDate(right);
    if (!leftDate && !rightDate) return 0;
    if (!leftDate) return 1;
    if (!rightDate) return -1;
    return leftDate.localeCompare(rightDate);
  });
}
