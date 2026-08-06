/**
 * Empty-record factories for Business & Operations (Increment B1).
 *
 * Every money / count / percentage field starts as `''` (never `0`, never `null`) and every
 * repeatable record receives a stable `crypto.randomUUID()` id so React keys and cross-section
 * links survive re-renders and round-trips.
 */

import type {
  BusinessOperationsConfirmations,
  BusinessOperationsPayload,
  BusinessProfileAndOperatingModel,
  BusinessUnit,
  CapacityRecord,
  Collaboration,
  CompetitiveStrength,
  CompetitiveStrengthsStrategyDependenciesAndConfirmations,
  CustomerConcentrationPeriod,
  CustomersSalesDistributionAndGeography,
  FacilitiesCapacityAndOperationalProcess,
  Facility,
  GeographicRevenue,
  InsurancePolicy,
  IntellectualPropertyRecord,
  KeyDependency,
  KeyInput,
  MachineryEquipment,
  MaterialCustomer,
  MaterialSupplier,
  OfferingChange,
  OperatingDependency,
  OperatingProcessStep,
  PlannedCapacity,
  ProductService,
  ProductsServicesAndRevenueMix,
  QualityCertification,
  RdSpendRow,
  RevenueMixRow,
  SalesChannel,
  StrategyItem,
  SupplierConcentrationPeriod,
  SuppliersProcurementInventoryAndLogistics,
  TechnologyQualityResearchAndIntellectualProperty,
  WorkforceCollaborationsInsuranceAndContinuity,
  WorkforcePeriod,
} from '@/lib/schemas/business-operations';
import { BUSINESS_OPERATIONS_SCHEMA_VERSION } from '@/lib/schemas/business-operations';

function newId(id?: string): string {
  return id ?? crypto.randomUUID();
}

export function createEmptyBusinessUnit(id?: string): BusinessUnit {
  return {
    id: newId(id),
    unitName: '',
    description: '',
    activity: '',
    commencementDate: '',
    productsServicesCovered: '',
    geography: '',
    revenueContributionPercentage: '',
    status: '',
    notes: '',
  };
}

export function createEmptyProductService(id?: string): ProductService {
  return {
    id: newId(id),
    name: '',
    productType: '',
    businessSegment: '',
    description: '',
    mainFeatures: '',
    customerProblemAddressed: '',
    customerOrEndUserType: '',
    industryServed: '',
    brandName: '',
    launchDate: '',
    lifecycleStage: '',
    sourcingModel: '',
    pricingModel: '',
    typicalOrderOrContractSize: '',
    revenueRecognitionModel: '',
    domesticExportClassification: '',
    requiredLicencesOrCertifications: '',
    notes: '',
  };
}

export function createEmptyRevenueMixRow(id?: string): RevenueMixRow {
  return {
    id: newId(id),
    productOrSegmentId: '',
    productOrSegmentLabel: '',
    financialYear: '',
    revenue: '',
    percentageOfRevenueFromOperations: '',
    source: '',
    notes: '',
  };
}

export function createEmptyOfferingChange(id?: string): OfferingChange {
  return {
    id: newId(id),
    offeringName: '',
    changeType: '',
    changeDate: '',
    reason: '',
    currentCommercialStatus: '',
    notes: '',
  };
}

export function createEmptyCustomerConcentrationPeriod(
  id?: string,
): CustomerConcentrationPeriod {
  return {
    id: newId(id),
    periodLabel: '',
    isCurrentPeriod: false,
    largestCustomerRevenue: '',
    largestCustomerPercentage: '',
    top3Revenue: '',
    top3Percentage: '',
    top5Revenue: '',
    top5Percentage: '',
    top10Revenue: '',
    top10Percentage: '',
    totalRevenueFromOperations: '',
    source: '',
    notes: '',
  };
}

export function createEmptyMaterialCustomer(id?: string): MaterialCustomer {
  return {
    id: newId(id),
    customerNameOrConfidentialLabel: '',
    industry: '',
    country: '',
    relationshipSince: '',
    revenueContributionPercentage: '',
    contractType: '',
    contractExpiry: '',
    disclosureConsentStatus: '',
    notes: '',
  };
}

