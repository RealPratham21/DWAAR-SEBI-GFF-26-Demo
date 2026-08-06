/**
 * Derived Business & Operations computations.
 *
 * Nothing in this file is persisted. Every result is recomputed from the payload using
 * Decimal-safe string arithmetic.
 */

import {
  abs,
  compare,
  difference,
  greaterThan,
  isFilledDecimal,
  isPositive,
  pct,
  round,
  sumDecimals,
  toDecimalString,
} from '@/lib/business-operations/decimal';
import type { BusinessOperationsPayload } from '@/lib/business-operations/types';

export type ReconciliationStatus =
  | 'reconciled'
  | 'variance'
  | 'missing_information'
  | 'not_applicable';

export type ReconciliationCheck = {
  id: string;
  label: string;
  status: ReconciliationStatus;
  message: string;
};

export type RevenueMixYearSummary = {
  financialYear: string;
  totalRevenue: string;
  totalPercentage: string;
  rowCount: number;
  percentagesReconcile: boolean;
  varianceFrom100: string;
};

export type LargestSegmentSummary = {
  label: string;
  financialYear: string;
  revenue: string;
  percentage: string;
};

export type ConcentrationPeriodSummary = {
  periodLabel: string;
  isCurrentPeriod: boolean;
  largestPercentage: string;
  top3Percentage: string;
  top5Percentage: string;
  top10Percentage: string;
  total: string;
};

export type GeographicMixRow = {
  periodLabel: string;
  geographicScope: string;
  regionOrCountry: string;
  revenue: string;
  percentage: string;
};

export type CapacityUtilisationRow = {
  id: string;
  facilityId: string;
  facilityName: string;
  periodLabel: string;
  isCurrentPeriod: boolean;
  metricOrCapacityUnit: string;
  installedCapacity: string;
  availableCapacity: string;
  actualOutput: string;
  /** Capped at 100 for display when over; raw value remains in rawUtilisationPercentage. */
  utilisationPercentage: string;
  rawUtilisationPercentage: string;
  exceeds100: boolean;
  explanationProvided: boolean;
};

export type WorkforceLatestTotals = {
  asOfDate: string;
  periodLabel: string;
  permanentEmployees: string;
  contractWorkers: string;
  totalHeadcount: string;
  womenEmployees: string;
  attritionPercentage: string;
};

export type BusinessOperationsCounts = {
  products: number;
  facilities: number;
  certifications: number;
  ipRecords: number;
  strengths: number;
  strategies: number;
  dependencies: number;
  businessUnits: number;
  materialCustomers: number;
  materialSuppliers: number;
};

export type BusinessOperationsModel = {
  revenueMixByYear: RevenueMixYearSummary[];
  largestSegment: LargestSegmentSummary | null;
  productConcentration: {
    largestProductPercentage: string;
    productCountWithRevenue: number;
  };
  revenuePercentagesReconcile: boolean;
  customerConcentration: ConcentrationPeriodSummary[];
  supplierConcentration: ConcentrationPeriodSummary[];
  geographicMix: GeographicMixRow[];
  capacityUtilisation: CapacityUtilisationRow[];
  workforceLatest: WorkforceLatestTotals | null;
  counts: BusinessOperationsCounts;
  reconciliation: ReconciliationCheck[];
};

const PERCENT_RECONCILE_TOLERANCE = '2';

function percentageVarianceFrom100(totalPercentage: string): string {
  return difference(totalPercentage, '100');
}

function reconcilesTo100(totalPercentage: string): boolean {
  if (!isFilledDecimal(totalPercentage)) return false;
  const variance = abs(percentageVarianceFrom100(totalPercentage));
  if (!isFilledDecimal(variance)) return false;
  const cmp = compare(variance, PERCENT_RECONCILE_TOLERANCE);
  return cmp !== null && cmp <= 0;
}

