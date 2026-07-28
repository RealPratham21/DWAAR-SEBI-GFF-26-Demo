import {
  AUTHORISED_SIGNATORY_OPTIONS,
  BASIS_OF_AUTHORITY_OPTIONS,
  COMPANY_CLASS_OPTIONS,
  EMPLOYEE_COUNT_RANGE_OPTIONS,
  GST_REGISTRATION_REQUIRED_OPTIONS,
  INITIAL_DOCUMENT_CHECKLIST,
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
import type { SmeOnboardingData } from '@/lib/onboarding/sme/types';

function labelFor(
  options: readonly { value: string; label: string }[],
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function formatOnboardingReview(data: SmeOnboardingData, account?: {
  fullName: string;
  email: string;
  mobile: string;
} | null) {
  const role = data.roleAuthority;
  const company = data.companyIdentity;
  const business = data.businessClassification;
  const ownership = data.ownershipSnapshot;
  const ipo = data.ipoIntent;

  return {
    account: account
      ? [
          { label: 'Full name', value: account.fullName },
          { label: 'Email', value: account.email },
          { label: 'Mobile', value: account.mobile },
        ]
      : [],
    roleAuthority: [
      { label: 'Designation', value: role.designation },
      {
        label: 'Relationship',
        value:
          role.relationship === 'other'
            ? role.relationshipOther
            : labelFor(RELATIONSHIP_OPTIONS, role.relationship),
      },
      {
        label: 'Authorised signatory',
        value: labelFor(AUTHORISED_SIGNATORY_OPTIONS, role.authorisedSignatory),
      },
      {
        label: 'Basis of authority',
        value:
          role.basisOfAuthority === 'other'
            ? role.basisOfAuthorityOther
            : labelFor(BASIS_OF_AUTHORITY_OPTIONS, role.basisOfAuthority),
      },
      {
        label: 'Primary onboarding contact',
        value: labelFor(YES_NO_OPTIONS, role.primaryOnboardingContact),
      },
    ],
    companyIdentity: [
      { label: 'Legal name', value: company.legalName },
      { label: 'CIN', value: company.cin },
      { label: 'Incorporation date', value: company.incorporationDate },
      { label: 'Company class', value: labelFor(COMPANY_CLASS_OPTIONS, company.companyClass) },
      { label: 'Registered state', value: company.registeredState },
      { label: 'Registrar of Companies', value: company.registrarOfCompanies },
      {
        label: 'Registered office',
        value: [
          company.registeredOffice.addressLine1,
          company.registeredOffice.addressLine2,
          company.registeredOffice.locality,
          company.registeredOffice.city,
          company.registeredOffice.district,
          company.registeredOffice.state,
          company.registeredOffice.pinCode,
          company.registeredOffice.country,
        ]
          .filter(Boolean)
          .join(', '),
      },
      { label: 'Company email', value: company.companyEmail },
      { label: 'Company website', value: company.companyWebsite },
    ],
    businessClassification: [
      {
        label: 'Primary industry',
        value:
          business.primaryIndustry === 'other'
            ? business.primaryIndustryOther
            : labelFor(PRIMARY_INDUSTRY_OPTIONS, business.primaryIndustry),
      },
      { label: 'Business sector', value: business.businessSector },
      { label: 'Operations description', value: business.operationsDescription },
      { label: 'PAN', value: business.pan },
      {
        label: 'GST registration required',
        value: labelFor(GST_REGISTRATION_REQUIRED_OPTIONS, business.gstRegistrationRequired),
      },
      {
        label: 'GST registrations',
        value:
          business.gstRegistrations.length > 0
            ? business.gstRegistrations.map((g) => g.gstin).join(', ')
            : '',
      },
      { label: 'Udyam registration', value: business.udyamRegistration },
      { label: 'Import Export Code', value: business.importExportCode },
      {
        label: 'Employee count range',
        value: labelFor(EMPLOYEE_COUNT_RANGE_OPTIONS, business.employeeCountRange),
      },
    ],
    ownershipSnapshot: [
      { label: 'Promoter count', value: ownership.promoterCount },
      { label: 'Director count', value: ownership.directorCount },
      { label: 'Promoter holding (%)', value: ownership.promoterHoldingPercent },
      { label: 'Non-promoter holding (%)', value: ownership.nonPromoterHoldingPercent },
      {
        label: 'Institutional shareholders',
        value: labelFor(YES_NO_UNSURE_OPTIONS, ownership.institutionalShareholdersPresent),
      },
      {
        label: 'Foreign shareholders',
        value: labelFor(YES_NO_UNSURE_OPTIONS, ownership.foreignShareholdersPresent),
      },
      {
        label: 'Promoter group entities',
        value: labelFor(YES_NO_UNSURE_OPTIONS, ownership.promoterGroupEntitiesPresent),
      },
    ],
    ipoIntent: [
      {
        label: 'Proposed issue type',
        value: labelFor(PROPOSED_ISSUE_TYPE_OPTIONS, ipo.proposedIssueType),
      },
      {
        label: 'Indicative issue size',
        value: ipo.issueSizeNotDecided
          ? 'Not Decided'
          : ipo.issueSizeCrore
            ? `₹${ipo.issueSizeCrore} crore`
            : '',
      },
      { label: 'Target timeline', value: labelFor(TARGET_TIMELINE_OPTIONS, ipo.targetTimeline) },
      { label: 'Intended SME exchange', value: labelFor(SME_EXCHANGE_OPTIONS, ipo.intendedExchange) },
      {
        label: 'Primary purposes',
        value: ipo.primaryPurposes
          .map((purpose) =>
            purpose === 'other' ? ipo.primaryPurposeOther : labelFor(ISSUE_PURPOSE_OPTIONS, purpose),
          )
          .join(', '),
      },
      {
        label: 'Merchant banker appointed',
        value: labelFor(MERCHANT_BANKER_APPOINTED_OPTIONS, ipo.merchantBankerAppointed),
      },
      { label: 'Merchant banker name', value: ipo.merchantBankerName },
      {
        label: 'Preparation stage',
        value: labelFor(PREPARATION_STAGE_OPTIONS, ipo.preparationStage),
      },
    ],
    initialDocuments: INITIAL_DOCUMENT_CHECKLIST.map((item) => ({
      label: item.name,
      value: data.initialDocuments.selections[item.id]?.fileName ?? '',
    })),
  };
}
