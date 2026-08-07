import { describe, expect, it } from 'vitest';
import {
  assessGroupEntities,
  calculateGroupEntitiesProgress,
  computeGroupEntitiesModel,
  countEntityReferences,
  createEmptyEntityRecord,
  createEmptyGroupEntitiesRelatedPartiesPayload,
  createEmptyOwnershipRelationshipRecord,
  createEmptyRelatedPartyRelationshipRecord,
  createEmptyRptTransactionRecord,
  groupEntitiesRelatedPartiesPayloadSchema,
  SECTION_PAYLOAD_KEYS,
  buildGroupEntitiesOverviewSummary,
} from '@/lib/group-entities-related-parties';
import { calculateRptSummary } from '@/lib/group-entities-related-parties/rpt';
import { createEmptyLinkedWorkstreamReferences } from '@/lib/group-entities-related-parties/types';
import { GROUP_ENTITIES_SECTION_IDS } from '@/lib/schemas/group-entities-related-parties';

describe('Group Entities foundation (GR1)', () => {
  it('parses empty payload with schemaVersion 1', () => {
    const empty = createEmptyGroupEntitiesRelatedPartiesPayload();
    expect(empty.schemaVersion).toBe(1);
    expect(groupEntitiesRelatedPartiesPayloadSchema.safeParse(empty).success).toBe(true);
  });

  it('defines eight section IDs mapped to payload keys', () => {
    expect(GROUP_ENTITIES_SECTION_IDS).toHaveLength(8);
    expect(Object.keys(SECTION_PAYLOAD_KEYS)).toHaveLength(8);
    for (const sectionId of GROUP_ENTITIES_SECTION_IDS) {
      expect(SECTION_PAYLOAD_KEYS[sectionId]).toBeTruthy();
    }
  });

  it('assigns stable IDs to repeatable records', () => {
    const entity = createEmptyEntityRecord();
    const entity2 = createEmptyEntityRecord();
    expect(entity.id).not.toBe(entity2.id);
    expect(entity.id.length).toBeGreaterThan(10);
  });

  it('tracks entity references for deletion protection', () => {
    const payload = createEmptyGroupEntitiesRelatedPartiesPayload();
    const entity = createEmptyEntityRecord();
    entity.identity.legalName = 'Test Subsidiary Pvt Ltd';
    payload.groupStructureAndEntityMaster.entities = [entity];

    const rel = createEmptyOwnershipRelationshipRecord();
    rel.investeeEntityId = entity.id;
    payload.ownershipControlAndRelationshipMapping.ownershipRelationships = [rel];

    const deps = countEntityReferences(payload, entity.id);
    expect(deps.length).toBeGreaterThan(0);
  });

  it('calculates RPT totals deterministically', () => {
    const payload = createEmptyGroupEntitiesRelatedPartiesPayload();
    const rp = createEmptyRelatedPartyRelationshipRecord();
    rp.id = 'rp-1';
    payload.relatedPartyUniverseAndClassification.relatedPartyRelationships = [rp];

    const tx = createEmptyRptTransactionRecord();
    tx.relatedPartyRelationshipId = rp.id;
    tx.financialPeriod = 'FY2024';
    tx.transactionType = 'sale-of-goods-materials';
    tx.transactionValue = '100';
    payload.relatedPartyTransactionsBalancesAndCommitments.transactions = [tx];

    const summary = calculateRptSummary(payload, createEmptyLinkedWorkstreamReferences());
    expect(summary.rptSales).toBe('100');
    expect(summary.totalByFinancialYear['FY2024']).toBe('100');
  });

  it('derives progress, assessment and overview without throwing', () => {
    const payload = createEmptyGroupEntitiesRelatedPartiesPayload();
    const linked = createEmptyLinkedWorkstreamReferences();
    const progress = calculateGroupEntitiesProgress(payload);
    expect(progress.totalSections).toBe(8);
    expect(progress.overallStatus).toBe('not_started');

    const assessment = assessGroupEntities(payload, linked);
    expect(assessment.criteria.length).toBeGreaterThan(0);
    expect(assessment.result).toBeTruthy();

    const overview = buildGroupEntitiesOverviewSummary(payload, linked);
    expect(overview.entityCount).toBe(0);

    const model = computeGroupEntitiesModel(payload, linked);
    expect(model.rptTransactionCount).toBe(0);
  });
});