function computeRevenueMix(payload: BusinessOperationsPayload): {
  byYear: RevenueMixYearSummary[];
  largest: LargestSegmentSummary | null;
  productConcentration: BusinessOperationsModel['productConcentration'];
  allReconcile: boolean;
} {
  const rows = payload.productsServicesAndRevenueMix.revenueMixRows;
  const years = new Map<string, typeof rows>();
  for (const row of rows) {
    const year = row.financialYear.trim() || '(unspecified)';
    const list = years.get(year) ?? [];
    list.push(row);
    years.set(year, list);
  }

  const byYear: RevenueMixYearSummary[] = [];
  let largest: LargestSegmentSummary | null = null;

  for (const [financialYear, yearRows] of years) {
    const totalRevenue = sumDecimals(yearRows.map((row) => row.revenue));
    const totalPercentage = sumDecimals(
      yearRows.map((row) => row.percentageOfRevenueFromOperations),
    );
    const percentagesReconcile = reconcilesTo100(totalPercentage);
    byYear.push({
      financialYear,
      totalRevenue,
      totalPercentage,
      rowCount: yearRows.length,
      percentagesReconcile,
      varianceFrom100: percentageVarianceFrom100(totalPercentage),
    });

    for (const row of yearRows) {
      const percentage = toDecimalString(row.percentageOfRevenueFromOperations);
      const revenue = toDecimalString(row.revenue);
      const label = row.productOrSegmentLabel || row.productOrSegmentId || 'Unnamed segment';
      if (!largest) {
        if (isFilledDecimal(percentage) || isFilledDecimal(revenue)) {
          largest = {
            label,
            financialYear,
            revenue,
            percentage,
          };
        }
        continue;
      }
      if (
        isFilledDecimal(percentage) &&
        (!isFilledDecimal(largest.percentage) || greaterThan(percentage, largest.percentage))
      ) {
        largest = { label, financialYear, revenue, percentage };
      } else if (
        !isFilledDecimal(percentage) &&
        isFilledDecimal(revenue) &&
        (!isFilledDecimal(largest.revenue) || greaterThan(revenue, largest.revenue))
      ) {
        largest = { label, financialYear, revenue, percentage };
      }
    }
  }

  byYear.sort((a, b) => a.financialYear.localeCompare(b.financialYear));

  const productIdsWithRevenue = new Set(
    rows
      .filter(
        (row) =>
          isFilledDecimal(row.revenue) || isFilledDecimal(row.percentageOfRevenueFromOperations),
      )
      .map((row) => row.productOrSegmentId || row.productOrSegmentLabel),
  );

  return {
    byYear,
    largest,
    productConcentration: {
      largestProductPercentage: largest?.percentage ?? '',
      productCountWithRevenue: productIdsWithRevenue.size,
    },
    allReconcile: byYear.length > 0 && byYear.every((year) => year.percentagesReconcile),
  };
}

function computeCustomerConcentration(
  payload: BusinessOperationsPayload,
): ConcentrationPeriodSummary[] {
  return payload.customersSalesDistributionAndGeography.customerConcentrationPeriods.map(
    (row) => ({
      periodLabel: row.periodLabel,
      isCurrentPeriod: row.isCurrentPeriod,
      largestPercentage: toDecimalString(row.largestCustomerPercentage),
      top3Percentage: toDecimalString(row.top3Percentage),
      top5Percentage: toDecimalString(row.top5Percentage),
      top10Percentage: toDecimalString(row.top10Percentage),
      total: toDecimalString(row.totalRevenueFromOperations),
    }),
  );
}

function computeSupplierConcentration(
  payload: BusinessOperationsPayload,
): ConcentrationPeriodSummary[] {
  return payload.suppliersProcurementInventoryAndLogistics.supplierConcentrationPeriods.map(
    (row) => ({
      periodLabel: row.periodLabel,
      isCurrentPeriod: row.isCurrentPeriod,
      largestPercentage: toDecimalString(row.largestSupplierPercentage),
      top3Percentage: toDecimalString(row.top3Percentage),
      top5Percentage: toDecimalString(row.top5Percentage),
      top10Percentage: toDecimalString(row.top10Percentage),
      total: toDecimalString(row.totalPurchases),
    }),
  );
}

function computeGeographicMix(payload: BusinessOperationsPayload): GeographicMixRow[] {
  return payload.customersSalesDistributionAndGeography.geographicRevenueRows.map((row) => ({
    periodLabel: row.periodLabel,
    geographicScope: row.geographicScope,
    regionOrCountry: row.regionOrCountry,
    revenue: toDecimalString(row.revenue),
    percentage: toDecimalString(row.percentageOfRevenue),
  }));
}

