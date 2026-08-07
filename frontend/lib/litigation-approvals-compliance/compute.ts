/**
 * Derived model for Litigation, Approvals & Compliance (LAC1, frontend-only).
 */

import { getApprovals, isPerpetualApproval } from '@/lib/litigation-approvals-compliance/approvals';
import {
  addDecimals,
  daysBetweenDates,
  isFilledDecimal,
  parseDecimal,
  parseIsoDate,
  subtractDecimals,
} from '@/lib/litigation-approvals-compliance/decimal';
import { getMatters, isCriminalMatter, isTaxMatter } from '@/lib/litigation-approvals-compliance/matters';
import type { LinkedWorkstreamReferences } from '@/lib/litigation-approvals-compliance/types';
import type {
  LitigationApprovalsCompliancePayload,
  MatterCategory,
  MatterRecord,
} from '@/lib/schemas/litigation-approvals-compliance';

const RECONCILIATION_TOLERANCE = 1;

export type MatterCategoryCount = {
  category: MatterCategory | 'unspecified';
  count: number;
};

export type ExposureByCurrency = {
  currency: string;
  amountUnit: string;
  matterCount: number;
  totalExposure: string;
  taxExposure: string;
  criminalCount: number;
  pendingCount: number;
};

export type TaxAggregate = {
  directTaxDemand: string;
  indirectTaxDemand: string;
  totalDemand: string;
  totalBalanceDisputed: string;
  proceedingCount: number;
};

export type ApprovalExpiryWindowEntry = {
  approvalId: string;
  label: string;
  expiryDate: string;
  daysUntilExpiry: number | null;
  window: '30' | '90' | '180' | '365';
};

export type ApprovalExpiryWindows = {
  within30Days: ApprovalExpiryWindowEntry[];
  within90Days: ApprovalExpiryWindowEntry[];
  within180Days: ApprovalExpiryWindowEntry[];
  within365Days: ApprovalExpiryWindowEntry[];
};

export type ComplianceCounts = {
  domainReviewCount: number;
  domainsWithKnownExceptions: number;
  complianceIssueCount: number;
  continuingIssues: number;
  statutoryDueCount: number;
  delayedStatutoryDues: number;
  approvalConditionsOutstanding: number;
};

export type CreditorTotals = {
  materialCreditorCount: number;
  msmeCreditorCount: number;
  materialOutstanding: string;
  msmeOutstanding: string;
  aggregateOutstanding: string;
  reconciliationDifference: string;
  reconciliationStatus: string;
};

export type LacReconciliationPreview = {
  financials: { status: string; detail: string };
  groupEntities: { status: string; detail: string };
  managementGovernance: { status: string; detail: string };
  bac: { status: string; detail: string };
  businessOperations: { status: string; detail: string };
  objectsOfIssue: { status: string; detail: string };
  ipoSetup: { status: string; detail: string };
};

export type LitigationApprovalsComplianceModel = {
  matterCount: number;
  mattersByCategory: MatterCategoryCount[];
  criminalMatterCount: number;
  taxMatterCount: number;
  pendingOutcomeCount: number;
  exposureByCurrency: ExposureByCurrency[];
  taxAggregates: TaxAggregate;
  approvalCount: number;
  expiredApprovalCount: number;
  renewalPendingCount: number;
  approvalExpiryWindows: ApprovalExpiryWindows;
  complianceCounts: ComplianceCounts;
  creditorTotals: CreditorTotals;
  remediationOpenCount: number;
  legalDdAsOfDate: string;
  reconciliation: LacReconciliationPreview;
};

function currencyKey(matter: MatterRecord): string {
  const currency = matter.amounts.currency.trim() || 'UNSPECIFIED';
  const unit = matter.amounts.amountUnit.trim() || 'unspecified';
  return `${currency}::${unit}`;
}

function matterExposure(matter: MatterRecord): string {
  if (isFilledDecimal(matter.amounts.totalQuantifiedAmount)) {
    return matter.amounts.totalQuantifiedAmount;
  }
  return addDecimals(
    matter.amounts.principalClaim,
    matter.amounts.taxDemand,
    matter.amounts.interest,
    matter.amounts.penalty,
    matter.amounts.fine,
    matter.amounts.damages,
    matter.amounts.compensation,
    matter.amounts.otherExposure,
  );
}

