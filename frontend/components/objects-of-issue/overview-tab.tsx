'use client';

import { Button } from '@/components/ui/button';
import { PureOfsBanner } from '@/components/objects-of-issue/form-helpers';
import {
  formatReferencedCompanyClass,
  useObjectsOfIssue,
} from '@/lib/objects-of-issue/context';
import { EM_DASH, formatMoney, formatPercent } from '@/lib/objects-of-issue/format';
import { OBJECTS_OF_ISSUE_SECTION_LABELS } from '@/lib/objects-of-issue/options';
import type { ObjectsOfIssueSectionId, SectionStatus } from '@/lib/objects-of-issue/types';

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

export function ObjectsOfIssueOverviewTab({
  onContinueToInformation,
  onOpenAssessment,
}: {
  onContinueToInformation: (section?: ObjectsOfIssueSectionId) => void;
  onOpenAssessment: () => void;
}) {
  const { overview, derivedError, refreshDerived } = useObjectsOfIssue();

  if (!overview) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground" role="status">
          {derivedError ?? 'Loading Overview…'}
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
    [ObjectsOfIssueSectionId, SectionStatus]
  >;
  const nextSection =
    sectionEntries.find(([, status]) => status === 'in_progress')?.[0] ??
    sectionEntries.find(([, status]) => status !== 'complete')?.[0];
  const sectionsStarted = overview.sectionsComplete + overview.sectionsInProgress;

  return (
    <div className="space-y-6">
      {overview.isPureOfs ? <PureOfsBanner /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewStat
          label="Sections completed"
          value={`${overview.sectionsComplete} / ${overview.totalSections}`}
        />
        <OverviewStat
          label="Sections started"
          value={`${sectionsStarted} / ${overview.totalSections}`}
        />
        <OverviewStat label="Objects recorded" value={display(overview.objectsCount)} />
        <OverviewStat
          label="Net fresh-issue proceeds"
          value={
            overview.isPureOfs
              ? 'Not applicable (OFS)'
              : overview.netFreshIssueProceeds
                ? formatMoney(overview.netFreshIssueProceeds)
                : EM_DASH
          }
        />
        <OverviewStat
          label="Estimated total cost of objects"
          value={
            overview.totalEstimatedObjectsCost
              ? formatMoney(overview.totalEstimatedObjectsCost)
              : EM_DASH
          }
        />
        <OverviewStat
          label="Allocated from net proceeds"
          value={
            overview.totalAllocatedFromNetProceeds
              ? formatMoney(overview.totalAllocatedFromNetProceeds)
              : EM_DASH
          }
        />
        <OverviewStat
          label="GCP % of fresh issue"
          value={
            overview.gcpPercentageOfFreshIssue
              ? formatPercent(overview.gcpPercentageOfFreshIssue)
              : EM_DASH
          }
        />
        <OverviewStat
          label="Capex-relevant objects"
          value={overview.hasCapexRelevantObjects ? 'Yes' : 'No'}
        />
        <OverviewStat
          label="Acquisition-relevant objects"
          value={overview.hasAcquisitionRelevantObjects ? 'Yes' : 'No'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Company reference</h3>
          {overview.companyReference.available ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Legal name</dt>
                <dd className="text-foreground">
                  {overview.companyReference.legalName ?? EM_DASH}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Company class</dt>
                <dd className="text-foreground">
                  {formatReferencedCompanyClass(overview.companyReference.companyClass)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">CIN</dt>
                <dd className="text-foreground">{overview.companyReference.cin ?? EM_DASH}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Company & Incorporation identity is not linked yet (O1 stub).
            </p>
          )}
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Objects Assessment</h3>
          <p className="text-sm font-medium text-foreground">{overview.assessmentResultLabel}</p>
          <p className="text-sm text-muted-foreground">{overview.assessmentSummary}</p>
          <p className="text-xs text-muted-foreground">
            {overview.reconciledChecksCount} check(s) substantiate, {overview.varianceChecksCount}{' '}
            show a difference, and {overview.missingInformationChecksCount} still need
            information.
          </p>
          <Button type="button" variant="link" onClick={onOpenAssessment}>
            Open Objects Assessment
          </Button>
        </section>
      </div>

      <section className="space-y-3 rounded-lg border border-border bg-card p-5">
        <h3 className="text-base font-semibold text-foreground">Section progress</h3>
        <ul className="space-y-2 text-sm">
          {sectionEntries.map(([sectionId, status]) => (
            <li key={sectionId} className="flex items-start justify-between gap-3">
              <span className="text-foreground">{OBJECTS_OF_ISSUE_SECTION_LABELS[sectionId]}</span>
              <span className="shrink-0 text-muted-foreground">
                {sectionStatusLabel(status)}
              </span>
            </li>
          ))}
        </ul>
        <Button type="button" variant="link" onClick={() => onContinueToInformation(nextSection)}>
          {nextSection
            ? `Continue with ${OBJECTS_OF_ISSUE_SECTION_LABELS[nextSection]}`
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
        This Overview reflects your current entries live. Use "Keep section updates" on each
        section so values remain available for the rest of this session.
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
