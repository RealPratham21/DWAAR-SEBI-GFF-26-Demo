'use client';

import { CapitalOwnershipSectionNavigation } from '@/components/capital-ownership/section-navigation';
import { ContributionLockInForm } from '@/components/capital-ownership/forms/contribution-lock-in-form';
import { CurrentCapitalStructureForm } from '@/components/capital-ownership/forms/current-capital-structure-form';
import { OutstandingConfirmationsForm } from '@/components/capital-ownership/forms/outstanding-confirmations-form';
import { PrePostIssueForm } from '@/components/capital-ownership/forms/pre-post-issue-form';
import { PromotersControlForm } from '@/components/capital-ownership/forms/promoters-control-form';
import { ShareCapitalHistoryForm } from '@/components/capital-ownership/forms/share-capital-history-form';
import { ShareholdersForm } from '@/components/capital-ownership/forms/shareholders-form';
import { useCapitalOwnership } from '@/lib/capital-ownership/context';
import { CAPITAL_OWNERSHIP_INFORMATION_SECTIONS } from '@/lib/capital-ownership/options';
import type { CapitalOwnershipSectionId } from '@/lib/capital-ownership/types';

export function CapitalOwnershipInformationTab({
  activeSection,
  onSectionChange,
}: {
  activeSection: CapitalOwnershipSectionId;
  onSectionChange: (section: CapitalOwnershipSectionId) => void;
}) {
  const { progress, dirtySections, confirmLeave, isLoading } = useCapitalOwnership();
  const meta = CAPITAL_OWNERSHIP_INFORMATION_SECTIONS.find(
    (section) => section.id === activeSection,
  );

  const selectSection = (section: CapitalOwnershipSectionId) => {
    if (section === activeSection) return;
    if (!confirmLeave(activeSection)) return;
    onSectionChange(section);
  };

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading Information…
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <CapitalOwnershipSectionNavigation
        activeSection={activeSection}
        progress={progress}
        dirtySections={dirtySections}
        onSelect={selectSection}
      />
      <div className="min-w-0 space-y-4">
        {meta ? <p className="text-sm text-muted-foreground">{meta.description}</p> : null}
        {activeSection === 'current-capital-structure' ? <CurrentCapitalStructureForm /> : null}
        {activeSection === 'share-capital-history' ? <ShareCapitalHistoryForm /> : null}
        {activeSection === 'shareholders-beneficial-ownership' ? <ShareholdersForm /> : null}
        {activeSection === 'promoters-and-control' ? <PromotersControlForm /> : null}
        {activeSection === 'pre-post-issue-ownership' ? <PrePostIssueForm /> : null}
        {activeSection === 'promoter-contribution-lock-in' ? <ContributionLockInForm /> : null}
        {activeSection === 'outstanding-securities-confirmations' ? (
          <OutstandingConfirmationsForm />
        ) : null}
      </div>
    </div>
  );
}
