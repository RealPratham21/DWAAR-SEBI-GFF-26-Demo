/**
 * Frontend contracts for future DRHP draft generation.
 * These types describe the intended document model — no mock production payloads.
 */

export type DrhpChapterStatus =
  | 'not_generated'
  | 'generating'
  | 'draft_ready'
  | 'needs_review'
  | 'blocked'
  | 'not_connected'
  | 'ready_with_gaps'
  | 'ready_to_generate';

export type DrhpBlockStatus =
  | 'empty'
  | 'draft'
  | 'needs_confirmation'
  | 'matched'
  | 'review_required'
  | 'source_available';

export type DrhpBlockKind =
  | 'paragraph'
  | 'table'
  | 'list'
  | 'notice'
  | 'missing_information';

export interface DrhpEvidenceReference {
  id: string;
  label: string;
  documentVersionId?: string;
  assertionId?: string;
  factKey?: string;
}

export interface DrhpGapReference {
  id: string;
  label: string;
  issueId?: string;
  severity?: 'info' | 'warning' | 'blocking';
}

export interface DrhpMissingInformationMarker {
  id: string;
  message: string;
  fieldKey?: string;
}

export interface DrhpParagraphContent {
  kind: 'paragraph';
  text: string;
}

export interface DrhpTableContent {
  kind: 'table';
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface DrhpListContent {
  kind: 'list';
  ordered?: boolean;
  items: string[];
}

export interface DrhpNoticeContent {
  kind: 'notice';
  tone: 'info' | 'warning' | 'caution';
  text: string;
}

export interface DrhpMissingInformationContent {
  kind: 'missing_information';
  marker: DrhpMissingInformationMarker;
}

export type DrhpBlockContent =
  | DrhpParagraphContent
  | DrhpTableContent
  | DrhpListContent
  | DrhpNoticeContent
  | DrhpMissingInformationContent;

export interface DrhpBlock {
  id: string;
  kind: DrhpBlockKind;
  status: DrhpBlockStatus;
  order: number;
  content: DrhpBlockContent;
  evidenceRefs: DrhpEvidenceReference[];
  gapRefs: DrhpGapReference[];
}

export interface DrhpSection {
  id: string;
  title: string;
  order: number;
  blocks: DrhpBlock[];
}

export interface DrhpChapter {
  id: string;
  key: string;
  title: string;
  order: number;
  status: DrhpChapterStatus;
  sections: DrhpSection[];
  /** Existing workstream slug when this chapter maps to one. */
  workstreamSlug?: string;
  workstreamTitle?: string;
  /** Latest readiness fields from the DRHP API (G1). */
  connectionStatus?: 'not_connected' | 'partially_connected' | 'connected';
  generationStatus?: 'blocked' | 'ready_with_gaps' | 'ready_to_generate';
  canGenerate?: boolean;
  readinessSummary?: {
    satisfiedCount: number;
    missingCount: number;
    unknownApplicabilityCount: number;
    blockingCount: number;
    gapCount: number;
    requirementTotal: number;
  };
}

export interface DrhpDraft {
  id: string;
  title: string;
  schemaVersion: number;
  chapters: DrhpChapter[];
  updatedAt: string | null;
}

export type DrhpInspectorTab = 'evidence' | 'copilot';

export interface DrhpChapterDefinition {
  key: string;
  title: string;
  order: number;
  workstreamSlug?: string;
  workstreamTitle?: string;
}
