'use client';

import {
  ComputedStat,
  DateField,
  DecimalInputField,
  FieldGrid,
  PendingWorkstreamNotice,
  SelectField,
  StatGrid,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/objects-of-issue/form-helpers';
import {
  hasRecordData,
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/objects-of-issue/repeatable-card';
import { ObjectsOfIssueSectionActions } from '@/components/objects-of-issue/section-actions';
import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { useObjectsOfIssue } from '@/lib/objects-of-issue/context';
import { createEmptyCapexItem } from '@/lib/objects-of-issue/defaults';
import { EM_DASH, formatMoney } from '@/lib/objects-of-issue/format';
import {
  APPROVAL_STATUS_OPTIONS,
  CAPEX_ITEM_TYPE_OPTIONS,
  QUOTATION_SOURCE_OPTIONS,
} from '@/lib/objects-of-issue/options';
import type {
  ApprovalStatus,
  CapexItem,
  CapexItemType,
  QuotationSource,
} from '@/lib/objects-of-issue/types';

const SECTION_ID = 'capital-expenditure-facilities-and-expansion' as const;

export function CapexExpansionForm() {
  const { payload, updateSection, model } = useObjectsOfIssue();
  const value = payload.capitalExpenditureFacilitiesAndExpansion;
  const isRelevant = model.hasCapexRelevantObjects;

  const setItems = (next: CapexItem[]) => {
    updateSection(
      'capitalExpenditureFacilitiesAndExpansion',
      { ...value, capexItems: next },
      SECTION_ID,
    );
  };

  const setItem = <K extends keyof CapexItem>(index: number, key: K, next: CapexItem[K]) => {
    setItems(replaceAt(value.capexItems, index, { ...value.capexItems[index], [key]: next }));
  };

  const setNotApplicableNote = (next: string) => {
    updateSection(
      'capitalExpenditureFacilitiesAndExpansion',
      { ...value, notApplicableNote: next },
      SECTION_ID,
    );
  };

  const setNotes = (next: string) => {
    updateSection('capitalExpenditureFacilitiesAndExpansion', { ...value, notes: next }, SECTION_ID);
  };

  return (
    <SectionCard
      title="Capital Expenditure, Facilities & Expansion"
      description="Plant, machinery, technology and facility or branch expansion funded from the issue."
    >
      {isRelevant ? (
        <p
          role="note"
          className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-foreground"
        >
          The objects register includes a capital-expenditure object — capture the underlying
          capex items here.
        </p>
      ) : value.capexItems.length === 0 ? (
        <PendingWorkstreamNotice message="No capital-expenditure object is currently recorded. This section is currently not applicable — add a note below if that changes, or record items directly." />
      ) : null}

      <StatGrid title="Capex summary">
        <ComputedStat
          label="Total estimated capex cost"
          value={model.totalCapexCost ? formatMoney(model.totalCapexCost) : EM_DASH}
        />
        <ComputedStat label="Items recorded" value={String(value.capexItems.length)} />
      </StatGrid>

      <RepeatableList
        title="Capex items"
        description="New plant and machinery, facility expansion, technology upgrades and branch or outlet expansion."
        addLabel="Add capex item"
        count={value.capexItems.length}
        emptyMessage="No capex item recorded yet."
        onAdd={() => setItems([...value.capexItems, createEmptyCapexItem()])}
      >
        {value.capexItems.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.description || `Capex item ${index + 1}`}
            subtitle={item.itemType || undefined}
            requiresConfirmation={hasRecordData([item.description, item.estimatedCost])}
            confirmMessage="Remove this capex item? Entered values will be lost."
            onRemove={() => setItems(removeAt(value.capexItems, index))}
          >
            <FieldGrid>
              <SelectField
                id={`cx-item-${index}-type`}
                label="Item type"
                required
                value={item.itemType}
                onChange={(next) => setItem(index, 'itemType', next as CapexItemType | '')}
                options={CAPEX_ITEM_TYPE_OPTIONS}
              />
              <TextInputField
                id={`cx-item-${index}-location`}
                label="Location / facility"
                value={item.location}
                onChange={(next) => setItem(index, 'location', next)}
              />
              <DecimalInputField
                id={`cx-item-${index}-estimated-cost`}
                label="Estimated cost (₹)"
                required
                value={item.estimatedCost}
                onChange={(next) => setItem(index, 'estimatedCost', next)}
              />
              <DateField
                id={`cx-item-${index}-commissioning-date`}
                label="Expected commissioning date"
                value={item.expectedCommissioningDate}
                onChange={(next) => setItem(index, 'expectedCommissioningDate', next)}
              />
              <TextInputField
                id={`cx-item-${index}-related-object`}
                label="Related object ID (optional)"
                value={item.relatedObjectId}
                onChange={(next) => setItem(index, 'relatedObjectId', next)}
              />
              <SelectField
                id={`cx-item-${index}-quotation-source`}
                label="Quotation source"
                value={item.quotationSource}
                onChange={(next) => setItem(index, 'quotationSource', next as QuotationSource | '')}
                options={QUOTATION_SOURCE_OPTIONS}
              />
              <TernaryField
                id={`cx-item-${index}-related-party`}
                label="Related-party purchase"
                value={item.relatedPartyPurchase}
                onChange={(next) => setItem(index, 'relatedPartyPurchase', next)}
              />
              <TernaryField
                id={`cx-item-${index}-government-approvals`}
                label="Government approvals required"
                value={item.governmentApprovalsRequired}
                onChange={(next) => setItem(index, 'governmentApprovalsRequired', next)}
              />
              <SelectField
                id={`cx-item-${index}-approvals-status`}
                label="Approvals status"
                value={item.approvalsStatus}
                onChange={(next) => setItem(index, 'approvalsStatus', next as ApprovalStatus | '')}
                options={APPROVAL_STATUS_OPTIONS}
              />
            </FieldGrid>
            {item.relatedPartyPurchase === 'yes' ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
              >
                This capex item is flagged as a related-party purchase — confirm pricing basis and
                disclosure.
              </p>
            ) : null}
            <TextAreaField
              id={`cx-item-${index}-description`}
              label="Description"
              rows={2}
              value={item.description}
              onChange={(next) => setItem(index, 'description', next)}
            />
            <TextAreaField
              id={`cx-item-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setItem(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="cx-not-applicable-note"
        label="Note (if currently not applicable)"
        helper="Explain why capex is not applicable, or leave blank once capex items are recorded above."
        rows={2}
        value={value.notApplicableNote}
        onChange={setNotApplicableNote}
      />

      <TextAreaField id="cx-notes" label="Notes" value={value.notes} onChange={setNotes} />

      <ObjectsOfIssueSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