export function createEmptySalesChannel(id?: string): SalesChannel {
  return {
    id: newId(id),
    channelType: '',
    geography: '',
    revenueContributionPercentage: '',
    commissionOrMarginStructure: '',
    exclusivity: '',
    creditTerms: '',
    keyDependency: '',
    notes: '',
  };
}

export function createEmptyGeographicRevenue(id?: string): GeographicRevenue {
  return {
    id: newId(id),
    periodLabel: '',
    geographicScope: '',
    regionOrCountry: '',
    revenue: '',
    percentageOfRevenue: '',
    source: '',
    notes: '',
  };
}

export function createEmptyKeyInput(id?: string): KeyInput {
  return {
    id: newId(id),
    inputName: '',
    category: '',
    productsServicesSupported: '',
    domesticOrImported: '',
    criticalInput: '',
    commodityLinkedPrice: '',
    substituteAvailable: '',
    typicalLeadTime: '',
    storageRequirement: '',
    priceVolatility: '',
    regulatoryOrImportRestriction: '',
    notes: '',
  };
}

export function createEmptySupplierConcentrationPeriod(
  id?: string,
): SupplierConcentrationPeriod {
  return {
    id: newId(id),
    periodLabel: '',
    isCurrentPeriod: false,
    totalSuppliers: '',
    largestSupplierPurchaseValue: '',
    largestSupplierPercentage: '',
    top3PurchaseValue: '',
    top3Percentage: '',
    top5PurchaseValue: '',
    top5Percentage: '',
    top10PurchaseValue: '',
    top10Percentage: '',
    totalPurchases: '',
    importedPurchasePercentage: '',
    relatedPartySupplierPercentage: '',
    source: '',
    notes: '',
  };
}

export function createEmptyMaterialSupplier(id?: string): MaterialSupplier {
  return {
    id: newId(id),
    supplierNameOrConfidentialLabel: '',
    inputSupplied: '',
    relationshipSince: '',
    country: '',
    longTermAgreement: '',
    exclusivity: '',
    singleSourceDependency: '',
    contractExpiry: '',
    alternativeSupplierAvailable: '',
    creditTerms: '',
    disclosureConsentStatus: '',
    notes: '',
  };
}

export function createEmptyFacility(id?: string): Facility {
  return {
    id: newId(id),
    name: '',
    facilityType: '',
    address: '',
    stateOrCountry: '',
    tenure: '',
    operationalSince: '',
    status: '',
    area: '',
    mainFunctions: '',
    productsServicesSupported: '',
    numberOfShifts: '',
    workforceCount: '',
    leaseExpiry: '',
    materialLicencesRequired: '',
    notes: '',
  };
}

export function createEmptyCapacityRecord(id?: string): CapacityRecord {
  return {
    id: newId(id),
    facilityId: '',
    facilityName: '',
    periodLabel: '',
    isCurrentPeriod: false,
    metricOrCapacityUnit: '',
    metricDescription: '',
    installedCapacity: '',
    availableCapacity: '',
    actualOutput: '',
    numberOfShifts: '',
    bottleneckCapacity: '',
    utilisationAbove100Explanation: '',
    sourceStatus: '',
    notes: '',
  };
}

export function createEmptyPlannedCapacity(id?: string): PlannedCapacity {
  return {
    id: newId(id),
    description: '',
    facilityId: '',
    facilityName: '',
    capacityBeingAdded: '',
    expectedCommissioningPeriod: '',
    status: '',
    approvalStatus: '',
    fundingSource: '',
    relatedObjectsOfTheIssueReference: '',
    keyDependencies: '',
    notes: '',
  };
}

export function createEmptyOperatingProcessStep(id?: string): OperatingProcessStep {
  return {
    id: newId(id),
    stepNumber: '',
    processName: '',
    description: '',
    input: '',
    output: '',
    facilityId: '',
    facilityName: '',
    technologyOrMachinery: '',
    qualityCheckpoint: '',
    executionModel: '',
    notes: '',
  };
}

export function createEmptyMachineryEquipment(id?: string): MachineryEquipment {
  return {
    id: newId(id),
    nameOrType: '',
    facilityId: '',
    facilityName: '',
    functionDescription: '',
    quantity: '',
    ageYears: '',
    tenure: '',
    supplier: '',
    installedDate: '',
    remainingUsefulLife: '',
    origin: '',
    status: '',
    notes: '',
  };
}

