/**
 * Overview summary derived from the in-memory Group Entities draft (GR1).
 */

import { assessGroupEntities, type GroupAssessmentResponse } from '@/lib/group-entities-related-parties/assessment';
import {
  computeGroupEntitiesModel,
  type GroupEntitiesModel,
} from '@/lib/group-entities-related-parties/compute';
import { GROUP_ENTITIES_SECTION_LABELS } from '@/lib/group-entities-related-parties/options';
import { calculateGroupEntitiesProgress } from '@/lib/group-entities-related-parties/progress';
import type {
  GroupEntitiesProgress,
  LinkedWorkstreamReferences,
} from '@/lib/group-entities-related-parties/types';
import type {
  GroupEntitiesRelatedPartiesPayload,
  GroupEntitiesSectionId,
} from '@/lib/schemas/group-entities-related-parties';

export type GroupEntitiesOverviewSummary = {
  sectionStatuses: GroupEntitiesProgress['sections'];
  sectionsComplete: number;
  sectionsInProgress: number;
  totalSections: number;
  overallStatus: GroupEntitiesProgress['overallStatus'];
  entityCount: number;
  subsidiaryCount: number;
  stepDownSubsidiaryCount: number;
  associateCount: number;
  jvCount: number;
  promoterGroupEntityCount: number;
  icdrGroupCompanyCount: number;
  icdrPendingBoardCount: number;
  relatedPartyCount: number;
  historicalRelatedPartyCount: number;
  latestFinancialYearRptTotal: string;
  rptRevenuePercent: string | null;
  rptPurchasesPercent: string | null;
  relatedPartyReceivables: string;
  relatedPartyPayables: string;
  relatedPartyLoans: string;
  guaranteesCommitments: string;
  commonPursuitEntityCount: number;
  materialDependencyCount: number;
  potentialConflictItems: number;
  groupCompaniesWithCompleteFinancialInfo: number;
  negativeNetWorthCount: number;
  auditorQualifiedCount: number;
  ibcConcernCount: number;
  pendingEntityInformationCount: number;
  rptFinancialsReconciliationStatus: string;
  materialityPolicyStatus: string;
  assessmentConcerns: number;
  professionalReviewItems: number;
  assessmentResult: GroupAssessmentResponse['result'];
  assessmentResultLabel: string;
  assessmentSummary: string;
  recommendedNextActions: Array<{ sectionId: GroupEntitiesSectionId; label: string }>;
  latestFinancialPeriod: string | null;
  currency: string;
  amountUnit: string;
};

