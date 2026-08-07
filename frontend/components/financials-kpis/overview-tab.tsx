'use client';

import { Button } from '@/components/ui/button';
import { formatReferencedCompanyClass, useFinancialsKpis } from '@/lib/financials-kpis/context';
import { EM_DASH, formatMoney } from '@/lib/financials-kpis/format';
import { FINANCIALS_KPIS_SECTION_LABELS } from '@/lib/financials-kpis/options';
import type { FinancialsKpisSectionId, SectionStatus } from '@/lib/financials-kpis/types';

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

export function FinancialsKpisOverviewTab({
  onContinueToInformation,
  onOpenAssessment,
}: {
  onContinueToInformation: (section?: FinancialsKpisSectionId) => void;
  onOpenAssessment: () => void;
}) {
  const { overview, linkedReferences, derivedError, refreshDerived } = useFinancialsKpis();

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
  const displayUnit = overview.displayUnit as '' | 'rupees' | 'lakh' | 'crore' | 'thousand' | 'million';

  const sectionEntries = Object.entries(overview.sectionStatuses) as Array<
    [FinancialsKpisSectionId, SectionStatus]
  >;
  const nextSection =
    sectionEntries.find(([, status]) => status === 'in_progress')?.[0] ??
    sectionEntries.find(([, status]) => status !== 'complete')?.[0];
  const sectionsStarted = overview.sectionsComplete + overview.sectionsInProgress;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewStat
          label="Sections completed"
          value={`${overview.sectionsComplete} / ${overview.totalSections}`}
        />
        <OverviewStat
          label="Sections started"
          value={`${sectionsStarted} / ${overview.totalSections}`}
        />
        <OverviewStat label="Financial periods" value={display(overview.periodLabels.length)} />
        <OverviewStat label="Reporting entities" value={display(overview.entityCount)} />
        <OverviewStat label="Latest period" value={display(overview.latestPeriodLabel)} />
        <OverviewStat
          label="Latest revenue"
          value={
            overview.latestRevenue ? formatMoney(overview.latestRevenue, displayUnit) : EM_DASH
          }
        />
        <OverviewStat
          label="Latest profit after tax"
          value={
            overview.latestProfitAfterTax
              ? formatMoney(overview.latestProfitAfterTax, displayUnit)
              : EM_DASH
          }
        />
        <OverviewStat
          label="Latest EBITDA"
          value={
            overview.latestEbitda ? formatMoney(overview.latestEbitda, displayUnit) : EM_DASH
          }
        />
        <OverviewStat label="KPIs registered" value={display(overview.kpiCount)} />
        <OverviewStat
          label="Reconciled checks"
          value={display(overview.reconciledChecksCount)}
        />
        <OverviewStat label="Variance checks" value={display(overview.varianceChecksCount)} />
        <OverviewStat
          label="Missing information checks"
          value={display(overview.missingInformationChecksCount)}
        />
      </div>

      {overview.periodLabels.length > 0 ? (
        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Period labels</h3>
          <ul className="flex flex-wrap gap-2 text-sm">
            {overview.periodLabels.map((label) => (
              <li
                key={label}
                className="rounded-md border border-border bg-muted/30 px-2.5 py-1 tabular-nums"
              >
                {label}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {overview.reconciliationConcerns.length > 0 ? (
        <section className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="text-base font-semibold text-foreground">Reconciliation concerns</h3>
          <ul className="space-y-2 text-sm">
            {overview.reconciliationConcerns.map((concern) => (
              <li key={concern.id}>
                <p className="font-medium text-foreground">{concern.label}</p>
                <p className="text-muted-foreground">{concern.message}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {overview.periodComparisonWarnings.length > 0 ? (
        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Period comparison warnings</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {overview.periodComparisonWarnings.map((warning) => (
              <li key={warning.id}>{warning.warning}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Company reference</h3>
          {linkedReferences.company.available ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Legal name</dt>
                <dd className="text-foreground">{linkedReferences.company.legalName ?? EM_DASH}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Company class</dt>
                <dd className="text-foreground">
                  {formatReferencedCompanyClass(linkedReferences.company.companyClass)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Company & Incorporation identity is not linked yet (F1 stub).
            </p>
          )}
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Financial Assessment</h3>
          <p className="text-sm font-medium text-foreground">{overview.assessmentResultLabel}</p>
          <p className="text-sm text-muted-foreground">{overview.assessmentSummary}</p>
          <p className="text-xs text-muted-foreground">
            {overview.reconciledChecksCount} check(s) reconcile, {overview.varianceChecksCount}{' '}
            show a difference, and {overview.missingInformationChecksCount} still need
            information.
          </p>
          <Button type="button" variant="link" onClick={onOpenAssessment}>
            Open Financial Assessment
          </Button>
        </section>
      </div>

      <section className="space-y-3 rounded-lg border border-border bg-card p-5">
        <h3 className="text-base font-semibold text-foreground">Section progress</h3>
        <ul className="space-y-2 text-sm">
          {sectionEntries.map(([sectionId, status]) => (
            <li key={sectionId} className="flex items-start justify-between gap-3">
              <span className="text-foreground">{FINANCIALS_KPIS_SECTION_LABELS[sectionId]}</span>
              <span className="shrink-0 text-muted-foreground">{sectionStatusLabel(status)}</span>
            </li>
          ))}
        </ul>
        <Button type="button" variant="link" onClick={() => onContinueToInformation(nextSection)}>
          {nextSection
            ? `Continue with ${FINANCIALS_KPIS_SECTION_LABELS[nextSection]}`
            : 'Review Information'}
        </Button>
      </section>

      {overview.recommendedNextActions.length > 0 ? (
        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Next actions</h3>
          <ul className="space-y-2 text-sm">
            {overview.recommendedNextActions.map((action) => (
              <li key={action.sectionId}>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0"
                  onClick={() => onContinueToInformation(action.sectionId)}
                >
                  {action.label}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        This Overview reflects your current entries live. Use &quot;Keep section updates&quot; on
        each section so values remain available for the rest of this session.
      </p>
    </div>
  );
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
