'use client';

import { useEffect, useRef } from 'react';
import {
  Building2,
  FileText,
  History,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormActionRow, SectionCard } from '@/components/company-incorporation/form-primitives';
import { NeutralStatusBadge } from '@/components/company-incorporation/tab-shared';
import { ReadinessBadge, StatusBadge } from '@/components/company-incorporation/status-badge';
import { useCompanyIncorporation } from '@/lib/company-incorporation/context';
import { useCompanyIncorporationOverview } from '@/lib/company-incorporation/hooks/use-company-incorporation-overview';
import { readinessStatusLabel } from '@/lib/company-incorporation/extraction/labels';
import {
  DRHP_CONTRIBUTION_SECTIONS,
  READINESS_NEUTRAL_STATUS,
  WORKSTREAM_SCOPE_CARDS,
} from '@/lib/company-incorporation/overview-config';
import type { ReadinessStatus } from '@/lib/company-incorporation/extraction/types';

const SCOPE_ICONS: Record<(typeof WORKSTREAM_SCOPE_CARDS)[number]['id'], typeof Building2> = {
  'legal-identity': Building2,
  'corporate-history': History,
  'offices-contact': MapPin,
  'constitutional-records': FileText,
  'core-registrations': ShieldCheck,
};

function overallStatusLabel(status: string): string {
  switch (status) {
    case 'not_started':
      return 'Not started';
    case 'in_progress':
      return 'In progress';
    case 'blocked':
      return 'Blocked';
    case 'review_required':
      return 'Review required';
    case 'ready':
      return 'Ready';
    default:
      return readinessStatusLabel(status);
  }
}

function ReadinessRow({
  title,
  status,
  detail,
  assessed = true,
}: {
  title: string;
  status?: ReadinessStatus;
  detail: string;
  assessed?: boolean;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-md border border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{detail}</p>
      </div>
      <div className="shrink-0">
        {assessed && status ? (
          <ReadinessBadge status={status} />
        ) : (
          <NeutralStatusBadge label={READINESS_NEUTRAL_STATUS} />
        )}
      </div>
    </li>
  );
}

interface CompanyIncorporationOverviewTabProps {
  enabled: boolean;
  onContinueToInformation: () => void;
  refreshToken?: number;
}

