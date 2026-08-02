'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fieldClassName, SectionCard } from '@/components/company-incorporation/form-primitives';
import { TabEmptyPanel } from '@/components/company-incorporation/tab-shared';
import { IssueDetailDrawer } from '@/components/company-incorporation/issue-detail-drawer';
import { EvidenceViewer } from '@/components/company-incorporation/evidence-viewer';
import {
  IssueStatusBadge,
  SeverityBadge,
  StatusBadge,
} from '@/components/company-incorporation/status-badge';
import { useCompanyIncorporationIssues } from '@/lib/company-incorporation/hooks/use-company-incorporation-issues';
import { fetchFactAssertionEvidence } from '@/lib/api/company-incorporation-facts-api';
import { issueTypeLabel } from '@/lib/company-incorporation/extraction/labels';
import type {
  FactEvidenceResponse,
  FactIssueSummary,
  IssueSeverity,
  IssueStatus,
  ResolveIssueRequest,
  WorkstreamPipelineAggregation,
} from '@/lib/company-incorporation/extraction/types';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'open' | 'blocking' | 'awaiting_clarification' | 'escalated' | 'resolved';

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'blocking', label: 'Blocking' },
  { id: 'awaiting_clarification', label: 'Awaiting clarification' },
  { id: 'escalated', label: 'Escalated' },
  { id: 'resolved', label: 'Resolved' },
];

const SEVERITY_FILTERS: Array<{ id: IssueSeverity | 'all'; label: string }> = [
  { id: 'all', label: 'All severities' },
  { id: 'blocking', label: 'Blocking' },
  { id: 'warning', label: 'Warning' },
  { id: 'info', label: 'Info' },
];

const SUPPORTING_TEXT =
  'Questions are raised when a value read from a document does not agree with the Information you entered, or when the extraction could not be relied on. Resolving a question records a decision and its rationale; it never changes the Information section on your behalf.';

function isUnresolved(status: IssueStatus): boolean {
  return status !== 'resolved' && status !== 'dismissed';
}

function matchesStatusFilter(issue: FactIssueSummary, filter: StatusFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'open':
      return isUnresolved(issue.status);
    case 'blocking':
      return issue.blocking && isUnresolved(issue.status);
    case 'awaiting_clarification':
      return issue.status === 'awaiting_clarification';
    case 'escalated':
      return issue.status === 'escalated';
    case 'resolved':
      return issue.status === 'resolved' || issue.status === 'dismissed';
    default:
      return true;
  }
}

