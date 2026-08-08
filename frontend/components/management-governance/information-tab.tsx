'use client';

import { BoardStructureForm } from '@/components/management-governance/forms/board-structure-form';
import { ChangesSuccessionForm } from '@/components/management-governance/forms/changes-succession-form';
import { CommitteesForm } from '@/components/management-governance/forms/committees-form';
import { DirectorsForm } from '@/components/management-governance/forms/directors-form';
import { GovernancePoliciesForm } from '@/components/management-governance/forms/governance-policies-form';
import { InterestsConflictsForm } from '@/components/management-governance/forms/interests-conflicts-form';
import { KmpOrganisationForm } from '@/components/management-governance/forms/kmp-organisation-form';
import { RemunerationForm } from '@/components/management-governance/forms/remuneration-form';
import { ManagementGovernanceSectionNavigation } from '@/components/management-governance/section-navigation';
import { NivaraSampleDataPanel } from '@/components/demo-data/nivara-sample-data-panel';
import { useManagementGovernance } from '@/lib/management-governance/context';
import { MANAGEMENT_GOVERNANCE_INFORMATION_SECTIONS } from '@/lib/management-governance/options';
import type {
  ManagementGovernancePayload,
  ManagementGovernanceSectionId,
} from '@/lib/schemas/management-governance';

export function ManagementGovernanceInformationTab({
  activeSection,
  onSectionChange,
}: {
  activeSection: ManagementGovernanceSectionId;
  onSectionChange: (section: ManagementGovernanceSectionId) => void;
}) {
  const { progress, dirtySections, confirmLeave, isDirty, applySampleDraft, isLoading } =
    useManagementGovernance();
  const meta = MANAGEMENT_GOVERNANCE_INFORMATION_SECTIONS.find(
    (section) => section.id === activeSection,
  );

  const selectSection = (section: ManagementGovernanceSectionId) => {
    if (section === activeSection) return;
    if (!confirmLeave(activeSection)) return;
    onSectionChange(section);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <ManagementGovernanceSectionNavigation
        activeSection={activeSection}
        progress={progress}
        dirtySections={dirtySections}
        onSelect={selectSection}
      />
      <div className="min-w-0 space-y-4">
        <NivaraSampleDataPanel<ManagementGovernancePayload>
          workstreamKey="management-governance"
          isDirty={isDirty}
          disabled={isLoading}
          applySampleDraft={applySampleDraft}
        />
        {meta ? <p className="text-sm text-muted-foreground">{meta.description}</p> : null}
        {activeSection === 'board-structure-and-ipo-governance-readiness' ? (
          <BoardStructureForm />
        ) : null}
        {activeSection === 'directors-profiles-appointments-and-eligibility' ? (
          <DirectorsForm />
        ) : null}
        {activeSection === 'kmp-senior-management-and-organisation-structure' ? (
          <KmpOrganisationForm />
        ) : null}
        {activeSection === 'board-committees-and-governance-bodies' ? <CommitteesForm /> : null}
        {activeSection === 'remuneration-service-contracts-esops-and-benefits' ? (
          <RemunerationForm />
        ) : null}
        {activeSection === 'interests-conflicts-and-management-relationships' ? (
          <InterestsConflictsForm />
        ) : null}
        {activeSection === 'changes-continuity-and-succession' ? <ChangesSuccessionForm /> : null}
        {activeSection === 'governance-policies-rpt-oversight-and-confirmations' ? (
          <GovernancePoliciesForm />
        ) : null}
      </div>
    </div>
  );
}
