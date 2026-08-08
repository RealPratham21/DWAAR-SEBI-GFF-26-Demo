import {
  createEmptyClaimRecord,
  createEmptyCompetitorRecord,
  createEmptyDemandDriverRecord,
  createEmptyEntryBarrierRecord,
  createEmptyGovernmentPolicyRecord,
  createEmptyIndustryMarketPayload,
  createEmptyIndustryRiskRecord,
  createEmptyMacroeconomicIndicatorRecord,
  createEmptyMarketSegmentationRecord,
  createEmptyMarketSeriesPeriodValue,
  createEmptyMarketSeriesRecord,
  createEmptyMarketShareRecord,
  createEmptyOutlookRecord,
  createEmptySourceRecord,
  createEmptyValueChainStageRecord,
} from '@/lib/industry-market/defaults';
import type { IndustryMarketPayload } from '@/lib/schemas/industry-market';
import {
  NIVARA_BUSINESS,
  NIVARA_FINANCIAL_PERIODS,
  NIVARA_ISSUER,
} from '@/lib/demo-data/nivara/constants';

const NIVARA_INDUSTRY_SOURCE_ID = 'nivara-industry-source-001';
const NIVARA_MARKET_SERIES_ID = 'nivara-market-series-001';
const NIVARA_MARKET_SEGMENT_ID = 'nivara-market-segment-001';
const NIVARA_MACRO_INDICATOR_ID = 'nivara-macro-indicator-001';
const NIVARA_DEMAND_DRIVER_ID = 'nivara-demand-driver-001';
const NIVARA_GOVERNMENT_POLICY_ID = 'nivara-government-policy-001';
const NIVARA_VALUE_CHAIN_STAGE_ID = 'nivara-value-chain-stage-001';
const NIVARA_ENTRY_BARRIER_ID = 'nivara-entry-barrier-001';
const NIVARA_COMPETITOR_ID = 'nivara-competitor-001';
const NIVARA_MARKET_SHARE_ID = 'nivara-market-share-001';
const NIVARA_CLAIM_ID = 'nivara-industry-claim-001';
const NIVARA_OUTLOOK_ID = 'nivara-outlook-001';
const NIVARA_INDUSTRY_RISK_ID = 'nivara-industry-risk-001';

