'use client';

import { Button } from '@/components/ui/button';
import {
  GROUP_ASSESSMENT_GROUP_LABELS,
  GROUP_CRITERION_STATE_LABELS,
  type GroupCriterionState,
} from '@/lib/group-entities-related-parties/assessment';
import { useGroupEntities } from '@/lib/group-entities-related-parties/context';
import { cn } from '@/lib/utils';

const COUNT_STATE_KEYS: Array<{ key: keyof typeof EMPTY_COUNTS; state: GroupCriterionState }> = [
  { key: 'reconciled', state: 'reconciled' },
  { key: 'potentialConcern', state: 'potential_concern' },
  { key: 'missingInformation', state: 'missing_information' },
  { key: 'unresolvedRelationship', state: 'unresolved_relationship' },
  { key: 'classificationReviewRequired', state: 'classification_review_required' },
  { key: 'financialReconciliationPending', state: 'financial_reconciliation_pending' },
  { key: 'pendingEntityInformation', state: 'pending_entity_information' },
  { key: 'pendingLinkedWorkstream', state: 'pending_linked_workstream' },
  { key: 'pendingBoardDetermination', state: 'pending_board_determination' },
  { key: 'pendingProfessionalConfirmation', state: 'pending_professional_confirmation' },
  { key: 'notApplicable', state: 'not_applicable' },
];

const EMPTY_COUNTS = {
  reconciled: 0,
  potentialConcern: 0,
  missingInformation: 0,
  unresolvedRelationship: 0,
  classificationReviewRequired: 0,
  financialReconciliationPending: 0,
  pendingEntityInformation: 0,
  pendingLinkedWorkstream: 0,
  pendingBoardDetermination: 0,
  pendingProfessionalConfirmation: 0,
  notApplicable: 0,
};

function stateTone(state: string): string {
  switch (state as GroupCriterionState) {
    case 'reconciled':
      return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200';
    case 'potential_concern':
    case 'classification_review_required':
    case 'financial_reconciliation_pending':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100';
    case 'unresolved_relationship':
      return 'border-destructive/30 bg-destructive/10 text-destructive';
    case 'pending_linked_workstream':
    case 'pending_board_determination':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100';
    case 'pending_professional_confirmation':
      return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-900 dark:text-indigo-100';
    case 'not_applicable':
      return 'border-border bg-background text-muted-foreground';
    default:
      return 'border-border bg-muted/40 text-muted-foreground';
  }
}

function stateLabel(state: string): string {
  return GROUP_CRITERION_STATE_LABELS[state as GroupCriterionState] ?? state.replaceAll('_', ' ');
}

export function GroupEntitiesAssessmentTab() {
  const { assessment, derivedError, refreshDerived } = useGroupEntities();

  if (!assessment) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {derivedError
            ? 'Group & RPT Assessment is temporarily unavailable.'
            : 'Loading Group & RPT Assessment…'}
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
          Group & RPT Assessment
        </p>
        <h2 className="text-xl font-semibold text-foreground">{assessment.resultLabel}</h2>
        <p className="text-sm text-muted-foreground">{assessment.summary}</p>
        <p className="text-xs text-muted-foreground">
          This is a disclosure readiness view, not a healthy/unhealthy group, compliant/non-compliant
          RPT or regulator-approved score. An unanswered question is treated as missing information.
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
        <Metric label="Entities recorded" value={String(metrics.entityCount)} />
        <Metric label="Sections complete" value={String(metrics.sectionsComplete)} />
        <Metric label="Unanswered confirmations" value={String(metrics.unansweredConfirmations)} />
        <Metric label="RPT transactions" value={String(metrics.rptTransactionCount)} />
        <Metric label="Pending Board determinations" value={String(metrics.pendingBoardDeterminations)} />
        <Metric label="Potential concerns" value={String(metrics.potentialConcerns)} />
      </div>

      {assessment.groups.map((group) => {
        if (group.criteria.length === 0) return null;
        return (
          <section key={group.group} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {GROUP_ASSESSMENT_GROUP_LABELS[group.group]}
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
