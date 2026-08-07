/**
 * UI option arrays and label maps for Industry & Market.
 *
 * Assessment states (lib-only, not persisted in schema):
 * - substantiated
 * - potential_inconsistency
 * - missing_information
 * - missing_source
 * - stale_source
 * - methodology_concern
 * - conflicting_sources
 * - pending_industry_report
 * - pending_linked_workstream
 * - pending_professional_confirmation
 * - not_applicable
 */

import {
  ACTUAL_ESTIMATE_FORECAST_VALUES,
  BARRIER_STRENGTH_VALUES,
  BARRIER_TYPE_VALUES,
  CLAIM_STATUS_VALUES,
  CLAIM_TYPE_VALUES,
  CLASSIFICATION_SOURCE_VALUES,
  COMMISSIONED_REPORT_PURPOSE_VALUES,
  COMPETITOR_METRIC_TYPE_VALUES,
  CYCLICAL_DEFENSIVE_VALUES,
  DATA_NATURE_VALUES,
  DEMAND_DRIVER_CATEGORY_VALUES,
  FORECAST_SCENARIO_VALUES,
  GEOGRAPHY_VALUES,
  INDUSTRY_RISK_CATEGORY_VALUES,
  MACRO_INDICATOR_CATEGORY_VALUES,
  MARKET_METRIC_VALUES,
  MARKET_SHARE_METRIC_BASIS_VALUES,
  NOMINAL_REAL_VALUES,
  NUMERATOR_SOURCE_VALUES,
  OUTLOOK_DATA_NATURE_VALUES,
  POLICY_NATURE_VALUES,
  SCOPE_EXCLUSION_TYPE_VALUES,
  SEGMENTATION_DIMENSION_VALUES,
  SOURCE_READINESS_STATUS_VALUES,
  SOURCE_TYPE_VALUES,
  TREND_TIMELINE_STATUS_VALUES,
  YES_NO_NOT_SURE_VALUES,
} from '@/lib/schemas/industry-market';
import type {
  IndustryMarketConfirmations,
  IndustryMarketSectionId,
} from '@/lib/schemas/industry-market';

export type SelectOption = { value: string; label: string };

export const INDUSTRY_MARKET_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'information', label: 'Information' },
  { id: 'industry-assessment', label: 'Industry Assessment' },
] as const;

export type IndustryMarketTabId = (typeof INDUSTRY_MARKET_TABS)[number]['id'];

export const TABS = INDUSTRY_MARKET_TABS;

export const INDUSTRY_MARKET_INFORMATION_SECTIONS: Array<{
  id: IndustryMarketSectionId;
  label: string;
  description: string;
}> = [
  {
    id: 'industry-scope-and-company-market-mapping',
    label: 'Industry Scope & Company-to-Market Mapping',
    description:
      'Industry classification, market definition, issuer mapping and scope exclusions.',
  },
  {
    id: 'research-sources-and-industry-report-governance',
    label: 'Research Sources & Industry Report Governance',
    description:
      'Master source registry with commissioned-report governance, methodology and readiness status.',
  },
  {
    id: 'macroeconomic-and-industry-context',
    label: 'Macroeconomic & Industry Context',
    description:
      'Macroeconomic indicators, industry evolution narrative and milestone register.',
  },
  {
    id: 'market-size-segmentation-and-growth',
    label: 'Market Size, Segmentation & Growth',
    description:
      'Market series with period values, segmentation dimensions and segment-to-issuer mapping.',
  },
  {
    id: 'demand-drivers-end-markets-trends-and-policy',
    label: 'Demand Drivers, End Markets, Trends & Policy',
    description:
      'Demand drivers, end-user markets, industry trends and government policy/scheme register.',
  },
  {
    id: 'value-chain-supply-structure-and-entry-barriers',
    label: 'Value Chain, Supply Structure & Entry Barriers',
    description:
      'Value-chain stages, supply-side structure, industry capacity and entry barriers.',
  },
  {
    id: 'competition-market-share-and-issuer-positioning',
    label: 'Competition, Market Share & Issuer Positioning',
    description:
      'Competitor master, operating metrics, market-share calculations and claims register.',
  },
  {
    id: 'outlook-industry-risks-and-confirmations',
    label: 'Outlook, Industry Risks & Confirmations',
    description:
      'Industry outlook, risks/challenges, conflicting research register and issuer confirmations.',
  },
];

