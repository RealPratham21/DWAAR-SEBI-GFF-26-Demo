/**
 * Intermediaries & Filing public exports (IF2 API-backed).
 *
 * The payload schema and section IDs are the canonical contract for persistence and filing adapters.
 */

export {
  INTERMEDIARIES_FILING_SCHEMA_VERSION,
  IF_SECTION_IDS,
  intermediariesFilingPayloadSchema,
  type IntermediariesFilingPayload,
  type IntermediariesFilingSectionId,
  type IntermediaryRecord,
  type FilingRecord,
  type OfferDocumentVersionRecord,
} from '@/lib/schemas/intermediaries-filing';

export * from '@/lib/intermediaries-filing/types';
export * from '@/lib/intermediaries-filing/defaults';
export * from '@/lib/intermediaries-filing/options';
export * from '@/lib/intermediaries-filing/decimal';
export * from '@/lib/intermediaries-filing/rules';
export * from '@/lib/intermediaries-filing/working-days';
export * from '@/lib/intermediaries-filing/intermediaries';
export * from '@/lib/intermediaries-filing/filings';
export * from '@/lib/intermediaries-filing/references';
export * from '@/lib/intermediaries-filing/reconciliation';
export * from '@/lib/intermediaries-filing/progress';
export {
  assessIntermediariesFiling,
  IF_CRITERION_STATES,
  IF_CRITERION_STATE_LABELS,
  IF_ASSESSMENT_GROUP_LABELS,
  IF_ASSESSMENT_GROUPS,
  IF_ASSESSMENT_RESULT_STATES,
  type IfAssessmentResponse,
  type IfCriterionState,
  type IfAssessmentGroup,
  type IfAssessmentResultState,
} from '@/lib/intermediaries-filing/assessment';
export {
  buildOverviewSummary,
  type IntermediariesFilingOverviewSummary,
} from '@/lib/intermediaries-filing/overview';
export {
  computeIntermediariesFilingModel,
  computeUnderwritingTotals,
  type IntermediariesFilingModel,
  type IntermediaryAggregates,
  type FilingAggregates,
  type CertificateConsentAggregates,
  type DueDiligenceAggregates,
  type InfrastructureAggregates,
  type UnderwritingAggregates,
  type MarketMakingAggregates,
  type ProgrammeAggregates,
  type FinalDocumentAggregates,
} from '@/lib/intermediaries-filing/compute';
export {
  IntermediariesFilingProvider,
  useIntermediariesFiling,
  SECTION_PAYLOAD_KEYS,
} from '@/lib/intermediaries-filing/context';
export { useIntermediariesFilingUrlState } from '@/lib/intermediaries-filing/hooks/use-intermediaries-filing-url-state';