export function createEmptyQualityCertification(id?: string): QualityCertification {
  return {
    id: newId(id),
    standard: '',
    certificateNumber: '',
    issuingBody: '',
    scope: '',
    issueDate: '',
    expiryDate: '',
    renewalStatus: '',
    notes: '',
  };
}

export function createEmptyRdSpendRow(id?: string): RdSpendRow {
  return {
    id: newId(id),
    financialYear: '',
    spendAmount: '',
    source: '',
    notes: '',
  };
}

export function createEmptyIntellectualPropertyRecord(
  id?: string,
): IntellectualPropertyRecord {
  return {
    id: newId(id),
    ipType: '',
    nameOrDescription: '',
    ownerOrApplicant: '',
    registrationOrApplicationNumber: '',
    jurisdiction: '',
    status: '',
    filingDate: '',
    registrationDate: '',
    expiryDate: '',
    relatedProducts: '',
    ownershipModel: '',
    licenceTerms: '',
    materialityStatus: '',
    disputeOrOpposition: '',
    disputeOrOppositionDetails: '',
    notes: '',
  };
}

export function createEmptyWorkforcePeriod(id?: string): WorkforcePeriod {
  return {
    id: newId(id),
    asOfDate: '',
    periodLabel: '',
    isCurrentPeriod: false,
    permanentEmployees: '',
    contractWorkers: '',
    factoryOrOperationalWorkers: '',
    technicalOrRdEmployees: '',
    salesEmployees: '',
    administrationEmployees: '',
    womenEmployees: '',
    personsWithDisabilities: '',
    unionisedEmployees: '',
    attritionPercentage: '',
    geographicDistribution: '',
    notes: '',
  };
}

export function createEmptyCollaboration(id?: string): Collaboration {
  return {
    id: newId(id),
    party: '',
    country: '',
    nature: '',
    agreementDate: '',
    term: '',
    exclusivity: '',
    geography: '',
    supportOrServicesReceived: '',
    renewalOrTerminationStatus: '',
    materialDependency: '',
    notes: '',
  };
}

export function createEmptyOperatingDependency(id?: string): OperatingDependency {
  return {
    id: newId(id),
    dependencyType: '',
    description: '',
    applicable: '',
    counterpartyOrProvider: '',
    quantification: '',
    mitigation: '',
    materialityStatus: '',
    notes: '',
  };
}

export function createEmptyInsurancePolicy(id?: string): InsurancePolicy {
  return {
    id: newId(id),
    policyType: '',
    insurer: '',
    coverage: '',
    sumInsured: '',
    policyPeriod: '',
    deductible: '',
    keyExclusions: '',
    claimsHistory: '',
    renewalStatus: '',
    notes: '',
  };
}

export function createEmptyCompetitiveStrength(id?: string): CompetitiveStrength {
  return {
    id: newId(id),
    title: '',
    explanation: '',
    supportingMetric: '',
    period: '',
    supportingSource: '',
    relatedProductFacilityOrCustomer: '',
    companyConfirmation: '',
    professionalReviewStatus: '',
    notes: '',
  };
}

export function createEmptyStrategyItem(id?: string): StrategyItem {
  return {
    id: newId(id),
    title: '',
    description: '',
    category: '',
    timeHorizon: '',
    currentStatus: '',
    requiredResources: '',
    dependencies: '',
    relatedObjectsOfTheIssueReference: '',
    boardApprovedStatus: '',
    supportingPlanOrSource: '',
    risks: '',
    containsUnsupportedProjections: '',
    notes: '',
  };
}

export function createEmptyKeyDependency(id?: string): KeyDependency {
  return {
    id: newId(id),
    dependencyType: '',
    description: '',
    quantification: '',
    mitigation: '',
    materialityStatus: '',
    relatedFutureRiskFactor: '',
    notes: '',
  };
}

export function createEmptyBusinessOperationsConfirmations(): BusinessOperationsConfirmations {
  return {
    allMaterialActivitiesDisclosed: false,
    productsAndServicesAreComplete: false,
    revenueMixReconciles: false,
    customerConcentrationIsComplete: false,
    supplierConcentrationIsComplete: false,
    allFacilitiesAreIncluded: false,
    capacityUnitsAndFiguresAreConsistent: false,
    outsourcedOperationsAreDisclosed: false,
    technologyAndIpDependenciesAreDisclosed: false,
    qualityIncidentsAndRecallsAreDisclosed: false,
    insuranceAndContinuityInformationIsComplete: false,
    strengthClaimsHaveSupportingSources: false,
    strategiesContainNoUnsupportedProjections: false,
    professionalReviewRemainsRequired: false,
  };
}

