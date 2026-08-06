'use client';

import {
  BUSINESS_CRITERION_STATE_LABELS,
  type BusinessCriterionState,
} from '@/lib/business-operations/assessment';
import { useBusinessOperations } from '@/lib/business-operations/context';
import { EM_DASH, formatCount } from '@/lib/business-operations/format';
import { cn } from '@/lib/utils';

function stateTone(state: string): string {
  switch (state as BusinessCriterionState) {
    case 'substantiated':
      return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200';
    case 'potential_inconsistency':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100';
    case 'pending_professional_confirmation':
    case 'pending_supporting_source':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100';
    case 'pending_linked_workstream':
      return 'border-violet-500/30 bg-violet-500/10 text-violet-900 dark:text-violet-100';
    case 'not_applicable':
      return 'border-border bg-background text-muted-foreground';
    default:
      return 'border-border bg-muted/40 text-muted-foreground';
  }
}

function stateLabel(state: string): string {
  return (
    BUSINESS_CRITERION_STATE_LABELS[state as BusinessCriterionState] ??
    state.replaceAll('_', ' ')
  );
}

export function BusinessOperationsAssessmentTab() {
  const { assessment, isLoading, isDirty, derivedError } = useBusinessOperations();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading Business Assessment…
      </p>
    );
  }

  if (!assessment) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {derivedError ??
          'Business Assessment is temporarily unavailable. Information sections remain usable.'}
      </p>
    );
  }

  const { metrics, counts } = assessment;

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Business Assessment
        </p>
        <h2 className="text-xl font-semibold text-foreground">{assessment.resultLabel}</h2>
        <p className="text-sm text-muted-foreground">{assessment.summary}</p>
        <p className="text-xs text-muted-foreground">
          This is a disclosure readiness view, not a strong/weak or investment-quality score. An
          unanswered question is treated as missing information, never as a negative declaration.
        </p>
        {isDirty ? (
          <p className="text-xs text-muted-foreground">
            Assessment reflects the last saved workspace. Keep section updates to refresh it.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          {(Object.keys(counts) as BusinessCriterionState[])
            .filter((state) => counts[state] > 0)
            .map((state) => (
              <span
                key={state}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-[11px] font-medium',
                  stateTone(state),
                )}
              >
                {stateLabel(state)}: {counts[state]}
              </span>
            ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Products / services" value={String(metrics.products)} />
        <Metric label="Facilities" value={String(metrics.facilities)} />
        <Metric label="Sections complete" value={String(metrics.sectionsComplete)} />
        <Metric
          label="Unanswered confirmations"
          value={String(metrics.unansweredConfirmations)}
        />
        <Metric label="Unreconciled checks" value={String(metrics.unreconciledChecks)} />
        <Metric
          label="Largest segment"
          value={metrics.largestSegmentLabel.trim() ? metrics.largestSegmentLabel : EM_DASH}
        />
        <Metric
          label="Latest headcount"
          value={
            metrics.latestHeadcount.trim()
              ? formatCount(metrics.latestHeadcount)
              : EM_DASH
          }
        />
      </div>

      {assessment.groups.map((group) => {
        if (group.criteria.length === 0) return null;
        return (
          <section key={group.group} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">{group.label}</h3>
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
