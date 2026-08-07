/**
 * Deterministic Governance Assessment for Management & Governance (M1, frontend-only).
 *
 * Readiness-focused: never returns compliant/non-compliant or strong/weak management scores.
 */

import {
  computeManagementGovernanceModel,
  type ManagementGovernanceModel,
} from '@/lib/management-governance/compute';
import { computeDirectorshipCounts } from '@/lib/management-governance/directors';
import { MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS } from '@/lib/management-governance/options';
import { calculateManagementGovernanceProgress } from '@/lib/management-governance/progress';
import {
  createEmptyLinkedWorkstreamReferences,
  type LinkedWorkstreamReferences,
  type ManagementGovernanceProgress,
} from '@/lib/management-governance/types';
import type { ManagementGovernancePayload } from '@/lib/schemas/management-governance';

export const GOVERNANCE_CRITERION_STATES = [
  'appears_ready',
  'potential_concern',
  'missing_information',
  'pending_appointment',
  'pending_board_approval',
  'pending_shareholder_approval',
  'pending_linked_workstream',
  'pending_professional_confirmation',
  'not_applicable',
] as const;

export type GovernanceCriterionState = (typeof GOVERNANCE_CRITERION_STATES)[number];

export const GOVERNANCE_ASSESSMENT_GROUPS = [
  'board_composition',
  'director_eligibility',
  'management_coverage',
  'board_committees',
  'remuneration_and_interests',
  'management_continuity',
  'governance_processes',
  'ipo_specific_governance',
] as const;

export type GovernanceAssessmentGroup = (typeof GOVERNANCE_ASSESSMENT_GROUPS)[number];

export const GOVERNANCE_CRITERION_STATE_LABELS: Record<GovernanceCriterionState, string> = {
  appears_ready: 'Appears ready',
  potential_concern: 'Potential concern',
  missing_information: 'Missing information',
  pending_appointment: 'Pending appointment',
  pending_board_approval: 'Pending board approval',
  pending_shareholder_approval: 'Pending shareholder approval',
  pending_linked_workstream: 'Pending linked workstream',
  pending_professional_confirmation: 'Pending professional confirmation',
  not_applicable: 'Not applicable',
};

export const GOVERNANCE_ASSESSMENT_GROUP_LABELS: Record<GovernanceAssessmentGroup, string> = {
  board_composition: 'Board composition',
  director_eligibility: 'Director eligibility',
  management_coverage: 'Management coverage',
  board_committees: 'Board committees',
  remuneration_and_interests: 'Remuneration and interests',
  management_continuity: 'Management continuity',
  governance_processes: 'Governance processes',
  ipo_specific_governance: 'IPO-specific governance',
};

export const GOVERNANCE_ASSESSMENT_RESULT_STATES = [
  'insufficient_information',
  'readiness_in_progress',
  'potential_concerns_identified',
  'professional_confirmation_required',
  'pending_appointments',
] as const;

export type GovernanceAssessmentResultState = (typeof GOVERNANCE_ASSESSMENT_RESULT_STATES)[number];

export type GovernanceAssessmentCriterion = {
  id: string;
  group: GovernanceAssessmentGroup;
  label: string;
  state: GovernanceCriterionState;
  reason: string;
};

export type GovernanceAssessmentGroupResult = {
  group: GovernanceAssessmentGroup;
  label: string;
  headlineState: GovernanceCriterionState;
  criteria: GovernanceAssessmentCriterion[];
};

export type GovernanceAssessmentResponse = {
  result: GovernanceAssessmentResultState;
  resultLabel: string;
  summary: string;
  criteria: GovernanceAssessmentCriterion[];
  groups: GovernanceAssessmentGroupResult[];
  counts: Record<
    | 'appearsReady'
    | 'potentialConcern'
    | 'missingInformation'
    | 'pendingAppointment'
    | 'pendingBoardApproval'
    | 'pendingShareholderApproval'
    | 'pendingLinkedWorkstream'
    | 'pendingProfessionalConfirmation'
    | 'notApplicable',
    number
  >;
  metrics: {
    boardSize: number;
    sectionsComplete: number;
    unansweredConfirmations: number;
    pendingAppointments: number;
    potentialConcerns: number;
  };
};

function worstState(states: GovernanceCriterionState[]): GovernanceCriterionState {
  const priority: GovernanceCriterionState[] = [
    'potential_concern',
    'missing_information',
    'pending_appointment',
    'pending_board_approval',
    'pending_shareholder_approval',
    'pending_linked_workstream',
    'pending_professional_confirmation',
    'appears_ready',
    'not_applicable',
  ];
  for (const state of priority) {
    if (states.includes(state)) return state;
  }
  return 'missing_information';
}

