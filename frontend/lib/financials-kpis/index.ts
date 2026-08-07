/**
 * Financials & KPIs — public frontend barrel (Increment F1, frontend-only).
 *
 * `FinancialsKpisPayload` (`schemaVersion: 1`) is the canonical contract a future backend
 * increment will persist unchanged. Derived progress / compute / assessment helpers are used
 * for live draft UX; there is no backend, API or localStorage persistence in this increment.
 */

export {
  FINANCIALS_KPIS_SCHEMA_VERSION,
  FINANCIALS_KPIS_SECTION_IDS,
  financialsKpisPayloadSchema,
  sectionIdSchema,
} from '@/lib/schemas/financials-kpis';

export * from '@/lib/financials-kpis/types';
export * from '@/lib/financials-kpis/defaults';
export * from '@/lib/financials-kpis/options';
export * from '@/lib/financials-kpis/format';
export * from '@/lib/financials-kpis/pl-lines';
export * from '@/lib/financials-kpis/bs-lines';
export * from '@/lib/financials-kpis/periods';
export * from '@/lib/financials-kpis/progress';

export {
  assessFinancialsKpis,
  buildFinancialAssessment,
  buildFinancialAssessmentFromPayload,
  FINANCIAL_CRITERION_STATES,
  FINANCIAL_ASSESSMENT_GROUPS,
} from '@/lib/financials-kpis/assessment';

export type {
  FinancialAssessment,
  FinancialAssessmentResponse,
  FinancialAssessmentCriterion,
  FinancialAssessmentGroup,
  FinancialAssessmentGroupResult,
  FinancialAssessmentResultState,
  FinancialCriterionState,
} from '@/lib/financials-kpis/assessment';

export {
  buildFinancialsKpisOverviewSummary,
  buildOverviewSummary,
} from '@/lib/financials-kpis/overview';

export type {
  FinancialsKpisOverviewSummary,
  ReconciliationConcern,
} from '@/lib/financials-kpis/overview';

export {
  computeFinancialsKpisModel,
  SME_ELIGIBILITY_STATES,
} from '@/lib/financials-kpis/compute';

export type {
  FinancialsKpisModel,
  PlPeriodSummary,
  BsPeriodSummary,
  CfPeriodSummary,
  EquityPeriodSummary,
  RatioSummary,
  SmeEligibilityAssessment,
  SmeEligibilityState,
  ReconciliationCheck,
  ReconciliationStatus,
  RestatementAdjustmentCheck,
} from '@/lib/financials-kpis/compute';

export {
  FinancialsKpisProvider,
  useFinancialsKpis,
  SECTION_PAYLOAD_KEYS,
  formatReferencedCompanyClass,
} from '@/lib/financials-kpis/context';

export type { FinancialsKpisSectionKey } from '@/lib/financials-kpis/context';

export { useFinancialsKpisUrlState } from '@/lib/financials-kpis/hooks/use-financials-kpis-url-state';

export * as decimal from '@/lib/financials-kpis/decimal';
