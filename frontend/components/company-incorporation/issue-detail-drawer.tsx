'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SideDrawer } from '@/components/company-incorporation/side-drawer';
import { SessionSaveNotice } from '@/components/company-incorporation/session-save-notice';
import {
  ComparisonStatusBadge,
  IssueStatusBadge,
  QualityBadge,
  ReviewStatusBadge,
  SeverityBadge,
  StatusBadge,
} from '@/components/company-incorporation/status-badge';
import { fieldClassName, labelClassName } from '@/components/company-incorporation/form-primitives';
import {
  formatInformationValue,
  issueTypeLabel,
  resolutionDecisionLabel,
} from '@/lib/company-incorporation/extraction/labels';
import type {
  FactIssueDetail,
  FactIssueLinkedAssertion,
  ResolutionDecision,
  ResolveIssueRequest,
} from '@/lib/company-incorporation/extraction/types';
import { cn } from '@/lib/utils';

const KNOWN_DECISIONS: ResolutionDecision[] = [
  'keep_information',
  'accept_document',
  'mark_document_historical',
  'reject_document_value',
  'request_clarification',
  'escalate_for_professional_review',
  'dismiss_non_material',
];

const DECISION_DESCRIPTIONS: Record<ResolutionDecision, string> = {
  keep_information:
    'The Information value stands. The document value is recorded but not used for disclosures.',
  accept_document:
    'The document value is accepted as correct. The Information section is not changed automatically.',
  mark_document_historical:
    'The document value was correct at an earlier date and is retained as historical context.',
  reject_document_value: 'The document value is not reliable and should not be used.',
  request_clarification: 'Ask the issuer for clarification before this can be settled.',
  escalate_for_professional_review:
    'Refer this to professional review because it requires judgement beyond the working team.',
  dismiss_non_material: 'The difference is not material to the disclosure and needs no further action.',
};

const DECISIONS_REQUIRING_ASSERTION: ResolutionDecision[] = [
  'accept_document',
  'mark_document_historical',
  'reject_document_value',
];

const POSSIBLE_HISTORICAL_GUIDANCE =
  'This document may reflect a former registered office rather than the company’s current address.';

const LOW_QUALITY_NAME_GUIDANCE =
  'The PAN number was read successfully, but the full legal name could not be confidently recovered from the image.';

function isDecision(value: string): value is ResolutionDecision {
  return (KNOWN_DECISIONS as string[]).includes(value);
}

function isLegalNameFactKey(factKey: string): boolean {
  return factKey.endsWith('legalName') || factKey.endsWith('legalNameOnRegistration');
}

function guidanceFor(issue: FactIssueDetail): string | null {
  if (issue.issueType === 'possible_historical_value') {
    return POSSIBLE_HISTORICAL_GUIDANCE;
  }
  if (issue.issueType === 'low_extraction_quality' && isLegalNameFactKey(issue.factKey)) {
    return LOW_QUALITY_NAME_GUIDANCE;
  }
  return null;
}

function formatTimestamp(value: string | null): string {
  if (!value) return 'Unknown time';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function assertionSourceLabel(assertion: FactIssueLinkedAssertion): string {
  const filename = assertion.originalFilename ?? 'Source document unavailable';
  const version =
    typeof assertion.versionNumber === 'number' ? ` · v${assertion.versionNumber}` : '';
  const pages = assertion.pageNumbers.length
    ? ` · Page ${assertion.pageNumbers.join(', ')}`
    : '';
  return `${filename}${version}${pages}`;
}

function roleLabel(role: string): string {
  switch (role) {
    case 'conflicting':
      return 'Conflicting value';
    case 'historical':
      return 'Possible historical value';
    case 'supporting':
      return 'Supporting value';
    case 'primary':
      return 'Primary value';
    default:
      return role ? role.replaceAll('_', ' ') : 'Linked value';
  }
}

interface IssueDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  issueDetail: FactIssueDetail | null;
  detailLoading: boolean;
  mutationPending: boolean;
  mutationError: string | null;
  acknowledgement: string | null;
  informationUpdateRequired: boolean;
  onDismissAcknowledgement?: () => void;
  onResolve: (body: ResolveIssueRequest) => void;
  onViewEvidence: (assertionId: string) => void;
}

