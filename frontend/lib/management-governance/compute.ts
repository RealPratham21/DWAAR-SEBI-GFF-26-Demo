/**
 * Derived Management & Governance computations (NOT persisted).
 */

import {
  buildGovernanceApplicabilityProfile,
  type GovernanceApplicabilityProfile,
} from '@/lib/management-governance/applicability';
import { countByCategory, getDirectors } from '@/lib/management-governance/directors';
import type { ManagementGovernancePayload } from '@/lib/schemas/management-governance';
import {
  createEmptyLinkedWorkstreamReferences,
  type LinkedWorkstreamReferences,
} from '@/lib/management-governance/types';

export type CommitteeReadinessItem = {
  committeeType: string;
  required: boolean;
  constituted: boolean;
  active: boolean;
  memberCount: number;
  hasChair: boolean;
  status: 'ready' | 'pending' | 'not_applicable' | 'missing_information';
  message: string;
};

export type ContinuityMetrics = {
  boardAdditionsLastThreeYears: number;
  boardCessationsLastThreeYears: number;
  kmpSmpAdditionsLastThreeYears: number;
  kmpSmpCessationsLastThreeYears: number;
  currentVacancies: number;
  criticalRoleVacancies: number;
  repeatCfoChanges: number;
  repeatCompanySecretaryChanges: number;
};

export type ManagementGovernanceModel = {
  applicability: GovernanceApplicabilityProfile;
  boardCounts: ReturnType<typeof countByCategory>;
  boardSize: number;
  proposedBoardSize: number;
  vacantSeats: number;
  pendingAppointments: number;
  kmpCount: number;
  smpCount: number;
  committeeReadiness: CommitteeReadinessItem[];
  committeesReadyCount: number;
  committeesRequiredCount: number;
  policiesAdoptedCount: number;
  policiesRequiredCount: number;
  continuity: ContinuityMetrics;
  chairmanName: string;
  managingDirectorName: string;
  potentialDirectorshipLimitFlags: number;
};

function parseDate(value: string): Date | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinLastThreeYears(dateStr: string): boolean {
  const date = parseDate(dateStr);
  if (!date) return false;
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  return date >= threeYearsAgo;
}

function isAdditionEvent(event: string): boolean {
  return event === 'appointment' || event === 'reappointment' || event === 're-designation';
}

function isCessationEvent(event: string): boolean {
  return (
    event === 'resignation' ||
    event === 'cessation' ||
    event === 'retirement' ||
    event === 'death' ||
    event === 'removal' ||
    event === 'nominee-withdrawal'
  );
}

export function computeContinuityMetrics(payload: ManagementGovernancePayload): ContinuityMetrics {
  const boardChanges = payload.changesContinuityAndSuccession.boardChanges;
  const kmpChanges = payload.changesContinuityAndSuccession.kmpSmpChanges;
  const vacancies = payload.kmpSeniorManagementAndOrganisationStructure.vacancies;

  const boardAdditions = boardChanges.filter(
    (c) => isWithinLastThreeYears(c.effectiveDate) && isAdditionEvent(c.event),
  ).length;
  const boardCessations = boardChanges.filter(
    (c) => isWithinLastThreeYears(c.effectiveDate) && isCessationEvent(c.event),
  ).length;
  const kmpAdditions = kmpChanges.filter(
    (c) => isWithinLastThreeYears(c.effectiveDate) && isAdditionEvent(c.event),
  ).length;
  const kmpCessations = kmpChanges.filter(
    (c) => isWithinLastThreeYears(c.effectiveDate) && isCessationEvent(c.event),
  ).length;

  const cfoChanges = kmpChanges.filter(
    (c) =>
      isWithinLastThreeYears(c.effectiveDate) &&
      (c.newDesignation.toLowerCase().includes('cfo') ||
        c.previousDesignation.toLowerCase().includes('cfo')),
  ).length;
  const csChanges = kmpChanges.filter(
    (c) =>
      isWithinLastThreeYears(c.effectiveDate) &&
      (c.newDesignation.toLowerCase().includes('company secretary') ||
        c.previousDesignation.toLowerCase().includes('company secretary')),
  ).length;

  return {
    boardAdditionsLastThreeYears: boardAdditions,
    boardCessationsLastThreeYears: boardCessations,
    kmpSmpAdditionsLastThreeYears: kmpAdditions,
    kmpSmpCessationsLastThreeYears: kmpCessations,
    currentVacancies: vacancies.length,
    criticalRoleVacancies: vacancies.filter((v) =>
      /cfo|company secretary|md|ceo|compliance/i.test(v.role),
    ).length,
    repeatCfoChanges: cfoChanges > 1 ? cfoChanges - 1 : 0,
    repeatCompanySecretaryChanges: csChanges > 1 ? csChanges - 1 : 0,
  };
}

