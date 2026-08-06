'use client';

import { Button } from '@/components/ui/button';
import { formatReferencedCompanyClass, useCapitalOwnership } from '@/lib/capital-ownership/context';
import {
  EM_DASH,
  formatMoneyCompact,
  formatPercent,
  formatShares,
} from '@/lib/capital-ownership/format';
import { CAPITAL_OWNERSHIP_SECTION_LABELS } from '@/lib/capital-ownership/options';
import type { CapitalOwnershipSectionId, SectionStatus } from '@/lib/capital-ownership/types';

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

export function CapitalOwnershipOverviewTab({
  onContinueToInformation,
  onOpenAssessment,
}: {
  onContinueToInformation: (section?: CapitalOwnershipSectionId) => void;
  onOpenAssessment: () => void;
}) {
  const { overview, companyReference, ipoReference, isLoading, isDirty } = useCapitalOwnership();

  if (isLoading || !overview) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading overview…
      </p>
    );
  }

  const sectionEntries = Object.entries(overview.sectionStatuses) as Array<
    [CapitalOwnershipSectionId, SectionStatus]
  >;
  const nextSection =
    sectionEntries.find(([, status]) => status === 'in_progress')?.[0] ??
    sectionEntries.find(([, status]) => status !== 'complete')?.[0];
  const sectionsStarted = overview.sectionsComplete + (overview.sectionsInProgress ?? 0);

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
        <OverviewStat
          label="Current equity shares"
          value={formatShares(overview.currentEquityShares)}
        />
        <OverviewStat
          label="Paid-up equity capital"
          value={formatMoneyCompact(overview.paidUpEquityCapital)}
        />
        <OverviewStat
          label="Promoter & group holding"
          value={formatPercent(overview.promoterAndGroupPercentage)}
        />
        <OverviewStat label="Post-issue shares" value={formatShares(overview.postIssueShares)} />
        <OverviewStat
          label="Promoter post-issue holding"
          value={formatPercent(overview.promoterPostIssuePercentage)}
        />
        <OverviewStat
          label="Offer % of post-issue capital"
          value={formatPercent(overview.offerAsPercentageOfPostIssueCapital)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Capital Assessment</h3>
          <p className="text-sm font-medium text-foreground">{overview.assessmentResultLabel}</p>
          <p className="text-sm text-muted-foreground">{overview.assessmentSummary}</p>
          <p className="text-xs text-muted-foreground">
            {overview.reconciledChecksCount} check(s) reconcile, {overview.varianceChecksCount}{' '}
            show a difference, and {overview.missingInformationChecksCount ?? 0} still need
            information on currently saved values.
          </p>
          <Button type="button" variant="link" onClick={onOpenAssessment}>
            Open Capital Assessment
          </Button>
        </section>

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
              Company & Incorporation identity is not loaded yet.
            </p>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">
            IPO Setup & Eligibility linkage
          </h3>
          {ipoReference.available || overview.ipoSetupLinked ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Fresh issue shares</dt>
                <dd className="text-foreground tabular-nums">
                  {formatShares(ipoReference.proposedFreshIssueShares)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Offer-for-sale shares</dt>
                <dd className="text-foreground tabular-nums">
                  {formatShares(ipoReference.proposedOfsShares)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Existing issued equity shares</dt>
                <dd className="text-foreground tabular-nums">
                  {formatShares(ipoReference.existingIssuedEquityShares)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Offer sizing is governed by IPO Setup & Eligibility, which is not available yet. Pre
              and post-issue views remain indicative.
            </p>
          )}
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Section progress</h3>
          <ul className="space-y-2 text-sm">
            {sectionEntries.map(([sectionId, status]) => (
              <li key={sectionId} className="flex items-start justify-between gap-3">
                <span className="text-foreground">{CAPITAL_OWNERSHIP_SECTION_LABELS[sectionId]}</span>
                <span className="shrink-0 text-muted-foreground">{sectionStatusLabel(status)}</span>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="link"
            onClick={() => onContinueToInformation(nextSection)}
          >
            {nextSection
              ? `Continue with ${CAPITAL_OWNERSHIP_SECTION_LABELS[nextSection]}`
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

      {isDirty ? (
        <p className="text-xs text-muted-foreground">
          Overview reflects the last saved workspace. Keep section updates to refresh these figures.
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
