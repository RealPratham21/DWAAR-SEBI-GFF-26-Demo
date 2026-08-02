import { describe, expect, it } from 'vitest';
import {
  documentOverallStatusLabel,
  issueTypeLabel,
  readinessStatusLabel,
  resolutionDecisionLabel,
} from '@/lib/company-incorporation/extraction/labels';
import type { DocumentPipelineSummaryItem } from '@/lib/company-incorporation/extraction/types';

function baseItem(
  overrides: Partial<DocumentPipelineSummaryItem> = {},
): DocumentPipelineSummaryItem {
  return {
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
      pageCount: 1,
      extractionMethodCounts: { native_text: 1 },
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
      provider: null,
      modelName: null,
      assertionCount: 1,
      pendingReviewCount: 0,
      approvedCount: 1,
      openIssueCount: 0,
      blockingIssueCount: 0,
      warningIssueCount: 0,
      warnings: [],
      retryAvailable: false,
      safeErrorMessage: null,
      queuedAt: null,
      startedAt: null,
      completedAt: null,
    },
    ...overrides,
  };
}

describe('documents dual-stage presentation', () => {
  it('shows reading vs extraction failures separately', () => {
    expect(
      documentOverallStatusLabel(
        baseItem({
          documentVersionStatus: 'processing_failed',
          pageProcessing: {
            ...baseItem().pageProcessing,
            latestAttemptStatus: 'failed',
            retryAvailable: true,
            safeErrorMessage: 'Unable to read document',
          },
        }),
      ),
    ).toBe('Processing failed');

    expect(
      documentOverallStatusLabel(
        baseItem({
          structuredExtraction: {
            ...baseItem().structuredExtraction,
            latestRunStatus: 'failed',
            retryAvailable: true,
          },
        }),
      ),
    ).toBe('Fact extraction failed');
  });

  it('shows review required when pending review or open issues exist', () => {
    expect(
      documentOverallStatusLabel(
        baseItem({
          structuredExtraction: {
            ...baseItem().structuredExtraction,
            pendingReviewCount: 3,
          },
        }),
      ),
    ).toBe('Review required');
  });
});

describe('issues and resolution copy', () => {
  it('maps backend issue types and decisions', () => {
    expect(issueTypeLabel('possible_historical_value')).toBe('Possible historical value');
    expect(issueTypeLabel('low_extraction_quality')).toBe('Low extraction quality');
    expect(resolutionDecisionLabel('mark_document_historical')).toBe('Mark document historical');
    expect(resolutionDecisionLabel('accept_document')).toBe('Accept document value');
  });
});

describe('overview readiness labels', () => {
  it('keeps disclosures and professional review not assessed', () => {
    expect(readinessStatusLabel('not_assessed')).toBe('Not assessed');
    expect(readinessStatusLabel('review_required')).toBe('Review required');
    expect(readinessStatusLabel('blocking')).toBe('Blocking');
  });
});

describe('notification deep-link shapes', () => {
  it('supports facts and questions deep links', () => {
    const facts = new URLSearchParams('tab=facts&assertionId=a1');
    expect(facts.get('tab')).toBe('facts');
    expect(facts.get('assertionId')).toBe('a1');

    const questions = new URLSearchParams('tab=questions&issueId=i1');
    expect(questions.get('tab')).toBe('questions');
    expect(questions.get('issueId')).toBe('i1');

    const documentFocus = new URLSearchParams('tab=facts&documentVersionId=v1');
    expect(documentFocus.get('documentVersionId')).toBe('v1');
  });
});
