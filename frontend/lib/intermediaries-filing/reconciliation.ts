/**
 * Cross-workstream filing reconciliation preview (IF1, frontend-only).
 */

import {
  addDecimals,
  isFilledDecimal,
  parseDecimal,
  subtractDecimals,
} from '@/lib/intermediaries-filing/decimal';
import { RECONCILIATION_STATUS_LABELS } from '@/lib/intermediaries-filing/options';
import type { LinkedWorkstreamReferences } from '@/lib/intermediaries-filing/types';
import type {
  IntermediariesFilingPayload,
  ReconciliationStatus,
} from '@/lib/schemas/intermediaries-filing';

const RECONCILIATION_TOLERANCE = 1;

export type IfReconciliationMismatch = {
  workstream:
    | 'ipoSetup'
    | 'capitalOwnership'
    | 'objectsOfIssue'
    | 'financialsKpis'
    | 'litigationApprovalsCompliance'
    | 'borrowingsAssetsContracts';
  field: string;
  ifValue: string;
  linkedValue: string;
  status: ReconciliationStatus | 'pending-linked-workstream';
  message: string;
};

export type IfReconciliationWorkstreamPreview = {
  status: string;
  detail: string;
  mismatchCount: number;
  mismatches: IfReconciliationMismatch[];
};

export type IfReconciliationPreview = {
  ipoSetup: IfReconciliationWorkstreamPreview;
  capitalOwnership: IfReconciliationWorkstreamPreview;
  objectsOfIssue: IfReconciliationWorkstreamPreview;
  financialsKpis: IfReconciliationWorkstreamPreview;
  litigationApprovalsCompliance: IfReconciliationWorkstreamPreview;
  borrowingsAssetsContracts: IfReconciliationWorkstreamPreview;
  items: IfReconciliationMismatch[];
  totalMismatchCount: number;
};

function valuesMismatch(a: string, b: string): boolean {
  const parsedA = parseDecimal(a);
  const parsedB = parseDecimal(b);
  if (parsedA !== null && parsedB !== null) {
    return Math.abs(parsedA - parsedB) > RECONCILIATION_TOLERANCE;
  }
  const trimmedA = a.trim();
  const trimmedB = b.trim();
  if (!trimmedA || !trimmedB) return false;
  return trimmedA.toLowerCase() !== trimmedB.toLowerCase();
}

function statusLabel(status: string): string {
  if (!status) return 'Missing information';
  if (status === 'pending-linked-workstream') return 'Pending linked workstream';
  return RECONCILIATION_STATUS_LABELS[status] ?? status.replaceAll('-', ' ');
}

function mismatch(
  workstream: IfReconciliationMismatch['workstream'],
  field: string,
  ifValue: string,
  linkedValue: string,
  message: string,
): IfReconciliationMismatch {
  return {
    workstream,
    field,
    ifValue,
    linkedValue,
    status: 'potential-inconsistency',
    message,
  };
}

function buildIpoSetupMismatches(
  payload: IntermediariesFilingPayload,
  linked: LinkedWorkstreamReferences,
): IfReconciliationMismatch[] {
  if (!linked.ipoSetup.available) return [];
  const snapshot = payload.issueConfigurationAndFilingSnapshot.ipoSetupLinkedSnapshot;
  const items: IfReconciliationMismatch[] = [];

  const pairs: Array<[string, string, string]> = [
    ['targetSmePlatform', snapshot.targetSmePlatform, linked.ipoSetup.targetSmePlatform ?? ''],
    ['issueMethod', snapshot.issueMethod, linked.ipoSetup.issueMethod ?? ''],
    ['freshIssue', snapshot.freshIssue, linked.ipoSetup.freshIssue ?? ''],
    ['ofs', snapshot.ofs, linked.ipoSetup.ofs ?? ''],
    ['totalOffer', snapshot.totalOffer, linked.ipoSetup.totalOffer ?? ''],
    ['faceValue', snapshot.faceValue, linked.ipoSetup.faceValue ?? ''],
    [
      'proposedFinalIssuePrice',
      snapshot.proposedFinalIssuePrice,
      linked.ipoSetup.proposedFinalIssuePrice ?? '',
    ],
  ];

  for (const [field, ifValue, linkedValue] of pairs) {
    if (valuesMismatch(ifValue, linkedValue)) {
      items.push(
        mismatch(
          'ipoSetup',
          field,
          ifValue,
          linkedValue,
          `${field}: filing snapshot ${ifValue || '—'} vs IPO Setup ${linkedValue || '—'}.`,
        ),
      );
    }
  }

  return items;
}

