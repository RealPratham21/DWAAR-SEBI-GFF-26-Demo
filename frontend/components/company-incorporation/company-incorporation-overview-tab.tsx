'use client';

import {
  Building2,
  FileText,
  History,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormActionRow, SectionCard } from '@/components/company-incorporation/form-primitives';
import { NeutralStatusBadge } from '@/components/company-incorporation/tab-shared';
import { useCompanyIncorporation } from '@/lib/company-incorporation/context';
import {
  DRHP_CONTRIBUTION_SECTIONS,
  READINESS_CHECKLIST_ITEMS,
  READINESS_COMPLETE_STATUS,
  READINESS_IN_PROGRESS_STATUS,
  READINESS_NEUTRAL_STATUS,
  READINESS_NOT_STARTED_STATUS,
  READINESS_SECTION_MAP,
  WORKSTREAM_SCOPE_CARDS,
} from '@/lib/company-incorporation/overview-config';
import type { SectionStatus } from '@/lib/company-incorporation/types';

const SCOPE_ICONS: Record<(typeof WORKSTREAM_SCOPE_CARDS)[number]['id'], typeof Building2> = {
  'legal-identity': Building2,
  'corporate-history': History,
  'offices-contact': MapPin,
  'constitutional-records': FileText,
  'core-registrations': ShieldCheck,
};

function statusLabel(status: SectionStatus) {
  switch (status) {
    case 'complete':
      return READINESS_COMPLETE_STATUS;
    case 'in_progress':
      return READINESS_IN_PROGRESS_STATUS;
    default:
      return READINESS_NOT_STARTED_STATUS;
  }
}

interface CompanyIncorporationOverviewTabProps {
  onContinueToInformation: () => void;
}

export function CompanyIncorporationOverviewTab({
  onContinueToInformation,
}: CompanyIncorporationOverviewTabProps) {
  const { progress } = useCompanyIncorporation();
  const sectionsComplete = progress?.sectionsComplete ?? 0;
  const totalSections = progress?.totalSections ?? 6;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Workstream Overview"
        description="Establish the issuer’s legal identity, corporate history, constitutional records, offices, and core registrations required for DRHP preparation."
      >
        <p className="text-sm text-foreground leading-relaxed">
          This workstream captures the foundational issuer information that supports the front
          cover, definitions, general information, corporate history disclosures, and core
          registration summaries in the DRHP. Complete the Information sections, upload supporting
          documents, resolve conflicts, and obtain professional review before disclosures can be
          generated.
        </p>
        <p className="text-sm font-medium text-foreground mt-4">
          Information: {sectionsComplete} of {totalSections} sections complete
        </p>
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
              <div
                key={card.id}
                className="bg-card border border-border rounded-lg p-5 space-y-3"
              >
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
        title="Readiness Checklist"
        description="Information readiness is derived from saved workstream data. Documents, conflicts, disclosures, and review remain unassessed."
      >
        <ul className="space-y-3">
          {READINESS_CHECKLIST_ITEMS.map((item) => {
            const sectionId = READINESS_SECTION_MAP[item.id];
            const sectionStatus = sectionId ? progress?.sections[sectionId] : undefined;
            const isComplete = sectionStatus === 'complete';
            const label = sectionId
              ? statusLabel(sectionStatus ?? 'not_started')
              : READINESS_NEUTRAL_STATUS;

            return (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-border px-4 py-3"
              >
                <label className="flex items-start gap-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={isComplete}
                    disabled
                    readOnly
                    aria-label={item.label}
                    className="mt-0.5 h-4 w-4 rounded border-input accent-accent opacity-60"
                  />
                  <span>{item.label}</span>
                </label>
                <NeutralStatusBadge label={label} />
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <FormActionRow>
        <Button type="button" onClick={onContinueToInformation}>
          Continue Information
        </Button>
      </FormActionRow>
    </div>
  );
}
