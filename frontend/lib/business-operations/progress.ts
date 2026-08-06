/**
 * Section completion for Business & Operations.
 *
 * Mirrors the Capital & Ownership progress model: each section resolves to
 * `not_started | in_progress | complete`, and an unanswered ternary is never treated as "no".
 */

import { isFilledDecimal } from '@/lib/business-operations/decimal';
import {
  BUSINESS_OPERATIONS_CONFIRMATION_FIELDS,
  BUSINESS_OPERATIONS_SECTION_LABELS,
} from '@/lib/business-operations/options';
import type {
  BusinessOperationsPayload,
  BusinessOperationsProgress,
  BusinessOperationsSectionId,
  SectionStatus,
} from '@/lib/business-operations/types';

function filled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function statusFrom(answered: number, total: number, extraComplete = true): SectionStatus {
  if (answered === 0) return 'not_started';
  if (answered < total || !extraComplete) return 'in_progress';
  return 'complete';
}

export function evaluateBusinessProfileStatus(payload: BusinessOperationsPayload): SectionStatus {
  const section = payload.businessProfileAndOperatingModel;
  const core = [
    filled(section.businessCommencementDate),
    section.businessClassifications.length > 0,
    filled(section.primaryBusinessActivity),
    filled(section.briefBusinessOverview),
    filled(section.customerModel),
    section.revenueModels.length > 0,
    filled(section.orderModel),
    filled(section.domesticOperations),
    filled(section.exportOperations),
    filled(section.valueCreationAndDeliveryExplanation),
  ];
  const answered = core.filter(Boolean).length;

  const unitsComplete = section.businessUnits.every(
    (unit) => filled(unit.unitName) && filled(unit.status),
  );
  const seasonalityExplained =
    section.seasonalityOrCyclicality !== 'yes' || filled(section.seasonalityDetails);
  const thirdPartyExplained =
    section.materialThirdPartyDependence !== 'yes' ||
    filled(section.materialThirdPartyDependenceDetails);
  const regulatoryExplained =
    section.materialRegulatoryDependence !== 'yes' ||
    filled(section.materialRegulatoryDependenceDetails);

  return statusFrom(
    answered,
    core.length,
    unitsComplete && seasonalityExplained && thirdPartyExplained && regulatoryExplained,
  );
}

export function evaluateProductsRevenueStatus(payload: BusinessOperationsPayload): SectionStatus {
  const section = payload.productsServicesAndRevenueMix;
  const productsEntered = section.productsServices.filter((item) => filled(item.name));
  const core = [
    productsEntered.length > 0,
    section.revenueMixRows.length > 0,
  ];
  const answered = core.filter(Boolean).length;

  const productsComplete = productsEntered.every(
    (item) => filled(item.productType) && filled(item.businessSegment),
  );
  const mixComplete = section.revenueMixRows.every(
    (row) =>
      filled(row.financialYear) &&
      (isFilledDecimal(row.revenue) || isFilledDecimal(row.percentageOfRevenueFromOperations)),
  );
  const changesComplete = section.offeringChanges.every(
    (item) => filled(item.offeringName) && filled(item.changeType),
  );

  return statusFrom(answered, core.length, productsComplete && mixComplete && changesComplete);
}

export function evaluateCustomersSalesStatus(payload: BusinessOperationsPayload): SectionStatus {
  const section = payload.customersSalesDistributionAndGeography;
  const core = [
    isFilledDecimal(section.approximateActiveCustomerCount) || filled(section.customerCategories),
    filled(section.governmentTenderDependence),
    filled(section.largeEnterpriseDependence),
    filled(section.longTermContractsAvailable),
    filled(section.purchaseOrderDependence),
    section.customerConcentrationPeriods.length > 0 || section.materialCustomers.length > 0,
  ];
  const answered = core.filter(Boolean).length;

  const concentrationComplete = section.customerConcentrationPeriods.every(
    (row) =>
      filled(row.periodLabel) &&
      (isFilledDecimal(row.largestCustomerPercentage) ||
        isFilledDecimal(row.totalRevenueFromOperations)),
  );
  const customersComplete = section.materialCustomers.every(
    (item) => filled(item.customerNameOrConfidentialLabel),
  );
  const channelsComplete = section.salesChannels.every(
    (item) => filled(item.channelType) || filled(item.geography),
  );
  const geoComplete = section.geographicRevenueRows.every(
    (row) =>
      filled(row.periodLabel) &&
      (isFilledDecimal(row.revenue) || isFilledDecimal(row.percentageOfRevenue)),
  );
  const orderBookComplete =
    section.orderBookAvailable !== 'yes' ||
    (isFilledDecimal(section.orderBookValue) && filled(section.orderBookAsOfDate));

  return statusFrom(
    answered,
    core.length,
    concentrationComplete &&
      customersComplete &&
      channelsComplete &&
      geoComplete &&
      orderBookComplete,
  );
}

