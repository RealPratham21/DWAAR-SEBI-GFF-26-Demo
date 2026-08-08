import { apiRequest, getAccessToken } from '@/lib/api/client';
import { getApiBaseUrl } from '@/lib/api/config';

export type DrhpConnectionStatus = 'not_connected' | 'partially_connected' | 'connected';

export type DrhpGenerationStatus =
  | 'blocked'
  | 'ready_with_gaps'
  | 'ready_with_placeholders'
  | 'ready_to_generate'
  | 'depends_on_generated_chapters';

/** Navigator / workspace display status derived from readiness (no draft lifecycle yet). */
export type DrhpDisplayStatus =
  | 'not_connected'
  | 'blocked'
  | 'ready_with_gaps'
  | 'ready_with_placeholders'
  | 'ready_to_generate'
  | 'depends_on_generated'
  | 'not_generated';

export type DrhpWorkstreamLink = {
  slug: string;
  title: string;
  href: string;
  sectionId?: string | null;
};

export type DrhpRequirementReadiness = {
  key: string;
  label: string;
  classification: string;
  applicability: string;
  coverageStatus: string;
  blocksGeneration: boolean;
  placeholderAllowed: boolean;
  historical: boolean;
  selectedSourceType: string;
  selectedValue: unknown;
  informationPaths: string[];
  assertionIds: string[];
  issueIds: string[];
  generationPermitted: boolean;
  workstreamLink?: DrhpWorkstreamLink | null;
  notes: string;
};

export type DrhpChapterListItem = {
  key: string;
  title: string;
  order: number;
  supported: boolean;
  connectionStatus: DrhpConnectionStatus;
  generationStatus: DrhpGenerationStatus;
  canGenerate: boolean;
  requirementTotal: number;
  satisfiedCount: number;
  missingCount: number;
  unknownApplicabilityCount: number;
  blockingCount: number;
  gapCount: number;
  sourceHash: string;
  workstreamLinks: DrhpWorkstreamLink[];
};

export type DrhpChapterListResponse = {
  registryVersion: string;
  chapters: DrhpChapterListItem[];
};

export type DrhpChapterReadinessResponse = {
  chapterKey: string;
  title: string;
  supported: boolean;
  sourceAdapter: string;
  connectionStatus: DrhpConnectionStatus;
  generationStatus: DrhpGenerationStatus;
  canGenerate: boolean;
  registryVersion: string;
  sourceHash: string;
  requirementTotal: number;
  satisfiedCount: number;
  missingCount: number;
  unknownApplicabilityCount: number;
  blockingCount: number;
  gapCount: number;
  warningCount: number;
  satisfiedRequirements: DrhpRequirementReadiness[];
  missingRequirements: DrhpRequirementReadiness[];
  unknownApplicabilityRequirements: DrhpRequirementReadiness[];
  blockingRequirements: DrhpRequirementReadiness[];
  gapRequirements: DrhpRequirementReadiness[];
  requirements: DrhpRequirementReadiness[];
  warnings: string[];
  workstreamLinks: DrhpWorkstreamLink[];
  companyIncorporationWorkspaceId?: string | null;
};

const BASE = '/drhp';

export function fetchDrhpChapters(): Promise<DrhpChapterListResponse> {
  return apiRequest<DrhpChapterListResponse>(`${BASE}/chapters`);
}

export function fetchDrhpChapterReadiness(
  chapterKey: string,
): Promise<DrhpChapterReadinessResponse> {
  return apiRequest<DrhpChapterReadinessResponse>(
    `${BASE}/chapters/${encodeURIComponent(chapterKey)}/readiness`,
  );
}

export function mapDrhpDisplayStatus(item: {
  connectionStatus: DrhpConnectionStatus;
  generationStatus: DrhpGenerationStatus;
  supported: boolean;
}): DrhpDisplayStatus {
  if (!item.supported || item.connectionStatus === 'not_connected') {
    return 'not_connected';
  }
  if (item.generationStatus === 'blocked') {
    return 'blocked';
  }
  if (item.generationStatus === 'ready_to_generate') {
    return 'ready_to_generate';
  }
  if (item.generationStatus === 'ready_with_placeholders') {
    return 'ready_with_placeholders';
  }
  if (item.generationStatus === 'ready_with_gaps') {
    return 'ready_with_gaps';
  }
  if (item.generationStatus === 'depends_on_generated_chapters') {
    return 'depends_on_generated';
  }
  return 'not_generated';
}

export function createGenerationSnapshot(): Promise<GenerationSnapshotSummary> {
  return apiRequest<GenerationSnapshotSummary>(`${BASE}/generation-snapshots`, {
    method: 'POST',
  });
}

