import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@/lib/api/errors';

vi.mock('@/lib/api/client', () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from '@/lib/api/client';
import {
  fetchCompanyIncorporationFacts,
  reviewFactAssertion,
  retryStructuredExtraction,
} from '@/lib/api/company-incorporation-facts-api';
import {
  fetchCompanyIncorporationIssues,
  resolveFactIssue,
} from '@/lib/api/company-incorporation-issues-api';
import { fetchDocumentPipelineSummary } from '@/lib/api/company-incorporation-pipeline-api';
import { fetchCompanyIncorporationOverviewSummary } from '@/lib/api/company-incorporation-overview-api';
import {
  comparisonStatusLabel,
  documentOverallStatusLabel,
  pageProcessingStageLabel,
  structuredExtractionStageLabel,
} from '@/lib/company-incorporation/extraction/labels';
import type { DocumentPipelineSummaryItem } from '@/lib/company-incorporation/extraction/types';

const mockedApiRequest = vi.mocked(apiRequest);

describe('company incorporation API clients', () => {
  beforeEach(() => {
    mockedApiRequest.mockReset();
  });

  it('parses camelCase pipeline summary responses', async () => {
    mockedApiRequest.mockResolvedValueOnce({
      documents: [],
      aggregation: {
        hasAnyActivePipeline: false,
        hasActivePageProcessing: false,
        hasActiveStructuredExtraction: false,
        totalCurrentDocuments: 0,
        documentsAwaitingProcessing: 0,
        documentsProcessing: 0,
        documentsExtractingFacts: 0,
        documentsReadyForReview: 0,
        documentsWithFailures: 0,
        lastUpdatedAt: '2026-08-01T00:00:00Z',
      },
    });
    const response = await fetchDocumentPipelineSummary();
    expect(response.aggregation.hasAnyActivePipeline).toBe(false);
    expect(mockedApiRequest).toHaveBeenCalledWith(
      '/workstreams/company-incorporation/documents/pipeline-summary',
      { method: 'GET' },
    );
  });

  it('handles nullable facts fields', async () => {
    mockedApiRequest.mockResolvedValueOnce({
      totalFactKeys: 1,
      totalAssertions: 1,
      groups: [
        {
          factKey: 'legalIdentity.cin',
          displayLabel: 'CIN',
          informationValue: null,
          assertions: [
            {
              id: 'a1',
              factKey: 'legalIdentity.cin',
              requirementKey: 'certificate_of_incorporation',
              documentVersionId: 'v1',
              structuredExtractionRunId: 'r1',
              displayValue: 'U12345PN2020PTC123456',
              comparisonStatus: 'no_information',
              reviewStatus: 'pending',
              qualityCategory: 'high',
              qualityScore: null,
              extractorKind: 'deterministic',
              validationStatus: 'valid',
              sourceTemporality: 'current',
            },
          ],
        },
      ],
    });
    const response = await fetchCompanyIncorporationFacts();
    expect(response.groups[0]?.informationValue).toBeNull();
    expect(response.groups[0]?.assertions[0]?.qualityScore).toBeNull();
  });

  it('surfaces API errors', async () => {
    mockedApiRequest.mockRejectedValueOnce(
      new ApiClientError(401, 'unauthorized', 'Unauthorized'),
    );
    await expect(fetchCompanyIncorporationIssues()).rejects.toBeInstanceOf(ApiClientError);
  });

  it('posts review and resolution requests', async () => {
    mockedApiRequest.mockResolvedValueOnce({
      assertionId: 'a1',
      reviewStatus: 'approved',
      action: 'approve',
      reviewId: 'rev1',
      createdAt: '2026-08-01T00:00:00Z',
    });
    await reviewFactAssertion('a1', { action: 'approve', rationale: null });
    expect(mockedApiRequest).toHaveBeenCalledWith(
      '/workstreams/company-incorporation/structured-extraction/assertions/a1/review',
      { method: 'POST', body: { action: 'approve', rationale: null } },
    );

    mockedApiRequest.mockResolvedValueOnce({
      issueId: 'i1',
      status: 'resolved',
      decision: 'mark_document_historical',
      resolutionId: 'res1',
      informationUpdateRequired: false,
    });
    await resolveFactIssue('i1', {
      decision: 'mark_document_historical',
      rationale: 'Former office address',
      selectedAssertionId: 'a2',
    });
    expect(mockedApiRequest).toHaveBeenLastCalledWith(
      '/workstreams/company-incorporation/structured-extraction/issues/i1/resolve',
      {
        method: 'POST',
        body: {
          decision: 'mark_document_historical',
          rationale: 'Former office address',
          selectedAssertionId: 'a2',
        },
      },
    );
  });

  it('posts retry requests', async () => {
    mockedApiRequest.mockResolvedValueOnce({
      documentVersionId: 'v1',
      documentProcessingRunId: 'p1',
      structuredExtractionRunId: 's1',
      status: 'queued',
      extractorVersion: '1.2.0',
      factSchemaVersion: '1.1.0',
      promptVersion: '1.1.0',
    });
    await retryStructuredExtraction('v1');
    expect(mockedApiRequest).toHaveBeenCalledWith(
      '/workstreams/company-incorporation/structured-extraction/versions/v1/retry',
      { method: 'POST' },
    );
  });

  it('loads overview summary', async () => {
    mockedApiRequest.mockResolvedValueOnce({
      information: { completedSections: 2, totalSections: 6, status: 'in_progress', sections: [] },
      documents: {
        mandatoryRequired: 5,
        mandatoryUploaded: 5,
        mandatoryProcessed: 5,
        mandatoryFailed: 0,
        activeProcessingCount: 0,
        structuredExtractionActiveCount: 0,
        documentsWithWarnings: 1,
        status: 'review_required',
      },
      facts: {
        factGroupCount: 10,
        assertionCount: 20,
        approvedAssertionCount: 1,
        pendingReviewCount: 19,
        rejectedCount: 0,
        historicalCount: 1,
        lowQualityCount: 1,
        invalidAssertionCount: 0,
        factsWithMultipleSources: 3,
        status: 'review_required',
      },
      conflicts: {
        openIssueCount: 1,
        blockingIssueCount: 0,
        warningIssueCount: 1,
        awaitingClarificationCount: 0,
        escalatedCount: 0,
        resolvedIssueCount: 1,
        status: 'clear',
      },
      disclosures: { status: 'not_assessed' },
      professionalReview: { status: 'not_assessed' },
      overallStatus: 'review_required',
      readyForDisclosureGeneration: false,
      blockers: [],
      warnings: [{ code: 'pan_name', message: 'PAN name quality' }],
      lastUpdatedAt: '2026-08-01T00:00:00Z',
    });
    const overview = await fetchCompanyIncorporationOverviewSummary();
    expect(overview.readyForDisclosureGeneration).toBe(false);
    expect(overview.disclosures.status).toBe('not_assessed');
  });
});

describe('pipeline status labels', () => {
  it('maps page processing and structured extraction independently', () => {
    expect(pageProcessingStageLabel('queued')).toBe('Awaiting document processing');
    expect(pageProcessingStageLabel('processing')).toBe('Reading document');
    expect(pageProcessingStageLabel('completed')).toBe('Document text extracted');
    expect(pageProcessingStageLabel('failed')).toBe('Document processing failed');
    expect(structuredExtractionStageLabel('queued')).toBe('Awaiting fact extraction');
    expect(structuredExtractionStageLabel('running')).toBe('Extracting facts');
    expect(structuredExtractionStageLabel('completed_with_warnings')).toBe(
      'Facts extracted with warnings',
    );
    expect(structuredExtractionStageLabel('failed')).toBe('Fact extraction failed');
  });

  it('derives overall document status from backend fields', () => {
    const base: DocumentPipelineSummaryItem = {
      documentId: 'd1',
      documentVersionId: 'v1',
      requirementKey: 'coi',
      requirementLabel: 'COI',
      originalFilename: 'coi.pdf',
      versionNumber: 1,
      uploadedAt: null,
      documentVersionStatus: 'processed',
      isCurrent: true,
      archived: false,
      pageProcessing: {
        latestAttemptId: 'p1',
        latestAttemptStatus: 'completed',
        latestCompletedRunId: 'p1',
        latestEvidenceReadyRunId: 'p1',
        evidenceReady: true,
        pageCount: 2,
        extractionMethodCounts: { native_text: 2 },
        warningCount: 0,
        warnings: [],
        retryAvailable: false,
        safeErrorMessage: null,
        queuedAt: null,
        startedAt: null,
        completedAt: null,
      },
      structuredExtraction: {
        latestRunId: 's1',
        latestRunStatus: 'completed',
        latestUsableRunId: 's1',
        deterministicStatus: 'completed',
        semanticStatus: 'completed',
        provider: 'cohere',
        modelName: 'command',
        assertionCount: 4,
        pendingReviewCount: 2,
        approvedCount: 0,
        openIssueCount: 1,
        blockingIssueCount: 0,
        warningIssueCount: 1,
        warnings: [],
        retryAvailable: false,
        safeErrorMessage: null,
        queuedAt: null,
        startedAt: null,
        completedAt: null,
      },
    };
    expect(documentOverallStatusLabel(base)).toBe('Review required');
    expect(
      documentOverallStatusLabel({
        ...base,
        archived: true,
      }),
    ).toBe('Archived');
    expect(
      documentOverallStatusLabel({
        ...base,
        structuredExtraction: {
          ...base.structuredExtraction,
          pendingReviewCount: 0,
          openIssueCount: 0,
          blockingIssueCount: 0,
        },
      }),
    ).toBe('Ready for review');
  });

  it('does not treat matched as approved', () => {
    expect(comparisonStatusLabel('matched')).toBe('Matched');
    expect(comparisonStatusLabel('matched')).not.toMatch(/approved/i);
  });
});

describe('evidence bbox helpers', () => {
  it('computes overlay geometry from normalized boxes', () => {
    const width = 1000;
    const height = 1400;
    const box = { x0: 0.1, y0: 0.2, x1: 0.4, y1: 0.25 };
    expect(box.x0 * width).toBe(100);
    expect(box.y0 * height).toBe(280);
    expect((box.x1 - box.x0) * width).toBeCloseTo(300);
    expect((box.y1 - box.y0) * height).toBeCloseTo(70);
  });
});