export function evaluateSuppliersProcurementStatus(
  payload: BusinessOperationsPayload,
): SectionStatus {
  const section = payload.suppliersProcurementInventoryAndLogistics;
  const core = [
    section.keyInputs.length > 0 || section.materialSuppliers.length > 0,
    section.supplierConcentrationPeriods.length > 0,
    filled(section.procurementModel),
    filled(section.relatedPartySupplierDependence),
    filled(section.productionModel),
    filled(section.logisticsModel),
  ];
  const answered = core.filter(Boolean).length;

  const inputsComplete = section.keyInputs.every((item) => filled(item.inputName));
  const concentrationComplete = section.supplierConcentrationPeriods.every(
    (row) =>
      filled(row.periodLabel) &&
      (isFilledDecimal(row.largestSupplierPercentage) || isFilledDecimal(row.totalPurchases)),
  );
  const suppliersComplete = section.materialSuppliers.every(
    (item) => filled(item.supplierNameOrConfidentialLabel),
  );
  const writeOffsExplained =
    section.materialWriteOffs !== 'yes' || filled(section.materialWriteOffDetails);

  return statusFrom(
    answered,
    core.length,
    inputsComplete && concentrationComplete && suppliersComplete && writeOffsExplained,
  );
}

export function evaluateFacilitiesCapacityStatus(
  payload: BusinessOperationsPayload,
): SectionStatus {
  const section = payload.facilitiesCapacityAndOperationalProcess;
  const facilitiesEntered = section.facilities.filter((item) => filled(item.name));
  const core = [
    facilitiesEntered.length > 0,
    filled(section.electricityDependency),
    filled(section.waterDependency),
  ];
  const answered = core.filter(Boolean).length;

  const facilitiesComplete = facilitiesEntered.every(
    (item) => filled(item.facilityType) && filled(item.status),
  );
  const capacityComplete = section.capacityRecords.every(
    (row) =>
      (filled(row.facilityId) || filled(row.facilityName)) &&
      filled(row.periodLabel) &&
      (isFilledDecimal(row.installedCapacity) || isFilledDecimal(row.actualOutput)),
  );
  const processComplete = section.operatingProcessSteps.every(
    (step) => filled(step.processName) && filled(step.stepNumber),
  );

  return statusFrom(
    answered,
    core.length,
    facilitiesComplete && capacityComplete && processComplete,
  );
}

export function evaluateTechnologyQualityIpStatus(
  payload: BusinessOperationsPayload,
): SectionStatus {
  const section = payload.technologyQualityResearchAndIntellectualProperty;
  const core = [
    filled(section.coreOperatingTechnology),
    filled(section.technologyOwnership),
    filled(section.qualityProcess),
    filled(section.rdFunctionExists),
    filled(section.thirdPartyTechnologyDependence),
    filled(section.materialRecallDeclaration),
  ];
  const answered = core.filter(Boolean).length;

  const equipmentComplete = section.machineryAndEquipment.every(
    (item) => filled(item.nameOrType),
  );
  const certificationsComplete = section.certifications.every(
    (item) => filled(item.standard),
  );
  const ipComplete = section.intellectualPropertyRecords.every(
    (item) => filled(item.ipType) && filled(item.nameOrDescription),
  );
  const claimsExplained =
    section.qualityClaims !== 'yes' || filled(section.qualityClaimsDetails);
  const recallExplained =
    section.materialRecallDeclaration !== 'yes' || filled(section.materialRecallDetails);

  return statusFrom(
    answered,
    core.length,
    equipmentComplete &&
      certificationsComplete &&
      ipComplete &&
      claimsExplained &&
      recallExplained,
  );
}

