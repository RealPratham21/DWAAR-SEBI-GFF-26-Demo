/**
 * Overview summary derived from the in-memory Management & Governance draft (M1).
 */

import { buildGovernanceAssessment, type GovernanceAssessmentResponse } from '@/lib/management-governance/assessment';
import {
  computeManagementGovernanceModel,
  type ManagementGovernanceModel,
} from '@/lib/management-governance/compute';
import { calculateManagementGovernanceProgress } from '@/lib/management-governance/progress';
import {
  createEmptyLinkedWorkstreamReferences,
  type LinkedWorkstreamReferences,
  type ManagementGovernanceProgress,
} from '@/lib/management-governance/types';
import type {
  ManagementGovernancePayload,
  ManagementGovernanceSectionId,
} from '@/lib/schemas/management-governance';
import { MANAGEMENT_GOVERNANCE_SECTION_LABELS } from '@/lib/management-governance/options';

export type ManagementGovernanceOverviewSummary = {
  sectionStatuses: ManagementGovernanceProgress['sections'];
  sectionsComplete: number;
  sectionsInProgress: number;
  totalSections: number;
  overallStatus: ManagementGovernanceProgress['overallStatus'];
  boardSize: number;
  proposedBoardSize: number;
  executiveDirectors: number;
  nonExecutiveDirectors: number;
  independentDirectors: number;
  womenDirectors: number;
  residentDirectors: number;
  chairmanName: string;
  managingDirectorName: string;
  kmpCount: number;
  seniorManagementCount: number;
  criticalVacancies: number;
  committeesReady: number;
  committeesRequired: number;
  policiesAdopted: number;
  policiesRequired: number;
  boardChangesLastThreeYears: number;
  kmpChangesLastThreeYears: number;
  pendingAppointments: number;
  potentialConcerns: number;
  professionalReviewItems: number;
  listingSegment: string;
  assessmentResult: GovernanceAssessmentResponse['result'];
  assessmentResultLabel: string;
  assessmentSummary: string;
  recommendedNextActions: Array<{ sectionId: ManagementGovernanceSectionId; label: string }>;
};

export function buildOverviewSummary(
  payload: ManagementGovernancePayload,
  linkedReferences: LinkedWorkstreamReferences = createEmptyLinkedWorkstreamReferences(),
): ManagementGovernanceOverviewSummary {
  const progress = calculateManagementGovernanceProgress(payload);
  const model = computeManagementGovernanceModel(payload, linkedReferences);
  const assessment = buildGovernanceAssessment(payload, model, progress, linkedReferences);

  const sectionsInProgress = Object.values(progress.sections).filter(
    (status) => status === 'in_progress',
  ).length;

  const incompleteSections = (
    Object.entries(progress.sections) as Array<
      [ManagementGovernanceSectionId, ManagementGovernanceProgress['sections'][ManagementGovernanceSectionId]]
    >
  ).filter(([, status]) => status !== 'complete');

  const recommendedNextActions = incompleteSections.slice(0, 4).map(([sectionId]) => ({
    sectionId,
    label: `Continue with ${MANAGEMENT_GOVERNANCE_SECTION_LABELS[sectionId]}`,
  }));

  return {
    sectionStatuses: progress.sections,
    sectionsComplete: progress.sectionsComplete,
    sectionsInProgress,
    totalSections: progress.totalSections,
    overallStatus: progress.overallStatus,
    boardSize: model.boardSize,
    proposedBoardSize: model.proposedBoardSize,
    executiveDirectors: model.boardCounts.executive,
    nonExecutiveDirectors: model.boardCounts.nonExecutive,
    independentDirectors: model.boardCounts.independent,
    womenDirectors: model.boardCounts.women,
    residentDirectors: model.boardCounts.resident,
    chairmanName: model.chairmanName,
    managingDirectorName: model.managingDirectorName,
    kmpCount: model.kmpCount,
    seniorManagementCount: model.smpCount,
    criticalVacancies: model.continuity.criticalRoleVacancies,
    committeesReady: model.committeesReadyCount,
    committeesRequired: model.committeesRequiredCount,
    policiesAdopted: model.policiesAdoptedCount,
    policiesRequired: model.policiesRequiredCount,
    boardChangesLastThreeYears:
      model.continuity.boardAdditionsLastThreeYears + model.continuity.boardCessationsLastThreeYears,
    kmpChangesLastThreeYears:
      model.continuity.kmpSmpAdditionsLastThreeYears + model.continuity.kmpSmpCessationsLastThreeYears,
    pendingAppointments: model.pendingAppointments,
    potentialConcerns: assessment.counts.potentialConcern,
    professionalReviewItems: assessment.counts.pendingProfessionalConfirmation,
    listingSegment: model.applicability.listingSegment,
    assessmentResult: assessment.result,
    assessmentResultLabel: assessment.resultLabel,
    assessmentSummary: assessment.summary,
    recommendedNextActions,
  };
}

/** Alias used by barrels and external imports. */
export const buildManagementGovernanceOverviewSummary = buildOverviewSummary;
