/**
 * Canonical Business & Operations payload schema (Increment B1).
 *
 * Contract notes for the backend increment that follows (B2):
 * - Persist `BusinessOperationsPayload` (`schemaVersion: 1`) exactly — same keys, enums, emptiness.
 * - Every monetary amount, count, ratio and percentage is a Decimal-safe STRING.
 *   Empty is `''` (never `null`, never `0`). Values are plain decimal strings such as
 *   `'1000000'` or `'12.50'` — never JavaScript numbers, so no float drift on round-trip.
 * - Ternary answers use `'' | 'yes' | 'no' | 'not_sure'`. Empty must never be coerced to `'no'`.
 * - Computed values (mix totals, concentrations, utilisation, assessment outcomes) are DERIVED
 *   and are never persisted here.
 * - Repeatable records carry stable `id`s generated with `crypto.randomUUID()`.
 * - UI labels live in `lib/business-operations/options.ts` and must never appear in the payload.
 */

import { z } from 'zod';

export const BUSINESS_OPERATIONS_SCHEMA_VERSION = 1 as const;

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

export const YES_NO_NOT_SURE_VALUES = ['yes', 'no', 'not_sure'] as const;
export type YesNoNotSure = (typeof YES_NO_NOT_SURE_VALUES)[number];

/** Unanswered ternary — never coerce empty to "no". */
export const yesNoNotSureOrEmptySchema = z.enum(['', ...YES_NO_NOT_SURE_VALUES]);
export type YesNoNotSureOrEmpty = z.infer<typeof yesNoNotSureOrEmptySchema>;

/**
 * Decimal-safe string. `''` means "not provided". Otherwise a plain decimal string.
 * Validation is intentionally permissive so partially typed input can still be saved;
 * `lib/business-operations/decimal.ts` owns normalisation and arithmetic.
 */
export const decimalStringSchema = z.string();
export type DecimalString = z.infer<typeof decimalStringSchema>;

const text = z.string();
const idSchema = z.string().min(1);

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

export const BUSINESS_CLASSIFICATION_VALUES = [
  'manufacturing',
  'trading-or-distribution',
  'services',
  'software-or-technology-platform',
  'engineering-epc-project',
  'contract-manufacturing',
  'retail-or-consumer',
  'mixed',
  'other',
] as const;
export type BusinessClassification = (typeof BUSINESS_CLASSIFICATION_VALUES)[number];

export const CUSTOMER_MODEL_VALUES = ['b2b', 'b2c', 'b2g', 'mixed'] as const;
export type CustomerModel = (typeof CUSTOMER_MODEL_VALUES)[number];

export const REVENUE_MODEL_VALUES = [
  'product-sales',
  'service-fees',
  'subscription',
  'commission',
  'project-billing',
  'licensing',
  'job-work',
  'rental',
  'other',
] as const;
export type RevenueModel = (typeof REVENUE_MODEL_VALUES)[number];

export const ORDER_MODEL_VALUES = [
  'purchase-orders',
  'long-term-contracts',
  'framework-agreements',
  'subscription-contracts',
  'spot-sales',
  'tender-based',
  'mixed',
] as const;
export type OrderModel = (typeof ORDER_MODEL_VALUES)[number];

export const BUSINESS_UNIT_STATUS_VALUES = [
  'active',
  'inactive',
  'planned',
  'discontinued',
  'other',
] as const;

export const PRODUCT_TYPE_VALUES = [
  'product',
  'service',
  'solution',
  'platform',
  'project',
  'trading-category',
] as const;
export type ProductType = (typeof PRODUCT_TYPE_VALUES)[number];

export const LIFECYCLE_STAGE_VALUES = [
  'introduction',
  'growth',
  'maturity',
  'decline',
  'discontinued',
  'other',
] as const;

export const SOURCING_MODEL_VALUES = [
  'in-house',
  'outsourced',
  'third-party-sourced',
  'mixed',
] as const;

export const DOMESTIC_EXPORT_CLASSIFICATION_VALUES = [
  'domestic',
  'export',
  'both',
] as const;

export const FIGURE_SOURCE_VALUES = [
  'audited-financials',
  'auditor-certificate',
  'management-records',
  'estimate',
  'not-available',
] as const;
export type FigureSource = (typeof FIGURE_SOURCE_VALUES)[number];

export const OFFERING_COMMERCIAL_STATUS_VALUES = [
  'active',
  'launched',
  'discontinued',
  'planned',
  'other',
] as const;

export const DISCLOSURE_CONSENT_VALUES = [
  'consented',
  'not-consented',
  'pending',
  'confidential-label-used',
  'not-applicable',
  'unknown',
] as const;

export const SALES_CHANNEL_TYPE_VALUES = [
  'direct-sales',
  'distributors',
  'dealers',
  'online-marketplace',
  'own-website-or-app',
  'retail-stores',
  'agents-or-brokers',
  'tender',
  'franchise',
  'other',
] as const;

export const GEOGRAPHIC_SCOPE_VALUES = [
  'india',
  'export',
  'region',
  'country',
] as const;

export const ORDER_BOOK_SECURITY_VALUES = [
  'secured',
  'unsecured',
  'mixed',
  'unknown',
] as const;

