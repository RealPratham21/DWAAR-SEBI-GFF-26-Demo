'use client';

import {
  CheckboxField,
  DateField,
  DecimalInputField,
  FieldGrid,
  SectionCard,
  SubSection,
  TextAreaField,
  TextInputField,
  TernaryField,
} from '@/components/financials-kpis/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/financials-kpis/repeatable-card';
import { FinancialsKpisSectionActions } from '@/components/financials-kpis/section-actions';
import { useFinancialsKpis } from '@/lib/financials-kpis/context';
import {
  createEmptyPerformanceFactor,
  createEmptySubsequentEvent,
  createEmptyTrendUncertainty,
  createEmptyVarianceAnalysis,
} from '@/lib/financials-kpis/defaults';
import { FINANCIALS_KPIS_CONFIRMATION_FIELDS } from '@/lib/financials-kpis/options';
import type { MdaTrendsMaterialDevelopmentsAndConfirmations } from '@/lib/schemas/financials-kpis';

const SECTION_ID = 'mda-trends-material-developments-and-confirmations' as const;

export function MdaConfirmationsForm() {
  const { payload, updateSection } = useFinancialsKpis();
  const value = payload.mdaTrendsMaterialDevelopmentsAndConfirmations;

  const set = <K extends keyof MdaTrendsMaterialDevelopmentsAndConfirmations>(
    key: K,
    next: MdaTrendsMaterialDevelopmentsAndConfirmations[K],
  ) => {
    updateSection(
      'mdaTrendsMaterialDevelopmentsAndConfirmations',
      { ...value, [key]: next },
      SECTION_ID,
    );
  };

  const setLiquidity = <
    K extends keyof MdaTrendsMaterialDevelopmentsAndConfirmations['liquidityCapitalResources'],
  >(
    key: K,
    next: MdaTrendsMaterialDevelopmentsAndConfirmations['liquidityCapitalResources'][K],
  ) => {
    set('liquidityCapitalResources', { ...value.liquidityCapitalResources, [key]: next });
  };

  const setConfirmation = (
    key: keyof MdaTrendsMaterialDevelopmentsAndConfirmations['confirmations'],
    checked: boolean,
  ) => {
    set('confirmations', { ...value.confirmations, [key]: checked });
  };

  return (
    <SectionCard
      title="MD&A, Trends, Material Developments & Confirmations"
      description="Performance factors, variance analysis, liquidity, trends, subsequent events and confirmations."
    >
      <RepeatableList
        title="Performance factors"
        addLabel="Add factor"
        onAdd={() =>
          set('performanceFactors', [...value.performanceFactors, createEmptyPerformanceFactor()])
        }
        emptyMessage="No performance factors recorded."
        count={value.performanceFactors.length}
      >
        {value.performanceFactors.map((factor, index) => (
          <RepeatableCard
            key={factor.id}
            title={factor.title || `Factor ${index + 1}`}
            onRemove={() => set('performanceFactors', removeAt(value.performanceFactors, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`pf-title-${factor.id}`}
                label="Title"
                value={factor.title}
                onChange={(next) =>
                  set(
                    'performanceFactors',
                    replaceAt(value.performanceFactors, index, { ...factor, title: next }),
                  )
                }
              />
              <TextAreaField
                id={`pf-explanation-${factor.id}`}
                label="Explanation"
                value={factor.explanation}
                onChange={(next) =>
                  set(
                    'performanceFactors',
                    replaceAt(value.performanceFactors, index, { ...factor, explanation: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Variance analyses"
        addLabel="Add variance"
        onAdd={() =>
          set('varianceAnalyses', [...value.varianceAnalyses, createEmptyVarianceAnalysis()])
        }
        emptyMessage="No variance analyses."
        count={value.varianceAnalyses.length}
      >
        {value.varianceAnalyses.map((variance, index) => (
          <RepeatableCard
            key={variance.id}
            title={variance.lineItem || `Variance ${index + 1}`}
            onRemove={() => set('varianceAnalyses', removeAt(value.varianceAnalyses, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`va-line-${variance.id}`}
                label="Line item"
                value={variance.lineItem}
                onChange={(next) =>
                  set(
                    'varianceAnalyses',
                    replaceAt(value.varianceAnalyses, index, { ...variance, lineItem: next }),
                  )
                }
              />
              <TextAreaField
                id={`va-explanation-${variance.id}`}
                label="Explanation"
                value={variance.explanation}
                onChange={(next) =>
                  set(
                    'varianceAnalyses',
                    replaceAt(value.varianceAnalyses, index, { ...variance, explanation: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Liquidity and capital resources">
        <FieldGrid>
          <TextAreaField
            id="liq-sources"
            label="Principal liquidity sources"
            value={value.liquidityCapitalResources.principalLiquiditySources}
            onChange={(next) => setLiquidity('principalLiquiditySources', next)}
          />
          <DecimalInputField
            id="liq-cash"
            label="Cash available (₹)"
            value={value.liquidityCapitalResources.cashAvailable}
            onChange={(next) => setLiquidity('cashAvailable', next)}
          />
          <TernaryField
            id="liq-ocf"
            label="Operating cash flow adequacy"
            value={value.liquidityCapitalResources.operatingCashFlowAdequacy}
            onChange={(next) => setLiquidity('operatingCashFlowAdequacy', next)}
          />
          <TernaryField
            id="liq-gc"
            label="Going concern concerns"
            value={value.liquidityCapitalResources.goingConcernConcerns}
            onChange={(next) => setLiquidity('goingConcernConcerns', next)}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Trends and uncertainties"
        addLabel="Add trend"
        onAdd={() =>
          set('trendsUncertainties', [...value.trendsUncertainties, createEmptyTrendUncertainty()])
        }
        emptyMessage="No trends or uncertainties."
        count={value.trendsUncertainties.length}
      >
        {value.trendsUncertainties.map((trend, index) => (
          <RepeatableCard
            key={trend.id}
            title={trend.title || `Trend ${index + 1}`}
            onRemove={() => set('trendsUncertainties', removeAt(value.trendsUncertainties, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`tr-title-${trend.id}`}
                label="Title"
                value={trend.title}
                onChange={(next) =>
                  set(
                    'trendsUncertainties',
                    replaceAt(value.trendsUncertainties, index, { ...trend, title: next }),
                  )
                }
              />
              <TextAreaField
                id={`tr-desc-${trend.id}`}
                label="Description"
                value={trend.description}
                onChange={(next) =>
                  set(
                    'trendsUncertainties',
                    replaceAt(value.trendsUncertainties, index, { ...trend, description: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Subsequent events"
        addLabel="Add event"
        onAdd={() =>
          set('subsequentEvents', [...value.subsequentEvents, createEmptySubsequentEvent()])
        }
        emptyMessage="No subsequent events."
        count={value.subsequentEvents.length}
      >
        {value.subsequentEvents.map((event, index) => (
          <RepeatableCard
            key={event.id}
            title={event.description || `Event ${index + 1}`}
            onRemove={() => set('subsequentEvents', removeAt(value.subsequentEvents, index))}
          >
            <FieldGrid>
              <DateField
                id={`se-date-${event.id}`}
                label="Event date"
                value={event.eventDate}
                onChange={(next) =>
                  set(
                    'subsequentEvents',
                    replaceAt(value.subsequentEvents, index, { ...event, eventDate: next }),
                  )
                }
              />
              <TextAreaField
                id={`se-desc-${event.id}`}
                label="Description"
                value={event.description}
                onChange={(next) =>
                  set(
                    'subsequentEvents',
                    replaceAt(value.subsequentEvents, index, { ...event, description: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Confirmations">
        <div className="space-y-3">
          {FINANCIALS_KPIS_CONFIRMATION_FIELDS.map((field) => (
            <CheckboxField
              key={field.key}
              id={`confirm-${field.key}`}
              label={field.label}
              checked={value.confirmations[field.key]}
              onChange={(checked) => setConfirmation(field.key, checked)}
            />
          ))}
        </div>
      </SubSection>

      <TextAreaField
        id="mda-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <FinancialsKpisSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