function computeCapacityUtilisation(
  payload: BusinessOperationsPayload,
): CapacityUtilisationRow[] {
  return payload.facilitiesCapacityAndOperationalProcess.capacityRecords.map((row) => {
    const base = isPositive(row.availableCapacity)
      ? row.availableCapacity
      : row.installedCapacity;
    const raw = pct(row.actualOutput, base, 4);
    const exceeds100 = isFilledDecimal(raw) && greaterThan(raw, '100');
    const utilisationPercentage =
      exceeds100 ? '100' : isFilledDecimal(raw) ? round(raw, 2) : '';
    return {
      id: row.id,
      facilityId: row.facilityId,
      facilityName: row.facilityName,
      periodLabel: row.periodLabel,
      isCurrentPeriod: row.isCurrentPeriod,
      metricOrCapacityUnit: row.metricOrCapacityUnit,
      installedCapacity: toDecimalString(row.installedCapacity),
      availableCapacity: toDecimalString(row.availableCapacity),
      actualOutput: toDecimalString(row.actualOutput),
      utilisationPercentage,
      rawUtilisationPercentage: isFilledDecimal(raw) ? round(raw, 2) : '',
      exceeds100,
      explanationProvided: row.utilisationAbove100Explanation.trim().length > 0,
    };
  });
}

function computeWorkforceLatest(
  payload: BusinessOperationsPayload,
): WorkforceLatestTotals | null {
  const periods = payload.workforceCollaborationsInsuranceAndContinuity.workforcePeriods;
  if (periods.length === 0) return null;
  const current = periods.find((row) => row.isCurrentPeriod) ?? periods[periods.length - 1];
  if (!current) return null;
  const totalHeadcount = sumDecimals([current.permanentEmployees, current.contractWorkers]);
  return {
    asOfDate: current.asOfDate,
    periodLabel: current.periodLabel,
    permanentEmployees: toDecimalString(current.permanentEmployees),
    contractWorkers: toDecimalString(current.contractWorkers),
    totalHeadcount,
    womenEmployees: toDecimalString(current.womenEmployees),
    attritionPercentage: toDecimalString(current.attritionPercentage),
  };
}

