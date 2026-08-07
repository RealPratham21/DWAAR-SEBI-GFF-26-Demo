'use client';

import {
  DecimalInputField,
  FieldGrid,
  SelectField,
  SectionCard,
  SubSection,
  TextAreaField,
  TextInputField,
} from '@/components/financials-kpis/form-helpers';
import {
  hasRecordData,
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/financials-kpis/repeatable-card';
import { FinancialsKpisSectionActions } from '@/components/financials-kpis/section-actions';
import { useFinancialsKpis } from '@/lib/financials-kpis/context';
import {
  createEmptyAccountingPolicy,
  createEmptyAuditReportMatter,
  createEmptyRestatementAdjustment,
} from '@/lib/financials-kpis/defaults';
import {
  ACCOUNTING_POLICY_CATEGORY_OPTIONS,
  AUDIT_OPINION_OPTIONS,
  PROFESSIONAL_CONFIRMATION_STATUS_OPTIONS,
  RESTATEMENT_ADJUSTMENT_CATEGORY_OPTIONS,
} from '@/lib/financials-kpis/options';
import type {
  AccountingPolicy,
  AccountingPolicyCategory,
  AuditOpinion,
  AuditReportMatter,
  ProfessionalConfirmationStatus,
  RestatementAdjustment,
  RestatementAdjustmentCategory,
  RestatementAdjustmentsPoliciesAndAuditorMatters,
} from '@/lib/schemas/financials-kpis';

const SECTION_ID = 'restatement-adjustments-policies-and-auditor-matters' as const;

export function RestatementAuditForm() {
  const { payload, updateSection } = useFinancialsKpis();
  const value = payload.restatementAdjustmentsPoliciesAndAuditorMatters;

  const set = <K extends keyof RestatementAdjustmentsPoliciesAndAuditorMatters>(
    key: K,
    next: RestatementAdjustmentsPoliciesAndAuditorMatters[K],
  ) => {
    updateSection(
      'restatementAdjustmentsPoliciesAndAuditorMatters',
      { ...value, [key]: next },
      SECTION_ID,
    );
  };

  const setAdjustment = <K extends keyof RestatementAdjustment>(
    index: number,
    key: K,
    next: RestatementAdjustment[K],
  ) => {
    set(
      'restatementAdjustments',
      replaceAt(value.restatementAdjustments, index, {
        ...value.restatementAdjustments[index],
        [key]: next,
      }),
    );
  };

  const setPolicy = <K extends keyof AccountingPolicy>(
    index: number,
    key: K,
    next: AccountingPolicy[K],
  ) => {
    set(
      'accountingPolicies',
      replaceAt(value.accountingPolicies, index, {
        ...value.accountingPolicies[index],
        [key]: next,
      }),
    );
  };

  const setMatter = <K extends keyof AuditReportMatter>(
    index: number,
    key: K,
    next: AuditReportMatter[K],
  ) => {
    set(
      'auditReportMatters',
      replaceAt(value.auditReportMatters, index, {
        ...value.auditReportMatters[index],
        [key]: next,
      }),
    );
  };

  return (
    <SectionCard
      title="Restatement Adjustments, Policies & Auditor Matters"
      description="Restatement adjustment register, accounting policies and audit-report matters."
    >
      <RepeatableList
        title="Restatement adjustments"
        addLabel="Add adjustment"
        onAdd={() =>
          set('restatementAdjustments', [
            ...value.restatementAdjustments,
            createEmptyRestatementAdjustment(),
          ])
        }
        emptyMessage="No restatement adjustments recorded."
        count={value.restatementAdjustments.length}
      >
        {value.restatementAdjustments.map((adj, index) => (
          <RepeatableCard
            key={adj.id}
            title={adj.originalLineItem || `Adjustment ${index + 1}`}
            onRemove={() =>
              set('restatementAdjustments', removeAt(value.restatementAdjustments, index))
            }
            requiresConfirmation={hasRecordData([adj.originalLineItem, adj.adjustmentAmount])}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`adj-line-${adj.id}`}
                label="Original line item"
                value={adj.originalLineItem}
                onChange={(next) => setAdjustment(index, 'originalLineItem', next)}
              />
              <SelectField
                id={`adj-category-${adj.id}`}
                label="Category"
                value={adj.category}
                onChange={(next) =>
                  setAdjustment(index, 'category', next as RestatementAdjustmentCategory | '')
                }
                options={RESTATEMENT_ADJUSTMENT_CATEGORY_OPTIONS}
              />
              <DecimalInputField
                id={`adj-original-${adj.id}`}
                label="Original audited amount (₹)"
                value={adj.originalAuditedAmount}
                onChange={(next) => setAdjustment(index, 'originalAuditedAmount', next)}
              />
              <DecimalInputField
                id={`adj-amount-${adj.id}`}
                label="Adjustment amount (₹)"
                value={adj.adjustmentAmount}
                onChange={(next) => setAdjustment(index, 'adjustmentAmount', next)}
              />
              <DecimalInputField
                id={`adj-restated-${adj.id}`}
                label="Restated amount (₹)"
                value={adj.restatedAmount}
                onChange={(next) => setAdjustment(index, 'restatedAmount', next)}
              />
              <TextAreaField
                id={`adj-rationale-${adj.id}`}
                label="Detailed rationale"
                value={adj.detailedRationale}
                onChange={(next) => setAdjustment(index, 'detailedRationale', next)}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Accounting policies"
        addLabel="Add policy"
        onAdd={() =>
          set('accountingPolicies', [...value.accountingPolicies, createEmptyAccountingPolicy()])
        }
        emptyMessage="No accounting policies recorded."
        count={value.accountingPolicies.length}
      >
        {value.accountingPolicies.map((policy, index) => (
          <RepeatableCard
            key={policy.id}
            title={policy.policyCategory || `Policy ${index + 1}`}
            onRemove={() => set('accountingPolicies', removeAt(value.accountingPolicies, index))}
          >
            <FieldGrid>
              <SelectField
                id={`pol-category-${policy.id}`}
                label="Policy category"
                value={policy.policyCategory}
                onChange={(next) =>
                  setPolicy(index, 'policyCategory', next as AccountingPolicyCategory | '')
                }
                options={ACCOUNTING_POLICY_CATEGORY_OPTIONS}
              />
              <TextAreaField
                id={`pol-existing-${policy.id}`}
                label="Existing treatment"
                value={policy.existingTreatment}
                onChange={(next) => setPolicy(index, 'existingTreatment', next)}
              />
              <TextAreaField
                id={`pol-reason-${policy.id}`}
                label="Reason for change"
                value={policy.reason}
                onChange={(next) => setPolicy(index, 'reason', next)}
              />
              <SelectField
                id={`pol-auditor-${policy.id}`}
                label="Auditor confirmation"
                value={policy.auditorConfirmationStatus}
                onChange={(next) =>
                  setPolicy(
                    index,
                    'auditorConfirmationStatus',
                    next as ProfessionalConfirmationStatus | '',
                  )
                }
                options={PROFESSIONAL_CONFIRMATION_STATUS_OPTIONS}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Audit report matters"
        addLabel="Add audit matter"
        onAdd={() =>
          set('auditReportMatters', [...value.auditReportMatters, createEmptyAuditReportMatter()])
        }
        emptyMessage="No audit report matters recorded."
        count={value.auditReportMatters.length}
      >
        {value.auditReportMatters.map((matter, index) => (
          <RepeatableCard
            key={matter.id}
            title={matter.keyAuditMatter || `Audit matter ${index + 1}`}
            onRemove={() => set('auditReportMatters', removeAt(value.auditReportMatters, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`am-kam-${matter.id}`}
                label="Key audit matter"
                value={matter.keyAuditMatter}
                onChange={(next) => setMatter(index, 'keyAuditMatter', next)}
              />
              <SelectField
                id={`am-opinion-${matter.id}`}
                label="Audit opinion"
                value={matter.auditOpinion}
                onChange={(next) => setMatter(index, 'auditOpinion', next as AuditOpinion | '')}
                options={AUDIT_OPINION_OPTIONS}
              />
              <TextAreaField
                id={`am-emphasis-${matter.id}`}
                label="Emphasis of matter"
                value={matter.emphasisOfMatter}
                onChange={(next) => setMatter(index, 'emphasisOfMatter', next)}
              />
              <TextAreaField
                id={`am-mgmt-${matter.id}`}
                label="Management response"
                value={matter.managementResponse}
                onChange={(next) => setMatter(index, 'managementResponse', next)}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Section notes">
        <TextAreaField
          id="ra-notes"
          label="Notes"
          value={value.notes}
          onChange={(next) => set('notes', next)}
        />
      </SubSection>

      <FinancialsKpisSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