export const INPUT_CATEGORY_VALUES = [
  'raw-material',
  'component',
  'packaging',
  'consumable',
  'utility',
  'service-input',
  'software-or-data',
  'other',
] as const;

export const PROCUREMENT_MODEL_VALUES = [
  'centralised',
  'decentralised',
  'mixed',
] as const;

export const PRODUCTION_MODEL_VALUES = [
  'make-to-order',
  'make-to-stock',
  'mixed',
  'not-applicable',
] as const;

export const LOGISTICS_MODEL_VALUES = [
  'in-house',
  'third-party',
  'mixed',
] as const;

export const FACILITY_TYPE_VALUES = [
  'manufacturing-plant',
  'office',
  'warehouse',
  'service-centre',
  'retail-location',
  'data-centre',
  'laboratory',
  'project-site',
  'third-party-facility',
  'other',
] as const;
export type FacilityType = (typeof FACILITY_TYPE_VALUES)[number];

export const FACILITY_TENURE_VALUES = [
  'owned',
  'leased',
  'licensed',
  'third-party',
] as const;

export const FACILITY_STATUS_VALUES = [
  'operational',
  'under-construction',
  'planned',
  'mothballed',
  'closed',
  'other',
] as const;

export const CAPACITY_METRIC_UNIT_VALUES = [
  'units',
  'tonnes',
  'metres',
  'litres',
  'hours',
  'transactions',
  'seats',
  'projects',
  'stores',
  'active-users',
  'service-hours',
  'other',
] as const;

export const PLANNED_CAPACITY_STATUS_VALUES = [
  'planned',
  'approved',
  'under-implementation',
  'commissioned',
  'deferred',
  'cancelled',
  'other',
] as const;

export const PROCESS_EXECUTION_VALUES = [
  'in-house',
  'outsourced',
  'mixed',
] as const;

export const TECHNOLOGY_OWNERSHIP_VALUES = [
  'proprietary',
  'third-party',
  'mixed',
  'licensed',
] as const;

export const AUTOMATION_LEVEL_VALUES = [
  'manual',
  'semi-automated',
  'highly-automated',
  'fully-automated',
  'not-applicable',
  'unknown',
] as const;

export const HOSTING_MODEL_VALUES = [
  'on-premise',
  'private-cloud',
  'public-cloud',
  'hybrid',
  'saas',
  'not-applicable',
  'unknown',
] as const;

export const EQUIPMENT_TENURE_VALUES = ['owned', 'leased', 'other'] as const;

export const EQUIPMENT_ORIGIN_VALUES = ['imported', 'domestic', 'mixed', 'unknown'] as const;

export const EQUIPMENT_STATUS_VALUES = [
  'operational',
  'under-installation',
  'idle',
  'disposed',
  'other',
] as const;

export const CERTIFICATION_RENEWAL_STATUS_VALUES = [
  'current',
  'renewal-in-progress',
  'expired',
  'not-renewed',
  'not-applicable',
  'unknown',
] as const;

export const RD_DELIVERY_MODEL_VALUES = [
  'internal',
  'outsourced',
  'mixed',
  'not-applicable',
] as const;

export const IP_TYPE_VALUES = [
  'patent',
  'trademark',
  'copyright',
  'design',
  'trade-secret',
  'domain-name',
  'other',
] as const;
export type IpType = (typeof IP_TYPE_VALUES)[number];

export const IP_STATUS_VALUES = [
  'registered',
  'applied',
  'pending',
  'expired',
  'abandoned',
  'licensed-in',
  'other',
] as const;

export const IP_OWNERSHIP_MODEL_VALUES = [
  'owned',
  'licensed',
  'jointly-owned',
  'other',
] as const;

export const MATERIALITY_STATUS_VALUES = [
  'material',
  'not-material',
  'not_sure',
] as const;

export const COLLABORATION_NATURE_VALUES = [
  'technical-collaboration',
  'joint-venture',
  'licensing',
  'distribution',
  'research',
  'franchise',
  'other',
] as const;

export const INSURANCE_POLICY_TYPE_VALUES = [
  'property',
  'plant-and-machinery',
  'stock',
  'business-interruption',
  'public-liability',
  'product-liability',
  'directors-and-officers',
  'cyber',
  'key-person',
  'marine-or-transit',
  'other',
] as const;

export const STRATEGY_CATEGORY_VALUES = [
  'growth',
  'diversification',
  'geographic-expansion',
  'product-development',
  'capacity-expansion',
  'digital-transformation',
  'cost-optimisation',
  'other',
] as const;

export const STRATEGY_TIME_HORIZON_VALUES = [
  'near-term',
  'medium-term',
  'long-term',
  'ongoing',
  'other',
] as const;

export const STRATEGY_STATUS_VALUES = [
  'proposed',
  'approved',
  'in-progress',
  'completed',
  'deferred',
  'abandoned',
  'other',
] as const;

export const DEPENDENCY_TYPE_VALUES = [
  'customer',
  'supplier',
  'technology',
  'regulatory',
  'key-person',
  'facility',
  'logistics',
  'financing',
  'contract-manufacturing',
  'outsourced-service-delivery',
  'franchise',
  'cloud-or-platform',
  'distributor',
  'other',
] as const;

