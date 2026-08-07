'use client';

import {
  ComputedStat,
  FieldGrid,
  LinkedWorkstreamNotice,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
  asEnumValue,
} from '@/components/litigation-approvals-compliance/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/litigation-approvals-compliance/repeatable-card';
import { LitigationApprovalsComplianceSectionActions } from '@/components/litigation-approvals-compliance/section-actions';
import { useLitigationApprovalsCompliance } from '@/lib/litigation-approvals-compliance/context';
import { createEmptyRemediationActionRecord } from '@/lib/litigation-approvals-compliance/defaults';
import {
  LAC_CONFIRMATION_FIELDS,
  RECONCILIATION_STATUS_OPTIONS,
  REMEDIATION_LINKED_RECORD_TYPE_OPTIONS,
  REMEDIATION_PRIORITY_OPTIONS,
  REMEDIATION_STATUS_OPTIONS,
} from '@/lib/litigation-approvals-compliance/options';
import type {
  ReconciliationRemediationAndIssuerConfirmations,
  ReconciliationStatus,
  RemediationLinkedRecordType,
  RemediationPriority,
  RemediationStatus,
  YesNoNotSureOrEmpty,
} from '@/lib/schemas/litigation-approvals-compliance';

const SECTION_ID = 'reconciliation-remediation-and-issuer-confirmations' as const;

