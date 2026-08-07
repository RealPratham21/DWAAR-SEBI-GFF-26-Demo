/**
 * Derived model for Borrowings, Assets & Contracts (BAC1, frontend-only).
 */

import {
  addDecimals,
  formatDecimal,
  isFilledDecimal,
  parseDecimal,
  subtractDecimals,
} from '@/lib/borrowings-assets-contracts/decimal';
import { getFacilities } from '@/lib/borrowings-assets-contracts/facilities';
import {
  formatContractLabel,
  formatPropertyLabel,
  getContracts,
  getProperties,
} from '@/lib/borrowings-assets-contracts/masters';
import type { LinkedWorkstreamReferences } from '@/lib/borrowings-assets-contracts/types';
import type {
  BorrowingsAssetsContractsPayload,
  FacilityRecord,
} from '@/lib/schemas/borrowings-assets-contracts';

const RECONCILIATION_TOLERANCE = 1;

export type FacilityCurrencyTotals = {
  currency: string;
  amountUnit: string;
  facilityCount: number;
  totalSanctioned: string;
  totalDisbursed: string;
  totalPrincipalOutstanding: string;
  totalAccruedInterest: string;
  totalOutstanding: string;
  totalUndrawn: string;
  securedDebt: string;
  unsecuredDebt: string;
  fundBasedExposure: string;
  nonFundBasedExposure: string;
  relatedPartyBorrowings: string;
};

export type InterestVarianceEntry = {
  facilityId: string;
  facilityLabel: string;
  calculatedEffectiveRate: string | null;
  enteredEffectiveRate: string;
  variance: string | null;
  hasVariance: boolean;
};

export type ConsentCounts = {
  facilitiesReviewed: number;
  consentRequired: number;
  consentRequested: number;
  consentReceived: number;
  consentPending: number;
};

export type ExpiryWindowEntry = {
  id: string;
  kind: 'property-lease' | 'contract';
  label: string;
  expiryDate: string;
  daysUntilExpiry: number | null;
};

export type ReconciliationPreview = {
  financials: {
    bacFacilityTotal: string;
    financialsValue: string | null;
    difference: string;
    status: string;
    detail: string;
  };
  objects: {
    repaymentItemCount: number;
    unresolvedCount: number;
    status: string;
    detail: string;
  };
  groupEntities: {
    status: string;
    detail: string;
  };
  capitalOwnership: {
    status: string;
    detail: string;
  };
  businessOperations: {
    status: string;
    detail: string;
  };
};

export type BorrowingsAssetsContractsModel = {
  facilityCount: number;
  currencyTotals: FacilityCurrencyTotals[];
  primaryCurrency: string | null;
  primaryAmountUnit: string | null;
  positionAsOfDate: string;
  interestVariances: InterestVarianceEntry[];
  interestVarianceCount: number;
  consentCounts: ConsentCounts;
  chargeCount: number;
  chargesRegistered: number;
  chargesPendingRegistration: number;
  personalGuaranteeCount: number;
  corporateGuaranteeCount: number;
  financialCovenantCount: number;
  covenantsRequiringReview: number;
  recordedBreaches: number;
  waiversPending: number;
  propertyCount: number;
  ownedPropertyCount: number;
  leasedPropertyCount: number;
  propertyLeasesExpiringWithin12Months: ExpiryWindowEntry[];
  contractCount: number;
  contractsExpiringWithin12Months: ExpiryWindowEntry[];
  contractsWithChangeOfControlClauses: number;
  materialAssetCount: number;
  encumberedMaterialAssetCount: number;
  titleOccupancyReviewItems: number;
  materialContractReviewItems: number;
  debtProposedForIpoRepayment: string;
  reconciliation: ReconciliationPreview;
};

function currencyKey(facility: FacilityRecord): string {
  const currency = facility.sanctionAndUtilisation.currency.trim() || 'UNSPECIFIED';
  const unit = facility.sanctionAndUtilisation.amountUnit.trim() || 'unspecified';
  return `${currency}::${unit}`;
}

