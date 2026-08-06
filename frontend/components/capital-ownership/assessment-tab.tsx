'use client';

import {
  CAPITAL_CRITERION_STATE_LABELS,
  type CapitalCriterionState,
} from '@/lib/capital-ownership/assessment';
import { useCapitalOwnership } from '@/lib/capital-ownership/context';
import {
  EM_DASH,
  formatMoneyCompact,
  formatPercent,
  formatShares,
} from '@/lib/capital-ownership/format';
import { cn } from '@/lib/utils';

function stateTone(state: string): string {
  switch (state as CapitalCriterionState) {
    case 'reconciled':
      return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200';
    case 'potential_inconsistency':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100';
    case 'pending_professional_confirmation':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100';
    case 'not_applicable':
      return 'border-border bg-background text-muted-foreground';
    default:
      return 'border-border bg-muted/40 text-muted-foreground';
  }
}

function stateLabel(state: string): string {
  return (
    CAPITAL_CRITERION_STATE_LABELS[state as CapitalCriterionState] ??
    state.replaceAll('_', ' ')
  );
}

export function CapitalOwnershipAssessmentTab() {
  const { assessment, isLoading, isDirty } = useCapitalOwnership();

  if (isLoading || !assessment) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading Capital Assessment…
      </p>
    );
  }

  const { metrics, counts } = assessment;

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Capital Assessment
        </p>
        <h2 className="text-xl font-semibold text-foreground">{assessment.resultLabel}</h2>
        <p className="text-sm text-muted-foreground">{assessment.summary}</p>
        <p className="text-xs text-muted-foreground">
          This is not a pass or fail decision. An unanswered question is treated as missing
          information, never as a negative declaration. Registrar, depository and professional
          confirmation remain required.
        </p>
        {isDirty ? (
          <p className="text-xs text-muted-foreground">
            Assessment reflects the last saved workspace. Keep section updates to refresh these
            checks.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          {(Object.keys(counts) as CapitalCriterionState[])
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
        <Metric label="Current equity shares" value={formatShares(metrics.currentEquityShares)} />
        <Metric
          label="Paid-up equity capital"
          value={formatMoneyCompact(metrics.paidUpEquityCapital)}
        />
        <Metric
          label="Post-issue equity shares"
          value={formatShares(metrics.postIssueEquityShares)}
        />
        <Metric
          label="Shares offered for sale"
          value={formatShares(metrics.totalSharesOfferedForSale)}
        />
        <Metric
          label="Promoter pre-issue holding"
          value={formatPercent(metrics.promoterPreIssuePercentage)}
        />
        <Metric
          label="Promoter post-issue holding"
          value={formatPercent(metrics.promoterPostIssuePercentage)}
        />
        <Metric
          label="Promoter dilution (pp)"
          value={formatPercent(metrics.promoterDilutionPercentagePoints)}
        />
        <Metric
          label="Potential dilution from convertibles"
          value={formatPercent(metrics.potentialDilutionFromConvertibles)}
        />
        <Metric
          label="Minimum contribution required"
          value={formatShares(metrics.minimumContributionRequiredShares)}
        />
        <Metric
          label="Eligible contribution shares"
          value={formatShares(metrics.eligibleContributionShares)}
        />
        <Metric
          label="Contribution shortfall"
          value={formatShares(metrics.contributionShortfallShares)}
        />
        <Metric label="Unreconciled checks" value={String(metrics.unreconciledChecks)} />
        <Metric
          label="Unanswered confirmations"
          value={String(metrics.unansweredConfirmations)}
        />
        <Metric label="Sections complete" value={String(metrics.sectionsComplete)} />
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
                  {criterion.expected || criterion.actual || criterion.difference ? (
                    <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[11px] opacity-90">
                      <div className="flex gap-1">
                        <dt>Expected</dt>
                        <dd className="font-medium tabular-nums">
                          {criterion.expected ? formatShares(criterion.expected) : EM_DASH}
                        </dd>
                      </div>
                      <div className="flex gap-1">
                        <dt>Actual</dt>
                        <dd className="font-medium tabular-nums">
                          {criterion.actual ? formatShares(criterion.actual) : EM_DASH}
                        </dd>
                      </div>
                      <div className="flex gap-1">
                        <dt>Difference</dt>
                        <dd className="font-medium tabular-nums">
                          {criterion.difference ? formatShares(criterion.difference) : EM_DASH}
                        </dd>
                      </div>
                    </dl>
                  ) : null}
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
