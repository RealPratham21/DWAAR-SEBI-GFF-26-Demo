import { apiRequest } from '@/lib/api/client';
import type {
  InitializeLitigationApprovalsComplianceWorkspaceResponse,
  LacAssessmentResponse,
  LitigationApprovalsComplianceOverviewSummaryResponse,
  LitigationApprovalsComplianceSectionSaveResponse,
  LitigationApprovalsComplianceWorkspaceResponse,
} from '@/lib/litigation-approvals-compliance/api-types';
import type {
  LitigationApprovalsCompliancePayload,
  LitigationApprovalsComplianceSectionId,
} from '@/lib/schemas/litigation-approvals-compliance';

const BASE = '/workstreams/litigation-approvals-compliance';

export async function initializeLitigationApprovalsComplianceWorkspace(): Promise<InitializeLitigationApprovalsComplianceWorkspaceResponse> {
  return apiRequest<InitializeLitigationApprovalsComplianceWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'POST',
  });
}

export async function fetchLitigationApprovalsComplianceWorkspace(): Promise<LitigationApprovalsComplianceWorkspaceResponse> {
  return apiRequest<LitigationApprovalsComplianceWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'GET',
  });
}

export async function saveLitigationApprovalsComplianceSection(
  sectionId: LitigationApprovalsComplianceSectionId,
  version: number,
  data: LitigationApprovalsCompliancePayload[keyof Omit<
    LitigationApprovalsCompliancePayload,
    'schemaVersion'
  >],
): Promise<LitigationApprovalsComplianceSectionSaveResponse> {
  return apiRequest<LitigationApprovalsComplianceSectionSaveResponse>(`${BASE}/sections/${sectionId}`, {
    method: 'PATCH',
    body: { version, data },
  });
}

export async function fetchLitigationApprovalsComplianceOverviewSummary(): Promise<LitigationApprovalsComplianceOverviewSummaryResponse> {
  return apiRequest<LitigationApprovalsComplianceOverviewSummaryResponse>(`${BASE}/overview-summary`, {
    method: 'GET',
  });
}

export async function fetchLitigationApprovalsComplianceAssessment(): Promise<LacAssessmentResponse> {
  return apiRequest<LacAssessmentResponse>(`${BASE}/legal-compliance-assessment`, {
    method: 'GET',
  });
}
