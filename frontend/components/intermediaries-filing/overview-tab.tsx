'use client';

import { Button } from '@/components/ui/button';
import { useIntermediariesFiling } from '@/lib/intermediaries-filing/context';
import { IF_SECTION_LABELS } from '@/lib/intermediaries-filing/options';
import type { SectionStatus } from '@/lib/intermediaries-filing/types';
import type { IntermediariesFilingSectionId } from '@/lib/schemas/intermediaries-filing';

const EM_DASH = '—';

function sectionStatusLabel(status: SectionStatus | undefined): string {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'in_progress':
      return 'In progress';
    case 'not_yet_due':
      return 'Not yet due';
    case 'not_applicable':
      return 'Not applicable';
    default:
      return 'Not started';
  }
}

function display(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return EM_DASH;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value === 0 ? '0' : String(value);
  return value.trim() === '' ? EM_DASH : value;
}

export function IntermediariesFilingOverviewTab({
  onContinueToInformation,
  onOpenFilingReadiness,
}: {
  onContinueToInformation: (section?: IntermediariesFilingSectionId) => void;
  onOpenFilingReadiness: () => void;
}) {
  const { overview, derivedError, refreshDerived } = useIntermediariesFiling();

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
    [IntermediariesFilingSectionId, SectionStatus]
  >;
  const nextSection =
    sectionEntries.find(([, status]) => status === 'in_progress')?.[0] ??
    sectionEntries.find(([, status]) => status !== 'complete' && status !== 'not_applicable')
      ?.[0];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Intermediaries & Filing
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
            <Button type="button" variant="outline" onClick={onOpenFilingReadiness}>
              Open Filing Readiness
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Sections completed"
          value={`${overview.sectionsComplete} / ${overview.totalSections}`}
        />
        <Metric label="Current filing stage" value={display(overview.currentFilingStage)} />
        <Metric label="Target SME platform" value={display(overview.targetSmePlatform)} />
        <Metric label="Issue method" value={display(overview.issueMethod)} />
        <Metric label="Fresh issue amount" value={display(overview.freshIssueAmount)} />
        <Metric label="OFS amount" value={display(overview.ofsAmount)} />
        <Metric label="Total offer amount" value={display(overview.totalOfferAmount)} />
        <Metric label="Price band / final price" value={display(overview.currentPriceBandStatus)} />
        <Metric
          label="Authoritative document version"
          value={display(overview.authoritativeDocumentVersion)}
        />
        <Metric
          label="Intermediaries (total / lead managers / active)"
          value={`${overview.intermediaryCount} / ${overview.leadManagerCount} / ${overview.activeIntermediaryCount}`}
        />
        <Metric label="Agreements pending" value={String(overview.agreementsPendingCount)} />
        <Metric
          label="Registrations pending review"
          value={String(overview.registrationsPendingReview)}
        />
        <Metric
          label="DD areas signed off"
          value={`${overview.ddAreasSignedOff} / ${overview.ddAreasTotal}`}
        />
        <Metric
          label="Certificates ready / pending"
          value={`${overview.certificatesReady} / ${overview.certificatesPending}`}
        />
        <Metric
          label="Consents received / required"
          value={`${overview.consentsReceived} / ${overview.consentsRequired}`}
        />
        <Metric
          label="Chapter sign-offs"
          value={`${overview.chapterSignoffsComplete} / ${overview.chapterSignoffsTotal}`}
        />
        <Metric label="Filings recorded" value={String(overview.filingCount)} />
        <Metric
          label="Open / overdue exchange queries"
          value={`${overview.openExchangeQueries} / ${overview.overdueExchangeQueries}`}
        />
        <Metric label="In-principle approval" value={display(overview.inPrincipleStatus)} />
        <Metric label="SEBI SME filing status" value={display(overview.sebiSmeFilingStatus)} />
        <Metric label="RoC filing status" value={display(overview.rocFilingStatus)} />
        <Metric label="ISIN status" value={display(overview.isinStatus)} />
        <Metric
          label="Sponsor bank / UPI / ASBA ready"
          value={`${overview.sponsorBankReady ? 'Y' : 'N'} / ${overview.upiReady ? 'Y' : 'N'} / ${overview.asbaReady ? 'Y' : 'N'}`}
        />
        <Metric
          label="Bank roles ready"
          value={`${overview.bankRolesReady} / ${overview.bankRolesTotal}`}
        />
        <Metric label="Underwriting coverage" value={display(overview.underwritingCoverage)} />
        <Metric label="Uncovered shares" value={display(overview.uncoveredShares)} />
        <Metric
          label="Merchant banker own-account %"
          value={display(overview.merchantBankerOwnAccountPercentage)}
        />
        <Metric
          label="Market maker appointed"
          value={overview.marketMakerAppointed ? 'Yes' : 'No'}
        />
        <Metric label="Issue opening / closing" value={`${display(overview.issueOpeningDate)} / ${display(overview.issueClosingDate)}`} />
        <Metric
          label="Preliminary T+3 listing date"
          value={display(overview.preliminaryTPlus3ListingDate)}
        />
        <Metric label="Basis / demat / listing status" value={`${display(overview.basisStatus)} / ${display(overview.dematStatus)} / ${display(overview.listingStatus)}`} />
        <Metric label="Unresolved placeholders" value={String(overview.unresolvedPlaceholders)} />
        <Metric label="Inspection items pending" value={String(overview.inspectionItemsPending)} />
        <Metric label="Issue agreements pending" value={String(overview.issueAgreementsPending)} />
        <Metric label="Advertisements pending" value={String(overview.advertisementsPending)} />
        <Metric label="DD repository readiness" value={display(overview.repositoryReadiness)} />
        <Metric
          label="Reconciliation mismatches"
          value={String(overview.reconciliationMismatchCount)}
        />
        <Metric label="Assessment concerns" value={String(overview.assessmentConcerns)} />
        <Metric
          label="Pending professional confirmations"
          value={String(overview.pendingProfessionalConfirmations)}
        />
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Section progress</h3>
        <ul className="mt-3 space-y-2">
          {sectionEntries.map(([sectionId, status]) => (
            <li
              key={sectionId}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <span>{IF_SECTION_LABELS[sectionId]}</span>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