function buildCapitalMismatches(
  payload: IntermediariesFilingPayload,
  linked: LinkedWorkstreamReferences,
): IfReconciliationMismatch[] {
  if (!linked.capitalOwnership.available) return [];
  const snapshot = payload.issueConfigurationAndFilingSnapshot.capitalLinkedSnapshot;
  const reconciliation =
    payload.issueConfigurationAndFilingSnapshot.filingSnapshotReconciliation;
  const items: IfReconciliationMismatch[] = [];

  const pairs: Array<[string, string, string]> = [
    ['freshIssueShares', reconciliation.freshIssueShares, linked.capitalOwnership.freshIssueShares ?? ''],
    ['ofsShares', reconciliation.ofsShares, linked.capitalOwnership.ofsShares ?? ''],
    ['postIssueShares', reconciliation.postIssueShares, linked.capitalOwnership.postIssueShares ?? ''],
    ['preIssueShares', snapshot.preIssueShares, linked.capitalOwnership.preIssueShares ?? ''],
  ];

  for (const [field, ifValue, linkedValue] of pairs) {
    if (valuesMismatch(ifValue, linkedValue)) {
      items.push(
        mismatch(
          'capitalOwnership',
          field,
          ifValue,
          linkedValue,
          `${field}: filing reconciliation ${ifValue || '—'} vs Capital ${linkedValue || '—'}.`,
        ),
      );
    }
  }

  return items;
}

function buildObjectsMismatches(
  payload: IntermediariesFilingPayload,
  linked: LinkedWorkstreamReferences,
): IfReconciliationMismatch[] {
  if (!linked.objectsOfIssue.available) return [];
  const reconciliation =
    payload.issueConfigurationAndFilingSnapshot.filingSnapshotReconciliation;
  const items: IfReconciliationMismatch[] = [];

  const freshIssueAmount = reconciliation.freshIssueAmount;
  const objectsTotal = linked.objectsOfIssue.totalObjectsAmount ?? '';
  if (isFilledDecimal(freshIssueAmount) && isFilledDecimal(objectsTotal)) {
    const difference = subtractDecimals(objectsTotal, freshIssueAmount);
    if (Math.abs(parseDecimal(difference) ?? 0) > RECONCILIATION_TOLERANCE) {
      items.push(
        mismatch(
          'objectsOfIssue',
          'freshIssueAmount',
          freshIssueAmount,
          objectsTotal,
          `Fresh issue amount ${freshIssueAmount || '—'} vs Objects deployment total ${objectsTotal || '—'}.`,
        ),
      );
    }
  }

  return items;
}

function buildFinancialsMismatches(
  payload: IntermediariesFilingPayload,
  linked: LinkedWorkstreamReferences,
): IfReconciliationMismatch[] {
  if (!linked.financialsKpis.available) return [];
  const items: IfReconciliationMismatch[] = [];
  const confirmations =
    payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness
      .finalConfirmations;

  if (confirmations.financialsReconcile === 'no') {
    items.push({
      workstream: 'financialsKpis',
      field: 'financialsReconcile',
      ifValue: confirmations.financialsReconcile,
      linkedValue: linked.financialsKpis.latestFinancialPeriod ?? '',
      status: 'potential-inconsistency',
      message: 'Issuer confirmation indicates Financials may not reconcile for the filing cut-off.',
    });
  }

  if (linked.financialsKpis.restatedFinancialsReady === false) {
    items.push({
      workstream: 'financialsKpis',
      field: 'restatedFinancialsReady',
      ifValue: '',
      linkedValue: 'not ready',
      status: 'missing-information',
      message: 'Linked Financials indicate restated financial readiness is not complete.',
    });
  }

  return items;
}

function buildLacMismatches(
  payload: IntermediariesFilingPayload,
  linked: LinkedWorkstreamReferences,
): IfReconciliationMismatch[] {
  if (!linked.litigationApprovalsCompliance.available) return [];
  const items: IfReconciliationMismatch[] = [];
  const confirmations =
    payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness
      .finalConfirmations;

  if (confirmations.lacUpdatedThroughFilingCutOff === 'no') {
    items.push({
      workstream: 'litigationApprovalsCompliance',
      field: 'lacUpdatedThroughFilingCutOff',
      ifValue: confirmations.lacUpdatedThroughFilingCutOff,
      linkedValue: String(linked.litigationApprovalsCompliance.openMatterCount ?? ''),
      status: 'potential-inconsistency',
      message: 'Issuer confirmation indicates LAC may not be updated through filing cut-off.',
    });
  }

  if ((linked.litigationApprovalsCompliance.openMatterCount ?? 0) > 0) {
    items.push({
      workstream: 'litigationApprovalsCompliance',
      field: 'openMatterCount',
      ifValue: '',
      linkedValue: String(linked.litigationApprovalsCompliance.openMatterCount),
      status: 'pending-professional-confirmation',
      message: `${linked.litigationApprovalsCompliance.openMatterCount} open LAC matter(s) require filing-cut-off review.`,
    });
  }

  return items;
}

