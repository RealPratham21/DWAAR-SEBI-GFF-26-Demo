/**
 * Cross-record reference integrity for Group Entities & Related Parties.
 */

import { GROUP_ENTITIES_SECTION_LABELS } from '@/lib/group-entities-related-parties/options';
import type { EntityDependency, EntityDependencyCategory } from '@/lib/group-entities-related-parties/types';
import type {
  GroupEntitiesRelatedPartiesPayload,
  GroupEntitiesSectionId,
} from '@/lib/schemas/group-entities-related-parties';

function push(
  deps: EntityDependency[],
  category: EntityDependencyCategory,
  recordId: string,
  sectionId: GroupEntitiesSectionId,
  label: string,
) {
  deps.push({ category, recordId, sectionId, label });
}

export function countEntityReferences(
  payload: GroupEntitiesRelatedPartiesPayload,
  entityId: string,
): EntityDependency[] {
  if (!entityId) return [];
  const deps: EntityDependency[] = [];

  for (const rel of payload.ownershipControlAndRelationshipMapping.ownershipRelationships) {
    if (rel.parentPartyEntityId === entityId || rel.investeeEntityId === entityId) {
      push(deps, 'ownership-relationship', rel.id, 'ownership-control-and-relationship-mapping', 'Ownership relationship');
    }
  }

  for (const arrangement of payload.ownershipControlAndRelationshipMapping.contractualArrangements) {
    if (arrangement.partyEntityIds.includes(entityId)) {
      push(deps, 'contractual-arrangement', arrangement.id, 'ownership-control-and-relationship-mapping', 'Contractual arrangement');
    }
  }

  for (const rel of payload.ownershipControlAndRelationshipMapping.commonPersonRelationships) {
    if (rel.entityIds.includes(entityId)) {
      push(deps, 'ownership-relationship', rel.id, 'ownership-control-and-relationship-mapping', 'Common-person relationship');
    }
  }

  for (const classification of payload.groupCompanyAndMaterialityClassification.entityClassifications) {
    if (classification.entityId === entityId) {
      push(deps, 'entity-classification', classification.id, 'group-company-and-materiality-classification', 'Entity classification');
    }
  }

  for (const determination of payload.groupCompanyAndMaterialityClassification.icdrGroupCompanyDeterminations) {
    if (determination.entityId === entityId) {
      push(deps, 'icdr-determination', determination.entityId, 'group-company-and-materiality-classification', 'ICDR Group Company determination');
    }
  }

  for (const record of payload.groupCompanyAndMaterialityClassification.materialSubsidiaryPurposeRecords) {
    if (record.entityId === entityId) {
      push(deps, 'material-subsidiary-purpose', record.id, 'group-company-and-materiality-classification', 'Material-subsidiary purpose record');
    }
  }

  for (const rp of payload.relatedPartyUniverseAndClassification.relatedPartyRelationships) {
    if (rp.linkedEntityId === entityId) {
      push(deps, 'related-party-relationship', rp.id, 'related-party-universe-and-classification', 'Related-party relationship');
    }
  }

  for (const tx of payload.relatedPartyTransactionsBalancesAndCommitments.transactions) {
    if (tx.linkedEntityId === entityId) {
      push(deps, 'rpt-transaction', tx.id, 'related-party-transactions-balances-and-commitments', 'RPT transaction');
    }
  }

  for (const balance of payload.relatedPartyTransactionsBalancesAndCommitments.balances) {
    if (balance.linkedEntityId === entityId) {
      push(deps, 'rpt-balance', balance.id, 'related-party-transactions-balances-and-commitments', 'RPT balance');
    }
  }

  for (const screening of payload.commonPursuitsDependenciesAndConflicts.commonPursuitScreenings) {
    if (screening.entityId === entityId) {
      push(deps, 'common-pursuit', screening.entityId, 'common-pursuits-dependencies-and-conflicts', 'Common-pursuit screening');
    }
  }

  for (const record of payload.commonPursuitsDependenciesAndConflicts.commonPursuitRecords) {
    if (record.entityId === entityId) {
      push(deps, 'common-pursuit', record.id, 'common-pursuits-dependencies-and-conflicts', 'Common-pursuit record');
    }
  }

  for (const dep of payload.commonPursuitsDependenciesAndConflicts.interCompanyDependencies) {
    if (dep.entityId === entityId) {
      push(deps, 'dependency', dep.id, 'common-pursuits-dependencies-and-conflicts', 'Inter-company dependency');
    }
  }

  for (const interest of payload.commonPursuitsDependenciesAndConflicts.otherBusinessInterests) {
    if (interest.entityId === entityId) {
      push(deps, 'other-business-interest', interest.id, 'common-pursuits-dependencies-and-conflicts', 'Other business interest');
    }
  }

  for (const readiness of payload.groupEntityFinancialRegulatoryAndLitigationReadiness.entityFinancialReadiness) {
    if (readiness.entityId === entityId) {
      push(deps, 'financial-readiness', readiness.id, 'group-entity-financial-regulatory-and-litigation-readiness', 'Entity financial readiness');
    }
  }

  for (const change of payload.changesRptReadinessAndConfirmations.relationshipChanges) {
    if (change.entityId === entityId) {
      push(deps, 'relationship-change', change.id, 'changes-rpt-readiness-and-confirmations', 'Relationship change');
    }
  }

  return deps;
}

export function formatEntityDependencyMessage(deps: EntityDependency[]): string {
  if (deps.length === 0) return '';
  const sections = [...new Set(deps.map((dep) => GROUP_ENTITIES_SECTION_LABELS[dep.sectionId]))];
  return `This entity is referenced in ${deps.length} record(s) across: ${sections.join(', ')}. Remove or reassign dependent records first.`;
}

export function countRelatedPartyReferences(
  payload: GroupEntitiesRelatedPartiesPayload,
  relatedPartyId: string,
): number {
  let count = 0;
  for (const tx of payload.relatedPartyTransactionsBalancesAndCommitments.transactions) {
    if (tx.relatedPartyRelationshipId === relatedPartyId) count += 1;
  }
  for (const balance of payload.relatedPartyTransactionsBalancesAndCommitments.balances) {
    if (balance.relatedPartyRelationshipId === relatedPartyId) count += 1;
  }
  return count;
}
