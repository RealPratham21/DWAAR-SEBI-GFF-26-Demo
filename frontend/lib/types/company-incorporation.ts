import {
  CERTIFIED_COPY_STATUS_VALUES,
  COMPANY_CATEGORY_VALUES,
  COMPANY_CLASS_VALUES,
  COMPANY_STATUS_VALUES,
  COMPANY_SUB_CATEGORY_VALUES,
  CONSTITUTIONAL_DOCUMENT_TYPE_VALUES,
  CORPORATE_EVENT_STATUS_VALUES,
  CORPORATE_EVENT_TYPE_VALUES,
  GOVERNING_ACT_VALUES,
  INDIAN_STATES_AND_UTS,
  LEGAL_REVIEW_STATUS_VALUES,
  LISTED_STATUS_VALUES,
  OCCUPANCY_TYPE_VALUES,
  OFFICE_TYPE_VALUES,
  OPERATIONS_ALIGNMENT_STATUS_VALUES,
  REGISTRAR_OF_COMPANIES_OPTIONS,
  REGISTRATION_STATUS_VALUES,
  REGISTRATION_TYPE_VALUES,
  SPECIAL_COMPANY_TYPE_VALUES,
  UPDATE_TRACKING_STATUS_VALUES,
  type CertifiedCopyStatus,
  type CompanyCategory,
  type CompanyClass,
  type CompanyIdentity,
  type CompanyIncorporationFormData,
  type CompanyRegistration,
  type CompanyStatus,
  type CompanySubCategory,
  type ConstitutionalAmendment,
  type ConstitutionalDocumentType,
  type ConstitutionalRecord,
  type CorporateEvent,
  type CorporateEventStatus,
  type CorporateEventType,
  type GoverningAct,
  type IssuerConfirmation,
  type LegalReviewStatus,
  type ListedStatus,
  type OccupancyType,
  type OfficeAddress,
  type OfficeType,
  type OperationsAlignmentStatus,
  type RegistrationStatus,
  type RegistrationType,
  type SpecialCompanyType,
  type UpdateTrackingStatus,
} from '@/lib/schemas/company-incorporation';

export type {
  CertifiedCopyStatus,
  CompanyCategory,
  CompanyClass,
  CompanyIdentity,
  CompanyIncorporationFormData,
  CompanyRegistration,
  CompanyStatus,
  CompanySubCategory,
  ConstitutionalAmendment,
  ConstitutionalDocumentType,
  ConstitutionalRecord,
  CorporateEvent,
  CorporateEventStatus,
  CorporateEventType,
  GoverningAct,
  IssuerConfirmation,
  LegalReviewStatus,
  ListedStatus,
  OccupancyType,
  OfficeAddress,
  OfficeType,
  OperationsAlignmentStatus,
  RegistrationStatus,
  RegistrationType,
  SpecialCompanyType,
  UpdateTrackingStatus,
};

export {
  CERTIFIED_COPY_STATUS_VALUES,
  COMPANY_CATEGORY_VALUES,
  COMPANY_CLASS_VALUES,
  COMPANY_STATUS_VALUES,
  COMPANY_SUB_CATEGORY_VALUES,
  CONSTITUTIONAL_DOCUMENT_TYPE_VALUES,
  CORPORATE_EVENT_STATUS_VALUES,
  CORPORATE_EVENT_TYPE_VALUES,
  GOVERNING_ACT_VALUES,
  INDIAN_STATES_AND_UTS,
  LEGAL_REVIEW_STATUS_VALUES,
  LISTED_STATUS_VALUES,
  OCCUPANCY_TYPE_VALUES,
  OFFICE_TYPE_VALUES,
  OPERATIONS_ALIGNMENT_STATUS_VALUES,
  REGISTRAR_OF_COMPANIES_OPTIONS,
  REGISTRATION_STATUS_VALUES,
  REGISTRATION_TYPE_VALUES,
  SPECIAL_COMPANY_TYPE_VALUES,
  UPDATE_TRACKING_STATUS_VALUES,
};

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

function toSelectOptions<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): SelectOption<T>[] {
  return values.map((value) => ({
    value,
    label: labels[value],
  }));
}

export const CORPORATE_EVENT_TYPE_LABELS: Record<CorporateEventType, string> = {
  'original-incorporation': 'Original Incorporation',
  'name-change': 'Name Change',
  'private-to-public-conversion': 'Private-to-Public Conversion',
  'public-to-private-conversion': 'Public-to-Private Conversion',
  'company-class-change': 'Company Class Change',
  'registered-office-change': 'Registered Office Change',
  'registered-office-state-change': 'Registered Office State Change',
  'roc-jurisdiction-change': 'RoC Jurisdiction Change',
  'moa-amendment': 'MoA Amendment',
  'main-object-amendment': 'Main Object Amendment',
  'aoa-amendment': 'AoA Amendment',
  'merger-amalgamation': 'Merger or Amalgamation',
  demerger: 'Demerger',
  'acquisition-transfer-undertaking': 'Acquisition or Transfer of Undertaking',
  'succession-of-business': 'Succession of Earlier Business',
  'other-material-event': 'Other Material Corporate Event',
};

