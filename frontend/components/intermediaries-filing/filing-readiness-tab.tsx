'use client';

import { Button } from '@/components/ui/button';
import {
  IF_ASSESSMENT_GROUP_LABELS,
  IF_CRITERION_STATE_LABELS,
  type IfAssessmentResponse,
  type IfCriterionState,
} from '@/lib/intermediaries-filing/assessment';
import { useIntermediariesFiling } from '@/lib/intermediaries-filing/context';
import { cn } from '@/lib/utils';

const COUNT_STATE_KEYS: Array<{ key: keyof IfAssessmentResponse['counts']; state: IfCriterionState }> = [
  { key: 'ready', state: 'ready' },
  { key: 'potentialConcern', state: 'potential_concern' },
  { key: 'missingInformation', state: 'missing_information' },
  { key: 'appointmentPending', state: 'appointment_pending' },
  { key: 'agreementPending', state: 'agreement_pending' },
  { key: 'certificatePending', state: 'certificate_pending' },
  { key: 'consentPending', state: 'consent_pending' },
  { key: 'exchangeQueryPending', state: 'exchange_query_pending' },
  { key: 'filingPending', state: 'filing_pending' },
  { key: 'approvalPending', state: 'approval_pending' },
  { key: 'underwritingPending', state: 'underwriting_pending' },
  { key: 'marketMakingPending', state: 'market_making_pending' },
  { key: 'issueInfrastructurePending', state: 'issue_infrastructure_pending' },
  { key: 'listingActionPending', state: 'listing_action_pending' },
  { key: 'pendingLinkedWorkstream', state: 'pending_linked_workstream' },
  { key: 'pendingProfessionalConfirmation', state: 'pending_professional_confirmation' },
  { key: 'notApplicable', state: 'not_applicable' },
  { key: 'notYetDue', state: 'not_yet_due' },
];

function stateTone(state: string): string {
  switch (state as IfCriterionState) {
    case 'ready':
      return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200';
    case 'potential_concern':
    case 'exchange_query_pending':
    case 'underwriting_pending':
    case 'market_making_pending':
    case 'issue_infrastructure_pending':
    case 'listing_action_pending':
    case 'approval_pending':
    case 'certificate_pending':
    case 'consent_pending':
    case 'agreement_pending':
    case 'appointment_pending':
    case 'filing_pending':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100';
    case 'pending_linked_workstream':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100';
    case 'pending_professional_confirmation':
      return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-900 dark:text-indigo-100';
    case 'not_yet_due':
    case 'not_applicable':
      return 'border-border bg-background text-muted-foreground';
    default:
      return 'border-border bg-muted/40 text-muted-foreground';
  }
}

function stateLabel(state: string): string {
  return IF_CRITERION_STATE_LABELS[state as IfCriterionState] ?? state.replaceAll('_', ' ');
}

export function IntermediariesFilingFilingReadinessTab() {
  const { assessment, derivedError, refreshDerived } = useIntermediariesFiling();

  if (!assessment) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {derivedError
            ? 'Filing Readiness is temporarily unavailable.'
            : 'Loading Filing Readiness…'}
        </p>
        {derivedError ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void refreshDerived()}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  const { metrics, counts } = assessment;

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Filing Readiness
        </p>
        <h2 className="text-xl font-semibold text-foreground">{assessment.resultLabel}</h2>
        <p className="text-sm text-muted-foreground">{assessment.summary}</p>
        <p className="text-xs text-muted-foreground">
          This is a process-focused filing readiness view, not an IPO approval or regulator
          clearance determination. An unanswered question is treated as missing information.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {COUNT_STATE_KEYS.filter(({ key }) => (counts[key] ?? 0) > 0).map(({ key, state }) => (
            <span
              key={key}
              className={cn(
                'rounded-md border px-2.5 py-1 text-[11px] font-medium',
                stateTone(state),
              )}
            >
              {stateLabel(state)}: {counts[key]}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Intermediaries recorded" value={String(metrics.intermediaryCount)} />
        <Metric label="Filings recorded" value={String(metrics.filingCount)} />
        <Metric label="Open exchange queries" value={String(metrics.openQueryCount)} />
        <Metric label="Sections complete" value={String(metrics.sectionsComplete)} />
        <Metric
          label="Unanswered confirmations"
          value={String(metrics.unansweredConfirmations)}
        />
        <Metric
          label="Reconciliation mismatches"
          value={String(metrics.reconciliationMismatchCount)}
        />
        <Metric label="Potential concerns" value={String(metrics.potentialConcerns)} />
      </div>

      {assessment.groups.map((group) => {
        if (group.criteria.length === 0) return null;
        return (
          <section key={group.group} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {IF_ASSESSMENT_GROUP_LABELS[group.group]}
              </h3>
              <span
                className={cn(
                  'rounded-md border px-2.5 py-1 text-[11px] font-medium',
                  stateTone(group.headlineState),
                )}
              >
                {stateLabel(group.headlineState)}
              </span>
            </div>
            <ul className="space-y-2">
              {group.criteria.map((criterion) => (
                <li
                  key={criterion.id}
                  className={cn('rounded-md border px-4 py-3', stateTone(criterion.state))}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{criterion.label}</p>
                    <span className="text-[11px] font-semibold uppercase tracking-wide">
                      {stateLabel(criterion.state)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs opacity-90">{criterion.reason}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
