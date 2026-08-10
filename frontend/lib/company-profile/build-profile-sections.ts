import {
  formatIncorporationDate,
  formatPercent,
  workspaceLabels,
} from '@/lib/workspace/format';
import type {
  BootstrapBusiness,
  BootstrapCompany,
  BootstrapIpoIntent,
  BootstrapOwnership,
  BootstrapRegistrations,
  BootstrapRepresentative,
  BootstrapUser,
} from '@/lib/workspace/types';
import { formatRegisteredOfficeLines, isPresent } from '@/lib/company-profile/utils';

export type ProfileFieldItem = {
  label: string;
  value: string;
  emphasis?: boolean;
  fullWidth?: boolean;
};

export type RegistrationItem = {
  label: string;
  value: string;
  detail?: string;
};

export type ProfileSectionId =
  | 'overview'
  | 'business'
  | 'ipo'
  | 'office'
  | 'representative'
  | 'registrations'
  | 'ownership';

export type BuiltProfileSections = {
  hero: {
    legalName: string;
    tagline: string;
    location: string;
    chips: string[];
    atAGlance: ProfileFieldItem[];
  };
  overview: ProfileFieldItem[];
  business: {
    fields: ProfileFieldItem[];
    operationsDescription: string | null;
  };
  ipo: ProfileFieldItem[];
  office: {
    addressLines: string[];
    email: string | null;
    website: string | null;
  };
  representative: {
    name: string;
    designation: string;
    relationship: string;
    email: string;
    phone: string;
    authority: ProfileFieldItem[];
  };
  registrations: RegistrationItem[];
  ownership: ProfileFieldItem[];
  navSections: Array<{ id: ProfileSectionId; label: string }>;
};

function field(label: string, value: string, emphasis = false): ProfileFieldItem | null {
  if (!isPresent(value)) return null;
  return { label, value, emphasis };
}

function yesNoUnsureField(
  label: string,
  raw: string,
  formatter: (value: string) => string,
): ProfileFieldItem | null {
  if (!isPresent(raw)) return null;
  return { label, value: formatter(raw) };
}

function buildRegistrations(registrations: BootstrapRegistrations): RegistrationItem[] {
  const items: RegistrationItem[] = [];

  if (isPresent(registrations.pan)) {
    items.push({ label: 'PAN', value: registrations.pan.trim() });
  }

  if (isPresent(registrations.gstRegistrationRequired)) {
    items.push({
      label: 'GST registration',
      value: workspaceLabels.gstRegistrationRequired(registrations.gstRegistrationRequired),
    });
  }

  for (const entry of registrations.gstRegistrations) {
    if (!isPresent(entry.gstin)) continue;
    const detail = [entry.state, entry.principalPlaceOfBusiness].filter(isPresent).join(' · ');
    items.push({
      label: 'GSTIN',
      value: entry.gstin.trim(),
      detail: detail || undefined,
    });
  }

  if (isPresent(registrations.udyamRegistration)) {
    items.push({ label: 'Udyam', value: registrations.udyamRegistration.trim() });
  }

  if (isPresent(registrations.importExportCode)) {
    items.push({ label: 'Import Export Code', value: registrations.importExportCode.trim() });
  }

  return items;
}

function buildOwnership(ownership: BootstrapOwnership): ProfileFieldItem[] {
  const items: ProfileFieldItem[] = [];

  if (ownership.promoterCount > 0) {
    items.push({ label: 'Promoters', value: String(ownership.promoterCount) });
  }
  if (ownership.directorCount > 0) {
    items.push({ label: 'Directors', value: String(ownership.directorCount) });
  }
  if (ownership.promoterHoldingPercent > 0) {
    items.push({
      label: 'Promoter holding',
      value: formatPercent(ownership.promoterHoldingPercent),
    });
  }
  if (ownership.nonPromoterHoldingPercent > 0) {
    items.push({
      label: 'Non-promoter holding',
      value: formatPercent(ownership.nonPromoterHoldingPercent),
    });
  }

  const optionalFlags: Array<[string, string]> = [
    ['Institutional shareholders', ownership.institutionalShareholdersPresent],
    ['Foreign shareholders', ownership.foreignShareholdersPresent],
    ['Promoter group entities', ownership.promoterGroupEntitiesPresent],
  ];

  for (const [label, raw] of optionalFlags) {
    const row = yesNoUnsureField(label, raw, workspaceLabels.yesNoUnsure);
    if (row) items.push(row);
  }

  return items;
}

function buildIpo(ipoIntent: BootstrapIpoIntent): ProfileFieldItem[] {
  const items: ProfileFieldItem[] = [];

  const push = (label: string, value: string) => {
    if (!isPresent(value) || value === 'Not provided') return;
    items.push({ label, value });
  };

  push('Proposed issue type', workspaceLabels.proposedIssueType(ipoIntent.proposedIssueType));
  push(
    'Indicative issue size',
    workspaceLabels.issueSize(ipoIntent.issueSizeCrore, ipoIntent.issueSizeNotDecided),
  );
  push('Target timeline', workspaceLabels.targetTimeline(ipoIntent.targetTimeline));
  push('Intended exchange', workspaceLabels.intendedExchange(ipoIntent.intendedExchange));
  push(
    'Primary purposes',
    workspaceLabels.primaryPurposes(ipoIntent.primaryPurposes, ipoIntent.primaryPurposeOther),
  );
  push('Preparation stage', workspaceLabels.preparationStage(ipoIntent.preparationStage));
  push(
    'Merchant banker status',
    workspaceLabels.merchantBankerAppointed(ipoIntent.merchantBankerAppointed),
  );
  if (isPresent(ipoIntent.merchantBankerName)) {
    push('Merchant banker', ipoIntent.merchantBankerName.trim());
  }

  return items;
}

