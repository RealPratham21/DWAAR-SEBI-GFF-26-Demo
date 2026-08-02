'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SideDrawer } from '@/components/company-incorporation/side-drawer';
import { SessionSaveNotice } from '@/components/company-incorporation/session-save-notice';
import {
  ComparisonStatusBadge,
  QualityBadge,
  ReviewStatusBadge,
  StatusBadge,
} from '@/components/company-incorporation/status-badge';
import { fieldClassName, labelClassName } from '@/components/company-incorporation/form-primitives';
import { formatInformationValue } from '@/lib/company-incorporation/extraction/labels';
import type {
  DocumentPipelineSummaryItem,
  FactAssertionDetail,
  FactAssertionSummary,
  FactGroup,
  ReviewAction,
} from '@/lib/company-incorporation/extraction/types';
import { cn } from '@/lib/utils';

interface ReviewActionOption {
  action: ReviewAction;
  label: string;
  description: string;
  rationaleRequired: boolean;
}

const REVIEW_ACTIONS: ReviewActionOption[] = [
  {
    action: 'approve',
    label: 'Approve',
    description: 'Record this document value as reviewed and accepted for DRHP use.',
    rationaleRequired: false,
  },
  {
    action: 'reject',
    label: 'Reject',
    description: 'Record that this document value should not be relied on.',
    rationaleRequired: true,
  },
  {
    action: 'mark_historical',
    label: 'Mark historical',
    description: 'Record that this value was correct in the past but is superseded.',
    rationaleRequired: true,
  },
  {
    action: 'return_to_pending',
    label: 'Return to pending',
    description: 'Undo the recorded decision and return this assertion to pending review.',
    rationaleRequired: true,
  },
];

function reviewActionLabel(action: string): string {
  const match = REVIEW_ACTIONS.find((option) => option.action === action);
  return match ? match.label : action.replaceAll('_', ' ');
}

function formatTimestamp(value: string | null): string {
  if (!value) return 'Unknown time';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function extractorKindLabel(kind: string): string {
  switch (kind) {
    case 'deterministic':
      return 'Deterministic extractor';
    case 'semantic':
      return 'Semantic extractor';
    case 'merged':
      return 'Deterministic + semantic agreement';
    default:
      return kind ? kind.replaceAll('_', ' ') : 'Unknown extractor';
  }
}

function temporalityLabel(value: string): string {
  switch (value) {
    case 'current':
      return 'Presented as current';
    case 'historical':
      return 'Presented as historical';
    default:
      return value ? value.replaceAll('_', ' ') : 'Unknown';
  }
}

function validationLabel(value: string): string {
  switch (value) {
    case 'valid':
      return 'Format valid';
    case 'invalid':
      return 'Format invalid';
    case 'not_applicable':
      return 'No format check';
    default:
      return value ? value.replaceAll('_', ' ') : 'Unknown';
  }
}

function qualitySignalText(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(Math.round(value * 1000) / 1000);
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return 'Complex value';
  }
}

interface AssertionDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  group: FactGroup | null;
  assertionDetail: FactAssertionDetail | null;
  detailLoading: boolean;
  mutationPending: boolean;
  mutationError: string | null;
  acknowledgement: string | null;
  onDismissAcknowledgement?: () => void;
  onSelectAssertion: (assertionId: string) => void;
  onReview: (action: ReviewAction, rationale: string | null) => void;
  onViewEvidence: (assertionId: string) => void;
  pipelineDocuments: DocumentPipelineSummaryItem[];
}

