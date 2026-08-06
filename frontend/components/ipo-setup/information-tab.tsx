'use client';

import { EligibilityDeclarationsForm } from '@/components/ipo-setup/forms/eligibility-declarations-form';
import { IpoDirectionForm } from '@/components/ipo-setup/forms/ipo-direction-form';
import { IssuerConfirmationsForm } from '@/components/ipo-setup/forms/issuer-confirmations-form';
import { OfferStructureForm } from '@/components/ipo-setup/forms/offer-structure-form';
import { ProcessReadinessForm } from '@/components/ipo-setup/forms/process-readiness-form';
import { TrackRecordForm } from '@/components/ipo-setup/forms/track-record-form';
import { IpoSetupSectionNavigation } from '@/components/ipo-setup/section-navigation';
import { useIpoSetup } from '@/lib/ipo-setup/context';
import { IPO_SETUP_INFORMATION_SECTIONS } from '@/lib/ipo-setup/options';
import type { IpoSetupSectionId } from '@/lib/schemas/ipo-setup';

export function IpoSetupInformationTab({
  activeSection,
  onSectionChange,
}: {
  activeSection: IpoSetupSectionId;
  onSectionChange: (section: IpoSetupSectionId) => void;
}) {
  const { progress, dirtySections, confirmLeave, isLoading } = useIpoSetup();
  const meta = IPO_SETUP_INFORMATION_SECTIONS.find((section) => section.id === activeSection);

  const selectSection = (section: IpoSetupSectionId) => {
    if (section === activeSection) return;
    if (!confirmLeave(activeSection)) return;
    onSectionChange(section);
  };

  if (isLoading || !progress) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading IPO Setup information…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <IpoSetupSectionNavigation
          activeSection={activeSection}
          progress={progress}
          dirtySections={dirtySections}
          onSelect={selectSection}
        />
        <div className="min-w-0 space-y-4">
          {meta ? (
            <p className="text-sm text-muted-foreground">{meta.description}</p>
          ) : null}
          {activeSection === 'ipo-direction' ? <IpoDirectionForm /> : null}
          {activeSection === 'offer-structure' ? <OfferStructureForm /> : null}
          {activeSection === 'track-record-financial' ? <TrackRecordForm /> : null}
          {activeSection === 'eligibility-declarations' ? <EligibilityDeclarationsForm /> : null}
          {activeSection === 'process-readiness' ? <ProcessReadinessForm /> : null}
          {activeSection === 'issuer-confirmations' ? <IssuerConfirmationsForm /> : null}
        </div>
      </div>
    </div>
  );
}
