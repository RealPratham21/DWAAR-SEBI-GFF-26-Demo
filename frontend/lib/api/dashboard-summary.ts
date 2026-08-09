import { apiRequest } from '@/lib/api/client';

export type DashboardSummary = {
  issuerContext: {
    issuerName: string;
    companyClass: string;
    targetExchange: string;
    issueType: string;
    targetTimeline: string;
    preparationStage: string;
  };
  workstreams: {
    total: number;
    complete: number;
    inProgress: number;
    notStarted: number;
    totalSections: number;
    completedSections: number;
    items: Array<{
      key: string;
      label: string;
      order: number;
      completedSections: number;
      totalSections: number;
      progressState: string;
      progressStateLabel: string;
      openIssues: number;
      documentProvided: number;
      documentExpected: number;
      primaryReviewState: string;
      href: string;
    }>;
  };
  issues: {
    open: number;
    blocking: number;
    high: number;
    medium: number;
    low: number;
    professionalReview: number;
    topIssues: Array<{
      issueId: string;
      title: string;
      severity: string;
      severityLabel: string;
      workstreamKey: string;
      workstreamLabel: string;
      reason: string;
      href: string;
    }>;
  };
  factsEvidence: {
    canonicalFacts: number;
    documentBackedFacts: number;
    structuredInputFacts: number;
    calculatedFacts: number;
    professionalConfirmationFacts: number;
    factsUsedInLatestDrhp: number;
    evidenceDocuments: number;
    evidenceItems: number;
  };
  dataRoom: {
    uploadedDocuments: number;
    expectedApplicable: number;
    providedRequirements: number;
    missingRequirements: number;
    reviewApplicability: number;
    processedDocuments: number;
    storedOnlyDocuments: number;
  };
  drhp: {
    exists: boolean;
    versionId: string | null;
    versionNumber: number | null;
    status: string | null;
    statusLabel: string;
    generatedAt: string | null;
    chapterTotal: number;
    generated: number;
    generatedWithWarnings: number;
    blocked: number;
    failed: number;
    stale: boolean;
    affectedChapterCount: number;
    exportAvailable: boolean;
    openUrl: string;
  };
  nextActions: Array<{
    id: string;
    priority: number;
    title: string;
    description: string;
    sourceType: string;
    workstreamKey: string | null;
    issueId: string | null;
    actionLabel: string;
    href: string;
  }>;
  generatedAt: string;
  warnings: string[];
};

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard/summary', { method: 'GET' });
}
