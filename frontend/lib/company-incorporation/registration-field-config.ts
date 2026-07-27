import type { RegistrationType } from '@/lib/schemas/company-incorporation';

export type RegistrationNumberFieldConfig = {
  label: string;
  helper: string;
  formatHint: string;
  invalidMessage: string;
};

export const REGISTRATION_NUMBER_FIELD_CONFIG: Record<
  RegistrationType,
  RegistrationNumberFieldConfig
> = {
  pan: {
    label: 'PAN',
    helper: 'Permanent Account Number issued by the Income Tax Department. Format check only — not official verification.',
    formatHint: 'AAAAA9999A (5 letters, 4 digits, 1 letter)',
    invalidMessage: 'Enter a valid PAN in the AAAAA9999A format.',
  },
  tan: {
    label: 'TAN',
    helper: 'Tax Deduction and Collection Account Number. Format check only — not official verification.',
    formatHint: 'AAAA99999A (4 letters, 5 digits, 1 letter)',
    invalidMessage: 'Enter a valid TAN in the AAAA99999A format.',
  },
  gstin: {
    label: 'GSTIN',
    helper: 'Goods and Services Tax Identification Number. Format check only — not official verification.',
    formatHint: '15-character GSTIN (e.g. 22AAAAA9999A1Z5)',
    invalidMessage: 'Enter a valid GSTIN in the 15-character format.',
  },
  udyam: {
    label: 'Udyam Registration Number',
    helper: 'MSME Udyam registration number. Format check only — not official verification.',
    formatHint: 'UDYAM-XX-00-0000000',
    invalidMessage: 'Enter a valid Udyam registration number in the UDYAM-XX-00-0000000 format.',
  },
  iec: {
    label: 'Import Export Code',
    helper: 'IEC may follow PAN format or a legacy 10-digit numeric code. Format check only — not official verification.',
    formatHint: 'PAN format (AAAAA9999A) or 10-digit numeric IEC',
    invalidMessage: 'Enter a valid IEC in PAN format or as a 10-digit numeric code.',
  },
  other: {
    label: 'Registration number',
    helper: 'Enter the registration or identification number as recorded with the issuing authority.',
    formatHint: 'Non-empty value required',
    invalidMessage: 'Registration number is required.',
  },
};
