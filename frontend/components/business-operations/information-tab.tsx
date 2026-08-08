'use client';

import { BusinessOperationsSectionNavigation } from '@/components/business-operations/section-navigation';
import { BusinessProfileForm } from '@/components/business-operations/forms/business-profile-form';
import { CustomersSalesForm } from '@/components/business-operations/forms/customers-sales-form';
import { FacilitiesCapacityForm } from '@/components/business-operations/forms/facilities-capacity-form';
import { ProductsRevenueForm } from '@/components/business-operations/forms/products-revenue-form';
import { StrategyConfirmationsForm } from '@/components/business-operations/forms/strategy-confirmations-form';
import { SuppliersProcurementForm } from '@/components/business-operations/forms/suppliers-procurement-form';
import { TechnologyQualityIpForm } from '@/components/business-operations/forms/technology-quality-ip-form';
import { WorkforceInsuranceForm } from '@/components/business-operations/forms/workforce-insurance-form';
import { NivaraSampleDataPanel } from '@/components/demo-data/nivara-sample-data-panel';
import { useBusinessOperations } from '@/lib/business-operations/context';
import { BUSINESS_OPERATIONS_INFORMATION_SECTIONS } from '@/lib/business-operations/options';
import type { BusinessOperationsSectionId } from '@/lib/business-operations/types';
import type { BusinessOperationsPayload } from '@/lib/schemas/business-operations';

export function BusinessOperationsInformationTab({
  activeSection,
  onSectionChange,
}: {
  activeSection: BusinessOperationsSectionId;
  onSectionChange: (section: BusinessOperationsSectionId) => void;
}) {
  const { progress, dirtySections, confirmLeave, isDirty, applySampleDraft, isLoading } =
    useBusinessOperations();
  const meta = BUSINESS_OPERATIONS_INFORMATION_SECTIONS.find(
    (section) => section.id === activeSection,
  );

  const selectSection = (section: BusinessOperationsSectionId) => {
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
      <BusinessOperationsSectionNavigation
        activeSection={activeSection}
        progress={progress}
        dirtySections={dirtySections}
        onSelect={selectSection}
      />
      <div className="min-w-0 space-y-4">
        <NivaraSampleDataPanel<BusinessOperationsPayload>
          workstreamKey="business-operations"
          isDirty={isDirty}
          disabled={isLoading}
          applySampleDraft={applySampleDraft}
        />
        {meta ? <p className="text-sm text-muted-foreground">{meta.description}</p> : null}
        {activeSection === 'business-profile-operating-model' ? <BusinessProfileForm /> : null}
        {activeSection === 'products-services-revenue-mix' ? <ProductsRevenueForm /> : null}
        {activeSection === 'customers-sales-distribution-geography' ? (
          <CustomersSalesForm />
        ) : null}
        {activeSection === 'suppliers-procurement-inventory-logistics' ? (
          <SuppliersProcurementForm />
        ) : null}
        {activeSection === 'facilities-capacity-operational-process' ? (
          <FacilitiesCapacityForm />
        ) : null}
        {activeSection === 'technology-quality-rd-ip' ? <TechnologyQualityIpForm /> : null}
        {activeSection === 'workforce-collaborations-insurance-continuity' ? (
          <WorkforceInsuranceForm />
        ) : null}
        {activeSection === 'competitive-strengths-strategy-confirmations' ? (
          <StrategyConfirmationsForm />
        ) : null}
      </div>
    </div>
  );
}