export function buildGroupEntitiesOverviewSummary(
  payload: GroupEntitiesRelatedPartiesPayload,
  linkedReferences: LinkedWorkstreamReferences = {
    company: { available: false, legalName: null, cin: null },
    capitalOwnership: { available: false, promoterCount: 0, promoters: [] },
    managementGovernance: {
      available: false,
      directorCount: 0,
      kmpCount: 0,
      directors: [],
      kmp: [],
      rptOversightAvailable: false,
    },
    financialsKpis: {
      available: false,
      latestFinancialPeriod: null,
      revenueFromOperations: null,
      totalPurchases: null,
      totalReceivables: null,
      totalPayables: null,
      rptRevenueTotal: null,
      rptPurchasesTotal: null,
      rptReceivablesTotal: null,
      rptPayablesTotal: null,
    },
    businessOperations: {
      available: false,
      productServiceContextAvailable: false,
      supplierCustomerContextAvailable: false,
    },
    objectsOfIssue: {
      available: false,
      subsidiaryInvestmentProposed: false,
      relatedPartyDebtRepaymentProposed: false,
    },
  },
): GroupEntitiesOverviewSummary {
  const progress = calculateGroupEntitiesProgress(payload);
  const model = computeGroupEntitiesModel(payload, linkedReferences);
  const assessment = assessGroupEntities(payload, linkedReferences);

  const sectionsInProgress = Object.values(progress.sections).filter(
    (status) => status === 'in_progress',
  ).length;

  const incompleteSections = (
    Object.entries(progress.sections) as Array<
      [GroupEntitiesSectionId, GroupEntitiesProgress['sections'][GroupEntitiesSectionId]]
    >
  ).filter(([, status]) => status !== 'complete');

  const recommendedNextActions = incompleteSections.slice(0, 4).map(([sectionId]) => ({
    sectionId,
    label: `Continue with ${GROUP_ENTITIES_SECTION_LABELS[sectionId]}`,
  }));

  const policy = payload.groupCompanyAndMaterialityClassification.materialityPolicy;
  const materialityPolicyStatus =
    policy.policyExists === 'yes' && policy.adopted === 'yes'
      ? 'Adopted'
      : policy.policyExists === 'yes'
        ? 'Recorded — adoption pending'
        : 'Not captured';

  const rptFinancialsReconciliationStatus =
    model.rptSummary.financialsRevenueDifference || model.rptSummary.financialsPurchasesDifference
      ? 'Reconciliation differences identified'
      : linkedReferences.financialsKpis.available
        ? 'No material differences detected'
        : 'Pending Financials linkage';

  const financialReadiness =
    payload.groupEntityFinancialRegulatoryAndLitigationReadiness.entityFinancialReadiness;
  const groupCompaniesWithCompleteFinancialInfo = financialReadiness.filter(
    (r) => r.informationStatus === 'complete',
  ).length;

  const firstTx = payload.relatedPartyTransactionsBalancesAndCommitments.transactions[0];

  const assessmentConcerns =
    assessment.counts.potentialConcern +
    assessment.counts.unresolvedRelationship +
    assessment.counts.classificationReviewRequired +
    assessment.counts.financialReconciliationPending +
    assessment.counts.pendingEntityInformation;

  const professionalReviewItems =
    assessment.counts.pendingProfessionalConfirmation + assessment.counts.pendingBoardDetermination;

  return {
    sectionStatuses: progress.sections,
    sectionsComplete: progress.sectionsComplete,
    sectionsInProgress,
    totalSections: progress.totalSections,
    overallStatus: progress.overallStatus,
    entityCount: model.entityCount,
    subsidiaryCount: model.subsidiaryCount,
    stepDownSubsidiaryCount: model.stepDownSubsidiaryCount,
    associateCount: model.associateCount,
    jvCount: model.jvCount,
    promoterGroupEntityCount: model.promoterGroupEntityCount,
    icdrGroupCompanyCount: model.icdrGroupCompanyCount,
    icdrPendingBoardCount: model.icdrPendingBoardCount,
    relatedPartyCount: model.relatedPartyCount,
    historicalRelatedPartyCount: model.historicalRelatedPartyCount,
    latestFinancialYearRptTotal: model.rptSummary.latestFinancialYearTotal,
    rptRevenuePercent: model.rptSummary.rptRevenuePercent,
    rptPurchasesPercent: model.rptSummary.rptPurchasesPercent,
    relatedPartyReceivables: model.rptSummary.closingReceivables,
    relatedPartyPayables: model.rptSummary.closingPayables,
    relatedPartyLoans: model.rptSummary.closingLoans,
    guaranteesCommitments: model.rptSummary.guarantees,
    commonPursuitEntityCount: model.commonPursuitEntityCount,
    materialDependencyCount: model.dependencyCount,
    potentialConflictItems: model.commonPursuitEntityCount,
    groupCompaniesWithCompleteFinancialInfo,
    negativeNetWorthCount: model.negativeNetWorthCount,
    auditorQualifiedCount: model.auditorQualifiedCount,
    ibcConcernCount: model.ibcConcernCount,
    pendingEntityInformationCount: model.pendingEntityInformationCount,
    rptFinancialsReconciliationStatus,
    materialityPolicyStatus,
    assessmentConcerns,
    professionalReviewItems,
    assessmentResult: assessment.result,
    assessmentResultLabel: assessment.resultLabel,
    assessmentSummary: assessment.summary,
    recommendedNextActions,
    latestFinancialPeriod:
      linkedReferences.financialsKpis.latestFinancialPeriod ?? firstTx?.financialPeriod ?? null,
    currency: firstTx?.currency ?? 'INR',
    amountUnit: firstTx?.amountUnit ?? 'lakhs',
  };
}

export const buildOverviewSummary = buildGroupEntitiesOverviewSummary;

export type { GroupEntitiesModel };