export const PROFESSIONAL_REVIEW_STATUS_VALUES = [
  'not-started',
  'in-progress',
  'completed',
  'not-required',
  'not_sure',
] as const;

export const SOURCE_STATUS_VALUES = [
  'available',
  'pending',
  'not-available',
  'not_sure',
] as const;

/* -------------------------------------------------------------------------- */
/* 1. Business profile & operating model                                       */
/* -------------------------------------------------------------------------- */

export const businessUnitSchema = z.object({
  id: idSchema,
  unitName: text,
  description: text,
  activity: text,
  commencementDate: text,
  productsServicesCovered: text,
  geography: text,
  revenueContributionPercentage: decimalStringSchema,
  status: z.enum(['', ...BUSINESS_UNIT_STATUS_VALUES]),
  notes: text,
});
export type BusinessUnit = z.infer<typeof businessUnitSchema>;

export const businessProfileAndOperatingModelSchema = z.object({
  businessCommencementDate: text,
  businessClassifications: z.array(z.enum(BUSINESS_CLASSIFICATION_VALUES)),
  otherBusinessClassificationDetails: text,
  primaryBusinessActivity: text,
  secondaryBusinessActivities: text,
  briefBusinessOverview: text,
  positionInValueChain: text,
  customerModel: z.enum(['', ...CUSTOMER_MODEL_VALUES]),
  revenueModels: z.array(z.enum(REVENUE_MODEL_VALUES)),
  otherRevenueModelDetails: text,
  orderModel: z.enum(['', ...ORDER_MODEL_VALUES]),
  domesticOperations: yesNoNotSureOrEmptySchema,
  exportOperations: yesNoNotSureOrEmptySchema,
  regionsCountriesServed: text,
  seasonalityOrCyclicality: yesNoNotSureOrEmptySchema,
  seasonalityDetails: text,
  workingCapitalIntensiveBusiness: yesNoNotSureOrEmptySchema,
  materialThirdPartyDependence: yesNoNotSureOrEmptySchema,
  materialThirdPartyDependenceDetails: text,
  materialRegulatoryDependence: yesNoNotSureOrEmptySchema,
  materialRegulatoryDependenceDetails: text,
  valueCreationAndDeliveryExplanation: text,
  businessUnits: z.array(businessUnitSchema),
  notes: text,
});
export type BusinessProfileAndOperatingModel = z.infer<
  typeof businessProfileAndOperatingModelSchema
>;

/* -------------------------------------------------------------------------- */
/* 2. Products, services & revenue mix                                         */
/* -------------------------------------------------------------------------- */

export const revenueMixRowSchema = z.object({
  id: idSchema,
  /** Optional link to a `productsServices[].id` or free-text segment. */
  productOrSegmentId: text,
  productOrSegmentLabel: text,
  financialYear: text,
  revenue: decimalStringSchema,
  percentageOfRevenueFromOperations: decimalStringSchema,
  source: z.enum(['', ...FIGURE_SOURCE_VALUES]),
  notes: text,
});
export type RevenueMixRow = z.infer<typeof revenueMixRowSchema>;

export const productServiceSchema = z.object({
  id: idSchema,
  name: text,
  productType: z.enum(['', ...PRODUCT_TYPE_VALUES]),
  businessSegment: text,
  description: text,
  mainFeatures: text,
  customerProblemAddressed: text,
  customerOrEndUserType: text,
  industryServed: text,
  brandName: text,
  launchDate: text,
  lifecycleStage: z.enum(['', ...LIFECYCLE_STAGE_VALUES]),
  sourcingModel: z.enum(['', ...SOURCING_MODEL_VALUES]),
  pricingModel: text,
  typicalOrderOrContractSize: decimalStringSchema,
  revenueRecognitionModel: text,
  domesticExportClassification: z.enum(['', ...DOMESTIC_EXPORT_CLASSIFICATION_VALUES]),
  requiredLicencesOrCertifications: text,
  notes: text,
});
export type ProductService = z.infer<typeof productServiceSchema>;

export const offeringChangeSchema = z.object({
  id: idSchema,
  offeringName: text,
  changeType: z.enum(['', 'launch', 'discontinuation', 'other']),
  changeDate: text,
  reason: text,
  currentCommercialStatus: z.enum(['', ...OFFERING_COMMERCIAL_STATUS_VALUES]),
  notes: text,
});
export type OfferingChange = z.infer<typeof offeringChangeSchema>;

export const productsServicesAndRevenueMixSchema = z.object({
  productsServices: z.array(productServiceSchema),
  revenueMixRows: z.array(revenueMixRowSchema),
  offeringChanges: z.array(offeringChangeSchema),
  notes: text,
});
export type ProductsServicesAndRevenueMix = z.infer<typeof productsServicesAndRevenueMixSchema>;

/* -------------------------------------------------------------------------- */
/* 3. Customers, sales, distribution & geography                               */
/* -------------------------------------------------------------------------- */

