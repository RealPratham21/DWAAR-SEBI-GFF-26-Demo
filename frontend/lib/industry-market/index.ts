/**
 * Industry & Market — public frontend barrel (Increment IM1, frontend-only).
 *
 * `IndustryMarketPayload` (`schemaVersion: 1`) is the canonical contract a future backend
 * increment will persist unchanged. Derived progress / compute / assessment helpers are used
 * for live draft UX; there is no backend, API or localStorage persistence in this increment.
 */

export {
  INDUSTRY_MARKET_SCHEMA_VERSION,
  INDUSTRY_MARKET_SECTION_IDS,
  industryMarketPayloadSchema,
  sectionIdSchema,
} from '@/lib/schemas/industry-market';

export * from '@/lib/industry-market/types';
export * from '@/lib/industry-market/defaults';
export * from '@/lib/industry-market/options';
export * from '@/lib/industry-market/sources';
export * from '@/lib/industry-market/references';
export * from '@/lib/industry-market/market-series';
export * from '@/lib/industry-market/market-share';
export * from '@/lib/industry-market/claims';
export * from '@/lib/industry-market/progress';

export {
  assessIndustryMarket,
  buildIndustryAssessmentFromPayload,
  INDUSTRY_CRITERION_STATES,
  INDUSTRY_ASSESSMENT_GROUPS,
} from '@/lib/industry-market/assessment';

export type {
  IndustryAssessment,
  IndustryAssessmentResponse,
  IndustryAssessmentCriterion,
  IndustryAssessmentGroupResult,
  IndustryAssessmentResultState,
  IndustryCriterionState,
} from '@/lib/industry-market/assessment';

export {
  buildIndustryMarketOverviewSummary,
  buildOverviewSummary,
} from '@/lib/industry-market/overview';

export type { IndustryMarketOverviewSummary } from '@/lib/industry-market/overview';

export {
  computeIndustryMarketModel,
  calculateYoYGrowth,
  calculateMarketShare,
} from '@/lib/industry-market/compute';

export type { IndustryMarketModel } from '@/lib/industry-market/compute';

export { SESSION_SAVE_NOTICE_IM2 } from '@/lib/industry-market/options';

export {
  IndustryMarketProvider,
  useIndustryMarket,
  SECTION_PAYLOAD_KEYS,
} from '@/lib/industry-market/context';