function reconcileBusinessOperations(
  payload: BusinessOperationsPayload,
  context: {
    revenueMixByYear: RevenueMixYearSummary[];
    revenuePercentagesReconcile: boolean;
    capacityUtilisation: CapacityUtilisationRow[];
    geographicMix: GeographicMixRow[];
  },
): ReconciliationCheck[] {
  const checks: ReconciliationCheck[] = [];
  const profile = payload.businessProfileAndOperatingModel;
  const products = payload.productsServicesAndRevenueMix;
  const customers = payload.customersSalesDistributionAndGeography;
  const suppliers = payload.suppliersProcurementInventoryAndLogistics;
  const facilities = payload.facilitiesCapacityAndOperationalProcess;
  const strategy = payload.competitiveStrengthsStrategyDependenciesAndConfirmations;

  if (!profile.primaryBusinessActivity.trim() || profile.revenueModels.length === 0) {
    checks.push({
      id: 'primary-activity-revenue-model',
      label: 'Primary activity and revenue model captured',
      status: 'missing_information',
      message: 'Primary business activity or revenue model has not been captured.',
    });
  } else {
    checks.push({
      id: 'primary-activity-revenue-model',
      label: 'Primary activity and revenue model captured',
      status: 'reconciled',
      message: 'Primary activity and at least one revenue model are recorded.',
    });
  }

  if (context.revenueMixByYear.length === 0) {
    checks.push({
      id: 'revenue-mix-reconcile',
      label: 'Revenue percentages reconcile by year',
      status: 'missing_information',
      message: 'No revenue-mix rows have been entered yet.',
    });
  } else if (context.revenuePercentagesReconcile) {
    checks.push({
      id: 'revenue-mix-reconcile',
      label: 'Revenue percentages reconcile by year',
      status: 'reconciled',
      message: 'Revenue-mix percentages total approximately 100% for each year entered.',
    });
  } else {
    checks.push({
      id: 'revenue-mix-reconcile',
      label: 'Revenue percentages reconcile by year',
      status: 'variance',
      message: 'One or more years have revenue-mix percentages that do not total near 100%.',
    });
  }

  if (products.productsServices.length === 0) {
    checks.push({
      id: 'material-products-represented',
      label: 'Material products are represented',
      status: 'missing_information',
      message: 'No products or services have been recorded.',
    });
  } else {
    checks.push({
      id: 'material-products-represented',
      label: 'Material products are represented',
      status: 'reconciled',
      message: `${products.productsServices.length} product/service record(s) captured.`,
    });
  }

  if (customers.customerConcentrationPeriods.length === 0) {
    checks.push({
      id: 'customer-concentration',
      label: 'Customer concentration is provided',
      status: 'missing_information',
      message: 'Customer concentration by period has not been provided.',
    });
  } else {
    checks.push({
      id: 'customer-concentration',
      label: 'Customer concentration is provided',
      status: 'reconciled',
      message: `${customers.customerConcentrationPeriods.length} customer concentration period(s) recorded.`,
    });
  }

  if (suppliers.supplierConcentrationPeriods.length === 0) {
    checks.push({
      id: 'supplier-concentration',
      label: 'Supplier concentration is provided',
      status: 'missing_information',
      message: 'Supplier concentration by period has not been provided.',
    });
  } else {
    checks.push({
      id: 'supplier-concentration',
      label: 'Supplier concentration is provided',
      status: 'reconciled',
      message: `${suppliers.supplierConcentrationPeriods.length} supplier concentration period(s) recorded.`,
    });
  }

  if (context.geographicMix.length === 0) {
    checks.push({
      id: 'geographic-revenue',
      label: 'Geographic revenue mix is provided',
      status: 'missing_information',
      message: 'Geographic revenue rows have not been entered.',
    });
  } else {
    const periods = new Map<string, string[]>();
    for (const row of context.geographicMix) {
      const list = periods.get(row.periodLabel) ?? [];
      list.push(row.percentage);
      periods.set(row.periodLabel, list);
    }
    let geoOk = true;
    let anyPercentage = false;
    for (const [, percentages] of periods) {
      const total = sumDecimals(percentages);
      if (isFilledDecimal(total)) {
        anyPercentage = true;
        if (!reconcilesTo100(total)) geoOk = false;
      }
    }
    checks.push({
      id: 'geographic-revenue',
      label: 'Geographic revenue reconciles',
      status: !anyPercentage
        ? 'missing_information'
        : geoOk
          ? 'reconciled'
          : 'variance',
      message: !anyPercentage
        ? 'Geographic revenue percentages are incomplete.'
        : geoOk
          ? 'Geographic revenue percentages total approximately 100% by period.'
          : 'Geographic revenue percentages do not reconcile to 100% for one or more periods.',
    });
  }

  if (customers.orderBookAvailable === 'yes') {
    if (
      isFilledDecimal(customers.orderBookValue) &&
      (customers.orderBookSourceStatus === 'available' ||
        customers.orderBookSourceStatus === 'pending')
    ) {
      checks.push({
        id: 'order-book-source',
        label: 'Order-book values have a source',
        status:
          customers.orderBookSourceStatus === 'available' ? 'reconciled' : 'missing_information',
        message:
          customers.orderBookSourceStatus === 'available'
            ? 'Order-book value is recorded with an available source.'
            : 'Order-book value is recorded but the source is still pending.',
      });
    } else {
      checks.push({
        id: 'order-book-source',
        label: 'Order-book values have a source',
        status: 'missing_information',
        message: 'Order book is marked available but value or source status is incomplete.',
      });
    }
  } else if (customers.orderBookAvailable === 'no') {
    checks.push({
      id: 'order-book-source',
      label: 'Order-book values have a source',
      status: 'not_applicable',
      message: 'No order book is reported.',
    });
  } else {
    checks.push({
      id: 'order-book-source',
      label: 'Order-book values have a source',
      status: 'missing_information',
      message: 'Whether an order book is available has not been answered.',
    });
  }

  if (facilities.facilities.length === 0) {
    checks.push({
      id: 'facilities-recorded',
      label: 'Facilities are recorded',
      status: 'missing_information',
      message: 'No facilities have been recorded.',
    });
  } else {
    checks.push({
      id: 'facilities-recorded',
      label: 'Facilities are recorded',
      status: 'reconciled',
      message: `${facilities.facilities.length} facility record(s) captured.`,
    });
  }

  const overUtilised = context.capacityUtilisation.filter((row) => row.exceeds100);
  if (context.capacityUtilisation.length === 0) {
    checks.push({
      id: 'capacity-utilisation',
      label: 'Utilisation is not above 100% without explanation',
      status: 'missing_information',
      message: 'No capacity records have been entered.',
    });
  } else if (overUtilised.some((row) => !row.explanationProvided)) {
    checks.push({
      id: 'capacity-utilisation',
      label: 'Utilisation is not above 100% without explanation',
      status: 'variance',
      message: `${overUtilised.filter((row) => !row.explanationProvided).length} capacity row(s) exceed 100% utilisation without explanation.`,
    });
  } else {
    checks.push({
      id: 'capacity-utilisation',
      label: 'Utilisation is not above 100% without explanation',
      status: 'reconciled',
      message:
        overUtilised.length > 0
          ? 'Utilisation above 100% is explained where reported.'
          : 'No capacity row exceeds 100% utilisation.',
    });
  }

  const strengthsWithoutSource = strategy.competitiveStrengths.filter(
    (item) => item.title.trim() && !item.supportingSource.trim(),
  );
  if (strategy.competitiveStrengths.length === 0) {
    checks.push({
      id: 'strength-sources',
      label: 'Strengths have supporting sources',
      status: 'missing_information',
      message: 'No competitive strengths have been recorded.',
    });
  } else if (strengthsWithoutSource.length > 0) {
    checks.push({
      id: 'strength-sources',
      label: 'Strengths have supporting sources',
      status: 'variance',
      message: `${strengthsWithoutSource.length} strength claim(s) lack a supporting source.`,
    });
  } else {
    checks.push({
      id: 'strength-sources',
      label: 'Strengths have supporting sources',
      status: 'reconciled',
      message: 'Recorded strength claims include supporting sources.',
    });
  }

  const strategiesWithProjections = strategy.strategies.filter(
    (item) => item.containsUnsupportedProjections === 'yes',
  );
  if (strategy.strategies.length === 0) {
    checks.push({
      id: 'strategy-projections',
      label: 'Strategies avoid unsupported projections',
      status: 'missing_information',
      message: 'No strategies have been recorded.',
    });
  } else if (strategiesWithProjections.length > 0) {
    checks.push({
      id: 'strategy-projections',
      label: 'Strategies avoid unsupported projections',
      status: 'variance',
      message: `${strategiesWithProjections.length} strateg(y/ies) are flagged as containing unsupported projections.`,
    });
  } else {
    checks.push({
      id: 'strategy-projections',
      label: 'Strategies avoid unsupported projections',
      status: 'reconciled',
      message: 'Recorded strategies are not flagged for unsupported projections.',
    });
  }

  return checks;
}

