'use client';

import { useIpoSetup } from '@/lib/ipo-setup/context';
import { formatPercent, formatRupeesCompact } from '@/lib/ipo-setup/format';
import { cn } from '@/lib/utils';

const GROUP_LABELS: Record<string, string> = {
  issuer_eligibility: 'Issuer eligibility',
  financial_eligibility: 'Financial eligibility',
  offer_eligibility: 'Offer eligibility',
  legal_disqualification: 'Legal / disqualification checks',
  process_readiness: 'Process readiness',
};

function stateLabel(state: string): string {
  return state.replaceAll('_', ' ');
}

function stateTone(state: string): string {
  switch (state) {
    case 'appears_satisfied':
      return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200';
    case 'potential_concern':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100';
    case 'missing_information':
    case 'pending_supporting_document':
    case 'pending_linked_workstream':
      return 'border-border bg-muted/40 text-muted-foreground';
    case 'professional_confirmation_required':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100';
    case 'not_applicable':
      return 'border-border bg-background text-muted-foreground';
    default:
      return 'border-border bg-muted/30 text-muted-foreground';
  }
}

function metricNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function IpoSetupAssessmentTab() {
  const { assessment, isLoading } = useIpoSetup();

  if (isLoading || !assessment) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading eligibility assessment…
      </p>
    );
  }

  const groups = Object.keys(GROUP_LABELS);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Preliminary result
        </p>
        <h2 className="text-xl font-semibold text-foreground">{assessment.resultLabel}</h2>
        <p className="text-sm text-muted-foreground">{assessment.summary}</p>
        <p className="text-xs text-muted-foreground">
          This is not a binary eligible / not-eligible decision. Exchange and professional
          confirmation remain required. Results are calculated on the server from saved values.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Post-issue paid-up capital"
          value={formatRupeesCompact(
            metricNumber(assessment.metrics.proposedPostIssuePaidUpCapital),
          )}
        />
        <Metric
          label="OFS % of offer"
          value={formatPercent(metricNumber(assessment.metrics.ofsPercentageOfOffer))}
        />
        <Metric
          label="Years ≥ ₹1 crore operating profit"
          value={String(assessment.metrics.yearsMeetingOperatingProfitThreshold)}
        />
        <Metric
          label="Years with positive FCFE"
          value={String(assessment.metrics.yearsWithPositiveFcfe)}
        />
        <Metric
          label="Positive net worth available"
          value={
            assessment.metrics.positiveNetWorthAvailable === null
              ? '—'
              : assessment.metrics.positiveNetWorthAvailable
                ? 'Yes'
                : 'No'
          }
        />
        <Metric
          label="Three-year track record"
          value={
            assessment.metrics.threeYearTrackRecordEstablished === null
              ? '—'
              : assessment.metrics.threeYearTrackRecordEstablished
                ? 'Established'
                : 'Not established'
          }
        />
        <Metric
          label="Public-company conversion"
          value={assessment.metrics.publicCompanyConversionStatus}
        />
        <Metric
          label="Adverse declarations (Yes)"
          value={String(assessment.metrics.unresolvedAdverseDeclarations)}
        />
      </div>

      {groups.map((group) => {
        const items = assessment.groupedCriteria[group] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={group} className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">{GROUP_LABELS[group]}</h3>
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.key}
                  className={cn('rounded-md border px-4 py-3', stateTone(item.result))}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.label}</p>
                    <span className="text-[11px] font-semibold uppercase tracking-wide">
                      {stateLabel(item.result)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs opacity-90">{item.explanation}</p>
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
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
