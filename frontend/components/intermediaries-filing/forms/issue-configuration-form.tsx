'use client';

import {
  asEnumValue,
  ComputedStat,
  FieldGrid,
  linkedCapitalFields,
  linkedIpoFields,
  LinkedWorkstreamPanel,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/intermediaries-filing/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/intermediaries-filing/repeatable-card';
import { IntermediariesFilingSectionActions } from '@/components/intermediaries-filing/section-actions';
import { useIntermediariesFiling } from '@/lib/intermediaries-filing/context';
import { createEmptyInvestorAllocationRecord } from '@/lib/intermediaries-filing/defaults';
import {
  FILING_STAGE_OPTIONS,
  INVESTOR_CATEGORY_OPTIONS,
  OFFER_DOCUMENT_FORM_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
  READINESS_STATE_OPTIONS,
} from '@/lib/intermediaries-filing/options';
import type {
  FilingStage,
  InvestorCategory,
  IssueConfigurationAndFilingSnapshot,
  OfferDocumentForm,
  ProfessionalConfirmationStatus,
  ReadinessState,
} from '@/lib/schemas/intermediaries-filing';

const SECTION_ID = 'issue-configuration-and-filing-snapshot' as const;

export function IssueConfigurationForm() {
  const { payload, linkedReferences, model, updateSection } = useIntermediariesFiling();
  const value = payload.issueConfigurationAndFilingSnapshot;

  const set = (next: IssueConfigurationAndFilingSnapshot) => {
    updateSection('issueConfigurationAndFilingSnapshot', next, SECTION_ID);
  };

  const setFilingSnapshot = (patch: Partial<IssueConfigurationAndFilingSnapshot['filingSnapshot']>) => {
    set({ ...value, filingSnapshot: { ...value.filingSnapshot, ...patch } });
  };

  const setReconciliation = (
    patch: Partial<IssueConfigurationAndFilingSnapshot['filingSnapshotReconciliation']>,
  ) => {
    set({
      ...value,
      filingSnapshotReconciliation: { ...value.filingSnapshotReconciliation, ...patch },
    });
  };

  const setPricing = (patch: Partial<IssueConfigurationAndFilingSnapshot['pricing']>) => {
    set({ ...value, pricing: { ...value.pricing, ...patch } });
  };

  const setLotDetails = (patch: Partial<IssueConfigurationAndFilingSnapshot['lotApplicationDetails']>) => {
    set({ ...value, lotApplicationDetails: { ...value.lotApplicationDetails, ...patch } });
  };

  const setAllocations = (
    investorAllocations: IssueConfigurationAndFilingSnapshot['investorAllocations'],
  ) => set({ ...value, investorAllocations });

  const setAllocation = (
    index: number,
    next: IssueConfigurationAndFilingSnapshot['investorAllocations'][number],
  ) => {
    setAllocations(replaceAt(value.investorAllocations, index, next));
  };

  return (
    <SectionCard
      title="Issue Configuration & Filing Snapshot"
      description="Linked IPO Setup / Capital snapshot, filing freeze status, pricing and investor allocations."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <LinkedWorkstreamPanel
          title="IPO Setup linked snapshot"
          available={linkedReferences.ipoSetup.available}
          fields={linkedIpoFields(payload, linkedReferences)}
        />
        <LinkedWorkstreamPanel
          title="Capital linked snapshot"
          available={linkedReferences.capitalOwnership.available}
          fields={linkedCapitalFields(payload, linkedReferences)}
        />
      </div>

      <SubSection title="Filing snapshot">
        <FieldGrid columns={3}>
          <TextInputField
            id="snapshot-date"
            label="Snapshot date"
            type="date"
            value={value.filingSnapshot.snapshotDate}
            onChange={(next) => setFilingSnapshot({ snapshotDate: next })}
          />
          <SelectField
            id="filing-stage"
            label="Filing stage"
            value={value.filingSnapshot.filingStage}
            onChange={(next) =>
              setFilingSnapshot({ filingStage: asEnumValue<FilingStage>(next) })
            }
            options={[{ value: '', label: 'Select…' }, ...FILING_STAGE_OPTIONS]}
          />
          <SelectField
            id="offer-document-form"
            label="Current offer document form"
            value={value.filingSnapshot.currentOfferDocumentForm}
            onChange={(next) =>
              setFilingSnapshot({
                currentOfferDocumentForm: asEnumValue<OfferDocumentForm>(next),
              })
            }
            options={[{ value: '', label: 'Select…' }, ...OFFER_DOCUMENT_FORM_OPTIONS]}
          />
          <TextInputField
            id="designated-exchange"
            label="Designated stock exchange"
            value={value.filingSnapshot.selectedDesignatedStockExchange}
            onChange={(next) => setFilingSnapshot({ selectedDesignatedStockExchange: next })}
          />
          <TextInputField
            id="additional-exchange"
            label="Additional exchange"
            value={value.filingSnapshot.additionalExchange}
            onChange={(next) => setFilingSnapshot({ additionalExchange: next })}
          />
          <TextInputField
            id="offer-document-cut-off"
            label="Offer document cut-off date"
            type="date"
            value={value.filingSnapshot.offerDocumentCutOffDate}
            onChange={(next) => setFilingSnapshot({ offerDocumentCutOffDate: next })}
          />
          <TernaryField
            id="issue-structure-frozen"
            label="Issue structure frozen"
            value={value.filingSnapshot.issueStructureFrozen}
            onChange={(next) => setFilingSnapshot({ issueStructureFrozen: next })}
          />
          <TernaryField
            id="capital-structure-frozen"
            label="Capital structure frozen"
            value={value.filingSnapshot.capitalStructureFrozen}
            onChange={(next) => setFilingSnapshot({ capitalStructureFrozen: next })}
          />
          <TernaryField
            id="objects-frozen"
            label="Objects frozen"
            value={value.filingSnapshot.objectsFrozen}
            onChange={(next) => setFilingSnapshot({ objectsFrozen: next })}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Filing snapshot reconciliation">
        <FieldGrid columns={3}>
          <TextInputField
            id="fresh-issue-shares"
            label="Fresh issue shares"
            value={value.filingSnapshotReconciliation.freshIssueShares}
            onChange={(next) => setReconciliation({ freshIssueShares: next })}
          />
          <TextInputField
            id="ofs-shares"
            label="OFS shares"
            value={value.filingSnapshotReconciliation.ofsShares}
            onChange={(next) => setReconciliation({ ofsShares: next })}
          />
          <TextInputField
            id="total-offer-shares"
            label="Total offer shares"
            value={value.filingSnapshotReconciliation.totalOfferShares}
            onChange={(next) => setReconciliation({ totalOfferShares: next })}
          />
          <TextInputField
            id="fresh-issue-amount"
            label="Fresh issue amount"
            value={value.filingSnapshotReconciliation.freshIssueAmount}
            onChange={(next) => setReconciliation({ freshIssueAmount: next })}
          />
          <TextInputField
            id="ofs-amount"
            label="OFS amount"
            value={value.filingSnapshotReconciliation.ofsAmount}
            onChange={(next) => setReconciliation({ ofsAmount: next })}
          />
          <TextInputField
            id="total-offer-amount"
            label="Total offer amount"
            value={value.filingSnapshotReconciliation.totalOfferAmount}
            onChange={(next) => setReconciliation({ totalOfferAmount: next })}
          />
          <SelectField
            id="filing-confirmation-status"
            label="Filing confirmation status"
            value={value.filingSnapshotReconciliation.filingConfirmationStatus}
            onChange={(next) =>
              setReconciliation({
                filingConfirmationStatus: asEnumValue<ReadinessState>(next),
              })
            }
            options={[{ value: '', label: 'Select…' }, ...READINESS_STATE_OPTIONS]}
          />
          <SelectField
            id="reconciliation-professional-confirmation"
            label="Professional confirmation"
            value={value.filingSnapshotReconciliation.professionalConfirmation}
            onChange={(next) =>
              setReconciliation({
                professionalConfirmation: asEnumValue<ProfessionalConfirmationStatus>(next),
              })
            }
            options={[{ value: '', label: 'Select…' }, ...PROFESSIONAL_CONFIRMATION_OPTIONS]}
          />
        </FieldGrid>
        <TextAreaField
          id="discrepancy-note"
          label="Discrepancy note"
          value={value.filingSnapshotReconciliation.discrepancyNote}
          onChange={(next) => setReconciliation({ discrepancyNote: next })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Reconciliation preview:</span>
          <ComputedStat
            label="Mismatch count"
            value={String(model.reconciliation.totalMismatchCount)}
          />
          <ComputedStat
            label="IPO Setup status"
            value={model.reconciliation.ipoSetup.status || '—'}
          />
        </div>
      </SubSection>

      <SubSection title="Pricing">
        <FieldGrid columns={3}>
          <TextInputField
            id="pricing-method"
            label="Pricing method"
            value={value.pricing.pricingMethod}
            onChange={(next) => setPricing({ pricingMethod: next })}
          />
          <TextInputField
            id="floor-price"
            label="Floor price"
            value={value.pricing.floorPrice}
            onChange={(next) => setPricing({ floorPrice: next })}
          />
          <TextInputField
            id="cap-price"
            label="Cap price"
            value={value.pricing.capPrice}
            onChange={(next) => setPricing({ capPrice: next })}
          />
          <TextInputField
            id="price-band"
            label="Price band"
            value={value.pricing.priceBand}
            onChange={(next) => setPricing({ priceBand: next })}
          />
          <TextInputField
            id="final-issue-price"
            label="Final issue price"
            value={value.pricing.finalIssuePrice}
            onChange={(next) => setPricing({ finalIssuePrice: next })}
          />
          <TernaryField
            id="price-discovery-pending"
            label="Price discovery pending"
            value={value.pricing.priceDiscoveryPending}
            onChange={(next) => setPricing({ priceDiscoveryPending: next })}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Investor allocations"
        addLabel="Add allocation"
        onAdd={() =>
          setAllocations([...value.investorAllocations, createEmptyInvestorAllocationRecord()])
        }
        emptyMessage="No investor allocations recorded."
        count={value.investorAllocations.length}
      >
        {value.investorAllocations.map((allocation, index) => (
          <RepeatableCard
            key={allocation.allocationId}
            title={`Allocation ${index + 1}`}
            onRemove={() => setAllocations(removeAt(value.investorAllocations, index))}
            removeLabel="Remove allocation"
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`allocation-category-${index}`}
                label="Category"
                value={allocation.category}
                onChange={(next) =>
                  setAllocation(index, {
                    ...allocation,
                    category: asEnumValue<InvestorCategory>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...INVESTOR_CATEGORY_OPTIONS]}
              />
              <TernaryField
                id={`allocation-applicable-${index}`}
                label="Applicable"
                value={allocation.applicable}
                onChange={(next) => setAllocation(index, { ...allocation, applicable: next })}
              />
              <TextInputField
                id={`allocation-shares-${index}`}
                label="Shares"
                value={allocation.shares}
                onChange={(next) => setAllocation(index, { ...allocation, shares: next })}
              />
              <TextInputField
                id={`allocation-percentage-${index}`}
                label="Percentage"
                value={allocation.percentage}
                onChange={(next) => setAllocation(index, { ...allocation, percentage: next })}
              />
              <TextInputField
                id={`allocation-amount-${index}`}
                label="Amount"
                value={allocation.amount}
                onChange={(next) => setAllocation(index, { ...allocation, amount: next })}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Lot & application details">
        <FieldGrid columns={3}>
          <TextInputField
            id="lot-size"
            label="Lot size"
            value={value.lotApplicationDetails.lotSize}
            onChange={(next) => setLotDetails({ lotSize: next })}
          />
          <TextInputField
            id="minimum-application-lots"
            label="Minimum application lots"
            value={value.lotApplicationDetails.minimumApplicationLots}
            onChange={(next) => setLotDetails({ minimumApplicationLots: next })}
          />
          <TextInputField
            id="minimum-application-amount"
            label="Minimum application amount"
            value={value.lotApplicationDetails.minimumApplicationAmount}
            onChange={(next) => setLotDetails({ minimumApplicationAmount: next })}
          />
          <TernaryField
            id="cut-off-price-permitted"
            label="Cut-off price permitted"
            value={value.lotApplicationDetails.cutOffPricePermitted}
            onChange={(next) => setLotDetails({ cutOffPricePermitted: next })}
          />
        </FieldGrid>
      </SubSection>

      <IntermediariesFilingSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
