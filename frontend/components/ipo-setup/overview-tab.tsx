'use client';

import { formatReferencedCompanyClass, useIpoSetup } from '@/lib/ipo-setup/context';

export function IpoSetupOverviewTab({
  onContinueToInformation,
  onOpenAssessment,
}: {
  onContinueToInformation: () => void;
  onOpenAssessment: () => void;
}) {
  const { overview, companyReference, isLoading } = useIpoSetup();

  if (isLoading || !overview) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading overview…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewStat
          label="Sections completed"
          value={`${overview.sectionsComplete} / ${overview.totalSections}`}
        />
        <OverviewStat label="Target platform" value={overview.targetPlatformLabel} />
        <OverviewStat label="Offer type" value={overview.offerTypeLabel} />
        <OverviewStat label="Preparation stage" value={overview.preparationStageLabel} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Preliminary assessment</h3>
          <p className="text-sm font-medium text-foreground">
            {overview.preliminaryAssessmentLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            Pricing method: {overview.pricingMethodLabel}
          </p>
          <button
            type="button"
            onClick={onOpenAssessment}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open Eligibility Assessment
          </button>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Company reference</h3>
          {companyReference.available ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Legal name</dt>
                <dd className="text-foreground">{companyReference.legalName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Company class</dt>
                <dd className="text-foreground">
                  {formatReferencedCompanyClass(companyReference.companyClass)}
                </dd>
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
        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Missing required responses</h3>
          {overview.missingRequiredResponses.length === 0 ? (
            <p className="text-sm text-muted-foreground">All sections currently look complete.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {overview.missingRequiredResponses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Potential concerns</h3>
          {overview.potentialConcerns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No potential concerns identified yet.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {overview.potentialConcerns.map((item) => (
                <li key={item.key}>{item.label}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h3 className="text-base font-semibold text-foreground">Next actions</h3>
        {overview.recommendedNextActions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Continue refining Information inputs.</p>
        ) : (
          <ul className="space-y-2">
            {overview.recommendedNextActions.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.href.includes('eligibility-assessment')) onOpenAssessment();
                    else onContinueToInformation();
                  }}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
