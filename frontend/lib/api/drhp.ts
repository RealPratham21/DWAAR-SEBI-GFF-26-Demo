import { apiRequest } from '@/lib/api/client';

export type DrhpConnectionStatus = 'not_connected' | 'partially_connected' | 'connected';

export type DrhpGenerationStatus = 'blocked' | 'ready_with_gaps' | 'ready_to_generate';

/** Navigator / workspace display status derived from readiness (no draft lifecycle yet). */
export type DrhpDisplayStatus =
  | 'not_connected'
  | 'blocked'
  | 'ready_with_gaps'
  | 'ready_to_generate'
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
  if (item.generationStatus === 'ready_with_gaps') {
    return 'ready_with_gaps';
  }
  return 'not_generated';
}