export const CORPORATE_EVENT_STATUS_LABELS: Record<CorporateEventStatus, string> = {
  planned: 'Planned',
  'resolution-passed': 'Resolution Passed',
  filed: 'Filed',
  approved: 'Approved',
  effective: 'Effective',
};

export const OFFICE_TYPE_LABELS: Record<OfficeType, string> = {
  'registered-office': 'Registered Office',
  'corporate-office': 'Corporate Office',
  'administrative-office': 'Administrative Office',
  'communication-office': 'Communication Office',
  'previous-registered-office': 'Previous Registered Office',
};

export const OCCUPANCY_TYPE_LABELS: Record<OccupancyType, string> = {
  owned: 'Owned',
  leased: 'Leased',
  licensed: 'Licensed',
  other: 'Other',
};

export const REGISTRATION_TYPE_LABELS: Record<RegistrationType, string> = {
  pan: 'PAN',
  tan: 'TAN',
  gstin: 'GSTIN',
  udyam: 'Udyam Registration',
  iec: 'Import Export Code',
  other: 'Other Fundamental Registration',
};

export const CONSTITUTIONAL_DOCUMENT_TYPE_LABELS: Record<
  ConstitutionalDocumentType,
  string
> = {
  moa: 'MoA',
  aoa: 'AoA',
};

/** Short labels for select dropdowns. */
export const COMPANY_CLASS_LABELS: Record<CompanyClass, string> = {
  public: 'Public',
  private: 'Private',
};

/** Labels used when composing the classification summary sentence. */
export const COMPANY_CLASS_SUMMARY_LABELS: Record<CompanyClass, string> = {
  public: 'Public',
  private: 'Private',
};

export const COMPANY_CATEGORY_LABELS: Record<CompanyCategory, string> = {
  'company-limited-by-shares': 'Company Limited by Shares',
  'company-limited-by-guarantee': 'Company Limited by Guarantee',
  'unlimited-company': 'Unlimited Company',
};

export const COMPANY_SUB_CATEGORY_LABELS: Record<CompanySubCategory, string> = {
  'non-government-company': 'Non-Government Company',
  'union-government-company': 'Union Government Company',
  'state-government-company': 'State Government Company',
  'subsidiary-of-foreign-company': 'Subsidiary of Foreign Company',
  other: 'Other',
};

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  active: 'Active',
  dormant: 'Dormant',
  'under-process-of-striking-off': 'Under Process of Striking Off',
  'struck-off': 'Struck Off',
  amalgamated: 'Amalgamated',
  'under-liquidation': 'Under Liquidation',
  liquidated: 'Liquidated',
  other: 'Other',
};

export const GOVERNING_ACT_LABELS: Record<GoverningAct, string> = {
  'companies-act-2013': 'Companies Act, 2013',
  'companies-act-1956': 'Companies Act, 1956',
  'companies-act-1913': 'Companies Act, 1913',
  'other-predecessor-legislation': 'Other / Predecessor Legislation',
};

export const SPECIAL_COMPANY_TYPE_LABELS: Record<SpecialCompanyType, string> = {
  none: 'None',
  'one-person-company': 'One Person Company',
  'section-8-company': 'Section 8 Company',
  'producer-company': 'Producer Company',
  'nidhi-company': 'Nidhi Company',
  other: 'Other',
};

export const LISTED_STATUS_LABELS: Record<ListedStatus, string> = {
  listed: 'Listed',
  unlisted: 'Unlisted',
  delisted: 'Delisted',
  'not-applicable': 'Not applicable',
};

export const CERTIFIED_COPY_STATUS_LABELS: Record<CertifiedCopyStatus, string> = {
  'not-available': 'Not Available',
  available: 'Available',
  'pending-verification': 'Pending Verification',
  verified: 'Verified',
};

export const OPERATIONS_ALIGNMENT_STATUS_LABELS: Record<OperationsAlignmentStatus, string> = {
  yes: 'Yes',
  no: 'No',
  'requires-legal-review': 'Requires Legal Review',
};

export const LEGAL_REVIEW_STATUS_LABELS: Record<LegalReviewStatus, string> = {
  'not-requested': 'Not Requested',
  pending: 'Pending',
  'under-review': 'Under Review',
  reviewed: 'Reviewed',
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  'amendment-pending': 'Amendment Pending',
  cancelled: 'Cancelled',
  unknown: 'Unknown',
};