export const customerConcentrationPeriodSchema = z.object({
  id: idSchema,
  periodLabel: text,
  isCurrentPeriod: z.boolean(),
  largestCustomerRevenue: decimalStringSchema,
  largestCustomerPercentage: decimalStringSchema,
  top3Revenue: decimalStringSchema,
  top3Percentage: decimalStringSchema,
  top5Revenue: decimalStringSchema,
  top5Percentage: decimalStringSchema,
  top10Revenue: decimalStringSchema,
  top10Percentage: decimalStringSchema,
  totalRevenueFromOperations: decimalStringSchema,
  source: z.enum(['', ...FIGURE_SOURCE_VALUES]),
  notes: text,
});
export type CustomerConcentrationPeriod = z.infer<typeof customerConcentrationPeriodSchema>;

export const materialCustomerSchema = z.object({
  id: idSchema,
  customerNameOrConfidentialLabel: text,
  industry: text,
  country: text,
  relationshipSince: text,
  revenueContributionPercentage: decimalStringSchema,
  contractType: text,
  contractExpiry: text,
  disclosureConsentStatus: z.enum(['', ...DISCLOSURE_CONSENT_VALUES]),
  notes: text,
});
export type MaterialCustomer = z.infer<typeof materialCustomerSchema>;

export const salesChannelSchema = z.object({
  id: idSchema,
  channelType: z.enum(['', ...SALES_CHANNEL_TYPE_VALUES]),
  geography: text,
  revenueContributionPercentage: decimalStringSchema,
  commissionOrMarginStructure: text,
  exclusivity: yesNoNotSureOrEmptySchema,
  creditTerms: text,
  keyDependency: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type SalesChannel = z.infer<typeof salesChannelSchema>;

export const geographicRevenueSchema = z.object({
  id: idSchema,
  periodLabel: text,
  geographicScope: z.enum(['', ...GEOGRAPHIC_SCOPE_VALUES]),
  regionOrCountry: text,
  revenue: decimalStringSchema,
  percentageOfRevenue: decimalStringSchema,
  source: z.enum(['', ...FIGURE_SOURCE_VALUES]),
  notes: text,
});
export type GeographicRevenue = z.infer<typeof geographicRevenueSchema>;

export const customersSalesDistributionAndGeographySchema = z.object({
  approximateActiveCustomerCount: decimalStringSchema,
  customerCategories: text,
  industriesServed: text,
  repeatCustomerPercentage: decimalStringSchema,
  averageRelationshipDuration: text,
  governmentTenderDependence: yesNoNotSureOrEmptySchema,
  largeEnterpriseDependence: yesNoNotSureOrEmptySchema,
  longTermContractsAvailable: yesNoNotSureOrEmptySchema,
  purchaseOrderDependence: yesNoNotSureOrEmptySchema,
  creditTerms: text,
  returnsOrCancellationPolicy: text,
  customerConcentrationPeriods: z.array(customerConcentrationPeriodSchema),
  materialCustomers: z.array(materialCustomerSchema),
  salesChannels: z.array(salesChannelSchema),
  geographicRevenueRows: z.array(geographicRevenueSchema),
  orderBookAvailable: yesNoNotSureOrEmptySchema,
  orderBookValue: decimalStringSchema,
  orderBookAsOfDate: text,
  orderBookExecutionPeriod: text,
  orderBookCancellationConditions: text,
  orderBookSecurityClassification: z.enum(['', ...ORDER_BOOK_SECURITY_VALUES]),
  orderBookCustomerConcentration: text,
  orderBookRevenueAlreadyRecognised: decimalStringSchema,
  orderBookSourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  orderBookExcludesQuotationsAndNonBindingProposals: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type CustomersSalesDistributionAndGeography = z.infer<
  typeof customersSalesDistributionAndGeographySchema
>;

/* -------------------------------------------------------------------------- */
/* 4. Suppliers, procurement, inventory & logistics                            */
/* -------------------------------------------------------------------------- */

export const keyInputSchema = z.object({
  id: idSchema,
  inputName: text,
  category: z.enum(['', ...INPUT_CATEGORY_VALUES]),
  productsServicesSupported: text,
  domesticOrImported: z.enum(['', 'domestic', 'imported', 'both', 'unknown']),
  criticalInput: yesNoNotSureOrEmptySchema,
  commodityLinkedPrice: yesNoNotSureOrEmptySchema,
  substituteAvailable: yesNoNotSureOrEmptySchema,
  typicalLeadTime: text,
  storageRequirement: text,
  priceVolatility: yesNoNotSureOrEmptySchema,
  regulatoryOrImportRestriction: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type KeyInput = z.infer<typeof keyInputSchema>;

export const supplierConcentrationPeriodSchema = z.object({
  id: idSchema,
  periodLabel: text,
  isCurrentPeriod: z.boolean(),
  totalSuppliers: decimalStringSchema,
  largestSupplierPurchaseValue: decimalStringSchema,
  largestSupplierPercentage: decimalStringSchema,
  top3PurchaseValue: decimalStringSchema,
  top3Percentage: decimalStringSchema,
  top5PurchaseValue: decimalStringSchema,
  top5Percentage: decimalStringSchema,
  top10PurchaseValue: decimalStringSchema,
  top10Percentage: decimalStringSchema,
  totalPurchases: decimalStringSchema,
  importedPurchasePercentage: decimalStringSchema,
  relatedPartySupplierPercentage: decimalStringSchema,
  source: z.enum(['', ...FIGURE_SOURCE_VALUES]),
  notes: text,
});
export type SupplierConcentrationPeriod = z.infer<typeof supplierConcentrationPeriodSchema>;

export const materialSupplierSchema = z.object({
  id: idSchema,
  supplierNameOrConfidentialLabel: text,
  inputSupplied: text,
  relationshipSince: text,
  country: text,
  longTermAgreement: yesNoNotSureOrEmptySchema,
  exclusivity: yesNoNotSureOrEmptySchema,
  singleSourceDependency: yesNoNotSureOrEmptySchema,
  contractExpiry: text,
  alternativeSupplierAvailable: yesNoNotSureOrEmptySchema,
  creditTerms: text,
  disclosureConsentStatus: z.enum(['', ...DISCLOSURE_CONSENT_VALUES]),
  notes: text,
});
export type MaterialSupplier = z.infer<typeof materialSupplierSchema>;

export const suppliersProcurementInventoryAndLogisticsSchema = z.object({
  keyInputs: z.array(keyInputSchema),
  supplierConcentrationPeriods: z.array(supplierConcentrationPeriodSchema),
  materialSuppliers: z.array(materialSupplierSchema),
  procurementModel: z.enum(['', ...PROCUREMENT_MODEL_VALUES]),
  purchaseOrderOrContractModel: text,
  pricingMethod: text,
  supplierQualificationProcess: text,
  qualityInspectionProcess: text,
  replacementProcess: text,
  typicalProcurementLeadTime: text,
  relatedPartySupplierDependence: yesNoNotSureOrEmptySchema,
  productionModel: z.enum(['', ...PRODUCTION_MODEL_VALUES]),
  inventoryHoldingPeriodRawMaterials: text,
  inventoryHoldingPeriodFinishedGoods: text,
  safetyStockApproach: text,
  obsolescenceOrPerishabilityExposure: yesNoNotSureOrEmptySchema,
  materialWriteOffs: yesNoNotSureOrEmptySchema,
  materialWriteOffDetails: text,
  warehousingArrangement: text,
  logisticsModel: z.enum(['', ...LOGISTICS_MODEL_VALUES]),
  transportModes: text,
  portsUsed: text,
  deliveryResponsibilities: text,
  materialLogisticsDependency: yesNoNotSureOrEmptySchema,
  logisticsBackupArrangements: text,
  notes: text,
});
export type SuppliersProcurementInventoryAndLogistics = z.infer<
  typeof suppliersProcurementInventoryAndLogisticsSchema
>;

/* -------------------------------------------------------------------------- */
/* 5. Facilities, capacity & operational process                               */
/* -------------------------------------------------------------------------- */

export const facilitySchema = z.object({
  id: idSchema,
  name: text,
  facilityType: z.enum(['', ...FACILITY_TYPE_VALUES]),
  address: text,
  stateOrCountry: text,
  tenure: z.enum(['', ...FACILITY_TENURE_VALUES]),
  operationalSince: text,
  status: z.enum(['', ...FACILITY_STATUS_VALUES]),
  area: text,
  mainFunctions: text,
  productsServicesSupported: text,
  numberOfShifts: decimalStringSchema,
  workforceCount: decimalStringSchema,
  leaseExpiry: text,
  materialLicencesRequired: text,
  notes: text,
});
export type Facility = z.infer<typeof facilitySchema>;

export const capacityRecordSchema = z.object({
  id: idSchema,
  facilityId: text,
  facilityName: text,
  periodLabel: text,
  isCurrentPeriod: z.boolean(),
  metricOrCapacityUnit: z.enum(['', ...CAPACITY_METRIC_UNIT_VALUES]),
  metricDescription: text,
  installedCapacity: decimalStringSchema,
  availableCapacity: decimalStringSchema,
  actualOutput: decimalStringSchema,
  numberOfShifts: decimalStringSchema,
  bottleneckCapacity: decimalStringSchema,
  utilisationAbove100Explanation: text,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  notes: text,
});
export type CapacityRecord = z.infer<typeof capacityRecordSchema>;

export const plannedCapacitySchema = z.object({
  id: idSchema,
  description: text,
  facilityId: text,
  facilityName: text,
  capacityBeingAdded: text,
  expectedCommissioningPeriod: text,
  status: z.enum(['', ...PLANNED_CAPACITY_STATUS_VALUES]),
  approvalStatus: text,
  fundingSource: text,
  relatedObjectsOfTheIssueReference: text,
  keyDependencies: text,
  notes: text,
});
export type PlannedCapacity = z.infer<typeof plannedCapacitySchema>;

export const operatingProcessStepSchema = z.object({
  id: idSchema,
  stepNumber: decimalStringSchema,
  processName: text,
  description: text,
  input: text,
  output: text,
  facilityId: text,
  facilityName: text,
  technologyOrMachinery: text,
  qualityCheckpoint: yesNoNotSureOrEmptySchema,
  executionModel: z.enum(['', ...PROCESS_EXECUTION_VALUES]),
  notes: text,
});
export type OperatingProcessStep = z.infer<typeof operatingProcessStepSchema>;

export const facilitiesCapacityAndOperationalProcessSchema = z.object({
  facilities: z.array(facilitySchema),
  capacityRecords: z.array(capacityRecordSchema),
  plannedCapacityItems: z.array(plannedCapacitySchema),
  operatingProcessSteps: z.array(operatingProcessStepSchema),
  electricityDependency: yesNoNotSureOrEmptySchema,
  captivePowerAvailable: yesNoNotSureOrEmptySchema,
  waterDependency: yesNoNotSureOrEmptySchema,
  fuelDependency: yesNoNotSureOrEmptySchema,
  internetOrDataInfrastructureDependency: yesNoNotSureOrEmptySchema,
  wasteManagementArrangements: text,
  utilityBackupArrangements: text,
  utilityInterruptionsExperienced: yesNoNotSureOrEmptySchema,
  utilityInterruptionsDetails: text,
  utilityCapacityConstraints: yesNoNotSureOrEmptySchema,
  utilityCapacityConstraintDetails: text,
  notes: text,
});
export type FacilitiesCapacityAndOperationalProcess = z.infer<
  typeof facilitiesCapacityAndOperationalProcessSchema
>;

/* -------------------------------------------------------------------------- */
/* 6. Technology, quality, R&D & intellectual property                         */
/* -------------------------------------------------------------------------- */

export const machineryEquipmentSchema = z.object({
  id: idSchema,
  nameOrType: text,
  facilityId: text,
  facilityName: text,
  functionDescription: text,
  quantity: decimalStringSchema,
  ageYears: decimalStringSchema,
  tenure: z.enum(['', ...EQUIPMENT_TENURE_VALUES]),
  supplier: text,
  installedDate: text,
  remainingUsefulLife: text,
  origin: z.enum(['', ...EQUIPMENT_ORIGIN_VALUES]),
  status: z.enum(['', ...EQUIPMENT_STATUS_VALUES]),
  notes: text,
});
export type MachineryEquipment = z.infer<typeof machineryEquipmentSchema>;

export const qualityCertificationSchema = z.object({
  id: idSchema,
  standard: text,
  certificateNumber: text,
  issuingBody: text,
  scope: text,
  issueDate: text,
  expiryDate: text,
  renewalStatus: z.enum(['', ...CERTIFICATION_RENEWAL_STATUS_VALUES]),
  notes: text,
});
export type QualityCertification = z.infer<typeof qualityCertificationSchema>;

export const rdSpendRowSchema = z.object({
  id: idSchema,
  financialYear: text,
  spendAmount: decimalStringSchema,
  source: z.enum(['', ...FIGURE_SOURCE_VALUES]),
  notes: text,
});
export type RdSpendRow = z.infer<typeof rdSpendRowSchema>;

export const intellectualPropertyRecordSchema = z.object({
  id: idSchema,
  ipType: z.enum(['', ...IP_TYPE_VALUES]),
  nameOrDescription: text,
  ownerOrApplicant: text,
  registrationOrApplicationNumber: text,
  jurisdiction: text,
  status: z.enum(['', ...IP_STATUS_VALUES]),
  filingDate: text,
  registrationDate: text,
  expiryDate: text,
  relatedProducts: text,
  ownershipModel: z.enum(['', ...IP_OWNERSHIP_MODEL_VALUES]),
  licenceTerms: text,
  materialityStatus: z.enum(['', ...MATERIALITY_STATUS_VALUES]),
  disputeOrOpposition: yesNoNotSureOrEmptySchema,
  disputeOrOppositionDetails: text,
  notes: text,
});
export type IntellectualPropertyRecord = z.infer<typeof intellectualPropertyRecordSchema>;

export const technologyQualityResearchAndIntellectualPropertySchema = z.object({
  coreOperatingTechnology: text,
  technologyOwnership: z.enum(['', ...TECHNOLOGY_OWNERSHIP_VALUES]),
  automationLevel: z.enum(['', ...AUTOMATION_LEVEL_VALUES]),
  criticalSoftwareSystems: text,
  erpOrCrmSystems: text,
  hostingModel: z.enum(['', ...HOSTING_MODEL_VALUES]),
  cybersecurityFramework: text,
  backupAndDisasterRecovery: text,
  obsolescenceExposure: yesNoNotSureOrEmptySchema,
  thirdPartyTechnologyDependence: yesNoNotSureOrEmptySchema,
  thirdPartyTechnologyDependenceDetails: text,
  technologyCollaborations: text,
  machineryAndEquipment: z.array(machineryEquipmentSchema),
  qualityProcess: text,
  inspectionStages: text,
  laboratoryOrTestingArrangements: text,
  rejectionRatePercentage: decimalStringSchema,
  returnOrRecallRatePercentage: decimalStringSchema,
  qualityClaims: yesNoNotSureOrEmptySchema,
  qualityClaimsDetails: text,
  materialRecallDeclaration: yesNoNotSureOrEmptySchema,
  materialRecallDetails: text,
  certifications: z.array(qualityCertificationSchema),
  rdFunctionExists: yesNoNotSureOrEmptySchema,
  rdDeliveryModel: z.enum(['', ...RD_DELIVERY_MODEL_VALUES]),
  rdEmployeeCount: decimalStringSchema,
  rdFacilities: text,
  rdSpendRows: z.array(rdSpendRowSchema),
  rdCurrentProjects: text,
  rdCommercialisedOutcomes: text,
  rdGrants: text,
  rdCollaborations: text,
  intellectualPropertyRecords: z.array(intellectualPropertyRecordSchema),
  notes: text,
});
export type TechnologyQualityResearchAndIntellectualProperty = z.infer<
  typeof technologyQualityResearchAndIntellectualPropertySchema
>;

/* -------------------------------------------------------------------------- */
/* 7. Workforce, collaborations, insurance & continuity                        */
/* -------------------------------------------------------------------------- */

export const workforcePeriodSchema = z.object({
  id: idSchema,
  asOfDate: text,
  periodLabel: text,
  isCurrentPeriod: z.boolean(),
  permanentEmployees: decimalStringSchema,
  contractWorkers: decimalStringSchema,
  factoryOrOperationalWorkers: decimalStringSchema,
  technicalOrRdEmployees: decimalStringSchema,
  salesEmployees: decimalStringSchema,
  administrationEmployees: decimalStringSchema,
  womenEmployees: decimalStringSchema,
  personsWithDisabilities: decimalStringSchema,
  unionisedEmployees: decimalStringSchema,
  attritionPercentage: decimalStringSchema,
  geographicDistribution: text,
  notes: text,
});
export type WorkforcePeriod = z.infer<typeof workforcePeriodSchema>;

export const collaborationSchema = z.object({
  id: idSchema,
  party: text,
  country: text,
  nature: z.enum(['', ...COLLABORATION_NATURE_VALUES]),
  agreementDate: text,
  term: text,
  exclusivity: yesNoNotSureOrEmptySchema,
  geography: text,
  supportOrServicesReceived: text,
  renewalOrTerminationStatus: text,
  materialDependency: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type Collaboration = z.infer<typeof collaborationSchema>;

export const operatingDependencySchema = z.object({
  id: idSchema,
  dependencyType: z.enum(['', ...DEPENDENCY_TYPE_VALUES]),
  description: text,
  applicable: yesNoNotSureOrEmptySchema,
  counterpartyOrProvider: text,
  quantification: text,
  mitigation: text,
  materialityStatus: z.enum(['', ...MATERIALITY_STATUS_VALUES]),
  notes: text,
});
export type OperatingDependency = z.infer<typeof operatingDependencySchema>;

export const insurancePolicySchema = z.object({
  id: idSchema,
  policyType: z.enum(['', ...INSURANCE_POLICY_TYPE_VALUES]),
  insurer: text,
  coverage: text,
  sumInsured: decimalStringSchema,
  policyPeriod: text,
  deductible: text,
  keyExclusions: text,
  claimsHistory: text,
  renewalStatus: text,
  notes: text,
});
export type InsurancePolicy = z.infer<typeof insurancePolicySchema>;

export const workforceCollaborationsInsuranceAndContinuitySchema = z.object({
  workforcePeriods: z.array(workforcePeriodSchema),
  labourDisputes: yesNoNotSureOrEmptySchema,
  labourDisputeDetails: text,
  trainingProgrammes: text,
  specialisedSkillDependence: yesNoNotSureOrEmptySchema,
  specialisedSkillDependenceDetails: text,
  labourContractorUsage: yesNoNotSureOrEmptySchema,
  labourContractorDetails: text,
  collaborations: z.array(collaborationSchema),
  operatingDependencies: z.array(operatingDependencySchema),
  insurancePolicies: z.array(insurancePolicySchema),
  managementConsidersCoverageAdequate: yesNoNotSureOrEmptySchema,
  professionalInsuranceReviewPerformed: yesNoNotSureOrEmptySchema,
  materialUninsuredOperations: yesNoNotSureOrEmptySchema,
  materialUninsuredOperationsDetails: text,
  keyPersonInsuranceInPlace: yesNoNotSureOrEmptySchema,
  cyberInsuranceInPlace: yesNoNotSureOrEmptySchema,
  businessContinuityPlanExists: yesNoNotSureOrEmptySchema,
  disasterRecoveryPlanExists: yesNoNotSureOrEmptySchema,
  alternateFacilityAvailable: yesNoNotSureOrEmptySchema,
  backupSuppliersAvailable: yesNoNotSureOrEmptySchema,
  backupPowerOrDataAvailable: yesNoNotSureOrEmptySchema,
  cyberIncidentResponsePlanExists: yesNoNotSureOrEmptySchema,
  continuityLastTestDate: text,
  materialInterruptionsExperienced: yesNoNotSureOrEmptySchema,
  materialInterruptionsDetails: text,
  maximumDowntimeExperienced: text,
  recoveryStatus: text,
  notes: text,
});
export type WorkforceCollaborationsInsuranceAndContinuity = z.infer<
  typeof workforceCollaborationsInsuranceAndContinuitySchema
>;

/* -------------------------------------------------------------------------- */
/* 8. Competitive strengths, strategy, dependencies & confirmations            */
/* -------------------------------------------------------------------------- */

export const competitiveStrengthSchema = z.object({
  id: idSchema,
  title: text,
  explanation: text,
  supportingMetric: text,
  period: text,
  supportingSource: text,
  relatedProductFacilityOrCustomer: text,
  companyConfirmation: yesNoNotSureOrEmptySchema,
  professionalReviewStatus: z.enum(['', ...PROFESSIONAL_REVIEW_STATUS_VALUES]),
  notes: text,
});
export type CompetitiveStrength = z.infer<typeof competitiveStrengthSchema>;

export const strategyItemSchema = z.object({
  id: idSchema,
  title: text,
  description: text,
  category: z.enum(['', ...STRATEGY_CATEGORY_VALUES]),
  timeHorizon: z.enum(['', ...STRATEGY_TIME_HORIZON_VALUES]),
  currentStatus: z.enum(['', ...STRATEGY_STATUS_VALUES]),
  requiredResources: text,
  dependencies: text,
  relatedObjectsOfTheIssueReference: text,
  boardApprovedStatus: yesNoNotSureOrEmptySchema,
  supportingPlanOrSource: text,
  risks: text,
  containsUnsupportedProjections: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type StrategyItem = z.infer<typeof strategyItemSchema>;

export const keyDependencySchema = z.object({
  id: idSchema,
  dependencyType: z.enum(['', ...DEPENDENCY_TYPE_VALUES]),
  description: text,
  quantification: text,
  mitigation: text,
  materialityStatus: z.enum(['', ...MATERIALITY_STATUS_VALUES]),
  relatedFutureRiskFactor: text,
  notes: text,
});
export type KeyDependency = z.infer<typeof keyDependencySchema>;

export const businessOperationsConfirmationsSchema = z.object({
  allMaterialActivitiesDisclosed: z.boolean(),
  productsAndServicesAreComplete: z.boolean(),
  revenueMixReconciles: z.boolean(),
  customerConcentrationIsComplete: z.boolean(),
  supplierConcentrationIsComplete: z.boolean(),
  allFacilitiesAreIncluded: z.boolean(),
  capacityUnitsAndFiguresAreConsistent: z.boolean(),
  outsourcedOperationsAreDisclosed: z.boolean(),
  technologyAndIpDependenciesAreDisclosed: z.boolean(),
  qualityIncidentsAndRecallsAreDisclosed: z.boolean(),
  insuranceAndContinuityInformationIsComplete: z.boolean(),
  strengthClaimsHaveSupportingSources: z.boolean(),
  strategiesContainNoUnsupportedProjections: z.boolean(),
  professionalReviewRemainsRequired: z.boolean(),
});
export type BusinessOperationsConfirmations = z.infer<
  typeof businessOperationsConfirmationsSchema
>;

export const competitiveStrengthsStrategyDependenciesAndConfirmationsSchema = z.object({
  competitiveStrengths: z.array(competitiveStrengthSchema),
  strategies: z.array(strategyItemSchema),
  keyDependencies: z.array(keyDependencySchema),
  confirmations: businessOperationsConfirmationsSchema,
  notes: text,
});
export type CompetitiveStrengthsStrategyDependenciesAndConfirmations = z.infer<
  typeof competitiveStrengthsStrategyDependenciesAndConfirmationsSchema
>;

/* -------------------------------------------------------------------------- */
/* Payload                                                                     */
/* -------------------------------------------------------------------------- */

export const businessOperationsPayloadSchema = z.object({
  schemaVersion: z.literal(BUSINESS_OPERATIONS_SCHEMA_VERSION),
  businessProfileAndOperatingModel: businessProfileAndOperatingModelSchema,
  productsServicesAndRevenueMix: productsServicesAndRevenueMixSchema,
  customersSalesDistributionAndGeography: customersSalesDistributionAndGeographySchema,
  suppliersProcurementInventoryAndLogistics: suppliersProcurementInventoryAndLogisticsSchema,
  facilitiesCapacityAndOperationalProcess: facilitiesCapacityAndOperationalProcessSchema,
  technologyQualityResearchAndIntellectualProperty:
    technologyQualityResearchAndIntellectualPropertySchema,
  workforceCollaborationsInsuranceAndContinuity:
    workforceCollaborationsInsuranceAndContinuitySchema,
  competitiveStrengthsStrategyDependenciesAndConfirmations:
    competitiveStrengthsStrategyDependenciesAndConfirmationsSchema,
});

export type BusinessOperationsPayload = z.infer<typeof businessOperationsPayloadSchema>;

export type BusinessOperationsSectionId =
  | 'business-profile-operating-model'
  | 'products-services-revenue-mix'
  | 'customers-sales-distribution-geography'
  | 'suppliers-procurement-inventory-logistics'
  | 'facilities-capacity-operational-process'
  | 'technology-quality-rd-ip'
  | 'workforce-collaborations-insurance-continuity'
  | 'competitive-strengths-strategy-confirmations';

export const BUSINESS_OPERATIONS_SECTION_IDS: BusinessOperationsSectionId[] = [
  'business-profile-operating-model',
  'products-services-revenue-mix',
  'customers-sales-distribution-geography',
  'suppliers-procurement-inventory-logistics',
  'facilities-capacity-operational-process',
  'technology-quality-rd-ip',
  'workforce-collaborations-insurance-continuity',
  'competitive-strengths-strategy-confirmations',
];

export const sectionIdSchema = z.enum([
  'business-profile-operating-model',
  'products-services-revenue-mix',
  'customers-sales-distribution-geography',
  'suppliers-procurement-inventory-logistics',
  'facilities-capacity-operational-process',
  'technology-quality-rd-ip',
  'workforce-collaborations-insurance-continuity',
  'competitive-strengths-strategy-confirmations',
]);
