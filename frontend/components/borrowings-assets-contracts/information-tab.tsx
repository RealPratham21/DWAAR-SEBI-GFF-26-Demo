'use client';

import type { ComponentType } from 'react';
import { CovenantsConsentsForm } from '@/components/borrowings-assets-contracts/forms/covenants-consents-form';
import { ContractMaterialityForm } from '@/components/borrowings-assets-contracts/forms/contract-materiality-form';
import { ContractsForm } from '@/components/borrowings-assets-contracts/forms/contracts-form';
import { FacilityMasterForm } from '@/components/borrowings-assets-contracts/forms/facility-master-form';
import { MaterialAssetsForm } from '@/components/borrowings-assets-contracts/forms/material-assets-form';
import { PropertiesForm } from '@/components/borrowings-assets-contracts/forms/properties-form';
import { ReconciliationForm } from '@/components/borrowings-assets-contracts/forms/reconciliation-form';
import { SecurityChargesForm } from '@/components/borrowings-assets-contracts/forms/security-charges-form';
import { BorrowingsAssetsContractsSectionNavigation } from '@/components/borrowings-assets-contracts/section-navigation';
import { NivaraSampleDataPanel } from '@/components/demo-data/nivara-sample-data-panel';
import { useBorrowingsAssetsContracts } from '@/lib/borrowings-assets-contracts/context';
import { BAC_INFORMATION_SECTIONS } from '@/lib/borrowings-assets-contracts/options';
import type {
  BorrowingsAssetsContractsPayload,
  BorrowingsAssetsContractsSectionId,
} from '@/lib/schemas/borrowings-assets-contracts';

const FORM_BY_SECTION: Record<BorrowingsAssetsContractsSectionId, ComponentType> = {
  'financial-indebtedness-and-facility-master': FacilityMasterForm,
  'security-charges-guarantees-and-borrowing-powers': SecurityChargesForm,
  'covenants-defaults-waivers-and-lender-consents': CovenantsConsentsForm,
  'immovable-properties-and-occupancy-rights': PropertiesForm,
  'material-assets-encumbrance-and-insurance-linkage': MaterialAssetsForm,
  'material-business-strategic-and-other-contracts': ContractsForm,
  'contract-materiality-expiry-and-inspection-readiness': ContractMaterialityForm,
  'reconciliation-changes-and-issuer-confirmations': ReconciliationForm,
};

export function BorrowingsAssetsContractsInformationTab({
  activeSection,
  onSectionChange,
}: {
  activeSection: BorrowingsAssetsContractsSectionId;
  onSectionChange: (section: BorrowingsAssetsContractsSectionId) => void;
}) {
  const { progress, dirtySections, confirmLeave, isDirty, applySampleDraft, isLoading } =
    useBorrowingsAssetsContracts();
  const sectionMeta = BAC_INFORMATION_SECTIONS.find((s) => s.id === activeSection);
  const ActiveForm = FORM_BY_SECTION[activeSection];

  const handleSectionChange = (sectionId: BorrowingsAssetsContractsSectionId) => {
    if (sectionId === activeSection) return;
    if (!confirmLeave(activeSection)) return;
    onSectionChange(sectionId);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <BorrowingsAssetsContractsSectionNavigation
          activeSection={activeSection}
          progress={progress}
          dirtySections={dirtySections}
          onSelect={handleSectionChange}
        />
      </aside>

      <div className="min-w-0 space-y-4">
        <NivaraSampleDataPanel<BorrowingsAssetsContractsPayload>
          workstreamKey="borrowings-assets-contracts"
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