function sumField(facilities: FacilityRecord[], pick: (f: FacilityRecord) => string): string {
  return addDecimals(...facilities.map(pick));
}

function buildCurrencyTotals(facilities: FacilityRecord[]): FacilityCurrencyTotals[] {
  const groups = new Map<string, FacilityRecord[]>();
  for (const facility of facilities) {
    const key = currencyKey(facility);
    const list = groups.get(key) ?? [];
    list.push(facility);
    groups.set(key, list);
  }

  return [...groups.entries()].map(([key, group]) => {
    const [currency, amountUnit] = key.split('::');
    const secured = group.filter((f) => f.securedUnsecured === 'secured');
    const unsecured = group.filter(
      (f) => f.securedUnsecured === 'unsecured' || f.securedUnsecured === 'partially-secured',
    );
    const fundBased = group.filter((f) => f.fundBasedNonFundBased === 'fund-based');
    const nonFundBased = group.filter((f) => f.fundBasedNonFundBased === 'non-fund-based');
    const relatedParty = group.filter(
      (f) =>
        f.lender.relatedPartyStatus === 'yes' ||
        f.lender.lenderType === 'related-party' ||
        f.lender.lenderType === 'promoter' ||
        f.lender.lenderType === 'director' ||
        f.lender.lenderType === 'group-entity',
    );

    return {
      currency,
      amountUnit,
      facilityCount: group.length,
      totalSanctioned: sumField(group, (f) => f.sanctionAndUtilisation.currentSanctionedLimit),
      totalDisbursed: sumField(group, (f) => f.sanctionAndUtilisation.totalAmountDisbursed),
      totalPrincipalOutstanding: sumField(
        group,
        (f) => f.sanctionAndUtilisation.principalOutstanding,
      ),
      totalAccruedInterest: sumField(group, (f) => f.sanctionAndUtilisation.accruedInterest),
      totalOutstanding: sumField(group, (f) => f.sanctionAndUtilisation.totalOutstanding),
      totalUndrawn: sumField(group, (f) => f.sanctionAndUtilisation.undrawnAmount),
      securedDebt: sumField(secured, (f) => f.sanctionAndUtilisation.totalOutstanding),
      unsecuredDebt: sumField(unsecured, (f) => f.sanctionAndUtilisation.totalOutstanding),
      fundBasedExposure: sumField(fundBased, (f) => f.sanctionAndUtilisation.totalOutstanding),
      nonFundBasedExposure: sumField(nonFundBased, (f) => f.sanctionAndUtilisation.totalOutstanding),
      relatedPartyBorrowings: sumField(relatedParty, (f) => f.sanctionAndUtilisation.totalOutstanding),
    };
  });
}

function calculateEffectiveRate(facility: FacilityRecord): string | null {
  if (facility.interest.rateType !== 'floating') return null;
  const benchmark = parseDecimal(facility.interest.benchmarkRate);
  const spread = parseDecimal(facility.interest.spread);
  if (benchmark === null && spread === null) return null;
  return formatDecimal((benchmark ?? 0) + (spread ?? 0));
}

function buildInterestVariances(facilities: FacilityRecord[]): InterestVarianceEntry[] {
  return facilities.map((facility) => {
    const calculated = calculateEffectiveRate(facility);
    const entered = facility.interest.enteredEffectiveRate;
    let variance: string | null = null;
    let hasVariance = false;

    if (calculated !== null && isFilledDecimal(entered)) {
      const calc = parseDecimal(calculated);
      const ent = parseDecimal(entered);
      if (calc !== null && ent !== null) {
        variance = formatDecimal(Math.abs(calc - ent));
        hasVariance = Math.abs(calc - ent) > 0.01;
      }
    }

    const lender = facility.lender.lenderName.trim() || facility.facilityType.replaceAll('-', ' ');
    return {
      facilityId: facility.id,
      facilityLabel: lender,
      calculatedEffectiveRate: calculated,
      enteredEffectiveRate: entered,
      variance,
      hasVariance,
    };
  });
}

function parseIsoDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function daysUntil(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function buildExpiryWindows(
  payload: BorrowingsAssetsContractsPayload,
  asOf: Date,
): {
  propertyLeases: ExpiryWindowEntry[];
  contracts: ExpiryWindowEntry[];
} {
  const horizon = new Date(asOf);
  horizon.setMonth(horizon.getMonth() + 12);

  const propertyLeases: ExpiryWindowEntry[] = [];
  for (const property of getProperties(payload)) {
    if (property.occupancyBasis === 'owned') continue;
    const expiry = parseIsoDate(property.leasedDetails.expiry);
    if (!expiry || expiry > horizon) continue;
    propertyLeases.push({
      id: property.id,
      kind: 'property-lease',
      label: formatPropertyLabel(property),
      expiryDate: property.leasedDetails.expiry,
      daysUntilExpiry: daysUntil(asOf, expiry),
    });
  }

  const contracts: ExpiryWindowEntry[] = [];
  for (const contract of getContracts(payload)) {
    const expiry = parseIsoDate(contract.basicTerms.expiry);
    if (!expiry || expiry > horizon) continue;
    contracts.push({
      id: contract.id,
      kind: 'contract',
      label: formatContractLabel(contract),
      expiryDate: contract.basicTerms.expiry,
      daysUntilExpiry: daysUntil(asOf, expiry),
    });
  }

  return { propertyLeases, contracts };
}

function reconciliationStatusLabel(status: string, linkedAvailable: boolean): string {
  if (!linkedAvailable) return 'Pending linked workstream';
  switch (status) {
    case 'reconciled':
      return 'Reconciled';
    case 'potential-inconsistency':
      return 'Potential inconsistency';
    case 'pending-professional-confirmation':
      return 'Pending professional confirmation';
    case 'pending-linked-workstream':
      return 'Pending linked workstream';
    default:
      return status ? status.replaceAll('-', ' ') : 'Not captured';
  }
}

function buildReconciliationPreview(
  payload: BorrowingsAssetsContractsPayload,
  linkedReferences: LinkedWorkstreamReferences,
  currencyTotals: FacilityCurrencyTotals[],
): ReconciliationPreview {
  const reconciliation = payload.reconciliationChangesAndIssuerConfirmations;
  const financialsRec = reconciliation.financialsReconciliation;
  const primaryTotal =
    currencyTotals[0]?.totalOutstanding ?? addDecimals(...getFacilities(payload).map((f) => f.sanctionAndUtilisation.totalOutstanding));

  const financialsLinked = linkedReferences.financialsKpis.available;
  const financialsValue = linkedReferences.financialsKpis.totalDebt;
  let financialsDifference = financialsRec.difference;
  if (!isFilledDecimal(financialsDifference) && financialsLinked && isFilledDecimal(primaryTotal) && financialsValue) {
    financialsDifference = subtractDecimals(primaryTotal, financialsValue);
  }

  let financialsStatus = financialsRec.reconciliationStatus;
  if (!financialsStatus) {
    if (!financialsLinked) financialsStatus = 'pending-linked-workstream';
    else if (isFilledDecimal(financialsDifference)) {
      const diff = Math.abs(parseDecimal(financialsDifference) ?? 0);
      financialsStatus = diff <= RECONCILIATION_TOLERANCE ? 'reconciled' : 'potential-inconsistency';
    }
  }

  const objectsItems = reconciliation.objectsOfIssueRepayments;
  const unresolvedObjects = objectsItems.filter(
    (item) =>
      item.reconciliationStatus === 'potential-inconsistency' ||
      item.reconciliationStatus === 'pending-professional-confirmation' ||
      (item.linkedFacilityId && !getFacilities(payload).some((f) => f.id === item.linkedFacilityId)),
  ).length;

  const objectsStatus =
    !linkedReferences.objectsOfIssue.available && objectsItems.length > 0
      ? 'pending-linked-workstream'
      : unresolvedObjects > 0
        ? 'potential-inconsistency'
        : objectsItems.length > 0
          ? 'reconciled'
          : '';

  const groupRec = reconciliation.groupEntitiesReconciliation;
  const capitalRec = reconciliation.capitalOwnershipReconciliation;
  const businessRec = reconciliation.businessOperationsReconciliation;

  return {
    financials: {
      bacFacilityTotal: isFilledDecimal(financialsRec.bacFacilityTotal)
        ? financialsRec.bacFacilityTotal
        : primaryTotal,
      financialsValue,
      difference: financialsDifference,
      status: reconciliationStatusLabel(financialsStatus, financialsLinked),
      detail: financialsLinked
        ? 'Compare BAC facility totals with Financials & KPIs debt figures.'
        : 'Financials & KPIs linked data not yet available.',
    },
    objects: {
      repaymentItemCount: objectsItems.length,
      unresolvedCount: unresolvedObjects,
      status: reconciliationStatusLabel(objectsStatus, linkedReferences.objectsOfIssue.available),
      detail:
        objectsItems.length > 0
          ? `${objectsItems.length} proposed repayment item(s) captured for Objects reconciliation.`
          : 'No Objects of the Issue repayment links captured yet.',
    },
    groupEntities: {
      status: reconciliationStatusLabel(
        groupRec.reconciliationStatus,
        linkedReferences.groupEntities.available,
      ),
      detail: linkedReferences.groupEntities.available
        ? 'Group Entities loans, guarantees and security cross-check.'
        : 'Group Entities linked data not yet available.',
    },
    capitalOwnership: {
      status: reconciliationStatusLabel(
        capitalRec.reconciliationStatus,
        linkedReferences.capitalOwnership.available,
      ),
      detail: linkedReferences.capitalOwnership.available
        ? 'Capital & Ownership promoter guarantees and pledge cross-check.'
        : 'Capital & Ownership linked data not yet available.',
    },
    businessOperations: {
      status: reconciliationStatusLabel(
        businessRec.reconciliationStatus,
        linkedReferences.businessOperations.available,
      ),
      detail: linkedReferences.businessOperations.available
        ? 'Business & Operations facilities, assets and insurance mapping cross-check.'
        : 'Business & Operations linked data not yet available.',
    },
  };
}

export function computeBorrowingsAssetsContractsModel(
  payload: BorrowingsAssetsContractsPayload,
  linkedReferences: LinkedWorkstreamReferences,
): BorrowingsAssetsContractsModel {
  const facilities = getFacilities(payload);
  const snapshot = payload.financialIndebtednessAndFacilityMaster.borrowingSnapshot;
  const currencyTotals = buildCurrencyTotals(facilities);
  const primary = currencyTotals[0];

  const securities = payload.securityChargesGuaranteesAndBorrowingPowers;
  const charges = securities.charges;
  const guarantees = securities.guarantees;
  const covenantSection = payload.covenantsDefaultsWaiversAndLenderConsents;

  const consents = covenantSection.lenderConsents;
  const consentRequired = consents.filter(
    (c) => c.ipoConsentRequirement === 'required' || c.ipoConsentRequirement === 'not-sure',
  ).length;
  const consentRequested = consents.filter((c) => c.consentRequested === 'yes').length;
  const consentReceived = consents.filter((c) => c.consentReceived === 'yes').length;

  const asOf =
    parseIsoDate(snapshot.positionAsOfDate) ??
    parseIsoDate(new Date().toISOString().slice(0, 10)) ??
    new Date();
  const expiryWindows = buildExpiryWindows(payload, asOf);

  const properties = getProperties(payload);
  const ownedPropertyCount = properties.filter((p) => p.occupancyBasis === 'owned').length;
  const leasedPropertyCount = properties.filter((p) => p.occupancyBasis !== 'owned' && p.occupancyBasis !== '').length;

  const contracts = getContracts(payload);
  const contractsWithChangeOfControl = contracts.filter(
    (c) =>
      c.termination.changeOfControlTermination === 'yes' ||
      c.assignmentChangeOfControl.changeOfControlConsentRequired === 'yes' ||
      c.assignmentChangeOfControl.ipoTreatedAsChangeOfControl === 'yes',
  ).length;

  const assets = payload.materialAssetsEncumbranceAndInsuranceLinkage.assets;
  const encumberedAssets = assets.filter((a) => a.encumbered === 'yes').length;

  const financialCovenants = covenantSection.covenants.filter((c) => c.covenantType === 'financial');
  const covenantsRequiringReview = financialCovenants.filter(
    (c) =>
      c.financialDetails.complianceStatus === 'breached' ||
      c.financialDetails.complianceStatus === 'not-sure' ||
      c.financialDetails.professionalConfirmation === 'pending',
  ).length;

  const recordedBreaches = covenantSection.defaultEvents.filter(
    (e) => e.continuingStatus === 'continuing' || e.waiverObtained !== 'yes',
  ).length;
  const waiversPending = covenantSection.defaultEvents.filter((e) => e.waiverObtained !== 'yes').length;

  const propertyIssues = payload.immovablePropertiesAndOccupancyRights.propertyIssues.length;
  const materialitySection = payload.contractMaterialityExpiryAndInspectionReadiness;
  const materialContractReviewItems =
    materialitySection.materialityRecords.length +
    materialitySection.breachDisputeReadiness.filter((b) => b.currentBreach === 'yes').length;

  const debtProposedForIpoRepayment = addDecimals(
    ...payload.reconciliationChangesAndIssuerConfirmations.objectsOfIssueRepayments.map(
      (item) => item.proposedRepayment,
    ),
  );

  const interestVariances = buildInterestVariances(facilities);

  return {
    facilityCount: facilities.length,
    currencyTotals,
    primaryCurrency: (primary?.currency ?? snapshot.reportingCurrency.trim()) || null,
    primaryAmountUnit: (primary?.amountUnit ?? snapshot.displayUnit.trim()) || null,
    positionAsOfDate: snapshot.positionAsOfDate,
    interestVariances,
    interestVarianceCount: interestVariances.filter((entry) => entry.hasVariance).length,
    consentCounts: {
      facilitiesReviewed: consents.length,
      consentRequired,
      consentRequested,
      consentReceived,
      consentPending: Math.max(0, consentRequired - consentReceived),
    },
    chargeCount: charges.length,
    chargesRegistered: charges.filter((c) => c.status === 'registered').length,
    chargesPendingRegistration: charges.filter(
      (c) =>
        c.status === 'pending-registration' ||
        c.status === 'modified-pending-filing' ||
        c.status === 'professional-confirmation-required',
    ).length,
    personalGuaranteeCount: guarantees.filter((g) => g.guaranteeType === 'personal').length,
    corporateGuaranteeCount: guarantees.filter(
      (g) => g.guaranteeType === 'corporate' || g.guaranteeType === 'issuer-given',
    ).length,
    financialCovenantCount: financialCovenants.length,
    covenantsRequiringReview,
    recordedBreaches,
    waiversPending,
    propertyCount: properties.length,
    ownedPropertyCount,
    leasedPropertyCount,
    propertyLeasesExpiringWithin12Months: expiryWindows.propertyLeases,
    contractCount: contracts.length,
    contractsExpiringWithin12Months: expiryWindows.contracts,
    contractsWithChangeOfControlClauses: contractsWithChangeOfControl,
    materialAssetCount: assets.length,
    encumberedMaterialAssetCount: encumberedAssets,
    titleOccupancyReviewItems: propertyIssues,
    materialContractReviewItems,
    debtProposedForIpoRepayment,
    reconciliation: buildReconciliationPreview(payload, linkedReferences, currencyTotals),
  };
}
