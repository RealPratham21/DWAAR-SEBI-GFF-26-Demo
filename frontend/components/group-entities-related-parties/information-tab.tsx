'use client';

import type { ComponentType } from 'react';
import { ChangesConfirmationsForm } from '@/components/group-entities-related-parties/forms/changes-confirmations-form';
import { ClassificationForm } from '@/components/group-entities-related-parties/forms/classification-form';
import { CommonPursuitsForm } from '@/components/group-entities-related-parties/forms/common-pursuits-form';
import { EntityMasterForm } from '@/components/group-entities-related-parties/forms/entity-master-form';
import { FinancialReadinessForm } from '@/components/group-entities-related-parties/forms/financial-readiness-form';
import { OwnershipMappingForm } from '@/components/group-entities-related-parties/forms/ownership-mapping-form';
import { RelatedPartyForm } from '@/components/group-entities-related-parties/forms/related-party-form';
import { RptForm } from '@/components/group-entities-related-parties/forms/rpt-form';
import { GroupEntitiesSectionNavigation } from '@/components/group-entities-related-parties/section-navigation';
import { NivaraSampleDataPanel } from '@/components/demo-data/nivara-sample-data-panel';
import { useGroupEntities } from '@/lib/group-entities-related-parties/context';
import { GROUP_ENTITIES_INFORMATION_SECTIONS } from '@/lib/group-entities-related-parties/options';
import type {
  GroupEntitiesRelatedPartiesPayload,
  GroupEntitiesSectionId,
} from '@/lib/schemas/group-entities-related-parties';

const FORM_BY_SECTION: Record<GroupEntitiesSectionId, ComponentType> = {
  'group-structure-and-entity-master': EntityMasterForm,
  'ownership-control-and-relationship-mapping': OwnershipMappingForm,
  'group-company-and-materiality-classification': ClassificationForm,
  'related-party-universe-and-classification': RelatedPartyForm,
  'related-party-transactions-balances-and-commitments': RptForm,
  'common-pursuits-dependencies-and-conflicts': CommonPursuitsForm,
  'group-entity-financial-regulatory-and-litigation-readiness': FinancialReadinessForm,
  'changes-rpt-readiness-and-confirmations': ChangesConfirmationsForm,
};

export function GroupEntitiesInformationTab({
  activeSection,
  onSectionChange,
}: {
  activeSection: GroupEntitiesSectionId;
  onSectionChange: (section: GroupEntitiesSectionId) => void;
}) {
  const { progress, dirtySections, confirmLeave, isDirty, applySampleDraft, isLoading } =
    useGroupEntities();
  const sectionMeta = GROUP_ENTITIES_INFORMATION_SECTIONS.find((s) => s.id === activeSection);
  const ActiveForm = FORM_BY_SECTION[activeSection];

  const handleSectionChange = (sectionId: GroupEntitiesSectionId) => {
    if (sectionId === activeSection) return;
    if (!confirmLeave(activeSection)) return;
    onSectionChange(sectionId);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <GroupEntitiesSectionNavigation
          activeSection={activeSection}
          progress={progress}
          dirtySections={dirtySections}
          onSelect={handleSectionChange}
        />
      </aside>

      <div className="min-w-0 space-y-4">
        <NivaraSampleDataPanel<GroupEntitiesRelatedPartiesPayload>
          workstreamKey="group-entities-related-parties"
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