export function buildProfileSections(input: {
  user: BootstrapUser;
  representative: BootstrapRepresentative;
  company: BootstrapCompany;
  business: BootstrapBusiness;
  registrations: BootstrapRegistrations;
  ownership: BootstrapOwnership;
  ipoIntent: BootstrapIpoIntent;
}): BuiltProfileSections {
  const { user, representative, company, business, registrations, ownership, ipoIntent } = input;

  const industry = workspaceLabels.primaryIndustry(
    business.primaryIndustry,
    business.primaryIndustryOther,
  );
  const sector = business.businessSector?.trim() ?? '';
  const taglineParts = [industry, sector].filter(
    (part) => isPresent(part) && part !== 'Not provided',
  );
  const tagline = taglineParts.join(' · ');

  const cityState = [company.registeredOffice.city, company.registeredOffice.state]
    .filter(isPresent)
    .join(', ');

  const chips: string[] = [];
  const companyClass = workspaceLabels.companyClass(company.companyClass);
  if (isPresent(companyClass) && companyClass !== 'Not provided') chips.push(companyClass);
  const exchange = workspaceLabels.intendedExchange(ipoIntent.intendedExchange);
  if (isPresent(exchange) && exchange !== 'Not provided') chips.push(exchange);
  const issueType = workspaceLabels.proposedIssueType(ipoIntent.proposedIssueType);
  if (isPresent(issueType) && issueType !== 'Not provided') chips.push(issueType);

  const atAGlance: ProfileFieldItem[] = [];
  const glanceCandidates: Array<ProfileFieldItem | null> = [
    field('CIN', company.cin, true),
    field('Incorporated', formatIncorporationDate(company.incorporationDate)),
    field('Class', companyClass),
    field('Registered state', company.registeredState),
    field('Industry', industry),
    field('Employees', workspaceLabels.employeeCountRange(business.employeeCountRange)),
    field('Exchange target', exchange),
    field('Issue type', issueType),
    field('Timeline', workspaceLabels.targetTimeline(ipoIntent.targetTimeline)),
    field('Stage', workspaceLabels.preparationStage(ipoIntent.preparationStage)),
  ];
  for (const item of glanceCandidates) {
    if (item && item.value !== 'Not provided') atAGlance.push(item);
  }

  const overview = [
    field('Legal name', company.legalName, true),
    field('CIN', company.cin, true),
    field('Date of incorporation', formatIncorporationDate(company.incorporationDate)),
    field('Company class', companyClass),
    field('Registered state', company.registeredState),
    field('Registrar of Companies', company.registrarOfCompanies),
  ].filter((item): item is ProfileFieldItem => item !== null);

  const businessFields = [
    field('Primary industry', industry),
    field('Business sector', sector),
    field('Employee range', workspaceLabels.employeeCountRange(business.employeeCountRange)),
  ].filter((item): item is ProfileFieldItem => item !== null);

  const operationsDescription = isPresent(business.operationsDescription)
    ? business.operationsDescription.trim()
    : null;

  const ipo = buildIpo(ipoIntent);

  const addressLines = formatRegisteredOfficeLines(company.registeredOffice);
  const office = {
    addressLines: addressLines.length > 0 ? addressLines : [],
    email: isPresent(company.companyEmail) ? company.companyEmail.trim() : null,
    website: isPresent(company.companyWebsite) ? company.companyWebsite.trim() : null,
  };

  const authority: ProfileFieldItem[] = [
    {
      label: 'Authorised signatory',
      value: workspaceLabels.authorisedSignatory(representative.authorisedSignatory),
    },
    {
      label: 'Primary contact',
      value: workspaceLabels.primaryOnboardingContact(representative.primaryOnboardingContact),
    },
    {
      label: 'Basis of authority',
      value: workspaceLabels.basisOfAuthority(
        representative.basisOfAuthority,
        representative.basisOfAuthorityOther,
      ),
    },
  ].filter((item) => isPresent(item.value) && item.value !== 'Not provided');

  const registrationItems = buildRegistrations(registrations);
  const ownershipItems = buildOwnership(ownership);

  const navSections: BuiltProfileSections['navSections'] = [
    { id: 'overview', label: 'Overview' },
    { id: 'business', label: 'Business' },
  ];
  if (ipo.length > 0) navSections.push({ id: 'ipo', label: 'IPO intent' });
  if (office.addressLines.length > 0 || office.email || office.website) {
    navSections.push({ id: 'office', label: 'Office & contact' });
  }
  navSections.push({ id: 'representative', label: 'Representative' });
  if (registrationItems.length > 0) navSections.push({ id: 'registrations', label: 'Registrations' });
  if (ownershipItems.length > 0) navSections.push({ id: 'ownership', label: 'Ownership' });

  return {
    hero: {
      legalName: company.legalName,
      tagline,
      location: cityState,
      chips,
      atAGlance,
    },
    overview,
    business: { fields: businessFields, operationsDescription },
    ipo,
    office,
    representative: {
      name: user.fullName,
      designation: representative.designation,
      relationship: workspaceLabels.relationship(
        representative.relationship,
        representative.relationshipOther,
      ),
      email: user.email,
      phone: user.phone,
      authority,
    },
    registrations: registrationItems,
    ownership: ownershipItems,
    navSections,
  };
}
