'use client';

import {
  ComputedStat,
  FinancialGridTable,
  getGridAmount,
  getGridSourceStatus,
  SectionCard,
  StatGrid,
  SubSection,
  TextAreaField,
  upsertGridLineValue,
} from '@/components/financials-kpis/form-helpers';
import { FinancialsKpisSectionActions } from '@/components/financials-kpis/section-actions';
import { useFinancialsKpis } from '@/lib/financials-kpis/context';
import {
  createEmptyBalanceSheetLineValue,
  createEmptyCashFlowLineValue,
  createEmptyChangesInEquityLineValue,
} from '@/lib/financials-kpis/defaults';
import { EM_DASH, formatMoney } from '@/lib/financials-kpis/format';
import { getFinancialPeriods } from '@/lib/financials-kpis/periods';
import {
  BS_CURRENT_ASSET_KEYS,
  BS_EQUITY_KEYS,
  BS_LIABILITY_KEYS,
  BS_NON_CURRENT_ASSET_KEYS,
  CF_LINE_KEYS,
  EQUITY_LINE_KEYS,
  bsLineLabel,
  cfLineLabel,
  equityLineLabel,
} from '@/lib/financials-kpis/bs-lines';
import type { AssetsLiabilitiesEquityAndCashFlows } from '@/lib/schemas/financials-kpis';
import type { BsLineKey, CfLineKey, EquityLineKey, SourceStatus } from '@/lib/schemas/financials-kpis';

const SECTION_ID = 'assets-liabilities-equity-and-cash-flows' as const;

const BS_GRID_KEYS = [
  ...BS_NON_CURRENT_ASSET_KEYS,
  ...BS_CURRENT_ASSET_KEYS,
  ...BS_EQUITY_KEYS,
  ...BS_LIABILITY_KEYS,
] as const;

export function BalanceSheetForm() {
  const { payload, updateSection, model } = useFinancialsKpis();
  const value = payload.assetsLiabilitiesEquityAndCashFlows;
  const periods = getFinancialPeriods(payload);
  const displayUnit = payload.reportingScopePeriodsAndAuditorReadiness.reportingBasis.displayUnit;

  const set = <K extends keyof AssetsLiabilitiesEquityAndCashFlows>(
    key: K,
    next: AssetsLiabilitiesEquityAndCashFlows[K],
  ) => {
    updateSection('assetsLiabilitiesEquityAndCashFlows', { ...value, [key]: next }, SECTION_ID);
  };

  const setBsCell = (periodId: string, lineKey: string, amount: string) => {
    set(
      'balanceSheetLineValues',
      upsertGridLineValue(
        value.balanceSheetLineValues,
        periodId,
        lineKey,
        { amount },
        createEmptyBalanceSheetLineValue,
      ),
    );
  };

  const setBsSource = (periodId: string, lineKey: string, sourceStatus: SourceStatus | '') => {
    set(
      'balanceSheetLineValues',
      upsertGridLineValue(
        value.balanceSheetLineValues,
        periodId,
        lineKey,
        { sourceStatus },
        createEmptyBalanceSheetLineValue,
      ),
    );
  };

  const setCfCell = (periodId: string, lineKey: string, amount: string) => {
    set(
      'cashFlowLineValues',
      upsertGridLineValue(
        value.cashFlowLineValues,
        periodId,
        lineKey,
        { amount },
        createEmptyCashFlowLineValue,
      ),
    );
  };

  const setEquityCell = (periodId: string, lineKey: string, amount: string) => {
    set(
      'changesInEquityLineValues',
      upsertGridLineValue(
        value.changesInEquityLineValues,
        periodId,
        lineKey,
        { amount },
        createEmptyChangesInEquityLineValue,
      ),
    );
  };

  return (
    <SectionCard
      title="Assets, Liabilities, Equity & Cash Flows"
      description="Balance sheet, cash flow and changes-in-equity grids driven by the shared period registry."
    >
      {model.bsByPeriod.length > 0 ? (
        <StatGrid title="Balance sheet reconciliation (derived)">
          {model.bsByPeriod.map((summary) => (
            <ComputedStat
              key={summary.periodId}
              label={`${summary.periodLabel} — assets vs E&L`}
              value={
                summary.totalAssets && summary.totalEquityAndLiabilities
                  ? `${formatMoney(summary.totalAssets, displayUnit)} vs ${formatMoney(summary.totalEquityAndLiabilities, displayUnit)} (${summary.assetsReconciles ? 'reconciled' : `variance ${formatMoney(summary.variance, displayUnit)}`})`
                  : EM_DASH
              }
            />
          ))}
        </StatGrid>
      ) : null}

      {model.cfByPeriod.length > 0 ? (
        <StatGrid title="Cash flow reconciliation (derived)">
          {model.cfByPeriod.map((summary) => (
            <ComputedStat
              key={summary.periodId}
              label={`${summary.periodLabel} — closing cash`}
              value={
                summary.closingCash
                  ? `${formatMoney(summary.closingCash, displayUnit)} (${summary.reconciles ? 'reconciled' : `variance ${formatMoney(summary.variance, displayUnit)}`})`
                  : EM_DASH
              }
            />
          ))}
        </StatGrid>
      ) : null}

      <SubSection title="Balance sheet">
        <FinancialGridTable
          periods={periods}
          lineKeys={BS_GRID_KEYS}
          getLineLabel={(key) => bsLineLabel(key as BsLineKey)}
          getAmount={(periodId, lineKey) =>
            getGridAmount(value.balanceSheetLineValues, periodId, lineKey)
          }
          getSourceStatus={(periodId, lineKey) =>
            getGridSourceStatus(value.balanceSheetLineValues, periodId, lineKey)
          }
          onAmountChange={setBsCell}
          onSourceStatusChange={setBsSource}
          displayUnit={displayUnit}
          showSourceStatus
        />
      </SubSection>

      <SubSection title="Cash flow statement">
        <FinancialGridTable
          periods={periods}
          lineKeys={CF_LINE_KEYS}
          getLineLabel={(key) => cfLineLabel(key as CfLineKey)}
          getAmount={(periodId, lineKey) =>
            getGridAmount(value.cashFlowLineValues, periodId, lineKey)
          }
          onAmountChange={setCfCell}
          displayUnit={displayUnit}
        />
      </SubSection>

      <SubSection title="Changes in equity">
        <FinancialGridTable
          periods={periods}
          lineKeys={EQUITY_LINE_KEYS}
          getLineLabel={(key) => equityLineLabel(key as EquityLineKey)}
          getAmount={(periodId, lineKey) =>
            getGridAmount(value.changesInEquityLineValues, periodId, lineKey)
          }
          onAmountChange={setEquityCell}
          displayUnit={displayUnit}
        />
      </SubSection>

      <TextAreaField
        id="bs-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <FinancialsKpisSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