export function CompanyIncorporationOverviewTab({
  enabled,
  onContinueToInformation,
  refreshToken = 0,
}: CompanyIncorporationOverviewTabProps) {
  const { progress } = useCompanyIncorporation();
  const overview = useCompanyIncorporationOverview({ enabled });
  const overviewRefresh = overview.refresh;

  const initialRefreshToken = useRef(refreshToken);
  useEffect(() => {
    if (!enabled || refreshToken === initialRefreshToken.current) return;
    void overviewRefresh({ silent: true });
  }, [enabled, overviewRefresh, refreshToken]);

  const summary = overview.data;

  // The Information progress held in context is the fallback while the
  // readiness summary is still loading or unavailable.
  const sectionsComplete = summary?.information.completedSections ?? progress?.sectionsComplete ?? 0;
  const totalSections = summary?.information.totalSections ?? progress?.totalSections ?? 6;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Workstream Overview"
        description="Establish the issuer’s legal identity, corporate history, constitutional records, offices, and core registrations required for DRHP preparation."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={overview.loading || overview.refreshing}
            onClick={() => void overviewRefresh({ silent: true })}
          >
            {overview.refreshing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh
          </Button>
        }
      >
        <p className="text-sm text-foreground leading-relaxed">
          This workstream captures the foundational issuer information that supports the front
          cover, definitions, general information, corporate history disclosures, and core
          registration summaries in the DRHP. Complete the Information sections, upload supporting
          documents, resolve conflicts, and obtain professional review before disclosures can be
          generated.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">
            Information: {sectionsComplete} of {totalSections} sections complete
          </p>
          {summary ? (
            <StatusBadge
              label={`Overall: ${overallStatusLabel(summary.overallStatus)}`}
              tone={
                summary.overallStatus === 'ready'
                  ? 'positive'
                  : summary.overallStatus === 'blocked'
                    ? 'critical'
                    : 'informative'
              }
            />
          ) : null}
        </div>

        {overview.error ? (
          <p className="border-l-2 border-destructive pl-3 text-sm text-destructive" role="alert">
            {overview.error}
          </p>
        ) : null}
      </SectionCard>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Scope</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Information areas covered within this workstream.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {WORKSTREAM_SCOPE_CARDS.map((card) => {
            const Icon = SCOPE_ICONS[card.id];
            return (
              <div key={card.id} className="bg-card border border-border rounded-lg p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-muted p-2 text-muted-foreground">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{card.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <SectionCard
        title="Contributes to the DRHP"
        description="DRHP sections that draw on verified information from this workstream."
      >
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DRHP_CONTRIBUTION_SECTIONS.map((section) => (
            <li
              key={section}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" aria-hidden />
              {section}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard
        title="Readiness"
        description="Information, documents, facts, and questions are assessed from saved data. Disclosures and professional review are not yet assessed."
      >
        {overview.loading && !summary ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            Loading readiness…
          </div>
        ) : (
          <ul className="space-y-3">
            <ReadinessRow
              title="Information"
              status={summary?.information.status}
              assessed={Boolean(summary)}
              detail={`${sectionsComplete} of ${totalSections} sections complete.`}
            />
            <ReadinessRow
              title="Documents"
              status={summary?.documents.status}
              assessed={Boolean(summary)}
              detail={
                summary
                  ? `${summary.documents.mandatoryUploaded} of ${summary.documents.mandatoryRequired} mandatory documents uploaded · ${summary.documents.mandatoryProcessed} processed${
                      summary.documents.mandatoryFailed > 0
                        ? ` · ${summary.documents.mandatoryFailed} failed`
                        : ''
                    }${
                      summary.documents.activeProcessingCount +
                        summary.documents.structuredExtractionActiveCount >
                      0
                        ? ' · processing in progress'
                        : ''
                    }`
                  : 'Document readiness is not available.'
              }
            />
            <ReadinessRow
              title="Facts"
              status={summary?.facts.status}
              assessed={Boolean(summary)}
              detail={
                summary
                  ? `${summary.facts.assertionCount} document values across ${summary.facts.factGroupCount} facts · ${summary.facts.approvedAssertionCount} approved · ${summary.facts.pendingReviewCount} pending review${
                      summary.facts.lowQualityCount > 0
                        ? ` · ${summary.facts.lowQualityCount} low quality`
                        : ''
                    }`
                  : 'Fact readiness is not available.'
              }
            />
            <ReadinessRow
              title="Questions"
              status={summary?.conflicts.status}
              assessed={Boolean(summary)}
              detail={
                summary
                  ? `${summary.conflicts.openIssueCount} open · ${summary.conflicts.blockingIssueCount} blocking · ${summary.conflicts.warningIssueCount} warnings · ${summary.conflicts.resolvedIssueCount} resolved`
                  : 'Question readiness is not available.'
              }
            />
            <ReadinessRow
              title="Generated Disclosures"
              assessed={false}
              detail="Disclosure generation has not been assessed for this workstream."
            />
            <ReadinessRow
              title="Professional Review"
              assessed={false}
              detail="Professional review has not been assessed for this workstream."
            />
          </ul>
        )}

        {summary ? (
          <div className="space-y-3">
            <p
              className={
                summary.readyForDisclosureGeneration
                  ? 'rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-foreground'
                  : 'rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground'
              }
              role="status"
            >
              {summary.readyForDisclosureGeneration
                ? 'This workstream currently meets the checks required before disclosure generation.'
                : 'This workstream is not yet ready for disclosure generation.'}
            </p>

            {summary.blockers.length > 0 ? (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">Blockers</h4>
                <ul className="space-y-1">
                  {summary.blockers.map((blocker) => (
                    <li
                      key={blocker.code}
                      className="border-l-2 border-destructive pl-3 text-sm text-foreground"
                    >
                      {blocker.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {summary.warnings.length > 0 ? (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">Warnings</h4>
                <ul className="space-y-1">
                  {summary.warnings.map((warning) => (
                    <li
                      key={warning.code}
                      className="border-l-2 border-warning pl-3 text-sm text-foreground"
                    >
                      {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </SectionCard>

      <FormActionRow>
        <Button type="button" onClick={onContinueToInformation}>
          Continue Information
        </Button>
      </FormActionRow>
    </div>
  );
}
