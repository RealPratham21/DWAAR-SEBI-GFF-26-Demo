'use client';

import {
  asEnumValue,
  ComputedStat,
  FieldGrid,
  MatterSelect,
  ReconciliationStatusBadge,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/litigation-approvals-compliance/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/litigation-approvals-compliance/repeatable-card';
import { LitigationApprovalsComplianceSectionActions } from '@/components/litigation-approvals-compliance/section-actions';
import { DecimalInputField } from '@/components/management-governance/form-helpers';
import { useLitigationApprovalsCompliance } from '@/lib/litigation-approvals-compliance/context';
import {
  createEmptyHistoricalPenaltyRecord,
  createEmptyMaterialCreditorRecord,
  createEmptyMaterialDevelopmentRecord,
} from '@/lib/litigation-approvals-compliance/defaults';
import {
  MATERIAL_CREDITOR_THRESHOLD_TYPE_OPTIONS,
  MATERIAL_DEVELOPMENT_CATEGORY_OPTIONS,
  RECONCILIATION_STATUS_OPTIONS,
} from '@/lib/litigation-approvals-compliance/options';
import type {
  MaterialCreditorThresholdType,
  MaterialCreditorsPenaltiesAndMaterialDevelopments,
  MaterialDevelopmentCategory,
  ReconciliationStatus,
} from '@/lib/schemas/litigation-approvals-compliance';

const SECTION_ID = 'material-creditors-penalties-and-material-developments' as const;

export function CreditorsDevelopmentsForm() {
  const { payload, model, updateSection } = useLitigationApprovalsCompliance();
  const value = payload.materialCreditorsPenaltiesAndMaterialDevelopments;
  const creditorTotals = model.creditorTotals;

  const set = <K extends keyof MaterialCreditorsPenaltiesAndMaterialDevelopments>(
    key: K,
    next: MaterialCreditorsPenaltiesAndMaterialDevelopments[K],
  ) => {
    updateSection(
      'materialCreditorsPenaltiesAndMaterialDevelopments',
      { ...value, [key]: next },
      SECTION_ID,
    );
  };

  const setPolicy = <
    K extends keyof MaterialCreditorsPenaltiesAndMaterialDevelopments['materialCreditorPolicy'],
  >(
    key: K,
    next: MaterialCreditorsPenaltiesAndMaterialDevelopments['materialCreditorPolicy'][K],
  ) => {
    set('materialCreditorPolicy', { ...value.materialCreditorPolicy, [key]: next });
  };

  const setAggregates = <
    K extends keyof MaterialCreditorsPenaltiesAndMaterialDevelopments['creditorAggregateInputs'],
  >(
    key: K,
    next: MaterialCreditorsPenaltiesAndMaterialDevelopments['creditorAggregateInputs'][K],
  ) => {
    set('creditorAggregateInputs', { ...value.creditorAggregateInputs, [key]: next });
  };

  return (
    <SectionCard
      title="Material Creditors, Penalties & Material Developments"
      description="Material creditor policy, MSME dues, historical penalties and post-balance-sheet developments."
    >
      <SubSection title="Material creditor policy">
        <FieldGrid columns={3}>
          <TernaryField
            id="cred-policy-exists"
            label="Policy exists"
            value={value.materialCreditorPolicy.policyExists}
            onChange={(next) => setPolicy('policyExists', next)}
          />
          <TernaryField
            id="cred-policy-adopted"
            label="Adopted"
            value={value.materialCreditorPolicy.adopted}
            onChange={(next) => setPolicy('adopted', next)}
          />
          <SelectField
            id="cred-threshold-type"
            label="Threshold type"
            value={value.materialCreditorPolicy.thresholdType}
            onChange={(next) =>
              setPolicy('thresholdType', asEnumValue<MaterialCreditorThresholdType>(next))
            }
            options={[
              { value: '', label: 'Select…' },
              ...MATERIAL_CREDITOR_THRESHOLD_TYPE_OPTIONS,
            ]}
          />
          <TextInputField
            id="cred-threshold-pct"
            label="Percentage threshold"
            value={value.materialCreditorPolicy.percentage}
            onChange={(next) => setPolicy('percentage', next)}
          />
          <DecimalInputField
            id="cred-threshold-abs"
            label="Absolute amount threshold"
            value={value.materialCreditorPolicy.absoluteAmount}
            onChange={(next) => setPolicy('absoluteAmount', next)}
          />
          <TextInputField
            id="cred-board-date"
            label="Board date"
            type="date"
            value={value.materialCreditorPolicy.boardDate}
            onChange={(next) => setPolicy('boardDate', next)}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Creditor aggregates (computed)">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ComputedStat label="Material creditors" value={String(creditorTotals.materialCreditorCount)} />
          <ComputedStat label="MSME creditors" value={String(creditorTotals.msmeCreditorCount)} />
          <ComputedStat label="Material outstanding" value={creditorTotals.materialOutstanding || '—'} />
          <ComputedStat label="MSME outstanding" value={creditorTotals.msmeOutstanding || '—'} />
          <ComputedStat label="Aggregate outstanding" value={creditorTotals.aggregateOutstanding || '—'} />
          <ComputedStat label="Reconciliation difference" value={creditorTotals.reconciliationDifference || '—'} />
        </div>
        <FieldGrid columns={3}>
          <DecimalInputField
            id="cred-agg-material"
            label="Material creditor amount (override)"
            value={value.creditorAggregateInputs.materialCreditorAmount}
            onChange={(next) => setAggregates('materialCreditorAmount', next)}
          />
          <DecimalInputField
            id="cred-agg-msme"
            label="MSME outstanding (override)"
            value={value.creditorAggregateInputs.msmeOutstandingAmount}
            onChange={(next) => setAggregates('msmeOutstandingAmount', next)}
          />
          <SelectField
            id="cred-agg-status"
            label="Reconciliation status"
            value={value.creditorAggregateInputs.reconciliationStatus}
            onChange={(next) =>
              setAggregates('reconciliationStatus', asEnumValue<ReconciliationStatus>(next))
            }
            options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
          />
          <div className="flex items-end pb-2">
            <ReconciliationStatusBadge status={value.creditorAggregateInputs.reconciliationStatus} />
          </div>
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Material creditors"
        addLabel="Add creditor"
        onAdd={() =>
          set('materialCreditors', [...value.materialCreditors, createEmptyMaterialCreditorRecord()])
        }
        emptyMessage="No material creditors yet."
        count={value.materialCreditors.length}
      >
        {value.materialCreditors.map((creditor, index) => (
          <RepeatableCard
            key={creditor.creditorId}
            title={creditor.creditorName.trim() || `Creditor ${index + 1}`}
            subtitle={creditor.msmeStatus === 'yes' ? 'MSME' : undefined}
            onRemove={() => set('materialCreditors', removeAt(value.materialCreditors, index))}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`cred-name-${index}`}
                label="Creditor name"
                value={creditor.creditorName}
                onChange={(next) =>
                  set(
                    'materialCreditors',
                    replaceAt(value.materialCreditors, index, { ...creditor, creditorName: next }),
                  )
                }
              />
              <TernaryField
                id={`cred-msme-${index}`}
                label="MSME status"
                value={creditor.msmeStatus}
                onChange={(next) =>
                  set(
                    'materialCreditors',
                    replaceAt(value.materialCreditors, index, { ...creditor, msmeStatus: next }),
                  )
                }
              />
              <DecimalInputField
                id={`cred-outstanding-${index}`}
                label="Amount outstanding"
                value={creditor.amountOutstanding}
                onChange={(next) =>
                  set(
                    'materialCreditors',
                    replaceAt(value.materialCreditors, index, {
                      ...creditor,
                      amountOutstanding: next,
                    }),
                  )
                }
              />
              <TextInputField
                id={`cred-due-${index}`}
                label="Due date"
                type="date"
                value={creditor.dueDate}
                onChange={(next) =>
                  set(
                    'materialCreditors',
                    replaceAt(value.materialCreditors, index, { ...creditor, dueDate: next }),
                  )
                }
              />
              <TernaryField
                id={`cred-disputed-${index}`}
                label="Disputed"
                value={creditor.disputed}
                onChange={(next) =>
                  set(
                    'materialCreditors',
                    replaceAt(value.materialCreditors, index, { ...creditor, disputed: next }),
                  )
                }
              />
              <MatterSelect
                id={`cred-matter-${index}`}
                label="Linked matter"
                value={creditor.linkedMatterId}
                onChange={(next) =>
                  set(
                    'materialCreditors',
                    replaceAt(value.materialCreditors, index, { ...creditor, linkedMatterId: next }),
                  )
                }
                payload={payload}
              />
              <TextAreaField
                id={`cred-notes-${index}`}
                label="Notes"
                value={creditor.notes}
                onChange={(next) =>
                  set(
                    'materialCreditors',
                    replaceAt(value.materialCreditors, index, { ...creditor, notes: next }),
                  )
                }
                rows={2}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Historical penalties"
        addLabel="Add penalty"
        onAdd={() =>
          set('historicalPenalties', [...value.historicalPenalties, createEmptyHistoricalPenaltyRecord()])
        }
        emptyMessage="No historical penalties yet."
        count={value.historicalPenalties.length}
      >
        {value.historicalPenalties.map((penalty, index) => (
          <RepeatableCard
            key={penalty.penaltyId}
            title={penalty.authority.trim() || `Penalty ${index + 1}`}
            onRemove={() => set('historicalPenalties', removeAt(value.historicalPenalties, index))}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`pen-party-${index}`}
                label="Affected party"
                value={penalty.affectedParty}
                onChange={(next) =>
                  set(
                    'historicalPenalties',
                    replaceAt(value.historicalPenalties, index, { ...penalty, affectedParty: next }),
                  )
                }
              />
              <TextInputField
                id={`pen-authority-${index}`}
                label="Authority"
                value={penalty.authority}
                onChange={(next) =>
                  set(
                    'historicalPenalties',
                    replaceAt(value.historicalPenalties, index, { ...penalty, authority: next }),
                  )
                }
              />
              <TextInputField
                id={`pen-date-${index}`}
                label="Event date"
                type="date"
                value={penalty.eventDate}
                onChange={(next) =>
                  set(
                    'historicalPenalties',
                    replaceAt(value.historicalPenalties, index, { ...penalty, eventDate: next }),
                  )
                }
              />
              <DecimalInputField
                id={`pen-amount-${index}`}
                label="Amount"
                value={penalty.amount}
                onChange={(next) =>
                  set(
                    'historicalPenalties',
                    replaceAt(value.historicalPenalties, index, { ...penalty, amount: next }),
                  )
                }
              />
              <TextInputField
                id={`pen-status-${index}`}
                label="Final status"
                value={penalty.finalStatus}
                onChange={(next) =>
                  set(
                    'historicalPenalties',
                    replaceAt(value.historicalPenalties, index, { ...penalty, finalStatus: next }),
                  )
                }
              />
              <MatterSelect
                id={`pen-matter-${index}`}
                label="Linked matter"
                value={penalty.linkedMatterId}
                onChange={(next) =>
                  set(
                    'historicalPenalties',
                    replaceAt(value.historicalPenalties, index, { ...penalty, linkedMatterId: next }),
                  )
                }
                payload={payload}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Material developments"
        addLabel="Add development"
        onAdd={() =>
          set('materialDevelopments', [
            ...value.materialDevelopments,
            createEmptyMaterialDevelopmentRecord(),
          ])
        }
        emptyMessage="No material developments yet."
        count={value.materialDevelopments.length}
      >
        {value.materialDevelopments.map((development, index) => (
          <RepeatableCard
            key={development.developmentId}
            title={development.description.trim().slice(0, 60) || `Development ${index + 1}`}
            subtitle={development.category.replaceAll('-', ' ') || undefined}
            onRemove={() => set('materialDevelopments', removeAt(value.materialDevelopments, index))}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`dev-date-${index}`}
                label="Event date"
                type="date"
                value={development.eventDate}
                onChange={(next) =>
                  set(
                    'materialDevelopments',
                    replaceAt(value.materialDevelopments, index, { ...development, eventDate: next }),
                  )
                }
              />
              <SelectField
                id={`dev-cat-${index}`}
                label="Category"
                value={development.category}
                onChange={(next) =>
                  set(
                    'materialDevelopments',
                    replaceAt(value.materialDevelopments, index, {
                      ...development,
                      category: asEnumValue<MaterialDevelopmentCategory>(next),
                    }),
                  )
                }
                options={[
                  { value: '', label: 'Select…' },
                  ...MATERIAL_DEVELOPMENT_CATEGORY_OPTIONS,
                ]}
              />
              <TextAreaField
                id={`dev-desc-${index}`}
                label="Description"
                value={development.description}
                onChange={(next) =>
                  set(
                    'materialDevelopments',
                    replaceAt(value.materialDevelopments, index, { ...development, description: next }),
                  )
                }
                rows={2}
              />
              <TextInputField
                id={`dev-ipo-${index}`}
                label="IPO impact"
                value={development.ipoImpact}
                onChange={(next) =>
                  set(
                    'materialDevelopments',
                    replaceAt(value.materialDevelopments, index, { ...development, ipoImpact: next }),
                  )
                }
              />
              <TextInputField
                id={`dev-linked-${index}`}
                label="Linked record ID"
                value={development.linkedRecordId}
                onChange={(next) =>
                  set(
                    'materialDevelopments',
                    replaceAt(value.materialDevelopments, index, {
                      ...development,
                      linkedRecordId: next,
                    }),
                  )
                }
              />
              <TextInputField
                id={`dev-disclosure-${index}`}
                label="Disclosure status"
                value={development.disclosureStatus}
                onChange={(next) =>
                  set(
                    'materialDevelopments',
                    replaceAt(value.materialDevelopments, index, {
                      ...development,
                      disclosureStatus: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <LitigationApprovalsComplianceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
