/**
 * Deterministic Industry Assessment for Industry & Market (IM1, frontend-only).
 *
 * Evidence/readiness-focused: never returns attractive/unattractive industry or investment-quality scores.
 */

import { deriveClaimStatus, detectUnsupportedClaimWording } from '@/lib/industry-market/claims';
import {
  computeIndustryMarketModel,
  type IndustryMarketModel,
} from '@/lib/industry-market/compute';
import { isFilledDecimal } from '@/lib/industry-market/decimal';
import {
  calculateCagr,
  reconcileReportedVsCalculatedCagr,
  reconcileSegmentPercentages,
} from '@/lib/industry-market/market-series';
import { validateMarketShareRecord } from '@/lib/industry-market/market-share';
import { INDUSTRY_MARKET_CONFIRMATION_FIELDS } from '@/lib/industry-market/options';
import { calculateIndustryMarketProgress } from '@/lib/industry-market/progress';
import { getSources } from '@/lib/industry-market/sources';
import {
  createEmptyLinkedWorkstreamReferences,
  type IndustryMarketProgress,
  type LinkedWorkstreamReferences,
} from '@/lib/industry-market/types';
import type { IndustryMarketPayload } from '@/lib/schemas/industry-market';

export const INDUSTRY_CRITERION_STATES = [
  'substantiated',
  'potential_inconsistency',
  'missing_information',
  'missing_source',
  'stale_source',
  'methodology_concern',
  'conflicting_sources',
  'pending_industry_report',
  'pending_linked_workstream',
  'pending_professional_confirmation',
  'not_applicable',
] as const;

export type IndustryCriterionState = (typeof INDUSTRY_CRITERION_STATES)[number];

export const INDUSTRY_ASSESSMENT_GROUPS = [
  'scope_and_relevance',
  'source_readiness',
  'market_sizing_and_segmentation',
  'cross_workstream_consistency',
  'demand_trend_substantiation',
  'value_chain_and_supply_structure',
  'competitive_landscape',
  'market_share_integrity',
  'claim_substantiation',
  'outlook_and_conflicting_research',
] as const;

export type IndustryAssessmentGroup = (typeof INDUSTRY_ASSESSMENT_GROUPS)[number];

export const INDUSTRY_CRITERION_STATE_LABELS: Record<IndustryCriterionState, string> = {
  substantiated: 'Substantiated',
  potential_inconsistency: 'Potential inconsistency',
  missing_information: 'Missing information',
  missing_source: 'Missing source',
  stale_source: 'Stale source',
  methodology_concern: 'Methodology concern',
  conflicting_sources: 'Conflicting sources',
  pending_industry_report: 'Pending industry report',
  pending_linked_workstream: 'Pending linked workstream',
  pending_professional_confirmation: 'Pending professional confirmation',
  not_applicable: 'Not applicable',
};

export const INDUSTRY_ASSESSMENT_GROUP_LABELS: Record<IndustryAssessmentGroup, string> = {
  scope_and_relevance: 'Scope and relevance',
  source_readiness: 'Source readiness',
  market_sizing_and_segmentation: 'Market sizing and segmentation',
  cross_workstream_consistency: 'Cross-workstream consistency',
  demand_trend_substantiation: 'Demand and trend substantiation',
  value_chain_and_supply_structure: 'Value chain and supply structure',
  competitive_landscape: 'Competitive landscape',
  market_share_integrity: 'Market-share integrity',
  claim_substantiation: 'Claim substantiation',
  outlook_and_conflicting_research: 'Outlook and conflicting research',
};

export const INDUSTRY_ASSESSMENT_RESULT_STATES = [
  'insufficient_information',
  'readiness_in_progress',
  'inconsistencies_identified',
  'source_gaps_identified',
  'professional_confirmation_required',
  'pending_linked_workstream',
] as const;

export type IndustryAssessmentResultState = (typeof INDUSTRY_ASSESSMENT_RESULT_STATES)[number];

export type IndustryAssessmentCriterion = {
  id: string;
  group: IndustryAssessmentGroup;
  label: string;
  state: IndustryCriterionState;
  reason: string;
};

export type IndustryAssessmentGroupResult = {
  group: IndustryAssessmentGroup;
  label: string;
  headlineState: IndustryCriterionState;
  criteria: IndustryAssessmentCriterion[];
};