export const UPDATE_TRACKING_STATUS_LABELS: Record<UpdateTrackingStatus, string> = {
  yes: 'Yes',
  no: 'No',
  'not-applicable': 'Not Applicable',
  unknown: 'Unknown',
};

export const indianStateOptions = INDIAN_STATES_AND_UTS.map((state) => ({
  value: state,
  label: state,
}));

export const registrarOfCompaniesOptions = REGISTRAR_OF_COMPANIES_OPTIONS.map((roc) => ({
  value: roc,
  label: roc,
}));

export const corporateEventTypeOptions = toSelectOptions(
  CORPORATE_EVENT_TYPE_VALUES,
  CORPORATE_EVENT_TYPE_LABELS,
);

export const corporateEventStatusOptions = toSelectOptions(
  CORPORATE_EVENT_STATUS_VALUES,
  CORPORATE_EVENT_STATUS_LABELS,
);

export const officeTypeOptions = toSelectOptions(OFFICE_TYPE_VALUES, OFFICE_TYPE_LABELS);

export const occupancyTypeOptions = toSelectOptions(
  OCCUPANCY_TYPE_VALUES,
  OCCUPANCY_TYPE_LABELS,
);

export const registrationTypeOptions = toSelectOptions(
  REGISTRATION_TYPE_VALUES,
  REGISTRATION_TYPE_LABELS,
);

export const constitutionalDocumentTypeOptions = toSelectOptions(
  CONSTITUTIONAL_DOCUMENT_TYPE_VALUES,
  CONSTITUTIONAL_DOCUMENT_TYPE_LABELS,
);

export const companyClassOptions = toSelectOptions(COMPANY_CLASS_VALUES, COMPANY_CLASS_LABELS);

export const companyCategoryOptions = toSelectOptions(
  COMPANY_CATEGORY_VALUES,
  COMPANY_CATEGORY_LABELS,
);

export const companySubCategoryOptions = toSelectOptions(
  COMPANY_SUB_CATEGORY_VALUES,
  COMPANY_SUB_CATEGORY_LABELS,
);

export const companyStatusOptions = toSelectOptions(
  COMPANY_STATUS_VALUES,
  COMPANY_STATUS_LABELS,
);

export const governingActOptions = toSelectOptions(
  GOVERNING_ACT_VALUES,
  GOVERNING_ACT_LABELS,
);

export const specialCompanyTypeOptions = toSelectOptions(
  SPECIAL_COMPANY_TYPE_VALUES,
  SPECIAL_COMPANY_TYPE_LABELS,
);

export const listedStatusOptions = toSelectOptions(LISTED_STATUS_VALUES, LISTED_STATUS_LABELS);

export const certifiedCopyStatusOptions = toSelectOptions(
  CERTIFIED_COPY_STATUS_VALUES,
  CERTIFIED_COPY_STATUS_LABELS,
);

export const operationsAlignmentStatusOptions = toSelectOptions(
  OPERATIONS_ALIGNMENT_STATUS_VALUES,
  OPERATIONS_ALIGNMENT_STATUS_LABELS,
);

export const legalReviewStatusOptions = toSelectOptions(
  LEGAL_REVIEW_STATUS_VALUES,
  LEGAL_REVIEW_STATUS_LABELS,
);

export const registrationStatusOptions = toSelectOptions(
  REGISTRATION_STATUS_VALUES,
  REGISTRATION_STATUS_LABELS,
);

export const updateTrackingStatusOptions = toSelectOptions(
  UPDATE_TRACKING_STATUS_VALUES,
  UPDATE_TRACKING_STATUS_LABELS,
);

export const INFORMATION_SECTIONS = [
  { id: 'legal-identity', label: 'Legal Identity' },
  { id: 'corporate-history', label: 'Corporate History' },
  { id: 'offices-contact', label: 'Offices & Contact Information' },
  { id: 'constitutional-documents', label: 'Constitutional Documents' },
  { id: 'core-registrations', label: 'Core Registrations' },
  { id: 'issuer-confirmations', label: 'Issuer Confirmations' },
] as const;

export type InformationSectionId = (typeof INFORMATION_SECTIONS)[number]['id'];

export const WORKSTREAM_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'information', label: 'Information' },
  { id: 'documents', label: 'Documents' },
  { id: 'questions', label: 'Questions & Conflicts' },
  { id: 'facts', label: 'Facts & Evidence' },
  { id: 'disclosures', label: 'Generated Disclosures' },
  { id: 'review', label: 'Review History' },
] as const;

export type WorkstreamTabId = (typeof WORKSTREAM_TABS)[number]['id'];
