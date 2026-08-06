/**
 * Business & Operations — public frontend barrel.
 *
 * `BusinessOperationsPayload` (`schemaVersion: 1`) is the canonical contract persisted by B2.
 * Derived progress / compute / assessment helpers remain available for live draft UX; the
 * server is authoritative after each successful section save.
 */

export {
  BUSINESS_OPERATIONS_SCHEMA_VERSION,
  BUSINESS_OPERATIONS_SECTION_IDS,
  businessOperationsPayloadSchema,
  sectionIdSchema,
} from '@/lib/schemas/business-operations';

export * from '@/lib/business-operations/types';
export * from '@/lib/business-operations/defaults';
export * from '@/lib/business-operations/options';
export * from '@/lib/business-operations/format';
export * from '@/lib/business-operations/progress';
export * from '@/lib/business-operations/assessment';

export {
  computeBusinessOperationsModel,
} from '@/lib/business-operations/compute';

export type {
  BusinessOperationsCounts,
  BusinessOperationsModel,
  CapacityUtilisationRow,
  ConcentrationPeriodSummary,
  GeographicMixRow,
  LargestSegmentSummary,
  ReconciliationCheck,
  ReconciliationStatus,
  RevenueMixYearSummary,
  WorkforceLatestTotals,
} from '@/lib/business-operations/compute';

export * as decimal from '@/lib/business-operations/decimal';
