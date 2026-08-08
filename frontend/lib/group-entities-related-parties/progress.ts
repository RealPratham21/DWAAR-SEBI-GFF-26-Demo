/**
 * Section completion for Group Entities & Related Parties.
 */

import { GROUP_ENTITIES_CONFIRMATION_FIELDS } from '@/lib/group-entities-related-parties/options';
import { isFilledDecimal } from '@/lib/group-entities-related-parties/decimal';
import type {
  GroupEntitiesProgress,
  GroupEntitiesSectionId,
  SectionStatus,
} from '@/lib/group-entities-related-parties/types';
import type { GroupEntitiesRelatedPartiesPayload } from '@/lib/schemas/group-entities-related-parties';

function filled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function statusFrom(answered: number, total: number, extraComplete = true): SectionStatus {
  if (answered === 0) return 'not_started';
  if (answered < total || !extraComplete) return 'in_progress';
  return 'complete';
}

export function evaluateEntityMasterStatus(payload: GroupEntitiesRelatedPartiesPayload): SectionStatus {
  const section = payload.groupStructureAndEntityMaster;
  const snapshot = section.groupSnapshot;
  const core = [
    filled(snapshot.structureAsOfDate),
    filled(snapshot.subsidiariesExist) || filled(snapshot.associatesExist),
    section.entities.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const entitiesComplete = section.entities.every(
    (entity) => filled(entity.entityType) && filled(entity.identity.legalName),
  );
  return statusFrom(answered, core.length, entitiesComplete);
}

export function evaluateOwnershipStatus(payload: GroupEntitiesRelatedPartiesPayload): SectionStatus {
  const section = payload.ownershipControlAndRelationshipMapping;
  const hasData =
    section.ownershipRelationships.length > 0 ||
    section.contractualArrangements.length > 0 ||
    section.commonPersonRelationships.length > 0;
  if (!hasData) return 'not_started';
  const complete = section.ownershipRelationships.every(
    (rel) =>
      filled(rel.parentPartyEntityId) &&
      filled(rel.investeeEntityId) &&
      filled(rel.relationshipType),
  );
  return complete ? 'complete' : 'in_progress';
}

export function evaluateClassificationStatus(payload: GroupEntitiesRelatedPartiesPayload): SectionStatus {
  const section = payload.groupCompanyAndMaterialityClassification;
  const policy = section.materialityPolicy;
  const core = [
    section.entityClassifications.length > 0 || section.icdrGroupCompanyDeterminations.length > 0,
    filled(policy.policyExists),
    section.materialityCriteria.length > 0 || filled(policy.adopted),
  ];
  const answered = core.filter(Boolean).length;
  return statusFrom(answered, core.length);
}

export function evaluateRelatedPartyUniverseStatus(
  payload: GroupEntitiesRelatedPartiesPayload,
): SectionStatus {
  const relationships = payload.relatedPartyUniverseAndClassification.relatedPartyRelationships;
  if (relationships.length === 0) return 'not_started';
  const complete = relationships.every(
    (rp) =>
      filled(rp.partyType) &&
      filled(rp.relationshipCategory) &&
      (filled(rp.linkedEntityId) || filled(rp.linkedPersonId)) &&
      rp.frameworkClassifications.some((fc) => filled(fc.framework) && filled(fc.related)),
  );
  return complete ? 'complete' : 'in_progress';
}

export function evaluateRptStatus(payload: GroupEntitiesRelatedPartiesPayload): SectionStatus {
  const section = payload.relatedPartyTransactionsBalancesAndCommitments;
  if (section.transactions.length === 0 && section.balances.length === 0) return 'not_started';
  const txComplete = section.transactions.every(
    (tx) =>
      filled(tx.relatedPartyRelationshipId) &&
      filled(tx.financialPeriod) &&
      (filled(tx.transactionType) || isFilledDecimal(tx.transactionValue)),
  );
  return txComplete ? 'complete' : 'in_progress';
}

export function evaluateCommonPursuitsStatus(payload: GroupEntitiesRelatedPartiesPayload): SectionStatus {
  const section = payload.commonPursuitsDependenciesAndConflicts;
  const hasData =
    section.commonPursuitScreenings.length > 0 ||
    section.commonPursuitRecords.length > 0 ||
    section.interCompanyDependencies.length > 0;
  if (!hasData) return 'not_started';
  const screeningsComplete = section.commonPursuitScreenings.every(
    (screening) => filled(screening.entityId) && filled(screening.sameLineOfBusiness),
  );
  const recordsComplete = section.commonPursuitRecords.every(
    (record) => filled(record.entityId) && filled(record.natureOfOverlap),
  );
  const dependenciesComplete = section.interCompanyDependencies.every(
    (dep) => filled(dep.entityId) && filled(dep.dependencyType),
  );
  return screeningsComplete && recordsComplete && dependenciesComplete ? 'complete' : 'in_progress';
}

export function evaluateFinancialReadinessStatus(
  payload: GroupEntitiesRelatedPartiesPayload,
): SectionStatus {
  const records =
    payload.groupEntityFinancialRegulatoryAndLitigationReadiness.entityFinancialReadiness;
  if (records.length === 0) return 'not_started';
  const complete = records.every(
    (record) => filled(record.entityId) && filled(record.financialInformationAvailable),
  );
  return complete ? 'complete' : 'in_progress';
}

export function evaluateChangesConfirmationsStatus(
  payload: GroupEntitiesRelatedPartiesPayload,
): SectionStatus {
  const confirmations = payload.changesRptReadinessAndConfirmations.confirmations;
  const answered = GROUP_ENTITIES_CONFIRMATION_FIELDS.filter(
    (field) => confirmations[field.key] !== '',
  ).length;
  if (answered === 0) return 'not_started';
  if (answered < GROUP_ENTITIES_CONFIRMATION_FIELDS.length) return 'in_progress';
  return 'complete';
}

const SECTION_EVALUATORS: Record<
  GroupEntitiesSectionId,
  (payload: GroupEntitiesRelatedPartiesPayload) => SectionStatus
> = {
  'group-structure-and-entity-master': evaluateEntityMasterStatus,
  'ownership-control-and-relationship-mapping': evaluateOwnershipStatus,
  'group-company-and-materiality-classification': evaluateClassificationStatus,
  'related-party-universe-and-classification': evaluateRelatedPartyUniverseStatus,
  'related-party-transactions-balances-and-commitments': evaluateRptStatus,
  'common-pursuits-dependencies-and-conflicts': evaluateCommonPursuitsStatus,
  'group-entity-financial-regulatory-and-litigation-readiness': evaluateFinancialReadinessStatus,
  'changes-rpt-readiness-and-confirmations': evaluateChangesConfirmationsStatus,
};

export function calculateGroupEntitiesProgress(
  payload: GroupEntitiesRelatedPartiesPayload,
): GroupEntitiesProgress {
  const sections = Object.fromEntries(
    (Object.keys(SECTION_EVALUATORS) as GroupEntitiesSectionId[]).map((sectionId) => [
      sectionId,
      SECTION_EVALUATORS[sectionId](payload),
    ]),
  ) as GroupEntitiesProgress['sections'];

  const sectionsComplete = Object.values(sections).filter((status) => status === 'complete').length;
  const overallStatus: SectionStatus =
    sectionsComplete === 0
      ? 'not_started'
      : sectionsComplete === Object.keys(sections).length
        ? 'complete'
        : 'in_progress';

  return {
    sections,
    sectionsComplete,
    totalSections: Object.keys(sections).length,
    overallStatus,
  };
}
