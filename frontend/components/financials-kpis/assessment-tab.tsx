'use client';

import {
  FINANCIAL_CRITERION_STATE_LABELS,
  type FinancialCriterionState,
} from '@/lib/financials-kpis/assessment';
import { useFinancialsKpis } from '@/lib/financials-kpis/context';
import { EM_DASH, formatMoney } from '@/lib/financials-kpis/format';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COUNT_STATE_KEYS: Array<{ key: keyof typeof EMPTY_COUNTS; state: FinancialCriterionState }> = [
  { key: 'reconciled', state: 'reconciled' },
  { key: 'potentialInconsistency', state: 'potential_inconsistency' },
  { key: 'missingInformation', state: 'missing_information' },
  { key: 'pendingRestatement', state: 'pending_restatement' },
  { key: 'pendingAuditorConfirmation', state: 'pending_auditor_confirmation' },
  { key: 'pendingLinkedWorkstream', state: 'pending_linked_workstream' },
  { key: 'pendingKpiCertification', state: 'pending_kpi_certification' },
  { key: 'pendingProfessionalConfirmation', state: 'pending_professional_confirmation' },
  { key: 'notApplicable', state: 'not_applicable' },
];

const EMPTY_COUNTS = {
  reconciled: 0,
  potentialInconsistency: 0,
  missingInformation: 0,
  pendingRestatement: 0,
  pendingAuditorConfirmation: 0,
  pendingLinkedWorkstream: 0,
  pendingKpiCertification: 0,
  pendingProfessionalConfirmation: 0,
  notApplicable: 0,
};

function stateTone(state: string): string {
  switch (state as FinancialCriterionState) {
    case 'reconciled':
      return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200';
    case 'potential_inconsistency':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100';
    case 'pending_restatement':
    case 'pending_auditor_confirmation':
    case 'pending_kpi_certification':
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
    FINANCIAL_CRITERION_STATE_LABELS[state as FinancialCriterionState] ??
    state.replaceAll('_', ' ')
  );
}

export function FinancialsKpisAssessmentTab() {
  const { assessment, derivedError, refreshDerived } = useFinancialsKpis();

  if (!assessment) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {derivedError
            ? 'Financial Assessment is temporarily unavailable.'
            : 'Loading Financial Assessment…'}
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
  const displayUnit = 'rupees';

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Financial Assessment
        </p>
        <h2 className="text-xl font-semibold text-foreground">{assessment.resultLabel}</h2>
        <p className="text-sm text-muted-foreground">{assessment.summary}</p>
        <p className="text-xs text-muted-foreground">
          This is a disclosure readiness view, not a strong/weak or investment-quality score. An
          unanswered question is treated as missing information, never as a negative declaration.
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
        <Metric label="Financial periods" value={String(metrics.periods)} />
        <Metric label="Sections complete" value={String(metrics.sectionsComplete)} />
        <Metric
          label="Unanswered confirmations"
          value={String(metrics.unansweredConfirmations)}
        />
        <Metric label="Unreconciled checks" value={String(metrics.unreconciledChecks)} />
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

      <p className="text-xs text-muted-foreground">
        Latest revenue and PAT from the model are shown for context only —{' '}
        {assessment.metrics.blockingConcerns > 0
          ? `${assessment.metrics.blockingConcerns} potential inconsistency(ies) need review.`
          : 'no blocking inconsistencies flagged yet.'}
        {' '}
        Display unit: {displayUnit === 'rupees' ? EM_DASH : displayUnit}.
      </p>
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
