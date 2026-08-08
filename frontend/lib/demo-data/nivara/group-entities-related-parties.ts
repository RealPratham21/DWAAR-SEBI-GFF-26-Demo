import {
  createEmptyCommonPursuitScreening,
  createEmptyEntityFinancialReadinessRecord,
  createEmptyEntityRecord,
  createEmptyGroupEntitiesRelatedPartiesPayload,
  createEmptyMaterialityCriterionRecord,
  createEmptyOwnershipRelationshipRecord,
  createEmptyRelatedPartyRelationshipRecord,
  createEmptyRptTransactionRecord,
} from '@/lib/group-entities-related-parties/defaults';
import type { GroupEntitiesRelatedPartiesPayload } from '@/lib/schemas/group-entities-related-parties';
import {
  NIVARA_FINANCIAL_PERIODS,
  NIVARA_IDS,
  NIVARA_ISSUER,
} from '@/lib/demo-data/nivara/constants';

const NIVARA_OWNERSHIP_RELATIONSHIP_ID = 'nivara-ownership-relationship-001';
const NIVARA_RPT_RELATIONSHIP_ID = 'nivara-rpt-relationship-001';
const NIVARA_RPT_TRANSACTION_ID = 'nivara-rpt-transaction-001';
const NIVARA_ENTITY_CLASSIFICATION_ID = 'nivara-entity-classification-001';
const NIVARA_MATERIALITY_CRITERION_ID = 'nivara-materiality-criterion-001';
const NIVARA_ENTITY_FINANCIAL_READINESS_ID = 'nivara-entity-financial-readiness-001';

