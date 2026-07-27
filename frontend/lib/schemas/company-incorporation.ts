import { z } from 'zod';
import {
  COMPANY_CATEGORY_VALUES,
  COMPANY_STATUS_VALUES,
  COMPANY_SUB_CATEGORY_VALUES,
  CORPORATE_EVENT_STATUS_VALUES,
  GOVERNING_ACT_VALUES,
  INDIAN_STATES_AND_UTS,
  REGISTRAR_OF_COMPANIES_OPTIONS,
  SPECIAL_COMPANY_TYPE_VALUES,
} from '@/lib/company-incorporation/options';
import { REGISTRATION_NUMBER_FIELD_CONFIG } from '@/lib/company-incorporation/registration-field-config';

/** ISO calendar date (YYYY-MM-DD), suitable for DRF date fields. */
export const isoDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const optionalIsoDateStringSchema = isoDateStringSchema.optional();

const emptyStringToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema);

const noneToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === '' || value === 'none' ? undefined : value), schema);

const normalizeUppercaseTrim = (value: unknown) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const notFutureIsoDate = (fieldLabel: string) =>
  isoDateStringSchema.refine(
    (value) => {
      const parsed = new Date(`${value}T23:59:59.999Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now();
    },
    { message: `${fieldLabel} cannot be in the future` },
  );

const optionalNotFutureIsoDate = (fieldLabel: string) =>
  emptyStringToUndefined(
    optionalIsoDateStringSchema.refine(
      (value) => {
        if (value === undefined) return true;
        const parsed = new Date(`${value}T23:59:59.999Z`);
        return !Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now();
      },
      { message: `${fieldLabel} cannot be in the future` },
    ),
  );

const requiredSelect = <T extends readonly [string, ...string[]]>(
  values: T,
  label: string,
) =>
  z
    .string()
    .min(1, `${label} is required`)
    .pipe(z.enum(values));

/** Basic CIN shape check only — not official MCA verification. */
export const cinSchema = z.preprocess(
  normalizeUppercaseTrim,
  z
    .string()
    .min(1, 'CIN is required')
    .regex(
      /^[A-Z0-9]{21}$/,
      'CIN must be exactly 21 uppercase alphanumeric characters',
    ),
);

const optionalEmailSchema = emptyStringToUndefined(
  z.string().trim().email('Enter a valid email address').optional(),
);

const optionalUrlSchema = emptyStringToUndefined(
  z.string().trim().url('Enter a valid website URL').optional(),
);

const requiredEmailSchema = z
  .string()
  .trim()
  .min(1, 'Issuer email is required')
  .email('Enter a valid email address');

const requiredTelephoneSchema = z
  .string()
  .trim()
  .min(1, 'Telephone is required')
  .regex(
    /^(\+91[\s-]?)?[0-9]{10}$/,
    'Telephone must be a valid 10-digit Indian number, optionally prefixed with +91',
  );

const indianPinCodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, 'PIN code must be a valid 6-digit Indian PIN code');

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const TAN_REGEX = /^[A-Z]{4}[0-9]{5}[A-Z]$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;
const IEC_REGEX = /^([A-Z]{5}[0-9]{4}[A-Z]|[0-9]{10})$/;

export const CORPORATE_EVENT_TYPE_VALUES = [
  'original-incorporation',
  'name-change',
  'private-to-public-conversion',
  'public-to-private-conversion',
  'company-class-change',
  'registered-office-change',
  'registered-office-state-change',
  'roc-jurisdiction-change',
  'moa-amendment',
  'main-object-amendment',
  'aoa-amendment',
  'merger-amalgamation',
  'demerger',
  'acquisition-transfer-undertaking',
  'succession-of-business',
  'other-material-event',
] as const;

export const OFFICE_TYPE_VALUES = [
  'registered-office',
  'corporate-office',
  'administrative-office',
  'communication-office',
  'previous-registered-office',
] as const;

export const OCCUPANCY_TYPE_VALUES = ['owned', 'leased', 'licensed', 'other'] as const;

export const REGISTRATION_TYPE_VALUES = [
  'pan',
  'tan',
  'gstin',
  'udyam',
  'iec',
  'other',
] as const;

export const CONSTITUTIONAL_DOCUMENT_TYPE_VALUES = ['moa', 'aoa'] as const;

export const COMPANY_CLASS_VALUES = ['public', 'private'] as const;

export const LISTED_STATUS_VALUES = ['listed', 'unlisted', 'delisted', 'not-applicable'] as const;

export const CERTIFIED_COPY_STATUS_VALUES = [
  'not-available',
  'available',
  'pending-verification',
  'verified',
] as const;

export const OPERATIONS_ALIGNMENT_STATUS_VALUES = [
  'yes',
  'no',
  'requires-legal-review',
] as const;

export const LEGAL_REVIEW_STATUS_VALUES = [
  'not-requested',
  'pending',
  'under-review',
  'reviewed',
] as const;

export const REGISTRATION_STATUS_VALUES = [
  'active',
  'inactive',
  'pending',
  'amendment-pending',
  'cancelled',
  'unknown',
] as const;

export const UPDATE_TRACKING_STATUS_VALUES = [
  'yes',
  'no',
  'not-applicable',
  'unknown',
] as const;

export {
  COMPANY_CATEGORY_VALUES,
  COMPANY_STATUS_VALUES,
  COMPANY_SUB_CATEGORY_VALUES,
  CORPORATE_EVENT_STATUS_VALUES,
  GOVERNING_ACT_VALUES,
  INDIAN_STATES_AND_UTS,
  REGISTRAR_OF_COMPANIES_OPTIONS,
  SPECIAL_COMPANY_TYPE_VALUES,
};

export const corporateEventTypeSchema = z.enum(CORPORATE_EVENT_TYPE_VALUES);
export const officeTypeSchema = z.enum(OFFICE_TYPE_VALUES);
export const occupancyTypeSchema = z.enum(OCCUPANCY_TYPE_VALUES);
export const registrationTypeSchema = z.enum(REGISTRATION_TYPE_VALUES);
export const constitutionalDocumentTypeSchema = z.enum(CONSTITUTIONAL_DOCUMENT_TYPE_VALUES);
export const companyClassSchema = z.enum(COMPANY_CLASS_VALUES);
export const companyCategorySchema = z.enum(COMPANY_CATEGORY_VALUES);
export const companySubCategorySchema = z.enum(COMPANY_SUB_CATEGORY_VALUES);
export const companyStatusSchema = z.enum(COMPANY_STATUS_VALUES);
export const governingActSchema = z.enum(GOVERNING_ACT_VALUES);
export const specialCompanyTypeSchema = z.enum(SPECIAL_COMPANY_TYPE_VALUES);
export const corporateEventStatusSchema = z.enum(CORPORATE_EVENT_STATUS_VALUES);
export const listedStatusSchema = z.enum(LISTED_STATUS_VALUES);
export const certifiedCopyStatusSchema = z.enum(CERTIFIED_COPY_STATUS_VALUES);
export const operationsAlignmentStatusSchema = z.enum(OPERATIONS_ALIGNMENT_STATUS_VALUES);
export const legalReviewStatusSchema = z.enum(LEGAL_REVIEW_STATUS_VALUES);
export const registrationStatusSchema = z.enum(REGISTRATION_STATUS_VALUES);
export const updateTrackingStatusSchema = z.enum(UPDATE_TRACKING_STATUS_VALUES);

export const companyIdentitySchema = z.object({
  legalName: z.string().trim().min(1, 'Legal name is required'),
  shortName: emptyStringToUndefined(z.string().trim().optional()),
  cin: cinSchema,
  registrationNumber: emptyStringToUndefined(z.string().trim().optional()),
  incorporationDate: notFutureIsoDate('Incorporation date'),
  incorporationCity: z.string().trim().min(1, 'Incorporation city is required'),
  incorporationState: requiredSelect(INDIAN_STATES_AND_UTS, 'Incorporation state'),
  registrarOfCompanies: requiredSelect(
    REGISTRAR_OF_COMPANIES_OPTIONS,
    'Registrar of Companies',
  ),
  companyClass: requiredSelect(COMPANY_CLASS_VALUES, 'Company class'),
  companyCategory: requiredSelect(COMPANY_CATEGORY_VALUES, 'Company category'),
  companySubCategory: requiredSelect(COMPANY_SUB_CATEGORY_VALUES, 'Company sub-category'),
  specialCompanyType: noneToUndefined(specialCompanyTypeSchema.optional()),
  companyStatus: requiredSelect(COMPANY_STATUS_VALUES, 'Company status'),
  listedStatus: requiredSelect(LISTED_STATUS_VALUES, 'Listed status'),
  commencementDate: optionalNotFutureIsoDate('Commencement date'),
  governingAct: requiredSelect(GOVERNING_ACT_VALUES, 'Governing Act'),
  website: optionalUrlSchema,
  email: requiredEmailSchema,
  telephone: requiredTelephoneSchema,
  issuerContactPersonId: emptyStringToUndefined(z.string().trim().optional()),
});

const validateCorporateEvent = (
  data: {
    eventStatus: z.infer<typeof corporateEventStatusSchema>;
    effectiveDate?: string;
  },
  ctx: z.RefinementCtx,
) => {
  if (data.eventStatus === 'effective' && !data.effectiveDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Legal effective date is required when status is Effective',
      path: ['effectiveDate'],
    });
  }
};

export const corporateEventFieldsSchema = z.object({
  id: z.string().trim().min(1, 'Event id is required'),
  eventType: corporateEventTypeSchema,
  eventStatus: requiredSelect(CORPORATE_EVENT_STATUS_VALUES, 'Event status'),
  effectiveDate: optionalNotFutureIsoDate('Legal effective date'),
  previousValue: emptyStringToUndefined(z.string().trim().optional()),
  newValue: emptyStringToUndefined(z.string().trim().optional()),
  description: z.string().trim().min(1, 'Event description is required'),
  reason: emptyStringToUndefined(z.string().trim().optional()),
  boardResolutionDate: optionalNotFutureIsoDate('Board resolution date'),
  shareholderResolutionDate: optionalNotFutureIsoDate('Shareholder resolution date'),
  approvalAuthority: emptyStringToUndefined(z.string().trim().optional()),
  filingForm: emptyStringToUndefined(z.string().trim().optional()),
  srn: emptyStringToUndefined(z.string().trim().optional()),
  filingDate: optionalNotFutureIsoDate('Filing date'),
  certificateOrOrderDate: optionalNotFutureIsoDate('Certificate or order date'),
});

export const corporateEventFormSchema = corporateEventFieldsSchema
  .omit({ id: true })
  .superRefine(validateCorporateEvent);

export const corporateEventSchema = corporateEventFieldsSchema.superRefine(
  validateCorporateEvent,
);

const validateOfficeEffectiveDates = (
  data: { effectiveFrom: string; effectiveUntil?: string },
  ctx: z.RefinementCtx,
) => {
  if (!data.effectiveUntil) return;
  if (data.effectiveUntil < data.effectiveFrom) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Effective until cannot be earlier than effective from',
      path: ['effectiveUntil'],
    });
  }
};

export const officeAddressFieldsSchema = z.object({
  id: z.string().trim().min(1, 'Office id is required'),
  officeType: officeTypeSchema,
  addressLine1: z.string().trim().min(1, 'Address line 1 is required'),
  addressLine2: emptyStringToUndefined(z.string().trim().optional()),
  locality: emptyStringToUndefined(z.string().trim().optional()),
  city: z.string().trim().min(1, 'City is required'),
  district: emptyStringToUndefined(z.string().trim().optional()),
  state: z.string().trim().min(1, 'State is required'),
  pinCode: indianPinCodeSchema,
  country: z.string().trim().min(1, 'Country is required'),
  effectiveFrom: notFutureIsoDate('Effective from date'),
  effectiveUntil: emptyStringToUndefined(optionalIsoDateStringSchema),
  occupancyType: occupancyTypeSchema,
});

export const officeAddressFormSchema = officeAddressFieldsSchema
  .omit({ id: true })
  .superRefine(validateOfficeEffectiveDates);

export const officeAddressSchema = officeAddressFieldsSchema.superRefine(
  validateOfficeEffectiveDates,
);

export const officesArraySchema = z
  .array(officeAddressSchema)
  .superRefine((offices, ctx) => {
    const currentRegisteredOffices = offices.filter(
      (office) => office.officeType === 'registered-office' && !office.effectiveUntil,
    );

    if (currentRegisteredOffices.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Only one current registered office is allowed unless earlier records have an effective-until date',
      });
    }
  });

export const constitutionalRecordSchema = z.object({
  moaVersionDate: optionalNotFutureIsoDate('MoA version date'),
  aoaVersionDate: optionalNotFutureIsoDate('AoA version date'),
  moaCertifiedCopyStatus: emptyStringToUndefined(certifiedCopyStatusSchema.optional()),
  aoaCertifiedCopyStatus: emptyStringToUndefined(certifiedCopyStatusSchema.optional()),
  mainObjectClauseNumbers: z.array(z.string().trim().min(1)).default([]),
  mainObjectText: z.string().trim().optional(),
  latestMoaAmendmentDate: optionalNotFutureIsoDate('Latest MoA amendment date'),
  latestAoaAmendmentDate: optionalNotFutureIsoDate('Latest AoA amendment date'),
  operationsAlignmentStatus: emptyStringToUndefined(operationsAlignmentStatusSchema.optional()),
  legalReviewStatus: emptyStringToUndefined(legalReviewStatusSchema.optional()),
});

export const constitutionalAmendmentSchema = z.object({
  id: z.string().trim().min(1, 'Amendment id is required'),
  documentType: constitutionalDocumentTypeSchema,
  amendmentDate: notFutureIsoDate('Amendment date'),
  clauseReference: z.string().trim().min(1, 'Clause reference is required'),
  previousText: emptyStringToUndefined(z.string().trim().optional()),
  amendedText: z.string().trim().min(1, 'Amended text is required'),
  reason: emptyStringToUndefined(z.string().trim().optional()),
  boardResolutionDate: optionalNotFutureIsoDate('Board resolution date'),
  shareholderResolutionDate: optionalNotFutureIsoDate('Shareholder resolution date'),
  filingForm: emptyStringToUndefined(z.string().trim().optional()),
  srn: emptyStringToUndefined(z.string().trim().optional()),
  effectiveDate: optionalNotFutureIsoDate('Effective date'),
});

const validateRegistrationNumber = (
  data: {
    registrationType: z.infer<typeof registrationTypeSchema>;
    registrationNumber: string;
  },
  ctx: z.RefinementCtx,
) => {
  const number = data.registrationNumber;
  const config = REGISTRATION_NUMBER_FIELD_CONFIG[data.registrationType];

  switch (data.registrationType) {
    case 'pan':
      if (!PAN_REGEX.test(number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: config.invalidMessage,
          path: ['registrationNumber'],
        });
      }
      break;
    case 'tan':
      if (!TAN_REGEX.test(number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: config.invalidMessage,
          path: ['registrationNumber'],
        });
      }
      break;
    case 'gstin':
      if (!GSTIN_REGEX.test(number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: config.invalidMessage,
          path: ['registrationNumber'],
        });
      }
      break;
    case 'udyam':
      if (!UDYAM_REGEX.test(number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: config.invalidMessage,
          path: ['registrationNumber'],
        });
      }
      break;
    case 'iec':
      if (!IEC_REGEX.test(number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: config.invalidMessage,
          path: ['registrationNumber'],
        });
      }
      break;
    case 'other':
      if (!number.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: config.invalidMessage,
          path: ['registrationNumber'],
        });
      }
      break;
    default:
      break;
  }
};

export const companyRegistrationFieldsSchema = z.object({
  id: z.string().trim().min(1, 'Registration id is required'),
  registrationType: registrationTypeSchema,
  registrationNumber: z.preprocess(
    normalizeUppercaseTrim,
    z.string().min(1, 'Registration number is required'),
  ),
  issuingAuthority: emptyStringToUndefined(z.string().trim().optional()),
  legalNameOnRegistration: emptyStringToUndefined(z.string().trim().optional()),
  addressOnRegistration: emptyStringToUndefined(z.string().trim().optional()),
  issueDate: optionalNotFutureIsoDate('Issue date'),
  effectiveDate: optionalNotFutureIsoDate('Effective date'),
  expiryDate: emptyStringToUndefined(optionalIsoDateStringSchema),
  currentStatus: emptyStringToUndefined(registrationStatusSchema.optional()),
  previousRegistrationNumber: emptyStringToUndefined(z.string().trim().optional()),
  updatedAfterNameChange: emptyStringToUndefined(updateTrackingStatusSchema.optional()),
  updatedAfterOfficeChange: emptyStringToUndefined(updateTrackingStatusSchema.optional()),
});

export const companyRegistrationFormSchema = companyRegistrationFieldsSchema
  .omit({ id: true })
  .superRefine(validateRegistrationNumber);

export const companyRegistrationSchema = companyRegistrationFieldsSchema.superRefine(
  validateRegistrationNumber,
);

export const issuerConfirmationSchema = z.object({
  allFormerNamesDisclosed: z.boolean(),
  allCompanyClassChangesDisclosed: z.boolean(),
  allRegisteredOfficeChangesDisclosed: z.boolean(),
  currentMoaWillBeProvided: z.boolean(),
  currentAoaWillBeProvided: z.boolean(),
  mainObjectsReflectCurrentBusiness: z.boolean(),
  registrationsUseCurrentLegalName: z.boolean(),
  noMaterialCorporateEventOmitted: z.boolean(),
  authorisedRepresentativeDeclaration: z.boolean(),
});

export const companyIncorporationFormDataSchema = z.object({
  identity: companyIdentitySchema,
  corporateEvents: z.array(corporateEventSchema),
  offices: officesArraySchema,
  constitutionalRecord: constitutionalRecordSchema,
  constitutionalAmendments: z.array(constitutionalAmendmentSchema),
  registrations: z.array(companyRegistrationSchema),
  confirmations: issuerConfirmationSchema,
});

export type CorporateEventType = z.infer<typeof corporateEventTypeSchema>;
export type OfficeType = z.infer<typeof officeTypeSchema>;
export type OccupancyType = z.infer<typeof occupancyTypeSchema>;
export type RegistrationType = z.infer<typeof registrationTypeSchema>;
export type ConstitutionalDocumentType = z.infer<typeof constitutionalDocumentTypeSchema>;
export type CompanyClass = z.infer<typeof companyClassSchema>;
export type CompanyCategory = z.infer<typeof companyCategorySchema>;
export type CompanySubCategory = z.infer<typeof companySubCategorySchema>;
export type CompanyStatus = z.infer<typeof companyStatusSchema>;
export type GoverningAct = z.infer<typeof governingActSchema>;
export type SpecialCompanyType = z.infer<typeof specialCompanyTypeSchema>;
export type CorporateEventStatus = z.infer<typeof corporateEventStatusSchema>;
export type ListedStatus = z.infer<typeof listedStatusSchema>;
export type CertifiedCopyStatus = z.infer<typeof certifiedCopyStatusSchema>;
export type OperationsAlignmentStatus = z.infer<typeof operationsAlignmentStatusSchema>;
export type LegalReviewStatus = z.infer<typeof legalReviewStatusSchema>;
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>;
export type UpdateTrackingStatus = z.infer<typeof updateTrackingStatusSchema>;

export type CompanyIdentity = z.infer<typeof companyIdentitySchema>;
export type CorporateEvent = z.infer<typeof corporateEventSchema>;
export type OfficeAddress = z.infer<typeof officeAddressSchema>;
export type ConstitutionalRecord = z.infer<typeof constitutionalRecordSchema>;
export type ConstitutionalAmendment = z.infer<typeof constitutionalAmendmentSchema>;
export type CompanyRegistration = z.infer<typeof companyRegistrationSchema>;
export type IssuerConfirmation = z.infer<typeof issuerConfirmationSchema>;
export type CompanyIncorporationFormData = z.infer<typeof companyIncorporationFormDataSchema>;

/** Input shapes before Zod preprocessing (empty strings on optional fields). */
export type CompanyIdentityInput = z.input<typeof companyIdentitySchema>;
export type ConstitutionalRecordInput = z.input<typeof constitutionalRecordSchema>;
export type IssuerConfirmationInput = z.infer<typeof issuerConfirmationSchema>;