export function IssueDetailDrawer({
  open,
  onClose,
  issueDetail,
  detailLoading,
  mutationPending,
  mutationError,
  acknowledgement,
  informationUpdateRequired,
  onDismissAcknowledgement,
  onResolve,
  onViewEvidence,
}: IssueDetailDrawerProps) {
  const [decision, setDecision] = useState<ResolutionDecision | null>(null);
  const [rationale, setRationale] = useState('');
  const [selectedAssertionId, setSelectedAssertionId] = useState<string>('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const availableDecisions = useMemo(
    () => (issueDetail?.suggestedActions ?? []).filter(isDecision),
    [issueDetail],
  );

  const linkedAssertionIds = useMemo(
    () => new Set((issueDetail?.linkedAssertions ?? []).map((item) => item.factAssertionId)),
    [issueDetail],
  );

  useEffect(() => {
    setDecision(null);
    setRationale('');
    setSelectedAssertionId('');
    setValidationMessage(null);
  }, [issueDetail?.id]);

  const guidance = issueDetail ? guidanceFor(issueDetail) : null;
  const isResolved = issueDetail
    ? issueDetail.status === 'resolved' || issueDetail.status === 'dismissed'
    : false;

  const requiresAssertion =
    decision !== null && DECISIONS_REQUIRING_ASSERTION.includes(decision);

  const handleSubmit = () => {
    if (!issueDetail) return;
    if (!decision) {
      setValidationMessage('Select how this question should be resolved.');
      return;
    }
    const trimmed = rationale.trim();
    if (!trimmed) {
      setValidationMessage('A rationale is required to record a resolution.');
      return;
    }
    if (requiresAssertion && !selectedAssertionId) {
      setValidationMessage('Select which document value this decision applies to.');
      return;
    }
    if (selectedAssertionId && !linkedAssertionIds.has(selectedAssertionId)) {
      setValidationMessage('The selected document value is not linked to this question.');
      return;
    }
    setValidationMessage(null);
    onResolve({
      decision,
      rationale: trimmed,
      selectedAssertionId: selectedAssertionId || null,
    });
  };

  const title = issueDetail?.title ?? 'Question detail';

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={issueDetail ? `${issueTypeLabel(issueDetail.issueType)} · ${issueDetail.factKey}` : undefined}
      headerExtra={
        issueDetail ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <SeverityBadge severity={issueDetail.severity} blocking={issueDetail.blocking} />
            <IssueStatusBadge status={issueDetail.status} />
            {issueDetail.blocking ? <StatusBadge label="Blocks disclosures" tone="critical" /> : null}
          </div>
        ) : null
      }
    >
      <div className="space-y-6">
        {acknowledgement ? (
          <SessionSaveNotice message={acknowledgement} onDismiss={onDismissAcknowledgement} />
        ) : null}

        {informationUpdateRequired ? (
          <p
            className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-foreground"
            role="status"
          >
            The document value was accepted, but the Information section has not been changed. Open
            the Information tab and update the relevant field so the two records agree.
          </p>
        ) : null}

        {detailLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            Loading question detail…
          </div>
        ) : null}

        {issueDetail ? (
          <>
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">What was found</h3>
              <p className="text-sm text-foreground leading-relaxed">{issueDetail.description}</p>
              {guidance ? (
                <p className="border-l-2 border-warning pl-3 text-sm text-muted-foreground leading-relaxed">
                  {guidance}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Raised {formatTimestamp(issueDetail.createdAt)}
                {issueDetail.resolvedAt ? ` · Resolved ${formatTimestamp(issueDetail.resolvedAt)}` : ''}
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Information compared with the document</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Information value
                  </p>
                  <p className="mt-1 text-sm text-foreground break-words">
                    {formatInformationValue(issueDetail.informationValueSnapshot)}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Document value{issueDetail.linkedAssertions.length > 1 ? 's' : ''}
                  </p>
                  {issueDetail.linkedAssertions.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      No document value is linked to this question.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {issueDetail.linkedAssertions.map((assertion) => (
                        <li
                          key={assertion.factAssertionId}
                          className="text-sm text-foreground break-words"
                        >
                          {assertion.displayValue ?? formatInformationValue(assertion.normalizedValue)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            {issueDetail.linkedAssertions.length > 0 ? (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Linked document values</h3>
                <ul className="space-y-2">
                  {issueDetail.linkedAssertions.map((assertion) => (
                    <li
                      key={assertion.factAssertionId}
                      className="rounded-md border border-border bg-card p-3 space-y-2"
                    >
                      <p className="text-sm font-medium text-foreground break-words">
                        {assertion.displayValue ?? formatInformationValue(assertion.normalizedValue)}
                      </p>
                      <p className="text-xs text-muted-foreground break-all">
                        {assertionSourceLabel(assertion)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge label={roleLabel(assertion.role)} tone="informative" />
                        {assertion.comparisonStatus ? (
                          <ComparisonStatusBadge status={assertion.comparisonStatus} />
                        ) : null}
                        {assertion.reviewStatus ? (
                          <ReviewStatusBadge status={assertion.reviewStatus} />
                        ) : null}
                        {assertion.qualityCategory ? (
                          <QualityBadge category={assertion.qualityCategory} />
                        ) : null}
                        {assertion.ocrDerived ? (
                          <StatusBadge label="Read by OCR" tone="caution" />
                        ) : null}
                      </div>
                      {assertion.evidenceSummary.length > 0 ? (
                        <blockquote className="border-l-2 border-border pl-3 text-xs text-muted-foreground">
                          {assertion.evidenceSummary.join(' … ')}
                        </blockquote>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => onViewEvidence(assertion.factAssertionId)}
                      >
                        <Eye size={12} />
                        View evidence
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {!isResolved ? (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Record a resolution</h3>
                {availableDecisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No resolution options are available for this question yet.
                  </p>
                ) : (
                  <>
                    <fieldset className="space-y-2" disabled={mutationPending}>
                      <legend className="sr-only">Resolution decision</legend>
                      {availableDecisions.map((option) => (
                        <label
                          key={option}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2',
                            decision === option
                              ? 'border-accent bg-accent/5'
                              : 'border-border bg-card',
                          )}
                        >
                          <input
                            type="radio"
                            name="issue-resolution-decision"
                            value={option}
                            checked={decision === option}
                            onChange={() => setDecision(option)}
                            className="mt-1 h-4 w-4 accent-accent"
                          />
                          <span>
                            <span className="block text-sm font-medium text-foreground">
                              {resolutionDecisionLabel(option)}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {DECISION_DESCRIPTIONS[option]}
                            </span>
                          </span>
                        </label>
                      ))}
                    </fieldset>

                    {issueDetail.linkedAssertions.length > 0 ? (
                      <div>
                        <label htmlFor="issue-selected-assertion" className={labelClassName}>
                          Applies to document value
                          {requiresAssertion ? (
                            <span className="ml-1 text-destructive">*</span>
                          ) : (
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              (optional)
                            </span>
                          )}
                        </label>
                        <select
                          id="issue-selected-assertion"
                          value={selectedAssertionId}
                          disabled={mutationPending}
                          onChange={(event) => setSelectedAssertionId(event.target.value)}
                          className={fieldClassName}
                        >
                          <option value="">Not specific to one document value</option>
                          {issueDetail.linkedAssertions.map((assertion) => (
                            <option
                              key={assertion.factAssertionId}
                              value={assertion.factAssertionId}
                            >
                              {(assertion.displayValue ??
                                formatInformationValue(assertion.normalizedValue)) +
                                ' — ' +
                                (assertion.originalFilename ?? 'Source unavailable')}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    <div>
                      <label htmlFor="issue-resolution-rationale" className={labelClassName}>
                        Rationale
                        <span className="ml-1 text-destructive">*</span>
                      </label>
                      <textarea
                        id="issue-resolution-rationale"
                        rows={3}
                        value={rationale}
                        disabled={mutationPending}
                        onChange={(event) => setRationale(event.target.value)}
                        placeholder="Explain the basis for this resolution."
                        className={cn(fieldClassName, 'resize-y')}
                      />
                    </div>

                    {decision === 'accept_document' ? (
                      <p className="text-xs text-muted-foreground">
                        Accepting the document value records the decision only. The Information
                        section is never updated automatically.
                      </p>
                    ) : null}

                    {validationMessage ? (
                      <p className="text-sm text-destructive" role="alert">
                        {validationMessage}
                      </p>
                    ) : null}
                    {mutationError ? (
                      <p
                        className="border-l-2 border-destructive pl-3 text-sm text-destructive"
                        role="alert"
                      >
                        {mutationError}
                      </p>
                    ) : null}

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={mutationPending}
                      >
                        Cancel
                      </Button>
                      <Button type="button" onClick={handleSubmit} disabled={mutationPending}>
                        {mutationPending ? <Loader2 size={14} className="animate-spin" /> : null}
                        Save resolution
                      </Button>
                    </div>
                  </>
                )}
              </section>
            ) : null}

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Resolution history</h3>
              {issueDetail.resolutionHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No resolution has been recorded for this question yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {issueDetail.resolutionHistory.map((entry) => (
                    <li key={entry.id} className="rounded-md border border-border px-3 py-2 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={resolutionDecisionLabel(entry.decision)} />
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(entry.createdAt)}
                        </span>
                        {entry.resolverDisplayName ? (
                          <span className="text-xs text-muted-foreground">
                            by {entry.resolverDisplayName}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-foreground break-words">{entry.rationale}</p>
                      <p className="text-xs text-muted-foreground break-words">
                        Information at the time: {formatInformationValue(entry.informationValueSnapshot)}
                        {' · '}
                        Document value: {formatInformationValue(entry.documentValueSnapshot)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </SideDrawer>
  );
}