function buildExposureByCurrency(matters: MatterRecord[]): ExposureByCurrency[] {
  const groups = new Map<string, MatterRecord[]>();
  for (const matter of matters) {
    const key = currencyKey(matter);
    const list = groups.get(key) ?? [];
    list.push(matter);
    groups.set(key, list);
  }

  return [...groups.entries()].map(([key, group]) => {
    const [currency, amountUnit] = key.split('::');
    const taxMatters = group.filter(isTaxMatter);
    return {
      currency,
      amountUnit,
      matterCount: group.length,
      totalExposure: addDecimals(...group.map(matterExposure)),
      taxExposure: addDecimals(...taxMatters.map((m) => m.amounts.taxDemand || matterExposure(m))),
      criminalCount: group.filter(isCriminalMatter).length,
      pendingCount: group.filter(
        (m) =>
          m.statusOutcome.outcomeStatus === 'pending' ||
          m.statusOutcome.outcomeStatus === 'appeal-pending' ||
          m.statusOutcome.outcomeStatus === '',
      ).length,
    };
  });
}

function buildMattersByCategory(matters: MatterRecord[]): MatterCategoryCount[] {
  const counts = new Map<MatterCategory | 'unspecified', number>();
  for (const matter of matters) {
    const category = matter.identity.category || 'unspecified';
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

function buildTaxAggregates(payload: LitigationApprovalsCompliancePayload): TaxAggregate {
  const taxDetails = payload.criminalRegulatoryTaxAndEnforcementReadiness.taxProceedingDetails;
  const directTypes = new Set(['direct-tax']);
  const indirectTypes = new Set(['gst', 'customs', 'excise', 'vat-sales-tax', 'service-tax']);

  let directTaxDemand = '';
  let indirectTaxDemand = '';

  for (const detail of taxDetails) {
    const demand = addDecimals(detail.demand, detail.interest, detail.penalty);
    if (directTypes.has(detail.taxType)) {
      directTaxDemand = addDecimals(directTaxDemand, demand);
    } else if (indirectTypes.has(detail.taxType)) {
      indirectTaxDemand = addDecimals(indirectTaxDemand, demand);
    } else if (detail.taxType) {
      directTaxDemand = addDecimals(directTaxDemand, demand);
    }
  }

  for (const matter of getMatters(payload)) {
    if (!isTaxMatter(matter)) continue;
    const demand = matter.amounts.taxDemand || matterExposure(matter);
    if (matter.identity.category === 'tax') {
      directTaxDemand = addDecimals(directTaxDemand, demand);
    }
  }

  return {
    directTaxDemand,
    indirectTaxDemand,
    totalDemand: addDecimals(directTaxDemand, indirectTaxDemand),
    totalBalanceDisputed: addDecimals(
      ...taxDetails.map((detail) => detail.balanceDisputed),
    ),
    proceedingCount: taxDetails.length,
  };
}

function buildApprovalExpiryWindows(
  payload: LitigationApprovalsCompliancePayload,
  asOf: Date,
): ApprovalExpiryWindows {
  const windows: ApprovalExpiryWindows = {
    within30Days: [],
    within90Days: [],
    within180Days: [],
    within365Days: [],
  };

  const horizon365 = new Date(asOf);
  horizon365.setDate(horizon365.getDate() + 365);

  for (const approval of getApprovals(payload)) {
    if (isPerpetualApproval(approval)) continue;
    const expiry =
      parseIsoDate(approval.details.expiryDate) ??
      parseIsoDate(approval.renewalMetadata.renewalDueDate);
    if (!expiry || expiry > horizon365) continue;

    const daysUntil = Math.ceil((expiry.getTime() - asOf.getTime()) / (1000 * 60 * 60 * 24));
    const label =
      approval.identity.approvalLicenceName.trim() ||
      approval.holder.displayName.trim() ||
      approval.approvalId.slice(0, 8);
    const expiryDate =
      approval.details.expiryDate.trim() || approval.renewalMetadata.renewalDueDate.trim();

    const entryBase = {
      approvalId: approval.approvalId,
      label,
      expiryDate,
      daysUntilExpiry: daysUntil,
    };

    if (daysUntil <= 30) {
      windows.within30Days.push({ ...entryBase, window: '30' });
    }
    if (daysUntil <= 90) {
      windows.within90Days.push({ ...entryBase, window: '90' });
    }
    if (daysUntil <= 180) {
      windows.within180Days.push({ ...entryBase, window: '180' });
    }
    if (daysUntil <= 365) {
      windows.within365Days.push({ ...entryBase, window: '365' });
    }
  }

  return windows;
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
    case 'missing-information':
      return 'Missing information';
    default:
      return status ? status.replaceAll('-', ' ') : 'Not captured';
  }
}

function buildReconciliationPreview(
  payload: LitigationApprovalsCompliancePayload,
  linkedReferences: LinkedWorkstreamReferences,
): LacReconciliationPreview {
  const reconciliation = payload.reconciliationRemediationAndIssuerConfirmations;
  const financialsRec = reconciliation.financialsReconciliation;
  const taxAggregates = buildTaxAggregates(payload);
  const matters = getMatters(payload);
  const litigationAggregate =
    financialsRec.litigationAggregateAmount ||
    addDecimals(...matters.map(matterExposure));

  let litigationDifference = financialsRec.litigationDifference;
  if (
    !isFilledDecimal(litigationDifference) &&
    linkedReferences.financialsKpis.available &&
    linkedReferences.financialsKpis.contingentLiabilitiesTotal
  ) {
    litigationDifference = subtractDecimals(
      litigationAggregate,
      linkedReferences.financialsKpis.contingentLiabilitiesTotal,
    );
  }

  let financialsStatus = financialsRec.reconciliationStatus;
  if (!financialsStatus && linkedReferences.financialsKpis.available) {
    const diff = Math.abs(parseDecimal(litigationDifference) ?? 0);
    financialsStatus =
      diff <= RECONCILIATION_TOLERANCE ? 'reconciled' : 'potential-inconsistency';
  }

  return {
    financials: {
      status: reconciliationStatusLabel(
        financialsStatus,
        linkedReferences.financialsKpis.available,
      ),
      detail: linkedReferences.financialsKpis.available
        ? `Litigation aggregate ${litigationAggregate || '—'} vs Financials contingent liabilities ${linkedReferences.financialsKpis.contingentLiabilitiesTotal ?? '—'}. Tax aggregate ${taxAggregates.totalDemand || '—'}.`
        : 'Financials & KPIs linked data not yet available.',
    },
    groupEntities: {
      status: reconciliationStatusLabel(
        reconciliation.groupEntitiesReconciliation.reconciliationStatus,
        linkedReferences.groupEntities.available,
      ),
      detail: linkedReferences.groupEntities.available
        ? 'Group Entities legal declarations and subsidiary litigation cross-check.'
        : 'Group Entities linked data not yet available.',
    },
    managementGovernance: {
      status: reconciliationStatusLabel(
        reconciliation.managementGovernanceReconciliation.reconciliationStatus,
        linkedReferences.managementGovernance.available,
      ),
      detail: linkedReferences.managementGovernance.available
        ? 'Management & Governance director/KMP legal declarations cross-check.'
        : 'Management & Governance linked data not yet available.',
    },
    bac: {
      status: reconciliationStatusLabel(
        reconciliation.bacReconciliation.reconciliationStatus,
        linkedReferences.borrowingsAssetsContracts.available,
      ),
      detail: linkedReferences.borrowingsAssetsContracts.available
        ? 'Borrowings, Assets & Contracts defaults, disputes and lender matters cross-check.'
        : 'Borrowings, Assets & Contracts linked data not yet available.',
    },
    businessOperations: {
      status: reconciliationStatusLabel(
        reconciliation.businessOperationsReconciliation.reconciliationStatus,
        linkedReferences.businessOperations.available,
      ),
      detail: linkedReferences.businessOperations.available
        ? 'Business & Operations facilities, licences and operational incidents cross-check.'
        : 'Business & Operations linked data not yet available.',
    },
    objectsOfIssue: {
      status: reconciliationStatusLabel(
        reconciliation.objectsOfIssueReconciliation.reconciliationStatus,
        linkedReferences.objectsOfIssue.available,
      ),
      detail: linkedReferences.objectsOfIssue.available
        ? 'Objects of the Issue capex/expansion approval plan cross-check.'
        : 'Objects of the Issue linked data not yet available.',
    },
    ipoSetup: {
      status: reconciliationStatusLabel(
        reconciliation.ipoSetupReconciliation.reconciliationStatus,
        linkedReferences.ipoSetup.available,
      ),
      detail: linkedReferences.ipoSetup.available
        ? 'IPO Setup & Eligibility debarment and serious proceedings declarations cross-check.'
        : 'IPO Setup & Eligibility linked data not yet available.',
    },
  };
}

function buildCreditorTotals(payload: LitigationApprovalsCompliancePayload): CreditorTotals {
  const section = payload.materialCreditorsPenaltiesAndMaterialDevelopments;
  const aggregates = section.creditorAggregateInputs;
  const creditors = section.materialCreditors;

  const materialOutstanding =
    aggregates.materialCreditorAmount ||
    addDecimals(
      ...creditors
        .filter((c) => c.msmeStatus !== 'yes')
        .map((c) => c.amountOutstanding),
    );
  const msmeOutstanding =
    aggregates.msmeOutstandingAmount ||
    addDecimals(
      ...creditors.filter((c) => c.msmeStatus === 'yes').map((c) => c.amountOutstanding),
    );

  return {
    materialCreditorCount: creditors.filter((c) => c.msmeStatus !== 'yes').length,
    msmeCreditorCount: creditors.filter((c) => c.msmeStatus === 'yes').length,
    materialOutstanding,
    msmeOutstanding,
    aggregateOutstanding: addDecimals(materialOutstanding, msmeOutstanding),
    reconciliationDifference: aggregates.reconciliationDifference,
    reconciliationStatus: aggregates.reconciliationStatus,
  };
}

export function computeLitigationApprovalsComplianceModel(
  payload: LitigationApprovalsCompliancePayload,
  linkedReferences: LinkedWorkstreamReferences,
): LitigationApprovalsComplianceModel {
  const matters = getMatters(payload);
  const approvals = getApprovals(payload);
  const section6 = payload.corporateStatutoryAndOperationalComplianceExceptions;
  const section5 = payload.approvalConditionsFacilityComplianceAndRenewalReadiness;
  const asOf = new Date();

  const delayedStatutoryDues = section6.statutoryDues.filter((due) => {
    const delay =
      parseDecimal(due.delayDays) ??
      (due.dueDate && due.paymentDate ? daysBetweenDates(due.dueDate, due.paymentDate) : null);
    return delay !== null && delay > 0;
  }).length;

  const approvalConditionsOutstanding = section5.approvalConditions.filter(
    (condition) =>
      condition.complianceStatus === 'pending' ||
      condition.complianceStatus === 'delayed' ||
      condition.complianceStatus === 'not-sure',
  ).length;

  const snapshot =
    payload.legalUniverseMaterialityPolicyAndPartyMapping.legalDdSnapshot;

  return {
    matterCount: matters.length,
    mattersByCategory: buildMattersByCategory(matters),
    criminalMatterCount: matters.filter(isCriminalMatter).length,
    taxMatterCount: matters.filter(isTaxMatter).length,
    pendingOutcomeCount: matters.filter(
      (m) =>
        m.statusOutcome.outcomeStatus === 'pending' ||
        m.statusOutcome.outcomeStatus === 'appeal-pending' ||
        m.statusOutcome.outcomeStatus === '',
    ).length,
    exposureByCurrency: buildExposureByCurrency(matters),
    taxAggregates: buildTaxAggregates(payload),
    approvalCount: approvals.length,
    expiredApprovalCount: approvals.filter(
      (a) =>
        a.status === 'expired-renewal-applied' || a.status === 'expired-renewal-not-applied',
    ).length,
    renewalPendingCount: approvals.filter(
      (a) => a.status === 'renewal-pending' || a.status === 'application-pending',
    ).length,
    approvalExpiryWindows: buildApprovalExpiryWindows(payload, asOf),
    complianceCounts: {
      domainReviewCount: section6.complianceDomainReviews.length,
      domainsWithKnownExceptions: section6.complianceDomainReviews.filter(
        (review) => review.knownExceptions === 'yes',
      ).length,
      complianceIssueCount: section6.complianceIssues.length,
      continuingIssues: section6.complianceIssues.filter((issue) => issue.continuing === 'yes')
        .length,
      statutoryDueCount: section6.statutoryDues.length,
      delayedStatutoryDues,
      approvalConditionsOutstanding,
    },
    creditorTotals: buildCreditorTotals(payload),
    remediationOpenCount:
      payload.reconciliationRemediationAndIssuerConfirmations.remediationActions.filter(
        (action) =>
          action.status === 'open' ||
          action.status === 'in-progress' ||
          action.status === 'blocked',
      ).length,
    legalDdAsOfDate: snapshot.legalDdAsOfDate,
    reconciliation: buildReconciliationPreview(payload, linkedReferences),
  };
}