export const INFORMATION_SECTIONS = INDUSTRY_MARKET_INFORMATION_SECTIONS;

export const INDUSTRY_MARKET_SECTION_LABELS: Record<IndustryMarketSectionId, string> = {
  'industry-scope-and-company-market-mapping': 'Industry Scope & Company-to-Market Mapping',
  'research-sources-and-industry-report-governance':
    'Research Sources & Industry Report Governance',
  'macroeconomic-and-industry-context': 'Macroeconomic & Industry Context',
  'market-size-segmentation-and-growth': 'Market Size, Segmentation & Growth',
  'demand-drivers-end-markets-trends-and-policy':
    'Demand Drivers, End Markets, Trends & Policy',
  'value-chain-supply-structure-and-entry-barriers':
    'Value Chain, Supply Structure & Entry Barriers',
  'competition-market-share-and-issuer-positioning':
    'Competition, Market Share & Issuer Positioning',
  'outlook-industry-risks-and-confirmations': 'Outlook, Industry Risks & Confirmations',
};

function optionsFrom(values: readonly string[], labels: Record<string, string>): SelectOption[] {
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

export const YES_NO_NOT_SURE_LABELS: Record<(typeof YES_NO_NOT_SURE_VALUES)[number], string> = {
  yes: 'Yes',
  no: 'No',
  not_sure: 'Not sure',
};

export const CLASSIFICATION_SOURCE_LABELS: Record<
  (typeof CLASSIFICATION_SOURCE_VALUES)[number],
  string
> = {
  nic: 'NIC',
  'government-classification': 'Government classification',
  'exchange-sector-classification': 'Exchange / sector classification',
  'research-provider-taxonomy': 'Research-provider taxonomy',
  'internal-classification': 'Internal classification',
  other: 'Other',
};

export const GEOGRAPHY_LABELS: Record<(typeof GEOGRAPHY_VALUES)[number], string> = {
  india: 'India',
  'specific-state': 'Specific state',
  'specific-region': 'Specific region',
  global: 'Global',
  'india-export-markets': 'India + export markets',
  other: 'Other',
};

export const SOURCE_TYPE_LABELS: Record<(typeof SOURCE_TYPE_VALUES)[number], string> = {
  'commissioned-industry-report': 'Commissioned industry report',
  'government-publication': 'Government publication',
  'regulatory-publication': 'Regulatory publication',
  'industry-association': 'Industry association',
  'multilateral-institution': 'Multilateral institution',
  'academic-publication': 'Academic publication',
  'company-filing': 'Company filing',
  'exchange-filing': 'Exchange filing',
  'paid-database': 'Paid database',
  'public-research-report': 'Public research report',
  'news-publication': 'News / publication',
  'internal-company-information': 'Internal company information',
  other: 'Other',
};

export const DATA_NATURE_LABELS: Record<(typeof DATA_NATURE_VALUES)[number], string> = {
  actual: 'Actual',
  estimated: 'Estimated',
  'forecast-projected': 'Forecast / projected',
  'survey-based': 'Survey-based',
  modelled: 'Modelled',
  derived: 'Derived',
  'management-estimate': 'Management estimate',
};

export const SOURCE_READINESS_STATUS_LABELS: Record<
  (typeof SOURCE_READINESS_STATUS_VALUES)[number],
  string
> = {
  current: 'Current',
  potentially_stale: 'Potentially stale',
  superseded: 'Superseded',
  methodology_unclear: 'Methodology unclear',
  pending_verification: 'Pending verification',
  professional_confirmation_required: 'Professional confirmation required',
};

export const MARKET_METRIC_LABELS: Record<(typeof MARKET_METRIC_VALUES)[number], string> = {
  'revenue-value': 'Revenue / value',
  volume: 'Volume',
  'installed-base': 'Installed base',
  'units-sold': 'Units sold',
  production: 'Production',
  consumption: 'Consumption',
  capacity: 'Capacity',
  transactions: 'Transactions',
  users: 'Users',
  'aum-assets': 'AUM / assets',
  'stores-outlets': 'Stores / outlets',
  beds: 'Beds',
  other: 'Other',
};

export const ACTUAL_ESTIMATE_FORECAST_LABELS: Record<
  (typeof ACTUAL_ESTIMATE_FORECAST_VALUES)[number],
  string
> = {
  actual: 'Actual',
  estimate: 'Estimate',
  forecast: 'Forecast',
};

export const SEGMENTATION_DIMENSION_LABELS: Record<
  (typeof SEGMENTATION_DIMENSION_VALUES)[number],
  string
> = {
  product: 'Product',
  service: 'Service',
  'customer-end-user': 'Customer / end-user',
  geography: 'Geography',
  'price-tier': 'Price tier',
  channel: 'Channel',
  technology: 'Technology',
  'organised-unorganised': 'Organised / unorganised',
  application: 'Application',
  'industry-vertical': 'Industry vertical',
  other: 'Other',
};

export const DEMAND_DRIVER_CATEGORY_LABELS: Record<
  (typeof DEMAND_DRIVER_CATEGORY_VALUES)[number],
  string
> = {
  economic: 'Economic',
  demographic: 'Demographic',
  'consumer-behaviour': 'Consumer behaviour',
  technology: 'Technology',
  regulatory: 'Regulatory',
  'government-spending': 'Government spending',
  infrastructure: 'Infrastructure',
  digitisation: 'Digitisation',
  export: 'Export',
  'import-substitution': 'Import substitution',
  environmental: 'Environmental',
  'financing-credit': 'Financing / credit',
  other: 'Other',
};

export const POLICY_NATURE_LABELS: Record<(typeof POLICY_NATURE_VALUES)[number], string> = {
  incentive: 'Incentive',
  subsidy: 'Subsidy',
  mandate: 'Mandate',
  tariff: 'Tariff',
  'import-restriction': 'Import restriction',
  'export-support': 'Export support',
  'procurement-scheme': 'Procurement scheme',
  'tax-support': 'Tax support',
  other: 'Other',
};

export const BARRIER_TYPE_LABELS: Record<(typeof BARRIER_TYPE_VALUES)[number], string> = {
  'capital-intensity': 'Capital intensity',
  'technology-ip': 'Technology / IP',
  brand: 'Brand',
  distribution: 'Distribution',
  'regulatory-approvals': 'Regulatory approvals',
  'customer-relationships': 'Customer relationships',
  'vendor-qualification': 'Vendor qualification',
  scale: 'Scale',
  'network-effect': 'Network effect',
  data: 'Data',
  'switching-costs': 'Switching costs',
  'skilled-labour': 'Skilled labour',
  'raw-material-access': 'Raw-material access',
  'working-capital': 'Working capital',
  other: 'Other',
};

export const BARRIER_STRENGTH_LABELS: Record<(typeof BARRIER_STRENGTH_VALUES)[number], string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  'source-does-not-quantify': 'Source does not quantify',
};

