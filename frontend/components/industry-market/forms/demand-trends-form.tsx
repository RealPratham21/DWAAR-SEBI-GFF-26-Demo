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
  createEmptyDemandDriverRecord,
  createEmptyEndMarketRecord,
  createEmptyGovernmentPolicyRecord,
  createEmptyIndustryTrendRecord,
} from '@/lib/industry-market/defaults';
import {
  ACTUAL_ESTIMATE_FORECAST_OPTIONS,
  CYCLICAL_DEFENSIVE_OPTIONS,
  DEMAND_DRIVER_CATEGORY_OPTIONS,
  POLICY_NATURE_OPTIONS,
  TREND_TIMELINE_STATUS_OPTIONS,
} from '@/lib/industry-market/options';
import type {
  ActualEstimateForecast,
  CyclicalDefensive,
  DemandDriverCategory,
  DemandDriversEndMarketsTrendsAndPolicy,
  PolicyNature,
  TrendTimelineStatus,
} from '@/lib/schemas/industry-market';

const SECTION_ID = 'demand-drivers-end-markets-trends-and-policy' as const;

export function DemandTrendsForm() {
  const { payload, updateSection } = useIndustryMarket();
  const value = payload.demandDriversEndMarketsTrendsAndPolicy;

  const set = <K extends keyof DemandDriversEndMarketsTrendsAndPolicy>(
    key: K,
    next: DemandDriversEndMarketsTrendsAndPolicy[K],
  ) => {
    updateSection('demandDriversEndMarketsTrendsAndPolicy', { ...value, [key]: next }, SECTION_ID);
  };

  return (
    <SectionCard
      title="Demand Drivers, End Markets, Trends & Policy"
      description="Demand drivers, end-user markets, industry trends and government policy/scheme register."
    >
      <RepeatableList
        title="Demand drivers"
        addLabel="Add demand driver"
        onAdd={() => set('demandDrivers', [...value.demandDrivers, createEmptyDemandDriverRecord()])}
        emptyMessage="No demand drivers recorded."
        count={value.demandDrivers.length}
      >
        {value.demandDrivers.map((driver, index) => (
          <RepeatableCard
            key={driver.id}
            title={driver.title || `Demand driver ${index + 1}`}
            onRemove={() => set('demandDrivers', removeAt(value.demandDrivers, index))}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`dd-${driver.id}-title`}
                label="Title"
                value={driver.title}
                onChange={(next) =>
                  set('demandDrivers', replaceAt(value.demandDrivers, index, { ...driver, title: next }))
                }
              />
              <SelectField
                id={`dd-${driver.id}-category`}
                label="Category"
                value={driver.category}
                onChange={(next) =>
                  set(
                    'demandDrivers',
                    replaceAt(value.demandDrivers, index, {
                      ...driver,
                      category: next as DemandDriverCategory | '',
                    }),
                  )
                }
                options={DEMAND_DRIVER_CATEGORY_OPTIONS}
              />
              <DecimalInputField
                id={`dd-${driver.id}-impact`}
                label="Quantified impact"
                value={driver.quantifiedImpact}
                onChange={(next) =>
                  set(
                    'demandDrivers',
                    replaceAt(value.demandDrivers, index, { ...driver, quantifiedImpact: next }),
                  )
                }
              />
              <SelectField
                id={`dd-${driver.id}-aef`}
                label="Actual / estimate / forecast"
                value={driver.actualEstimateForecast}
                onChange={(next) =>
                  set(
                    'demandDrivers',
                    replaceAt(value.demandDrivers, index, {
                      ...driver,
                      actualEstimateForecast: next as ActualEstimateForecast | '',
                    }),
                  )
                }
                options={ACTUAL_ESTIMATE_FORECAST_OPTIONS}
              />
            </FieldGrid>
            {driver.actualEstimateForecast ? (
              <ActualEstimateForecastBadge value={driver.actualEstimateForecast} />
            ) : null}
            <FieldGrid>
              <TextAreaField
                id={`dd-${driver.id}-description`}
                label="Description"
                value={driver.description}
                onChange={(next) =>
                  set(
                    'demandDrivers',
                    replaceAt(value.demandDrivers, index, { ...driver, description: next }),
                  )
                }
              />
              <TextAreaField
                id={`dd-${driver.id}-mechanism`}
                label="Mechanism affecting demand"
                value={driver.mechanismAffectingDemand}
                onChange={(next) =>
                  set(
                    'demandDrivers',
                    replaceAt(value.demandDrivers, index, {
                      ...driver,
                      mechanismAffectingDemand: next,
                    }),
                  )
                }
              />
            </FieldGrid>
            <SourcePicker
              id={`dd-${driver.id}-source`}
              label="Source"
              payload={payload}
              value={driver.sourceId}
              onChange={(next) =>
                set(
                  'demandDrivers',
                  replaceAt(value.demandDrivers, index, { ...driver, sourceId: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="End markets"
        addLabel="Add end market"
        onAdd={() => set('endMarkets', [...value.endMarkets, createEmptyEndMarketRecord()])}
        emptyMessage="No end markets recorded."
        count={value.endMarkets.length}
      >
        {value.endMarkets.map((endMarket, index) => (
          <RepeatableCard
            key={endMarket.id}
            title={endMarket.endUserIndustry || `End market ${index + 1}`}
            onRemove={() => set('endMarkets', removeAt(value.endMarkets, index))}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`em-${endMarket.id}-industry`}
                label="End-user industry"
                value={endMarket.endUserIndustry}
                onChange={(next) =>
                  set(
                    'endMarkets',
                    replaceAt(value.endMarkets, index, { ...endMarket, endUserIndustry: next }),
                  )
                }
              />
              <TextInputField
                id={`em-${endMarket.id}-geography`}
                label="Geography"
                value={endMarket.geography}
                onChange={(next) =>
                  set(
                    'endMarkets',
                    replaceAt(value.endMarkets, index, { ...endMarket, geography: next }),
                  )
                }
              />
              <DecimalInputField
                id={`em-${endMarket.id}-size`}
                label="Current size"
                value={endMarket.currentSize}
                onChange={(next) =>
                  set(
                    'endMarkets',
                    replaceAt(value.endMarkets, index, { ...endMarket, currentSize: next }),
                  )
                }
              />
              <DecimalInputField
                id={`em-${endMarket.id}-growth`}
                label="Growth"
                value={endMarket.growth}
                onChange={(next) =>
                  set(
                    'endMarkets',
                    replaceAt(value.endMarkets, index, { ...endMarket, growth: next }),
                  )
                }
              />
              <SelectField
                id={`em-${endMarket.id}-cyclical`}
                label="Cyclical / defensive"
                value={endMarket.cyclicalDefensive}
                onChange={(next) =>
                  set(
                    'endMarkets',
                    replaceAt(value.endMarkets, index, {
                      ...endMarket,
                      cyclicalDefensive: next as CyclicalDefensive | '',
                    }),
                  )
                }
                options={CYCLICAL_DEFENSIVE_OPTIONS}
              />
            </FieldGrid>
            <SourcePicker
              id={`em-${endMarket.id}-source`}
              label="Source"
              payload={payload}
              value={endMarket.sourceId}
              onChange={(next) =>
                set(
                  'endMarkets',
                  replaceAt(value.endMarkets, index, { ...endMarket, sourceId: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Industry trends"
        addLabel="Add trend"
        onAdd={() =>
          set('industryTrends', [...value.industryTrends, createEmptyIndustryTrendRecord()])
        }
        emptyMessage="No industry trends recorded."
        count={value.industryTrends.length}
      >
        {value.industryTrends.map((trend, index) => (
          <RepeatableCard
            key={trend.id}
            title={trend.trend || `Trend ${index + 1}`}
            onRemove={() => set('industryTrends', removeAt(value.industryTrends, index))}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`tr-${trend.id}-trend`}
                label="Trend"
                value={trend.trend}
                onChange={(next) =>
                  set(
                    'industryTrends',
                    replaceAt(value.industryTrends, index, { ...trend, trend: next }),
                  )
                }
              />
              <SelectField
                id={`tr-${trend.id}-timeline`}
                label="Timeline status"
                value={trend.timelineStatus}
                onChange={(next) =>
                  set(
                    'industryTrends',
                    replaceAt(value.industryTrends, index, {
                      ...trend,
                      timelineStatus: next as TrendTimelineStatus | '',
                    }),
                  )
                }
                options={TREND_TIMELINE_STATUS_OPTIONS}
              />
              <DecimalInputField
                id={`tr-${trend.id}-quant`}
                label="Quantification"
                value={trend.quantification}
                onChange={(next) =>
                  set(
                    'industryTrends',
                    replaceAt(value.industryTrends, index, { ...trend, quantification: next }),
                  )
                }
              />
            </FieldGrid>
            <FieldGrid>
              <TextAreaField
                id={`tr-${trend.id}-impact`}
                label="Industry impact"
                value={trend.industryImpact}
                onChange={(next) =>
                  set(
                    'industryTrends',
                    replaceAt(value.industryTrends, index, { ...trend, industryImpact: next }),
                  )
                }
              />
              <TextAreaField
                id={`tr-${trend.id}-issuer-impact`}
                label="Issuer segment impact"
                value={trend.issuerSegmentImpact}
                onChange={(next) =>
                  set(
                    'industryTrends',
                    replaceAt(value.industryTrends, index, { ...trend, issuerSegmentImpact: next }),
                  )
                }
              />
            </FieldGrid>
            <SourcePicker
              id={`tr-${trend.id}-source`}
              label="Source"
              payload={payload}
              value={trend.sourceId}
              onChange={(next) =>
                set(
                  'industryTrends',
                  replaceAt(value.industryTrends, index, { ...trend, sourceId: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Government policies & schemes"
        addLabel="Add policy"
        onAdd={() =>
          set('governmentPolicies', [...value.governmentPolicies, createEmptyGovernmentPolicyRecord()])
        }
        emptyMessage="No government policies recorded."
        count={value.governmentPolicies.length}
      >
        {value.governmentPolicies.map((policy, index) => (
          <RepeatableCard
            key={policy.id}
            title={policy.policyScheme || `Policy ${index + 1}`}
            onRemove={() => set('governmentPolicies', removeAt(value.governmentPolicies, index))}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`gp-${policy.id}-scheme`}
                label="Policy / scheme"
                value={policy.policyScheme}
                onChange={(next) =>
                  set(
                    'governmentPolicies',
                    replaceAt(value.governmentPolicies, index, { ...policy, policyScheme: next }),
                  )
                }
              />
              <TextInputField
                id={`gp-${policy.id}-regulator`}
                label="Government / regulator"
                value={policy.governmentRegulator}
                onChange={(next) =>
                  set(
                    'governmentPolicies',
                    replaceAt(value.governmentPolicies, index, {
                      ...policy,
                      governmentRegulator: next,
                    }),
                  )
                }
              />
              <SelectField
                id={`gp-${policy.id}-nature`}
                label="Nature"
                value={policy.nature}
                onChange={(next) =>
                  set(
                    'governmentPolicies',
                    replaceAt(value.governmentPolicies, index, {
                      ...policy,
                      nature: next as PolicyNature | '',
                    }),
                  )
                }
                options={POLICY_NATURE_OPTIONS}
              />
              <TextInputField
                id={`gp-${policy.id}-effective`}
                label="Effective date"
                value={policy.effectiveDate}
                onChange={(next) =>
                  set(
                    'governmentPolicies',
                    replaceAt(value.governmentPolicies, index, { ...policy, effectiveDate: next }),
                  )
                }
              />
              <TextInputField
                id={`gp-${policy.id}-status`}
                label="Current status"
                value={policy.currentStatus}
                onChange={(next) =>
                  set(
                    'governmentPolicies',
                    replaceAt(value.governmentPolicies, index, { ...policy, currentStatus: next }),
                  )
                }
              />
            </FieldGrid>
            <TextAreaField
              id={`gp-${policy.id}-impact`}
              label="Market impact"
              value={policy.marketImpact}
              onChange={(next) =>
                set(
                  'governmentPolicies',
                  replaceAt(value.governmentPolicies, index, { ...policy, marketImpact: next }),
                )
              }
            />
            <SourcePicker
              id={`gp-${policy.id}-source`}
              label="Source"
              payload={payload}
              value={policy.sourceId}
              onChange={(next) =>
                set(
                  'governmentPolicies',
                  replaceAt(value.governmentPolicies, index, { ...policy, sourceId: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="im-demand-notes"
        label="Section notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <IndustryMarketSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
