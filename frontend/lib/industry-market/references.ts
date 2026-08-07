/**
 * Cross-payload reference counting for sources, market series and competitors.
 */

import type { IndustryMarketPayload } from '@/lib/schemas/industry-market';

export type ReferenceCountResult = {
  total: number;
  locations: string[];
};

function pushLocation(
  map: Map<string, { total: number; locations: string[] }>,
  id: string,
  location: string,
) {
  if (!id.trim()) return;
  const existing = map.get(id) ?? { total: 0, locations: [] };
  existing.total += 1;
  existing.locations.push(location);
  map.set(id, existing);
}

function resultFrom(
  map: Map<string, { total: number; locations: string[] }>,
  id: string,
): ReferenceCountResult {
  const entry = map.get(id);
  return {
    total: entry?.total ?? 0,
    locations: entry?.locations ?? [],
  };
}

export function countSourceReferences(
  payload: IndustryMarketPayload,
  sourceId: string,
): ReferenceCountResult {
  const map = new Map<string, { total: number; locations: string[] }>();

  for (const indicator of payload.macroeconomicAndIndustryContext.macroeconomicIndicators) {
    if (indicator.sourceId === sourceId) {
      pushLocation(map, sourceId, `Macro indicator — ${indicator.indicatorName || indicator.id}`);
    }
  }

  for (const milestone of payload.macroeconomicAndIndustryContext.industryMilestones) {
    if (milestone.sourceId === sourceId) {
      pushLocation(map, sourceId, `Industry milestone — ${milestone.event || milestone.id}`);
    }
  }

  for (const series of payload.marketSizeSegmentationAndGrowth.marketSeries) {
    if (series.primarySourceId === sourceId) {
      pushLocation(map, sourceId, `Market series — ${series.marketName || series.id}`);
    }
    if (series.forecastMetadata.forecastSourceId === sourceId) {
      pushLocation(map, sourceId, `Market series forecast — ${series.marketName || series.id}`);
    }
    for (const periodValue of series.periodValues) {
      if (periodValue.sourceId === sourceId) {
        pushLocation(
          map,
          sourceId,
          `Market series period — ${series.marketName || series.id} (${periodValue.period || periodValue.id})`,
        );
      }
    }
  }

  for (const segment of payload.marketSizeSegmentationAndGrowth.marketSegmentations) {
    if (segment.sourceId === sourceId) {
      pushLocation(map, sourceId, `Market segment — ${segment.segmentName || segment.id}`);
    }
  }

  for (const driver of payload.demandDriversEndMarketsTrendsAndPolicy.demandDrivers) {
    if (driver.sourceId === sourceId) {
      pushLocation(map, sourceId, `Demand driver — ${driver.title || driver.id}`);
    }
  }

  for (const endMarket of payload.demandDriversEndMarketsTrendsAndPolicy.endMarkets) {
    if (endMarket.sourceId === sourceId) {
      pushLocation(map, sourceId, `End market — ${endMarket.endUserIndustry || endMarket.id}`);
    }
  }

  for (const trend of payload.demandDriversEndMarketsTrendsAndPolicy.industryTrends) {
    if (trend.sourceId === sourceId) {
      pushLocation(map, sourceId, `Industry trend — ${trend.trend || trend.id}`);
    }
  }

  for (const policy of payload.demandDriversEndMarketsTrendsAndPolicy.governmentPolicies) {
    if (policy.sourceId === sourceId) {
      pushLocation(map, sourceId, `Government policy — ${policy.policyScheme || policy.id}`);
    }
  }

  for (const stage of payload.valueChainSupplyStructureAndEntryBarriers.valueChainStages) {
    if (stage.sourceId === sourceId) {
      pushLocation(map, sourceId, `Value chain stage — ${stage.name || stage.id}`);
    }
  }

  for (const factor of payload.valueChainSupplyStructureAndEntryBarriers.supplySideStructure
    .supplyFactors) {
    if (factor.sourceId === sourceId) {
      pushLocation(map, sourceId, `Supply factor — ${factor.factor || factor.id}`);
    }
  }

  for (const capacity of payload.valueChainSupplyStructureAndEntryBarriers.industryCapacityRecords) {
    if (capacity.sourceId === sourceId) {
      pushLocation(map, sourceId, `Industry capacity — ${capacity.period || capacity.id}`);
    }
  }

  for (const barrier of payload.valueChainSupplyStructureAndEntryBarriers.entryBarriers) {
    if (barrier.sourceId === sourceId) {
      pushLocation(map, sourceId, `Entry barrier — ${barrier.barrierType || barrier.id}`);
    }
  }

  for (const competitor of payload.competitionMarketShareAndIssuerPositioning.competitors) {
    if (competitor.sourceId === sourceId) {
      pushLocation(map, sourceId, `Competitor — ${competitor.companyName || competitor.id}`);
    }
  }

  for (const metric of payload.competitionMarketShareAndIssuerPositioning.competitiveMetrics) {
    if (metric.sourceId === sourceId) {
      pushLocation(map, sourceId, `Competitive metric — ${metric.metricType || metric.id}`);
    }
  }

  for (const dimension of payload.competitionMarketShareAndIssuerPositioning.competitiveDimensions) {
    if (dimension.sourceId === sourceId) {
      pushLocation(map, sourceId, `Competitive dimension — ${dimension.dimension || dimension.id}`);
    }
  }

  for (const share of payload.competitionMarketShareAndIssuerPositioning.marketShareRecords) {
    if (share.denominatorSourceId === sourceId) {
      pushLocation(map, sourceId, `Market share denominator — ${share.marketDefinition || share.id}`);
    }
  }

  for (const claim of payload.competitionMarketShareAndIssuerPositioning.claims) {
    if (claim.sourceId === sourceId) {
      pushLocation(map, sourceId, `Claim — ${claim.exactProposedWording || claim.id}`);
    }
  }

  for (const outlook of payload.outlookIndustryRisksAndConfirmations.outlookRecords) {
    if (outlook.sourceId === sourceId) {
      pushLocation(map, sourceId, `Outlook — ${outlook.market || outlook.id}`);
    }
  }

  for (const risk of payload.outlookIndustryRisksAndConfirmations.industryRisks) {
    if (risk.sourceId === sourceId) {
      pushLocation(map, sourceId, `Industry risk — ${risk.title || risk.id}`);
    }
  }

  for (const conflict of payload.outlookIndustryRisksAndConfirmations.conflictingResearch) {
    if (conflict.sourceAId === sourceId) {
      pushLocation(map, sourceId, `Conflicting research (A) — ${conflict.topic || conflict.id}`);
    }
    if (conflict.sourceBId === sourceId) {
      pushLocation(map, sourceId, `Conflicting research (B) — ${conflict.topic || conflict.id}`);
    }
    if (conflict.preferredSourceId === sourceId) {
      pushLocation(map, sourceId, `Preferred source — ${conflict.topic || conflict.id}`);
    }
  }

  return resultFrom(map, sourceId);
}