export const CLAIM_TYPE_LABELS: Record<(typeof CLAIM_TYPE_VALUES)[number], string> = {
  largest: 'Largest',
  leading: 'Leading',
  'fastest-growing': 'Fastest-growing',
  'top-x': 'Top X',
  only: 'Only',
  'market-share-claim': 'Market-share claim',
  'scale-claim': 'Scale claim',
  'growth-claim': 'Growth claim',
  other: 'Other',
};

export const CLAIM_STATUS_LABELS: Record<(typeof CLAIM_STATUS_VALUES)[number], string> = {
  substantiated: 'Substantiated',
  potentially_substantiated: 'Potentially substantiated',
  insufficient_source: 'Insufficient source',
  stale_source: 'Stale source',
  contradictory_sources: 'Contradictory sources',
  professional_confirmation_required: 'Professional confirmation required',
  do_not_use: 'Do not use',
};

export const COMPETITOR_METRIC_TYPE_LABELS: Record<
  (typeof COMPETITOR_METRIC_TYPE_VALUES)[number],
  string
> = {
  'revenue-in-relevant-market': 'Revenue in relevant market',
  volume: 'Volume',
  capacity: 'Capacity',
  'installed-base': 'Installed base',
  stores: 'Stores',
  customers: 'Customers',
  orders: 'Orders',
  production: 'Production',
  'assets-aum': 'Assets / AUM',
  beds: 'Beds',
  locations: 'Locations',
  other: 'Other',
};

