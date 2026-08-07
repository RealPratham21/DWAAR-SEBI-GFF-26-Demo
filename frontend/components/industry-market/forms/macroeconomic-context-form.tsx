'use client';

import {
  ActualEstimateForecastBadge,
  DecimalInputField,
  FieldGrid,
  SectionCard,
  SelectField,
  SourcePicker,
  SubSection,
  TextAreaField,
  TextInputField,
} from '@/components/industry-market/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/industry-market/repeatable-card';
import { IndustryMarketSectionActions } from '@/components/industry-market/section-actions';
import { useIndustryMarket } from '@/lib/industry-market/context';
import {
  createEmptyIndustryMilestoneRecord,
  createEmptyMacroeconomicIndicatorRecord,
} from '@/lib/industry-market/defaults';
import {
  ACTUAL_ESTIMATE_FORECAST_OPTIONS,
  MACRO_INDICATOR_CATEGORY_OPTIONS,
} from '@/lib/industry-market/options';
import type {
  ActualEstimateForecast,
  MacroeconomicAndIndustryContext,
  MacroIndicatorCategory,
} from '@/lib/schemas/industry-market';

const SECTION_ID = 'macroeconomic-and-industry-context' as const;

export function MacroeconomicContextForm() {
  const { payload, updateSection } = useIndustryMarket();
  const value = payload.macroeconomicAndIndustryContext;

  const set = <K extends keyof MacroeconomicAndIndustryContext>(
    key: K,
    next: MacroeconomicAndIndustryContext[K],
  ) => {
    updateSection('macroeconomicAndIndustryContext', { ...value, [key]: next }, SECTION_ID);
  };

  const setEvolution = <K extends keyof MacroeconomicAndIndustryContext['industryEvolution']>(
    key: K,
    next: MacroeconomicAndIndustryContext['industryEvolution'][K],
  ) => {
    set('industryEvolution', { ...value.industryEvolution, [key]: next });
  };

  return (
    <SectionCard
      title="Macroeconomic & Industry Context"
      description="Macroeconomic indicators, industry evolution narrative and milestone register."
    >
      <RepeatableList
        title="Macroeconomic indicators"
        addLabel="Add indicator"
        onAdd={() =>
          set('macroeconomicIndicators', [
            ...value.macroeconomicIndicators,
            createEmptyMacroeconomicIndicatorRecord(),
          ])
        }
        emptyMessage="No macroeconomic indicators recorded."
        count={value.macroeconomicIndicators.length}
      >
        {value.macroeconomicIndicators.map((indicator, index) => (
          <RepeatableCard
            key={indicator.id}
            title={indicator.indicatorName || `Indicator ${index + 1}`}
            onRemove={() =>
              set('macroeconomicIndicators', removeAt(value.macroeconomicIndicators, index))
            }
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`macro-${indicator.id}-name`}
                label="Indicator name"
                value={indicator.indicatorName}
                onChange={(next) =>
                  set(
                    'macroeconomicIndicators',
                    replaceAt(value.macroeconomicIndicators, index, {
                      ...indicator,
                      indicatorName: next,
                    }),
                  )
                }
              />
              <SelectField
                id={`macro-${indicator.id}-category`}
                label="Category"
                value={indicator.category}
                onChange={(next) =>
                  set(
                    'macroeconomicIndicators',
                    replaceAt(value.macroeconomicIndicators, index, {
                      ...indicator,
                      category: next as MacroIndicatorCategory | '',
                    }),
                  )
                }
                options={MACRO_INDICATOR_CATEGORY_OPTIONS}
              />
              <TextInputField
                id={`macro-${indicator.id}-geography`}
                label="Geography"
                value={indicator.geography}
                onChange={(next) =>
                  set(
                    'macroeconomicIndicators',
                    replaceAt(value.macroeconomicIndicators, index, {
                      ...indicator,
                      geography: next,
                    }),
                  )
                }
              />
              <TextInputField
                id={`macro-${indicator.id}-period`}
                label="Period"
                value={indicator.period}
                onChange={(next) =>
                  set(
                    'macroeconomicIndicators',
                    replaceAt(value.macroeconomicIndicators, index, {
                      ...indicator,
                      period: next,
                    }),
                  )
                }
              />
              <DecimalInputField
                id={`macro-${indicator.id}-value`}
                label="Value"
                value={indicator.value}
                onChange={(next) =>
                  set(
                    'macroeconomicIndicators',
                    replaceAt(value.macroeconomicIndicators, index, {
                      ...indicator,
                      value: next,
                    }),
                  )
                }
              />
              <TextInputField
                id={`macro-${indicator.id}-unit`}
                label="Unit"
                value={indicator.unit}
                onChange={(next) =>
                  set(
                    'macroeconomicIndicators',
                    replaceAt(value.macroeconomicIndicators, index, {
                      ...indicator,
                      unit: next,
                    }),
                  )
                }
              />
              <SelectField
                id={`macro-${indicator.id}-aef`}
                label="Actual / estimate / forecast"
                value={indicator.actualEstimateForecast}
                onChange={(next) =>
                  set(
                    'macroeconomicIndicators',
                    replaceAt(value.macroeconomicIndicators, index, {
                      ...indicator,
                      actualEstimateForecast: next as ActualEstimateForecast | '',
                    }),
                  )
                }
                options={ACTUAL_ESTIMATE_FORECAST_OPTIONS}
              />
            </FieldGrid>
            {indicator.actualEstimateForecast ? (
              <ActualEstimateForecastBadge value={indicator.actualEstimateForecast} />
            ) : null}
            <SourcePicker
              id={`macro-${indicator.id}-source`}
              label="Source"
              payload={payload}
              value={indicator.sourceId}
              onChange={(next) =>
                set(
                  'macroeconomicIndicators',
                  replaceAt(value.macroeconomicIndicators, index, {
                    ...indicator,
                    sourceId: next,
                  }),
                )
              }
            />
            <TextAreaField
              id={`macro-${indicator.id}-relevance`}
              label="Relevance explanation"
              value={indicator.relevanceExplanation}
              onChange={(next) =>
                set(
                  'macroeconomicIndicators',
                  replaceAt(value.macroeconomicIndicators, index, {
                    ...indicator,
                    relevanceExplanation: next,
                  }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Industry evolution">
        <FieldGrid>
          <TextAreaField
            id="im-evolution-origin"
            label="Industry origin & development"
            value={value.industryEvolution.industryOriginDevelopment}
            onChange={(next) => setEvolution('industryOriginDevelopment', next)}
          />
          <TextAreaField
            id="im-evolution-structural"
            label="Structural evolution"
            value={value.industryEvolution.structuralEvolution}
            onChange={(next) => setEvolution('structuralEvolution', next)}
          />
          <TextAreaField
            id="im-evolution-formalisation"
            label="Formalisation"
            value={value.industryEvolution.formalisation}
            onChange={(next) => setEvolution('formalisation', next)}
          />
          <TextAreaField
            id="im-evolution-digitalisation"
            label="Digitalisation"
            value={value.industryEvolution.digitalisation}
            onChange={(next) => setEvolution('digitalisation', next)}
          />
          <TextAreaField
            id="im-evolution-regulatory"
            label="Important regulatory changes"
            value={value.industryEvolution.importantRegulatoryChanges}
            onChange={(next) => setEvolution('importantRegulatoryChanges', next)}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Industry milestones"
        addLabel="Add milestone"
        onAdd={() =>
          set('industryMilestones', [...value.industryMilestones, createEmptyIndustryMilestoneRecord()])
        }
        emptyMessage="No industry milestones recorded."
        count={value.industryMilestones.length}
      >
        {value.industryMilestones.map((milestone, index) => (
          <RepeatableCard
            key={milestone.id}
            title={milestone.event || `Milestone ${index + 1}`}
            onRemove={() => set('industryMilestones', removeAt(value.industryMilestones, index))}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`ms-${milestone.id}-date`}
                label="Date / period"
                value={milestone.datePeriod}
                onChange={(next) =>
                  set(
                    'industryMilestones',
                    replaceAt(value.industryMilestones, index, { ...milestone, datePeriod: next }),
                  )
                }
              />
              <TextInputField
                id={`ms-${milestone.id}-event`}
                label="Event"
                value={milestone.event}
                onChange={(next) =>
                  set(
                    'industryMilestones',
                    replaceAt(value.industryMilestones, index, { ...milestone, event: next }),
                  )
                }
              />
            </FieldGrid>
            <FieldGrid>
              <TextAreaField
                id={`ms-${milestone.id}-changed`}
                label="What changed"
                value={milestone.whatChanged}
                onChange={(next) =>
                  set(
                    'industryMilestones',
                    replaceAt(value.industryMilestones, index, { ...milestone, whatChanged: next }),
                  )
                }
              />
              <TextAreaField
                id={`ms-${milestone.id}-impact`}
                label="Industry impact"
                value={milestone.industryImpact}
                onChange={(next) =>
                  set(
                    'industryMilestones',
                    replaceAt(value.industryMilestones, index, { ...milestone, industryImpact: next }),
                  )
                }
              />
            </FieldGrid>
            <SourcePicker
              id={`ms-${milestone.id}-source`}
              label="Source"
              payload={payload}
              value={milestone.sourceId}
              onChange={(next) =>
                set(
                  'industryMilestones',
                  replaceAt(value.industryMilestones, index, { ...milestone, sourceId: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="im-macro-notes"
        label="Section notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <IndustryMarketSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
