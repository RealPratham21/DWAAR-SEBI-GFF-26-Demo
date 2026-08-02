import { apiRequest } from '@/lib/api/client';
import type {
  FactIssueDetail,
  FactIssuesListResponse,
  ResolveIssueRequest,
  ResolveIssueResponse,
} from '@/lib/company-incorporation/extraction/types';

const BASE = '/workstreams/company-incorporation/structured-extraction';

export interface IssuesQuery {
  factKey?: string;
  issueType?: string;
  status?: string;
  severity?: string;
  blocking?: boolean;
}

function toQuery(params: IssuesQuery): string {
  const search = new URLSearchParams();
  if (params.factKey) search.set('factKey', params.factKey);
  if (params.issueType) search.set('issueType', params.issueType);
  if (params.status) search.set('status', params.status);
  if (params.severity) search.set('severity', params.severity);
  if (params.blocking !== undefined) search.set('blocking', String(params.blocking));
  const value = search.toString();
  return value ? `?${value}` : '';
}

export async function fetchCompanyIncorporationIssues(
  query: IssuesQuery = {},
): Promise<FactIssuesListResponse> {
  return apiRequest<FactIssuesListResponse>(`${BASE}/issues${toQuery(query)}`, {
    method: 'GET',
  });
}

export async function fetchFactIssueDetail(issueId: string): Promise<FactIssueDetail> {
  return apiRequest<FactIssueDetail>(`${BASE}/issues/${issueId}`, { method: 'GET' });
}

export async function resolveFactIssue(
  issueId: string,
  body: ResolveIssueRequest,
): Promise<ResolveIssueResponse> {
  return apiRequest<ResolveIssueResponse>(`${BASE}/issues/${issueId}/resolve`, {
    method: 'POST',
    body,
  });
}
