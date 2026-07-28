import { z } from 'zod';
import { cinSchema, isoDateStringSchema } from '@/lib/schemas/company-incorporation';
import { INDIAN_STATES_AND_UTS, REGISTRAR_OF_COMPANIES_OPTIONS } from '@/lib/company-incorporation/options';
import { indianMobileSchema } from '@/lib/auth/schemas';
import {
  AUTHORISED_SIGNATORY_OPTIONS,
  BASIS_OF_AUTHORITY_OPTIONS,
  COMPANY_CLASS_OPTIONS,
  EMPLOYEE_COUNT_RANGE_OPTIONS,
  GST_REGISTRATION_REQUIRED_OPTIONS,
  MERCHANT_BANKER_APPOINTED_OPTIONS,
  PREPARATION_STAGE_OPTIONS,
  PRIMARY_INDUSTRY_OPTIONS,
  PROPOSED_ISSUE_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  SME_EXCHANGE_OPTIONS,
  TARGET_TIMELINE_OPTIONS,
  YES_NO_OPTIONS,
  YES_NO_UNSURE_OPTIONS,
} from '@/lib/onboarding/sme/constants';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;
const IEC_REGEX = /^([A-Z]{5}[0-9]{4}[A-Z]|[0-9]{10})$/;

const normalizeUppercaseTrim = (value: unknown) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const normalizeTrim = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value;

const requiredSelect = (values: readonly string[], label: string) =>
  z.string().min(1, `${label} is required`).refine((v) => values.includes(v), `${label} is required`);

const indianPinCodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, 'PIN code must be a valid 6-digit Indian PIN code');

