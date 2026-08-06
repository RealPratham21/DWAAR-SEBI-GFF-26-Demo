/**
 * Objects of the Issue — public frontend barrel (Increment O1, frontend-only).
 *
 * `ObjectsOfIssuePayload` (`schemaVersion: 1`) is the canonical contract a future backend
 * increment will persist unchanged. Derived progress / compute / assessment helpers are used
 * for live draft UX; there is no backend, API or localStorage persistence in this increment.
 */

export {
  OBJECTS_OF_ISSUE_SCHEMA_VERSION,
  OBJECTS_OF_ISSUE_SECTION_IDS,
  objectsOfIssuePayloadSchema,
  sectionIdSchema,
} from '@/lib/schemas/objects-of-issue';

export * from '@/lib/objects-of-issue/types';
export * from '@/lib/objects-of-issue/defaults';
export * from '@/lib/objects-of-issue/options';
export * from '@/lib/objects-of-issue/format';
export * from '@/lib/objects-of-issue/gcp';
export * from '@/lib/objects-of-issue/progress';
export * from '@/lib/objects-of-issue/assessment';

export {
  computeObjectsOfIssueModel,
} from '@/lib/objects-of-issue/compute';

export type {
  ObjectsOfIssueCounts,
  ObjectsOfIssueModel,
  ReconciliationCheck,
  ReconciliationStatus,
} from '@/lib/objects-of-issue/compute';

export * from '@/lib/objects-of-issue/overview';

export * as decimal from '@/lib/objects-of-issue/decimal';