export function createNivaraIndustryMarketPayload(): IndustryMarketPayload {
  const base = createEmptyIndustryMarketPayload();

  const researchSource = {
    ...createEmptySourceRecord(NIVARA_INDUSTRY_SOURCE_ID),
    sourceType: 'public-research-report',
    title: 'India Precision Components & Automotive Supplier Market Outlook (Placeholder)',
    publisherAuthor: 'Industry Research Provider — Demo Placeholder',
    publicationDate: '2024-06-30',
    dataCutOffDate: NIVARA_FINANCIAL_PERIODS.fy2024End,
    geographyCovered: 'India',
    industryCovered: 'Precision metal components and automotive supplier ecosystem',
    historicalPeriodCovered: 'FY2020–FY2024',
    forecastPeriodCovered: 'FY2025–FY2029',
    currency: NIVARA_FINANCIAL_PERIODS.reportingCurrency,
    unit: NIVARA_FINANCIAL_PERIODS.amountUnit,
    dataNature: 'estimated',
    sourceReadinessStatus: 'pending_verification',
    notes: 'Placeholder third-party source for demo; commissioned report workflow not yet initiated.',
  };

  const marketSeries = {
    ...createEmptyMarketSeriesRecord(NIVARA_MARKET_SERIES_ID),
    marketName: 'India precision components for automotive OEM supply chain',
    marketDefinition:
      'Organised market for precision machined and fabricated metal components supplied to automotive and industrial OEM tiers in India.',
    geography: 'india',
    metric: 'revenue-value',
    currency: NIVARA_FINANCIAL_PERIODS.reportingCurrency,
    unit: 'crore',
    nominalReal: 'nominal',
    primarySourceId: NIVARA_INDUSTRY_SOURCE_ID,
    periodValues: [
      {
        ...createEmptyMarketSeriesPeriodValue('nivara-market-period-fy2022'),
        period: 'FY2022',
        value: '18500',
        actualEstimateForecast: 'actual',
        sourceId: NIVARA_INDUSTRY_SOURCE_ID,
      },
      {
        ...createEmptyMarketSeriesPeriodValue('nivara-market-period-fy2023'),
        period: 'FY2023',
        value: '20100',
        actualEstimateForecast: 'actual',
        sourceId: NIVARA_INDUSTRY_SOURCE_ID,
      },
      {
        ...createEmptyMarketSeriesPeriodValue('nivara-market-period-fy2024'),
        period: 'FY2024',
        value: '21800',
        actualEstimateForecast: 'estimate',
        sourceId: NIVARA_INDUSTRY_SOURCE_ID,
      },
    ],
    forecastMetadata: {
      ...createEmptyMarketSeriesRecord().forecastMetadata,
      forecastStartPeriod: 'FY2025',
      forecastEndPeriod: 'FY2029',
      reportedCagr: '8.5',
      forecastSourceId: NIVARA_INDUSTRY_SOURCE_ID,
      keyAssumptions: 'Automotive production recovery and domestic component localisation trends',
      scenario: 'base',
    },
    notes: 'Illustrative market size series for Nivara demo — professional verification pending.',
  };

  const marketSegment = {
    ...createEmptyMarketSegmentationRecord(NIVARA_MARKET_SEGMENT_ID),
    parentMarketSeriesId: NIVARA_MARKET_SERIES_ID,
    segmentationDimension: 'application',
    segmentName: 'Automotive precision assemblies and machined components',
    period: 'FY2024',
    marketSize: '9200',
    growthRate: '9.2',
    sourceId: NIVARA_INDUSTRY_SOURCE_ID,
    relevanceToIssuer: 'Primary addressable segment for Nivara Techfab OEM supply contracts',
  };

  const macroIndicator = {
    ...createEmptyMacroeconomicIndicatorRecord(NIVARA_MACRO_INDICATOR_ID),
    indicatorName: 'India automotive production index',
    category: 'industrial-production',
    geography: 'India',
    period: 'FY2024',
    value: '108.5',
    unit: 'Index (FY2019=100)',
    actualEstimateForecast: 'estimate',
    sourceId: NIVARA_INDUSTRY_SOURCE_ID,
    relevanceExplanation: 'Proxy for demand in precision automotive component supply chain.',
  };

  const demandDriver = {
    ...createEmptyDemandDriverRecord(NIVARA_DEMAND_DRIVER_ID),
    title: 'Domestic automotive production and localisation',
    category: 'economic',
    description:
      'OEM production volumes and component localisation policies drive demand for precision suppliers.',
    mechanismAffectingDemand: 'Higher vehicle output increases Tier-II component offtake',
    geography: 'India',
    sourceId: NIVARA_INDUSTRY_SOURCE_ID,
    relevanceToIssuer: 'Primary demand driver for Nivara Bhosari manufacturing operations.',
  };

  const governmentPolicy = {
    ...createEmptyGovernmentPolicyRecord(NIVARA_GOVERNMENT_POLICY_ID),
    policyScheme: 'Automotive component localisation incentives',
    governmentRegulator: 'Ministry of Heavy Industries',
    effectiveDate: '2021-04-01',
    applicableMarket: 'Automotive components — India',
    nature: 'incentive',
    marketImpact: 'Supports domestic sourcing by OEM tiers',
    currentStatus: 'active',
    sourceId: NIVARA_INDUSTRY_SOURCE_ID,
    notes: 'Policy context for domestic precision component demand.',
  };

  const valueChainStage = {
    ...createEmptyValueChainStageRecord(NIVARA_VALUE_CHAIN_STAGE_ID),
    sequenceOrder: '3',
    name: 'Precision component manufacturing',
    description: 'Machining, fabrication and sub-assembly of metal components for OEM tiers.',
    majorParticipantTypes: 'SME and mid-market precision manufacturers',
    issuerParticipates: 'yes',
    sourceId: NIVARA_INDUSTRY_SOURCE_ID,
    notes: 'Stage where Nivara Techfab primarily operates.',
  };

  const entryBarrier = {
    ...createEmptyEntryBarrierRecord(NIVARA_ENTRY_BARRIER_ID),
    barrierType: 'vendor-qualification',
    description: 'IATF 16949 and OEM approval cycles create entry barriers for new suppliers.',
    strength: 'moderate',
    relevanceToIssuer: 'Existing certifications support customer retention',
    sourceId: NIVARA_INDUSTRY_SOURCE_ID,
    notes: 'Quality certification barrier relevant to Nivara OEM supply relationships.',
  };

  const competitor = {
    ...createEmptyCompetitorRecord(NIVARA_COMPETITOR_ID),
    companyName: 'Western India Precision Components Pvt. Ltd. (Illustrative)',
    listedUnlisted: 'unlisted',
    publicPrivate: 'private',
    country: 'India',
    headquarters: 'Pune, Maharashtra',
    industrySubIndustry: 'Automotive precision components',
    relevantProductsServices: 'Machined transmission and braking components',
    relevantGeography: 'Western India',
    sourceId: NIVARA_INDUSTRY_SOURCE_ID,
    notes: 'Illustrative unlisted peer for demo competitive landscape.',
  };

  const marketShareRecord = {
    ...createEmptyMarketShareRecord(NIVARA_MARKET_SHARE_ID),
    metricBasis: 'revenue',
    marketDefinition: 'India automotive precision components — organised segment',
    geography: 'India',
    segment: 'Automotive precision components',
    period: 'FY2024',
    issuerNumerator: '42',
    totalMarketDenominator: '9200',
    denominatorSourceId: NIVARA_INDUSTRY_SOURCE_ID,
    reportedMarketShare: '0.46',
    notes: 'Illustrative market share for demo — professional verification pending.',
  };

  const claim = {
    ...createEmptyClaimRecord(NIVARA_CLAIM_ID),
    exactProposedWording: 'Among organised precision component suppliers in western India',
    claimType: 'leading',
    metric: 'regional-presence',
    geography: 'Western India',
    marketDefinition: 'Organised automotive precision component suppliers',
    periodDate: NIVARA_FINANCIAL_PERIODS.fy2024End,
    sourceId: NIVARA_INDUSTRY_SOURCE_ID,
    notes: 'Conservative positioning claim for demo DRHP industry section.',
  };

  const outlookRecord = {
    ...createEmptyOutlookRecord(NIVARA_OUTLOOK_ID),
    market: 'India automotive precision components',
    geography: 'India',
    outlookPeriod: 'FY2025–FY2029',
    currentMarketSize: '9200',
    expectedMarketSize: '13800',
    expectedCagr: '8.5',
    structuralChanges: 'Continued OEM localisation and quality certification requirements',
    sourceId: NIVARA_INDUSTRY_SOURCE_ID,
    dataNature: 'issuer-expectation',
    notes: 'Base-case outlook aligned with placeholder research source.',
  };

  const industryRisk = {
    ...createEmptyIndustryRiskRecord(NIVARA_INDUSTRY_RISK_ID),
    title: 'Automotive production cyclicality',
    category: 'demand-cyclicality',
    description: 'OEM production slowdowns can reduce component offtake for precision suppliers.',
    segmentsAffected: 'Automotive precision components',
    sourceId: NIVARA_INDUSTRY_SOURCE_ID,
    notes: 'Key industry risk relevant to Nivara customer concentration.',
  };

  return {
    ...base,
    industryScopeAndCompanyMarketMapping: {
      ...base.industryScopeAndCompanyMarketMapping,
      industryClassification: {
        ...base.industryScopeAndCompanyMarketMapping.industryClassification,
        primaryIndustry: NIVARA_BUSINESS.primaryIndustry,
        primarySubIndustry: 'Automotive and industrial precision components',
        classificationSource: 'internal-classification',
        classificationCode: '25999',
        industryDescription:
          'Manufacture of precision metal components, electromechanical assemblies and related industrial products for automotive OEM tiers.',
        subIndustryDescription:
          'Tier-II/Tier-III supplier of machined and fabricated components to automotive and industrial OEM customers.',
      },
      marketDefinition: {
        ...base.industryScopeAndCompanyMarketMapping.marketDefinition,
        marketName: 'India precision components — automotive supplier segment',
        marketDescription:
          'Organised suppliers of precision metal components serving automotive and industrial OEM customers in India.',
        productServiceCategory: 'Precision metal components and electromechanical assemblies',
        relevantValueChainStage: 'Component manufacturing and sub-assembly',
        geography: 'india',
        geographyDetail: 'Maharashtra and western India industrial clusters',
        endUserCustomerSegment: NIVARA_BUSINESS.primaryCustomerSegment,
        channelScope: 'Direct OEM and tier supplier relationships',
        organisedUnorganisedScope: 'Organised SME and mid-market suppliers',
        b2bB2cB2gScope: 'B2B',
        marketBoundaryExplanation:
          'Excludes full vehicle assembly; focuses on component and sub-assembly supply to OEM tiers.',
        relevanceToIssuerExplanation: `${NIVARA_ISSUER.shortName} operates primarily in this segment from its Bhosari facility.`,
      },
      companyMarketMappings: [
        {
          id: 'nivara-company-market-mapping-001',
          marketSegment: 'Automotive precision components',
          linkedProductServiceIds: [],
          linkedBusinessSegmentIds: [],
          customerIndustries: ['Automotive OEM', 'Industrial equipment'],
          geographies: ['India — Western region'],
          salesChannels: ['Direct OEM supply'],
          linkedFacilityIds: [],
          relevantRevenueContribution: '85',
          relevantGeography: 'India',
          directIndirectParticipation: 'Direct',
          natureOfParticipation: 'Manufacturer and assembler',
          materiality: 'Primary business',
          relevantFinancialPeriod: NIVARA_FINANCIAL_PERIODS.fy2024End,
          notes: 'Mapping aligned with Nivara Bhosari manufacturing operations.',
        },
      ],
    },
    researchSourcesAndIndustryReportGovernance: {
      ...base.researchSourcesAndIndustryReportGovernance,
      sources: [researchSource],
      notes: 'Single placeholder public research source for demo industry section.',
    },
    macroeconomicAndIndustryContext: {
      ...base.macroeconomicAndIndustryContext,
      macroeconomicIndicators: [macroIndicator],
      industryEvolution: {
        ...base.macroeconomicAndIndustryContext.industryEvolution,
        industryOriginDevelopment:
          'Precision component supply chain evolved with domestic automotive OEM expansion from 2000s.',
        structuralEvolution:
          'Shift from import dependence to organised domestic Tier-II supplier base.',
        digitalisation: 'CNC automation and quality traceability adoption across SME suppliers.',
        importantRegulatoryChanges: 'Quality and localisation norms tightened for OEM sourcing.',
      },
      notes: 'Macro and industry context for Nivara addressable market.',
    },
    marketSizeSegmentationAndGrowth: {
      ...base.marketSizeSegmentationAndGrowth,
      marketSeries: [marketSeries],
      marketSegmentations: [marketSegment],
    },
    demandDriversEndMarketsTrendsAndPolicy: {
      ...base.demandDriversEndMarketsTrendsAndPolicy,
      demandDrivers: [demandDriver],
      endMarkets: [
        {
          id: 'nivara-end-market-001',
          endUserIndustry: 'Automotive OEM and tier suppliers',
          geography: 'India',
          currentSize: '9200',
          growth: '9.2',
          shareOfIssuerRelevantDemand: '85',
          demandCharacteristics: 'Quality-certified, just-in-time component supply',
          cyclicalDefensive: 'cyclical',
          seasonality: 'Moderate Q4 automotive production seasonality',
          keyPurchasingFactors: 'Quality, delivery reliability, tooling capability, cost',
          sourceId: NIVARA_INDUSTRY_SOURCE_ID,
          linkedBusinessOperationsCustomerIndustry: '',
          notes: 'Primary end market for Nivara precision components.',
        },
      ],
      governmentPolicies: [governmentPolicy],
      notes: 'Demand drivers, end markets and policy context for Nivara industry section.',
    },
    valueChainSupplyStructureAndEntryBarriers: {
      ...base.valueChainSupplyStructureAndEntryBarriers,
      valueChainStages: [valueChainStage],
      supplySideStructure: {
        ...base.valueChainSupplyStructureAndEntryBarriers.supplySideStructure,
        majorRawMaterialsInputs: 'Alloy steel, aluminium billets, fasteners and consumables',
        notes: 'Key inputs for precision component manufacturing.',
      },
      entryBarriers: [entryBarrier],
      notes: 'Value chain stage mapping for Nivara operating position.',
    },
    competitionMarketShareAndIssuerPositioning: {
      ...base.competitionMarketShareAndIssuerPositioning,
      competitors: [competitor],
      marketShareRecords: [marketShareRecord],
      claims: [claim],
      notes: 'Illustrative competitive landscape and market share for demo.',
    },
    outlookIndustryRisksAndConfirmations: {
      ...base.outlookIndustryRisksAndConfirmations,
      outlookRecords: [outlookRecord],
      industryRisks: [industryRisk],
      confirmations: {
        industryScopeReflectsActualIssuerBusiness: true,
        marketDefinitionNotIntentionallyOverstated: true,
        materialIndustryClaimsHaveSources: true,
        sourcePublicationAccessDatesRecorded: true,
        historicalDataAndForecastsDistinguished: true,
        commissionedReportStatusDisclosed: true,
        researchProviderRelationshipDisclosed: true,
        methodologyLimitationsCaptured: true,
        industrySegmentsNotConfusedWithAccountingSegments: true,
        competitorListIsReasonable: true,
        marketShareNumeratorDenominatorDefinitionsMatch: true,
        comparatorUniversesDefined: true,
        leadingLargestTopClaimsSourced: true,
        conflictingMarketDataIdentified: true,
        staleDataFlagged: true,
        policySchemeStatusCurrent: true,
        companyOperationalDataReconcilesWithLinkedWorkstreams: true,
        professionalMerchantBankerReviewRemainsRequired: true,
      },
      notes: 'Industry outlook, risks and confirmations for demo DRHP section.',
    },
  } as IndustryMarketPayload;
}