export function ReconciliationForm() {
  const { payload, model, linkedReferences, updateSection } = useLitigationApprovalsCompliance();
  const value = payload.reconciliationRemediationAndIssuerConfirmations;
  const reconciliation = model.reconciliation;

  const set = <K extends keyof ReconciliationRemediationAndIssuerConfirmations>(
    key: K,
    next: ReconciliationRemediationAndIssuerConfirmations[K],
  ) => {
    updateSection(
      'reconciliationRemediationAndIssuerConfirmations',
      { ...value, [key]: next },
      SECTION_ID,
    );
  };

  const setFinancialsRec = <
    K extends keyof ReconciliationRemediationAndIssuerConfirmations['financialsReconciliation'],
  >(
    key: K,
    next: ReconciliationRemediationAndIssuerConfirmations['financialsReconciliation'][K],
  ) => {
    set('financialsReconciliation', { ...value.financialsReconciliation, [key]: next });
  };

  const setGroupRec = <
    K extends keyof ReconciliationRemediationAndIssuerConfirmations['groupEntitiesReconciliation'],
  >(
    key: K,
    next: ReconciliationRemediationAndIssuerConfirmations['groupEntitiesReconciliation'][K],
  ) => {
    set('groupEntitiesReconciliation', { ...value.groupEntitiesReconciliation, [key]: next });
  };

  const setManagementRec = <
    K extends keyof ReconciliationRemediationAndIssuerConfirmations['managementGovernanceReconciliation'],
  >(
    key: K,
    next: ReconciliationRemediationAndIssuerConfirmations['managementGovernanceReconciliation'][K],
  ) => {
    set('managementGovernanceReconciliation', {
      ...value.managementGovernanceReconciliation,
      [key]: next,
    });
  };

  const setBacRec = <
    K extends keyof ReconciliationRemediationAndIssuerConfirmations['bacReconciliation'],
  >(
    key: K,
    next: ReconciliationRemediationAndIssuerConfirmations['bacReconciliation'][K],
  ) => {
    set('bacReconciliation', { ...value.bacReconciliation, [key]: next });
  };

  const setBusinessRec = <
    K extends keyof ReconciliationRemediationAndIssuerConfirmations['businessOperationsReconciliation'],
  >(
    key: K,
    next: ReconciliationRemediationAndIssuerConfirmations['businessOperationsReconciliation'][K],
  ) => {
    set('businessOperationsReconciliation', {
      ...value.businessOperationsReconciliation,
      [key]: next,
    });
  };

  const setObjectsRec = <
    K extends keyof ReconciliationRemediationAndIssuerConfirmations['objectsOfIssueReconciliation'],
  >(
    key: K,
    next: ReconciliationRemediationAndIssuerConfirmations['objectsOfIssueReconciliation'][K],
  ) => {
    set('objectsOfIssueReconciliation', { ...value.objectsOfIssueReconciliation, [key]: next });
  };

  const setIpoRec = <
    K extends keyof ReconciliationRemediationAndIssuerConfirmations['ipoSetupReconciliation'],
  >(
    key: K,
    next: ReconciliationRemediationAndIssuerConfirmations['ipoSetupReconciliation'][K],
  ) => {
    set('ipoSetupReconciliation', { ...value.ipoSetupReconciliation, [key]: next });
  };

  const setConfirmations = <
    K extends keyof ReconciliationRemediationAndIssuerConfirmations['confirmations'],
  >(
    key: K,
    next: ReconciliationRemediationAndIssuerConfirmations['confirmations'][K],
  ) => {
    set('confirmations', { ...value.confirmations, [key]: next });
  };

  return (
    <SectionCard
      title="Reconciliation, Remediation & Issuer Confirmations"
      description="Cross-workstream reconciliation, remediation actions and issuer confirmations."
    >
      <SubSection title="Financials reconciliation" description={reconciliation.financials.detail}>
        <LinkedWorkstreamNotice
          available={linkedReferences.financialsKpis.available}
          workstreamName="Financials & KPIs"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ComputedStat
            label="Litigation aggregate"
            value={value.financialsReconciliation.litigationAggregateAmount || model.taxAggregates.totalDemand ? value.financialsReconciliation.litigationAggregateAmount || '—' : '—'}
          />
          <ComputedStat
            label="Financials contingent liabilities"
            value={linkedReferences.financialsKpis.contingentLiabilitiesTotal ?? '—'}
          />
          <ComputedStat label="Litigation difference" value={value.financialsReconciliation.litigationDifference || '—'} />
          <ComputedStat label="Status" value={reconciliation.financials.status} />
          <ComputedStat label="Tax aggregate" value={model.taxAggregates.totalDemand || '—'} />
          <ComputedStat
            label="Financials tax disputes"
            value={linkedReferences.financialsKpis.taxDisputesTotal ?? '—'}
          />
          <ComputedStat label="Tax difference" value={value.financialsReconciliation.taxDifference || '—'} />
          <ComputedStat label="Creditor difference" value={value.financialsReconciliation.creditorDifference || '—'} />
        </div>
        <FieldGrid columns={3}>
          <SelectField
            id="lac-fin-rec-status"
            label="Reconciliation status"
            value={value.financialsReconciliation.reconciliationStatus}
            onChange={(next) =>
              setFinancialsRec('reconciliationStatus', asEnumValue<ReconciliationStatus>(next))
            }
            options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
          />
          <TextAreaField
            id="lac-fin-rec-notes"
            label="Notes"
            value={value.financialsReconciliation.notes}
            onChange={(next) => setFinancialsRec('notes', next)}
            rows={2}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Group Entities reconciliation" description={reconciliation.groupEntities.detail}>
        <LinkedWorkstreamNotice available={linkedReferences.groupEntities.available} workstreamName="Group Entities" />
        <ComputedStat label="Status" value={reconciliation.groupEntities.status} />
        <FieldGrid columns={3}>
          <TernaryField
            id="lac-group-matters"
            label="Group entity matters represented"
            value={value.groupEntitiesReconciliation.groupEntityMattersRepresented}
            onChange={(next) => setGroupRec('groupEntityMattersRepresented', next)}
          />
          <SelectField
            id="lac-group-status"
            label="Reconciliation status"
            value={value.groupEntitiesReconciliation.reconciliationStatus}
            onChange={(next) =>
              setGroupRec('reconciliationStatus', asEnumValue<ReconciliationStatus>(next))
            }
            options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
          />
          <TextAreaField
            id="lac-group-notes"
            label="Notes"
            value={value.groupEntitiesReconciliation.notes}
            onChange={(next) => setGroupRec('notes', next)}
            rows={2}
          />
        </FieldGrid>
      </SubSection>

      <SubSection
        title="Management & Governance reconciliation"
        description={reconciliation.managementGovernance.detail}
      >
        <LinkedWorkstreamNotice
          available={linkedReferences.managementGovernance.available}
          workstreamName="Management & Governance"
        />
        <ComputedStat label="Status" value={reconciliation.managementGovernance.status} />
        <FieldGrid columns={3}>
          <TernaryField
            id="lac-mgmt-criminal"
            label="Criminal/regulatory declarations reconciled"
            value={value.managementGovernanceReconciliation.criminalRegulatoryDeclarationsReconciled}
            onChange={(next) => setManagementRec('criminalRegulatoryDeclarationsReconciled', next)}
          />
          <SelectField
            id="lac-mgmt-status"
            label="Reconciliation status"
            value={value.managementGovernanceReconciliation.reconciliationStatus}
            onChange={(next) =>
              setManagementRec('reconciliationStatus', asEnumValue<ReconciliationStatus>(next))
            }
            options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="BAC reconciliation" description={reconciliation.bac.detail}>
        <LinkedWorkstreamNotice
          available={linkedReferences.borrowingsAssetsContracts.available}
          workstreamName="Borrowings, Assets & Contracts"
        />
        <ComputedStat label="Status" value={reconciliation.bac.status} />
        <FieldGrid columns={3}>
          <TernaryField
            id="lac-bac-defaults"
            label="Defaults reconciled"
            value={value.bacReconciliation.defaultsReconciled}
            onChange={(next) => setBacRec('defaultsReconciled', next)}
          />
          <TernaryField
            id="lac-bac-disputes"
            label="Contract disputes reconciled"
            value={value.bacReconciliation.contractDisputesReconciled}
            onChange={(next) => setBacRec('contractDisputesReconciled', next)}
          />
          <SelectField
            id="lac-bac-status"
            label="Reconciliation status"
            value={value.bacReconciliation.reconciliationStatus}
            onChange={(next) =>
              setBacRec('reconciliationStatus', asEnumValue<ReconciliationStatus>(next))
            }
            options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Business & Operations reconciliation" description={reconciliation.businessOperations.detail}>
        <LinkedWorkstreamNotice
          available={linkedReferences.businessOperations.available}
          workstreamName="Business & Operations"
        />
        <ComputedStat label="Status" value={reconciliation.businessOperations.status} />
        <FieldGrid columns={3}>
          <TernaryField
            id="lac-biz-facilities"
            label="Facilities mapped"
            value={value.businessOperationsReconciliation.facilitiesMapped}
            onChange={(next) => setBusinessRec('facilitiesMapped', next)}
          />
          <SelectField
            id="lac-biz-status"
            label="Reconciliation status"
            value={value.businessOperationsReconciliation.reconciliationStatus}
            onChange={(next) =>
              setBusinessRec('reconciliationStatus', asEnumValue<ReconciliationStatus>(next))
            }
            options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Objects of the Issue reconciliation" description={reconciliation.objectsOfIssue.detail}>
        <LinkedWorkstreamNotice
          available={linkedReferences.objectsOfIssue.available}
          workstreamName="Objects of the Issue"
        />
        <ComputedStat label="Status" value={reconciliation.objectsOfIssue.status} />
        <FieldGrid columns={3}>
          <TernaryField
            id="lac-objects-plan"
            label="Approval plan reconciled"
            value={value.objectsOfIssueReconciliation.approvalPlanReconciled}
            onChange={(next) => setObjectsRec('approvalPlanReconciled', next)}
          />
          <SelectField
            id="lac-objects-status"
            label="Reconciliation status"
            value={value.objectsOfIssueReconciliation.reconciliationStatus}
            onChange={(next) =>
              setObjectsRec('reconciliationStatus', asEnumValue<ReconciliationStatus>(next))
            }
            options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="IPO Setup reconciliation" description={reconciliation.ipoSetup.detail}>
        <LinkedWorkstreamNotice
          available={linkedReferences.ipoSetup.available}
          workstreamName="IPO Setup & Eligibility"
        />
        <ComputedStat label="Status" value={reconciliation.ipoSetup.status} />
        <FieldGrid columns={3}>
          <TernaryField
            id="lac-ipo-debarment"
            label="Debarment declarations reconciled"
            value={value.ipoSetupReconciliation.debarmentDeclarationsReconciled}
            onChange={(next) => setIpoRec('debarmentDeclarationsReconciled', next)}
          />
          <SelectField
            id="lac-ipo-status"
            label="Reconciliation status"
            value={value.ipoSetupReconciliation.reconciliationStatus}
            onChange={(next) =>
              setIpoRec('reconciliationStatus', asEnumValue<ReconciliationStatus>(next))
            }
            options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Remediation actions"
        addLabel="Add remediation action"
        onAdd={() =>
          set('remediationActions', [...value.remediationActions, createEmptyRemediationActionRecord()])
        }
        emptyMessage="No remediation actions yet."
        count={value.remediationActions.length}
      >
        {value.remediationActions.map((action, index) => (
          <RepeatableCard
            key={action.remediationActionId}
            title={action.actionRequired.trim() || `Remediation ${index + 1}`}
            onRemove={() => set('remediationActions', removeAt(value.remediationActions, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`rem-type-${index}`}
                label="Linked record type"
                value={action.linkedRecordType}
                onChange={(next) =>
                  set(
                    'remediationActions',
                    replaceAt(value.remediationActions, index, {
                      ...action,
                      linkedRecordType: asEnumValue<RemediationLinkedRecordType>(next),
                    }),
                  )
                }
                options={[
                  { value: '', label: 'Select…' },
                  ...REMEDIATION_LINKED_RECORD_TYPE_OPTIONS,
                ]}
              />
              <TextInputField
                id={`rem-record-${index}`}
                label="Linked record ID"
                value={action.linkedRecordId}
                onChange={(next) =>
                  set(
                    'remediationActions',
                    replaceAt(value.remediationActions, index, { ...action, linkedRecordId: next }),
                  )
                }
              />
              <TextAreaField
                id={`rem-action-${index}`}
                label="Action required"
                value={action.actionRequired}
                onChange={(next) =>
                  set(
                    'remediationActions',
                    replaceAt(value.remediationActions, index, { ...action, actionRequired: next }),
                  )
                }
                rows={2}
              />
              <TextInputField
                id={`rem-owner-${index}`}
                label="Owner"
                value={action.owner}
                onChange={(next) =>
                  set(
                    'remediationActions',
                    replaceAt(value.remediationActions, index, { ...action, owner: next }),
                  )
                }
              />
              <SelectField
                id={`rem-priority-${index}`}
                label="Priority"
                value={action.priority}
                onChange={(next) =>
                  set(
                    'remediationActions',
                    replaceAt(value.remediationActions, index, {
                      ...action,
                      priority: asEnumValue<RemediationPriority>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...REMEDIATION_PRIORITY_OPTIONS]}
              />
              <SelectField
                id={`rem-status-${index}`}
                label="Status"
                value={action.status}
                onChange={(next) =>
                  set(
                    'remediationActions',
                    replaceAt(value.remediationActions, index, {
                      ...action,
                      status: asEnumValue<RemediationStatus>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...REMEDIATION_STATUS_OPTIONS]}
              />
              <TextInputField
                id={`rem-target-${index}`}
                label="Target date"
                type="date"
                value={action.targetDate}
                onChange={(next) =>
                  set(
                    'remediationActions',
                    replaceAt(value.remediationActions, index, { ...action, targetDate: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Issuer confirmations">
        <FieldGrid columns={2}>
          {LAC_CONFIRMATION_FIELDS.map((field) => (
            <TernaryField
              key={field.key}
              id={`lac-confirm-${field.key}`}
              label={field.label}
              value={value.confirmations[field.key] as YesNoNotSureOrEmpty}
              onChange={(next) => setConfirmations(field.key, next)}
            />
          ))}
        </FieldGrid>
      </SubSection>

      <LitigationApprovalsComplianceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