export function createEmptyBusinessProfileAndOperatingModel(): BusinessProfileAndOperatingModel {
  return {
    businessCommencementDate: '',
    businessClassifications: [],
    otherBusinessClassificationDetails: '',
    primaryBusinessActivity: '',
    secondaryBusinessActivities: '',
    briefBusinessOverview: '',
    positionInValueChain: '',
    customerModel: '',
    revenueModels: [],
    otherRevenueModelDetails: '',
    orderModel: '',
    domesticOperations: '',
    exportOperations: '',
    regionsCountriesServed: '',
    seasonalityOrCyclicality: '',
    seasonalityDetails: '',
    workingCapitalIntensiveBusiness: '',
    materialThirdPartyDependence: '',
    materialThirdPartyDependenceDetails: '',
    materialRegulatoryDependence: '',
    materialRegulatoryDependenceDetails: '',
    valueCreationAndDeliveryExplanation: '',
    businessUnits: [],
    notes: '',
  };
}

export function createEmptyProductsServicesAndRevenueMix(): ProductsServicesAndRevenueMix {
  return {
    productsServices: [],
    revenueMixRows: [],
    offeringChanges: [],
    notes: '',
  };
}

export function createEmptyCustomersSalesDistributionAndGeography(): CustomersSalesDistributionAndGeography {
  return {
    approximateActiveCustomerCount: '',
    customerCategories: '',
    industriesServed: '',
    repeatCustomerPercentage: '',
    averageRelationshipDuration: '',
    governmentTenderDependence: '',
    largeEnterpriseDependence: '',
    longTermContractsAvailable: '',
    purchaseOrderDependence: '',
    creditTerms: '',
    returnsOrCancellationPolicy: '',
    customerConcentrationPeriods: [],
    materialCustomers: [],
    salesChannels: [],
    geographicRevenueRows: [],
    orderBookAvailable: '',
    orderBookValue: '',
    orderBookAsOfDate: '',
    orderBookExecutionPeriod: '',
    orderBookCancellationConditions: '',
    orderBookSecurityClassification: '',
    orderBookCustomerConcentration: '',
    orderBookRevenueAlreadyRecognised: '',
    orderBookSourceStatus: '',
    orderBookExcludesQuotationsAndNonBindingProposals: '',
    notes: '',
  };
}

export function createEmptySuppliersProcurementInventoryAndLogistics(): SuppliersProcurementInventoryAndLogistics {
  return {
    keyInputs: [],
    supplierConcentrationPeriods: [],
    materialSuppliers: [],
    procurementModel: '',
    purchaseOrderOrContractModel: '',
    pricingMethod: '',
    supplierQualificationProcess: '',
    qualityInspectionProcess: '',
    replacementProcess: '',
    typicalProcurementLeadTime: '',
    relatedPartySupplierDependence: '',
    productionModel: '',
    inventoryHoldingPeriodRawMaterials: '',
    inventoryHoldingPeriodFinishedGoods: '',
    safetyStockApproach: '',
    obsolescenceOrPerishabilityExposure: '',
    materialWriteOffs: '',
    materialWriteOffDetails: '',
    warehousingArrangement: '',
    logisticsModel: '',
    transportModes: '',
    portsUsed: '',
    deliveryResponsibilities: '',
    materialLogisticsDependency: '',
    logisticsBackupArrangements: '',
    notes: '',
  };
}

export function createEmptyFacilitiesCapacityAndOperationalProcess(): FacilitiesCapacityAndOperationalProcess {
  return {
    facilities: [],
    capacityRecords: [],
    plannedCapacityItems: [],
    operatingProcessSteps: [],
    electricityDependency: '',
    captivePowerAvailable: '',
    waterDependency: '',
    fuelDependency: '',
    internetOrDataInfrastructureDependency: '',
    wasteManagementArrangements: '',
    utilityBackupArrangements: '',
    utilityInterruptionsExperienced: '',
    utilityInterruptionsDetails: '',
    utilityCapacityConstraints: '',
    utilityCapacityConstraintDetails: '',
    notes: '',
  };
}

