'use client';

import { Button } from '@/components/ui/button';
import { useGroupEntities } from '@/lib/group-entities-related-parties/context';
import { GROUP_ENTITIES_SECTION_LABELS } from '@/lib/group-entities-related-parties/options';
import type { GroupEntitiesSectionId } from '@/lib/schemas/group-entities-related-parties';
import type { SectionStatus } from '@/lib/group-entities-related-parties/types';

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

export function GroupEntitiesOverviewTab({
  onContinueToInformation,
  onOpenAssessment,
}: {
  onContinueToInformation: (section?: GroupEntitiesSectionId) => void;
  onOpenAssessment: () => void;
}) {
  const { overview, derivedError, refreshDerived } = useGroupEntities();

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
    [GroupEntitiesSectionId, SectionStatus]
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
              Group Entities & Related Parties
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
              Open Group & RPT Assessment
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Sections completed" value={`${overview.sectionsComplete} / ${overview.totalSections}`} />
        <Metric label="Entities identified" value={String(overview.entityCount)} />
        <Metric label="Subsidiaries" value={String(overview.subsidiaryCount)} />
        <Metric label="Related parties" value={String(overview.relatedPartyCount)} />
        <Metric label="ICDR Group Companies" value={String(overview.icdrGroupCompanyCount)} />
        <Metric label="Pending Board determination" value={String(overview.icdrPendingBoardCount)} />
        <Metric
          label="Latest FY RPT total"
          value={display(overview.latestFinancialYearRptTotal)}
          hint={`${display(overview.latestFinancialPeriod)} · ${overview.currency} · ${overview.amountUnit}`}
        />
        <Metric
          label="RPT revenue %"
          value={overview.rptRevenuePercent ? `${overview.rptRevenuePercent}%` : EM_DASH}
        />
        <Metric label="Related-party receivables" value={display(overview.relatedPartyReceivables)} />
        <Metric label="Related-party payables" value={display(overview.relatedPartyPayables)} />
        <Metric label="Materiality Policy" value={overview.materialityPolicyStatus} />
        <Metric label="Assessment concerns" value={String(overview.assessmentConcerns)} />
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Section progress</h3>
        <ul className="mt-3 space-y-2">
          {sectionEntries.map(([sectionId, status]) => (
            <li
              key={sectionId}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <span>{GROUP_ENTITIES_SECTION_LABELS[sectionId]}</span>
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
