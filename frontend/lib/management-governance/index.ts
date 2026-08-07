/**
 * Management & Governance — public frontend barrel (Increment M1, frontend-only).
 *
 * `ManagementGovernancePayload` (`schemaVersion: 1`) is the canonical contract a future backend
 * increment will persist unchanged. Derived progress / compute / assessment helpers are used
 * for live draft UX; there is no backend, API or localStorage persistence in this increment.
 */

export {
  MANAGEMENT_GOVERNANCE_SCHEMA_VERSION,
  MANAGEMENT_GOVERNANCE_SECTION_IDS,
  managementGovernancePayloadSchema,
  sectionIdSchema,
} from '@/lib/schemas/management-governance';

export * from '@/lib/management-governance/types';
export * from '@/lib/management-governance/defaults';
export * from '@/lib/management-governance/options';
export * from '@/lib/management-governance/applicability';
export * from '@/lib/management-governance/directors';
export * from '@/lib/management-governance/committees';
export * from '@/lib/management-governance/references';
export * from '@/lib/management-governance/progress';

export {
  assessManagementGovernance,
  buildGovernanceAssessment,
  buildGovernanceAssessmentFromPayload,
  GOVERNANCE_CRITERION_STATES,
  GOVERNANCE_ASSESSMENT_GROUPS,
} from '@/lib/management-governance/assessment';

export type {
  GovernanceAssessment,
  GovernanceAssessmentResponse,
  GovernanceAssessmentCriterion,
  GovernanceAssessmentGroup,
  GovernanceAssessmentGroupResult,
  GovernanceAssessmentResultState,
  GovernanceCriterionState,
} from '@/lib/management-governance/assessment';

export {
  buildManagementGovernanceOverviewSummary,
  buildOverviewSummary,
} from '@/lib/management-governance/overview';

export type { ManagementGovernanceOverviewSummary } from '@/lib/management-governance/overview';

export {
  computeManagementGovernanceModel,
  computeContinuityMetrics,
  computeCommitteeReadiness,
} from '@/lib/management-governance/compute';

export type {
  ManagementGovernanceModel,
  CommitteeReadinessItem,
  ContinuityMetrics,
} from '@/lib/management-governance/compute';

export {
  ManagementGovernanceProvider,
  useManagementGovernance,
  SECTION_PAYLOAD_KEYS,
} from '@/lib/management-governance/context';

export type { ManagementGovernanceSectionKey } from '@/lib/management-governance/context';

export { useManagementGovernanceUrlState } from '@/lib/management-governance/hooks/use-management-governance-url-state';
