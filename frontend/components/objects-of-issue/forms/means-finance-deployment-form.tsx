'use client';

import {
  ComputedStat,
  DecimalInputField,
  FieldGrid,
  SelectField,
  StatGrid,
  SubSection,
  TableScroll,
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
import {
  createEmptyDeploymentScheduleRow,
  createEmptyMeansOfFinanceRow,
} from '@/lib/objects-of-issue/defaults';
import { EM_DASH, formatMoney } from '@/lib/objects-of-issue/format';
import {
  FUNDING_TIE_UP_STATUS_OPTIONS,
  MEANS_OF_FINANCE_SOURCE_OPTIONS,
} from '@/lib/objects-of-issue/options';
import type {
  DeploymentScheduleRow,
  FundingTieUpStatus,
  MeansOfFinanceRow,
  MeansOfFinanceSource,
} from '@/lib/objects-of-issue/types';

const SECTION_ID = 'means-of-finance-and-deployment-schedule' as const;

export function MeansFinanceDeploymentForm() {
  const { payload, updateSection, model } = useObjectsOfIssue();
  const value = payload.meansOfFinanceAndDeploymentSchedule;

  const setField = <K extends keyof typeof value>(key: K, next: (typeof value)[K]) => {
    updateSection('meansOfFinanceAndDeploymentSchedule', { ...value, [key]: next }, SECTION_ID);
  };

  const setFinanceRows = (next: MeansOfFinanceRow[]) => setField('meansOfFinanceRows', next);
  const setFinanceRow = <K extends keyof MeansOfFinanceRow>(
    index: number,
    key: K,
    next: MeansOfFinanceRow[K],
  ) => {
    setFinanceRows(
      replaceAt(value.meansOfFinanceRows, index, { ...value.meansOfFinanceRows[index], [key]: next }),
    );
  };

  const setScheduleRows = (next: DeploymentScheduleRow[]) => setField('deploymentScheduleRows', next);
  const setScheduleRow = <K extends keyof DeploymentScheduleRow>(
    index: number,
    key: K,
    next: DeploymentScheduleRow[K],
  ) => {
    setScheduleRows(
      replaceAt(value.deploymentScheduleRows, index, {
        ...value.deploymentScheduleRows[index],
        [key]: next,
      }),
    );
  };

  return (
    <SectionCard
      title="Means of Finance & Deployment Schedule"
      description="Total project cost by source of finance and the year-wise deployment plan."
    >
      <StatGrid title="Reconciliation">
        <ComputedStat
          label="Total estimated cost of objects"
          value={
            model.totalEstimatedObjectsCost ? formatMoney(model.totalEstimatedObjectsCost) : EM_DASH
          }
        />
        <ComputedStat
          label="Total means of finance"
          value={model.totalMeansOfFinance ? formatMoney(model.totalMeansOfFinance) : EM_DASH}
        />
        <ComputedStat
          label="Total deployment scheduled"
          value={
            model.totalDeploymentScheduled ? formatMoney(model.totalDeploymentScheduled) : EM_DASH
          }
        />
        <ComputedStat
          label="Means of finance reconciles"
          value={model.meansOfFinanceReconciles ? 'Yes' : 'Review needed'}
        />
      </StatGrid>

      <SubSection title="Funding tie-up">
        <FieldGrid>
          <SelectField
            id="mf-tie-up-status"
            label="Funding tie-up status"
            value={value.fundingTieUpStatus}
            onChange={(next) => setField('fundingTieUpStatus', next as FundingTieUpStatus | '')}
            options={FUNDING_TIE_UP_STATUS_OPTIONS}
          />
        </FieldGrid>
        {value.fundingTieUpStatus === 'partially-tied-up' ||
        value.fundingTieUpStatus === 'not-tied-up' ||
        value.fundingTieUpStatus === 'not_sure' ? (
          <TextAreaField
            id="mf-tie-up-details"
            label="Funding tie-up — details"
            rows={2}
            value={value.fundingTieUpDetails}
            onChange={(next) => setField('fundingTieUpDetails', next)}
          />
        ) : null}
      </SubSection>

      <RepeatableList
        title="Means of finance"
        description="Every source of finance for the total project cost, including net proceeds of the issue."
        addLabel="Add source"
        count={value.meansOfFinanceRows.length}
        emptyMessage="No means-of-finance row recorded yet."
        onAdd={() => setFinanceRows([...value.meansOfFinanceRows, createEmptyMeansOfFinanceRow()])}
      >
        <TableScroll>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Amount (₹)</th>
                <th className="px-3 py-2">Notes</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {value.meansOfFinanceRows.map((row, index) => (
                <tr key={row.id} className="border-b border-border/60 align-top">
                  <td className="px-3 py-2">
                    <SelectField
                      id={`mf-row-${index}-source`}
                      label="Source"
                      value={row.source}
                      onChange={(next) => setFinanceRow(index, 'source', next as MeansOfFinanceSource | '')}
                      options={MEANS_OF_FINANCE_SOURCE_OPTIONS}
                      className="[&_label]:sr-only"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <DecimalInputField
                      id={`mf-row-${index}-amount`}
                      label="Amount"
                      value={row.amount}
                      onChange={(next) => setFinanceRow(index, 'amount', next)}
                      className="[&_label]:sr-only"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <TextInputField
                      id={`mf-row-${index}-notes`}
                      label="Notes"
                      value={row.notes}
                      onChange={(next) => setFinanceRow(index, 'notes', next)}
                      className="[&_label]:sr-only"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="text-xs font-medium text-destructive underline"
                      onClick={() => {
                        if (
                          hasRecordData([row.amount]) &&
                          !window.confirm('Remove this means-of-finance row?')
                        )
                          return;
                        setFinanceRows(removeAt(value.meansOfFinanceRows, index));
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </RepeatableList>

      <RepeatableList
        title="Deployment schedule"
        description="Year-wise (or period-wise) plan for deploying the funds towards the objects."
        addLabel="Add period"
        count={value.deploymentScheduleRows.length}
        emptyMessage="No deployment period recorded yet."
        onAdd={() =>
          setScheduleRows([...value.deploymentScheduleRows, createEmptyDeploymentScheduleRow()])
        }
      >
        {value.deploymentScheduleRows.map((row, index) => (
          <RepeatableCard
            key={row.id}
            title={row.periodLabel || `Period ${index + 1}`}
            requiresConfirmation={hasRecordData([row.periodLabel, row.amountToBeDeployed])}
            confirmMessage="Remove this deployment period? Entered values will be lost."
            onRemove={() => setScheduleRows(removeAt(value.deploymentScheduleRows, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`ds-row-${index}-period`}
                label="Period label"
                required
                placeholder="e.g. FY2027"
                value={row.periodLabel}
                onChange={(next) => setScheduleRow(index, 'periodLabel', next)}
              />
              <DecimalInputField
                id={`ds-row-${index}-amount`}
                label="Amount to be deployed (₹)"
                required
                value={row.amountToBeDeployed}
                onChange={(next) => setScheduleRow(index, 'amountToBeDeployed', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`ds-row-${index}-notes`}
              label="Notes"
              rows={2}
              value={row.notes}
              onChange={(next) => setScheduleRow(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="mf-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => setField('notes', next)}
      />

      <ObjectsOfIssueSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
