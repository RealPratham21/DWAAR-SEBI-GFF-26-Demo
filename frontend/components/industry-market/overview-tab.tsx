'use client';

import { Button } from '@/components/ui/button';
import { useIndustryMarket } from '@/lib/industry-market/context';
import { INDUSTRY_MARKET_SECTION_LABELS } from '@/lib/industry-market/options';
import type { IndustryMarketSectionId, SectionStatus } from '@/lib/industry-market/types';

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

export function IndustryMarketOverviewTab({
  onContinueToInformation,
  onOpenAssessment,
}: {
  onContinueToInformation: (section?: IndustryMarketSectionId) => void;
  onOpenAssessment: () => void;
}) {
  const { overview, linkedReferences, derivedError, refreshDerived } = useIndustryMarket();

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
    [IndustryMarketSectionId, SectionStatus]
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
        <OverviewStat label="Primary industry" value={display(overview.primaryIndustry)} />
        <OverviewStat label="Relevant market" value={display(overview.relevantMarket)} />
        <OverviewStat label="Geography" value={display(overview.geography)} />
        <OverviewStat
          label="Latest market size"
          value={
            overview.latestMarketSize
              ? `${overview.latestMarketSize}${overview.latestMarketSizeUnit ? ` ${overview.latestMarketSizeUnit}` : ''}`
              : EM_DASH
          }
        />
        <OverviewStat
          label="Latest market-size period"
          value={display(overview.latestMarketSizePeriod)}
        />
        <OverviewStat
          label="Forecast market size"
          value={display(overview.forecastMarketSize)}
        />
        <OverviewStat label="Forecast period" value={display(overview.forecastPeriod)} />
        <OverviewStat label="Forecast CAGR" value={display(overview.forecastCagr)} />
        <OverviewStat label="External sources" value={display(overview.externalSourceCount)} />
        <OverviewStat label="Current sources" value={display(overview.currentSourceCount)} />
        <OverviewStat
          label="Potentially stale sources"
          value={display(overview.potentiallyStaleSourceCount)}
        />
        <OverviewStat label="Competitors identified" value={display(overview.competitorsIdentified)} />
        <OverviewStat
          label="Calculated issuer market share"
          value={
            overview.calculatedIssuerMarketShare
              ? `${overview.calculatedIssuerMarketShare}%`
              : EM_DASH
          }
        />
        <OverviewStat label="Claims proposed" value={display(overview.claimsProposed)} />
        <OverviewStat label="Claims substantiated" value={display(overview.claimsSubstantiated)} />
        <OverviewStat
          label="Claims needing evidence"
          value={display(overview.claimsNeedingEvidence)}
        />
        <OverviewStat
          label="Conflicting sources"
          value={display(overview.conflictingSourceCount)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Industry Assessment</h3>
          <p className="text-sm font-medium text-foreground">{overview.assessmentResultLabel}</p>
          <p className="text-sm text-muted-foreground">{overview.assessmentSummary}</p>
          <Button type="button" variant="link" onClick={onOpenAssessment}>
            Open Industry Assessment
          </Button>
        </section>

        {!linkedReferences.businessOperations.available &&
        !linkedReferences.financialsKpis.available ? (
          <section className="space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-5">
            <p className="text-sm text-muted-foreground">
              Business & Operations and Financials & KPIs linked values are not available yet.
              Industry mappings and market-share numerators may show pending linked-workstream
              states in the assessment.
            </p>
          </section>
        ) : null}
      </div>

      <section className="space-y-3 rounded-lg border border-border bg-card p-5">
        <h3 className="text-base font-semibold text-foreground">Section progress</h3>
        <ul className="space-y-2 text-sm">
          {sectionEntries.map(([sectionId, status]) => (
            <li key={sectionId} className="flex items-start justify-between gap-3">
              <span className="text-foreground">
                {INDUSTRY_MARKET_SECTION_LABELS[sectionId]}
              </span>
              <span className="shrink-0 text-muted-foreground">{sectionStatusLabel(status)}</span>
            </li>
          ))}
        </ul>
        <Button type="button" variant="link" onClick={() => onContinueToInformation(nextSection)}>
          {nextSection
            ? `Continue with ${INDUSTRY_MARKET_SECTION_LABELS[nextSection]}`
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
