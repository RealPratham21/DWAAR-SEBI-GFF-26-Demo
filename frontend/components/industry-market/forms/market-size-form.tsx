'use client';

import {
  ActualEstimateForecastBadge,
  ComputedStat,
  DecimalInputField,
  FieldGrid,
  SectionCard,
  SelectField,
  SourcePicker,
  StatGrid,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/industry-market/form-helpers';
import {
  hasRecordData,
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/industry-market/repeatable-card';
import { IndustryMarketSectionActions } from '@/components/industry-market/section-actions';
import { useIndustryMarket } from '@/lib/industry-market/context';
import {
  createEmptyMarketSegmentationRecord,
  createEmptyMarketSeriesPeriodValue,
  createEmptyMarketSeriesRecord,
  createEmptySegmentMappingRecord,
} from '@/lib/industry-market/defaults';
import {
  calculateCagr,
  calculateYoYGrowth,
  reconcileReportedVsCalculatedCagr,
  reconcileSegmentPercentages,
} from '@/lib/industry-market/market-series';
import {
  ACTUAL_ESTIMATE_FORECAST_OPTIONS,
  FORECAST_SCENARIO_OPTIONS,
  MARKET_METRIC_OPTIONS,
  NOMINAL_REAL_OPTIONS,
  SEGMENTATION_DIMENSION_OPTIONS,
} from '@/lib/industry-market/options';
import { countMarketSeriesReferences } from '@/lib/industry-market/references';
import type {
  ActualEstimateForecast,
  MarketMetric,
  MarketSeriesRecord,
  MarketSizeSegmentationAndGrowth,
  NominalReal,
  SegmentationDimension,
} from '@/lib/schemas/industry-market';

const SECTION_ID = 'market-size-segmentation-and-growth' as const;

export function MarketSizeForm() {
  const { payload, updateSection } = useIndustryMarket();
  const value = payload.marketSizeSegmentationAndGrowth;

  const set = <K extends keyof MarketSizeSegmentationAndGrowth>(
    key: K,
    next: MarketSizeSegmentationAndGrowth[K],
  ) => {
    updateSection('marketSizeSegmentationAndGrowth', { ...value, [key]: next }, SECTION_ID);
  };

  const setSeries = (index: number, next: MarketSeriesRecord) => {
    set('marketSeries', replaceAt(value.marketSeries, index, next));
  };

  const removeSeries = (index: number) => {
    const series = value.marketSeries[index];
    const refs = countMarketSeriesReferences(payload, series.id);
    if (refs.total > 0) {
      window.alert(
        `This market series is referenced in ${refs.total} place(s):\n${refs.locations.join('\n')}`,
      );
      return;
    }
    if (
      hasRecordData([series.marketName]) &&
      !window.confirm('Remove this market series? Entered values will be lost.')
    ) {
      return;
    }
    set('marketSeries', removeAt(value.marketSeries, index));
  };

  const segmentReconciliations = reconcileSegmentPercentages(value.marketSegmentations);

  const seriesOptions = value.marketSeries.map((series) => ({
    value: series.id,
    label: series.marketName || series.id,
  }));

  const segmentOptions = value.marketSegmentations.map((segment) => ({
    value: segment.id,
    label: segment.segmentName || segment.id,
  }));

  return (
    <SectionCard
      title="Market Size, Segmentation & Growth"
      description="Market series with period values, segmentation dimensions and segment-to-issuer mapping."
    >
      <RepeatableList
        title="Market series"
        addLabel="Add market series"
        onAdd={() => set('marketSeries', [...value.marketSeries, createEmptyMarketSeriesRecord()])}
        emptyMessage="No market series recorded."
        count={value.marketSeries.length}
      >
        {value.marketSeries.map((series, seriesIndex) => {
          const filledPeriods = series.periodValues.filter((pv) => pv.value.trim() !== '');
          const firstPeriod = filledPeriods[0];
          const lastPeriod = filledPeriods[filledPeriods.length - 1];
          const periodCount = Math.max(filledPeriods.length - 1, 1);
          const calculatedCagr = calculateCagr(
            firstPeriod?.value ?? '',
            series.forecastMetadata.forecastValue || lastPeriod?.value || '',
            periodCount,
          );
          const cagrReconciliation = reconcileReportedVsCalculatedCagr(
            series.forecastMetadata.reportedCagr,
            calculatedCagr,
          );

          return (
            <RepeatableCard
              key={series.id}
              title={series.marketName || `Market series ${seriesIndex + 1}`}
              onRemove={() => removeSeries(seriesIndex)}
            >
              <FieldGrid columns={3}>
                <TextInputField
                  id={`ms-${series.id}-name`}
                  label="Market name"
                  value={series.marketName}
                  onChange={(next) => setSeries(seriesIndex, { ...series, marketName: next })}
                />
                <SelectField
                  id={`ms-${series.id}-metric`}
                  label="Metric"
                  value={series.metric}
                  onChange={(next) =>
                    setSeries(seriesIndex, { ...series, metric: next as MarketMetric | '' })
                  }
                  options={MARKET_METRIC_OPTIONS}
                />
                <SelectField
                  id={`ms-${series.id}-nominal-real`}
                  label="Nominal / real"
                  value={series.nominalReal}
                  onChange={(next) =>
                    setSeries(seriesIndex, { ...series, nominalReal: next as NominalReal | '' })
                  }
                  options={NOMINAL_REAL_OPTIONS}
                />
                <TextInputField
                  id={`ms-${series.id}-geography`}
                  label="Geography"
                  value={series.geography}
                  onChange={(next) => setSeries(seriesIndex, { ...series, geography: next })}
                />
                <TextInputField
                  id={`ms-${series.id}-currency`}
                  label="Currency"
                  value={series.currency}
                  onChange={(next) => setSeries(seriesIndex, { ...series, currency: next })}
                />
                <TextInputField
                  id={`ms-${series.id}-unit`}
                  label="Unit"
                  value={series.unit}
                  onChange={(next) => setSeries(seriesIndex, { ...series, unit: next })}
                />
              </FieldGrid>

              <SourcePicker
                id={`ms-${series.id}-primary-source`}
                label="Primary source"
                payload={payload}
                value={series.primarySourceId}
                onChange={(next) => setSeries(seriesIndex, { ...series, primarySourceId: next })}
              />

              <SubSection title="Period values">
                <RepeatableList
                  title="Historical / current values"
                  addLabel="Add period"
                  onAdd={() =>
                    setSeries(seriesIndex, {
                      ...series,
                      periodValues: [...series.periodValues, createEmptyMarketSeriesPeriodValue()],
                    })
                  }
                  emptyMessage="No period values."
                  count={series.periodValues.length}
                >
                  {series.periodValues.map((periodValue, pvIndex) => {
                    const prior = series.periodValues[pvIndex - 1];
                    const yoy =
                      prior && periodValue.value
                        ? calculateYoYGrowth(periodValue.value, prior.value)
                        : '';
                    return (
                      <RepeatableCard
                        key={periodValue.id}
                        title={periodValue.period || `Period ${pvIndex + 1}`}
                        onRemove={() =>
                          setSeries(seriesIndex, {
                            ...series,
                            periodValues: removeAt(series.periodValues, pvIndex),
                          })
                        }
                      >
                        <FieldGrid columns={3}>
                          <TextInputField
                            id={`pv-${periodValue.id}-period`}
                            label="Period"
                            value={periodValue.period}
                            onChange={(next) =>
                              setSeries(seriesIndex, {
                                ...series,
                                periodValues: replaceAt(series.periodValues, pvIndex, {
                                  ...periodValue,
                                  period: next,
                                }),
                              })
                            }
                          />
                          <DecimalInputField
                            id={`pv-${periodValue.id}-value`}
                            label="Value"
                            value={periodValue.value}
                            onChange={(next) =>
                              setSeries(seriesIndex, {
                                ...series,
                                periodValues: replaceAt(series.periodValues, pvIndex, {
                                  ...periodValue,
                                  value: next,
                                }),
                              })
                            }
                          />
                          <SelectField
                            id={`pv-${periodValue.id}-aef`}
                            label="Actual / estimate / forecast"
                            value={periodValue.actualEstimateForecast}
                            onChange={(next) =>
                              setSeries(seriesIndex, {
                                ...series,
                                periodValues: replaceAt(series.periodValues, pvIndex, {
                                  ...periodValue,
                                  actualEstimateForecast: next as ActualEstimateForecast | '',
                                }),
                              })
                            }
                            options={ACTUAL_ESTIMATE_FORECAST_OPTIONS}
                          />
                        </FieldGrid>
                        {yoy ? (
                          <ComputedStat label="YoY growth (computed)" value={`${yoy}%`} />
                        ) : null}
                        <SourcePicker
                          id={`pv-${periodValue.id}-source`}
                          label="Source"
                          payload={payload}
                          value={periodValue.sourceId}
                          onChange={(next) =>
                            setSeries(seriesIndex, {
                              ...series,
                              periodValues: replaceAt(series.periodValues, pvIndex, {
                                ...periodValue,
                                sourceId: next,
                              }),
                            })
                          }
                        />
                      </RepeatableCard>
                    );
                  })}
                </RepeatableList>
              </SubSection>

              <SubSection title="Forecast metadata">
                <FieldGrid columns={3}>
                  <TextInputField
                    id={`ms-${series.id}-forecast-start`}
                    label="Forecast start period"
                    value={series.forecastMetadata.forecastStartPeriod}
                    onChange={(next) =>
                      setSeries(seriesIndex, {
                        ...series,
                        forecastMetadata: { ...series.forecastMetadata, forecastStartPeriod: next },
                      })
                    }
                  />
                  <TextInputField
                    id={`ms-${series.id}-forecast-end`}
                    label="Forecast end period"
                    value={series.forecastMetadata.forecastEndPeriod}
                    onChange={(next) =>
                      setSeries(seriesIndex, {
                        ...series,
                        forecastMetadata: { ...series.forecastMetadata, forecastEndPeriod: next },
                      })
                    }
                  />
                  <DecimalInputField
                    id={`ms-${series.id}-forecast-value`}
                    label="Forecast value"
                    value={series.forecastMetadata.forecastValue}
                    onChange={(next) =>
                      setSeries(seriesIndex, {
                        ...series,
                        forecastMetadata: { ...series.forecastMetadata, forecastValue: next },
                      })
                    }
                  />
                  <DecimalInputField
                    id={`ms-${series.id}-reported-cagr`}
                    label="Reported CAGR (%)"
                    value={series.forecastMetadata.reportedCagr}
                    onChange={(next) =>
                      setSeries(seriesIndex, {
                        ...series,
                        forecastMetadata: { ...series.forecastMetadata, reportedCagr: next },
                      })
                    }
                    helper="Persisted reported value — calculated CAGR shown below for reconciliation."
                  />
                  <SelectField
                    id={`ms-${series.id}-scenario`}
                    label="Scenario"
                    value={series.forecastMetadata.scenario}
                    onChange={(next) =>
                      setSeries(seriesIndex, {
                        ...series,
                        forecastMetadata: {
                          ...series.forecastMetadata,
                          scenario: next as '' | 'base' | 'upside' | 'downside' | 'not-specified',
                        },
                      })
                    }
                    options={FORECAST_SCENARIO_OPTIONS}
                  />
                </FieldGrid>
                <StatGrid title="CAGR reconciliation (computed, not persisted)">
                  <ComputedStat
                    label="Calculated CAGR"
                    value={calculatedCagr ? `${calculatedCagr}%` : '—'}
                  />
                  <ComputedStat
                    label="Reported CAGR"
                    value={cagrReconciliation.reported ? `${cagrReconciliation.reported}%` : '—'}
                  />
                  <ComputedStat
                    label="Difference"
                    value={
                      cagrReconciliation.difference
                        ? `${cagrReconciliation.difference} pp`
                        : '—'
                    }
                  />
                  <ComputedStat
                    label="Reconciles"
                    value={cagrReconciliation.reconciles ? 'Yes' : 'No'}
                  />
                </StatGrid>
                <p className="text-xs text-muted-foreground">{cagrReconciliation.message}</p>
                <SourcePicker
                  id={`ms-${series.id}-forecast-source`}
                  label="Forecast source"
                  payload={payload}
                  value={series.forecastMetadata.forecastSourceId}
                  onChange={(next) =>
                    setSeries(seriesIndex, {
                      ...series,
                      forecastMetadata: { ...series.forecastMetadata, forecastSourceId: next },
                    })
                  }
                />
              </SubSection>
            </RepeatableCard>
          );
        })}
      </RepeatableList>

      <RepeatableList
        title="Market segmentations"
        addLabel="Add segment"
        onAdd={() =>
          set('marketSegmentations', [
            ...value.marketSegmentations,
            createEmptyMarketSegmentationRecord(),
          ])
        }
        emptyMessage="No market segmentations recorded."
        count={value.marketSegmentations.length}
      >
        {value.marketSegmentations.map((segment, index) => (
          <RepeatableCard
            key={segment.id}
            title={segment.segmentName || `Segment ${index + 1}`}
            onRemove={() => set('marketSegmentations', removeAt(value.marketSegmentations, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`seg-${segment.id}-parent`}
                label="Parent market series"
                value={segment.parentMarketSeriesId}
                onChange={(next) =>
                  set(
                    'marketSegmentations',
                    replaceAt(value.marketSegmentations, index, {
                      ...segment,
                      parentMarketSeriesId: next,
                    }),
                  )
                }
                options={seriesOptions}
                emptyLabel="Select market series"
              />
              <SelectField
                id={`seg-${segment.id}-dimension`}
                label="Segmentation dimension"
                value={segment.segmentationDimension}
                onChange={(next) =>
                  set(
                    'marketSegmentations',
                    replaceAt(value.marketSegmentations, index, {
                      ...segment,
                      segmentationDimension: next as SegmentationDimension | '',
                    }),
                  )
                }
                options={SEGMENTATION_DIMENSION_OPTIONS}
              />
              <TextInputField
                id={`seg-${segment.id}-name`}
                label="Segment name"
                value={segment.segmentName}
                onChange={(next) =>
                  set(
                    'marketSegmentations',
                    replaceAt(value.marketSegmentations, index, { ...segment, segmentName: next }),
                  )
                }
              />
              <TextInputField
                id={`seg-${segment.id}-period`}
                label="Period"
                value={segment.period}
                onChange={(next) =>
                  set(
                    'marketSegmentations',
                    replaceAt(value.marketSegmentations, index, { ...segment, period: next }),
                  )
                }
              />
              <DecimalInputField
                id={`seg-${segment.id}-size`}
                label="Market size"
                value={segment.marketSize}
                onChange={(next) =>
                  set(
                    'marketSegmentations',
                    replaceAt(value.marketSegmentations, index, { ...segment, marketSize: next }),
                  )
                }
              />
              <DecimalInputField
                id={`seg-${segment.id}-share`}
                label="Market share %"
                value={segment.marketSharePercentage}
                onChange={(next) =>
                  set(
                    'marketSegmentations',
                    replaceAt(value.marketSegmentations, index, {
                      ...segment,
                      marketSharePercentage: next,
                    }),
                  )
                }
              />
            </FieldGrid>
            <SourcePicker
              id={`seg-${segment.id}-source`}
              label="Source"
              payload={payload}
              value={segment.sourceId}
              onChange={(next) =>
                set(
                  'marketSegmentations',
                  replaceAt(value.marketSegmentations, index, { ...segment, sourceId: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      {segmentReconciliations.length > 0 ? (
        <SubSection title="Segment percentage reconciliation (computed)">
          <ul className="space-y-2 text-sm">
            {segmentReconciliations.map((rec) => (
              <li key={`${rec.parentMarketSeriesId}-${rec.period}`} className="rounded-md border border-border p-3">
                <p className="font-medium">
                  Series {rec.parentMarketSeriesId} · {rec.period || 'No period'}
                </p>
                <ComputedStat
                  label="Total segment %"
                  value={rec.totalPercentage ? `${rec.totalPercentage}%` : '—'}
                />
                {rec.flags.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                    {rec.flags.map((flag) => (
                      <li key={flag}>{flag}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </SubSection>
      ) : null}

      <RepeatableList
        title="Segment mappings to issuer"
        addLabel="Add mapping"
        onAdd={() =>
          set('segmentMappings', [...value.segmentMappings, createEmptySegmentMappingRecord()])
        }
        emptyMessage="No segment mappings recorded."
        count={value.segmentMappings.length}
      >
        {value.segmentMappings.map((mapping, index) => (
          <RepeatableCard
            key={mapping.id}
            title={`Mapping ${index + 1}`}
            onRemove={() => set('segmentMappings', removeAt(value.segmentMappings, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`map-${mapping.id}-segment`}
                label="Market segment"
                value={mapping.marketSegmentId}
                onChange={(next) =>
                  set(
                    'segmentMappings',
                    replaceAt(value.segmentMappings, index, {
                      ...mapping,
                      marketSegmentId: next,
                    }),
                  )
                }
                options={segmentOptions}
                emptyLabel="Select segment"
              />
              <TextInputField
                id={`map-${mapping.id}-bo-segment`}
                label="Linked B&O segment ID"
                value={mapping.linkedBusinessOperationsSegmentId}
                onChange={(next) =>
                  set(
                    'segmentMappings',
                    replaceAt(value.segmentMappings, index, {
                      ...mapping,
                      linkedBusinessOperationsSegmentId: next,
                    }),
                  )
                }
              />
              <TextInputField
                id={`map-${mapping.id}-fin-segment`}
                label="Linked financials segment ID"
                value={mapping.linkedFinancialsReportingSegmentId}
                onChange={(next) =>
                  set(
                    'segmentMappings',
                    replaceAt(value.segmentMappings, index, {
                      ...mapping,
                      linkedFinancialsReportingSegmentId: next,
                    }),
                  )
                }
              />
              <TernaryField
                id={`map-${mapping.id}-same-def`}
                label="Same definition as accounting segment"
                value={mapping.sameDefinition}
                onChange={(next) =>
                  set(
                    'segmentMappings',
                    replaceAt(value.segmentMappings, index, { ...mapping, sameDefinition: next }),
                  )
                }
              />
            </FieldGrid>
            <TextAreaField
              id={`map-${mapping.id}-difference`}
              label="Difference explanation"
              value={mapping.differenceExplanation}
              onChange={(next) =>
                set(
                  'segmentMappings',
                  replaceAt(value.segmentMappings, index, {
                    ...mapping,
                    differenceExplanation: next,
                  }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="im-market-size-notes"
        label="Section notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <IndustryMarketSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