function deriveResult(criteria: GovernanceAssessmentCriterion[]): {
  result: GovernanceAssessmentResultState;
  resultLabel: string;
  summary: string;
} {
  const hasConcern = criteria.some((c) => c.state === 'potential_concern');
  const hasPendingAppointment = criteria.some((c) => c.state === 'pending_appointment');
  const hasProfessional = criteria.some(
    (c) =>
      c.state === 'pending_professional_confirmation' ||
      c.state === 'pending_board_approval' ||
      c.state === 'pending_shareholder_approval',
  );
  const missingCount = criteria.filter((c) => c.state === 'missing_information').length;

  if (hasConcern) {
    return {
      result: 'potential_concerns_identified',
      resultLabel: 'Potential concerns identified',
      summary:
        'One or more governance checks show a potential concern that needs review before filing readiness can improve.',
    };
  }
  if (hasPendingAppointment) {
    return {
      result: 'pending_appointments',
      resultLabel: 'Pending appointments',
      summary: 'Some Board or management appointments are still proposed or pending.',
    };
  }
  if (hasProfessional) {
    return {
      result: 'professional_confirmation_required',
      resultLabel: 'Professional confirmation required',
      summary: 'Some items still need board, shareholder or professional confirmation.',
    };
  }
  if (missingCount > criteria.length / 2) {
    return {
      result: 'insufficient_information',
      resultLabel: 'Disclosure readiness in progress',
      summary: 'Much of the management and governance record is still blank or unanswered.',
    };
  }
  return {
    result: 'readiness_in_progress',
    resultLabel: 'Readiness in progress',
    summary: 'Entered information is largely captured; remaining gaps are noted below.',
  };
}

