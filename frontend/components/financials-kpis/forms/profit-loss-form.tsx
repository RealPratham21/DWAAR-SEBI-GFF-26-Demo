'use client';

import {
  DecimalInputField,
  FieldGrid,
  FinancialGridTable,
  getGridAmount,
  getGridSourceStatus,
  SectionCard,
  SubSection,
  TextAreaField,
  upsertGridLineValue,
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
  createEmptyExceptionalItem,
  createEmptyPerShareByPeriod,
  createEmptyPlLineValue,
} from '@/lib/financials-kpis/defaults';
import { getFinancialPeriods } from '@/lib/financials-kpis/periods';
import {
  PL_EXPENSE_LINE_KEYS,
  PL_INCOME_LINE_KEYS,
  PL_PROFITABILITY_LINE_KEYS,
  plLineLabel,
} from '@/lib/financials-kpis/pl-lines';
import type {
  ExceptionalItem,
  PerShareByPeriod,
  RestatedStatementOfProfitAndLoss,
} from '@/lib/schemas/financials-kpis';
import type { PlLineKey, SourceStatus } from '@/lib/schemas/financials-kpis';

const SECTION_ID = 'restated-statement-of-profit-and-loss' as const;

const PL_GRID_KEYS = [
  ...PL_INCOME_LINE_KEYS,
  ...PL_EXPENSE_LINE_KEYS,
  ...PL_PROFITABILITY_LINE_KEYS,
] as const;

export function ProfitLossForm() {
  const { payload, updateSection } = useFinancialsKpis();
  const value = payload.restatedStatementOfProfitAndLoss;
  const periods = getFinancialPeriods(payload);
  const displayUnit = payload.reportingScopePeriodsAndAuditorReadiness.reportingBasis.displayUnit;

  const set = <K extends keyof RestatedStatementOfProfitAndLoss>(
    key: K,
    next: RestatedStatementOfProfitAndLoss[K],
  ) => {
    updateSection('restatedStatementOfProfitAndLoss', { ...value, [key]: next }, SECTION_ID);
  };

  const setPlCell = (periodId: string, lineKey: string, amount: string) => {
    set(
      'plLineValues',
      upsertGridLineValue(
        value.plLineValues,
        periodId,
        lineKey,
        { amount },
        createEmptyPlLineValue,
      ),
    );
  };

  const setPlSource = (periodId: string, lineKey: string, sourceStatus: SourceStatus | '') => {
    set(
      'plLineValues',
      upsertGridLineValue(
        value.plLineValues,
        periodId,
        lineKey,
        { sourceStatus },
        createEmptyPlLineValue,
      ),
    );
  };

  const setExceptional = <K extends keyof ExceptionalItem>(
    index: number,
    key: K,
    next: ExceptionalItem[K],
  ) => {
    set(
      'exceptionalItems',
      replaceAt(value.exceptionalItems, index, {
        ...value.exceptionalItems[index],
        [key]: next,
      }),
    );
  };

  const setPerShare = <K extends keyof PerShareByPeriod>(
    index: number,
    key: K,
    next: PerShareByPeriod[K],
  ) => {
    set(
      'perShareByPeriod',
      replaceAt(value.perShareByPeriod, index, {
        ...value.perShareByPeriod[index],
        [key]: next,
      }),
    );
  };

  return (
    <SectionCard
      title="Restated Statement of Profit & Loss"
      description="Period-based P&L grid, exceptional items and per-share information."
    >
      <SubSection title="P&L line values" description="Enter amounts by period using the shared registry.">
        <FinancialGridTable
          periods={periods}
          lineKeys={PL_GRID_KEYS}
          getLineLabel={(key) => plLineLabel(key as PlLineKey)}
          getAmount={(periodId, lineKey) =>
            getGridAmount(value.plLineValues, periodId, lineKey)
          }
          getSourceStatus={(periodId, lineKey) =>
            getGridSourceStatus(value.plLineValues, periodId, lineKey)
          }
          onAmountChange={setPlCell}
          onSourceStatusChange={setPlSource}
          displayUnit={displayUnit}
          showSourceStatus
        />
      </SubSection>

      <RepeatableList
        title="Exceptional items"
        addLabel="Add exceptional item"
        onAdd={() =>
          set('exceptionalItems', [...value.exceptionalItems, createEmptyExceptionalItem()])
        }
        emptyMessage="No exceptional items recorded."
        count={value.exceptionalItems.length}
      >
        {value.exceptionalItems.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.title || `Exceptional item ${index + 1}`}
            onRemove={() => set('exceptionalItems', removeAt(value.exceptionalItems, index))}
            requiresConfirmation={hasRecordData([item.title, item.amount])}
          >
            <FieldGrid>
              <TextAreaField
                id={`ex-title-${item.id}`}
                label="Title"
                value={item.title}
                onChange={(next) => setExceptional(index, 'title', next)}
              />
              <DecimalInputField
                id={`ex-amount-${item.id}`}
                label="Amount (₹)"
                value={item.amount}
                onChange={(next) => setExceptional(index, 'amount', next)}
              />
              <TextAreaField
                id={`ex-desc-${item.id}`}
                label="Description"
                value={item.description}
                onChange={(next) => setExceptional(index, 'description', next)}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Per-share by period"
        addLabel="Add per-share record"
        onAdd={() =>
          set('perShareByPeriod', [...value.perShareByPeriod, createEmptyPerShareByPeriod()])
        }
        emptyMessage="No per-share records."
        count={value.perShareByPeriod.length}
      >
        {value.perShareByPeriod.map((row, index) => (
          <RepeatableCard
            key={row.id}
            title={`Per-share — ${periods.find((p) => p.id === row.periodId)?.label || `Record ${index + 1}`}`}
            onRemove={() => set('perShareByPeriod', removeAt(value.perShareByPeriod, index))}
          >
            <FieldGrid columns={3}>
              <DecimalInputField
                id={`ps-basic-shares-${row.id}`}
                label="Weighted avg basic shares"
                value={row.weightedAvgBasicShares}
                onChange={(next) => setPerShare(index, 'weightedAvgBasicShares', next)}
              />
              <DecimalInputField
                id={`ps-basic-eps-${row.id}`}
                label="Basic EPS"
                value={row.basicEps}
                onChange={(next) => setPerShare(index, 'basicEps', next)}
              />
              <DecimalInputField
                id={`ps-diluted-eps-${row.id}`}
                label="Diluted EPS"
                value={row.dilutedEps}
                onChange={(next) => setPerShare(index, 'dilutedEps', next)}
              />
              <DecimalInputField
                id={`ps-face-${row.id}`}
                label="Face value"
                value={row.faceValue}
                onChange={(next) => setPerShare(index, 'faceValue', next)}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="pl-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <FinancialsKpisSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