export function fetchGenerationSnapshot(snapshotId: string): Promise<GenerationSnapshotDetail> {
  return apiRequest<GenerationSnapshotDetail>(`${BASE}/generation-snapshots/${snapshotId}`);
}

export function fetchChapterSourceBundle(
  snapshotId: string,
  chapterKey: string,
): Promise<ChapterSourceBundle> {
  return apiRequest<ChapterSourceBundle>(
    `${BASE}/generation-snapshots/${snapshotId}/chapter-sources/${encodeURIComponent(chapterKey)}`,
  );
}

export type GenerationSnapshotSummary = {
  id: string;
  snapshotVersion: number;
  registryVersion: string;
  snapshotSchemaVersion: string;
  aggregateSourceHash: string;
  readinessSummary: Record<string, unknown>;
  createdAt: string;
  created: boolean;
};

export type GenerationSnapshotDetail = GenerationSnapshotSummary & {
  sourceWorkstreamVersions: Record<string, unknown>;
  canonicalContext: Record<string, unknown>;
  sourceRegistry: Record<string, unknown>;
};

export type ChapterSourceBundle = {
  snapshotId: string;
  chapterKey: string;
  chapterTitle: string;
  globalContext: Record<string, unknown>;
  sourceRefs: Array<Record<string, unknown>>;
  readiness: Record<string, unknown>;
  conflicts: Array<Record<string, unknown>>;
};

export type GenerateDrhpRequest = {
  snapshotId?: string;
  createSnapshot?: boolean;
};

export type GenerateDrhpResponse = {
  documentId: string;
  documentVersionId: string;
  versionNumber: number;
  snapshotId: string;
  status: string;
  totalChapters: number;
};

export type ChapterGenerationStatusItem = {
  chapterKey: string;
  title: string;
  status: string;
  generationMode?: string;
  warnings?: string[];
  errorMessage?: string | null;
};

export type DocumentGenerationStatus = {
  documentId: string;
  documentVersionId: string;
  versionNumber: number;
  snapshotId: string;
  status: string;
  generationStartedAt?: string | null;
  completedAt?: string | null;
  totalChapters: number;
  completedChapters: number;
  warningChapters: number;
  failedChapters: number;
  blockedChapters: number;
  chapters: ChapterGenerationStatusItem[];
  isStale?: boolean;
  staleWorkstreamCount?: number;
};

export type GeneratedChapterResponse = {
  chapterKey: string;
  title: string;
  status: string;
  ast: Record<string, unknown> | null;
  sourceRefsSummary: Array<Record<string, unknown>>;
  evidenceRefsSummary: Array<Record<string, unknown>>;
  generationWarnings: string[];
  validationWarnings: string[];
  model: string;
  promptVersion: string;
};

export type DrhpDocumentSummary = {
  documentId: string;
  latestVersionId?: string | null;
  latestVersionNumber?: number | null;
  latestStatus?: string | null;
  snapshotId?: string | null;
  createdAt?: string | null;
};

export function startDrhpGeneration(body: GenerateDrhpRequest = {}): Promise<GenerateDrhpResponse> {
  return apiRequest<GenerateDrhpResponse>(`${BASE}/generate`, {
    method: 'POST',
    body,
  });
}

export function fetchLatestDrhpDocument(): Promise<DrhpDocumentSummary | null> {
  return apiRequest<DrhpDocumentSummary | null>(`${BASE}/documents/latest`);
}

export function fetchDocumentGenerationStatus(
  documentVersionId: string,
): Promise<DocumentGenerationStatus> {
  return apiRequest<DocumentGenerationStatus>(`${BASE}/documents/${documentVersionId}/status`);
}

export function fetchGeneratedChapter(
  documentVersionId: string,
  chapterKey: string,
): Promise<GeneratedChapterResponse> {
  return apiRequest<GeneratedChapterResponse>(
    `${BASE}/documents/${documentVersionId}/chapters/${encodeURIComponent(chapterKey)}`,
  );
}

function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null;
  const utfMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }
  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? null;
}

export async function downloadDrhpExport(
  documentVersionId: string,
  format: 'pdf' | 'docx',
): Promise<void> {
  const url = `${getApiBaseUrl()}${BASE}/documents/${documentVersionId}/export/${format}`;
  const headers = new Headers();
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    let message = 'Unable to export DRHP draft.';
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const filename =
    parseContentDispositionFilename(response.headers.get('Content-Disposition')) ??
    `DRHP_Draft.${format}`;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