export function buildGovernanceAssessment(
  payload: ManagementGovernancePayload,
  model: ManagementGovernanceModel,
  progress: ManagementGovernanceProgress,
  linkedReferences: LinkedWorkstreamReferences,
): GovernanceAssessmentResponse {
  const criteria: GovernanceAssessmentCriterion[] = [];
  const { applicability, boardCounts } = model;
  const directors = payload.directorsProfilesAppointmentsAndEligibility.directors;

  criteria.push({
    id: 'minimum-board-size',
    group: 'board_composition',
    label: 'Minimum Board size',
    state:
      boardCounts.current >= applicability.minimumBoardSize
        ? 'appears_ready'
        : boardCounts.current > 0
          ? 'potential_concern'
          : 'missing_information',
    reason: `Current directors: ${boardCounts.current}; applicable minimum: ${applicability.minimumBoardSize} (${applicability.listingSegment} segment).`,
  });

  criteria.push({
    id: 'woman-director-readiness',
    group: 'board_composition',
    label: 'Woman director readiness',
    state: !applicability.requiresWomanDirector
      ? 'not_applicable'
      : boardCounts.women >= 1
        ? 'appears_ready'
        : 'pending_appointment',
    reason:
      boardCounts.women >= 1
        ? `${boardCounts.women} woman director(s) among current Board.`
        : 'No woman director recorded among current Board members.',
  });

  criteria.push({
    id: 'independent-director-readiness',
    group: 'board_composition',
    label: 'Independent director readiness',
    state: !applicability.requiresIndependentDirectors
      ? 'not_applicable'
      : boardCounts.independent >= applicability.minimumIndependentDirectors
        ? 'appears_ready'
        : boardCounts.independent > 0
          ? 'pending_appointment'
          : 'missing_information',
    reason: applicability.requiresIndependentDirectors
      ? `${boardCounts.independent} independent director(s); applicable minimum ${applicability.minimumIndependentDirectors}.`
      : 'Independent director count not assumed mandatory for SME listing segment.',
  });

  criteria.push({
    id: 'resident-director-readiness',
    group: 'board_composition',
    label: 'Resident director readiness',
    state: !applicability.requiresResidentDirector
      ? 'not_applicable'
      : boardCounts.resident >= 1
        ? 'appears_ready'
        : 'missing_information',
    reason:
      boardCounts.resident >= 1
        ? `${boardCounts.resident} resident director(s) recorded.`
        : 'Resident director not identified from country of residence.',
  });

  criteria.push({
    id: 'board-vacancies',
    group: 'board_composition',
    label: 'Board vacancies',
    state:
      model.vacantSeats === 0 && boardCounts.current > 0
        ? 'appears_ready'
        : model.vacantSeats > 0
          ? 'potential_concern'
          : 'missing_information',
    reason:
      model.vacantSeats > 0
        ? `${model.vacantSeats} vacant seat(s) recorded.`
        : 'No vacant seats recorded.',
  });

  criteria.push({
    id: 'proposed-vs-current-distinction',
    group: 'board_composition',
    label: 'Current versus proposed appointments distinguished',
    state:
      directors.some((d) => d.appointmentStatus.startsWith('proposed')) &&
      directors.some((d) => d.appointmentStatus === 'current')
        ? 'appears_ready'
        : directors.length > 0
          ? 'appears_ready'
          : 'missing_information',
    reason: 'Directors carry explicit current/proposed appointment status.',
  });

  for (const director of directors) {
    if (!director.din.trim()) {
      criteria.push({
        id: `din-${director.id}`,
        group: 'director_eligibility',
        label: `DIN — ${director.fullLegalName || director.id}`,
        state: 'missing_information',
        reason: 'Director Identification Number not recorded.',
      });
    }

    const directorshipCounts = computeDirectorshipCounts(director);
    if (directorshipCounts.totalCurrent >= 7 || director.eligibility.directorshipLimitConcern === 'yes') {
      criteria.push({
        id: `directorship-limit-${director.id}`,
        group: 'director_eligibility',
        label: `Directorship count — ${director.fullLegalName || director.id}`,
        state: 'potential_concern',
        reason: `${directorshipCounts.totalCurrent} current directorship(s) recorded; threshold review suggested.`,
      });
    }

    if (director.eligibility.sebiDebarment === 'yes' || director.eligibility.stockExchangeDebarment === 'yes') {
      criteria.push({
        id: `debarment-${director.id}`,
        group: 'director_eligibility',
        label: `Debarment declaration — ${director.fullLegalName || director.id}`,
        state: 'potential_concern',
        reason: 'A debarment or restraint declaration is marked yes — explanation required.',
      });
    }

    if (director.appointmentStatus.startsWith('proposed') && !director.boardApprovalDate.trim()) {
      criteria.push({
        id: `pending-board-${director.id}`,
        group: 'director_eligibility',
        label: `Board approval — ${director.fullLegalName || director.id}`,
        state: 'pending_board_approval',
        reason: 'Proposed appointment without board approval date recorded.',
      });
    }
  }

  const kmp = payload.kmpSeniorManagementAndOrganisationStructure;
  for (const role of [
    { key: 'cfo', label: 'CFO' },
    { key: 'companySecretary', label: 'Company Secretary' },
    { key: 'complianceOfficer', label: 'Compliance Officer' },
  ] as const) {
    const status = kmp.kmpRoleReadiness[role.key];
    criteria.push({
      id: `kmp-${role.key}`,
      group: 'management_coverage',
      label: `${role.label} coverage`,
      state:
        status === 'completed'
          ? 'appears_ready'
          : status === 'professional_confirmation_required'
            ? 'pending_professional_confirmation'
            : status === 'not_applicable'
              ? 'not_applicable'
              : status === 'in_progress'
                ? 'pending_appointment'
                : 'missing_information',
      reason: status ? `Readiness status: ${status.replace(/_/g, ' ')}.` : 'Readiness status not recorded.',
    });
  }

  if (model.continuity.criticalRoleVacancies > 0) {
    criteria.push({
      id: 'critical-vacancies',
      group: 'management_coverage',
      label: 'Critical role vacancies',
      state: 'potential_concern',
      reason: `${model.continuity.criticalRoleVacancies} critical role vacancy/vacancies recorded.`,
    });
  }

  for (const item of model.committeeReadiness.filter((c) => c.required)) {
    criteria.push({
      id: `committee-${item.committeeType}`,
      group: 'board_committees',
      label: item.committeeType.replace(/-/g, ' '),
      state:
        item.status === 'ready'
          ? 'appears_ready'
          : item.status === 'pending'
            ? 'pending_appointment'
            : item.status === 'not_applicable'
              ? 'not_applicable'
              : 'missing_information',
      reason: item.message,
    });
  }

  if (!linkedReferences.capitalOwnership.available) {
    criteria.push({
      id: 'capital-ownership-link',
      group: 'remuneration_and_interests',
      label: 'Capital & Ownership shareholding link',
      state: 'pending_linked_workstream',
      reason: 'Director/KMP shareholding cross-check awaits Capital & Ownership (M2 wiring).',
    });
  }

  if (!linkedReferences.financialsKpis.available) {
    criteria.push({
      id: 'financials-kpis-link',
      group: 'remuneration_and_interests',
      label: 'Financials & KPIs RPT references',
      state: 'pending_linked_workstream',
      reason: 'RPT amount references await Financials & KPIs (M2 wiring).',
    });
  }

  if (model.continuity.repeatCfoChanges > 0 || model.continuity.repeatCompanySecretaryChanges > 0) {
    criteria.push({
      id: 'repeat-kmp-changes',
      group: 'management_continuity',
      label: 'Repeat CFO / Company Secretary changes',
      state: 'potential_concern',
      reason: 'Multiple CFO or Company Secretary changes in the last three years — explanation suggested.',
    });
  }

  const unansweredConfirmations = MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS.filter(
    (field) => !payload.governancePoliciesRptOversightAndConfirmations.confirmations[field.key],
  ).length;

  for (const field of MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS) {
    criteria.push({
      id: `confirmation-${field.key}`,
      group: 'governance_processes',
      label: field.label,
      state: payload.governancePoliciesRptOversightAndConfirmations.confirmations[field.key]
        ? 'appears_ready'
        : 'missing_information',
      reason: payload.governancePoliciesRptOversightAndConfirmations.confirmations[field.key]
        ? 'Confirmed.'
        : 'Not confirmed yet.',
    });
  }

  const ipoCommittee = payload.boardStructureAndIpoGovernanceReadiness.ipoCommittee;
  criteria.push({
    id: 'ipo-committee',
    group: 'ipo_specific_governance',
    label: 'IPO Committee constituted',
    state:
      ipoCommittee.constituted === 'yes'
        ? 'appears_ready'
        : ipoCommittee.constituted === 'not_sure'
          ? 'pending_professional_confirmation'
          : ipoCommittee.constituted === 'no'
            ? 'missing_information'
            : 'missing_information',
    reason:
      ipoCommittee.constituted === 'yes'
        ? 'IPO Committee marked as constituted.'
        : 'IPO Committee constitution not confirmed.',
  });

  const priceBand = payload.boardStructureAndIpoGovernanceReadiness.independentDirectorPriceBandProcess;
  criteria.push({
    id: 'price-band-process',
    group: 'ipo_specific_governance',
    label: 'Independent-director price-band process',
    state:
      priceBand.requiredApplicabilityStatus === 'not-applicable'
        ? 'not_applicable'
        : priceBand.committeeConstituted === 'yes'
          ? 'appears_ready'
          : priceBand.requiredApplicabilityStatus === 'professional-confirmation-required'
            ? 'pending_professional_confirmation'
            : 'missing_information',
    reason: 'Price-band committee process captured for IPO readiness review.',
  });

  const groups: GovernanceAssessmentGroupResult[] = GOVERNANCE_ASSESSMENT_GROUPS.map((group) => {
    const groupCriteria = criteria.filter((c) => c.group === group);
    return {
      group,
      label: GOVERNANCE_ASSESSMENT_GROUP_LABELS[group],
      headlineState: worstState(groupCriteria.map((c) => c.state)),
      criteria: groupCriteria,
    };
  });

  const counts = {
    appearsReady: criteria.filter((c) => c.state === 'appears_ready').length,
    potentialConcern: criteria.filter((c) => c.state === 'potential_concern').length,
    missingInformation: criteria.filter((c) => c.state === 'missing_information').length,
    pendingAppointment: criteria.filter((c) => c.state === 'pending_appointment').length,
    pendingBoardApproval: criteria.filter((c) => c.state === 'pending_board_approval').length,
    pendingShareholderApproval: criteria.filter((c) => c.state === 'pending_shareholder_approval').length,
    pendingLinkedWorkstream: criteria.filter((c) => c.state === 'pending_linked_workstream').length,
    pendingProfessionalConfirmation: criteria.filter(
      (c) => c.state === 'pending_professional_confirmation',
    ).length,
    notApplicable: criteria.filter((c) => c.state === 'not_applicable').length,
  };

  const { result, resultLabel, summary } = deriveResult(criteria);

  return {
    result,
    resultLabel,
    summary,
    criteria,
    groups,
    counts,
    metrics: {
      boardSize: model.boardSize,
      sectionsComplete: progress.sectionsComplete,
      unansweredConfirmations,
      pendingAppointments: model.pendingAppointments,
      potentialConcerns: counts.potentialConcern,
    },
  };
}

export function buildGovernanceAssessmentFromPayload(
  payload: ManagementGovernancePayload,
  linkedReferences: LinkedWorkstreamReferences = createEmptyLinkedWorkstreamReferences(),
): GovernanceAssessmentResponse {
  const progress = calculateManagementGovernanceProgress(payload);
  const model = computeManagementGovernanceModel(payload, linkedReferences);
  return buildGovernanceAssessment(payload, model, progress, linkedReferences);
}

/** Alias used by tests and UI barrels. */
export const assessManagementGovernance = buildGovernanceAssessmentFromPayload;

export type GovernanceAssessment = GovernanceAssessmentResponse;
