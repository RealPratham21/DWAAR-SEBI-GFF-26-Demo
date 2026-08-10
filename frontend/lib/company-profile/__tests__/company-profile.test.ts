import { describe, expect, it } from 'vitest';
import { buildProfileSections } from '@/lib/company-profile/build-profile-sections';
import {
  companyMonogram,
  formatRegisteredOfficeLines,
  isPresent,
  normalizeWebsiteHref,
} from '@/lib/company-profile/utils';
import type { DashboardBootstrapResponse } from '@/lib/workspace/types';

const sampleBootstrap = {
  user: {
    id: '1',
    fullName: 'Nivara Demo User',
    email: 'nivara.demo@example.com',
    phone: '+91 98765 43210',
  },
  representative: {
    designation: 'Managing Director',
    relationship: 'director',
    relationshipOther: '',
    authorisedSignatory: 'yes',
    basisOfAuthority: 'board_resolution',
    basisOfAuthorityOther: '',
    primaryOnboardingContact: 'yes',
    addAlternateContact: false,
    alternateContact: null,
  },
  company: {
    legalName: 'Nivara Techfab Private Limited',
    cin: 'U12345MH2018PTC123456',
    incorporationDate: '2018-03-15',
    companyClass: 'private',
    registeredState: 'Maharashtra',
    registrarOfCompanies: 'Pune',
    companyEmail: 'info@nivara.example.com',
    companyWebsite: 'https://nivara.example.com',
    registeredOffice: {
      addressLine1: 'Plot 12, MIDC Chakan',
      addressLine2: '',
      locality: 'Chakan',
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pinCode: '410501',
      country: 'India',
    },
  },
  business: {
    primaryIndustry: 'manufacturing',
    primaryIndustryOther: '',
    businessSector: 'Precision components',
    operationsDescription:
      'Manufactures precision-engineered components for automotive and industrial OEM customers across western India.',
    employeeCountRange: '100-250',
  },
  registrations: {
    pan: 'ABCDE1234F',
    gstRegistrationRequired: 'yes',
    gstRegistrations: [
      {
        id: 'gst-1',
        gstin: '27ABCDE1234F1Z5',
        state: 'Maharashtra',
        principalPlaceOfBusiness: 'Pune plant',
      },
    ],
    udyamRegistration: 'UDYAM-MH-12-0012345',
    importExportCode: '',
  },
  ownership: {
    promoterCount: 2,
    directorCount: 3,
    promoterHoldingPercent: 78.5,
    nonPromoterHoldingPercent: 21.5,
    institutionalShareholdersPresent: 'no',
    foreignShareholdersPresent: 'no',
    promoterGroupEntitiesPresent: '',
  },
  ipoIntent: {
    proposedIssueType: 'fresh_issue',
    issueSizeCrore: '50',
    issueSizeNotDecided: false,
    targetTimeline: '6-12-months',
    intendedExchange: 'nse-emerge',
    primaryPurposes: ['capex', 'working_capital'],
    primaryPurposeOther: '',
    merchantBankerAppointed: 'not_yet',
    merchantBankerName: '',
    preparationStage: 'internal_preparation_started',
  },
} as unknown as DashboardBootstrapResponse;

describe('company profile utils', () => {
  it('derives monogram from legal name', () => {
    expect(companyMonogram('Nivara Techfab Private Limited')).toBe('NT');
  });

  it('formats registered office across lines', () => {
    const lines = formatRegisteredOfficeLines(sampleBootstrap.company.registeredOffice);
    expect(lines[0]).toContain('Plot 12');
    expect(lines.some((line) => line.includes('Maharashtra'))).toBe(true);
  });

  it('normalizes website href', () => {
    expect(normalizeWebsiteHref('nivara.example.com')).toBe('https://nivara.example.com');
  });

  it('detects present strings', () => {
    expect(isPresent('  value ')).toBe(true);
    expect(isPresent('')).toBe(false);
  });
});

describe('buildProfileSections', () => {
  it('builds hero and sections from bootstrap data', () => {
    const profile = buildProfileSections(sampleBootstrap);
    expect(profile.hero.legalName).toBe('Nivara Techfab Private Limited');
    expect(profile.hero.atAGlance.length).toBeGreaterThan(0);
    expect(profile.overview.some((item) => item.label === 'CIN')).toBe(true);
    expect(profile.business.operationsDescription).toContain('precision');
    expect(profile.ipo.length).toBeGreaterThan(0);
    expect(profile.registrations.some((item) => item.label === 'PAN')).toBe(true);
    expect(profile.ownership.some((item) => item.label === 'Promoter holding')).toBe(true);
    expect(profile.navSections.length).toBeGreaterThanOrEqual(4);
  });

  it('omits empty registration identifiers', () => {
    const profile = buildProfileSections({
      ...sampleBootstrap,
      registrations: {
        pan: '',
        gstRegistrationRequired: '',
        gstRegistrations: [],
        udyamRegistration: '',
        importExportCode: '',
      },
    });
    expect(profile.registrations).toHaveLength(0);
  });
});