export const SCOPE_EXCLUSION_TYPE_LABELS: Record<
  (typeof SCOPE_EXCLUSION_TYPE_VALUES)[number],
  string
> = {
  'adjacent-market-excluded': 'Adjacent market excluded',
  'upstream-market-excluded': 'Upstream market excluded',
  'downstream-market-excluded': 'Downstream market excluded',
  'geography-excluded': 'Geography excluded',
  'product-category-excluded': 'Product / category excluded',
  other: 'Other',
};

export const MACRO_INDICATOR_CATEGORY_LABELS: Record<
  (typeof MACRO_INDICATOR_CATEGORY_VALUES)[number],
  string
> = {
  gdp: 'GDP',
  'gdp-growth': 'GDP growth',
  'private-consumption': 'Private consumption',
  'industrial-production': 'Industrial production',
  inflation: 'Inflation',
  'interest-rates': 'Interest rates',
  urbanisation: 'Urbanisation',
  'population-demographics': 'Population / demographics',
  'disposable-income': 'Disposable income',
  'infrastructure-spending': 'Infrastructure spending',
  'credit-growth': 'Credit growth',
  'digital-adoption': 'Digital adoption',
  'export-growth': 'Export growth',
  other: 'Other',
};

export const FORECAST_SCENARIO_LABELS: Record<(typeof FORECAST_SCENARIO_VALUES)[number], string> = {
  base: 'Base',
  upside: 'Upside',
  downside: 'Downside',
  'not-specified': 'Not specified',
};

export const NOMINAL_REAL_LABELS: Record<(typeof NOMINAL_REAL_VALUES)[number], string> = {
  nominal: 'Nominal',
  real: 'Real',
};

export const COMMISSIONED_REPORT_PURPOSE_LABELS: Record<
  (typeof COMMISSIONED_REPORT_PURPOSE_VALUES)[number],
  string
> = {
  'specifically-for-ipo': 'Specifically for IPO',
  'existing-research-subscription': 'Existing research / subscription',
  other: 'Other',
};

export const NUMERATOR_SOURCE_LABELS: Record<(typeof NUMERATOR_SOURCE_VALUES)[number], string> = {
  'business-operations': 'Business & Operations',
  'financials-kpis': 'Financials & KPIs',
  'industry-report': 'Industry report',
  'certified-company-data': 'Certified company data',
  other: 'Other',
};

export const MARKET_SHARE_METRIC_BASIS_LABELS: Record<
  (typeof MARKET_SHARE_METRIC_BASIS_VALUES)[number],
  string
> = {
  revenue: 'Revenue',
  volume: 'Volume',
  units: 'Units',
  capacity: 'Capacity',
  orders: 'Orders',
  customers: 'Customers',
  'installed-base': 'Installed base',
  other: 'Other',
};

export const TREND_TIMELINE_STATUS_LABELS: Record<
  (typeof TREND_TIMELINE_STATUS_VALUES)[number],
  string
> = {
  historical: 'Historical',
  current: 'Current',
  emerging: 'Emerging',
};

export const CYCLICAL_DEFENSIVE_LABELS: Record<(typeof CYCLICAL_DEFENSIVE_VALUES)[number], string> =
  {
    cyclical: 'Cyclical',
    defensive: 'Defensive',
    mixed: 'Mixed',
    'not-sure': 'Not sure',
  };

export const OUTLOOK_DATA_NATURE_LABELS: Record<
  (typeof OUTLOOK_DATA_NATURE_VALUES)[number],
  string
> = {
  'historical-fact': 'Historical fact',
  'current-estimate': 'Current estimate',
  'third-party-forecast': 'Third-party forecast',
  'issuer-expectation': 'Issuer expectation',
};

export const INDUSTRY_RISK_CATEGORY_LABELS: Record<
  (typeof INDUSTRY_RISK_CATEGORY_VALUES)[number],
  string
