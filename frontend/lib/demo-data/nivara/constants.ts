/**
 * Shared Nivara demo SME constants — keep cross-workstream coherence here.
 */

export const NIVARA_ISSUER = {
  legalName: 'Nivara Techfab Private Limited',
  shortName: 'Nivara Techfab',
  cin: 'U29309MH2019PTC328517',
  pan: 'AABCN1234Q',
  incorporationDate: '2019-06-12',
  incorporationCity: 'Pune',
  incorporationState: 'Maharashtra',
  registrarOfCompanies: 'Registrar of Companies, Pune',
  registeredOfficeLine1: 'Unit No. 14, Meridian Industrial Estate',
  registeredOfficeLine2: 'MIDC Bhosari',
  registeredOfficeLocality: 'Bhosari',
  registeredOfficeCity: 'Pune',
  registeredOfficeDistrict: 'Pune',
  registeredOfficeState: 'Maharashtra',
  registeredOfficePin: '411026',
  email: 'compliance@nivara-demo.example',
  website: 'https://nivara-demo.example',
  telephone: '2045678901',
  udyam: 'UDYAM-MH-19-0048721',
} as const;

export const NIVARA_FINANCIAL_PERIODS = {
  fy2022End: '2022-03-31',
  fy2023End: '2023-03-31',
  fy2024End: '2024-03-31',
  reportingCurrency: 'INR',
  amountUnit: 'lakh',
} as const;

export const NIVARA_CAPITAL = {
  equityClassId: 'nivara-equity-ordinary',
  faceValuePerShare: '10',
  preIssueEquityShares: '4500000',
  freshIssueShares: '1500000',
  postIssueEquityShares: '6000000',
  authorisedEquityShares: '8000000',
  paidUpEquityCapital: '45000000',
  proposedIssuePrice: '120',
  freshIssueAmountCrore: '18',
  totalOfferAmountCrore: '18',
} as const;

export const NIVARA_IPO = {
  targetSmePlatform: 'nse-emerge',
  issueMethod: 'book-built',
  offerType: 'fresh-issue',
  targetFilingQuarter: 'Q3',
  targetFilingFinancialYear: '2025-26',
} as const;

/** Deterministic person / entity IDs used across fixtures. */
export const NIVARA_IDS = {
  promoter001: 'nivara-promoter-001',
  promoter002: 'nivara-promoter-002',
  director001: 'nivara-director-001',
  director002: 'nivara-director-002',
  director003: 'nivara-director-003',
  kmpCfo: 'nivara-kmp-cfo-001',
  kmpCs: 'nivara-kmp-cs-001',
  groupEntity001: 'nivara-group-entity-001',
  facility001: 'nivara-facility-001',
  charge001: 'nivara-charge-001',
  property001: 'nivara-property-001',
  contract001: 'nivara-contract-001',
  matter001: 'nivara-matter-001',
  approval001: 'nivara-approval-001',
  intermediary001: 'nivara-intermediary-001',
  intermediary002: 'nivara-intermediary-002',
  intermediary003: 'nivara-intermediary-003',
  filing001: 'nivara-filing-001',
  documentVersion001: 'nivara-document-version-001',
  corporateEvent001: 'nivara-corporate-event-001',
  office001: 'nivara-office-001',
  registrationPan: 'nivara-registration-pan',
  registrationUdyam: 'nivara-registration-udyam',
  shareholder001: 'nivara-shareholder-001',
  shareholder002: 'nivara-shareholder-002',
  object001: 'nivara-object-001',
  object002: 'nivara-object-002',
} as const;

export const NIVARA_PEOPLE = {
  promoter1: { name: 'Arjun Mehta', din: '01234567' },
  promoter2: { name: 'Priya Deshmukh', din: '07654321' },
  director3: { name: 'Rahul Kulkarni', din: '03456789' },
  cfo: { name: 'Neha Patil' },
  companySecretary: { name: 'Sanjay Rao' },
} as const;

export const NIVARA_BUSINESS = {
  primaryIndustry: 'Precision metal components and electromechanical assemblies',
  primaryFacility: 'Meridian Industrial Estate, Bhosari, Pune',
  primaryCustomerSegment: 'Automotive and industrial OEM suppliers',
} as const;

export const NIVARA_BORROWINGS = {
  termLoanLender: 'HDFC Bank Limited',
  termLoanSanctioned: '1200000000',
  termLoanOutstanding: '850000000',
  facilityLabel: 'Term Loan — Capex Phase II',
} as const;
