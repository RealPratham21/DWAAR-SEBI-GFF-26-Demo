'use client';

import { Button } from '@/components/ui/button';
import {
  formatReferencedCompanyClass,
  useBusinessOperations,
} from '@/lib/business-operations/context';
import { EM_DASH, formatCount, formatPercent } from '@/lib/business-operations/format';
import { BUSINESS_OPERATIONS_SECTION_LABELS } from '@/lib/business-operations/options';
import type { BusinessOperationsSectionId, SectionStatus } from '@/lib/business-operations/types';

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

export function BusinessOperationsOverviewTab({
  onContinueToInformation,
  onOpenAssessment,
}: {
  onContinueToInformation: (section?: BusinessOperationsSectionId) => void;
  onOpenAssessment: () => void;
}) {
  const { overview, companyReference, isLoading, isDirty, derivedError } = useBusinessOperations();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading overview…
      </p>
    );
  }

  if (!overview) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {derivedError ?? 'Overview is temporarily unavailable. Information sections remain usable.'}
      </p>
    );
  }

  const sectionEntries = Object.entries(overview.sectionStatuses) as Array<
    [BusinessOperationsSectionId, SectionStatus]
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
        <OverviewStat label="Products / services" value={display(overview.productsCount)} />
        <OverviewStat label="Facilities" value={display(overview.facilitiesCount)} />
        <OverviewStat
          label="Employees (latest)"
          value={
            overview.employeesTotal
              ? formatCount(overview.employeesTotal)
              : EM_DASH
          }
        />
        <OverviewStat label="Domestic operations" value={display(overview.domesticOperations)} />
        <OverviewStat label="Export operations" value={display(overview.exportOperations)} />
        <OverviewStat
          label="Largest segment"
          value={
            overview.largestSegmentLabel
              ? `${overview.largestSegmentLabel}${
                  overview.largestSegmentPercentage
                    ? ` (${formatPercent(overview.largestSegmentPercentage)})`
                    : ''
                }`
              : EM_DASH
          }
        />
        <OverviewStat
          label="Product concentration"
          value={
            overview.productConcentration
              ? formatPercent(overview.productConcentration)
              : EM_DASH
          }
        />
        <OverviewStat
          label="Customer concentration"
          value={
            overview.customerConcentration
              ? formatPercent(overview.customerConcentration)
              : EM_DASH
          }
        />
        <OverviewStat
          label="Supplier concentration"
          value={
            overview.supplierConcentration
              ? formatPercent(overview.supplierConcentration)
              : EM_DASH
          }
        />
        <OverviewStat
          label="Capacity utilisation"
          value={
            overview.capacityUtilisation
              ? formatPercent(overview.capacityUtilisation)
              : EM_DASH
          }
        />
        <OverviewStat
          label="Key dependencies"
          value={display(overview.dependenciesCount)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Business model</h3>
          <p className="text-sm text-foreground">
            {display(overview.businessModelSummary)}
          </p>
          <p className="text-xs text-muted-foreground">
            Operating segments: {display(overview.operatingSegmentsSummary)}
          </p>
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Business Assessment</h3>
          <p className="text-sm font-medium text-foreground">{overview.assessmentResultLabel}</p>
          <p className="text-sm text-muted-foreground">{overview.assessmentSummary}</p>
          <p className="text-xs text-muted-foreground">
            {overview.reconciledChecksCount} check(s) substantiate, {overview.varianceChecksCount}{' '}
            show a difference, and {overview.missingInformationChecksCount} still need information.
          </p>
          <Button type="button" variant="link" onClick={onOpenAssessment}>
            Open Business Assessment
          </Button>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Company reference</h3>
          {companyReference.available ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Legal name</dt>
                <dd className="text-foreground">{companyReference.legalName ?? EM_DASH}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Company class</dt>
                <dd className="text-foreground">
                  {formatReferencedCompanyClass(companyReference.companyClass)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">CIN</dt>
                <dd className="text-foreground">{companyReference.cin ?? EM_DASH}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Company & Incorporation identity is not linked yet (B1 stub).
            </p>
          )}
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Section progress</h3>
          <ul className="space-y-2 text-sm">
            {sectionEntries.map(([sectionId, status]) => (
              <li key={sectionId} className="flex items-start justify-between gap-3">
                <span className="text-foreground">
                  {BUSINESS_OPERATIONS_SECTION_LABELS[sectionId]}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {sectionStatusLabel(status)}
                </span>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="link"
            onClick={() => onContinueToInformation(nextSection)}
          >
            {nextSection
              ? `Continue with ${BUSINESS_OPERATIONS_SECTION_LABELS[nextSection]}`
              : 'Review Information'}
          </Button>
        </section>
      </div>

      {overview.reconciliationConcerns.length > 0 ? (
        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Differences to review</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {overview.reconciliationConcerns.map((check) => (
              <li key={check.key}>
                <span className="font-medium text-foreground">{check.label}</span>
                {' — '}
                {check.explanation}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
                  onClick={() =>
                    onContinueToInformation(
                      action.sectionId as BusinessOperationsSectionId | undefined,
                    )
                  }
                >
                  {action.label}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

        {isDirty ? (
          <p className="text-xs text-muted-foreground">
            Overview reflects the last saved workspace. Keep section updates to refresh it.
          </p>
        ) : null}
        {derivedError ? (
          <p className="text-xs text-muted-foreground" role="status">
            {derivedError}
          </p>
        ) : null}
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
