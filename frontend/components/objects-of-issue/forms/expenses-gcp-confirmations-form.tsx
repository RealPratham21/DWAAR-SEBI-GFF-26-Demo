'use client';

import {
  CheckboxField,
  ComputedStat,
  DecimalInputField,
  FieldGrid,
  SelectField,
  StatGrid,
  SubSection,
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
import { createEmptyIssueExpenseItem } from '@/lib/objects-of-issue/defaults';
import { EM_DASH, formatMoney, formatPercent } from '@/lib/objects-of-issue/format';
import {
  EXPENSE_CATEGORY_OPTIONS,
  MONITORING_AGENCY_STATUS_OPTIONS,
  OBJECTS_OF_ISSUE_CONFIRMATION_FIELDS,
} from '@/lib/objects-of-issue/options';
import type {
  ExpenseCategory,
  IssueExpenseItem,
  MonitoringAgencyStatus,
} from '@/lib/objects-of-issue/types';

const SECTION_ID = 'expenses-gcp-monitoring-and-confirmations' as const;

export function ExpensesGcpConfirmationsForm() {
  const { payload, updateSection, model } = useObjectsOfIssue();
  const value = payload.expensesGcpMonitoringAndConfirmations;

  const setField = <K extends keyof typeof value>(key: K, next: (typeof value)[K]) => {
    updateSection('expensesGcpMonitoringAndConfirmations', { ...value, [key]: next }, SECTION_ID);
  };

  const setItems = (next: IssueExpenseItem[]) => setField('issueExpenseItems', next);
  const setItem = <K extends keyof IssueExpenseItem>(
    index: number,
    key: K,
    next: IssueExpenseItem[K],
  ) => {
    setItems(
      replaceAt(value.issueExpenseItems, index, { ...value.issueExpenseItems[index], [key]: next }),
    );
  };

  const setConfirmation = (key: keyof typeof value.confirmations, checked: boolean) => {
    setField('confirmations', { ...value.confirmations, [key]: checked });
  };

  return (
    <SectionCard
      title="Expenses, GCP, Monitoring & Confirmations"
      description="Issue expenses, general corporate purposes, monitoring agency and issuer confirmations."
    >
      <StatGrid title="Issue expenses & GCP">
        <ComputedStat
          label="Total estimated issue expenses"
          value={model.totalIssueExpenses ? formatMoney(model.totalIssueExpenses) : EM_DASH}
        />
        <ComputedStat
          label="GCP % of fresh issue"
          value={
            model.gcpPercentageOfFreshIssue ? formatPercent(model.gcpPercentageOfFreshIssue) : EM_DASH
          }
        />
        <ComputedStat
          label="GCP within applicable cap"
          value={model.gcpWithinLimit ? 'Yes' : model.gcpPercentageOfFreshIssue ? 'No — review' : EM_DASH}
        />
        <ComputedStat
          label="Applicable GCP cap (₹)"
          value={model.gcpApplicableCap ? formatMoney(model.gcpApplicableCap) : EM_DASH}
        />
      </StatGrid>

      {!model.gcpWithinLimit && model.gcpPercentageOfFreshIssue ? (
        <p
          role="alert"
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100"
        >
          General corporate purposes exceeds the applicable SME cap (lower of 15% of fresh issue
          proceeds or ₹10 crore). Confirm this is justified and separately disclosed.
        </p>
      ) : null}

      <RepeatableList
        title="Issue expenses"
        description="Estimated break-up of expenses for the issue."
        addLabel="Add expense"
        count={value.issueExpenseItems.length}
        emptyMessage="No issue expense recorded yet."
        onAdd={() => setItems([...value.issueExpenseItems, createEmptyIssueExpenseItem()])}
      >
        {value.issueExpenseItems.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.expenseCategory || `Expense ${index + 1}`}
            requiresConfirmation={hasRecordData([item.estimatedAmount])}
            confirmMessage="Remove this expense item? Entered values will be lost."
            onRemove={() => setItems(removeAt(value.issueExpenseItems, index))}
          >
            <FieldGrid>
              <SelectField
                id={`eg-item-${index}-category`}
                label="Expense category"
                required
                value={item.expenseCategory}
                onChange={(next) => setItem(index, 'expenseCategory', next as ExpenseCategory | '')}
                options={EXPENSE_CATEGORY_OPTIONS}
              />
              <DecimalInputField
                id={`eg-item-${index}-amount`}
                label="Estimated amount (₹)"
                required
                value={item.estimatedAmount}
                onChange={(next) => setItem(index, 'estimatedAmount', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`eg-item-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setItem(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="General corporate purposes">
        <DecimalInputField
          id="eg-gcp-amount"
          label="General corporate purposes amount (₹)"
          value={value.generalCorporatePurposesAmount}
          onChange={(next) => setField('generalCorporatePurposesAmount', next)}
        />
      </SubSection>

      <SubSection title="Monitoring agency">
        <FieldGrid>
          <TernaryField
            id="eg-monitoring-required"
            label="Monitoring agency required"
            value={value.monitoringAgencyRequired}
            onChange={(next) => setField('monitoringAgencyRequired', next)}
          />
          <SelectField
            id="eg-monitoring-status"
            label="Monitoring agency status"
            value={value.monitoringAgencyStatus}
            onChange={(next) =>
              setField('monitoringAgencyStatus', next as MonitoringAgencyStatus | '')
            }
            options={MONITORING_AGENCY_STATUS_OPTIONS}
          />
          <TextInputField
            id="eg-monitoring-name"
            label="Monitoring agency name (if identified)"
            value={value.monitoringAgencyName}
            onChange={(next) => setField('monitoringAgencyName', next)}
          />
        </FieldGrid>
      </SubSection>

      <SubSection
        title="Issuer confirmations"
        description="Check every statement that the issuer can currently stand behind. Leave unchecked items blank rather than guessing."
      >
        <div className="space-y-3">
          {OBJECTS_OF_ISSUE_CONFIRMATION_FIELDS.map((field) => (
            <CheckboxField
              key={field.key}
              id={`eg-confirmation-${field.key}`}
              label={field.label}
              checked={value.confirmations[field.key]}
              onChange={(checked) => setConfirmation(field.key, checked)}
            />
          ))}
        </div>
      </SubSection>

      <TextAreaField
        id="eg-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => setField('notes', next)}
      />

      <ObjectsOfIssueSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
