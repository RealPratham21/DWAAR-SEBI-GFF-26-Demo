/**
 * Entity Master helpers — single canonical entity namespace.
 */

import type { EntityRecord, GroupEntitiesRelatedPartiesPayload } from '@/lib/schemas/group-entities-related-parties';

export function getEntities(payload: GroupEntitiesRelatedPartiesPayload): EntityRecord[] {
  return payload.groupStructureAndEntityMaster.entities;
}

export function getEntityById(
  payload: GroupEntitiesRelatedPartiesPayload,
  entityId: string,
): EntityRecord | undefined {
  if (!entityId) return undefined;
  return getEntities(payload).find((entity) => entity.id === entityId);
}

export function formatEntityLabel(entity: EntityRecord | undefined, fallbackId = ''): string {
  if (!entity) return fallbackId ? `Unknown entity (${fallbackId.slice(0, 8)})` : 'Unknown entity';
  const name =
    entity.identity.displayName.trim() ||
    entity.identity.legalName.trim() ||
    entity.identity.formerName.trim();
  return name || entity.id.slice(0, 8);
}

export function countEntitiesByBadge(
  payload: GroupEntitiesRelatedPartiesPayload,
  badge: EntityRecord['classificationBadges'][number],
): number {
  return getEntities(payload).filter(
    (entity) => entity.currentlyActive && entity.classificationBadges.includes(badge),
  ).length;
}

export function countActiveEntities(payload: GroupEntitiesRelatedPartiesPayload): number {
  return getEntities(payload).filter((entity) => entity.currentlyActive).length;
}

export function isCompanyEntityType(entityType: EntityRecord['entityType']): boolean {
  return entityType === 'indian-company' || entityType === 'foreign-body-corporate';
}

export function isLlpEntityType(entityType: EntityRecord['entityType']): boolean {
  return entityType === 'llp';
}

export function isListedEntity(entity: EntityRecord): boolean {
  return entity.listing.listedStatus === 'listed';
}
