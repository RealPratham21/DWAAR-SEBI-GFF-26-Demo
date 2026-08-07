/**
 * Litigation, Approvals & Compliance public exports (LAC2 API-backed).
 *
 * The payload schema and section IDs are the canonical contract for persistence and DRHP adapters.
 */

export {
  LITIGATION_APPROVALS_COMPLIANCE_SCHEMA_VERSION,
  LAC_SECTION_IDS,
  litigationApprovalsCompliancePayloadSchema,
  type LitigationApprovalsCompliancePayload,
  type LitigationApprovalsComplianceSectionId,
  type MatterRecord,
  type ApprovalRecord,
} from '@/lib/schemas/litigation-approvals-compliance';

export * from '@/lib/litigation-approvals-compliance/types';
export * from '@/lib/litigation-approvals-compliance/defaults';
export * from '@/lib/litigation-approvals-compliance/options';
export * from '@/lib/litigation-approvals-compliance/decimal';
export * from '@/lib/litigation-approvals-compliance/matters';
export * from '@/lib/litigation-approvals-compliance/approvals';
export * from '@/lib/litigation-approvals-compliance/references';
export * from '@/lib/litigation-approvals-compliance/progress';
export {
  assessLitigationApprovalsCompliance,
  LAC_CRITERION_STATES,
  LAC_CRITERION_STATE_LABELS,
  LAC_ASSESSMENT_GROUP_LABELS,
  LAC_ASSESSMENT_GROUPS,
  LAC_ASSESSMENT_RESULT_STATES,
  type LacAssessmentResponse,
  type LacCriterionState,
  type LacAssessmentGroup,
  type LacAssessmentResultState,
} from '@/lib/litigation-approvals-compliance/assessment';
export {
  buildOverviewSummary,
  type LitigationApprovalsComplianceOverviewSummary,
} from '@/lib/litigation-approvals-compliance/overview';
export {
  computeLitigationApprovalsComplianceModel,
  type LitigationApprovalsComplianceModel,
  type MatterCategoryCount,
  type ExposureByCurrency,
  type TaxAggregate,
  type ApprovalExpiryWindows,
  type ComplianceCounts,
  type CreditorTotals,
  type LacReconciliationPreview,
} from '@/lib/litigation-approvals-compliance/compute';
export {
  LitigationApprovalsComplianceProvider,
  useLitigationApprovalsCompliance,
  SECTION_PAYLOAD_KEYS,
} from '@/lib/litigation-approvals-compliance/context';
export { useLitigationApprovalsComplianceUrlState } from '@/lib/litigation-approvals-compliance/hooks/use-litigation-approvals-compliance-url-state';
