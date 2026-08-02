'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, type BadgeTone } from '@/components/company-incorporation/status-badge';
import {
  documentOverallStatusLabel,
  extractionMethodSummary,
  pageProcessingStageLabel,
  structuredExtractionStageLabel,
} from '@/lib/company-incorporation/extraction/labels';
import type { DocumentPipelineSummaryItem } from '@/lib/company-incorporation/extraction/types';
import { cn } from '@/lib/utils';

/** Page processing uses `processing`; structured extraction uses `running`. */
function pageStageTone(status: string | null): BadgeTone {
  switch (status) {
    case 'completed':
      return 'positive';
    case 'failed':
      return 'critical';
    case 'cancelled':
      return 'neutral';
    case 'processing':
      return 'informative';
    case 'queued':
      return 'caution';
    default:
      return 'neutral';
  }
}

function structuredStageTone(status: string | null): BadgeTone {
  switch (status) {
    case 'completed':
      return 'positive';
    case 'completed_with_warnings':
      return 'caution';
    case 'failed':
      return 'critical';
    case 'cancelled':
      return 'neutral';
    case 'running':
      return 'informative';
    case 'queued':
      return 'caution';
    default:
      return 'neutral';
  }
}

function isPageStageActive(status: string | null): boolean {
  return status === 'queued' || status === 'processing';
}

function isStructuredStageActive(status: string | null): boolean {
  return status === 'queued' || status === 'running';
}

interface DocumentPipelineStatusProps {
  item: DocumentPipelineSummaryItem | null | undefined;
  onRetryProcessing: (documentVersionId: string) => void;
  onRetryFacts: (documentVersionId: string) => void;
  /** Value from the pipeline hook, e.g. `processing:<versionId>` or `structured:<versionId>`. */
  mutationPending: string | null;
  highlighted?: boolean;
  onViewFacts?: (documentVersionId: string) => void;
  className?: string;
}

export function DocumentPipelineStatus({
  item,
  onRetryProcessing,
  onRetryFacts,
  mutationPending,
  highlighted = false,
  onViewFacts,
  className,
}: DocumentPipelineStatusProps) {
  if (!item) {
    return (
      <div
        className={cn('rounded-md border border-dashed border-border bg-muted/10 p-3', className)}
      >
        <p className="text-xs text-muted-foreground">
          Processing status for this document is not available yet.
        </p>
      </div>
    );
  }

  const { pageProcessing: page, structuredExtraction: structured } = item;
  const processingBusy = mutationPending === `processing:${item.documentVersionId}`;
  const factsBusy = mutationPending === `structured:${item.documentVersionId}`;
  const pageActive = isPageStageActive(page.latestAttemptStatus);
  const structuredActive = isStructuredStageActive(structured.latestRunStatus);
  const warnings = [...page.warnings, ...structured.warnings];

  return (
    <div
      id={`document-version-${item.documentVersionId}`}
      className={cn(
        'rounded-md border bg-muted/10 p-3 space-y-3',
        highlighted ? 'border-accent ring-1 ring-accent/40' : 'border-border',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={documentOverallStatusLabel(item)} tone="informative" />
        {item.archived ? <StatusBadge label="Archived" /> : null}
        {!item.isCurrent ? <StatusBadge label="Historical version" /> : null}
      </div>

      <ol className="space-y-3">
        <li className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Stage 1 · Reading the document
            </span>
            <StatusBadge
              label={pageProcessingStageLabel(page.latestAttemptStatus)}
              tone={pageStageTone(page.latestAttemptStatus)}
              icon={pageActive ? <Loader2 size={11} className="animate-spin" /> : undefined}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {page.pageCount > 0
              ? `${page.pageCount} page${page.pageCount === 1 ? '' : 's'} · ${extractionMethodSummary(page.extractionMethodCounts)}`
              : 'Page count not available yet.'}
            {page.evidenceReady ? ' · Evidence available' : ''}
          </p>
          {page.safeErrorMessage ? (
            <p className="border-l-2 border-destructive pl-3 text-xs text-destructive" role="alert">
              {page.safeErrorMessage}
            </p>
          ) : null}
          {page.retryAvailable ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={processingBusy}
              onClick={() => onRetryProcessing(item.documentVersionId)}
            >
              {processingBusy ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Retry document reading
            </Button>
          ) : null}
        </li>

        <li className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Stage 2 · Extracting facts
            </span>
            <StatusBadge
              label={structuredExtractionStageLabel(structured.latestRunStatus)}
              tone={structuredStageTone(structured.latestRunStatus)}
              icon={structuredActive ? <Loader2 size={11} className="animate-spin" /> : undefined}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {structured.assertionCount > 0
              ? `${structured.assertionCount} fact${structured.assertionCount === 1 ? '' : 's'} found · ${structured.pendingReviewCount} pending review · ${structured.approvedCount} approved`
              : 'No facts have been recorded from this document yet.'}
          </p>
          {structured.openIssueCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              {structured.openIssueCount} open question
              {structured.openIssueCount === 1 ? '' : 's'}
              {structured.blockingIssueCount > 0
                ? ` · ${structured.blockingIssueCount} blocking`
                : ''}
            </p>
          ) : null}
          {structured.safeErrorMessage ? (
            <p className="border-l-2 border-destructive pl-3 text-xs text-destructive" role="alert">
              {structured.safeErrorMessage}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {structured.retryAvailable ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={factsBusy}
                onClick={() => onRetryFacts(item.documentVersionId)}
              >
                {factsBusy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Retry fact extraction
              </Button>
            ) : null}
            {onViewFacts && structured.assertionCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => onViewFacts(item.documentVersionId)}
              >
                View facts from this document
              </Button>
            ) : null}
          </div>
        </li>
      </ol>

      {warnings.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Processing notes</p>
          <ul className="space-y-1">
            {warnings.map((warning) => (
              <li key={warning} className="text-xs text-muted-foreground">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