export function evaluateWorkforceInsuranceStatus(
  payload: BusinessOperationsPayload,
): SectionStatus {
  const section = payload.workforceCollaborationsInsuranceAndContinuity;
  const core = [
    section.workforcePeriods.length > 0,
    filled(section.labourDisputes),
    filled(section.specialisedSkillDependence),
    filled(section.managementConsidersCoverageAdequate),
    filled(section.businessContinuityPlanExists),
    filled(section.disasterRecoveryPlanExists),
  ];
  const answered = core.filter(Boolean).length;

  const workforceComplete = section.workforcePeriods.every(
    (row) =>
      filled(row.periodLabel) &&
      (isFilledDecimal(row.permanentEmployees) || isFilledDecimal(row.contractWorkers)),
  );
  const collaborationsComplete = section.collaborations.every((item) => filled(item.party));
  const dependenciesComplete = section.operatingDependencies.every(
    (item) => filled(item.dependencyType) || filled(item.description),
  );
  const policiesComplete = section.insurancePolicies.every(
    (item) => filled(item.policyType) || filled(item.insurer),
  );
  const disputesExplained =
    section.labourDisputes !== 'yes' || filled(section.labourDisputeDetails);

  return statusFrom(
    answered,
    core.length,
    workforceComplete &&
      collaborationsComplete &&
      dependenciesComplete &&
      policiesComplete &&
      disputesExplained,
  );
}

export function evaluateStrategyConfirmationsStatus(
  payload: BusinessOperationsPayload,
): SectionStatus {
  const section = payload.competitiveStrengthsStrategyDependenciesAndConfirmations;
  const confirmationsChecked = BUSINESS_OPERATIONS_CONFIRMATION_FIELDS.filter(
    (field) => section.confirmations[field.key],
  ).length;
  const core = [
    section.competitiveStrengths.length > 0 || section.strategies.length > 0,
    section.keyDependencies.length > 0 || filled(section.notes),
    confirmationsChecked > 0,
  ];
  const answered = core.filter(Boolean).length;

  const strengthsComplete = section.competitiveStrengths.every(
    (item) => filled(item.title) && filled(item.explanation),
  );
  const strategiesComplete = section.strategies.every(
    (item) => filled(item.title) && filled(item.description),
  );
  const dependenciesComplete = section.keyDependencies.every(
    (item) => filled(item.dependencyType) && filled(item.description),
  );
  const confirmationsComplete =
    confirmationsChecked === BUSINESS_OPERATIONS_CONFIRMATION_FIELDS.length;

  return statusFrom(
    answered,
    core.length,
    strengthsComplete && strategiesComplete && dependenciesComplete && confirmationsComplete,
  );
}

export function calculateBusinessOperationsProgress(
  payload: BusinessOperationsPayload,
): BusinessOperationsProgress {
  const sections: Record<BusinessOperationsSectionId, SectionStatus> = {
    'business-profile-operating-model': evaluateBusinessProfileStatus(payload),
    'products-services-revenue-mix': evaluateProductsRevenueStatus(payload),
    'customers-sales-distribution-geography': evaluateCustomersSalesStatus(payload),
    'suppliers-procurement-inventory-logistics': evaluateSuppliersProcurementStatus(payload),
    'facilities-capacity-operational-process': evaluateFacilitiesCapacityStatus(payload),
    'technology-quality-rd-ip': evaluateTechnologyQualityIpStatus(payload),
    'workforce-collaborations-insurance-continuity': evaluateWorkforceInsuranceStatus(payload),
    'competitive-strengths-strategy-confirmations': evaluateStrategyConfirmationsStatus(payload),
  };

  const statuses = Object.values(sections);
  const sectionsComplete = statuses.filter((status) => status === 'complete').length;
  const totalSections = statuses.length;
  let overallStatus: SectionStatus = 'not_started';
  if (sectionsComplete === totalSections) overallStatus = 'complete';
  else if (statuses.some((status) => status !== 'not_started')) overallStatus = 'in_progress';

  return { sections, sectionsComplete, totalSections, overallStatus };
}

export function listIncompleteBusinessOperationsSections(
  payload: BusinessOperationsPayload,
): string[] {
  const progress = calculateBusinessOperationsProgress(payload);
  const incomplete: string[] = [];
  for (const [id, status] of Object.entries(progress.sections) as Array<
    [BusinessOperationsSectionId, SectionStatus]
  >) {
    if (status !== 'complete') {
      incomplete.push(`${BUSINESS_OPERATIONS_SECTION_LABELS[id]} incomplete`);
    }
  }
  return incomplete;
}
