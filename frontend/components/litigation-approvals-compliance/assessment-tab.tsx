'use client';

import { Button } from '@/components/ui/button';
import {
  LAC_ASSESSMENT_GROUP_LABELS,
  LAC_CRITERION_STATE_LABELS,
  type LacCriterionState,
} from '@/lib/litigation-approvals-compliance/assessment';
import { useLitigationApprovalsCompliance } from '@/lib/litigation-approvals-compliance/context';
import { cn } from '@/lib/utils';

const COUNT_STATE_KEYS: Array<{ key: keyof typeof EMPTY_COUNTS; state: LacCriterionState }> = [
  { key: 'reconciled', state: 'reconciled' },
  { key: 'potentialConcern', state: 'potential_concern' },
  { key: 'missingInformation', state: 'missing_information' },
  { key: 'materialityReviewRequired', state: 'materiality_review_required' },
  { key: 'pendingLegalReview', state: 'pending_legal_review' },
  { key: 'approvalRenewalReviewRequired', state: 'approval_renewal_review_required' },
  { key: 'complianceReviewRequired', state: 'compliance_review_required' },
  { key: 'financialReconciliationPending', state: 'financial_reconciliation_pending' },
  { key: 'pendingLinkedWorkstream', state: 'pending_linked_workstream' },
  { key: 'pendingProfessionalConfirmation', state: 'pending_professional_confirmation' },
  { key: 'pendingBoardDetermination', state: 'pending_board_determination' },
  { key: 'notApplicable', state: 'not_applicable' },
];

const EMPTY_COUNTS = {
  reconciled: 0,
  potentialConcern: 0,
  missingInformation: 0,
  materialityReviewRequired: 0,
  pendingLegalReview: 0,
  approvalRenewalReviewRequired: 0,
  complianceReviewRequired: 0,
  financialReconciliationPending: 0,
  pendingLinkedWorkstream: 0,
  pendingProfessionalConfirmation: 0,
  pendingBoardDetermination: 0,
  notApplicable: 0,
};

function stateTone(state: string): string {
  switch (state as LacCriterionState) {
    case 'reconciled':
      return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200';
    case 'potential_concern':
    case 'materiality_review_required':
    case 'approval_renewal_review_required':
    case 'compliance_review_required':
    case 'financial_reconciliation_pending':
    case 'pending_legal_review':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100';
    case 'pending_linked_workstream':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100';
    case 'pending_professional_confirmation':
    case 'pending_board_determination':
      return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-900 dark:text-indigo-100';
    case 'not_applicable':
      return 'border-border bg-background text-muted-foreground';
    default:
      return 'border-border bg-muted/40 text-muted-foreground';
  }
}

function stateLabel(state: string): string {
  return LAC_CRITERION_STATE_LABELS[state as LacCriterionState] ?? state.replaceAll('_', ' ');
}

export function LitigationApprovalsComplianceAssessmentTab() {
  const { assessment, derivedError, refreshDerived } = useLitigationApprovalsCompliance();

  if (!assessment) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {derivedError
            ? 'Legal & Compliance Assessment is temporarily unavailable.'
            : 'Loading Legal & Compliance Assessment…'}
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
          Legal & Compliance Assessment
        </p>
        <h2 className="text-xl font-semibold text-foreground">{assessment.resultLabel}</h2>
        <p className="text-sm text-muted-foreground">{assessment.summary}</p>
        <p className="text-xs text-muted-foreground">
          This is a disclosure readiness view, not a legal opinion or compliant/non-compliant
          determination. An unanswered question is treated as missing information.
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
        <Metric label="Matters recorded" value={String(metrics.matterCount)} />
        <Metric label="Approvals recorded" value={String(metrics.approvalCount)} />
        <Metric label="Sections complete" value={String(metrics.sectionsComplete)} />
        <Metric label="Unanswered confirmations" value={String(metrics.unansweredConfirmations)} />
        <Metric label="Expiring approvals (30 days)" value={String(metrics.expiringApprovals30Days)} />
        <Metric label="Delayed statutory dues" value={String(metrics.delayedStatutoryDues)} />
        <Metric label="Potential concerns" value={String(metrics.potentialConcerns)} />
      </div>

      {assessment.groups.map((group) => {
        if (group.criteria.length === 0) return null;
        return (
          <section key={group.group} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {LAC_ASSESSMENT_GROUP_LABELS[group.group]}
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