function formatTimestamp(value: string | null): string {
  if (!value) return 'Unknown time';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

interface CompanyIncorporationQuestionsTabProps {
  enabled: boolean;
  issueId: string | null;
  onOpenIssue: (issueId: string) => void;
  onCloseIssue: () => void;
  onResolved?: () => void;
  onViewEvidenceAssertion?: (assertionId: string) => void;
  refreshToken?: number;
  pipelineAggregation?: WorkstreamPipelineAggregation | null;
}

export function CompanyIncorporationQuestionsTab({
  enabled,
  issueId,
  onOpenIssue,
  onCloseIssue,
  onResolved,
  onViewEvidenceAssertion,
  refreshToken = 0,
  pipelineAggregation = null,
}: CompanyIncorporationQuestionsTabProps) {
  const issues = useCompanyIncorporationIssues({ enabled });

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [informationUpdateRequired, setInformationUpdateRequired] = useState(false);
  const [evidenceAssertionId, setEvidenceAssertionId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<FactEvidenceResponse | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const issuesRefresh = issues.refresh;
  const loadIssue = issues.loadIssue;
  const clearIssue = issues.clearIssue;

  const initialRefreshToken = useRef(refreshToken);
  useEffect(() => {
    if (!enabled || refreshToken === initialRefreshToken.current) return;
    void issuesRefresh({ silent: true });
  }, [enabled, issuesRefresh, refreshToken]);

  useEffect(() => {
    if (!enabled || !issueId) return;
    setInformationUpdateRequired(false);
    void loadIssue(issueId);
  }, [enabled, issueId, loadIssue]);

  const allIssues = useMemo(() => issues.data?.issues ?? [], [issues.data]);

  const counts = useMemo(() => {
    const summary = {
      open: 0,
      blocking: 0,
      warnings: 0,
      awaitingClarification: 0,
      escalated: 0,
      resolved: 0,
    };
    allIssues.forEach((issue) => {
      if (isUnresolved(issue.status)) {
        summary.open += 1;
        if (issue.blocking || issue.severity === 'blocking') summary.blocking += 1;
        if (issue.severity === 'warning') summary.warnings += 1;
      }
      if (issue.status === 'awaiting_clarification') summary.awaitingClarification += 1;
      if (issue.status === 'escalated') summary.escalated += 1;
      if (issue.status === 'resolved' || issue.status === 'dismissed') summary.resolved += 1;
    });
    return summary;
  }, [allIssues]);

  const typeOptions = useMemo(() => {
    const unique = new Set<string>();
    allIssues.forEach((issue) => unique.add(issue.issueType));
    return Array.from(unique).sort((a, b) => issueTypeLabel(a).localeCompare(issueTypeLabel(b)));
  }, [allIssues]);

  const visibleIssues = useMemo(
    () =>
      allIssues.filter((issue) => {
        if (!matchesStatusFilter(issue, statusFilter)) return false;
        if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
        if (typeFilter !== 'all' && issue.issueType !== typeFilter) return false;
        return true;
      }),
    [allIssues, severityFilter, statusFilter, typeFilter],
  );

  const handleViewEvidence = useCallback(
    (assertionId: string) => {
      // When the workstream can navigate to the Facts tab, evidence is shown
      // there alongside the full assertion detail rather than in a second layer.
      if (onViewEvidenceAssertion) {
        onViewEvidenceAssertion(assertionId);
        return;
      }
      setEvidenceAssertionId(assertionId);
      setEvidenceLoading(true);
      setEvidence(null);
      (async () => {
        try {
          const response = await fetchFactAssertionEvidence(assertionId);
          setEvidence(response);
        } catch {
          setEvidence(null);
        } finally {
          setEvidenceLoading(false);
        }
      })();
    },
    [onViewEvidenceAssertion],
  );

  const evidenceSource = useMemo(() => {
    const linked = issues.issueDetail?.linkedAssertions.find(
      (assertion) => assertion.factAssertionId === evidenceAssertionId,
    );
    if (!linked) return null;
    return {
      documentVersionId: linked.documentVersionId,
      filename: linked.originalFilename ?? undefined,
      versionNumber: linked.versionNumber ?? undefined,
    };
  }, [evidenceAssertionId, issues.issueDetail]);

  const handleResolve = useCallback(
    (body: ResolveIssueRequest) => {
      const targetId = issues.issueDetail?.id;
      if (!targetId) return;
      void issues
        .submitResolution(targetId, body)
        .then((response) => {
          setInformationUpdateRequired(response.informationUpdateRequired);
          onResolved?.();
        })
        .catch(() => {
          // The hook surfaces the failure through mutationError.
        });
    },
    [issues, onResolved],
  );

  const handleCloseDrawer = useCallback(() => {
    setInformationUpdateRequired(false);
    clearIssue();
    onCloseIssue();
  }, [clearIssue, onCloseIssue]);

  const emptyState = useMemo(() => {
    if (allIssues.length > 0) return null;
    const aggregation = pipelineAggregation;
    if (aggregation && aggregation.totalCurrentDocuments === 0) {
      return {
        message: 'No documents have been uploaded, so no questions have been raised.',
        supportingText:
          'Questions appear once uploaded documents are compared with the Information you entered.',
      };
    }
    if (aggregation?.hasAnyActivePipeline) {
      return {
        message: 'Documents are still being processed.',
        supportingText:
          'Questions are raised after each document has been read and its facts compared with Information.',
      };
    }
    if (aggregation && aggregation.documentsWithFailures > 0) {
      return {
        message: `${aggregation.documentsWithFailures} document${aggregation.documentsWithFailures === 1 ? '' : 's'} could not be processed.`,
        supportingText:
          'Open the Documents tab to retry processing. Comparison cannot run until a document has been read successfully.',
      };
    }
    return {
      message: 'No questions or conflicts have been raised.',
      supportingText: SUPPORTING_TEXT,
    };
  }, [allIssues.length, pipelineAggregation]);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Questions & Conflicts"
        description="Differences between the Information you entered and the values read from documents."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={issues.loading || issues.refreshing}
            onClick={() => void issues.refresh({ silent: true })}
          >
            {issues.refreshing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground leading-relaxed">{SUPPORTING_TEXT}</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <SummaryTile label="Open" value={counts.open} />
          <SummaryTile label="Blocking" value={counts.blocking} />
          <SummaryTile label="Warnings" value={counts.warnings} />
          <SummaryTile label="Awaiting clarification" value={counts.awaitingClarification} />
          <SummaryTile label="Escalated" value={counts.escalated} />
          <SummaryTile label="Resolved" value={counts.resolved} />
        </div>

        {issues.error ? (
          <p className="border-l-2 border-destructive pl-3 text-sm text-destructive" role="alert">
            {issues.error}
          </p>
        ) : null}
      </SectionCard>

      <SectionCard title="Questions">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter questions by status">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.id}
                type="button"
                size="sm"
                variant={statusFilter === filter.id ? 'default' : 'outline'}
                aria-pressed={statusFilter === filter.id}
                onClick={() => setStatusFilter(filter.id)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <div>
              <label htmlFor="issues-severity-filter" className="sr-only">
                Filter by severity
              </label>
              <select
                id="issues-severity-filter"
                value={String(severityFilter)}
                onChange={(event) => setSeverityFilter(event.target.value as IssueSeverity | 'all')}
                className={cn(fieldClassName, 'w-auto py-1.5 text-sm')}
              >
                {SEVERITY_FILTERS.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="issues-type-filter" className="sr-only">
                Filter by question type
              </label>
              <select
                id="issues-type-filter"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className={cn(fieldClassName, 'w-auto py-1.5 text-sm')}
              >
                <option value="all">All question types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {issueTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {issues.loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            Loading questions…
          </div>
        ) : emptyState ? (
          <TabEmptyPanel message={emptyState.message} supportingText={emptyState.supportingText} />
        ) : visibleIssues.length === 0 ? (
          <TabEmptyPanel message="No questions match the selected filters." />
        ) : (
          <ul className="mt-4 space-y-3">
            {visibleIssues.map((issue) => (
              <li
                key={issue.id}
                className="rounded-lg border border-border bg-card p-4 space-y-3"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <p className="font-medium text-foreground break-words">{issue.title}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge label={issueTypeLabel(issue.issueType)} tone="informative" />
                      <SeverityBadge severity={issue.severity} blocking={issue.blocking} />
                      <IssueStatusBadge status={issue.status} />
                      {issue.blocking ? (
                        <StatusBadge label="Blocks disclosures" tone="critical" />
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground break-all">
                      {issue.factKey} · Raised {formatTimestamp(issue.createdAt)}
                      {issue.resolvedAt ? ` · Resolved ${formatTimestamp(issue.resolvedAt)}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenIssue(issue.id)}
                    >
                      {isUnresolved(issue.status) ? 'Review and resolve' : 'View resolution'}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <IssueDetailDrawer
        open={Boolean(issueId) || Boolean(issues.issueDetail)}
        onClose={handleCloseDrawer}
        issueDetail={issues.issueDetail}
        detailLoading={issues.detailLoading}
        mutationPending={issues.mutationPending}
        mutationError={issues.mutationError}
        acknowledgement={issues.acknowledgement}
        informationUpdateRequired={informationUpdateRequired}
        onDismissAcknowledgement={issues.clearAcknowledgement}
        onResolve={handleResolve}
        onViewEvidence={handleViewEvidence}
      />

      <EvidenceViewer
        open={Boolean(evidenceAssertionId)}
        onClose={() => setEvidenceAssertionId(null)}
        assertionId={evidenceAssertionId}
        evidence={evidence}
        loading={evidenceLoading}
        sourceFilename={evidenceSource?.filename}
        versionNumber={evidenceSource?.versionNumber}
        documentVersionId={evidenceSource?.documentVersionId ?? null}
      />
    </div>
  );
}