> = {
  competition: 'Competition',
  'demand-cyclicality': 'Demand cyclicality',
  'raw-material-volatility': 'Raw-material volatility',
  imports: 'Imports',
  'technology-disruption': 'Technology disruption',
  regulation: 'Regulation',
  'policy-dependence': 'Policy dependence',
  'customer-concentration': 'Customer concentration',
  fragmentation: 'Fragmentation',
  'capacity-oversupply': 'Capacity oversupply',
  infrastructure: 'Infrastructure',
  'skilled-labour': 'Skilled labour',
  currency: 'Currency',
  macroeconomic: 'Macroeconomic',
  other: 'Other',
};

export const YES_NO_NOT_SURE_OPTIONS = optionsFrom(YES_NO_NOT_SURE_VALUES, YES_NO_NOT_SURE_LABELS);
export const CLASSIFICATION_SOURCE_OPTIONS = optionsFrom(
  CLASSIFICATION_SOURCE_VALUES,
  CLASSIFICATION_SOURCE_LABELS,
);
export const GEOGRAPHY_OPTIONS = optionsFrom(GEOGRAPHY_VALUES, GEOGRAPHY_LABELS);
export const SOURCE_TYPE_OPTIONS = optionsFrom(SOURCE_TYPE_VALUES, SOURCE_TYPE_LABELS);
export const DATA_NATURE_OPTIONS = optionsFrom(DATA_NATURE_VALUES, DATA_NATURE_LABELS);
export const SOURCE_READINESS_STATUS_OPTIONS = optionsFrom(
  SOURCE_READINESS_STATUS_VALUES,
  SOURCE_READINESS_STATUS_LABELS,
);
export const MARKET_METRIC_OPTIONS = optionsFrom(MARKET_METRIC_VALUES, MARKET_METRIC_LABELS);
export const ACTUAL_ESTIMATE_FORECAST_OPTIONS = optionsFrom(
  ACTUAL_ESTIMATE_FORECAST_VALUES,
  ACTUAL_ESTIMATE_FORECAST_LABELS,
);
export const SEGMENTATION_DIMENSION_OPTIONS = optionsFrom(
  SEGMENTATION_DIMENSION_VALUES,
  SEGMENTATION_DIMENSION_LABELS,
);
export const DEMAND_DRIVER_CATEGORY_OPTIONS = optionsFrom(
  DEMAND_DRIVER_CATEGORY_VALUES,
  DEMAND_DRIVER_CATEGORY_LABELS,
);
export const POLICY_NATURE_OPTIONS = optionsFrom(POLICY_NATURE_VALUES, POLICY_NATURE_LABELS);
export const BARRIER_TYPE_OPTIONS = optionsFrom(BARRIER_TYPE_VALUES, BARRIER_TYPE_LABELS);
export const BARRIER_STRENGTH_OPTIONS = optionsFrom(BARRIER_STRENGTH_VALUES, BARRIER_STRENGTH_LABELS);
export const CLAIM_TYPE_OPTIONS = optionsFrom(CLAIM_TYPE_VALUES, CLAIM_TYPE_LABELS);
export const CLAIM_STATUS_OPTIONS = optionsFrom(CLAIM_STATUS_VALUES, CLAIM_STATUS_LABELS);
export const COMPETITOR_METRIC_TYPE_OPTIONS = optionsFrom(
  COMPETITOR_METRIC_TYPE_VALUES,
  COMPETITOR_METRIC_TYPE_LABELS,
);
export const SCOPE_EXCLUSION_TYPE_OPTIONS = optionsFrom(
  SCOPE_EXCLUSION_TYPE_VALUES,
  SCOPE_EXCLUSION_TYPE_LABELS,
);
export const MACRO_INDICATOR_CATEGORY_OPTIONS = optionsFrom(
  MACRO_INDICATOR_CATEGORY_VALUES,
  MACRO_INDICATOR_CATEGORY_LABELS,
);
export const FORECAST_SCENARIO_OPTIONS = optionsFrom(
  FORECAST_SCENARIO_VALUES,
  FORECAST_SCENARIO_LABELS,
);
export const NOMINAL_REAL_OPTIONS = optionsFrom(NOMINAL_REAL_VALUES, NOMINAL_REAL_LABELS);
export const COMMISSIONED_REPORT_PURPOSE_OPTIONS = optionsFrom(
  COMMISSIONED_REPORT_PURPOSE_VALUES,
  COMMISSIONED_REPORT_PURPOSE_LABELS,
);
export const NUMERATOR_SOURCE_OPTIONS = optionsFrom(NUMERATOR_SOURCE_VALUES, NUMERATOR_SOURCE_LABELS);
export const MARKET_SHARE_METRIC_BASIS_OPTIONS = optionsFrom(
  MARKET_SHARE_METRIC_BASIS_VALUES,
  MARKET_SHARE_METRIC_BASIS_LABELS,
);
export const TREND_TIMELINE_STATUS_OPTIONS = optionsFrom(
  TREND_TIMELINE_STATUS_VALUES,
  TREND_TIMELINE_STATUS_LABELS,
);
export const CYCLICAL_DEFENSIVE_OPTIONS = optionsFrom(
  CYCLICAL_DEFENSIVE_VALUES,
  CYCLICAL_DEFENSIVE_LABELS,
);
export const OUTLOOK_DATA_NATURE_OPTIONS = optionsFrom(
  OUTLOOK_DATA_NATURE_VALUES,
  OUTLOOK_DATA_NATURE_LABELS,
);
export const INDUSTRY_RISK_CATEGORY_OPTIONS = optionsFrom(
  INDUSTRY_RISK_CATEGORY_VALUES,
  INDUSTRY_RISK_CATEGORY_LABELS,
);

