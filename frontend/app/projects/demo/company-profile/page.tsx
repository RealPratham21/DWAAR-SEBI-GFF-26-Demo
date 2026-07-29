'use client';

import { PageHeader } from '@/components/page-header';
import { useWorkspaceBootstrap } from '@/lib/workspace/context';
import {
  formatIncorporationDate,
  formatOptionalValue,
  formatPercent,
  formatRegisteredOffice,
  workspaceLabels,
} from '@/lib/workspace/format';

interface InfoSectionProps {
  title: string;
  items: Array<{
    label: string;
    value: string;
  }>;
}

function InfoSection({ title, items }: InfoSectionProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <h3 className="font-semibold text-foreground mb-4">{title}</h3>
      <div className="grid md:grid-cols-2 gap-6">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {item.label}
            </p>
            <p className="text-foreground font-medium mt-2 whitespace-pre-wrap">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompanyProfilePage() {
  const bootstrap = useWorkspaceBootstrap();
  const { user, representative, company, business, registrations, ownership, ipoIntent } =
    bootstrap;

  const legalIdentity = [
    { label: 'Legal name', value: company.legalName },
    { label: 'CIN', value: company.cin },
    { label: 'Date of incorporation', value: formatIncorporationDate(company.incorporationDate) },
    { label: 'Company class', value: workspaceLabels.companyClass(company.companyClass) },
    { label: 'Registered state', value: formatOptionalValue(company.registeredState) },
    { label: 'Registrar of Companies', value: formatOptionalValue(company.registrarOfCompanies) },
    { label: 'Company email', value: formatOptionalValue(company.companyEmail) },
    { label: 'Website', value: formatOptionalValue(company.companyWebsite) },
  ];

  const registeredOffice = [
    { label: 'Full address', value: formatRegisteredOffice(company.registeredOffice) },
    { label: 'City', value: formatOptionalValue(company.registeredOffice.city) },
    { label: 'State', value: formatOptionalValue(company.registeredOffice.state) },
    { label: 'PIN code', value: formatOptionalValue(company.registeredOffice.pinCode) },
    { label: 'Country', value: formatOptionalValue(company.registeredOffice.country) },
  ];

  const businessItems = [
    {
      label: 'Primary industry',
      value: workspaceLabels.primaryIndustry(
        business.primaryIndustry,
        business.primaryIndustryOther,
      ),
    },
    { label: 'Business sector', value: formatOptionalValue(business.businessSector) },
    { label: 'Operations description', value: formatOptionalValue(business.operationsDescription) },
    {
      label: 'Employee count range',
      value: workspaceLabels.employeeCountRange(business.employeeCountRange),
    },
  ];

  const registrationItems = [
    { label: 'PAN', value: formatOptionalValue(registrations.pan) },
    {
      label: 'GST registration required',
      value: workspaceLabels.gstRegistrationRequired(registrations.gstRegistrationRequired),
    },
    {
      label: 'GST registrations',
      value:
        registrations.gstRegistrations.length > 0
          ? registrations.gstRegistrations
              .map(
                (entry) =>
                  `${entry.gstin}${entry.state ? ` (${entry.state})` : ''}${
                    entry.principalPlaceOfBusiness
                      ? ` — ${entry.principalPlaceOfBusiness}`
                      : ''
                  }`,
              )
              .join('\n')
          : 'Not provided',
    },
    { label: 'Udyam registration', value: formatOptionalValue(registrations.udyamRegistration) },
    { label: 'Import Export Code', value: formatOptionalValue(registrations.importExportCode) },
  ];

  const ownershipItems = [
    { label: 'Promoter count', value: String(ownership.promoterCount) },
    { label: 'Director count', value: String(ownership.directorCount) },
    {
      label: 'Promoter holding',
      value: formatPercent(ownership.promoterHoldingPercent),
    },
    {
      label: 'Non-promoter holding',
      value: formatPercent(ownership.nonPromoterHoldingPercent),
    },
    {
      label: 'Institutional shareholders',
      value: workspaceLabels.yesNoUnsure(ownership.institutionalShareholdersPresent),
    },
    {
      label: 'Foreign shareholders',
      value: workspaceLabels.yesNoUnsure(ownership.foreignShareholdersPresent),
    },
    {
      label: 'Promoter group entities',
      value: workspaceLabels.yesNoUnsure(ownership.promoterGroupEntitiesPresent),
    },
  ];

  const ipoIntentItems = [
    {
      label: 'Proposed issue type',
      value: workspaceLabels.proposedIssueType(ipoIntent.proposedIssueType),
    },
    {
      label: 'Indicative issue size',
      value: workspaceLabels.issueSize(ipoIntent.issueSizeCrore, ipoIntent.issueSizeNotDecided),
    },
    {
      label: 'Target timeline',
      value: workspaceLabels.targetTimeline(ipoIntent.targetTimeline),
    },
    {
      label: 'Intended exchange',
      value: workspaceLabels.intendedExchange(ipoIntent.intendedExchange),
    },
    {
      label: 'Primary purposes',
      value: workspaceLabels.primaryPurposes(
        ipoIntent.primaryPurposes,
        ipoIntent.primaryPurposeOther,
      ),
    },
    {
      label: 'Merchant banker status',
      value: workspaceLabels.merchantBankerAppointed(ipoIntent.merchantBankerAppointed),
    },
    {
      label: 'Merchant banker name',
      value: formatOptionalValue(ipoIntent.merchantBankerName),
    },
    {
      label: 'Preparation stage',
      value: workspaceLabels.preparationStage(ipoIntent.preparationStage),
    },
  ];

  const representativeItems = [
    { label: 'Full name', value: user.fullName },
    { label: 'Email', value: user.email },
    { label: 'Mobile', value: user.phone },
    { label: 'Designation', value: formatOptionalValue(representative.designation) },
    {
      label: 'Relationship',
      value: workspaceLabels.relationship(
        representative.relationship,
        representative.relationshipOther,
      ),
    },
    {
      label: 'Authorised signatory',
      value: workspaceLabels.authorisedSignatory(representative.authorisedSignatory),
    },
    {
      label: 'Basis of authority',
      value: workspaceLabels.basisOfAuthority(
        representative.basisOfAuthority,
        representative.basisOfAuthorityOther,
      ),
    },
    {
      label: 'Primary onboarding contact',
      value: workspaceLabels.primaryOnboardingContact(representative.primaryOnboardingContact),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Company Profile"
        description="Information captured during SME onboarding"
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Company Profile' },
        ]}
      />

      <InfoSection title="Representative" items={representativeItems} />
      <InfoSection title="Legal Identity" items={legalIdentity} />
      <InfoSection title="Registered Office" items={registeredOffice} />
      <InfoSection title="Business" items={businessItems} />
      <InfoSection title="Registrations & Identifiers" items={registrationItems} />
      <InfoSection title="Ownership Snapshot" items={ownershipItems} />
      <InfoSection title="IPO Intent" items={ipoIntentItems} />
    </div>
  );
}
