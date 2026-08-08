import { apiRequest } from '@/lib/api/client';

export type GlobalFact = {
  factId: string;
  fingerprint: string;
  label: string;
  displayValue: string;
  semanticType: string;
  canonicalWorkstreamKey: string;
  canonicalWorkstreamLabel: string;
  sectionKey: string;
  sectionLabel: string;
  recordId: string;
  recordLabel: string;
  supportType: string;
  supportState: string;
  supportTypeLabel: string;
  supportStateLabel: string;
  drhpUsageCount: number;
  relatedIssueCount: number;
  openSourceUrl: string;
  reportingPeriod: string;
  professionalConfirmationRequired: boolean;
  evidenceRefs: Array<{
    documentId?: string | null;
    documentVersionId?: string | null;
    originalFilename?: string | null;
    pageNumber?: number | null;
    quoteSnapshot?: string;
  }>;
  calculatedFrom: Array<{ fieldLabel: string; valuePreview: unknown }>;
  calculationExpression: string;
  drhpUsage: Array<{
    documentVersionNumber: number;
    chapterKey: string;
    chapterLabel: string;
    sectionHeading: string;
    blockId: string;
    draftValuePreview: unknown;
    openUrl: string;
  }>;
  relatedIssues: Array<{
    issueId: string;
    title: string;
    severity: string;
    openUrl: string;
  }>;
  conflictingSource?: {
    workstreamKey: string;
    value: unknown;
    label?: string;
  } | null;
  metadata: Record<string, unknown>;
};

export type GlobalFactListResponse = {
  total: number;
  page: number;
  pageSize: number;
  facts: GlobalFact[];
};

export type GlobalFactSummary = {
  canonicalFacts: number;
  documentBacked: number;
  structuredInput: number;
  calculated: number;
  professionalConfirmation: number;
  usedInDrhp: number;
  withIssues: number;
};

export type GlobalEvidence = {
  evidenceId: string;
  documentId: string;
  documentVersionId: string;
  documentName: string;
  documentCategory: string;
  versionNumber: number | null;
  pageNumber: number | null;
  extractedTextPreview: string;
  assertionLabel: string;
  supportedFactLabels: string[];
  processingState: string;
  openDocumentUrl: string;
};

export type GlobalEvidenceListResponse = {
  total: number;
  evidence: GlobalEvidence[];
};

export type GlobalEvidenceSummary = {
  documents: number;
  documentVersions: number;
  evidenceItems: number;
  evidenceBackedFacts: number;
};

export type FactsQuery = {
  search?: string;
  workstream?: string;
  supportType?: string;
  usedInDrhp?: boolean;
  hasIssue?: boolean;
  page?: number;
  pageSize?: number;
};

function toQuery(params: FactsQuery): string {
  const search = new URLSearchParams();
  if (params.search) search.set('search', params.search);
  if (params.workstream) search.set('workstream', params.workstream);
  if (params.supportType) search.set('supportType', params.supportType);
  if (params.usedInDrhp !== undefined) search.set('usedInDrhp', String(params.usedInDrhp));
  if (params.hasIssue !== undefined) search.set('hasIssue', String(params.hasIssue));
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  const value = search.toString();
  return value ? `?${value}` : '';
}

export async function fetchGlobalFacts(query: FactsQuery = {}): Promise<GlobalFactListResponse> {
  return apiRequest<GlobalFactListResponse>(`/facts-evidence/facts${toQuery(query)}`);
}

export async function fetchGlobalFactsSummary(): Promise<GlobalFactSummary> {
  return apiRequest<GlobalFactSummary>('/facts-evidence/facts/summary');
}

export async function fetchGlobalFact(factId: string): Promise<GlobalFact> {
  return apiRequest<GlobalFact>(`/facts-evidence/facts/${factId}`);
}

export async function fetchGlobalEvidence(page = 1): Promise<GlobalEvidenceListResponse> {
  return apiRequest<GlobalEvidenceListResponse>(`/facts-evidence/evidence?page=${page}`);
}

export async function fetchGlobalEvidenceSummary(): Promise<GlobalEvidenceSummary> {
  return apiRequest<GlobalEvidenceSummary>('/facts-evidence/evidence/summary');
}

export async function fetchGlobalEvidenceItem(evidenceId: string): Promise<GlobalEvidence> {
  return apiRequest<GlobalEvidence>(`/facts-evidence/evidence/${evidenceId}`);
}
