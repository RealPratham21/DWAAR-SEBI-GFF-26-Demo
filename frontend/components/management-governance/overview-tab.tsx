'use client';

import { Button } from '@/components/ui/button';
import { useManagementGovernance } from '@/lib/management-governance/context';
import { MANAGEMENT_GOVERNANCE_SECTION_LABELS } from '@/lib/management-governance/options';
import type { ManagementGovernanceSectionId, SectionStatus } from '@/lib/management-governance/types';

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

export function ManagementGovernanceOverviewTab({
  onContinueToInformation,
  onOpenAssessment,
}: {
  onContinueToInformation: (section?: ManagementGovernanceSectionId) => void;
  onOpenAssessment: () => void;
}) {
  const { overview, linkedReferences, derivedError, refreshDerived } = useManagementGovernance();

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
    [ManagementGovernanceSectionId, SectionStatus]
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
        <OverviewStat label="Current board size" value={display(overview.boardSize)} />
        <OverviewStat label="Proposed board size" value={display(overview.proposedBoardSize)} />
        <OverviewStat label="Executive directors" value={display(overview.executiveDirectors)} />
        <OverviewStat
          label="Non-executive directors"
          value={display(overview.nonExecutiveDirectors)}
        />
        <OverviewStat
          label="Independent directors"
          value={display(overview.independentDirectors)}
        />
        <OverviewStat label="Women directors" value={display(overview.womenDirectors)} />
        <OverviewStat label="KMP recorded" value={display(overview.kmpCount)} />
        <OverviewStat
          label="Senior management recorded"
          value={display(overview.seniorManagementCount)}
        />
        <OverviewStat label="Committees ready" value={display(overview.committeesReady)} />
        <OverviewStat
          label="Policies adopted"
          value={`${overview.policiesAdopted} / ${overview.policiesRequired}`}
        />
        <OverviewStat
          label="Board changes (3-year)"
          value={display(overview.boardChangesLastThreeYears)}
        />
        <OverviewStat
          label="Pending appointments"
          value={display(overview.pendingAppointments)}
        />
        <OverviewStat label="Potential concerns" value={display(overview.potentialConcerns)} />
        <OverviewStat label="Listing segment" value={display(overview.listingSegment)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Leadership snapshot</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Chairman</dt>
              <dd className="text-foreground">{display(overview.chairmanName)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Managing Director</dt>
              <dd className="text-foreground">{display(overview.managingDirectorName)}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Governance Assessment</h3>
          <p className="text-sm font-medium text-foreground">{overview.assessmentResultLabel}</p>
          <p className="text-sm text-muted-foreground">{overview.assessmentSummary}</p>
          <Button type="button" variant="link" onClick={onOpenAssessment}>
            Open Governance Assessment
          </Button>
        </section>
      </div>

      {!linkedReferences.company.available ? (
        <p className="text-xs text-muted-foreground">
          Company & Incorporation identity is not linked yet.
        </p>
      ) : null}

      <section className="space-y-3 rounded-lg border border-border bg-card p-5">
        <h3 className="text-base font-semibold text-foreground">Section progress</h3>
        <ul className="space-y-2 text-sm">
          {sectionEntries.map(([sectionId, status]) => (
            <li key={sectionId} className="flex items-start justify-between gap-3">
              <span className="text-foreground">
                {MANAGEMENT_GOVERNANCE_SECTION_LABELS[sectionId]}
              </span>
              <span className="shrink-0 text-muted-foreground">{sectionStatusLabel(status)}</span>
            </li>
          ))}
        </ul>
        <Button type="button" variant="link" onClick={() => onContinueToInformation(nextSection)}>
          {nextSection
            ? `Continue with ${MANAGEMENT_GOVERNANCE_SECTION_LABELS[nextSection]}`
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

      {overview.lastUpdatedAt ? (
        <p className="text-xs text-muted-foreground">
          Last saved {new Date(overview.lastUpdatedAt).toLocaleString()}.
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
