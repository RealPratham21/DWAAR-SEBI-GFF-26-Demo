'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fieldClassName, SectionCard } from '@/components/company-incorporation/form-primitives';
import { TabEmptyPanel } from '@/components/company-incorporation/tab-shared';
import { AssertionDetailDrawer } from '@/components/company-incorporation/assertion-detail-drawer';
import { EvidenceViewer } from '@/components/company-incorporation/evidence-viewer';
import {
  ComparisonStatusBadge,
  QualityBadge,
  ReviewStatusBadge,
  StatusBadge,
} from '@/components/company-incorporation/status-badge';
import { useCompanyIncorporationFacts } from '@/lib/company-incorporation/hooks/use-company-incorporation-facts';
import { useCompanyIncorporationIssues } from '@/lib/company-incorporation/hooks/use-company-incorporation-issues';
import {
  FACTS_SUPPORTING_TEXT,
  FACTS_TABLE_COLUMNS,
} from '@/lib/company-incorporation/facts-table-config';
import { formatInformationValue } from '@/lib/company-incorporation/extraction/labels';
import type {
  DocumentPipelineSummaryItem,
  FactAssertionSummary,
  FactGroup,
  FactIssueSummary,
  QualityCategory,
  ReviewAction,
  WorkstreamPipelineAggregation,
} from '@/lib/company-incorporation/extraction/types';
import { cn } from '@/lib/utils';

type PrimaryFilter =
  | 'all'
  | 'matched'
  | 'conflicting'
  | 'historical'
  | 'no_information'
  | 'pending'
  | 'approved'
  | 'rejected';

const PRIMARY_FILTERS: Array<{ id: PrimaryFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'matched', label: 'Matched' },
  { id: 'conflicting', label: 'Conflicting' },
  { id: 'historical', label: 'Historical' },
  { id: 'no_information', label: 'No Information value' },
  { id: 'pending', label: 'Pending review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const QUALITY_FILTERS: Array<{ id: QualityCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All evidence quality' },
  { id: 'high', label: 'High quality' },
  { id: 'medium', label: 'Medium quality' },
  { id: 'low', label: 'Low quality' },
  { id: 'review_required', label: 'Review required' },
];

interface FactRow {
  group: FactGroup;
  assertion: FactAssertionSummary | null;
}

function matchesPrimaryFilter(assertion: FactAssertionSummary | null, filter: PrimaryFilter): boolean {
  if (filter === 'all') return true;
  if (!assertion) return false;
  switch (filter) {
    case 'matched':
      return assertion.comparisonStatus === 'matched';
    case 'conflicting':
      return assertion.comparisonStatus === 'conflicting';
    case 'historical':
      return (
        assertion.comparisonStatus === 'possible_historical' ||
        assertion.reviewStatus === 'historical'
      );
    case 'no_information':
      return assertion.comparisonStatus === 'no_information';
    case 'pending':
      return assertion.reviewStatus === 'pending';
    case 'approved':
      return assertion.reviewStatus === 'approved';
    case 'rejected':
      return assertion.reviewStatus === 'rejected';
    default:
      return true;
  }
}

interface SummaryCounts {
  factKeys: number;
  assertions: number;
  matched: number;
  conflicting: number;
  historical: number;
  noInformation: number;
  pending: number;
  approved: number;
  rejected: number;
  reviewRequiredQuality: number;
}

