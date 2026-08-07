'use client';

import {
  ComputedStat,
  DecimalInputField,
  FieldGrid,
  SectionCard,
  StatGrid,
  SubSection,
  TextAreaField,
  TextInputField,
} from '@/components/financials-kpis/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/financials-kpis/repeatable-card';
import { FinancialsKpisSectionActions } from '@/components/financials-kpis/section-actions';
import { useFinancialsKpis } from '@/lib/financials-kpis/context';
import { createEmptyFormulaRecord, createEmptySmeEligibilityByPeriod } from '@/lib/financials-kpis/defaults';
import { EM_DASH, formatMoney, formatPercent } from '@/lib/financials-kpis/format';
import { getFinancialPeriods } from '@/lib/financials-kpis/periods';
import type { FormulaRecord, RatiosCapitalisationAndIssuePriceMetrics } from '@/lib/schemas/financials-kpis';

const SECTION_ID = 'ratios-capitalisation-and-issue-price-metrics' as const;

export function RatiosMetricsForm() {
  const { payload, updateSection, model } = useFinancialsKpis();
  const value = payload.ratiosCapitalisationAndIssuePriceMetrics;
  const periods = getFinancialPeriods(payload);
  const displayUnit = payload.reportingScopePeriodsAndAuditorReadiness.reportingBasis.displayUnit;

  const set = <K extends keyof RatiosCapitalisationAndIssuePriceMetrics>(
    key: K,
    next: RatiosCapitalisationAndIssuePriceMetrics[K],
  ) => {
    updateSection('ratiosCapitalisationAndIssuePriceMetrics', { ...value, [key]: next }, SECTION_ID);
  };

  const setFormula = <K extends keyof FormulaRecord>(
    index: number,
    key: K,
    next: FormulaRecord[K],
  ) => {
    set(
      'formulaRecords',
      replaceAt(value.formulaRecords, index, {
        ...value.formulaRecords[index],
        [key]: next,
      }),
    );
  };

  const setSme = (
    index: number,
    key: 'operatingProfit' | 'netWorth' | 'fcfe',
    next: string,
  ) => {
    set(
      'smeEligibilityByPeriod',
      replaceAt(value.smeEligibilityByPeriod, index, {
        ...value.smeEligibilityByPeriod[index],
        [key]: next,
      }),
    );
  };

  return (
    <SectionCard
      title="Ratios, Capitalisation & Issue-Price Metrics"
      description="Derived ratios (read-only), formula registry and SME eligibility inputs."
    >
      <SubSection
        title="Computed ratios (read-only)"
        description="Derived from entered financial statements — not persisted."
      >
        {model.ratiosByPeriod.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Enter P&L and balance sheet values to see derived ratios.
          </p>
        ) : (
          <StatGrid>
            {model.ratiosByPeriod.map((ratio) => (
              <ComputedStat
                key={ratio.periodId}
                label={`${ratio.periodLabel} — ROE`}
                value={ratio.roe ? formatPercent(ratio.roe) : EM_DASH}
              />
            ))}
            {model.ratiosByPeriod.map((ratio) => (
              <ComputedStat
                key={`${ratio.periodId}-de`}
                label={`${ratio.periodLabel} — Debt / equity`}
                value={ratio.debtEquityRatio || EM_DASH}
              />
            ))}
            {model.ratiosByPeriod.map((ratio) => (
              <ComputedStat
                key={`${ratio.periodId}-eps`}
                label={`${ratio.periodLabel} — Basic EPS`}
                value={ratio.basicEps ? formatMoney(ratio.basicEps, displayUnit) : EM_DASH}
              />
            ))}
          </StatGrid>
        )}
      </SubSection>

      <RepeatableList
        title="Formula records"
        description="Non-GAAP or supplementary metrics with traceable definitions."
        addLabel="Add formula"
        onAdd={() =>
          set('formulaRecords', [...value.formulaRecords, createEmptyFormulaRecord()])
        }
        emptyMessage="No formula records."
        count={value.formulaRecords.length}
      >
        {value.formulaRecords.map((formula, index) => (
          <RepeatableCard
            key={formula.id}
            title={formula.metricKey || `Formula ${index + 1}`}
            onRemove={() => set('formulaRecords', removeAt(value.formulaRecords, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`frm-key-${formula.id}`}
                label="Metric key"
                value={formula.metricKey}
                onChange={(next) => setFormula(index, 'metricKey', next)}
              />
              <TextAreaField
                id={`frm-def-${formula.id}`}
                label="Definition"
                value={formula.definition}
                onChange={(next) => setFormula(index, 'definition', next)}
              />
              <TextAreaField
                id={`frm-formula-${formula.id}`}
                label="Formula"
                value={formula.formula}
                onChange={(next) => setFormula(index, 'formula', next)}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="SME eligibility inputs">
        {periods.length === 0 ? (
          <p className="text-sm text-muted-foreground">Define periods in Reporting Scope first.</p>
        ) : (
          <div className="space-y-4">
            {(value.smeEligibilityByPeriod.length === 0
              ? periods.map((p) => ({ ...createEmptySmeEligibilityByPeriod(), periodId: p.id }))
              : value.smeEligibilityByPeriod
            ).map((row, index) => {
              const period = periods.find((p) => p.id === row.periodId);
              const smeState = model.smeEligibility.find((s) => s.periodId === row.periodId);
              return (
                <div key={row.id ?? period?.id ?? index} className="rounded-md border border-border p-4">
                  <p className="mb-3 text-sm font-medium">{period?.label || 'Period'}</p>
                  <FieldGrid columns={3}>
                    <DecimalInputField
                      id={`sme-op-${row.id}`}
                      label="Operating profit (₹)"
                      value={row.operatingProfit}
                      onChange={(next) => {
                        if (value.smeEligibilityByPeriod[index]) {
                          setSme(index, 'operatingProfit', next);
                        } else {
                          set('smeEligibilityByPeriod', [
                            ...value.smeEligibilityByPeriod,
                            { ...createEmptySmeEligibilityByPeriod(), periodId: period?.id ?? '', operatingProfit: next },
                          ]);
                        }
                      }}
                    />
                    <DecimalInputField
                      id={`sme-nw-${row.id}`}
                      label="Net worth (₹)"
                      value={row.netWorth}
                      onChange={(next) => setSme(index, 'netWorth', next)}
                    />
                    <DecimalInputField
                      id={`sme-fcfe-${row.id}`}
                      label="FCFE (₹)"
                      value={row.fcfe}
                      onChange={(next) => setSme(index, 'fcfe', next)}
                    />
                  </FieldGrid>
                  {smeState ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Derived SME states — operating profit:{' '}
                      {smeState.operatingProfitState.replaceAll('_', ' ')}, net worth:{' '}
                      {smeState.netWorthState.replaceAll('_', ' ')}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </SubSection>

      <TextAreaField
        id="ratios-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <FinancialsKpisSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