function buildBacMismatches(
  payload: IntermediariesFilingPayload,
  linked: LinkedWorkstreamReferences,
): IfReconciliationMismatch[] {
  if (!linked.borrowingsAssetsContracts.available) return [];
  const items: IfReconciliationMismatch[] = [];
  const confirmations =
    payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness
      .finalConfirmations;
  const inspectionItems =
    payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness
      .inspectionItems;

  if (confirmations.bacMattersReconcile === 'no') {
    items.push({
      workstream: 'borrowingsAssetsContracts',
      field: 'bacMattersReconcile',
      ifValue: confirmations.bacMattersReconcile,
      linkedValue: String(linked.borrowingsAssetsContracts.materialContractCount ?? ''),
      status: 'potential-inconsistency',
      message: 'Issuer confirmation indicates BAC matters may not reconcile for filing.',
    });
  }

  const pendingInspection = inspectionItems.filter(
    (item) => item.sourceWorkstream === 'bac' && item.inclusionStatus === 'pending_review',
  ).length;
  const candidates = linked.borrowingsAssetsContracts.inspectionCandidateCount ?? 0;
  if (candidates > 0 && pendingInspection > 0) {
    items.push({
      workstream: 'borrowingsAssetsContracts',
      field: 'inspectionCandidates',
      ifValue: String(pendingInspection),
      linkedValue: String(candidates),
      status: 'missing-information',
      message: `${pendingInspection} BAC-linked inspection item(s) still pending review.`,
    });
  }

  return items;
}

function summarize(
  workstream: IfReconciliationMismatch['workstream'],
  linkedAvailable: boolean,
  mismatches: IfReconciliationMismatch[],
  detailAvailable: string,
  detailUnavailable: string,
): IfReconciliationWorkstreamPreview {
  if (!linkedAvailable) {
    return {
      status: 'Pending linked workstream',
      detail: detailUnavailable,
      mismatchCount: 0,
      mismatches: [],
    };
  }

  const status =
    mismatches.length === 0
      ? 'Reconciled'
      : mismatches.some((item) => item.status === 'potential-inconsistency')
        ? 'Potential inconsistency'
        : mismatches.some((item) => item.status === 'missing-information')
          ? 'Missing information'
          : 'Pending professional confirmation';

  return {
    status,
    detail: detailAvailable,
    mismatchCount: mismatches.length,
    mismatches,
  };
}

export function buildReconciliationPreview(
  payload: IntermediariesFilingPayload,
  linkedRefs: LinkedWorkstreamReferences,
): IfReconciliationPreview {
  const ipoSetupMismatches = buildIpoSetupMismatches(payload, linkedRefs);
  const capitalMismatches = buildCapitalMismatches(payload, linkedRefs);
  const objectsMismatches = buildObjectsMismatches(payload, linkedRefs);
  const financialsMismatches = buildFinancialsMismatches(payload, linkedRefs);
  const lacMismatches = buildLacMismatches(payload, linkedRefs);
  const bacMismatches = buildBacMismatches(payload, linkedRefs);

  const items = [
    ...ipoSetupMismatches,
    ...capitalMismatches,
    ...objectsMismatches,
    ...financialsMismatches,
    ...lacMismatches,
    ...bacMismatches,
  ];

  const reconciliationStatus =
    payload.issueConfigurationAndFilingSnapshot.filingSnapshotReconciliation
      .filingConfirmationStatus;

  return {
    ipoSetup: summarize(
      'ipoSetup',
      linkedRefs.ipoSetup.available,
      ipoSetupMismatches,
      `IPO Setup cross-check; filing confirmation: ${statusLabel(reconciliationStatus)}.`,
      'IPO Setup linked data not yet available.',
    ),
    capitalOwnership: summarize(
      'capitalOwnership',
      linkedRefs.capitalOwnership.available,
      capitalMismatches,
      'Capital & Ownership share-count cross-check against filing reconciliation.',
      'Capital & Ownership linked data not yet available.',
    ),
    objectsOfIssue: summarize(
      'objectsOfIssue',
      linkedRefs.objectsOfIssue.available,
      objectsMismatches,
      'Objects of the Issue deployment amount cross-check.',
      'Objects of the Issue linked data not yet available.',
    ),
    financialsKpis: summarize(
      'financialsKpis',
      linkedRefs.financialsKpis.available,
      financialsMismatches,
      `Financials period ${linkedRefs.financialsKpis.latestFinancialPeriod ?? '—'} readiness cross-check.`,
      'Financials & KPIs linked data not yet available.',
    ),
    litigationApprovalsCompliance: summarize(
      'litigationApprovalsCompliance',
      linkedRefs.litigationApprovalsCompliance.available,
      lacMismatches,
      'LAC filing-cut-off and open matter cross-check.',
      'Litigation, Approvals & Compliance linked data not yet available.',
    ),
    borrowingsAssetsContracts: summarize(
      'borrowingsAssetsContracts',
      linkedRefs.borrowingsAssetsContracts.available,
      bacMismatches,
      'BAC material contracts and inspection candidate cross-check.',
      'Borrowings, Assets & Contracts linked data not yet available.',
    ),
    items,
    totalMismatchCount: items.length,
  };
}

export function computeTotalOfferReconciliationDifference(
  payload: IntermediariesFilingPayload,
): string {
  const reconciliation =
    payload.issueConfigurationAndFilingSnapshot.filingSnapshotReconciliation;
  return subtractDecimals(
    reconciliation.totalOfferAmount,
    addDecimals(reconciliation.freshIssueAmount, reconciliation.ofsAmount),
  );
}
