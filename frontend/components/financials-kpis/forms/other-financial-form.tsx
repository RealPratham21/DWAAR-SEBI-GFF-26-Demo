'use client';

import {
  DecimalInputField,
  FieldGrid,
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
  createEmptyContingentLiability,
  createEmptyDividendRecord,
  createEmptyRelatedPartyTransaction,
  createEmptySegmentRecord,
  createEmptyTaxByPeriod,
  createEmptyWorkingCapitalSummary,
} from '@/lib/financials-kpis/defaults';
import type { OtherFinancialInformation } from '@/lib/schemas/financials-kpis';

const SECTION_ID = 'other-financial-information' as const;

export function OtherFinancialForm() {
  const { payload, updateSection } = useFinancialsKpis();
  const value = payload.otherFinancialInformation;

  const set = <K extends keyof OtherFinancialInformation>(
    key: K,
    next: OtherFinancialInformation[K],
  ) => {
    updateSection('otherFinancialInformation', { ...value, [key]: next }, SECTION_ID);
  };

  const setIndebtedness = <K extends keyof OtherFinancialInformation['indebtednessSummary']>(
    key: K,
    next: OtherFinancialInformation['indebtednessSummary'][K],
  ) => {
    set('indebtednessSummary', { ...value.indebtednessSummary, [key]: next });
  };

  const setDividendPolicy = <K extends keyof OtherFinancialInformation['dividendPolicy']>(
    key: K,
    next: OtherFinancialInformation['dividendPolicy'][K],
  ) => {
    set('dividendPolicy', { ...value.dividendPolicy, [key]: next });
  };

  return (
    <SectionCard
      title="Other Financial Information"
      description="Segments, related parties, contingencies, working capital, indebtedness, tax and dividends."
    >
      <RepeatableList
        title="Segment records"
        addLabel="Add segment"
        onAdd={() =>
          set('segmentRecords', [...value.segmentRecords, createEmptySegmentRecord()])
        }
        emptyMessage="No segment records."
        count={value.segmentRecords.length}
      >
        {value.segmentRecords.map((segment, index) => (
          <RepeatableCard
            key={segment.id}
            title={segment.segmentName || `Segment ${index + 1}`}
            onRemove={() => set('segmentRecords', removeAt(value.segmentRecords, index))}
            requiresConfirmation={hasRecordData([segment.segmentName])}
          >
            <FieldGrid>
              <TextInputField
                id={`seg-name-${segment.id}`}
                label="Segment name"
                value={segment.segmentName}
                onChange={(next) =>
                  set(
                    'segmentRecords',
                    replaceAt(value.segmentRecords, index, { ...segment, segmentName: next }),
                  )
                }
              />
              <DecimalInputField
                id={`seg-revenue-${segment.id}`}
                label="External revenue (₹)"
                value={segment.externalRevenue}
                onChange={(next) =>
                  set(
                    'segmentRecords',
                    replaceAt(value.segmentRecords, index, { ...segment, externalRevenue: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Related-party transactions"
        addLabel="Add transaction"
        onAdd={() =>
          set('relatedPartyTransactions', [
            ...value.relatedPartyTransactions,
            createEmptyRelatedPartyTransaction(),
          ])
        }
        emptyMessage="No related-party transactions."
        count={value.relatedPartyTransactions.length}
      >
        {value.relatedPartyTransactions.map((txn, index) => (
          <RepeatableCard
            key={txn.id}
            title={txn.relatedPartyEntity || `Transaction ${index + 1}`}
            onRemove={() =>
              set('relatedPartyTransactions', removeAt(value.relatedPartyTransactions, index))
            }
          >
            <FieldGrid>
              <TextInputField
                id={`rp-name-${txn.id}`}
                label="Related party"
                value={txn.relatedPartyEntity}
                onChange={(next) =>
                  set(
                    'relatedPartyTransactions',
                    replaceAt(value.relatedPartyTransactions, index, {
                      ...txn,
                      relatedPartyEntity: next,
                    }),
                  )
                }
              />
              <DecimalInputField
                id={`rp-amount-${txn.id}`}
                label="Transaction amount (₹)"
                value={txn.transactionAmount}
                onChange={(next) =>
                  set(
                    'relatedPartyTransactions',
                    replaceAt(value.relatedPartyTransactions, index, {
                      ...txn,
                      transactionAmount: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Contingent liabilities"
        addLabel="Add contingency"
        onAdd={() =>
          set('contingentLiabilities', [
            ...value.contingentLiabilities,
            createEmptyContingentLiability(),
          ])
        }
        emptyMessage="No contingent liabilities."
        count={value.contingentLiabilities.length}
      >
        {value.contingentLiabilities.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.description || `Contingency ${index + 1}`}
            onRemove={() =>
              set('contingentLiabilities', removeAt(value.contingentLiabilities, index))
            }
          >
            <FieldGrid>
              <TextAreaField
                id={`cl-desc-${item.id}`}
                label="Description"
                value={item.description}
                onChange={(next) =>
                  set(
                    'contingentLiabilities',
                    replaceAt(value.contingentLiabilities, index, { ...item, description: next }),
                  )
                }
              />
              <DecimalInputField
                id={`cl-amount-${item.id}`}
                label="Contingent amount (₹)"
                value={item.contingentAmount}
                onChange={(next) =>
                  set(
                    'contingentLiabilities',
                    replaceAt(value.contingentLiabilities, index, {
                      ...item,
                      contingentAmount: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Working capital summaries"
        addLabel="Add WC summary"
        onAdd={() =>
          set('workingCapitalSummaries', [
            ...value.workingCapitalSummaries,
            createEmptyWorkingCapitalSummary(),
          ])
        }
        emptyMessage="No working capital summaries."
        count={value.workingCapitalSummaries.length}
      >
        {value.workingCapitalSummaries.map((wc, index) => (
          <RepeatableCard
            key={wc.id}
            title={`WC summary ${index + 1}`}
            onRemove={() =>
              set('workingCapitalSummaries', removeAt(value.workingCapitalSummaries, index))
            }
          >
            <FieldGrid columns={3}>
              <DecimalInputField
                id={`wc-inventory-${wc.id}`}
                label="Inventory (₹)"
                value={wc.inventory}
                onChange={(next) =>
                  set(
                    'workingCapitalSummaries',
                    replaceAt(value.workingCapitalSummaries, index, { ...wc, inventory: next }),
                  )
                }
              />
              <DecimalInputField
                id={`wc-receivables-${wc.id}`}
                label="Receivables (₹)"
                value={wc.receivables}
                onChange={(next) =>
                  set(
                    'workingCapitalSummaries',
                    replaceAt(value.workingCapitalSummaries, index, { ...wc, receivables: next }),
                  )
                }
              />
              <DecimalInputField
                id={`wc-payables-${wc.id}`}
                label="Payables (₹)"
                value={wc.payables}
                onChange={(next) =>
                  set(
                    'workingCapitalSummaries',
                    replaceAt(value.workingCapitalSummaries, index, { ...wc, payables: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Indebtedness summary">
        <FieldGrid columns={3}>
          <DecimalInputField
            id="debt-total"
            label="Total debt (₹)"
            value={value.indebtednessSummary.totalDebt}
            onChange={(next) => setIndebtedness('totalDebt', next)}
          />
          <DecimalInputField
            id="debt-short"
            label="Short-term debt (₹)"
            value={value.indebtednessSummary.shortTermDebt}
            onChange={(next) => setIndebtedness('shortTermDebt', next)}
          />
          <DecimalInputField
            id="debt-long"
            label="Long-term debt (₹)"
            value={value.indebtednessSummary.longTermDebt}
            onChange={(next) => setIndebtedness('longTermDebt', next)}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Tax by period"
        addLabel="Add tax record"
        onAdd={() => set('taxByPeriod', [...value.taxByPeriod, createEmptyTaxByPeriod()])}
        emptyMessage="No tax records."
        count={value.taxByPeriod.length}
      >
        {value.taxByPeriod.map((tax, index) => (
          <RepeatableCard
            key={tax.id}
            title={`Tax record ${index + 1}`}
            onRemove={() => set('taxByPeriod', removeAt(value.taxByPeriod, index))}
          >
            <FieldGrid>
              <DecimalInputField
                id={`tax-current-${tax.id}`}
                label="Current tax (₹)"
                value={tax.currentTax}
                onChange={(next) =>
                  set(
                    'taxByPeriod',
                    replaceAt(value.taxByPeriod, index, { ...tax, currentTax: next }),
                  )
                }
              />
              <DecimalInputField
                id={`tax-deferred-${tax.id}`}
                label="Deferred tax (₹)"
                value={tax.deferredTax}
                onChange={(next) =>
                  set(
                    'taxByPeriod',
                    replaceAt(value.taxByPeriod, index, { ...tax, deferredTax: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Dividend records"
        addLabel="Add dividend"
        onAdd={() => set('dividendRecords', [...value.dividendRecords, createEmptyDividendRecord()])}
        emptyMessage="No dividend records."
        count={value.dividendRecords.length}
      >
        {value.dividendRecords.map((div, index) => (
          <RepeatableCard
            key={div.id}
            title={`Dividend ${index + 1}`}
            onRemove={() => set('dividendRecords', removeAt(value.dividendRecords, index))}
          >
            <FieldGrid>
              <DecimalInputField
                id={`div-total-${div.id}`}
                label="Total dividend amount (₹)"
                value={div.totalDividendAmount}
                onChange={(next) =>
                  set(
                    'dividendRecords',
                    replaceAt(value.dividendRecords, index, { ...div, totalDividendAmount: next }),
                  )
                }
              />
              <DecimalInputField
                id={`div-rate-${div.id}`}
                label="Dividend per share"
                value={div.dividendPerShare}
                onChange={(next) =>
                  set(
                    'dividendRecords',
                    replaceAt(value.dividendRecords, index, { ...div, dividendPerShare: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Dividend policy">
        <TextAreaField
          id="div-policy-factors"
          label="Factors considered"
          value={value.dividendPolicy.factorsConsidered}
          onChange={(next) => setDividendPolicy('factorsConsidered', next)}
        />
      </SubSection>

      <TextAreaField
        id="ofi-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <FinancialsKpisSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