export function createEmptyTechnologyQualityResearchAndIntellectualProperty(): TechnologyQualityResearchAndIntellectualProperty {
  return {
    coreOperatingTechnology: '',
    technologyOwnership: '',
    automationLevel: '',
    criticalSoftwareSystems: '',
    erpOrCrmSystems: '',
    hostingModel: '',
    cybersecurityFramework: '',
    backupAndDisasterRecovery: '',
    obsolescenceExposure: '',
    thirdPartyTechnologyDependence: '',
    thirdPartyTechnologyDependenceDetails: '',
    technologyCollaborations: '',
    machineryAndEquipment: [],
    qualityProcess: '',
    inspectionStages: '',
    laboratoryOrTestingArrangements: '',
    rejectionRatePercentage: '',
    returnOrRecallRatePercentage: '',
    qualityClaims: '',
    qualityClaimsDetails: '',
    materialRecallDeclaration: '',
    materialRecallDetails: '',
    certifications: [],
    rdFunctionExists: '',
    rdDeliveryModel: '',
    rdEmployeeCount: '',
    rdFacilities: '',
    rdSpendRows: [],
    rdCurrentProjects: '',
    rdCommercialisedOutcomes: '',
    rdGrants: '',
    rdCollaborations: '',
    intellectualPropertyRecords: [],
    notes: '',
  };
}

export function createEmptyWorkforceCollaborationsInsuranceAndContinuity(): WorkforceCollaborationsInsuranceAndContinuity {
  return {
    workforcePeriods: [],
    labourDisputes: '',
    labourDisputeDetails: '',
    trainingProgrammes: '',
    specialisedSkillDependence: '',
    specialisedSkillDependenceDetails: '',
    labourContractorUsage: '',
    labourContractorDetails: '',
    collaborations: [],
    operatingDependencies: [],
    insurancePolicies: [],
    managementConsidersCoverageAdequate: '',
    professionalInsuranceReviewPerformed: '',
    materialUninsuredOperations: '',
    materialUninsuredOperationsDetails: '',
    keyPersonInsuranceInPlace: '',
    cyberInsuranceInPlace: '',
    businessContinuityPlanExists: '',
    disasterRecoveryPlanExists: '',
    alternateFacilityAvailable: '',
    backupSuppliersAvailable: '',
    backupPowerOrDataAvailable: '',
    cyberIncidentResponsePlanExists: '',
    continuityLastTestDate: '',
    materialInterruptionsExperienced: '',
    materialInterruptionsDetails: '',
    maximumDowntimeExperienced: '',
    recoveryStatus: '',
    notes: '',
  };
}

export function createEmptyCompetitiveStrengthsStrategyDependenciesAndConfirmations(): CompetitiveStrengthsStrategyDependenciesAndConfirmations {
  return {
    competitiveStrengths: [],
    strategies: [],
    keyDependencies: [],
    confirmations: createEmptyBusinessOperationsConfirmations(),
    notes: '',
  };
}

export function createEmptyBusinessOperationsPayload(): BusinessOperationsPayload {
  return {
    schemaVersion: BUSINESS_OPERATIONS_SCHEMA_VERSION,
    businessProfileAndOperatingModel: createEmptyBusinessProfileAndOperatingModel(),
    productsServicesAndRevenueMix: createEmptyProductsServicesAndRevenueMix(),
    customersSalesDistributionAndGeography:
      createEmptyCustomersSalesDistributionAndGeography(),
    suppliersProcurementInventoryAndLogistics:
      createEmptySuppliersProcurementInventoryAndLogistics(),
    facilitiesCapacityAndOperationalProcess:
      createEmptyFacilitiesCapacityAndOperationalProcess(),
    technologyQualityResearchAndIntellectualProperty:
      createEmptyTechnologyQualityResearchAndIntellectualProperty(),
    workforceCollaborationsInsuranceAndContinuity:
      createEmptyWorkforceCollaborationsInsuranceAndContinuity(),
    competitiveStrengthsStrategyDependenciesAndConfirmations:
      createEmptyCompetitiveStrengthsStrategyDependenciesAndConfirmations(),
  };
}