export type IndustryAssessmentResponse = {
  result: IndustryAssessmentResultState;
  resultLabel: string;
  summary: string;
  criteria: IndustryAssessmentCriterion[];
  groups: IndustryAssessmentGroupResult[];
  counts: Record<
    | 'substantiated'
    | 'potentialInconsistency'
    | 'missingInformation'
    | 'missingSource'
    | 'staleSource'
    | 'methodologyConcern'
    | 'conflictingSources'
    | 'pendingIndustryReport'
    | 'pendingLinkedWorkstream'
    | 'pendingProfessionalConfirmation'
    | 'notApplicable',
    number
  >;
  metrics: {
    sourceCount: number;
    sectionsComplete: number;
    unansweredConfirmations: number;
    unsupportedClaims: number;
    conflictingSourceCount: number;
    staleSourceCount: number;
  };
};

function worstState(states: IndustryCriterionState[]): IndustryCriterionState {
  const priority: IndustryCriterionState[] = [
    'potential_inconsistency',
    'conflicting_sources',
    'missing_source',
    'stale_source',
    'methodology_concern',
    'missing_information',
    'pending_industry_report',
    'pending_linked_workstream',
    'pending_professional_confirmation',
    'substantiated',
    'not_applicable',
  ];
  for (const state of priority) {
    if (states.includes(state)) return state;
  }
  return 'missing_information';
}

function deriveResult(criteria: IndustryAssessmentCriterion[]): {
  result: IndustryAssessmentResultState;
  resultLabel: string;
  summary: string;
} {
  const hasInconsistency = criteria.some((c) => c.state === 'potential_inconsistency');
  const hasConflicting = criteria.some((c) => c.state === 'conflicting_sources');
  const hasMissingSource = criteria.some((c) => c.state === 'missing_source');
  const hasPendingLinked = criteria.some((c) => c.state === 'pending_linked_workstream');
  const hasProfessional = criteria.some(
    (c) =>
      c.state === 'pending_professional_confirmation' || c.state === 'pending_industry_report',
  );
  const missingCount = criteria.filter((c) => c.state === 'missing_information').length;

  if (hasInconsistency || hasConflicting) {
    return {
      result: 'inconsistencies_identified',
      resultLabel: 'Inconsistencies identified',
      summary:
        'One or more industry checks show a potential inconsistency or conflicting source that needs review.',
    };
  }
  if (hasMissingSource) {
    return {
      result: 'source_gaps_identified',
      resultLabel: 'Source gaps identified',
      summary: 'Material statistics or claims still lack supporting source references.',
    };
  }
  if (hasPendingLinked) {
    return {
      result: 'pending_linked_workstream',
      resultLabel: 'Pending linked workstream',
      summary: 'Some cross-workstream mappings await Business & Operations or Financials & KPIs wiring.',
    };
  }
  if (hasProfessional) {
    return {
      result: 'professional_confirmation_required',
      resultLabel: 'Professional confirmation required',
      summary: 'Commissioned reports or sensitive claims still need professional confirmation.',
    };
  }
  if (missingCount > criteria.length / 2) {
    return {
      result: 'insufficient_information',
      resultLabel: 'Disclosure readiness in progress',
      summary: 'Much of the industry and market record is still blank or unanswered.',
    };
  }
  return {
    result: 'readiness_in_progress',
    resultLabel: 'Readiness in progress',
    summary: 'Entered information is largely captured; remaining gaps are noted below.',
  };
}

export function assessIndustryMarket(
  payload: IndustryMarketPayload,
  linkedReferences: LinkedWorkstreamReferences = createEmptyLinkedWorkstreamReferences(),
): IndustryAssessmentResponse {
  const progress = calculateIndustryMarketProgress(payload);
  const model = computeIndustryMarketModel(payload, linkedReferences);
  return buildIndustryAssessment(payload, model, progress, linkedReferences);
}

