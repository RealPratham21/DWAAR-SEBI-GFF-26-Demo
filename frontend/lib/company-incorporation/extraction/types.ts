/** Typed contracts for Company & Incorporation pipeline / facts / issues / overview APIs. */

export type ProcessingAttemptStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | string;

export type StructuredRunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'completed_with_warnings'
  | 'failed'
  | 'cancelled'
  | string;

export type ComparisonStatus =
  | 'not_compared'
  | 'matched'
  | 'conflicting'
  | 'possible_match'
  | 'possible_historical'
  | 'no_information'
  | 'extractor_disagreement'
  | string;

export type ReviewStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'historical'
  | 'superseded'
  | string;

export type QualityCategory = 'high' | 'medium' | 'low' | 'review_required' | string;

export type ReviewAction = 'approve' | 'reject' | 'mark_historical' | 'return_to_pending';

export type IssueStatus =
  | 'open'
  | 'awaiting_clarification'
  | 'escalated'
  | 'resolved'
  | 'dismissed'
  | string;

export type IssueSeverity = 'info' | 'warning' | 'blocking' | string;

export type ResolutionDecision =
  | 'keep_information'
  | 'accept_document'
  | 'mark_document_historical'
  | 'reject_document_value'
  | 'request_clarification'
  | 'escalate_for_professional_review'
  | 'dismiss_non_material';

export type ReadinessStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete'
  | 'failed'
  | 'review_required'
  | 'clear'
  | 'blocking'
  | 'processing'
  | 'not_assessed'
  | string;

