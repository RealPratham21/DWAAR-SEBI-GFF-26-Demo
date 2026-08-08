import { apiRequest } from '@/lib/api/client';

export type IssueSeverity = 'blocking' | 'high' | 'medium' | 'low';
export type IssueLifecycleState = 'open' | 'acknowledged' | 'cleared';

export type GlobalIssue = {
  id: string;
  fingerprint: string;
  title: string;
  description: string;
  category: string;
  severity: IssueSeverity;
  lifecycleState: IssueLifecycleState;
  sourceKind: string;
  sourceKinds: string[];
  workstreamKey: string;
  workstreamLabel: string;
  sectionKey: string;
  sectionLabel: string;
  recordId: string;
  recordLabel: string;
  sourceRefs: Array<{
    refId?: string | null;
    workstreamKey?: string | null;
    sectionKey?: string | null;
    fieldPath?: string | null;
    fieldLabel?: string | null;
    valuePreview?: string | null;
  }>;
  evidenceRefs: Array<{
    documentId?: string | null;
    documentVersionId?: string | null;
    originalFilename?: string | null;
    pageNumbers: number[];
    requirementKey?: string | null;
    requirementLabel?: string | null;
  }>;
  whyItMatters: string;
  suggestedAction: string;
  affectedDrhpChapters: string[];
  affectedDrhpChapterLabels: string[];
  openSourceUrl: string;
  openDrhpUrl?: string | null;
  detectedAt?: string | null;
  lastSeenAt?: string | null;
  professionalReviewRequired: boolean;
  acknowledged: boolean;
  acknowledgementNote?: string | null;
  acknowledgedAt?: string | null;
  metadata: Record<string, unknown>;
};

export type GlobalIssueListResponse = {
  total: number;
  issues: GlobalIssue[];
};

export type GlobalIssueSummary = {
  totalOpen: number;
  blocking: number;
  high: number;
  medium: number;
  low: number;
  professionalReview: number;
  evidenceGaps: number;
  inconsistencies: number;
  drhpRelated: number;
  acknowledged: number;
  byWorkstream: Record<string, number>;
  byCategory: Record<string, number>;
};

export type IssuesGapsQuery = {
  severity?: IssueSeverity;
  category?: string;
  workstream?: string;
  lifecycleState?: IssueLifecycleState;
  search?: string;
  drhpChapter?: string;
};

function toQuery(params: IssuesGapsQuery): string {
  const search = new URLSearchParams();
  if (params.severity) search.set('severity', params.severity);
  if (params.category) search.set('category', params.category);
  if (params.workstream) search.set('workstream', params.workstream);
  if (params.lifecycleState) search.set('lifecycleState', params.lifecycleState);
  if (params.search) search.set('search', params.search);
  if (params.drhpChapter) search.set('drhpChapter', params.drhpChapter);
  const value = search.toString();
  return value ? `?${value}` : '';
}

export async function fetchIssuesGaps(query: IssuesGapsQuery = {}): Promise<GlobalIssueListResponse> {
  return apiRequest<GlobalIssueListResponse>(`/issues-gaps${toQuery(query)}`, { method: 'GET' });
}

export async function fetchIssuesGapsSummary(): Promise<GlobalIssueSummary> {
  return apiRequest<GlobalIssueSummary>('/issues-gaps/summary', { method: 'GET' });
}

export async function fetchIssueGap(issueId: string): Promise<GlobalIssue> {
  return apiRequest<GlobalIssue>(`/issues-gaps/${issueId}`, { method: 'GET' });
}

export async function patchIssueAcknowledgement(
  issueId: string,
  body: { acknowledged: boolean; note?: string | null },
): Promise<{ issueId: string; fingerprint: string; acknowledged: boolean; note?: string | null }> {
  return apiRequest(`/issues-gaps/${issueId}/acknowledgement`, {
    method: 'PATCH',
    body,
  });
}
