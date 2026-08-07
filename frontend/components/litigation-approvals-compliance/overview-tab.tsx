'use client';

import { Button } from '@/components/ui/button';
import { useLitigationApprovalsCompliance } from '@/lib/litigation-approvals-compliance/context';
import { LAC_SECTION_LABELS } from '@/lib/litigation-approvals-compliance/options';
import type { SectionStatus } from '@/lib/litigation-approvals-compliance/types';
import type { LitigationApprovalsComplianceSectionId } from '@/lib/schemas/litigation-approvals-compliance';

const EM_DASH = '—';

function sectionStatusLabel(status: SectionStatus | undefined): string {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'in_progress':
      return 'In progress';
    default:
      return 'Not started';
  }
}

function display(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return EM_DASH;
  if (typeof value === 'number') return value === 0 ? '0' : String(value);
  return value.trim() === '' ? EM_DASH : value;
}

export function LitigationApprovalsComplianceOverviewTab({
  onContinueToInformation,
  onOpenAssessment,
}: {
  onContinueToInformation: (section?: LitigationApprovalsComplianceSectionId) => void;
  onOpenAssessment: () => void;
}) {
  const { overview, derivedError, refreshDerived } = useLitigationApprovalsCompliance();

  if (!overview) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {derivedError
            ? 'Overview summary is temporarily unavailable.'
            : 'Loading overview summary…'}
        </p>
        {derivedError ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void refreshDerived()}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  const sectionEntries = Object.entries(overview.sectionStatuses) as Array<
    [LitigationApprovalsComplianceSectionId, SectionStatus]
  >;
  const nextSection =
    sectionEntries.find(([, status]) => status === 'in_progress')?.[0] ??
    sectionEntries.find(([, status]) => status !== 'complete')?.[0];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Litigation, Approvals & Compliance
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {overview.assessmentResultLabel}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{overview.assessmentSummary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {nextSection ? (
              <Button type="button" onClick={() => onContinueToInformation(nextSection)}>
                Continue Information
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onOpenAssessment}>
              Open Legal & Compliance Assessment
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Sections completed" value={`${overview.sectionsComplete} / ${overview.totalSections}`} />
        <Metric label="Legal DD as-of date" value={display(overview.legalDdAsOfDate)} />
        <Metric label="Matters (total / criminal / tax)" value={`${overview.matterCount} / ${overview.criminalMatterCount} / ${overview.taxMatterCount}`} />
        <Metric label="Pending outcomes" value={String(overview.pendingOutcomeCount)} />
        <Metric label="Primary exposure" value={display(overview.primaryExposure)} />
        <Metric label="Tax aggregate demand" value={display(overview.taxAggregateDemand)} />
        <Metric label="Approvals (total / expired / renewal pending)" value={`${overview.approvalCount} / ${overview.expiredApprovalCount} / ${overview.renewalPendingCount}`} />
        <Metric label="Expiring within 30 / 90 days" value={`${overview.approvalsExpiringWithin30Days} / ${overview.approvalsExpiringWithin90Days}`} />
        <Metric label="Compliance issues" value={String(overview.complianceIssueCount)} />
        <Metric label="Delayed statutory dues" value={String(overview.delayedStatutoryDues)} />
        <Metric label="Outstanding approval conditions" value={String(overview.approvalConditionsOutstanding)} />
        <Metric label="Material creditors / MSME" value={`${overview.materialCreditorCount} / ${overview.msmeCreditorCount}`} />
        <Metric label="Creditor aggregate outstanding" value={display(overview.creditorAggregateOutstanding)} />
        <Metric label="Material developments" value={String(overview.materialDevelopmentCount)} />
        <Metric label="Open remediation actions" value={String(overview.remediationOpenCount)} />
        <Metric label="Financials reconciliation" value={display(overview.financialsReconciliationStatus)} />
        <Metric label="Assessment concerns" value={String(overview.assessmentConcerns)} />
        <Metric label="Pending professional review" value={String(overview.pendingProfessionalReviewItems)} />
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Cross-workstream reconciliation</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          <li className="text-sm">
            Group Entities:{' '}
            <span className="text-muted-foreground">
              {display(overview.groupEntitiesReconciliationStatus)}
            </span>
          </li>
          <li className="text-sm">
            Management & Governance:{' '}
            <span className="text-muted-foreground">
              {display(overview.managementGovernanceReconciliationStatus)}
            </span>
          </li>
          <li className="text-sm">
            Borrowings, Assets & Contracts:{' '}
            <span className="text-muted-foreground">
              {display(overview.bacReconciliationStatus)}
            </span>
          </li>
          <li className="text-sm">
            Business & Operations:{' '}
            <span className="text-muted-foreground">
              {display(overview.businessOperationsReconciliationStatus)}
            </span>
          </li>
          <li className="text-sm">
            Objects of the Issue:{' '}
            <span className="text-muted-foreground">
              {display(overview.objectsReconciliationStatus)}
            </span>
          </li>
          <li className="text-sm">
            IPO Setup:{' '}
            <span className="text-muted-foreground">
              {display(overview.ipoSetupReconciliationStatus)}
            </span>
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Section progress</h3>
        <ul className="mt-3 space-y-2">
          {sectionEntries.map(([sectionId, status]) => (
            <li
              key={sectionId}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <span>{LAC_SECTION_LABELS[sectionId]}</span>
              <span className="text-muted-foreground">{sectionStatusLabel(status)}</span>
            </li>
          ))}
        </ul>
      </section>

      {overview.recommendedNextActions.length > 0 ? (
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Recommended next actions</h3>
          <ul className="mt-3 space-y-2">
            {overview.recommendedNextActions.map((action) => (
              <li key={action.sectionId}>
                <button
                  type="button"
                  className="text-sm text-accent hover:underline"
                  onClick={() => onContinueToInformation(action.sectionId)}
                >
                  {action.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
