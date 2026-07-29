import {
  AUTHORISED_SIGNATORY_OPTIONS,
  BASIS_OF_AUTHORITY_OPTIONS,
  COMPANY_CLASS_OPTIONS,
  EMPLOYEE_COUNT_RANGE_OPTIONS,
  GST_REGISTRATION_REQUIRED_OPTIONS,
  ISSUE_PURPOSE_OPTIONS,
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
import type { RegisteredOffice } from '@/lib/workspace/types';

function labelFor(options: readonly { value: string; label: string }[], value: string) {
  if (!value) {
    return 'Not provided';
  }
  return options.find((option) => option.value === value)?.label ?? value;
}

export function formatOptionalValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'Not provided';
}

export function formatCompanyClass(value: string): string {
  if (value === 'private') {
    return 'Private Limited Company';
  }
  if (value === 'public') {
    return 'Public Limited Company';
  }
  return labelFor(COMPANY_CLASS_OPTIONS, value);
}

export function formatIncorporationDate(isoDate: string): string {
  if (!isoDate) {
    return 'Not provided';
  }
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRegisteredOffice(office: RegisteredOffice): string {
  return [
    office.addressLine1,
    office.addressLine2,
    office.locality,
    office.city,
    office.district,
    office.state,
    office.pinCode,
    office.country,
  ]
    .filter(Boolean)
    .join(', ');
}

export function formatRelationship(value: string, other: string): string {
  if (value === 'other') {
    return formatOptionalValue(other);
  }
  return labelFor(RELATIONSHIP_OPTIONS, value);
}

export function formatBasisOfAuthority(value: string, other: string): string {
  if (value === 'other') {
    return formatOptionalValue(other);
  }
  return labelFor(BASIS_OF_AUTHORITY_OPTIONS, value);
}

export function formatPrimaryIndustry(value: string, other: string): string {
  if (value === 'other') {
    return formatOptionalValue(other);
  }
  return labelFor(PRIMARY_INDUSTRY_OPTIONS, value);
}

export function formatIssueSize(issueSizeCrore: string, notDecided: boolean): string {
  if (notDecided) {
    return 'Not decided';
  }
  if (!issueSizeCrore.trim()) {
    return 'Not provided';
  }
  return `₹${issueSizeCrore} crore`;
}

export function formatPrimaryPurposes(purposes: string[], other: string): string {
  if (purposes.length === 0) {
    return 'Not provided';
  }
  return purposes
    .map((purpose) =>
      purpose === 'other' ? formatOptionalValue(other) : labelFor(ISSUE_PURPOSE_OPTIONS, purpose),
    )
    .join(', ');
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export const workspaceLabels = {
  relationship: (value: string, other: string) => formatRelationship(value, other),
  authorisedSignatory: (value: string) => labelFor(AUTHORISED_SIGNATORY_OPTIONS, value),
  basisOfAuthority: (value: string, other: string) => formatBasisOfAuthority(value, other),
  primaryOnboardingContact: (value: string) => labelFor(YES_NO_OPTIONS, value),
  companyClass: formatCompanyClass,
  primaryIndustry: formatPrimaryIndustry,
  employeeCountRange: (value: string) => labelFor(EMPLOYEE_COUNT_RANGE_OPTIONS, value),
  gstRegistrationRequired: (value: string) => labelFor(GST_REGISTRATION_REQUIRED_OPTIONS, value),
  yesNoUnsure: (value: string) => labelFor(YES_NO_UNSURE_OPTIONS, value),
  proposedIssueType: (value: string) => labelFor(PROPOSED_ISSUE_TYPE_OPTIONS, value),
  targetTimeline: (value: string) => labelFor(TARGET_TIMELINE_OPTIONS, value),
  intendedExchange: (value: string) => labelFor(SME_EXCHANGE_OPTIONS, value),
  merchantBankerAppointed: (value: string) => labelFor(MERCHANT_BANKER_APPOINTED_OPTIONS, value),
  preparationStage: (value: string) => labelFor(PREPARATION_STAGE_OPTIONS, value),
  issueSize: formatIssueSize,
  primaryPurposes: formatPrimaryPurposes,
};
