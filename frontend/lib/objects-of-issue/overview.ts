/**
 * Overview-tab summary for Objects of the Issue (Increment O1).
 *
 * Combines live progress, computed model figures and the Objects Assessment into one shape the
 * Overview tab renders directly. Nothing here is persisted.
 */

import { assessObjectsOfIssue } from '@/lib/objects-of-issue/assessment';
import { computeObjectsOfIssueModel } from '@/lib/objects-of-issue/compute';
import { OBJECTS_OF_ISSUE_SECTION_LABELS } from '@/lib/objects-of-issue/options';
import { calculateObjectsOfIssueProgress } from '@/lib/objects-of-issue/progress';
import type {
  CompanyLegalReference,
  IpoSetupReference,
  LinkedWorkstreamReferences,
  ObjectsOfIssueSectionId,
  SectionStatus,
} from '@/lib/objects-of-issue/types';
import type { ObjectsOfIssuePayload } from '@/lib/schemas/objects-of-issue';
import { OBJECTS_OF_ISSUE_SECTION_IDS } from '@/lib/schemas/objects-of-issue';

export type ObjectsOfIssueOverviewSummary = {
  isPureOfs: boolean;
  sectionStatuses: Record<ObjectsOfIssueSectionId, SectionStatus>;
  sectionsComplete: number;
  sectionsInProgress: number;
  totalSections: number;
  objectsCount: number;
  netFreshIssueProceeds: string;
  totalEstimatedObjectsCost: string;
  totalAllocatedFromNetProceeds: string;
  gcpPercentageOfFreshIssue: string;
  hasCapexRelevantObjects: boolean;
  hasAcquisitionRelevantObjects: boolean;
  companyReference: CompanyLegalReference;
  assessmentResultLabel: string;
  assessmentSummary: string;
  reconciledChecksCount: number;
  varianceChecksCount: number;
  missingInformationChecksCount: number;
  recommendedNextActions: Array<{ sectionId: ObjectsOfIssueSectionId; label: string }>;
};

export function buildObjectsOfIssueOverviewSummary(
  payload: ObjectsOfIssuePayload,
  ipoReference: IpoSetupReference,
  linkedReferences: LinkedWorkstreamReferences,
): ObjectsOfIssueOverviewSummary {
  const progress = calculateObjectsOfIssueProgress(payload);
  const model = computeObjectsOfIssueModel(payload, ipoReference);
  const assessment = assessObjectsOfIssue(payload, ipoReference, linkedReferences);

  const sectionsInProgress = OBJECTS_OF_ISSUE_SECTION_IDS.filter(
    (id) => progress.sections[id] === 'in_progress',
  ).length;

  const reconciledChecksCount = assessment.criteria.filter(
    (criterion) => criterion.state === 'reconciled',
  ).length;
  const varianceChecksCount = assessment.criteria.filter(
    (criterion) =>
      criterion.state === 'potential_concern' || criterion.state === 'blocked',
  ).length;
  const missingInformationChecksCount = assessment.criteria.filter(
    (criterion) => criterion.state === 'missing_information',
  ).length;

  const recommendedNextActions = OBJECTS_OF_ISSUE_SECTION_IDS.filter(
    (id) => progress.sections[id] !== 'complete',
  )
    .slice(0, 3)
    .map((id) => ({
      sectionId: id,
      label: `Continue ${OBJECTS_OF_ISSUE_SECTION_LABELS[id]}`,
    }));

  return {
    isPureOfs: model.isPureOfs,
    sectionStatuses: progress.sections,
    sectionsComplete: progress.sectionsComplete,
    sectionsInProgress,
    totalSections: progress.totalSections,
    objectsCount: payload.objectsRegisterAndAllocation.objects.length,
    netFreshIssueProceeds: model.netFreshIssueProceeds,
    totalEstimatedObjectsCost: model.totalEstimatedObjectsCost,
    totalAllocatedFromNetProceeds: model.totalAllocatedFromNetProceeds,
    gcpPercentageOfFreshIssue: model.gcpPercentageOfFreshIssue,
    hasCapexRelevantObjects: model.hasCapexRelevantObjects,
    hasAcquisitionRelevantObjects: model.hasAcquisitionRelevantObjects,
    companyReference: linkedReferences.company,
    assessmentResultLabel: assessment.resultLabel,
    assessmentSummary: assessment.summary,
    reconciledChecksCount,
    varianceChecksCount,
    missingInformationChecksCount,
    recommendedNextActions,
  };
}
