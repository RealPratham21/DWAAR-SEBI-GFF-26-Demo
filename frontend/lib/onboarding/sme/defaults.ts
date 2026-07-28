import { INITIAL_DOCUMENT_CHECKLIST } from '@/lib/onboarding/sme/constants';
import type { SmeOnboardingData } from '@/lib/onboarding/sme/types';

export const emptyAlternateContact = {
  fullName: '',
  designation: '',
  email: '',
  mobile: '',
};

export const emptyRegisteredOffice = {
  addressLine1: '',
  addressLine2: '',
  locality: '',
  city: '',
  district: '',
  state: '',
  pinCode: '',
  country: 'India',
};

export const emptySmeOnboardingData: SmeOnboardingData = {
  roleAuthority: {
    designation: '',
    relationship: '',
    relationshipOther: '',
    authorisedSignatory: '',
    basisOfAuthority: '',
    basisOfAuthorityOther: '',
    primaryOnboardingContact: '',
    addAlternateContact: false,
    alternateContact: { ...emptyAlternateContact },
  },
  companyIdentity: {
    legalName: '',
    cin: '',
    incorporationDate: '',
    companyClass: '',
    registeredState: '',
    registrarOfCompanies: '',
    registeredOffice: { ...emptyRegisteredOffice },
    companyEmail: '',
    companyWebsite: '',
  },
  businessClassification: {
    primaryIndustry: '',
    primaryIndustryOther: '',
    businessSector: '',
    operationsDescription: '',
    pan: '',
    gstRegistrationRequired: '',
    gstRegistrations: [],
    udyamRegistration: '',
    importExportCode: '',
    employeeCountRange: '',
  },
  ownershipSnapshot: {
    promoterCount: '',
    directorCount: '',
    promoterHoldingPercent: '',
    nonPromoterHoldingPercent: '',
    institutionalShareholdersPresent: '',
    foreignShareholdersPresent: '',
    promoterGroupEntitiesPresent: '',
  },
  ipoIntent: {
    proposedIssueType: '',
    issueSizeCrore: '',
    issueSizeNotDecided: false,
    targetTimeline: '',
    intendedExchange: '',
    primaryPurposes: [],
    primaryPurposeOther: '',
    merchantBankerAppointed: '',
    merchantBankerName: '',
    preparationStage: '',
  },
  initialDocuments: {
    selections: Object.fromEntries(
      INITIAL_DOCUMENT_CHECKLIST.map((item) => [item.id, null]),
    ),
    skippedForNow: false,
  },
  submissionConfirmations: {
    confirmAccuracy: false,
    confirmAuthorised: false,
    confirmVerification: false,
    agreeTerms: false,
  },
};

export function createEmptySmeOnboardingData(): SmeOnboardingData {
  return structuredClone(emptySmeOnboardingData);
}