export const INDUSTRY_MARKET_CONFIRMATION_FIELDS: Array<{
  key: keyof IndustryMarketConfirmations;
  label: string;
}> = [
  {
    key: 'industryScopeReflectsActualIssuerBusiness',
    label: 'Industry scope reflects actual issuer business',
  },
  {
    key: 'marketDefinitionNotIntentionallyOverstated',
    label: 'Market definition is not intentionally overstated',
  },
  {
    key: 'materialIndustryClaimsHaveSources',
    label: 'Material industry claims have sources',
  },
  {
    key: 'sourcePublicationAccessDatesRecorded',
    label: 'Source publication and access dates are recorded',
  },
  {
    key: 'historicalDataAndForecastsDistinguished',
    label: 'Historical data and forecasts are distinguished',
  },
  {
    key: 'commissionedReportStatusDisclosed',
    label: 'Commissioned-report status is disclosed',
  },
  {
    key: 'researchProviderRelationshipDisclosed',
    label: 'Research-provider relationship is disclosed',
  },
  {
    key: 'methodologyLimitationsCaptured',
    label: 'Methodology limitations are captured',
  },
  {
    key: 'industrySegmentsNotConfusedWithAccountingSegments',
    label: 'Industry segments are not confused with accounting segments',
  },
  {
    key: 'competitorListIsReasonable',
    label: 'Competitor list is reasonable',
  },
  {
    key: 'marketShareNumeratorDenominatorDefinitionsMatch',
    label: 'Market-share numerator and denominator definitions match',
  },
  {
    key: 'comparatorUniversesDefined',
    label: 'Comparator universes are defined',
  },
  {
    key: 'leadingLargestTopClaimsSourced',
    label: 'Leading / largest / top claims are sourced',
  },
  {
    key: 'conflictingMarketDataIdentified',
    label: 'Conflicting market data has been identified',
  },
  {
    key: 'staleDataFlagged',
    label: 'Stale data has been flagged',
  },
  {
    key: 'policySchemeStatusCurrent',
    label: 'Policy / scheme status is current to the best of issuer knowledge',
  },
  {
    key: 'companyOperationalDataReconcilesWithLinkedWorkstreams',
    label: 'Company operational data reconciles with linked workstreams',
  },
  {
    key: 'professionalMerchantBankerReviewRemainsRequired',
    label: 'Professional / merchant-banker review remains required',
  },
];

export const SESSION_SAVE_NOTICE_IM2 =
  'Changes are kept in this browser session only. Permanent saving will be connected in IM2.';
