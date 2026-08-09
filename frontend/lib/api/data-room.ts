import { apiRequest } from '@/lib/api/client';

export type DataRoomSummary = {
  totalDocuments: number;
  currentVersions: number;
  documentBackedDocuments: number;
  storedOnlyDocuments: number;
  applicableRequirements: number;
  providedRequirements: number;
  missingRequirements: number;
  reviewApplicabilityRequirements: number;
  documentsUsedInDrhp: number;
  documentsWithIssues: number;
};

export type DataRoomDocumentVersion = {
  versionNumber: number;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  status: string;
  uploadedAt: string | null;
  isCurrent: boolean;
  note: string;
};

export type DataRoomDocument = {
  globalDocumentId: string;
  originType: string;
  title: string;
  filename: string;
  category: string;
  mimeType: string;
  fileSize: number;
  workstreamKey: string;
  workstreamLabel: string;
  sectionKey: string;
  sectionLabel: string;
  requirementKey: string | null;
  currentVersion: number;
  status: string;
  statusLabel: string;
  processingCapability: string;
  processingCapabilityLabel: string;
  uploadedAt: string | null;
  updatedAt: string | null;
  factCount: number;
  evidenceCount: number;
  issueCount: number;
  drhpUsageCount: number;
  openUrl: string;
  openWorkstreamUrl: string;
  openFactsUrl: string;
  versions: DataRoomDocumentVersion[];
  relatedIssues: Array<{
    issueId: string;
    title: string;
    severity: string;
    openUrl: string;
  }>;
  drhpUsage: Array<{
    chapterKey: string;
    chapterLabel: string;
    sectionHeading: string;
    blockId: string;
    openUrl: string;
  }>;
  inspection: { status: string; label: string } | null;
  metadata: Record<string, unknown>;
};

export type DataRoomDocumentListResponse = {
  total: number;
  page: number;
  pageSize: number;
  documents: DataRoomDocument[];
};

export type DataRoomRequirement = {
  requirementKey: string;
  workstreamKey: string;
  workstreamLabel: string;
  category: string;
  title: string;
  purpose: string;
  expectedStage: string;
  applicability: string;
  status: string;
  statusLabel: string;
  matchedDocumentIds: string[];
  linkedIssueIds: string[];
  professionalConfirmationRequired: boolean;
  evidencePipelineCapability: string;
  openWorkstreamUrl: string;
  openUpload: boolean;
};

export type DataRoomRequirementListResponse = {
  total: number;
  requirements: DataRoomRequirement[];
};

const BASE = '/data-room';

export async function fetchDataRoomSummary(): Promise<DataRoomSummary> {
  return apiRequest<DataRoomSummary>(`${BASE}/summary`, { method: 'GET' });
}

export async function fetchDataRoomDocuments(params?: {
  search?: string;
  workstream?: string;
  status?: string;
  capability?: string;
  usedInDrhp?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<DataRoomDocumentListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.workstream) query.set('workstream', params.workstream);
  if (params?.status) query.set('status', params.status);
  if (params?.capability) query.set('capability', params.capability);
  if (params?.usedInDrhp != null) query.set('usedInDrhp', String(params.usedInDrhp));
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<DataRoomDocumentListResponse>(`${BASE}/documents${suffix}`, { method: 'GET' });
}

export async function fetchDataRoomDocument(globalDocumentId: string): Promise<DataRoomDocument> {
  return apiRequest<DataRoomDocument>(`${BASE}/documents/${encodeURIComponent(globalDocumentId)}`, {
    method: 'GET',
  });
}

export async function fetchDataRoomRequirements(params?: {
  search?: string;
  workstream?: string;
  status?: string;
}): Promise<DataRoomRequirementListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.workstream) query.set('workstream', params.workstream);
  if (params?.status) query.set('status', params.status);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<DataRoomRequirementListResponse>(`${BASE}/requirements${suffix}`, { method: 'GET' });
}

export async function initiateDataRoomUpload(body: {
  workstreamKey: string;
  requirementKey?: string;
  title: string;
  category?: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  note?: string;
}): Promise<{
  globalDocumentId: string;
  documentId: string;
  versionId: string;
  uploadUrl: string;
  storageKey: string;
}> {
  return apiRequest(`${BASE}/documents`, { method: 'POST', body });
}

export async function initiateDataRoomVersionUpload(
  globalDocumentId: string,
  body: {
    filename: string;
    contentType: string;
    sizeBytes: number;
    checksumSha256: string;
    note?: string;
  },
): Promise<{
  globalDocumentId: string;
  documentId: string;
  versionId: string;
  uploadUrl: string;
  storageKey: string;
}> {
  return apiRequest(`${BASE}/documents/${encodeURIComponent(globalDocumentId)}/versions`, {
    method: 'POST',
    body,
  });
}

export async function finalizeDataRoomUpload(versionId: string): Promise<{
  globalDocumentId: string;
  status: string;
  currentVersion: number;
}> {
  return apiRequest(`${BASE}/documents/versions/${versionId}/finalize`, { method: 'POST' });
}

export async function fetchDataRoomDownloadUrl(globalDocumentId: string): Promise<{
  downloadUrl: string;
  expiresInSeconds: number;
}> {
  return apiRequest(`${BASE}/documents/${encodeURIComponent(globalDocumentId)}/download`, {
    method: 'GET',
  });
}

export function uploadFileToPresignedUrl(
  file: File,
  uploadUrl: string,
  headers: Record<string, string>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}.`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.send(file);
  });
}

export const WORKSTREAM_ORDER = [
  'company-incorporation',
  'ipo-setup-eligibility',
  'capital-ownership',
  'business-operations',
  'objects-of-issue',
  'financials-kpis',
  'management-governance',
  'industry-market',
  'group-entities-related-parties',
  'borrowings-assets-contracts',
  'litigation-approvals-compliance',
  'intermediaries-filing',
] as const;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
