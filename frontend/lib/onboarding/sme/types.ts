/** Future-facing API contracts — not invoked in this phase. */
export interface StartSmeOnboardingRequest {
  userId: string;
}

export interface SmeOnboardingDraftResponse {
  draftId: string;
  currentStep: number;
  completedSteps: number[];
  data: SmeOnboardingData;
}

export interface SaveRepresentativeStepRequest {
  draftId: string;
  data: RoleAuthorityStepData;
}

export interface SaveCompanyStepRequest {
  draftId: string;
  data: CompanyIdentityStepData;
}

export interface SaveClassificationStepRequest {
  draftId: string;
  data: BusinessClassificationStepData;
}

export interface SaveOwnershipStepRequest {
  draftId: string;
  data: OwnershipSnapshotStepData;
}

export interface SaveIpoIntentStepRequest {
  draftId: string;
  data: IpoIntentStepData;
}

export interface SubmitSmeOnboardingRequest {
  draftId: string;
  confirmations: SubmissionConfirmations;
}

export interface SubmitSmeOnboardingResponse {
  issuerId: string;
  projectId: string;
}

export interface AlternateContact {
  fullName: string;
  designation: string;
  email: string;
  mobile: string;
}

export interface GstRegistrationEntry {
  id: string;
  gstin: string;
  state: string;
  principalPlaceOfBusiness: string;
}

export interface DocumentSelectionMeta {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface RoleAuthorityStepData {
  designation: string;
  relationship: string;
  relationshipOther: string;
  authorisedSignatory: string;
  basisOfAuthority: string;
  basisOfAuthorityOther: string;
  primaryOnboardingContact: string;
  addAlternateContact: boolean;
  alternateContact: AlternateContact;
}

export interface RegisteredOfficeAddress {
  addressLine1: string;
  addressLine2: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  country: string;
}

export interface CompanyIdentityStepData {
  legalName: string;
  cin: string;
  incorporationDate: string;
  companyClass: string;
  registeredState: string;
  registrarOfCompanies: string;
  registeredOffice: RegisteredOfficeAddress;
  companyEmail: string;
  companyWebsite: string;
}

export interface BusinessClassificationStepData {
  primaryIndustry: string;
  primaryIndustryOther: string;
  businessSector: string;
  operationsDescription: string;
  pan: string;
  gstRegistrationRequired: string;
  gstRegistrations: GstRegistrationEntry[];
  udyamRegistration: string;
  importExportCode: string;
  employeeCountRange: string;
}

export interface OwnershipSnapshotStepData {
  promoterCount: string;
  directorCount: string;
  promoterHoldingPercent: string;
  nonPromoterHoldingPercent: string;
  institutionalShareholdersPresent: string;
  foreignShareholdersPresent: string;
  promoterGroupEntitiesPresent: string;
}

export interface IpoIntentStepData {
  proposedIssueType: string;
  issueSizeCrore: string;
  issueSizeNotDecided: boolean;
  targetTimeline: string;
  intendedExchange: string;
  primaryPurposes: string[];
  primaryPurposeOther: string;
  merchantBankerAppointed: string;
  merchantBankerName: string;
  preparationStage: string;
}

export interface InitialDocumentsStepData {
  selections: Record<string, DocumentSelectionMeta | null>;
  skippedForNow: boolean;
}

export interface SubmissionConfirmations {
  confirmAccuracy: boolean;
  confirmAuthorised: boolean;
  confirmVerification: boolean;
  agreeTerms: boolean;
}

export interface SmeOnboardingData {
  roleAuthority: RoleAuthorityStepData;
  companyIdentity: CompanyIdentityStepData;
  businessClassification: BusinessClassificationStepData;
  ownershipSnapshot: OwnershipSnapshotStepData;
  ipoIntent: IpoIntentStepData;
  initialDocuments: InitialDocumentsStepData;
  submissionConfirmations: SubmissionConfirmations;
}

export type SmeOnboardingStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7;