export function computeCommitteeReadiness(
  payload: ManagementGovernancePayload,
  applicability: GovernanceApplicabilityProfile,
): CommitteeReadinessItem[] {
  const committees = payload.boardCommitteesAndGovernanceBodies.committees;

  return applicability.committeeRequirements.map((req) => {
    const matching = committees.filter((c) => c.committeeType === req.committeeType);
    const active = matching.some((c) => c.activeStatus === 'yes');
    const constituted = matching.length > 0;
    const memberCount = matching.reduce((sum, c) => sum + c.members.length, 0);
    const hasChair = matching.some(
      (c) => c.chairpersonDirectorId.trim() !== '' || c.members.some((m) => m.role === 'chair'),
    );

    let status: CommitteeReadinessItem['status'] = 'missing_information';
    if (!req.required) status = 'not_applicable';
    else if (active && hasChair && memberCount > 0) status = 'ready';
    else if (constituted) status = 'pending';

    return {
      committeeType: req.committeeType,
      required: req.required,
      constituted,
      active,
      memberCount,
      hasChair,
      status,
      message: req.reason,
    };
  });
}

export function computeManagementGovernanceModel(
  payload: ManagementGovernancePayload,
  linkedReferences: LinkedWorkstreamReferences = createEmptyLinkedWorkstreamReferences(),
): ManagementGovernanceModel {
  const applicability = buildGovernanceApplicabilityProfile(linkedReferences);
  const boardCounts = countByCategory(payload);
  const directors = getDirectors(payload);
  const kmpRecords = payload.kmpSeniorManagementAndOrganisationStructure.kmpSmpRecords;

  const boardSnapshot = payload.boardStructureAndIpoGovernanceReadiness.boardSnapshot;
  const boardSize = boardCounts.current || Number(boardSnapshot.currentBoardSize) || 0;
  const proposedBoardSize =
    Number(boardSnapshot.proposedBoardSizeForListing) || boardCounts.proposed + boardCounts.current;
  const vacantSeats = Number(boardSnapshot.vacantBoardSeats) || 0;

  const pendingAppointments = directors.filter(
    (d) => d.appointmentStatus.startsWith('proposed'),
  ).length;

  const kmpCount = kmpRecords.filter(
    (k) => k.classification === 'kmp' || k.classification === 'both',
  ).length;
  const smpCount = kmpRecords.filter(
    (k) => k.classification === 'senior-management' || k.classification === 'both',
  ).length;

  const committeeReadiness = computeCommitteeReadiness(payload, applicability);
  const committeesRequiredCount = committeeReadiness.filter((c) => c.required).length;
  const committeesReadyCount = committeeReadiness.filter(
    (c) => c.required && c.status === 'ready',
  ).length;

  const policies = payload.governancePoliciesRptOversightAndConfirmations.governancePolicies;
  const policiesAdoptedCount = policies.filter((p) => p.adoptedStatus === 'adopted').length;
  const policiesRequiredCount = policies.filter(
    (p) => p.applicableStatus === 'required' || p.applicableStatus === 'potentially-applicable',
  ).length;

  const leadership = payload.boardStructureAndIpoGovernanceReadiness.leadership;
  const chairman = directors.find((d) => d.id === leadership.chairmanDirectorId);
  const md = directors.find((d) => d.id === leadership.managingDirectorDirectorId);

  const potentialDirectorshipLimitFlags = directors.filter((director) => {
    const counts = director.otherDirectorships.filter((d) => d.currentOrCeased === 'current');
    return counts.length >= 7 || director.eligibility.directorshipLimitConcern === 'yes';
  }).length;

  return {
    applicability,
    boardCounts,
    boardSize,
    proposedBoardSize,
    vacantSeats,
    pendingAppointments,
    kmpCount,
    smpCount,
    committeeReadiness,
    committeesReadyCount,
    committeesRequiredCount,
    policiesAdoptedCount,
    policiesRequiredCount,
    continuity: computeContinuityMetrics(payload),
    chairmanName: chairman?.fullLegalName ?? '',
    managingDirectorName: md?.fullLegalName ?? '',
    potentialDirectorshipLimitFlags,
  };
}