const notFutureIsoDate = isoDateStringSchema.refine(
  (value) => {
    const parsed = new Date(`${value}T23:59:59.999Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now();
  },
  { message: 'Date of incorporation cannot be in the future' },
);

const alternateContactSchema = z.object({
  fullName: z.preprocess(normalizeTrim, z.string().min(1, 'Full name is required')),
  designation: z.preprocess(normalizeTrim, z.string().min(1, 'Designation is required')),
  email: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
    z.string().min(1, 'Work email is required').email('Enter a valid email address'),
  ),
  mobile: indianMobileSchema,
});

export const roleAuthorityStepSchema = z
  .object({
    designation: z.preprocess(normalizeTrim, z.string().min(1, 'Designation is required')),
    relationship: requiredSelect(
      RELATIONSHIP_OPTIONS.map((o) => o.value),
      'Relationship with the company',
    ),
    relationshipOther: z.string(),
    authorisedSignatory: requiredSelect(
      AUTHORISED_SIGNATORY_OPTIONS.map((o) => o.value),
      'Authorised signatory',
    ),
    basisOfAuthority: z.string(),
    basisOfAuthorityOther: z.string(),
    primaryOnboardingContact: requiredSelect(
      YES_NO_OPTIONS.map((o) => o.value),
      'Primary onboarding contact',
    ),
    addAlternateContact: z.boolean(),
    alternateContact: z.object({
      fullName: z.string(),
      designation: z.string(),
      email: z.string(),
      mobile: z.string(),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.relationship === 'other' && !data.relationshipOther.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please describe the relationship',
        path: ['relationshipOther'],
      });
    }

    const needsBasis =
      data.authorisedSignatory === 'yes' || data.authorisedSignatory === 'unsure';
    if (needsBasis) {
      if (!data.basisOfAuthority) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Basis of authority is required',
          path: ['basisOfAuthority'],
        });
      } else if (
        data.basisOfAuthority === 'other' &&
        !data.basisOfAuthorityOther.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please describe the basis of authority',
          path: ['basisOfAuthorityOther'],
        });
      }
    }

    const needsAlternate =
      data.primaryOnboardingContact === 'no' || data.addAlternateContact;
    if (needsAlternate) {
      const result = alternateContactSchema.safeParse(data.alternateContact);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({ ...issue, path: ['alternateContact', ...issue.path] });
        });
      }
    }
  });

export const registeredOfficeSchema = z.object({
  addressLine1: z.preprocess(normalizeTrim, z.string().min(1, 'Address line 1 is required')),
  addressLine2: z.string(),
  locality: z.string(),
  city: z.preprocess(normalizeTrim, z.string().min(1, 'City is required')),
  district: z.string(),
  state: requiredSelect([...INDIAN_STATES_AND_UTS], 'State or Union Territory'),
  pinCode: indianPinCodeSchema,
  country: z.preprocess(normalizeTrim, z.string().min(1, 'Country is required')),
});

export const companyIdentityStepSchema = z.object({
  legalName: z.preprocess(normalizeTrim, z.string().min(1, 'Legal name is required')),
  cin: cinSchema,
  incorporationDate: notFutureIsoDate,
  companyClass: requiredSelect(
    COMPANY_CLASS_OPTIONS.map((o) => o.value),
    'Company class',
  ),
  registeredState: requiredSelect([...INDIAN_STATES_AND_UTS], 'Registered state or Union Territory'),
  registrarOfCompanies: requiredSelect(
    [...REGISTRAR_OF_COMPANIES_OPTIONS],
    'Registrar of Companies',
  ),
  registeredOffice: registeredOfficeSchema,
  companyEmail: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
    z.string().min(1, 'Company email is required').email('Enter a valid email address'),
  ),
  companyWebsite: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.union([z.literal(''), z.string().url('Enter a valid website URL')]),
  ),
});

export const gstRegistrationEntrySchema = z.object({
  id: z.string(),
  gstin: z.preprocess(
    normalizeUppercaseTrim,
    z
      .string()
      .min(1, 'GSTIN is required')
      .regex(GSTIN_REGEX, 'Enter a valid GSTIN in the 15-character format'),
  ),
  state: requiredSelect([...INDIAN_STATES_AND_UTS], 'State or Union Territory'),
  principalPlaceOfBusiness: z.string(),
});

export const businessClassificationStepSchema = z
  .object({
    primaryIndustry: requiredSelect(
      PRIMARY_INDUSTRY_OPTIONS.map((o) => o.value),
      'Primary industry',
    ),
    primaryIndustryOther: z.string(),
    businessSector: z.preprocess(normalizeTrim, z.string().min(1, 'Business sector is required')),
    operationsDescription: z.preprocess(
      normalizeTrim,
      z
        .string()
        .min(30, 'Provide at least 30 characters')
        .max(1000, 'Maximum 1,000 characters'),
    ),
    pan: z.preprocess(
      normalizeUppercaseTrim,
      z
        .string()
        .min(1, 'PAN is required')
        .regex(PAN_REGEX, 'Enter a valid PAN in the AAAAA9999A format'),
    ),
    gstRegistrationRequired: requiredSelect(
      GST_REGISTRATION_REQUIRED_OPTIONS.map((o) => o.value),
      'GST registration requirement',
    ),
    gstRegistrations: z.array(gstRegistrationEntrySchema),
    udyamRegistration: z.string(),
    importExportCode: z.string(),
    employeeCountRange: requiredSelect(
      EMPLOYEE_COUNT_RANGE_OPTIONS.map((o) => o.value),
      'Employee count range',
    ),
  })
  .superRefine((data, ctx) => {
    if (data.primaryIndustry === 'other' && !data.primaryIndustryOther.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please describe the primary industry',
        path: ['primaryIndustryOther'],
      });
    }

    if (data.gstRegistrationRequired === 'yes' && data.gstRegistrations.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add at least one GSTIN when GST registration is required',
        path: ['gstRegistrations'],
      });
    }

    if (data.udyamRegistration.trim()) {
      const normalized = data.udyamRegistration.trim().toUpperCase();
      if (!UDYAM_REGEX.test(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid Udyam registration number in the UDYAM-XX-00-0000000 format',
          path: ['udyamRegistration'],
        });
      }
    }

    if (data.importExportCode.trim()) {
      const normalized = data.importExportCode.trim().toUpperCase();
      if (!IEC_REGEX.test(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid IEC in PAN format or as a 10-digit numeric code',
          path: ['importExportCode'],
        });
      }
    }
  });

const requiredNonNegativeInt = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((v) => /^\d+$/.test(v), `${label} must be a whole number`)
    .transform((v) => Number(v))
    .pipe(z.number().int().min(0, `${label} cannot be negative`));

const requiredPositiveInt = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((v) => /^\d+$/.test(v), `${label} must be a whole number`)
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1, 'At least one director is required'));

const requiredPercent = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((v) => /^\d+(\.\d+)?$/.test(v), 'Enter a valid percentage')
    .transform((v) => Number(v))
    .pipe(
      z
        .number()
        .min(0, 'Must be between 0 and 100')
        .max(100, 'Must be between 0 and 100'),
    );

export const ownershipSnapshotStepSchema = z
  .object({
    promoterCount: requiredNonNegativeInt('Promoter count'),
    directorCount: requiredPositiveInt('Director count'),
    promoterHoldingPercent: requiredPercent('Promoter holding'),
    nonPromoterHoldingPercent: requiredPercent('Non-promoter holding'),
    institutionalShareholdersPresent: requiredSelect(
      YES_NO_UNSURE_OPTIONS.map((o) => o.value),
      'Institutional shareholders',
    ),
    foreignShareholdersPresent: requiredSelect(
      YES_NO_UNSURE_OPTIONS.map((o) => o.value),
      'Foreign shareholders',
    ),
    promoterGroupEntitiesPresent: requiredSelect(
      YES_NO_UNSURE_OPTIONS.map((o) => o.value),
      'Promoter group entities',
    ),
  })
  .superRefine((data, ctx) => {
    const total = data.promoterHoldingPercent + data.nonPromoterHoldingPercent;
    if (Math.abs(total - 100) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Promoter and non-promoter holding must total 100%',
        path: ['nonPromoterHoldingPercent'],
      });
    }
  });

export const ipoIntentStepSchema = z
  .object({
    proposedIssueType: requiredSelect(
      PROPOSED_ISSUE_TYPE_OPTIONS.map((o) => o.value),
      'Proposed issue type',
    ),
    issueSizeCrore: z.string(),
    issueSizeNotDecided: z.boolean(),
    targetTimeline: requiredSelect(
      TARGET_TIMELINE_OPTIONS.map((o) => o.value),
      'Target timeline',
    ),
    intendedExchange: requiredSelect(
      SME_EXCHANGE_OPTIONS.map((o) => o.value),
      'Intended SME exchange',
    ),
    primaryPurposes: z.array(z.string()).min(1, 'Select at least one purpose'),
    primaryPurposeOther: z.string(),
    merchantBankerAppointed: requiredSelect(
      MERCHANT_BANKER_APPOINTED_OPTIONS.map((o) => o.value),
      'Merchant banker appointment status',
    ),
    merchantBankerName: z.string(),
    preparationStage: requiredSelect(
      PREPARATION_STAGE_OPTIONS.map((o) => o.value),
      'Current preparation stage',
    ),
  })
  .superRefine((data, ctx) => {
    if (data.primaryPurposes.includes('other') && !data.primaryPurposeOther.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please describe the other purpose',
        path: ['primaryPurposeOther'],
      });
    }

    if (!data.issueSizeNotDecided) {
      const amount = Number(data.issueSizeCrore);
      if (!data.issueSizeCrore.trim() || Number.isNaN(amount) || amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a positive issue size in crore or select Not Decided',
          path: ['issueSizeCrore'],
        });
      }
    }

    if (data.merchantBankerAppointed === 'yes' && !data.merchantBankerName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Merchant banker name is required',
        path: ['merchantBankerName'],
      });
    }
  });

export const initialDocumentsStepSchema = z.object({
  selections: z.record(z.string(), z.any()),
  skippedForNow: z.boolean(),
});

export const submissionConfirmationsSchema = z.object({
  confirmAccuracy: z.boolean().refine((value) => value === true, {
    message: 'This confirmation is required',
  }),
  confirmAuthorised: z.boolean().refine((value) => value === true, {
    message: 'This confirmation is required',
  }),
  confirmVerification: z.boolean().refine((value) => value === true, {
    message: 'This confirmation is required',
  }),
  agreeTerms: z.boolean().refine((value) => value === true, {
    message: 'You must agree to the Terms and Privacy Policy',
  }),
});

export const stepSchemas = {
  1: roleAuthorityStepSchema,
  2: companyIdentityStepSchema,
  3: businessClassificationStepSchema,
  4: ownershipSnapshotStepSchema,
  5: ipoIntentStepSchema,
  6: initialDocumentsStepSchema,
  7: submissionConfirmationsSchema,
} as const;

export type StepSchemaMap = typeof stepSchemas;