export interface PageProcessingPipelineSummary {
  latestAttemptId: string | null;
  latestAttemptStatus: ProcessingAttemptStatus | null;
  latestCompletedRunId: string | null;
  latestEvidenceReadyRunId: string | null;
  evidenceReady: boolean;
  pageCount: number;
  extractionMethodCounts: Record<string, number>;
  warningCount: number;
  warnings: string[];
  retryAvailable: boolean;
  safeErrorMessage: string | null;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface StructuredExtractionPipelineSummary {
  latestRunId: string | null;
  latestRunStatus: StructuredRunStatus | null;
  latestUsableRunId: string | null;
  deterministicStatus: string | null;
  semanticStatus: string | null;
  provider: string | null;
  modelName: string | null;
  assertionCount: number;
  pendingReviewCount: number;
  approvedCount: number;
  openIssueCount: number;
  blockingIssueCount: number;
  warningIssueCount: number;
  warnings: string[];
  retryAvailable: boolean;
  safeErrorMessage: string | null;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface DocumentPipelineSummaryItem {
  documentId: string;
  documentVersionId: string;
  requirementKey: string;
  requirementLabel: string;
  originalFilename: string;
  versionNumber: number;
  uploadedAt: string | null;
  documentVersionStatus: string;
  isCurrent: boolean;
  archived: boolean;
  pageProcessing: PageProcessingPipelineSummary;
  structuredExtraction: StructuredExtractionPipelineSummary;
}

export interface WorkstreamPipelineAggregation {
  hasActivePageProcessing: boolean;
  hasActiveStructuredExtraction: boolean;
  hasAnyActivePipeline: boolean;
  totalCurrentDocuments: number;
  documentsAwaitingProcessing: number;
  documentsProcessing: number;
  documentsExtractingFacts: number;
  documentsReadyForReview: number;
  documentsWithFailures: number;
  lastUpdatedAt: string;
}

export interface DocumentPipelineSummaryResponse {
  documents: DocumentPipelineSummaryItem[];
  aggregation: WorkstreamPipelineAggregation;
}

export interface FactAssertionSummary {
  id: string;
  factKey: string;
  requirementKey: string;
  documentVersionId: string;
  structuredExtractionRunId: string;
  displayValue: string;
  comparisonStatus: ComparisonStatus;
  reviewStatus: ReviewStatus;
  qualityCategory: QualityCategory;
  qualityScore: number | null;
  extractorKind: string;
  validationStatus: string;
  sourceTemporality: string;
}

export interface FactGroup {
  factKey: string;
  displayLabel: string;
  informationValue: unknown;
  assertions: FactAssertionSummary[];
}

export interface FactsListResponse {
  totalFactKeys: number;
  totalAssertions: number;
  groups: FactGroup[];
}

export interface FactAssertionReviewEntry {
  id: string;
  action: ReviewAction | string;
  rationale: string | null;
  reviewedByUserId: string;
  createdAt: string;
}

export interface FactAssertionDetail extends FactAssertionSummary {
  rawValue: unknown;
  normalizedValue: unknown;
  qualitySignals: Record<string, unknown>;
  documentProcessingRunId: string;
  reviews: FactAssertionReviewEntry[];
}

export interface FactEvidenceItem {
  id: string;
  documentPageId: string;
  blockId: string;
  evidenceRole: string;
  quoteSnapshot: string;
  bboxSnapshot: {
    x0?: number;
    y0?: number;
    x1?: number;
    y1?: number;
    [key: string]: unknown;
  };
  pageNumber: number;
  extractionMethod: string;
  ocrConfidence: number | null;
  blockOrderIndex: number;
}

export interface FactEvidenceResponse {
  assertionId: string;
  items: FactEvidenceItem[];
}

export interface ReviewAssertionRequest {
  action: ReviewAction;
  rationale?: string | null;
}

export interface ReviewAssertionResponse {
  assertionId: string;
  reviewStatus: ReviewStatus;
  action: ReviewAction | string;
  reviewId: string;
  createdAt: string;
}

export interface RetryStructuredExtractionResponse {
  documentVersionId: string;
  documentProcessingRunId: string;
  structuredExtractionRunId: string;
  status: StructuredRunStatus;
  extractorVersion: string;
  factSchemaVersion: string;
  promptVersion: string;
}

export interface RetryProcessingResponse {
  documentVersionId: string;
  processingRunId?: string;
  status?: string;
  [key: string]: unknown;
}

export interface FactIssueSummary {
  id: string;
  factKey: string;
  issueType: string;
  title: string;
  severity: IssueSeverity;
  blocking: boolean;
  status: IssueStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface FactIssuesListResponse {
  total: number;
  issues: FactIssueSummary[];
}

export interface FactIssueLinkedAssertion {
  factAssertionId: string;
  role: string;
  factKey: string | null;
  displayValue: string | null;
  normalizedValue: unknown;
  comparisonStatus: ComparisonStatus | null;
  reviewStatus: ReviewStatus | null;
  qualityCategory: QualityCategory | null;
  sourceTemporality: string | null;
  documentId: string | null;
  documentVersionId: string | null;
  originalFilename: string | null;
  versionNumber: number | null;
  requirementKey: string | null;
  requirementLabel: string | null;
  pageNumbers: number[];
  evidenceSummary: string[];
  extractionMethods: string[];
  ocrDerived: boolean;
}

export interface FactIssueResolutionHistoryItem {
  id: string;
  decision: ResolutionDecision | string;
  rationale: string;
  selectedAssertionId: string | null;
  resolvedByUserId: string | null;
  resolverDisplayName: string | null;
  informationValueSnapshot: unknown;
  documentValueSnapshot: unknown;
  createdAt: string;
}

export interface FactIssueDetail extends FactIssueSummary {
  description: string;
  suggestedActions: string[];
  informationValueSnapshot: unknown;
  informationNormalizedSnapshot: unknown;
  linkedAssertions: FactIssueLinkedAssertion[];
  resolutionHistory: FactIssueResolutionHistoryItem[];
}

export interface ResolveIssueRequest {
  decision: ResolutionDecision;
  rationale: string;
  selectedAssertionId?: string | null;
}

export interface ResolveIssueResponse {
  issueId: string;
  status: IssueStatus;
  decision: ResolutionDecision | string;
  resolutionId: string;
  informationUpdateRequired: boolean;
}

export interface OverviewSectionStatus {
  sectionId: string;
  status: 'not_started' | 'in_progress' | 'complete' | string;
}

export interface OverviewInformationSummary {
  completedSections: number;
  totalSections: number;
  status: string;
  sections: OverviewSectionStatus[];
}

export interface OverviewDocumentsSummary {
  mandatoryRequired: number;
  mandatoryUploaded: number;
  mandatoryProcessed: number;
  mandatoryFailed: number;
  activeProcessingCount: number;
  structuredExtractionActiveCount: number;
  documentsWithWarnings: number;
  status: ReadinessStatus;
}

export interface OverviewFactsSummary {
  factGroupCount: number;
  assertionCount: number;
  approvedAssertionCount: number;
  pendingReviewCount: number;
  rejectedCount: number;
  historicalCount: number;
  lowQualityCount: number;
  invalidAssertionCount: number;
  factsWithMultipleSources: number;
  status: ReadinessStatus;
}

export interface OverviewConflictsSummary {
  openIssueCount: number;
  blockingIssueCount: number;
  warningIssueCount: number;
  awaitingClarificationCount: number;
  escalatedCount: number;
  resolvedIssueCount: number;
  status: ReadinessStatus;
}

export interface OverviewSummaryResponse {
  information: OverviewInformationSummary;
  documents: OverviewDocumentsSummary;
  facts: OverviewFactsSummary;
  conflicts: OverviewConflictsSummary;
  disclosures: { status: 'not_assessed' | string };
  professionalReview: { status: 'not_assessed' | string };
  overallStatus: string;
  readyForDisclosureGeneration: boolean;
  blockers: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
  lastUpdatedAt: string;
}