export function AssertionDetailDrawer({
  open,
  onClose,
  group,
  assertionDetail,
  detailLoading,
  mutationPending,
  mutationError,
  acknowledgement,
  onDismissAcknowledgement,
  onSelectAssertion,
  onReview,
  onViewEvidence,
  pipelineDocuments,
}: AssertionDetailDrawerProps) {
  const [selectedAction, setSelectedAction] = useState<ReviewAction>('approve');
  const [rationale, setRationale] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const documentsByVersionId = useMemo(() => {
    const map = new Map<string, DocumentPipelineSummaryItem>();
    pipelineDocuments.forEach((item) => map.set(item.documentVersionId, item));
    return map;
  }, [pipelineDocuments]);

  useEffect(() => {
    setSelectedAction('approve');
    setRationale('');
    setValidationMessage(null);
  }, [assertionDetail?.id]);

  const activeOption =
    REVIEW_ACTIONS.find((option) => option.action === selectedAction) ?? REVIEW_ACTIONS[0];

  const assertions: FactAssertionSummary[] = group?.assertions ?? [];

  const sourceLabel = (documentVersionId: string): string => {
    const document = documentsByVersionId.get(documentVersionId);
    if (!document) return 'Source document unavailable';
    return `${document.originalFilename} · v${document.versionNumber}`;
  };

  const handleSubmit = () => {
    if (!assertionDetail) return;
    const trimmed = rationale.trim();
    if (activeOption.rationaleRequired && !trimmed) {
      setValidationMessage('A rationale is required for this decision.');
      return;
    }
    setValidationMessage(null);
    onReview(selectedAction, trimmed ? trimmed : null);
  };

  const title = group?.displayLabel ?? assertionDetail?.factKey ?? 'Fact detail';
  const subtitle = group?.factKey ?? assertionDetail?.factKey;

  return (
    <SideDrawer open={open} onClose={onClose} title={title} subtitle={subtitle}>
      <div className="space-y-6">
        {acknowledgement ? (
          <SessionSaveNotice message={acknowledgement} onDismiss={onDismissAcknowledgement} />
        ) : null}

        {group ? (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Information value</h3>
            <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-foreground break-words">
              {formatInformationValue(group.informationValue)}
            </p>
            <p className="text-xs text-muted-foreground">
              Reviewing a document value here does not change the Information section. Update
              Information separately if the document value should replace it.
            </p>
          </section>
        ) : null}

        {assertions.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Document values ({assertions.length})
            </h3>
            <ul className="space-y-2">
              {assertions.map((assertion) => {
                const isActive = assertion.id === assertionDetail?.id;
                return (
                  <li key={assertion.id}>
                    <div
                      className={cn(
                        'rounded-md border p-3 space-y-2',
                        isActive ? 'border-accent bg-accent/5' : 'border-border bg-card',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectAssertion(assertion.id)}
                        aria-pressed={isActive}
                        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        <p className="text-sm font-medium text-foreground break-words">
                          {assertion.displayValue || 'No value captured'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground break-all">
                          {sourceLabel(assertion.documentVersionId)}
                        </p>
                      </button>
                      <div className="flex flex-wrap gap-1.5">
                        <ComparisonStatusBadge status={assertion.comparisonStatus} />
                        <ReviewStatusBadge status={assertion.reviewStatus} />
                        <QualityBadge
                          category={assertion.qualityCategory}
                          score={assertion.qualityScore}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => onViewEvidence(assertion.id)}
                      >
                        <Eye size={12} />
                        View evidence
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-muted-foreground">
              A document value marked “Matched” agrees with the Information value. It is still
              pending review until a reviewer approves it.
            </p>
          </section>
        ) : null}

        {detailLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            Loading assertion detail…
          </div>
        ) : null}

        {assertionDetail ? (
          <>
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Selected document value</h3>
              <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-foreground break-words">
                {assertionDetail.displayValue || 'No value captured'}
              </p>
              <dl className="grid grid-cols-[minmax(0,10rem)_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Source</dt>
                <dd className="text-foreground break-all">
                  {sourceLabel(assertionDetail.documentVersionId)}
                </dd>
                <dt className="text-muted-foreground">Requirement</dt>
                <dd className="text-foreground">
                  {documentsByVersionId.get(assertionDetail.documentVersionId)?.requirementLabel ??
                    assertionDetail.requirementKey}
                </dd>
                <dt className="text-muted-foreground">Extractor</dt>
                <dd className="text-foreground">
                  {extractorKindLabel(assertionDetail.extractorKind)}
                </dd>
                <dt className="text-muted-foreground">Validation</dt>
                <dd className="text-foreground">
                  {validationLabel(assertionDetail.validationStatus)}
                </dd>
                <dt className="text-muted-foreground">Temporality</dt>
                <dd className="text-foreground">
                  {temporalityLabel(assertionDetail.sourceTemporality)}
                </dd>
                <dt className="text-muted-foreground">Normalized value</dt>
                <dd className="text-foreground break-words">
                  {formatInformationValue(assertionDetail.normalizedValue)}
                </dd>
              </dl>
              <div className="flex flex-wrap gap-1.5">
                <ComparisonStatusBadge status={assertionDetail.comparisonStatus} />
                <ReviewStatusBadge status={assertionDetail.reviewStatus} />
                <QualityBadge
                  category={assertionDetail.qualityCategory}
                  score={assertionDetail.qualityScore}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onViewEvidence(assertionDetail.id)}
              >
                <Eye size={14} />
                View evidence on the page
              </Button>
            </section>

            {Object.keys(assertionDetail.qualitySignals).length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Extraction quality signals</h3>
                <dl className="grid grid-cols-[minmax(0,12rem)_1fr] gap-x-4 gap-y-1 text-xs">
                  {Object.entries(assertionDetail.qualitySignals).map(([key, value]) => (
                    <div key={key} className="contents">
                      <dt className="text-muted-foreground break-words">
                        {key.replaceAll('_', ' ')}
                      </dt>
                      <dd className="text-foreground break-words">{qualitySignalText(value)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Record a review decision</h3>
              <fieldset className="space-y-2" disabled={mutationPending}>
                <legend className="sr-only">Review decision</legend>
                {REVIEW_ACTIONS.map((option) => (
                  <label
                    key={option.action}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2',
                      selectedAction === option.action
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-card',
                    )}
                  >
                    <input
                      type="radio"
                      name="assertion-review-action"
                      value={option.action}
                      checked={selectedAction === option.action}
                      onChange={() => setSelectedAction(option.action)}
                      className="mt-1 h-4 w-4 accent-accent"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        {option.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>

              <div>
                <label htmlFor="assertion-review-rationale" className={labelClassName}>
                  Rationale
                  {activeOption.rationaleRequired ? (
                    <span className="ml-1 text-destructive">*</span>
                  ) : (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      (optional)
                    </span>
                  )}
                </label>
                <textarea
                  id="assertion-review-rationale"
                  rows={3}
                  value={rationale}
                  disabled={mutationPending}
                  onChange={(event) => setRationale(event.target.value)}
                  placeholder="Explain the basis for this decision."
                  className={cn(fieldClassName, 'resize-y')}
                />
              </div>

              {validationMessage ? (
                <p className="text-sm text-destructive" role="alert">
                  {validationMessage}
                </p>
              ) : null}
              {mutationError ? (
                <p className="border-l-2 border-destructive pl-3 text-sm text-destructive" role="alert">
                  {mutationError}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={mutationPending}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={mutationPending}>
                  {mutationPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Save decision
                </Button>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Review history</h3>
              {assertionDetail.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No review decision has been recorded for this document value yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {assertionDetail.reviews.map((entry) => (
                    <li key={entry.id} className="rounded-md border border-border px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={reviewActionLabel(entry.action)} />
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(entry.createdAt)}
                        </span>
                      </div>
                      {entry.rationale ? (
                        <p className="mt-1 text-sm text-foreground break-words">{entry.rationale}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}

        {!detailLoading && !assertionDetail && assertions.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Select a document value above to see its detail and record a review decision.
          </p>
        ) : null}
      </div>
    </SideDrawer>
  );
}
