'use client';

import {
  ClaimStatusBadge,
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
import { deriveClaimStatus, detectUnsupportedClaimWording } from '@/lib/industry-market/claims';
import { useIndustryMarket } from '@/lib/industry-market/context';
import {
  createEmptyClaimRecord,
  createEmptyCompetitiveDimensionRecord,
  createEmptyCompetitiveMetricRecord,
  createEmptyCompetitorRecord,
  createEmptyMarketShareRecord,
} from '@/lib/industry-market/defaults';
import { validateMarketShareRecord } from '@/lib/industry-market/market-share';
import {
  CLAIM_STATUS_OPTIONS,
  CLAIM_TYPE_OPTIONS,
  COMPETITOR_METRIC_TYPE_OPTIONS,
  MARKET_SHARE_METRIC_BASIS_OPTIONS,
  NUMERATOR_SOURCE_OPTIONS,
} from '@/lib/industry-market/options';
import { countCompetitorReferences } from '@/lib/industry-market/references';
import type {
  ClaimType,
  CompetitionMarketShareAndIssuerPositioning,
  CompetitorMetricType,
  MarketShareMetricBasis,
  NumeratorSource,
} from '@/lib/schemas/industry-market';

const SECTION_ID = 'competition-market-share-and-issuer-positioning' as const;

export function CompetitionForm() {
  const { payload, updateSection } = useIndustryMarket();
  const value = payload.competitionMarketShareAndIssuerPositioning;

  const set = <K extends keyof CompetitionMarketShareAndIssuerPositioning>(
    key: K,
    next: CompetitionMarketShareAndIssuerPositioning[K],
  ) => {
    updateSection('competitionMarketShareAndIssuerPositioning', { ...value, [key]: next }, SECTION_ID);
  };

  const competitorOptions = value.competitors.map((competitor) => ({
    value: competitor.id,
    label: competitor.companyName || competitor.id,
  }));

  const removeCompetitor = (index: number) => {
    const competitor = value.competitors[index];
    const refs = countCompetitorReferences(payload, competitor.id);
    if (refs.total > 0) {
      window.alert(
        `This competitor is referenced in ${refs.total} place(s):\n${refs.locations.join('\n')}`,
      );
      return;
    }
    if (
      hasRecordData([competitor.companyName]) &&
      !window.confirm('Remove this competitor? Entered values will be lost.')
    ) {
      return;
    }
    set('competitors', removeAt(value.competitors, index));
  };

  return (
    <SectionCard
      title="Competition, Market Share & Issuer Positioning"
      description="Competitor master, operating metrics, market-share calculations and claims register."
    >
      <RepeatableList
        title="Competitors"
        addLabel="Add competitor"
        onAdd={() => set('competitors', [...value.competitors, createEmptyCompetitorRecord()])}
        emptyMessage="No competitors recorded."
        count={value.competitors.length}
      >
        {value.competitors.map((competitor, index) => (
          <RepeatableCard
            key={competitor.id}
            title={competitor.companyName || `Competitor ${index + 1}`}
            onRemove={() => removeCompetitor(index)}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`comp-${competitor.id}-name`}
                label="Company name"
                value={competitor.companyName}
                onChange={(next) =>
                  set(
                    'competitors',
                    replaceAt(value.competitors, index, { ...competitor, companyName: next }),
                  )
                }
              />
              <TextInputField
                id={`comp-${competitor.id}-country`}
                label="Country"
                value={competitor.country}
                onChange={(next) =>
                  set(
                    'competitors',
                    replaceAt(value.competitors, index, { ...competitor, country: next }),
                  )
                }
              />
              <TextInputField
                id={`comp-${competitor.id}-products`}
                label="Relevant products / services"
                value={competitor.relevantProductsServices}
                onChange={(next) =>
                  set(
                    'competitors',
                    replaceAt(value.competitors, index, {
                      ...competitor,
                      relevantProductsServices: next,
                    }),
                  )
                }
              />
            </FieldGrid>
            <SourcePicker
              id={`comp-${competitor.id}-source`}
              label="Source"
              payload={payload}
              value={competitor.sourceId}
              onChange={(next) =>
                set(
                  'competitors',
                  replaceAt(value.competitors, index, { ...competitor, sourceId: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Competitive metrics"
        addLabel="Add metric"
        onAdd={() =>
          set('competitiveMetrics', [...value.competitiveMetrics, createEmptyCompetitiveMetricRecord()])
        }
        emptyMessage="No competitive metrics recorded."
        count={value.competitiveMetrics.length}
      >
        {value.competitiveMetrics.map((metric, index) => (
          <RepeatableCard
            key={metric.id}
            title={metric.metricType || `Metric ${index + 1}`}
            onRemove={() => set('competitiveMetrics', removeAt(value.competitiveMetrics, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`cm-${metric.id}-competitor`}
                label="Competitor"
                value={metric.competitorId}
                onChange={(next) =>
                  set(
                    'competitiveMetrics',
                    replaceAt(value.competitiveMetrics, index, { ...metric, competitorId: next }),
                  )
                }
                options={competitorOptions}
                emptyLabel="Select competitor"
              />
              <SelectField
                id={`cm-${metric.id}-type`}
                label="Metric type"
                value={metric.metricType}
                onChange={(next) =>
                  set(
                    'competitiveMetrics',
                    replaceAt(value.competitiveMetrics, index, {
                      ...metric,
                      metricType: next as CompetitorMetricType | '',
                    }),
                  )
                }
                options={COMPETITOR_METRIC_TYPE_OPTIONS}
              />
              <DecimalInputField
                id={`cm-${metric.id}-value`}
                label="Value"
                value={metric.value}
                onChange={(next) =>
                  set(
                    'competitiveMetrics',
                    replaceAt(value.competitiveMetrics, index, { ...metric, value: next }),
                  )
                }
              />
            </FieldGrid>
            <SourcePicker
              id={`cm-${metric.id}-source`}
              label="Source"
              payload={payload}
              value={metric.sourceId}
              onChange={(next) =>
                set(
                  'competitiveMetrics',
                  replaceAt(value.competitiveMetrics, index, { ...metric, sourceId: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Competitive dimensions"
        addLabel="Add dimension"
        onAdd={() =>
          set('competitiveDimensions', [
            ...value.competitiveDimensions,
            createEmptyCompetitiveDimensionRecord(),
          ])
        }
        emptyMessage="No competitive dimensions recorded."
        count={value.competitiveDimensions.length}
      >
        {value.competitiveDimensions.map((dimension, index) => (
          <RepeatableCard
            key={dimension.id}
            title={dimension.dimension || `Dimension ${index + 1}`}
            onRemove={() =>
              set('competitiveDimensions', removeAt(value.competitiveDimensions, index))
            }
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`cd-${dimension.id}-competitor`}
                label="Competitor"
                value={dimension.competitorId}
                onChange={(next) =>
                  set(
                    'competitiveDimensions',
                    replaceAt(value.competitiveDimensions, index, {
                      ...dimension,
                      competitorId: next,
                    }),
                  )
                }
                options={competitorOptions}
                emptyLabel="Select competitor"
              />
              <TextInputField
                id={`cd-${dimension.id}-dimension`}
                label="Dimension"
                value={dimension.dimension}
                onChange={(next) =>
                  set(
                    'competitiveDimensions',
                    replaceAt(value.competitiveDimensions, index, {
                      ...dimension,
                      dimension: next,
                    }),
                  )
                }
              />
            </FieldGrid>
            <FieldGrid>
              <TextInputField
                id={`cd-${dimension.id}-issuer`}
                label="Issuer position"
                value={dimension.issuerPosition}
                onChange={(next) =>
                  set(
                    'competitiveDimensions',
                    replaceAt(value.competitiveDimensions, index, {
                      ...dimension,
                      issuerPosition: next,
                    }),
                  )
                }
              />
              <TextInputField
                id={`cd-${dimension.id}-competitor-pos`}
                label="Competitor position"
                value={dimension.competitorPosition}
                onChange={(next) =>
                  set(
                    'competitiveDimensions',
                    replaceAt(value.competitiveDimensions, index, {
                      ...dimension,
                      competitorPosition: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Market share records"
        addLabel="Add market share record"
        onAdd={() =>
          set('marketShareRecords', [...value.marketShareRecords, createEmptyMarketShareRecord()])
        }
        emptyMessage="No market share records."
        count={value.marketShareRecords.length}
      >
        {value.marketShareRecords.map((record, index) => {
          const validation = validateMarketShareRecord(record, payload);
          return (
            <RepeatableCard
              key={record.id}
              title={record.marketDefinition || `Market share ${index + 1}`}
              onRemove={() => set('marketShareRecords', removeAt(value.marketShareRecords, index))}
            >
              <FieldGrid columns={3}>
                <SelectField
                  id={`msr-${record.id}-basis`}
                  label="Metric basis"
                  value={record.metricBasis}
                  onChange={(next) =>
                    set(
                      'marketShareRecords',
                      replaceAt(value.marketShareRecords, index, {
                        ...record,
                        metricBasis: next as MarketShareMetricBasis | '',
                      }),
                    )
                  }
                  options={MARKET_SHARE_METRIC_BASIS_OPTIONS}
                />
                <TextInputField
                  id={`msr-${record.id}-definition`}
                  label="Market definition"
                  value={record.marketDefinition}
                  onChange={(next) =>
                    set(
                      'marketShareRecords',
                      replaceAt(value.marketShareRecords, index, {
                        ...record,
                        marketDefinition: next,
                      }),
                    )
                  }
                />
                <TextInputField
                  id={`msr-${record.id}-period`}
                  label="Period"
                  value={record.period}
                  onChange={(next) =>
                    set(
                      'marketShareRecords',
                      replaceAt(value.marketShareRecords, index, { ...record, period: next }),
                    )
                  }
                />
                <DecimalInputField
                  id={`msr-${record.id}-numerator`}
                  label="Issuer numerator"
                  value={record.issuerNumerator}
                  onChange={(next) =>
                    set(
                      'marketShareRecords',
                      replaceAt(value.marketShareRecords, index, {
                        ...record,
                        issuerNumerator: next,
                      }),
                    )
                  }
                />
                <SelectField
                  id={`msr-${record.id}-numerator-source`}
                  label="Numerator source"
                  value={record.numeratorSource}
                  onChange={(next) =>
                    set(
                      'marketShareRecords',
                      replaceAt(value.marketShareRecords, index, {
                        ...record,
                        numeratorSource: next as NumeratorSource | '',
                      }),
                    )
                  }
                  options={NUMERATOR_SOURCE_OPTIONS}
                />
                <DecimalInputField
                  id={`msr-${record.id}-denominator`}
                  label="Total market denominator"
                  value={record.totalMarketDenominator}
                  onChange={(next) =>
                    set(
                      'marketShareRecords',
                      replaceAt(value.marketShareRecords, index, {
                        ...record,
                        totalMarketDenominator: next,
                      }),
                    )
                  }
                />
                <DecimalInputField
                  id={`msr-${record.id}-reported`}
                  label="Reported market share (%)"
                  value={record.reportedMarketShare}
                  onChange={(next) =>
                    set(
                      'marketShareRecords',
                      replaceAt(value.marketShareRecords, index, {
                        ...record,
                        reportedMarketShare: next,
                      }),
                    )
                  }
                />
              </FieldGrid>
              <SourcePicker
                id={`msr-${record.id}-denom-source`}
                label="Denominator source"
                payload={payload}
                value={record.denominatorSourceId}
                onChange={(next) =>
                  set(
                    'marketShareRecords',
                    replaceAt(value.marketShareRecords, index, {
                      ...record,
                      denominatorSourceId: next,
                    }),
                  )
                }
              />
              <StatGrid title="Market share (computed, not persisted)">
                <ComputedStat
                  label="Calculated share"
                  value={
                    validation.calculatedMarketShare
                      ? `${validation.calculatedMarketShare}%`
                      : '—'
                  }
                />
                <ComputedStat
                  label="Reported share"
                  value={record.reportedMarketShare ? `${record.reportedMarketShare}%` : '—'}
                />
              </StatGrid>
              {validation.flags.length > 0 ? (
                <ul className="list-disc pl-5 text-xs text-muted-foreground">
                  {validation.flags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              ) : null}
            </RepeatableCard>
          );
        })}
      </RepeatableList>

      <RepeatableList
        title="Claims register"
        description="Derived claim status is computed from wording, sources and substantiation — not persisted."
        addLabel="Add claim"
        onAdd={() => set('claims', [...value.claims, createEmptyClaimRecord()])}
        emptyMessage="No claims recorded."
        count={value.claims.length}
      >
        {value.claims.map((claim, index) => {
          const derivedStatus = deriveClaimStatus(claim, payload);
          const wordingFlags = detectUnsupportedClaimWording(claim.exactProposedWording);
          return (
            <RepeatableCard
              key={claim.id}
              title={claim.exactProposedWording || `Claim ${index + 1}`}
              onRemove={() => set('claims', removeAt(value.claims, index))}
            >
              <FieldGrid columns={3}>
                <SelectField
                  id={`cl-${claim.id}-type`}
                  label="Claim type"
                  value={claim.claimType}
                  onChange={(next) =>
                    set(
                      'claims',
                      replaceAt(value.claims, index, {
                        ...claim,
                        claimType: next as ClaimType | '',
                      }),
                    )
                  }
                  options={CLAIM_TYPE_OPTIONS}
                />
                <TextInputField
                  id={`cl-${claim.id}-metric`}
                  label="Metric"
                  value={claim.metric}
                  onChange={(next) =>
                    set('claims', replaceAt(value.claims, index, { ...claim, metric: next }))
                  }
                />
                <TextInputField
                  id={`cl-${claim.id}-period`}
                  label="Period / date"
                  value={claim.periodDate}
                  onChange={(next) =>
                    set('claims', replaceAt(value.claims, index, { ...claim, periodDate: next }))
                  }
                />
              </FieldGrid>
              <TextAreaField
                id={`cl-${claim.id}-wording`}
                label="Exact proposed wording"
                value={claim.exactProposedWording}
                onChange={(next) =>
                  set(
                    'claims',
                    replaceAt(value.claims, index, { ...claim, exactProposedWording: next }),
                  )
                }
              />
              {wordingFlags.length > 0 ? (
                <p className="text-xs text-amber-700 dark:text-amber-200">
                  Detected wording requiring substantiation: {wordingFlags.join(', ')}
                </p>
              ) : null}
              <SourcePicker
                id={`cl-${claim.id}-source`}
                label="Source"
                payload={payload}
                value={claim.sourceId}
                onChange={(next) =>
                  set('claims', replaceAt(value.claims, index, { ...claim, sourceId: next }))
                }
              />
              <SubSection title="Derived review status (computed)">
                <ClaimStatusBadge status={derivedStatus} />
                <SelectField
                  id={`cl-${claim.id}-review`}
                  label="Manual review status override"
                  value={claim.reviewStatus}
                  onChange={(next) =>
                    set(
                      'claims',
                      replaceAt(value.claims, index, {
                        ...claim,
                        reviewStatus: next as typeof claim.reviewStatus,
                      }),
                    )
                  }
                  options={CLAIM_STATUS_OPTIONS}
                  helper="Persisted review status for issuer workflow; derived status above reflects current evidence."
                />
              </SubSection>
              <FieldGrid columns={3}>
                <TernaryField
                  id={`cl-${claim.id}-independent`}
                  label="Independent source"
                  value={claim.independentSource}
                  onChange={(next) =>
                    set(
                      'claims',
                      replaceAt(value.claims, index, { ...claim, independentSource: next }),
                    )
                  }
                />
                <TernaryField
                  id={`cl-${claim.id}-conflicting`}
                  label="Conflicting source exists"
                  value={claim.conflictingSourceExists}
                  onChange={(next) =>
                    set(
                      'claims',
                      replaceAt(value.claims, index, { ...claim, conflictingSourceExists: next }),
                    )
                  }
                />
              </FieldGrid>
            </RepeatableCard>
          );
        })}
      </RepeatableList>

      <TextAreaField
        id="im-competition-notes"
        label="Section notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <IndustryMarketSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
