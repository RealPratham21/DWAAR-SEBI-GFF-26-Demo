import type {
  ComparisonStatus,
  DocumentPipelineSummaryItem,
  IssueSeverity,
  QualityCategory,
  ReadinessStatus,
  ReviewStatus,
  StructuredRunStatus,
} from '@/lib/company-incorporation/extraction/types';

export function formatInformationValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Not available in Information';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatInformationValue(item)).join(', ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.fullAddress === 'string' && record.fullAddress) {
      return record.fullAddress;
    }
    const parts = [
      record.addressLine1,
      record.addressLine2,
      record.locality,
      record.city,
      record.state,
      record.pinCode,
      record.country,
    ]
      .filter((part) => typeof part === 'string' && part.trim())
      .map(String);
    if (parts.length) {
      return parts.join(', ');
    }
    try {
      return JSON.stringify(value);
    } catch {
      return 'Complex value';
    }
  }
  return String(value);
}

export function comparisonStatusLabel(status: ComparisonStatus): string {
  switch (status) {
    case 'matched':
      return 'Matched';
    case 'conflicting':
      return 'Conflict';
    case 'possible_historical':
      return 'Possible historical value';
    case 'possible_match':
      return 'Possible match';
    case 'no_information':
      return 'No Information value';
    case 'extractor_disagreement':
      return 'Extractor disagreement';
    case 'not_compared':
      return 'Not compared';
    default:
      return status || 'Unknown';
  }
}

export function reviewStatusLabel(status: ReviewStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'historical':
      return 'Historical';
    case 'superseded':
      return 'Superseded';
    default:
      return status || 'Unknown';
  }
}

export function qualityCategoryLabel(category: QualityCategory): string {
  switch (category) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    case 'review_required':
      return 'Review required';
    default:
      return category || 'Unknown';
  }
}

export function issueTypeLabel(issueType: string): string {
  switch (issueType) {
    case 'conflicting_value':
      return 'Conflicting value';
    case 'possible_historical_value':
      return 'Possible historical value';
    case 'outdated_registration':
      return 'Outdated registration';
    case 'missing_expected_fact':
      return 'Missing expected fact';
    case 'low_extraction_quality':
      return 'Low extraction quality';
    case 'invalid_identifier':
      return 'Invalid identifier';
    case 'extractor_disagreement':
      return 'Extraction disagreement';
    case 'document_content_mismatch':
      return 'Incorrect document type/content';
    case 'clarification_required':
      return 'Clarification required';
    default:
      return issueType || 'Issue';
  }
}

export function issueSeverityLabel(severity: IssueSeverity): string {
  switch (severity) {
    case 'blocking':
      return 'Blocking';
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Info';
    default:
      return severity || 'Unknown';
  }
}

export function readinessStatusLabel(status: ReadinessStatus): string {
  switch (status) {
    case 'not_started':
      return 'Not started';
    case 'in_progress':
      return 'In progress';
    case 'complete':
      return 'Complete';
    case 'failed':
      return 'Failed';
    case 'review_required':
      return 'Review required';
    case 'clear':
      return 'Clear';
    case 'blocking':
      return 'Blocking';
    case 'processing':
      return 'Processing';
    case 'not_assessed':
      return 'Not assessed';
    default:
      return status || 'Unknown';
  }
}

export function pageProcessingStageLabel(status: string | null | undefined): string {
  switch (status) {
    case 'queued':
      return 'Awaiting document processing';
    case 'processing':
      return 'Reading document';
    case 'completed':
      return 'Document text extracted';
    case 'failed':
      return 'Document processing failed';
    case 'cancelled':
      return 'Document processing cancelled';
    default:
      return status ? `Document processing: ${status}` : 'Document reading not started';
  }
}

export function structuredExtractionStageLabel(status: StructuredRunStatus | null | undefined): string {
  switch (status) {
    case 'queued':
      return 'Awaiting fact extraction';
    case 'running':
      return 'Extracting facts';
    case 'completed':
      return 'Facts extracted';
    case 'completed_with_warnings':
      return 'Facts extracted with warnings';
    case 'failed':
      return 'Fact extraction failed';
    case 'cancelled':
      return 'Fact extraction cancelled';
    default:
      return status ? `Fact extraction: ${status}` : 'Fact extraction not started';
  }
}

export function extractionMethodSummary(counts: Record<string, number>): string {
  const native = Number(counts.native_text || 0);
  const ocr = Number(counts.ocr || 0);
  if (native && ocr) return 'Native text + OCR';
  if (ocr) return 'OCR';
  if (native) return 'Native text';
  return 'Extraction method unavailable';
}

export function documentOverallStatusLabel(item: DocumentPipelineSummaryItem): string {
  const versionStatus = item.documentVersionStatus;
  const page = item.pageProcessing;
  const structured = item.structuredExtraction;

  if (item.archived) return 'Archived';
  if (versionStatus === 'pending_upload' || versionStatus === 'uploaded') {
    if (!page.latestAttemptStatus) return 'Awaiting processing';
  }
  if (page.latestAttemptStatus === 'queued' || versionStatus === 'pending_processing') {
    return 'Awaiting processing';
  }
  if (page.latestAttemptStatus === 'processing' || versionStatus === 'processing') {
    return 'Reading document';
  }
  if (
    page.latestAttemptStatus === 'failed' ||
    versionStatus === 'processing_failed'
  ) {
    return 'Processing failed';
  }
  if (structured.latestRunStatus === 'queued') return 'Awaiting fact extraction';
  if (structured.latestRunStatus === 'running') return 'Extracting facts';
  if (structured.latestRunStatus === 'failed') return 'Fact extraction failed';
  if (structured.latestRunStatus === 'cancelled') return 'Fact extraction cancelled';
  if (
    structured.pendingReviewCount > 0 ||
    structured.openIssueCount > 0 ||
    structured.blockingIssueCount > 0
  ) {
    return 'Review required';
  }
  if (
    structured.latestRunStatus === 'completed' ||
    structured.latestRunStatus === 'completed_with_warnings'
  ) {
    return 'Ready for review';
  }
  if (page.evidenceReady || versionStatus === 'processed') {
    return 'Document text extracted';
  }
  return versionStatus || 'Uploaded';
}

export function resolutionDecisionLabel(decision: string): string {
  switch (decision) {
    case 'keep_information':
      return 'Keep Information value';
    case 'accept_document':
      return 'Accept document value';
    case 'mark_document_historical':
      return 'Mark document historical';
    case 'reject_document_value':
      return 'Reject document value';
    case 'request_clarification':
      return 'Request clarification';
    case 'escalate_for_professional_review':
      return 'Escalate for professional review';
    case 'dismiss_non_material':
      return 'Dismiss as non-material';
    default:
      return decision;
  }
}