/** Single entry point used by the Overview, Information and Business Assessment tabs. */
export function computeBusinessOperationsModel(
  payload: BusinessOperationsPayload,
): BusinessOperationsModel {
  const mix = computeRevenueMix(payload);
  const customerConcentration = computeCustomerConcentration(payload);
  const supplierConcentration = computeSupplierConcentration(payload);
  const geographicMix = computeGeographicMix(payload);
  const capacityUtilisation = computeCapacityUtilisation(payload);
  const workforceLatest = computeWorkforceLatest(payload);

  const tech = payload.technologyQualityResearchAndIntellectualProperty;
  const strategy = payload.competitiveStrengthsStrategyDependenciesAndConfirmations;
  const workforce = payload.workforceCollaborationsInsuranceAndContinuity;

  const counts: BusinessOperationsCounts = {
    products: payload.productsServicesAndRevenueMix.productsServices.length,
    facilities: payload.facilitiesCapacityAndOperationalProcess.facilities.length,
    certifications: tech.certifications.length,
    ipRecords: tech.intellectualPropertyRecords.length,
    strengths: strategy.competitiveStrengths.length,
    strategies: strategy.strategies.length,
    dependencies:
      strategy.keyDependencies.length + workforce.operatingDependencies.length,
    businessUnits: payload.businessProfileAndOperatingModel.businessUnits.length,
    materialCustomers:
      payload.customersSalesDistributionAndGeography.materialCustomers.length,
    materialSuppliers:
      payload.suppliersProcurementInventoryAndLogistics.materialSuppliers.length,
  };

  const reconciliation = reconcileBusinessOperations(payload, {
    revenueMixByYear: mix.byYear,
    revenuePercentagesReconcile: mix.allReconcile,
    capacityUtilisation,
    geographicMix,
  });

  return {
    revenueMixByYear: mix.byYear,
    largestSegment: mix.largest,
    productConcentration: mix.productConcentration,
    revenuePercentagesReconcile: mix.allReconcile,
    customerConcentration,
    supplierConcentration,
    geographicMix,
    capacityUtilisation,
    workforceLatest,
    counts,
    reconciliation,
  };
}
