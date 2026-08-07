'use client';

import {
  ComputedStat,
  FacilitySelect,
  FieldGrid,
  LinkedWorkstreamNotice,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/borrowings-assets-contracts/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/borrowings-assets-contracts/repeatable-card';
import { BorrowingsAssetsContractsSectionActions } from '@/components/borrowings-assets-contracts/section-actions';
import { DecimalInputField } from '@/components/management-governance/form-helpers';
import { useBorrowingsAssetsContracts } from '@/lib/borrowings-assets-contracts/context';
import { createEmptyBacChangeRecord, createEmptyObjectsOfIssueRepaymentItem } from '@/lib/borrowings-assets-contracts/defaults';
import {
  BAC_CHANGE_EVENT_TYPE_OPTIONS,
  BAC_CONFIRMATION_FIELDS,
  RECONCILIATION_STATUS_OPTIONS,
  RELATED_RECORD_TYPE_OPTIONS,
} from '@/lib/borrowings-assets-contracts/options';
import type {
  BacChangeEventType,
  ReconciliationChangesAndIssuerConfirmations,
  ReconciliationStatus,
  RelatedRecordType,
} from '@/lib/schemas/borrowings-assets-contracts';

const SECTION_ID = 'reconciliation-changes-and-issuer-confirmations' as const;

export function ReconciliationForm() {
  const { payload, model, linkedReferences, updateSection } = useBorrowingsAssetsContracts();
  const value = payload.reconciliationChangesAndIssuerConfirmations;
  const reconciliation = model.reconciliation;

  const set = <K extends keyof ReconciliationChangesAndIssuerConfirmations>(
    key: K,
    next: ReconciliationChangesAndIssuerConfirmations[K],
  ) => {
    updateSection('reconciliationChangesAndIssuerConfirmations', { ...value, [key]: next }, SECTION_ID);
  };

  const setFinancialsRec = <
    K extends keyof ReconciliationChangesAndIssuerConfirmations['financialsReconciliation'],
  >(
    key: K,
    next: ReconciliationChangesAndIssuerConfirmations['financialsReconciliation'][K],
  ) => {
    set('financialsReconciliation', { ...value.financialsReconciliation, [key]: next });
  };

  const setGroupRec = <
    K extends keyof ReconciliationChangesAndIssuerConfirmations['groupEntitiesReconciliation'],
  >(
    key: K,
    next: ReconciliationChangesAndIssuerConfirmations['groupEntitiesReconciliation'][K],
  ) => {
    set('groupEntitiesReconciliation', { ...value.groupEntitiesReconciliation, [key]: next });
  };

  const setCapitalRec = <
    K extends keyof ReconciliationChangesAndIssuerConfirmations['capitalOwnershipReconciliation'],
  >(
    key: K,
    next: ReconciliationChangesAndIssuerConfirmations['capitalOwnershipReconciliation'][K],
  ) => {
    set('capitalOwnershipReconciliation', { ...value.capitalOwnershipReconciliation, [key]: next });
  };

  const setBusinessRec = <
    K extends keyof ReconciliationChangesAndIssuerConfirmations['businessOperationsReconciliation'],
  >(
    key: K,
    next: ReconciliationChangesAndIssuerConfirmations['businessOperationsReconciliation'][K],
  ) => {
    set('businessOperationsReconciliation', { ...value.businessOperationsReconciliation, [key]: next });
  };

  const setConfirmations = <
    K extends keyof ReconciliationChangesAndIssuerConfirmations['confirmations'],
  >(
    key: K,
    next: ReconciliationChangesAndIssuerConfirmations['confirmations'][K],
  ) => {
    set('confirmations', { ...value.confirmations, [key]: next });
  };

  return (
    <SectionCard
      title="Reconciliation, Changes & Issuer Confirmations"
      description="Cross-workstream reconciliation, change register and issuer confirmations."
    >
      <SubSection title="Financials reconciliation" description={reconciliation.financials.detail}>
        <LinkedWorkstreamNotice
          available={linkedReferences.financialsKpis.available}
          workstreamName="Financials & KPIs"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ComputedStat label="BAC facility total" value={reconciliation.financials.bacFacilityTotal || '—'} />
          <ComputedStat
            label="Financials value"
            value={reconciliation.financials.financialsValue ?? '—'}
          />
          <ComputedStat label="Difference" value={reconciliation.financials.difference || '—'} />
          <ComputedStat label="Status" value={reconciliation.financials.status.replaceAll('-', ' ')} />
        </div>
        <FieldGrid columns={3}>
          <SelectField
            id="bac-fin-rec-status"
            label="Reconciliation status"
            value={value.financialsReconciliation.reconciliationStatus}
            onChange={(next) =>
              setFinancialsRec('reconciliationStatus', next as ReconciliationStatus | '')
            }
            options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
          />
          <TextAreaField
            id="bac-fin-rec-notes"
            label="Notes"
            value={value.financialsReconciliation.notes}
            onChange={(next) => setFinancialsRec('notes', next)}
            rows={2}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Objects of the Issue — debt repayment">
        <LinkedWorkstreamNotice
          available={linkedReferences.objectsOfIssue.available}
          workstreamName="Objects of the Issue"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <ComputedStat
            label="Repayment items"
            value={String(reconciliation.objects.repaymentItemCount)}
          />
          <ComputedStat label="Unresolved" value={String(reconciliation.objects.unresolvedCount)} />
          <ComputedStat label="Status" value={reconciliation.objects.status.replaceAll('-', ' ')} />
        </div>
        <RepeatableList
          title="Objects repayment mapping"
          addLabel="Add repayment item"
          onAdd={() =>
            set('objectsOfIssueRepayments', [
              ...value.objectsOfIssueRepayments,
              createEmptyObjectsOfIssueRepaymentItem(),
            ])
          }
          emptyMessage="No objects repayment items yet."
          count={value.objectsOfIssueRepayments.length}
        >
          {value.objectsOfIssueRepayments.map((item, index) => (
            <RepeatableCard
              key={item.id}
              title={item.lender || `Repayment ${index + 1}`}
              onRemove={() =>
                set('objectsOfIssueRepayments', removeAt(value.objectsOfIssueRepayments, index))
              }
            >
              <FieldGrid columns={3}>
                <FacilitySelect
                  id={`oir-${item.id}-facility`}
                  label="Linked facility"
                  value={item.linkedFacilityId}
                  onChange={(next) =>
                    set(
                      'objectsOfIssueRepayments',
                      replaceAt(value.objectsOfIssueRepayments, index, {
                        ...item,
                        linkedFacilityId: next,
                      }),
                    )
                  }
                  payload={payload}
                />
                <DecimalInputField
                  id={`oir-${item.id}-proposed`}
                  label="Proposed repayment"
                  value={item.proposedRepayment}
                  onChange={(next) =>
                    set(
                      'objectsOfIssueRepayments',
                      replaceAt(value.objectsOfIssueRepayments, index, {
                        ...item,
                        proposedRepayment: next,
                      }),
                    )
                  }
                />
                <SelectField
                  id={`oir-${item.id}-status`}
                  label="Reconciliation status"
                  value={item.reconciliationStatus}
                  onChange={(next) =>
                    set(
                      'objectsOfIssueRepayments',
                      replaceAt(value.objectsOfIssueRepayments, index, {
                        ...item,
                        reconciliationStatus: next as ReconciliationStatus | '',
                      }),
                    )
                  }
                  options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
                />
              </FieldGrid>
            </RepeatableCard>
          ))}
        </RepeatableList>
      </SubSection>

      <SubSection title="Group Entities reconciliation">
        <LinkedWorkstreamNotice
          available={linkedReferences.groupEntities.available}
          workstreamName="Group Entities & Related Parties"
        />
        <FieldGrid columns={3}>
          <TernaryField
            id="bac-gr-rp-borrowings"
            label="Related-party borrowings reconciled"
            value={value.groupEntitiesReconciliation.relatedPartyBorrowingsReconciled}
            onChange={(next) => setGroupRec('relatedPartyBorrowingsReconciled', next)}
          />
          <TernaryField
            id="bac-gr-ic-loans"
            label="Inter-company loans reconciled"
            value={value.groupEntitiesReconciliation.interCompanyLoansReconciled}
            onChange={(next) => setGroupRec('interCompanyLoansReconciled', next)}
          />
          <TernaryField
            id="bac-gr-guarantees"
            label="Corporate guarantees reconciled"
            value={value.groupEntitiesReconciliation.corporateGuaranteesReconciled}
            onChange={(next) => setGroupRec('corporateGuaranteesReconciled', next)}
          />
          <SelectField
            id="bac-gr-status"
            label="Overall status"
            value={value.groupEntitiesReconciliation.reconciliationStatus}
            onChange={(next) =>
              setGroupRec('reconciliationStatus', next as ReconciliationStatus | '')
            }
            options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Capital & Ownership reconciliation">
        <LinkedWorkstreamNotice
          available={linkedReferences.capitalOwnership.available}
          workstreamName="Capital & Ownership"
        />
        <FieldGrid columns={3}>
          <TernaryField
            id="bac-co-promoters"
            label="Promoters reconciled"
            value={value.capitalOwnershipReconciliation.promotersReconciled}
            onChange={(next) => setCapitalRec('promotersReconciled', next)}
          />
          <TernaryField
            id="bac-co-guarantee-providers"
            label="Guarantee providers reconciled"
            value={value.capitalOwnershipReconciliation.guaranteeProvidersReconciled}
            onChange={(next) => setCapitalRec('guaranteeProvidersReconciled', next)}
          />
          <SelectField
            id="bac-co-status"
            label="Overall status"
            value={value.capitalOwnershipReconciliation.reconciliationStatus}
            onChange={(next) =>
              setCapitalRec('reconciliationStatus', next as ReconciliationStatus | '')
            }
            options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Business & Operations reconciliation">
        <LinkedWorkstreamNotice
          available={linkedReferences.businessOperations.available}
          workstreamName="Business & Operations"
        />
        <FieldGrid columns={3}>
          <TernaryField
            id="bac-bo-facilities"
            label="Facilities mapped"
            value={value.businessOperationsReconciliation.facilitiesMapped}
            onChange={(next) => setBusinessRec('facilitiesMapped', next)}
          />
          <TernaryField
            id="bac-bo-insurance"
            label="Insurance mapped"
            value={value.businessOperationsReconciliation.insuranceMapped}
            onChange={(next) => setBusinessRec('insuranceMapped', next)}
          />
          <TernaryField
            id="bac-bo-ip"
            label="IP mapped"
            value={value.businessOperationsReconciliation.ipMapped}
            onChange={(next) => setBusinessRec('ipMapped', next)}
          />
          <SelectField
            id="bac-bo-status"
            label="Overall status"
            value={value.businessOperationsReconciliation.reconciliationStatus}
            onChange={(next) =>
              setBusinessRec('reconciliationStatus', next as ReconciliationStatus | '')
            }
            options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Change register"
        addLabel="Add change event"
        onAdd={() => set('changes', [...value.changes, createEmptyBacChangeRecord()])}
        emptyMessage="No changes recorded yet."
        count={value.changes.length}
      >
        {value.changes.map((change, index) => (
          <RepeatableCard
            key={change.id}
            title={change.eventType.replaceAll('-', ' ') || `Change ${index + 1}`}
            subtitle={change.effectiveDate || undefined}
            onRemove={() => set('changes', removeAt(value.changes, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`chg-${change.id}-type`}
                label="Event type"
                value={change.eventType}
                onChange={(next) =>
                  set('changes', replaceAt(value.changes, index, {
                    ...change,
                    eventType: next as BacChangeEventType | '',
                  }))
                }
                options={[{ value: '', label: 'Select…' }, ...BAC_CHANGE_EVENT_TYPE_OPTIONS]}
              />
              <TextInputField
                id={`chg-${change.id}-date`}
                label="Effective date"
                type="date"
                value={change.effectiveDate}
                onChange={(next) =>
                  set('changes', replaceAt(value.changes, index, { ...change, effectiveDate: next }))
                }
              />
              <SelectField
                id={`chg-${change.id}-record-type`}
                label="Related record type"
                value={change.relatedRecordType}
                onChange={(next) =>
                  set('changes', replaceAt(value.changes, index, {
                    ...change,
                    relatedRecordType: next as RelatedRecordType | '',
                  }))
                }
                options={[{ value: '', label: 'Select…' }, ...RELATED_RECORD_TYPE_OPTIONS]}
              />
              <TextAreaField
                id={`chg-${change.id}-reason`}
                label="Reason"
                value={change.reason}
                onChange={(next) =>
                  set('changes', replaceAt(value.changes, index, { ...change, reason: next }))
                }
                rows={2}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Issuer confirmations">
        <FieldGrid columns={2}>
          {BAC_CONFIRMATION_FIELDS.map(({ key, label }) => (
            <TernaryField
              key={key}
              id={`bac-conf-${key}`}
              label={label}
              value={value.confirmations[key]}
              onChange={(next) => setConfirmations(key, next)}
            />
          ))}
        </FieldGrid>
      </SubSection>

      <BorrowingsAssetsContractsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