export function countMarketSeriesReferences(
  payload: IndustryMarketPayload,
  seriesId: string,
): ReferenceCountResult {
  const map = new Map<string, { total: number; locations: string[] }>();

  for (const segment of payload.marketSizeSegmentationAndGrowth.marketSegmentations) {
    if (segment.parentMarketSeriesId === seriesId) {
      pushLocation(map, seriesId, `Market segment — ${segment.segmentName || segment.id}`);
    }
  }

  for (const mapping of payload.marketSizeSegmentationAndGrowth.segmentMappings) {
    const linkedSegment = payload.marketSizeSegmentationAndGrowth.marketSegmentations.find(
      (segment) => segment.id === mapping.marketSegmentId,
    );
    if (linkedSegment?.parentMarketSeriesId === seriesId) {
      pushLocation(map, seriesId, `Segment mapping — ${mapping.id}`);
    }
  }

  return resultFrom(map, seriesId);
}

export function countCompetitorReferences(
  payload: IndustryMarketPayload,
  competitorId: string,
): ReferenceCountResult {
  const map = new Map<string, { total: number; locations: string[] }>();

  for (const metric of payload.competitionMarketShareAndIssuerPositioning.competitiveMetrics) {
    if (metric.competitorId === competitorId) {
      pushLocation(map, competitorId, `Competitive metric — ${metric.metricType || metric.id}`);
    }
  }

  for (const dimension of payload.competitionMarketShareAndIssuerPositioning.competitiveDimensions) {
    if (dimension.competitorId === competitorId) {
      pushLocation(map, competitorId, `Competitive dimension — ${dimension.dimension || dimension.id}`);
    }
  }

  return resultFrom(map, competitorId);
}