export function createNivaraGroupEntitiesPayload(): GroupEntitiesRelatedPartiesPayload {
  const base = createEmptyGroupEntitiesRelatedPartiesPayload();

  const issuerEntity = {
    ...createEmptyEntityRecord(),
    id: NIVARA_IDS.issuerEntity,
    entityType: 'indian-company',
    identity: {
      legalName: NIVARA_ISSUER.legalName,
      formerName: '',
      displayName: NIVARA_ISSUER.shortName,
    },
    registration: {
      cin: NIVARA_ISSUER.cin,
      llpin: '',
      registrationNumber: '',
      otherIdentifier: '',
      countryOfIncorporation: 'India',
      state: NIVARA_ISSUER.incorporationState,
      incorporationDate: NIVARA_ISSUER.incorporationDate,
      registeredOffice: `${NIVARA_ISSUER.registeredOfficeLine1}, ${NIVARA_ISSUER.registeredOfficeCity}, ${NIVARA_ISSUER.registeredOfficeState}`,
      corporateOffice: '',
      website: NIVARA_ISSUER.website,
      financialYearEnd: 'March 31',
    },
    status: 'active',
    listing: {
      listedStatus: 'unlisted',
      exchange: '',
      securityTypeListed: '',
      listingDate: '',
      delistedStatus: '',
      delistingDate: '',
    },
    businessProfile: {
      principalBusiness: 'Manufacture of precision metal components for automotive OEMs',
      otherBusinesses: '',
      industry: 'Auto components',
      productsServices: 'Precision machined components',
      geographies: 'India',
      operationalStatus: 'Operational',
      relationshipRelevantFrom: NIVARA_ISSUER.incorporationDate,
      relationshipRelevantUntil: '',
      notes: 'Issuer entity in group structure.',
    },
    classificationBadges: ['parent'],
    currentlyActive: true,
  };

  const subsidiaryEntity = {
    ...createEmptyEntityRecord(),
    id: NIVARA_IDS.groupEntity001,
    entityType: 'indian-company',
    identity: {
      legalName: 'Nivara Precision Tools Private Limited',
      formerName: '',
      displayName: 'Nivara Precision Tools',
    },
    registration: {
      cin: 'U28999MH2020PTC345612',
      llpin: '',
      registrationNumber: '',
      otherIdentifier: '',
      countryOfIncorporation: 'India',
      state: 'Maharashtra',
      incorporationDate: '2020-03-18',
      registeredOffice: 'Bhosari, Pune, Maharashtra',
      corporateOffice: '',
      website: '',
      financialYearEnd: 'March 31',
    },
    status: 'active',
    listing: {
      listedStatus: 'unlisted',
      exchange: '',
      securityTypeListed: '',
      listingDate: '',
      delistedStatus: '',
      delistingDate: '',
    },
    businessProfile: {
      principalBusiness: 'Manufacture of precision tooling and jigs for automotive components',
      otherBusinesses: '',
      industry: 'Precision tooling',
      productsServices: 'Tooling, jigs and fixtures',
      geographies: 'India',
      operationalStatus: 'Operational',
      relationshipRelevantFrom: '2020-03-18',
      relationshipRelevantUntil: '',
      notes: 'Wholly owned subsidiary supporting parent manufacturing operations.',
    },
    classificationBadges: ['subsidiary'],
    currentlyActive: true,
  };

  const ownershipRelationship = {
    ...createEmptyOwnershipRelationshipRecord(),
    id: NIVARA_OWNERSHIP_RELATIONSHIP_ID,
    parentPartyEntityId: NIVARA_IDS.issuerEntity,
    investeeEntityId: NIVARA_IDS.groupEntity001,
    relationshipType: 'subsidiary',
    equityOwnershipPercent: '100',
    votingRightsPercent: '100',
    effectiveFrom: '2020-03-18',
    currentHistorical: 'current',
    managementControlRights: 'yes',
    notes: `${NIVARA_ISSUER.legalName} holds 100% equity in subsidiary.`,
  };

  const relatedPartyRelationship = {
    ...createEmptyRelatedPartyRelationshipRecord(),
    id: NIVARA_RPT_RELATIONSHIP_ID,
    partyType: 'entity',
    linkedEntityId: NIVARA_IDS.groupEntity001,
    linkedPersonId: '',
    linkedPersonRole: '',
    linkedPersonName: '',
    linkedWorkstreamSource: '',
    relationshipCategory: 'subsidiary',
    frameworkClassifications: [
      {
        framework: 'companies-act',
        related: 'yes',
        basisRationale: 'Wholly owned subsidiary under Companies Act related party definition',
        relationshipStartDate: '2020-03-18',
        relationshipEndDate: '',
        relevantFinancialPeriods: 'FY2022–FY2024',
        currentHistorical: 'current',
        professionalConfirmationStatus: 'pending',
      },
    ],
    relationshipSourceType: 'group-structure',
    reference: 'Subsidiary entity master record',
    notes: 'Minimal related party relationship for demo RPT schedule.',
  };

  const rptTransaction = {
    ...createEmptyRptTransactionRecord(),
    id: NIVARA_RPT_TRANSACTION_ID,
    relatedPartyRelationshipId: NIVARA_RPT_RELATIONSHIP_ID,
    linkedEntityId: NIVARA_IDS.groupEntity001,
    linkedPersonId: '',
    financialPeriod: NIVARA_FINANCIAL_PERIODS.fy2024End,
    transactionDateFrom: '2023-04-01',
    transactionDateTo: '2024-03-31',
    transactionType: 'purchase-receipt-of-services',
    description: 'Tooling support and shared services from subsidiary',
    transactionValue: '45',
    currency: NIVARA_FINANCIAL_PERIODS.reportingCurrency,
    amountUnit: NIVARA_FINANCIAL_PERIODS.amountUnit,
    pricingBasis: 'Cost-plus arrangement per inter-company policy',
    armsLengthStatus: 'management_believes_yes',
    ordinaryCourseOfBusiness: 'yes',
    recurringNonRecurring: 'recurring',
    cashNonCash: 'cash',
    notes: 'Immateral recurring inter-company services transaction for demo.',
  };

  const materialityCriterion = {
    ...createEmptyMaterialityCriterionRecord(),
    id: NIVARA_MATERIALITY_CRITERION_ID,
    metricType: 'revenue',
    thresholdType: 'percentage',
    thresholdValue: '10',
    measurementPeriod: 'FY2024',
    standaloneConsolidatedBasis: 'standalone',
    calculationMethodology: 'Percentage of issuer revenue from related party transactions',
    notes: 'Board materiality threshold for related party disclosure.',
  };

  const commonPursuitScreening = {
    ...createEmptyCommonPursuitScreening(),
    entityId: NIVARA_IDS.groupEntity001,
    sameLineOfBusiness: 'no',
    constitutionalObjectsPermitSameBusiness: 'yes',
    overlappingProductsServices: 'no',
    sameCustomerSegment: 'no',
    sameGeography: 'yes',
    sharedPromotersManagement: 'yes',
  };

  const entityFinancialReadiness = {
    ...createEmptyEntityFinancialReadinessRecord(),
    id: NIVARA_ENTITY_FINANCIAL_READINESS_ID,
    entityId: NIVARA_IDS.groupEntity001,
    financialInformationAvailable: 'yes',
    latestAuditedFinancialYear: 'FY2024',
    threePriorFinancialYearsAvailable: 'yes',
    auditStatus: 'audited',
    source: 'management-provided',
    informationVerified: 'yes',
    notes: 'Subsidiary financial information available for demo RPT and group disclosure.',
  };

  const confirmations = {
    allSubsidiariesDisclosed: 'yes',
    stepDownSubsidiariesDisclosed: 'no',
    associatesJvsDisclosed: 'no',
    ultimateParentControlStructureAccurate: 'yes',
    promoterGroupRelationshipsComplete: 'yes',
    accountingStandardRelatedPartiesIdentified: 'yes',
    companiesActRelatedPartiesConsidered: 'yes',
    historicalRelatedPartiesIncluded: 'yes',
    icdrGroupCompaniesIdentified: 'yes',
    subsidiariesPromotersNotDuplicatedAsGroupCompanies: 'yes',
    currentMaterialityPolicyCaptured: 'yes',
    rptRegisterComplete: 'yes',
    outstandingBalancesComplete: 'yes',
    commitmentsComplete: 'yes',
    guaranteesCollateralComplete: 'no',
    loansAdvancesComplete: 'no',
    commonPursuitsDisclosed: 'yes',
    groupCompanyDependenciesDisclosed: 'yes',
    competingGroupBusinessesDisclosed: 'no',
    groupCompanyFinancialInformationCurrent: 'yes',
    negativeNetWorthAuditorConcernsDisclosed: 'no',
    ibcWindingUpStrikeOffDisclosed: 'no',
    informationUnavailableFromGroupCompaniesIdentified: 'no',
    conflictingClassificationsFlagged: 'no',
    linkedWorkstreamValuesReconciled: 'yes',
    professionalConfirmationRequired: 'yes',
  };

  return {
    ...base,
    groupStructureAndEntityMaster: {
      ...base.groupStructureAndEntityMaster,
      groupSnapshot: {
        ...base.groupStructureAndEntityMaster.groupSnapshot,
        structureAsOfDate: NIVARA_FINANCIAL_PERIODS.fy2024End,
        holdingParentCompanyExists: 'no',
        ultimateHoldingCompanyExists: 'no',
        subsidiariesExist: 'yes',
        stepDownSubsidiariesExist: 'no',
        associatesExist: 'no',
        jointVenturesExist: 'no',
        foreignGroupEntitiesExist: 'no',
        promoterGroupEntitiesExist: 'no',
        otherCommonControlEntitiesExist: 'no',
        historicalEntitiesRelevant: 'no',
      },
      entities: [issuerEntity, subsidiaryEntity],
    },
    ownershipControlAndRelationshipMapping: {
      ...base.ownershipControlAndRelationshipMapping,
      ownershipRelationships: [ownershipRelationship],
      notes: 'Single wholly owned subsidiary in Nivara group structure.',
    },
    groupCompanyAndMaterialityClassification: {
      ...base.groupCompanyAndMaterialityClassification,
      entityClassifications: [
        {
          id: NIVARA_ENTITY_CLASSIFICATION_ID,
          entityId: NIVARA_IDS.groupEntity001,
          classificationType: 'subsidiary',
          currentHistorical: 'current',
          relevantPeriods: 'FY2022–FY2024',
          basis: '100% equity ownership',
          ownershipPercent: '100',
          votingPercent: '100',
          controlSignificantInfluenceBasis: 'Full management control',
          managementConclusion: 'Wholly owned subsidiary',
          readinessState: 'appears_consistent',
          professionalConfirmationStatus: 'pending',
          notes: '',
        },
      ],
      materialityPolicy: {
        ...base.groupCompanyAndMaterialityClassification.materialityPolicy,
        policyExists: 'yes',
        adopted: 'yes',
        adoptionDate: '2024-08-15',
        boardResolutionReference: 'BR/2024-08/RPT-01',
        effectiveDate: '2024-08-15',
        notes: 'Board materiality policy for related party and group company classification.',
      },
      materialityCriteria: [materialityCriterion],
    },
    relatedPartyUniverseAndClassification: {
      relatedPartyRelationships: [relatedPartyRelationship],
    },
    relatedPartyTransactionsBalancesAndCommitments: {
      transactions: [rptTransaction],
      balances: [],
    },
    commonPursuitsDependenciesAndConflicts: {
      ...base.commonPursuitsDependenciesAndConflicts,
      commonPursuitScreenings: [commonPursuitScreening],
      notes: 'Common pursuit screening completed for sole subsidiary — complementary tooling business.',
    },
    groupEntityFinancialRegulatoryAndLitigationReadiness: {
      ...base.groupEntityFinancialRegulatoryAndLitigationReadiness,
      entityFinancialReadiness: [entityFinancialReadiness],
      notes: 'Financial readiness captured for subsidiary entity.',
    },
    changesRptReadinessAndConfirmations: {
      ...base.changesRptReadinessAndConfirmations,
      confirmations,
      notes: 'Group entities confirmations captured for demo RPT readiness.',
    },
  } as GroupEntitiesRelatedPartiesPayload;
}
