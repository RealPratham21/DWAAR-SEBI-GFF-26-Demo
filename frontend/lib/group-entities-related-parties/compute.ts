/**
 * Derived model for Group Entities & Related Parties.
 */

import { countActiveEntities, countEntitiesByBadge, getEntities } from '@/lib/group-entities-related-parties/entities';
import { calculateRptSummary } from '@/lib/group-entities-related-parties/rpt';
import type { LinkedWorkstreamReferences } from '@/lib/group-entities-related-parties/types';
import type { GroupEntitiesRelatedPartiesPayload } from '@/lib/schemas/group-entities-related-parties';

export type GroupEntitiesModel = {
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
  ownershipRelationshipCount: number;
  rptTransactionCount: number;
  commonPursuitEntityCount: number;
  dependencyCount: number;
  negativeNetWorthCount: number;
  lossMakingCount: number;
  auditorQualifiedCount: number;
  incompleteInformationCount: number;
  ibcConcernCount: number;
  pendingEntityInformationCount: number;
  rptSummary: ReturnType<typeof calculateRptSummary>;
};

export function computeGroupEntitiesModel(
  payload: GroupEntitiesRelatedPartiesPayload,
  linkedReferences: LinkedWorkstreamReferences,
): GroupEntitiesModel {
  const rptSummary = calculateRptSummary(payload, linkedReferences);
  const relatedParties = payload.relatedPartyUniverseAndClassification.relatedPartyRelationships;

  const icdrDeterminations =
    payload.groupCompanyAndMaterialityClassification.icdrGroupCompanyDeterminations;
  const icdrPendingBoardCount = icdrDeterminations.filter(
    (d) => d.classificationState === 'pending_board_determination',
  ).length;

  const icdrGroupCompanyCount = icdrDeterminations.filter(
    (d) => d.classificationState === 'identified' || d.classificationState === 'potentially_identified',
  ).length;

  const financialReadiness =
    payload.groupEntityFinancialRegulatoryAndLitigationReadiness.entityFinancialReadiness;

  return {
    entityCount: countActiveEntities(payload),
    subsidiaryCount: countEntitiesByBadge(payload, 'subsidiary'),
    stepDownSubsidiaryCount: countEntitiesByBadge(payload, 'step-down-subsidiary'),
    associateCount: countEntitiesByBadge(payload, 'associate'),
    jvCount: countEntitiesByBadge(payload, 'jv'),
    promoterGroupEntityCount: countEntitiesByBadge(payload, 'promoter-group-entity'),
    icdrGroupCompanyCount,
    icdrPendingBoardCount,
    relatedPartyCount: relatedParties.filter((rp) =>
      rp.frameworkClassifications.some((fc) => fc.currentHistorical !== 'historical' && fc.related === 'yes'),
    ).length,
    historicalRelatedPartyCount: relatedParties.filter((rp) =>
      rp.frameworkClassifications.some((fc) => fc.currentHistorical === 'historical'),
    ).length,
    ownershipRelationshipCount:
      payload.ownershipControlAndRelationshipMapping.ownershipRelationships.length,
    rptTransactionCount:
      payload.relatedPartyTransactionsBalancesAndCommitments.transactions.length,
    commonPursuitEntityCount:
      payload.commonPursuitsDependenciesAndConflicts.commonPursuitRecords.length,
    dependencyCount: payload.commonPursuitsDependenciesAndConflicts.interCompanyDependencies.length,
    negativeNetWorthCount: financialReadiness.filter((r) => r.negativeNetWorth === 'yes').length,
    lossMakingCount: financialReadiness.filter((r) => r.lossMaking === 'yes').length,
    auditorQualifiedCount: financialReadiness.filter((r) => r.auditorQualification === 'yes').length,
    incompleteInformationCount: financialReadiness.filter(
      (r) => r.informationStatus === 'partial' || r.informationStatus === 'unavailable',
    ).length,
    ibcConcernCount: financialReadiness.filter(
      (r) => r.ibcProceeding === 'yes' || r.windingUpPetition === 'yes' || r.liquidation === 'yes',
    ).length,
    pendingEntityInformationCount: financialReadiness.filter(
      (r) => r.informationStatus === 'not-requested' || r.informationReceived === 'no',
    ).length,
    rptSummary,
  };
}

export function deriveOwnershipChainSummary(payload: GroupEntitiesRelatedPartiesPayload): string[] {
  const lines: string[] = [];
  const entities = getEntities(payload);
  const issuer = entities.find((e) => e.classificationBadges.includes('parent')) ?? entities[0];
  if (!issuer) return lines;

  const relationships = payload.ownershipControlAndRelationshipMapping.ownershipRelationships.filter(
    (rel) => rel.currentHistorical !== 'historical',
  );

  for (const rel of relationships) {
    if (rel.investeeEntityId === issuer.id || rel.parentPartyEntityId === issuer.id) {
      const parent = entities.find((e) => e.id === rel.parentPartyEntityId);
      const child = entities.find((e) => e.id === rel.investeeEntityId);
      const parentName = parent?.identity.legalName || parent?.identity.displayName || rel.parentPartyEntityId.slice(0, 8);
      const childName = child?.identity.legalName || child?.identity.displayName || rel.investeeEntityId.slice(0, 8);
      lines.push(`${parentName} → ${childName} (${rel.relationshipType || 'relationship'})`);
    }
  }

  return lines.slice(0, 12);
}