function summarise(groups: FactGroup[]): SummaryCounts {
  const counts: SummaryCounts = {
    factKeys: groups.length,
    assertions: 0,
    matched: 0,
    conflicting: 0,
    historical: 0,
    noInformation: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    reviewRequiredQuality: 0,
  };
  groups.forEach((group) => {
    group.assertions.forEach((assertion) => {
      counts.assertions += 1;
      if (assertion.comparisonStatus === 'matched') counts.matched += 1;
      if (assertion.comparisonStatus === 'conflicting') counts.conflicting += 1;
      if (
        assertion.comparisonStatus === 'possible_historical' ||
        assertion.reviewStatus === 'historical'
      ) {
        counts.historical += 1;
      }
      if (assertion.comparisonStatus === 'no_information') counts.noInformation += 1;
      if (assertion.reviewStatus === 'pending') counts.pending += 1;
      if (assertion.reviewStatus === 'approved') counts.approved += 1;
      if (assertion.reviewStatus === 'rejected') counts.rejected += 1;
      if (assertion.qualityCategory === 'review_required' || assertion.qualityCategory === 'low') {
        counts.reviewRequiredQuality += 1;
      }
    });
  });
  return counts;
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

interface CompanyIncorporationFactsTabProps {
  enabled: boolean;
  assertionId: string | null;
  documentVersionId: string | null;
  onOpenAssertion: (assertionId: string) => void;
  onCloseAssertion: () => void;
  onPipelineIdleRefresh?: () => void;
  onReviewed?: () => void;
  refreshToken?: number;
  pipelineAggregation?: WorkstreamPipelineAggregation | null;
  pipelineDocuments?: DocumentPipelineSummaryItem[];
  onOpenIssue?: (issueId: string) => void;
}

export function CompanyIncorporationFactsTab({
  enabled,
  assertionId,
  documentVersionId,
  onOpenAssertion,
  onCloseAssertion,
  onPipelineIdleRefresh,
  onReviewed,
  refreshToken = 0,
  pipelineAggregation = null,
  pipelineDocuments = [],
  onOpenIssue,
}: CompanyIncorporationFactsTabProps) {
  const facts = useCompanyIncorporationFacts({ enabled });
  const issues = useCompanyIncorporationIssues({ enabled });

  const [primaryFilter, setPrimaryFilter] = useState<PrimaryFilter>('all');
  const [qualityFilter, setQualityFilter] = useState<QualityCategory | 'all'>('all');
  const [requirementFilter, setRequirementFilter] = useState<string>('all');
  const [evidenceAssertionId, setEvidenceAssertionId] = useState<string | null>(null);

  const factsRefresh = facts.refresh;
  const issuesRefresh = issues.refresh;
  const loadAssertion = facts.loadAssertion;
  const loadEvidence = facts.loadEvidence;
  const clearAssertion = facts.clearAssertion;

  const initialRefreshToken = useRef(refreshToken);
  useEffect(() => {
    if (!enabled || refreshToken === initialRefreshToken.current) return;
    void factsRefresh({ silent: true });
    void issuesRefresh({ silent: true });
    onPipelineIdleRefresh?.();
  }, [enabled, factsRefresh, issuesRefresh, onPipelineIdleRefresh, refreshToken]);

  useEffect(() => {
    if (!enabled || !assertionId) return;
    void loadAssertion(assertionId);
  }, [assertionId, enabled, loadAssertion]);

  const groups = useMemo(() => facts.data?.groups ?? [], [facts.data]);
  const counts = useMemo(() => summarise(groups), [groups]);

  const documentsByVersionId = useMemo(() => {
    const map = new Map<string, DocumentPipelineSummaryItem>();
    pipelineDocuments.forEach((item) => map.set(item.documentVersionId, item));
    return map;
  }, [pipelineDocuments]);

  const issuesByFactKey = useMemo(() => {
    const map = new Map<string, FactIssueSummary[]>();
    (issues.data?.issues ?? []).forEach((issue) => {
      const existing = map.get(issue.factKey);
      if (existing) existing.push(issue);
      else map.set(issue.factKey, [issue]);
    });
    return map;
  }, [issues.data]);

  const requirementOptions = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach((group) => {
      group.assertions.forEach((assertion) => {
        const label =
          documentsByVersionId.get(assertion.documentVersionId)?.requirementLabel ??
          assertion.requirementKey;
        map.set(assertion.requirementKey, label);
      });
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [documentsByVersionId, groups]);

  const rows = useMemo<FactRow[]>(() => {
    const result: FactRow[] = [];
    groups.forEach((group) => {
      if (group.assertions.length === 0) {
        if (primaryFilter === 'all' && qualityFilter === 'all' && requirementFilter === 'all') {
          result.push({ group, assertion: null });
        }
        return;
      }
      group.assertions.forEach((assertion) => {
        if (!matchesPrimaryFilter(assertion, primaryFilter)) return;
        if (qualityFilter !== 'all' && assertion.qualityCategory !== qualityFilter) return;
        if (requirementFilter !== 'all' && assertion.requirementKey !== requirementFilter) return;
        result.push({ group, assertion });
      });
    });
    return result;
  }, [groups, primaryFilter, qualityFilter, requirementFilter]);

  const activeGroup = useMemo(() => {
    const currentAssertionId = facts.assertionDetail?.id ?? assertionId;
    if (!currentAssertionId) return null;
    return (
      groups.find((group) =>
        group.assertions.some((assertion) => assertion.id === currentAssertionId),
      ) ?? null
    );
  }, [assertionId, facts.assertionDetail, groups]);

  const evidenceSource = useMemo(() => {
    if (!evidenceAssertionId) return null;
    for (const group of groups) {
      const assertion = group.assertions.find((item) => item.id === evidenceAssertionId);
      if (assertion) {
        const document = documentsByVersionId.get(assertion.documentVersionId);
        return {
          documentVersionId: assertion.documentVersionId,
          filename: document?.originalFilename,
          versionNumber: document?.versionNumber,
        };
      }
    }
    const detail = facts.assertionDetail;
    if (detail && detail.id === evidenceAssertionId) {
      const document = documentsByVersionId.get(detail.documentVersionId);
      return {
        documentVersionId: detail.documentVersionId,
        filename: document?.originalFilename,
        versionNumber: document?.versionNumber,
      };
    }
    return null;
  }, [documentsByVersionId, evidenceAssertionId, facts.assertionDetail, groups]);

  const handleViewEvidence = useCallback(
    (id: string) => {
      setEvidenceAssertionId(id);
      void loadEvidence(id);
    },
    [loadEvidence],
  );

  const handleReview = useCallback(
    (action: ReviewAction, rationale: string | null) => {
      const targetId = facts.assertionDetail?.id;
      if (!targetId) return;
      void facts
        .submitReview(targetId, action, rationale)
        .then(() => {
          void issuesRefresh({ silent: true });
          onReviewed?.();
        })
        .catch(() => {
          // The hook surfaces the failure through mutationError.
        });
    },
    [facts, issuesRefresh, onReviewed],
  );

  const handleCloseDrawer = useCallback(() => {
    clearAssertion();
    onCloseAssertion();
  }, [clearAssertion, onCloseAssertion]);

  const emptyState = useMemo(() => {
    if (counts.assertions > 0) return null;
    const aggregation = pipelineAggregation;
    if (!aggregation) {
      return {
        message: 'No facts have been extracted yet.',
        supportingText: FACTS_SUPPORTING_TEXT,
      };
    }
    if (aggregation.totalCurrentDocuments === 0) {
      return {
        message: 'No documents have been uploaded for this workstream yet.',
        supportingText:
          'Upload the incorporation and registration documents on the Documents tab. Facts appear here once each document has been read and its facts extracted.',
      };
    }
    if (aggregation.hasActivePageProcessing || aggregation.documentsProcessing > 0) {
      return {
        message: `${aggregation.documentsProcessing || 1} document${aggregation.documentsProcessing === 1 ? ' is' : 's are'} being read.`,
        supportingText:
          'Each page is being converted to text and evidence locations. Facts will appear here once reading finishes and extraction runs.',
      };
    }
    if (aggregation.hasActiveStructuredExtraction || aggregation.documentsExtractingFacts > 0) {
      return {
        message: 'Facts are being extracted from the uploaded documents.',
        supportingText:
          'Extraction compares each document value with the Information you entered. This page refreshes when extraction finishes.',
      };
    }
    if (aggregation.documentsAwaitingProcessing > 0) {
      return {
        message: 'Uploaded documents are waiting to be processed.',
        supportingText:
          'Processing starts automatically. Facts will appear here once the documents have been read.',
      };
    }
    if (aggregation.documentsWithFailures > 0) {
      return {
        message: `${aggregation.documentsWithFailures} document${aggregation.documentsWithFailures === 1 ? '' : 's'} could not be processed.`,
        supportingText:
          'Open the Documents tab to see what failed and retry processing. No facts can be extracted until processing succeeds.',
      };
    }
    return {
      message: 'No facts were extracted from the uploaded documents.',
      supportingText: FACTS_SUPPORTING_TEXT,
    };
  }, [counts.assertions, pipelineAggregation]);

  const drawerOpen = Boolean(assertionId) || Boolean(facts.assertionDetail);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Facts & Evidence"
        description="Values read from uploaded documents, compared with the Information you entered."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={facts.loading || facts.refreshing}
            onClick={() => {
              void facts.refresh({ silent: true });
              void issues.refresh({ silent: true });
            }}
          >
            {facts.refreshing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground leading-relaxed">{FACTS_SUPPORTING_TEXT}</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <SummaryTile label="Facts" value={counts.factKeys} />
          <SummaryTile label="Document values" value={counts.assertions} />
          <SummaryTile label="Matched" value={counts.matched} />
          <SummaryTile label="Conflicting" value={counts.conflicting} />
          <SummaryTile label="Pending review" value={counts.pending} />
          <SummaryTile label="Approved" value={counts.approved} />
        </div>

        {facts.error ? (
          <p className="border-l-2 border-destructive pl-3 text-sm text-destructive" role="alert">
            {facts.error}
          </p>
        ) : null}
      </SectionCard>

      <SectionCard title="Extracted facts">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter facts">
            {PRIMARY_FILTERS.map((filter) => (
              <Button
                key={filter.id}
                type="button"
                size="sm"
                variant={primaryFilter === filter.id ? 'default' : 'outline'}
                aria-pressed={primaryFilter === filter.id}
                onClick={() => setPrimaryFilter(filter.id)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <div>
              <label htmlFor="facts-quality-filter" className="sr-only">
                Filter by evidence quality
              </label>
              <select
                id="facts-quality-filter"
                value={qualityFilter}
                onChange={(event) => setQualityFilter(event.target.value as QualityCategory | 'all')}
                className={cn(fieldClassName, 'w-auto py-1.5 text-sm')}
              >
                {QUALITY_FILTERS.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="facts-requirement-filter" className="sr-only">
                Filter by document requirement
              </label>
              <select
                id="facts-requirement-filter"
                value={requirementFilter}
                onChange={(event) => setRequirementFilter(event.target.value)}
                className={cn(fieldClassName, 'w-auto py-1.5 text-sm')}
              >
                <option value="all">All document requirements</option>
                {requirementOptions.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {facts.loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            Loading facts…
          </div>
        ) : emptyState ? (
          <TabEmptyPanel message={emptyState.message} supportingText={emptyState.supportingText} />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <caption className="sr-only">
                Facts extracted from documents with comparison and review status
              </caption>
              <thead className="bg-muted/40">
                <tr>
                  {FACTS_TABLE_COLUMNS.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={FACTS_TABLE_COLUMNS.length}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No facts match the selected filters.
                    </td>
                  </tr>
                ) : (
                  rows.map(({ group, assertion }) => {
                    const factIssues = issuesByFactKey.get(group.factKey) ?? [];
                    const openIssues = factIssues.filter(
                      (issue) => issue.status !== 'resolved' && issue.status !== 'dismissed',
                    );
                    const document = assertion
                      ? documentsByVersionId.get(assertion.documentVersionId)
                      : undefined;
                    const highlighted =
                      Boolean(documentVersionId) &&
                      assertion?.documentVersionId === documentVersionId;

                    return (
                      <tr
                        key={assertion ? assertion.id : group.factKey}
                        className={cn(highlighted ? 'bg-accent/5' : undefined)}
                      >
                        <td className="px-4 py-3 align-top">
                          <p className="font-medium text-foreground">{group.displayLabel}</p>
                          <p className="text-xs text-muted-foreground break-all">{group.factKey}</p>
                        </td>
                        <td className="px-4 py-3 align-top text-foreground max-w-[16rem] break-words">
                          {formatInformationValue(group.informationValue)}
                        </td>
                        <td className="px-4 py-3 align-top max-w-[16rem]">
                          {assertion ? (
                            <>
                              <p className="text-foreground break-words">
                                {assertion.displayValue || 'No value captured'}
                              </p>
                              <p className="text-xs text-muted-foreground break-all">
                                {document
                                  ? `${document.originalFilename} · v${document.versionNumber}`
                                  : 'Source document unavailable'}
                              </p>
                            </>
                          ) : (
                            <span className="text-muted-foreground">No document evidence yet</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {assertion ? (
                            <ComparisonStatusBadge status={assertion.comparisonStatus} />
                          ) : (
                            <StatusBadge label="Not compared" />
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {assertion ? (
                            <ReviewStatusBadge status={assertion.reviewStatus} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {assertion ? (
                            <QualityBadge
                              category={assertion.qualityCategory}
                              score={assertion.qualityScore}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                          {group.assertions.length === 0
                            ? '—'
                            : `${group.assertions.length} document value${group.assertions.length === 1 ? '' : 's'}`}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {openIssues.length === 0 ? (
                            <span className="text-xs text-muted-foreground">None</span>
                          ) : onOpenIssue ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() => onOpenIssue(openIssues[0].id)}
                            >
                              {openIssues.length} open
                            </Button>
                          ) : (
                            <StatusBadge
                              label={`${openIssues.length} open`}
                              tone={
                                openIssues.some((issue) => issue.blocking) ? 'critical' : 'caution'
                              }
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {assertion ? (
                            <div className="flex flex-col gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={() => onOpenAssertion(assertion.id)}
                              >
                                Review
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() => handleViewEvidence(assertion.id)}
                              >
                                <Eye size={12} />
                                Evidence
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <AssertionDetailDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        group={activeGroup}
        assertionDetail={facts.assertionDetail}
        detailLoading={facts.detailLoading}
        mutationPending={facts.mutationPending}
        mutationError={facts.mutationError}
        acknowledgement={facts.acknowledgement}
        onDismissAcknowledgement={facts.clearAcknowledgement}
        onSelectAssertion={onOpenAssertion}
        onReview={handleReview}
        onViewEvidence={handleViewEvidence}
        pipelineDocuments={pipelineDocuments}
      />

      <EvidenceViewer
        open={Boolean(evidenceAssertionId)}
        onClose={() => setEvidenceAssertionId(null)}
        assertionId={evidenceAssertionId}
        evidence={facts.evidence}
        loading={facts.evidenceLoading}
        sourceFilename={evidenceSource?.filename}
        versionNumber={evidenceSource?.versionNumber}
        documentVersionId={evidenceSource?.documentVersionId ?? null}
      />
    </div>
  );
}
