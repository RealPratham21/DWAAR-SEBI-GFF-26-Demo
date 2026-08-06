/**
 * Capital & Ownership — public frontend barrel (Increment C1).
 *
 * Frontend-only: no backend calls and no local persistence. `CapitalOwnershipPayload`
 * (`schemaVersion: 1`) is the contract a later increment will persist unchanged.
 */

export {
  CAPITAL_OWNERSHIP_SCHEMA_VERSION,
  CAPITAL_OWNERSHIP_SECTION_IDS,
  capitalOwnershipPayloadSchema,
} from '@/lib/schemas/capital-ownership';

export * from '@/lib/capital-ownership/types';
export * from '@/lib/capital-ownership/defaults';
export * from '@/lib/capital-ownership/options';
export * from '@/lib/capital-ownership/format';
export * from '@/lib/capital-ownership/progress';
export * from '@/lib/capital-ownership/assessment';

export {
  DEFAULT_MINIMUM_CONTRIBUTION_PERCENTAGE,
  capitalEventDirection,
  computeCapTable,
  computeCapitalHistoryCumulative,
  computeCapitalOwnershipModel,
  computeCurrentCapitalTotals,
  computeDilution,
  computeLockInReadiness,
  computeOutstandingInstruments,
  computePrePostIssue,
  ipoSetupReferenceFromPayload,
  offerTypeFlags,
  reconcileCapitalOwnership,
  sortCapitalEvents,
} from '@/lib/capital-ownership/compute';

export type {
  CapTable,
  CapTableGroupTotals,
  CapTableRow,
  CapitalEventDirection,
  CapitalHistoryComputation,
  CapitalHistoryRow,
  CapitalOwnershipModel,
  CapitalTotals,
  DilutionView,
  LockInReadiness,
  OutstandingInstrumentsSummary,
  PrePostIssueIssue,
  PrePostIssueOptions,
  PrePostIssueRow,
  PrePostIssueView,
  ReconciliationCheck,
  ReconciliationGroup,
  ReconciliationStatus,
} from '@/lib/capital-ownership/compute';

export * as decimal from '@/lib/capital-ownership/decimal';