function buildIndustryAssessment(
  payload: IndustryMarketPayload,
  model: IndustryMarketModel,
  progress: IndustryMarketProgress,
  linkedReferences: LinkedWorkstreamReferences,
): IndustryAssessmentResponse {
  const criteria: IndustryAssessmentCriterion[] = [];
  const scope = payload.industryScopeAndCompanyMarketMapping;
  const sources = getSources(payload);

  criteria.push({
    id: 'primary-industry',
    group: 'scope_and_relevance',
    label: 'Primary industry captured',
    state: scope.industryClassification.primaryIndustry.trim() ? 'substantiated' : 'missing_information',
    reason: scope.industryClassification.primaryIndustry.trim()
      ? `Primary industry: ${scope.industryClassification.primaryIndustry}.`
      : 'Primary industry not recorded.',
  });

  criteria.push({
    id: 'relevant-market-defined',
    group: 'scope_and_relevance',
    label: 'Relevant market defined',
    state: scope.marketDefinition.marketName.trim() ? 'substantiated' : 'missing_information',
    reason: scope.marketDefinition.marketName.trim()
      ? `Market: ${scope.marketDefinition.marketName}.`
      : 'Relevant market name not recorded.',
  });

  criteria.push({
    id: 'geography-defined',
    group: 'scope_and_relevance',
    label: 'Geography defined',
    state: scope.marketDefinition.geography.trim() ? 'substantiated' : 'missing_information',
    reason: scope.marketDefinition.geography.trim()
      ? `Geography: ${scope.marketDefinition.geography}.`
      : 'Market geography not recorded.',
  });

  criteria.push({
    id: 'issuer-market-mapping',
    group: 'scope_and_relevance',
    label: 'Market mapped to issuer products',
    state:
      scope.companyMarketMappings.length > 0 ? 'substantiated' : 'missing_information',
    reason:
      scope.companyMarketMappings.length > 0
        ? `${scope.companyMarketMappings.length} company-to-market mapping(s) recorded.`
        : 'No company-to-market mappings recorded.',
  });

  criteria.push({
    id: 'scope-exclusions',
    group: 'scope_and_relevance',
    label: 'Scope exclusions explained',
    state:
      scope.scopeExclusions.length > 0
        ? 'substantiated'
        : scope.marketDefinition.marketBoundaryExplanation.trim()
          ? 'substantiated'
          : 'missing_information',
    reason:
      scope.scopeExclusions.length > 0
        ? `${scope.scopeExclusions.length} exclusion(s) recorded.`
        : 'No explicit scope exclusions — confirm market boundary explanation is adequate.',
  });

  if (!linkedReferences.businessOperations.available) {
    criteria.push({
      id: 'business-operations-alignment',
      group: 'scope_and_relevance',
      label: 'Market scope aligns with Business & Operations',
      state: 'pending_linked_workstream',
      reason: 'Business & Operations reference unavailable (IM2 wiring).',
    });
  }

  for (const source of sources) {
    criteria.push({
      id: `source-readiness-${source.id}`,
      group: 'source_readiness',
      label: `Source readiness — ${source.title || source.id}`,
      state:
        source.sourceReadinessStatus === 'current'
          ? 'substantiated'
          : source.sourceReadinessStatus === 'potentially_stale' ||
              source.sourceReadinessStatus === 'superseded'
            ? 'stale_source'
            : source.sourceReadinessStatus === 'methodology_unclear'
              ? 'methodology_concern'
              : source.sourceReadinessStatus === 'professional_confirmation_required'
                ? 'pending_professional_confirmation'
                : source.sourceReadinessStatus === 'pending_verification'
                  ? 'pending_industry_report'
                  : 'missing_information',
      reason: source.sourceReadinessStatus
        ? `Status: ${source.sourceReadinessStatus.replace(/_/g, ' ')}.`
        : 'Source readiness status not recorded.',
    });

    if (!source.publicationDate.trim() || !source.dataCutOffDate.trim()) {
      criteria.push({
        id: `source-dates-${source.id}`,
        group: 'source_readiness',
        label: `Publication / cut-off dates — ${source.title || source.id}`,
        state: 'missing_information',
        reason: 'Publication date or data cut-off date missing.',
      });
    }

    if (source.sourceType === 'commissioned-industry-report') {
      const commissioned = source.commissionedReportDetails;
      criteria.push({
        id: `commissioned-report-${source.id}`,
        group: 'source_readiness',
        label: `Commissioned report disclosures — ${source.title || source.id}`,
        state:
          commissioned.independenceConfirmed === 'yes' &&
          commissioned.consentNoObjectionStatus.trim() !== ''
            ? 'substantiated'
            : commissioned.independenceConfirmed === 'not_sure'
              ? 'pending_professional_confirmation'
              : 'missing_information',
        reason: 'Commissioned industry report governance fields reviewed.',
      });
    }
  }

  if (sources.length === 0) {
    criteria.push({
      id: 'source-registry-empty',
      group: 'source_readiness',
      label: 'Source registry populated',
      state: 'missing_source',
      reason: 'No sources recorded in the master Source Registry.',
    });
  }

  for (const series of payload.marketSizeSegmentationAndGrowth.marketSeries) {
    const historicalValues = series.periodValues.filter((pv) => pv.actualEstimateForecast !== 'forecast');
    criteria.push({
      id: `market-series-${series.id}`,
      group: 'market_sizing_and_segmentation',
      label: `Market series — ${series.marketName || series.id}`,
      state:
        historicalValues.length > 0 && series.primarySourceId.trim()
          ? 'substantiated'
          : historicalValues.length > 0
            ? 'missing_source'
            : 'missing_information',
      reason:
        historicalValues.length > 0
          ? `${historicalValues.length} historical/actual period value(s) recorded.`
          : 'No historical market values recorded.',
    });

    const latest = historicalValues[historicalValues.length - 1];
    const calculatedCagr =
      latest && isFilledDecimal(latest.value) && isFilledDecimal(series.forecastMetadata.forecastValue)
        ? calculateCagr(
            latest.value,
            series.forecastMetadata.forecastValue,
            Math.max(historicalValues.length - 1, 1),
          )
        : '';
    const cagrReconciliation = reconcileReportedVsCalculatedCagr(
      series.forecastMetadata.reportedCagr,
      calculatedCagr,
    );
    if (series.forecastMetadata.forecastValue.trim()) {
      criteria.push({
        id: `forecast-marked-${series.id}`,
        group: 'market_sizing_and_segmentation',
        label: `Forecast distinguished — ${series.marketName || series.id}`,
        state: series.forecastMetadata.forecastSourceId.trim()
          ? 'substantiated'
          : 'missing_source',
        reason: 'Forecast values should reference an explicit source.',
      });
    }

    if (
      isFilledDecimal(series.forecastMetadata.reportedCagr) &&
      latest &&
      isFilledDecimal(latest.value) &&
      isFilledDecimal(series.forecastMetadata.forecastValue) &&
      !cagrReconciliation.reconciles
    ) {
      criteria.push({
        id: `cagr-reconcile-${series.id}`,
        group: 'market_sizing_and_segmentation',
        label: `CAGR reconciliation — ${series.marketName || series.id}`,
        state: 'potential_inconsistency',
        reason: cagrReconciliation.message,
      });
    }
  }

  for (const reconciliation of reconcileSegmentPercentages(
    payload.marketSizeSegmentationAndGrowth.marketSegmentations,
  )) {
    if (!reconciliation.reconciles) {
      criteria.push({
        id: `segment-reconcile-${reconciliation.parentMarketSeriesId}-${reconciliation.period}`,
        group: 'market_sizing_and_segmentation',
        label: 'Segment percentages reconcile',
        state: 'potential_inconsistency',
        reason: reconciliation.flags.join(' '),
      });
    }
  }

  if (!linkedReferences.businessOperations.available) {
    criteria.push({
      id: 'product-service-mapping',
      group: 'cross_workstream_consistency',
      label: 'Product/service mapping',
      state: 'pending_linked_workstream',
      reason: 'Business & Operations product/service links await IM2 wiring.',
    });
  }

  if (!linkedReferences.financialsKpis.available) {
    criteria.push({
      id: 'financial-segment-distinction',
      group: 'cross_workstream_consistency',
      label: 'Financial segment distinction',
      state: 'pending_linked_workstream',
      reason: 'Financials & KPIs reporting segment references await IM2 wiring.',
    });
  }

  for (const mapping of payload.marketSizeSegmentationAndGrowth.segmentMappings) {
    if (mapping.sameDefinition === 'no' && !mapping.differenceExplanation.trim()) {
      criteria.push({
        id: `segment-mapping-${mapping.id}`,
        group: 'cross_workstream_consistency',
        label: 'Market vs accounting segment distinction',
        state: 'potential_inconsistency',
        reason: 'Segment marked as different definition but no explanation recorded.',
      });
    }
  }

  for (const driver of payload.demandDriversEndMarketsTrendsAndPolicy.demandDrivers) {
    criteria.push({
      id: `demand-driver-${driver.id}`,
      group: 'demand_trend_substantiation',
      label: `Demand driver — ${driver.title || driver.id}`,
      state: driver.sourceId.trim()
        ? 'substantiated'
        : driver.description.trim()
          ? 'missing_source'
          : 'missing_information',
      reason: driver.sourceId.trim()
        ? 'Demand driver references a source.'
        : 'Demand driver lacks supporting source.',
    });
  }

  for (const trend of payload.demandDriversEndMarketsTrendsAndPolicy.industryTrends) {
    criteria.push({
      id: `industry-trend-${trend.id}`,
      group: 'demand_trend_substantiation',
      label: `Industry trend — ${trend.trend || trend.id}`,
      state: trend.sourceId.trim() ? 'substantiated' : 'missing_source',
      reason: trend.sourceId.trim()
        ? 'Trend references a source.'
        : 'Trend statement lacks supporting source.',
    });
  }

  for (const barrier of payload.valueChainSupplyStructureAndEntryBarriers.entryBarriers) {
    criteria.push({
      id: `entry-barrier-${barrier.id}`,
      group: 'value_chain_and_supply_structure',
      label: `Entry barrier — ${barrier.barrierType || barrier.id}`,
      state: barrier.sourceId.trim()
        ? 'substantiated'
        : barrier.description.trim()
          ? 'missing_source'
          : 'missing_information',
      reason: barrier.sourceId.trim()
        ? 'Barrier references supporting evidence.'
        : 'Barrier recorded without source — not treated as substantiated.',
    });
  }

  if (payload.competitionMarketShareAndIssuerPositioning.competitors.length === 0) {
    criteria.push({
      id: 'competitors-identified',
      group: 'competitive_landscape',
      label: 'Relevant competitors identified',
      state: 'missing_information',
      reason: 'No competitor records captured.',
    });
  }

  for (const share of payload.competitionMarketShareAndIssuerPositioning.marketShareRecords) {
    const validation = validateMarketShareRecord(share, payload);
    let state: IndustryCriterionState = 'substantiated';
    if (validation.denominatorWithoutSource || validation.unsupportedNumerator) {
      state = 'missing_source';
    } else if (
      validation.periodMismatch ||
      validation.geographyMismatch ||
      validation.unitMismatch ||
      validation.calculatedVsReportedDifference
    ) {
      state = 'potential_inconsistency';
    }

    criteria.push({
      id: `market-share-${share.id}`,
      group: 'market_share_integrity',
      label: `Market share — ${share.marketDefinition || share.id}`,
      state,
      reason: validation.flags.length > 0 ? validation.flags.join(' ') : 'Market share inputs reviewed.',
    });
  }

  for (const claim of payload.competitionMarketShareAndIssuerPositioning.claims) {
    const derivedStatus = deriveClaimStatus(claim, payload);
    const wording = detectUnsupportedClaimWording(claim.exactProposedWording);
    let state: IndustryCriterionState = 'substantiated';

    if (derivedStatus === 'do_not_use' || derivedStatus === 'insufficient_source') {
      state = wording.length > 0 ? 'missing_source' : 'missing_information';
    } else if (derivedStatus === 'stale_source') {
      state = 'stale_source';
    } else if (derivedStatus === 'contradictory_sources') {
      state = 'conflicting_sources';
    } else if (derivedStatus === 'professional_confirmation_required') {
      state = 'pending_professional_confirmation';
    } else if (derivedStatus === 'potentially_substantiated') {
      state = 'methodology_concern';
    }

    criteria.push({
      id: `claim-${claim.id}`,
      group: 'claim_substantiation',
      label: `Claim — ${claim.exactProposedWording || claim.id}`,
      state,
      reason:
        wording.length > 0
          ? `Unsupported wording detected (${wording.join(', ')}); status: ${derivedStatus.replace(/_/g, ' ')}.`
          : `Derived claim status: ${derivedStatus.replace(/_/g, ' ')}.`,
    });
  }

  for (const outlook of payload.outlookIndustryRisksAndConfirmations.outlookRecords) {
    criteria.push({
      id: `outlook-${outlook.id}`,
      group: 'outlook_and_conflicting_research',
      label: `Outlook — ${outlook.market || outlook.id}`,
      state:
        outlook.dataNature === 'issuer-expectation'
          ? 'methodology_concern'
          : outlook.sourceId.trim()
            ? 'substantiated'
            : 'missing_source',
      reason:
        outlook.dataNature === 'issuer-expectation'
          ? 'Issuer expectation distinguished from independent research — confirm before use.'
          : outlook.sourceId.trim()
            ? 'Outlook references a source.'
            : 'Outlook lacks supporting source.',
    });
  }

  for (const conflict of payload.outlookIndustryRisksAndConfirmations.conflictingResearch) {
    criteria.push({
      id: `conflict-${conflict.id}`,
      group: 'outlook_and_conflicting_research',
      label: `Conflicting research — ${conflict.topic || conflict.id}`,
      state:
        conflict.reconciled === 'yes'
          ? 'substantiated'
          : conflict.sourceAId.trim() && conflict.sourceBId.trim()
            ? 'conflicting_sources'
            : 'missing_information',
      reason:
        conflict.reconciled === 'yes'
          ? 'Conflict marked as reconciled.'
          : 'Conflicting source values require review.',
    });
  }

  for (const field of INDUSTRY_MARKET_CONFIRMATION_FIELDS) {
    criteria.push({
      id: `confirmation-${field.key}`,
      group: 'outlook_and_conflicting_research',
      label: field.label,
      state: payload.outlookIndustryRisksAndConfirmations.confirmations[field.key]
        ? 'substantiated'
        : 'missing_information',
      reason: payload.outlookIndustryRisksAndConfirmations.confirmations[field.key]
        ? 'Confirmed.'
        : 'Not confirmed yet.',
    });
  }

  const groups: IndustryAssessmentGroupResult[] = INDUSTRY_ASSESSMENT_GROUPS.map((group) => {
    const groupCriteria = criteria.filter((c) => c.group === group);
    return {
      group,
      label: INDUSTRY_ASSESSMENT_GROUP_LABELS[group],
      headlineState: worstState(groupCriteria.map((c) => c.state)),
      criteria: groupCriteria,
    };
  });

  const counts = {
    substantiated: criteria.filter((c) => c.state === 'substantiated').length,
    potentialInconsistency: criteria.filter((c) => c.state === 'potential_inconsistency').length,
    missingInformation: criteria.filter((c) => c.state === 'missing_information').length,
    missingSource: criteria.filter((c) => c.state === 'missing_source').length,
    staleSource: criteria.filter((c) => c.state === 'stale_source').length,
    methodologyConcern: criteria.filter((c) => c.state === 'methodology_concern').length,
    conflictingSources: criteria.filter((c) => c.state === 'conflicting_sources').length,
    pendingIndustryReport: criteria.filter((c) => c.state === 'pending_industry_report').length,
    pendingLinkedWorkstream: criteria.filter((c) => c.state === 'pending_linked_workstream').length,
    pendingProfessionalConfirmation: criteria.filter(
      (c) => c.state === 'pending_professional_confirmation',
    ).length,
    notApplicable: criteria.filter((c) => c.state === 'not_applicable').length,
  };

  const unansweredConfirmations = INDUSTRY_MARKET_CONFIRMATION_FIELDS.filter(
    (field) => !payload.outlookIndustryRisksAndConfirmations.confirmations[field.key],
  ).length;

  const unsupportedClaims = payload.competitionMarketShareAndIssuerPositioning.claims.filter(
    (claim) => {
      const status = deriveClaimStatus(claim, payload);
      return status === 'do_not_use' || status === 'insufficient_source';
    },
  ).length;

  const { result, resultLabel, summary } = deriveResult(criteria);

  return {
    result,
    resultLabel,
    summary,
    criteria,
    groups,
    counts,
    metrics: {
      sourceCount: model.sourceCount,
      sectionsComplete: progress.sectionsComplete,
      unansweredConfirmations,
      unsupportedClaims,
      conflictingSourceCount: model.conflictingSourceCount,
      staleSourceCount: model.potentiallyStaleSourceCount,
    },
  };
}

/** Alias used by tests and UI barrels. */
export const buildIndustryAssessmentFromPayload = assessIndustryMarket;

export type IndustryAssessment = IndustryAssessmentResponse;
