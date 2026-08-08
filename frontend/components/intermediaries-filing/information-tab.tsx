'use client';

import type { ComponentType } from 'react';
import { DdCertificatesForm } from '@/components/intermediaries-filing/forms/dd-certificates-form';
import { FilingMilestonesForm } from '@/components/intermediaries-filing/forms/filing-milestones-form';
import { FinalDocumentForm } from '@/components/intermediaries-filing/forms/final-document-form';
import { InfrastructureForm } from '@/components/intermediaries-filing/forms/infrastructure-form';
import { IssueConfigurationForm } from '@/components/intermediaries-filing/forms/issue-configuration-form';
import { IssueProgrammeForm } from '@/components/intermediaries-filing/forms/issue-programme-form';
import { IssueTeamForm } from '@/components/intermediaries-filing/forms/issue-team-form';
import { UnderwritingForm } from '@/components/intermediaries-filing/forms/underwriting-form';
import { IntermediariesFilingSectionNavigation } from '@/components/intermediaries-filing/section-navigation';
import { NivaraSampleDataPanel } from '@/components/demo-data/nivara-sample-data-panel';
import { useIntermediariesFiling } from '@/lib/intermediaries-filing/context';
import { IF_INFORMATION_SECTIONS } from '@/lib/intermediaries-filing/options';
import type {
  IntermediariesFilingPayload,
  IntermediariesFilingSectionId,
} from '@/lib/schemas/intermediaries-filing';

const FORM_BY_SECTION: Record<IntermediariesFilingSectionId, ComponentType> = {
  'issue-team-and-intermediary-master': IssueTeamForm,
  'issue-configuration-and-filing-snapshot': IssueConfigurationForm,
  'filing-and-regulatory-milestone-tracker': FilingMilestonesForm,
  'due-diligence-certificates-consents-and-signoffs': DdCertificatesForm,
  'depositories-banking-asba-upi-and-issue-infrastructure': InfrastructureForm,
  'underwriting-market-making-and-distribution-arrangements': UnderwritingForm,
  'issue-programme-allotment-listing-and-post-issue-execution': IssueProgrammeForm,
  'final-offer-document-advertisements-material-documents-and-filing-readiness':
    FinalDocumentForm,
};

export function IntermediariesFilingInformationTab({
  activeSection,
  onSectionChange,
}: {
  activeSection: IntermediariesFilingSectionId;
  onSectionChange: (section: IntermediariesFilingSectionId) => void;
}) {
  const { progress, dirtySections, confirmLeave, isDirty, applySampleDraft, isLoading } =
    useIntermediariesFiling();
  const sectionMeta = IF_INFORMATION_SECTIONS.find((section) => section.id === activeSection);
  const ActiveForm = FORM_BY_SECTION[activeSection];

  const handleSectionChange = (sectionId: IntermediariesFilingSectionId) => {
    if (sectionId === activeSection) return;
    if (!confirmLeave(activeSection)) return;
    onSectionChange(sectionId);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <IntermediariesFilingSectionNavigation
          activeSection={activeSection}
          progress={progress}
          dirtySections={dirtySections}
          onSelect={handleSectionChange}
        />
      </aside>

      <div className="min-w-0 space-y-4">
        <NivaraSampleDataPanel<IntermediariesFilingPayload>
          workstreamKey="intermediaries-filing"
          isDirty={isDirty}
          disabled={isLoading}
          applySampleDraft={applySampleDraft}
        />
        {sectionMeta ? (
          <p className="text-sm text-muted-foreground">{sectionMeta.description}</p>
        ) : null}
        <ActiveForm />
      </div>
    </div>
  );
}
