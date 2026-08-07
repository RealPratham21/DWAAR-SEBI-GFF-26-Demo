'use client';

import { Button } from '@/components/ui/button';
import {
  BAC_ASSESSMENT_GROUP_LABELS,
  BAC_CRITERION_STATE_LABELS,
  type BacCriterionState,
} from '@/lib/borrowings-assets-contracts/assessment';
import { useBorrowingsAssetsContracts } from '@/lib/borrowings-assets-contracts/context';
import { cn } from '@/lib/utils';

const COUNT_STATE_KEYS: Array<{ key: keyof typeof EMPTY_COUNTS; state: BacCriterionState }> = [
  { key: 'reconciled', state: 'reconciled' },
  { key: 'potentialConcern', state: 'potential_concern' },
  { key: 'missingInformation', state: 'missing_information' },
  { key: 'pendingChargeRegistration', state: 'pending_charge_registration' },
  { key: 'pendingLenderConsent', state: 'pending_lender_consent' },
  { key: 'covenantReviewRequired', state: 'covenant_review_required' },
  { key: 'financialReconciliationPending', state: 'financial_reconciliation_pending' },
  { key: 'titleReviewRequired', state: 'title_review_required' },
  { key: 'contractReviewRequired', state: 'contract_review_required' },
  { key: 'pendingLinkedWorkstream', state: 'pending_linked_workstream' },
  { key: 'pendingProfessionalConfirmation', state: 'pending_professional_confirmation' },
  { key: 'notApplicable', state: 'not_applicable' },
];

const EMPTY_COUNTS = {
  reconciled: 0,
  potentialConcern: 0,
  missingInformation: 0,
  pendingChargeRegistration: 0,
  pendingLenderConsent: 0,
  covenantReviewRequired: 0,
  financialReconciliationPending: 0,
  titleReviewRequired: 0,
  contractReviewRequired: 0,
  pendingLinkedWorkstream: 0,
  pendingProfessionalConfirmation: 0,
  notApplicable: 0,
};

function stateTone(state: string): string {
  switch (state as BacCriterionState) {
    case 'reconciled':
      return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200';
    case 'potential_concern':
    case 'covenant_review_required':
    case 'financial_reconciliation_pending':
    case 'title_review_required':
    case 'contract_review_required':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100';
    case 'pending_charge_registration':
    case 'pending_lender_consent':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100';
    case 'pending_linked_workstream':
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
  return BAC_CRITERION_STATE_LABELS[state as BacCriterionState] ?? state.replaceAll('_', ' ');
}

export function BorrowingsAssetsContractsAssessmentTab() {
  const { assessment, derivedError, refreshDerived } = useBorrowingsAssetsContracts();

  if (!assessment) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {derivedError
            ? 'Borrowings & Contracts Assessment is temporarily unavailable.'
            : 'Loading Borrowings & Contracts Assessment…'}
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
          Borrowings & Contracts Assessment
        </p>
        <h2 className="text-xl font-semibold text-foreground">{assessment.resultLabel}</h2>
        <p className="text-sm text-muted-foreground">{assessment.summary}</p>
        <p className="text-xs text-muted-foreground">
          This is a disclosure readiness view, not a credit rating, covenant compliance certificate or
          regulator-approved score. An unanswered question is treated as missing information.
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
        <Metric label="Facilities recorded" value={String(metrics.facilityCount)} />
        <Metric label="Sections complete" value={String(metrics.sectionsComplete)} />
        <Metric label="Unanswered confirmations" value={String(metrics.unansweredConfirmations)} />
        <Metric label="Consents pending" value={String(metrics.consentPending)} />
        <Metric label="Charges pending registration" value={String(metrics.chargesPendingRegistration)} />
        <Metric label="Potential concerns" value={String(metrics.potentialConcerns)} />
      </div>

      {assessment.groups.map((group) => {
        if (group.criteria.length === 0) return null;
        return (
          <section key={group.group} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {BAC_ASSESSMENT_GROUP_LABELS[group.group]}
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
