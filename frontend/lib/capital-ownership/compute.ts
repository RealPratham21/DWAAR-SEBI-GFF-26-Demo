/**
 * Derived Capital & Ownership computations.
 *
 * Nothing in this file is persisted. Every result is recomputed from the payload plus the
 * read-only IPO Setup reference, using Decimal-safe string arithmetic.
 *
 * Two rules are enforced structurally rather than by convention:
 * - An offer for sale NEVER increases share capital. Only a fresh issue (plus pre-issue
 *   placements, conversions and ESOP allotments recorded as such) changes the post-issue total.
 * - A selling shareholder can never offer more shares than they hold; the excess is reported
 *   as an issue instead of being silently clamped.
 */

import {
  add,
  compare,
  difference,
  div,
  greaterThan,
  isFilledDecimal,
  isPositive,
  isZero,
  mul,
  negate,
  pct,
  percentageOf,
  round,
  subtract,
  sumDecimals,
  toDecimalString,
} from '@/lib/capital-ownership/decimal';
import type {
  CapitalEvent,
  CapitalEventType,
  CapitalOwnershipPayload,
  CurrentCapitalStructure,
  Encumbrance,
  IpoSetupReference,
  OutstandingSecuritiesTransactionsAndConfirmations,
  PreAndPostIssueOwnership,
  PromoterContributionLockInAndEncumbrances,
  Shareholder,
  ShareholderCategory,
  ShareholderOfferOverlay,
} from '@/lib/capital-ownership/types';
import type { IpoSetupPayload } from '@/lib/schemas/ipo-setup';

/** SEBI minimum promoter contribution benchmark used when the issuer states no target. */
export const DEFAULT_MINIMUM_CONTRIBUTION_PERCENTAGE = '20';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function firstFilled(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (isFilledDecimal(value)) return toDecimalString(value);
  }
  return '';
}

/** Round up to a whole share. */
function ceilShares(value: string): string {
  if (!isFilledDecimal(value)) return '';
  const rounded = round(value, 0);
  return compare(rounded, value) === -1 ? add(rounded, '1') : rounded;
}

function fromNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  const raw =
    Math.abs(value) < 1e21 ? value.toFixed(Number.isInteger(value) ? 0 : 6) : String(value);
  return toDecimalString(raw);
}

/** Build the read-only IPO Setup mirror from that workstream's payload. */
export function ipoSetupReferenceFromPayload(
  payload: IpoSetupPayload | null | undefined,
): IpoSetupReference {
  if (!payload) {
    return {
      available: false,
      proposedOfferType: '',
      faceValuePerEquityShare: '',
      existingIssuedEquityShares: '',
      existingPaidUpEquityShareCapital: '',
      proposedIssuePrice: '',
      proposedFreshIssueShares: '',
      proposedFreshIssueAmount: '',
      proposedOfsShares: '',
      proposedOfsAmount: '',
    };
  }
  const offer = payload.offerStructure;
  return {
    available: true,
    proposedOfferType: payload.ipoDirection.proposedOfferType,
    faceValuePerEquityShare: fromNumber(offer.faceValuePerEquityShare),
    existingIssuedEquityShares: fromNumber(offer.existingIssuedEquityShares),
    existingPaidUpEquityShareCapital: fromNumber(offer.existingPaidUpEquityShareCapital),
    proposedIssuePrice: fromNumber(offer.proposedIssuePrice),
    proposedFreshIssueShares: fromNumber(offer.proposedFreshIssueShares),
    proposedFreshIssueAmount: fromNumber(offer.proposedFreshIssueAmount),
    proposedOfsShares: fromNumber(offer.proposedOfsShares),
    proposedOfsAmount: fromNumber(offer.proposedOfsAmount),
  };
}

export function offerTypeFlags(offerType: string): {
  includesFreshIssue: boolean;
  includesOfs: boolean;
} {
  return {
    includesFreshIssue: offerType === 'fresh-issue' || offerType === 'fresh-and-ofs',
    includesOfs: offerType === 'offer-for-sale' || offerType === 'fresh-and-ofs',
  };
}

/* -------------------------------------------------------------------------- */
/* 1. Current capital totals                                                   */
/* -------------------------------------------------------------------------- */

export type CapitalTotals = {
  authorisedEquityShares: string;
  authorisedEquityCapitalFromClasses: string;
  issuedEquityShares: string;
  subscribedEquityShares: string;
  paidUpEquityShares: string;
  paidUpEquityCapitalFromClasses: string;
  partlyPaidEquityShares: string;
  forfeitedEquityShares: string;
  dematerialisedEquityShares: string;
  dematerialisedPercentage: string;
  totalVotingRights: string;
  authorisedPreferenceShares: string;
  authorisedPreferenceCapitalFromClasses: string;
  issuedPreferenceShares: string;
  paidUpPreferenceShares: string;
  paidUpPreferenceCapitalFromClasses: string;
  potentialEquityFromPreferenceConversion: string;
  totalAuthorisedCapitalFromClasses: string;
  totalPaidUpCapitalFromClasses: string;
  /** Blended face value: paid-up equity capital divided by paid-up equity shares. */
  impliedEquityFaceValue: string;
  /** Best available "current equity share count" for downstream cap-table maths. */
  currentEquityShares: string;
  declaredAuthorisedEquityCapital: string;
  declaredIssuedEquityCapital: string;
  declaredPaidUpEquityCapital: string;
  authorisedEquityCapitalVariance: string;
  paidUpEquityCapitalVariance: string;
};

export function computeCurrentCapitalTotals(structure: CurrentCapitalStructure): CapitalTotals {
  const equity = structure.equityClasses;
  const preference = structure.preferenceClasses;

  const authorisedEquityShares = sumDecimals(equity.map((item) => item.authorisedShares));
  const issuedEquityShares = sumDecimals(equity.map((item) => item.issuedShares));
  const subscribedEquityShares = sumDecimals(equity.map((item) => item.subscribedShares));
  const paidUpEquityShares = sumDecimals(equity.map((item) => item.paidUpShares));
  const partlyPaidEquityShares = sumDecimals(equity.map((item) => item.partlyPaidShares));
  const forfeitedEquityShares = sumDecimals(equity.map((item) => item.sharesForfeited));
  const dematerialisedEquityShares = sumDecimals(
    equity.map((item) => item.sharesInDematerialisedForm),
  );

  const authorisedEquityCapitalFromClasses = sumDecimals(
    equity.map((item) => mul(item.authorisedShares, item.faceValuePerShare)),
  );
  const paidUpEquityCapitalFromClasses = sumDecimals(
    equity.map((item) => mul(item.paidUpShares, item.faceValuePerShare)),
  );
  const totalVotingRights = sumDecimals(
    equity.map((item) => mul(item.paidUpShares, item.votingRightsPerShare)),
  );

  const authorisedPreferenceShares = sumDecimals(preference.map((item) => item.authorisedShares));
  const issuedPreferenceShares = sumDecimals(preference.map((item) => item.issuedShares));
  const paidUpPreferenceShares = sumDecimals(preference.map((item) => item.paidUpShares));
  const authorisedPreferenceCapitalFromClasses = sumDecimals(
    preference.map((item) => mul(item.authorisedShares, item.faceValuePerShare)),
  );
  const paidUpPreferenceCapitalFromClasses = sumDecimals(
    preference.map((item) => mul(item.paidUpShares, item.faceValuePerShare)),
  );
  const potentialEquityFromPreferenceConversion = sumDecimals(
    preference.map((item) => item.potentialEquitySharesOnConversion),
  );

  const totalAuthorisedCapitalFromClasses = sumDecimals([
    authorisedEquityCapitalFromClasses,
    authorisedPreferenceCapitalFromClasses,
  ]);
  const totalPaidUpCapitalFromClasses = sumDecimals([
    paidUpEquityCapitalFromClasses,
    paidUpPreferenceCapitalFromClasses,
  ]);

  const currentEquityShares = firstFilled(
    paidUpEquityShares,
    subscribedEquityShares,
    issuedEquityShares,
  );

  const impliedEquityFaceValue =
    isFilledDecimal(paidUpEquityCapitalFromClasses) && isPositive(paidUpEquityShares)
      ? div(paidUpEquityCapitalFromClasses, paidUpEquityShares, 6)
      : firstFilled(...equity.map((item) => item.faceValuePerShare));

  const dematerialisedPercentage = isPositive(currentEquityShares)
    ? pct(dematerialisedEquityShares, currentEquityShares, 4)
    : '';

  const declaredAuthorisedEquityCapital = toDecimalString(structure.authorisedEquityShareCapital);
  const declaredIssuedEquityCapital = toDecimalString(structure.issuedEquityShareCapital);
  const declaredPaidUpEquityCapital = toDecimalString(structure.paidUpEquityShareCapital);

  return {
    authorisedEquityShares,
    authorisedEquityCapitalFromClasses,
    issuedEquityShares,
    subscribedEquityShares,
    paidUpEquityShares,
    paidUpEquityCapitalFromClasses,
    partlyPaidEquityShares,
    forfeitedEquityShares,
    dematerialisedEquityShares,
    dematerialisedPercentage,
    totalVotingRights,
    authorisedPreferenceShares,
    authorisedPreferenceCapitalFromClasses,
    issuedPreferenceShares,
    paidUpPreferenceShares,
    paidUpPreferenceCapitalFromClasses,
    potentialEquityFromPreferenceConversion,
    totalAuthorisedCapitalFromClasses,
    totalPaidUpCapitalFromClasses,
    impliedEquityFaceValue,
    currentEquityShares,
    declaredAuthorisedEquityCapital,
    declaredIssuedEquityCapital,
    declaredPaidUpEquityCapital,
    authorisedEquityCapitalVariance: difference(
      declaredAuthorisedEquityCapital,
      authorisedEquityCapitalFromClasses,
    ),
    paidUpEquityCapitalVariance: difference(
      declaredPaidUpEquityCapital,
      paidUpEquityCapitalFromClasses,
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* 2. Share capital history                                                    */
/* -------------------------------------------------------------------------- */

const INCREASING_EVENTS: CapitalEventType[] = [
  'incorporation-initial-subscription',
  'further-allotment-cash',
  'rights-issue',
  'bonus-issue',
  'preferential-allotment',
  'private-placement',
  'esop-allotment',
  'sweat-equity-allotment',
  'conversion-of-securities',
  'conversion-of-loan',
  'scheme-of-arrangement',
];

const DECREASING_EVENTS: CapitalEventType[] = [
  'buyback',
  'capital-reduction',
  'forfeiture-of-shares',
  'redemption-of-preference-shares',
  'cancellation-of-shares',
];

const RATIO_EVENTS: CapitalEventType[] = ['share-split-subdivision', 'share-consolidation'];

const NON_CAPITAL_EVENTS: CapitalEventType[] = ['increase-in-authorised-capital'];

export type CapitalEventDirection = 'increase' | 'decrease' | 'ratio' | 'none' | 'unknown';

export function capitalEventDirection(eventType: string): CapitalEventDirection {
  if (eventType === '') return 'unknown';
  if (INCREASING_EVENTS.includes(eventType as CapitalEventType)) return 'increase';
  if (DECREASING_EVENTS.includes(eventType as CapitalEventType)) return 'decrease';
  if (RATIO_EVENTS.includes(eventType as CapitalEventType)) return 'ratio';
  if (NON_CAPITAL_EVENTS.includes(eventType as CapitalEventType)) return 'none';
  return 'unknown';
}

export type CapitalHistoryRow = {
  eventId: string;
  sequence: number;
  eventDate: string;
  eventType: string;
  securityType: string;
  direction: CapitalEventDirection;
  /** Signed change in equity share count for this event (`''` when not determinable). */
  sharesDelta: string;
  cumulativeEquityShares: string;
  faceValuePerShare: string;
  cumulativePaidUpCapital: string;
  considerationAmount: string;
  warnings: string[];
};

export type CapitalHistoryComputation = {
  rows: CapitalHistoryRow[];
  closingEquityShares: string;
  closingFaceValuePerShare: string;
  closingPaidUpEquityCapital: string;
  totalSharesIssued: string;
  totalSharesReduced: string;
  bonusSharesIssued: string;
  sharesIssuedForConsiderationOtherThanCash: string;
  promoterSharesAllotted: string;
  totalConsiderationReceived: string;
  eventsMissingDate: number;
  eventsMissingShareCount: number;
  eventsWithUnknownType: number;
  cumulativeIsComplete: boolean;
};

/** Events sorted oldest-first; blank dates sink to the end but keep their relative order. */
export function sortCapitalEvents(events: CapitalEvent[]): CapitalEvent[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      const left = a.event.eventDate || '9999-12-31';
      const right = b.event.eventDate || '9999-12-31';
      if (left !== right) return left < right ? -1 : 1;
      return a.index - b.index;
    })
    .map((entry) => entry.event);
}

function affectsEquity(event: CapitalEvent): boolean {
  return event.securityType === 'equity' || event.securityType === '';
}

export function computeCapitalHistoryCumulative(
  events: CapitalEvent[],
): CapitalHistoryComputation {
  const ordered = sortCapitalEvents(events);
  const rows: CapitalHistoryRow[] = [];

  let cumulative = '0';
  let cumulativeBroken = false;
  let faceValue = '';
  let eventsMissingDate = 0;
  let eventsMissingShareCount = 0;
  let eventsWithUnknownType = 0;

  const issued: string[] = [];
  const reduced: string[] = [];
  const bonus: string[] = [];
  const otherThanCash: string[] = [];
  const promoterShares: string[] = [];
  const consideration: string[] = [];

  ordered.forEach((event, index) => {
    const warnings: string[] = [];
    const direction = capitalEventDirection(event.eventType);
    const equityEvent = affectsEquity(event);

    if (!event.eventDate) {
      warnings.push('Event date is missing.');
      eventsMissingDate += 1;
    }
    if (direction === 'unknown') {
      warnings.push('Event type is not selected, so the share movement cannot be applied.');
      eventsWithUnknownType += 1;
    }

    const nextFaceValue = firstFilled(
      event.postEventFaceValuePerShare,
      event.faceValuePerShare,
      faceValue,
    );

    let delta = '';
    if (direction === 'increase' || direction === 'decrease') {
      const magnitude = toDecimalString(event.numberOfShares);
      if (magnitude === '') {
        warnings.push('Number of shares is missing.');
        eventsMissingShareCount += 1;
      } else {
        delta = direction === 'increase' ? magnitude : negate(magnitude);
      }
    } else if (direction === 'ratio') {
      const from = toDecimalString(event.splitOrConsolidationRatioFrom);
      const to = toDecimalString(event.splitOrConsolidationRatioTo);
      if (from === '' || to === '' || isZero(from)) {
        warnings.push('Split or consolidation ratio is incomplete.');
      } else if (!cumulativeBroken && isFilledDecimal(cumulative)) {
        const resulting = div(mul(cumulative, to), from, 0);
        delta = subtract(resulting, cumulative);
      }
    } else if (direction === 'none') {
      delta = '0';
    }

    if (equityEvent) {
      if (delta === '') {
        if (direction !== 'unknown' || event.eventType !== '') cumulativeBroken = true;
      } else if (!cumulativeBroken) {
        cumulative = add(cumulative, delta);
      }
      faceValue = nextFaceValue;
    }

    const cumulativeEquityShares = cumulativeBroken || !equityEvent ? '' : cumulative;
    const cumulativePaidUpCapital =
      cumulativeEquityShares === '' ? '' : mul(cumulativeEquityShares, faceValue);

    if (delta !== '' && equityEvent) {
      if (isPositive(delta)) issued.push(delta);
      else if (compare(delta, '0') === -1) reduced.push(negate(delta));
      if (event.eventType === 'bonus-issue') bonus.push(delta);
      if (
        event.considerationType === 'other-than-cash' ||
        event.considerationType === 'part-cash-part-other'
      ) {
        otherThanCash.push(delta);
      }
    }
    if (event.includesPromoterAllotment === 'yes') {
      promoterShares.push(toDecimalString(event.promoterSharesInEvent));
    }
    consideration.push(toDecimalString(event.totalConsiderationAmount));

    rows.push({
      eventId: event.id,
      sequence: index + 1,
      eventDate: event.eventDate,
      eventType: event.eventType,
      securityType: event.securityType,
      direction,
      sharesDelta: delta,
      cumulativeEquityShares,
      faceValuePerShare: equityEvent ? faceValue : nextFaceValue,
      cumulativePaidUpCapital,
      considerationAmount: toDecimalString(event.totalConsiderationAmount),
      warnings,
    });
  });

  const closingEquityShares = cumulativeBroken ? '' : cumulative;

  return {
    rows,
    closingEquityShares,
    closingFaceValuePerShare: faceValue,
    closingPaidUpEquityCapital:
      closingEquityShares === '' ? '' : mul(closingEquityShares, faceValue),
    totalSharesIssued: sumDecimals(issued),
    totalSharesReduced: sumDecimals(reduced),
    bonusSharesIssued: sumDecimals(bonus),
    sharesIssuedForConsiderationOtherThanCash: sumDecimals(otherThanCash),
    promoterSharesAllotted: sumDecimals(promoterShares),
    totalConsiderationReceived: sumDecimals(consideration),
    eventsMissingDate,
    eventsMissingShareCount,
    eventsWithUnknownType,
    cumulativeIsComplete: ordered.length > 0 && !cumulativeBroken,
  };
}

/* -------------------------------------------------------------------------- */
/* 3. Cap table                                                                */
/* -------------------------------------------------------------------------- */

export type CapTableRow = {
  shareholderId: string;
  name: string;
  category: ShareholderCategory | '';
  holderType: string;
  equityShares: string;
  preferenceShares: string;
  percentageOfEquity: string;
  encumberedShares: string;
  encumberedPercentageOfHolding: string;
  dematerialisedShares: string;
  isPromoterOrGroup: boolean;
};

export type CapTableGroupTotals = {
  promoterShares: string;
  promoterPercentage: string;
  promoterGroupShares: string;
  promoterGroupPercentage: string;
  promoterAndGroupShares: string;
  promoterAndGroupPercentage: string;
  publicShares: string;
  publicPercentage: string;
  employeeShares: string;
  institutionalShares: string;
  otherShares: string;
};

export type CapTable = {
  rows: CapTableRow[];
  totalEquitySharesFromRegister: string;
  referenceTotalEquityShares: string;
  registerVariance: string;
  totalPreferenceShares: string;
  totalEncumberedShares: string;
  shareholdersWithoutCategory: number;
  shareholdersWithoutShareCount: number;
  groups: CapTableGroupTotals;
};

function isPromoterCategory(category: string): boolean {
  return category === 'promoter' || category === 'promoter-group';
}

export function computeCapTable(
  shareholders: Shareholder[],
  totals: { currentEquityShares?: string } | string | null | undefined,
): CapTable {
  const referenceTotalEquityShares =
    typeof totals === 'string' ? toDecimalString(totals) : toDecimalString(totals?.currentEquityShares);

  const totalEquitySharesFromRegister = sumDecimals(
    shareholders.map((item) => item.equitySharesHeld),
  );
  const denominator = firstFilled(referenceTotalEquityShares, totalEquitySharesFromRegister);

  const rows: CapTableRow[] = shareholders.map((shareholder) => {
    const equityShares = toDecimalString(shareholder.equitySharesHeld);
    const encumberedShares = toDecimalString(shareholder.sharesEncumbered);
    return {
      shareholderId: shareholder.id,
      name: shareholder.name,
      category: shareholder.category,
      holderType: shareholder.holderType,
      equityShares,
      preferenceShares: toDecimalString(shareholder.preferenceSharesHeld),
      percentageOfEquity: isPositive(denominator) ? pct(equityShares, denominator, 4) : '',
      encumberedShares,
      encumberedPercentageOfHolding: isPositive(equityShares)
        ? pct(encumberedShares, equityShares, 4)
        : '',
      dematerialisedShares: toDecimalString(shareholder.sharesInDematerialisedForm),
      isPromoterOrGroup:
        isPromoterCategory(shareholder.category) || shareholder.isPartOfPromoterGroup === 'yes',
    };
  });

  const sharesFor = (predicate: (row: CapTableRow) => boolean): string =>
    sumDecimals(rows.filter(predicate).map((row) => row.equityShares));

  const promoterShares = sharesFor((row) => row.category === 'promoter');
  const promoterGroupShares = sharesFor(
    (row) => row.category === 'promoter-group' || (row.category !== 'promoter' && row.isPromoterOrGroup),
  );
  const promoterAndGroupShares = sumDecimals([promoterShares, promoterGroupShares]);
  const publicShares = sharesFor((row) => row.category === 'public');
  const employeeShares = sharesFor((row) => row.category === 'employee');
  const institutionalShares = sharesFor((row) => row.category === 'institutional-investor');
  const otherShares = sharesFor(
    (row) =>
      !row.isPromoterOrGroup &&
      row.category !== 'public' &&
      row.category !== 'employee' &&
      row.category !== 'institutional-investor',
  );

  const percentageOfTotal = (value: string): string =>
    isPositive(denominator) ? pct(value, denominator, 4) : '';

  return {
    rows,
    totalEquitySharesFromRegister,
    referenceTotalEquityShares,
    registerVariance: difference(referenceTotalEquityShares, totalEquitySharesFromRegister),
    totalPreferenceShares: sumDecimals(rows.map((row) => row.preferenceShares)),
    totalEncumberedShares: sumDecimals(rows.map((row) => row.encumberedShares)),
    shareholdersWithoutCategory: shareholders.filter((item) => item.category === '').length,
    shareholdersWithoutShareCount: shareholders.filter(
      (item) => !isFilledDecimal(item.equitySharesHeld),
    ).length,
    groups: {
      promoterShares,
      promoterPercentage: percentageOfTotal(promoterShares),
      promoterGroupShares,
      promoterGroupPercentage: percentageOfTotal(promoterGroupShares),
      promoterAndGroupShares,
      promoterAndGroupPercentage: percentageOfTotal(promoterAndGroupShares),
      publicShares,
      publicPercentage: percentageOfTotal(publicShares),
      employeeShares,
      institutionalShares,
      otherShares,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* 4. Pre & post issue                                                         */
/* -------------------------------------------------------------------------- */

export type PrePostIssueIssue = {
  id: string;
  code:
    | 'ofs_exceeds_holding'
    | 'ofs_total_mismatch'
    | 'ofs_without_offer_for_sale'
    | 'transfer_exceeds_holding'
    | 'pre_issue_total_unavailable'
    | 'fresh_issue_unavailable'
    | 'overlay_without_shareholder';
  severity: 'error' | 'warning' | 'info';
  message: string;
};

export type PrePostIssueRow = {
  shareholderId: string;
  name: string;
  category: ShareholderCategory | '';
  isPromoterOrGroup: boolean;
  preIssueShares: string;
  preIssuePercentage: string;
  sharesOfferedForSale: string;
  otherExpectedPreIssueTransfer: string;
  postIssueShares: string;
  postIssuePercentage: string;
  dilutionPercentagePoints: string;
  offerExceedsHolding: boolean;
};

export type PrePostIssueView = {
  rows: PrePostIssueRow[];
  registerPreIssueShares: string;
  additionalPreIssueShares: string;
  adjustedPreIssueShares: string;
  freshIssueShares: string;
  freshIssueSourceIsOverride: boolean;
  totalSharesOfferedForSale: string;
  totalOtherExpectedTransfers: string;
  postIssueShares: string;
  /** Only a fresh issue (and recorded pre-issue allotments) increases capital. */
  capitalIncreaseShares: string;
  ofsIncreasesCapital: false;
  totalOfferSizeShares: string;
  offerAsPercentageOfPostIssueCapital: string;
  groups: {
    promoterPreIssueShares: string;
    promoterPreIssuePercentage: string;
    promoterPostIssueShares: string;
    promoterPostIssuePercentage: string;
    publicPreIssueShares: string;
    publicPostIssueShares: string;
    publicPostIssuePercentage: string;
  };
  issues: PrePostIssueIssue[];
};

export type PrePostIssueOptions = {
  /** Authoritative pre-issue equity share count, usually from `computeCurrentCapitalTotals`. */
  preIssueTotalEquityShares?: string;
  /** Pre-IPO placement, conversions and ESOP allotments expected before the issue. */
  additionalPreIssueShares?: string;
  freshIssueSharesOverride?: string;
};

export function computePrePostIssue(
  shareholders: Shareholder[],
  ipoReference: IpoSetupReference,
  overlays: ShareholderOfferOverlay[],
  options: PrePostIssueOptions = {},
): PrePostIssueView {
  const issues: PrePostIssueIssue[] = [];
  const overlayByShareholder = new Map<string, ShareholderOfferOverlay>();
  for (const overlay of overlays) {
    if (!overlay.shareholderId) {
      issues.push({
        id: `overlay-unlinked-${overlay.id}`,
        code: 'overlay_without_shareholder',
        severity: 'warning',
        message: 'An offer-for-sale entry is not linked to a shareholder.',
      });
      continue;
    }
    overlayByShareholder.set(overlay.shareholderId, overlay);
  }

  const registerPreIssueShares = firstFilled(
    options.preIssueTotalEquityShares,
    sumDecimals(shareholders.map((item) => item.equitySharesHeld)),
    ipoReference.existingIssuedEquityShares,
  );
  const additionalPreIssueShares = toDecimalString(options.additionalPreIssueShares) || '0';
  const adjustedPreIssueShares =
    registerPreIssueShares === '' ? '' : add(registerPreIssueShares, additionalPreIssueShares);

  const freshIssueSourceIsOverride = isFilledDecimal(options.freshIssueSharesOverride);
  const freshIssueShares = freshIssueSourceIsOverride
    ? toDecimalString(options.freshIssueSharesOverride)
    : toDecimalString(ipoReference.proposedFreshIssueShares);

  const postIssueShares =
    adjustedPreIssueShares === '' || freshIssueShares === ''
      ? ''
      : add(adjustedPreIssueShares, freshIssueShares);

  const rows: PrePostIssueRow[] = shareholders.map((shareholder) => {
    const overlay = overlayByShareholder.get(shareholder.id);
    const preIssueShares = toDecimalString(shareholder.equitySharesHeld);
    const sharesOfferedForSale = toDecimalString(overlay?.sharesOfferedForSale);
    const otherExpectedPreIssueTransfer = toDecimalString(overlay?.otherExpectedPreIssueTransfer);

    const reductions = sumDecimals([sharesOfferedForSale, otherExpectedPreIssueTransfer]);
    const postIssueSharesForHolder =
      preIssueShares === '' ? '' : subtract(preIssueShares, reductions === '' ? '0' : reductions);

    const offerExceedsHolding =
      isFilledDecimal(preIssueShares) &&
      isFilledDecimal(sharesOfferedForSale) &&
      greaterThan(sharesOfferedForSale, preIssueShares);

    if (offerExceedsHolding) {
      issues.push({
        id: `ofs-exceeds-${shareholder.id}`,
        code: 'ofs_exceeds_holding',
        severity: 'error',
        message: `${shareholder.name || 'A shareholder'} is offering more shares than currently held.`,
      });
    }

    if (
      isFilledDecimal(preIssueShares) &&
      isFilledDecimal(postIssueSharesForHolder) &&
      compare(postIssueSharesForHolder, '0') === -1
    ) {
      issues.push({
        id: `transfer-exceeds-${shareholder.id}`,
        code: 'transfer_exceeds_holding',
        severity: 'error',
        message: `${shareholder.name || 'A shareholder'} has offer and transfer quantities exceeding the holding.`,
      });
    }

    const preIssuePercentage = isPositive(adjustedPreIssueShares)
      ? pct(preIssueShares, adjustedPreIssueShares, 4)
      : '';
    const postIssuePercentage = isPositive(postIssueShares)
      ? pct(postIssueSharesForHolder, postIssueShares, 4)
      : '';

    return {
      shareholderId: shareholder.id,
      name: shareholder.name,
      category: shareholder.category,
      isPromoterOrGroup:
        isPromoterCategory(shareholder.category) || shareholder.isPartOfPromoterGroup === 'yes',
      preIssueShares,
      preIssuePercentage,
      sharesOfferedForSale,
      otherExpectedPreIssueTransfer,
      postIssueShares: postIssueSharesForHolder,
      postIssuePercentage,
      dilutionPercentagePoints: subtract(preIssuePercentage, postIssuePercentage),
      offerExceedsHolding,
    };
  });

  const totalSharesOfferedForSale = sumDecimals(rows.map((row) => row.sharesOfferedForSale));
  const totalOtherExpectedTransfers = sumDecimals(
    rows.map((row) => row.otherExpectedPreIssueTransfer),
  );

  const { includesOfs } = offerTypeFlags(ipoReference.proposedOfferType);
  if (
    ipoReference.available &&
    !includesOfs &&
    isPositive(totalSharesOfferedForSale) &&
    ipoReference.proposedOfferType !== '' &&
    ipoReference.proposedOfferType !== 'undecided'
  ) {
    issues.push({
      id: 'ofs-without-offer-for-sale',
      code: 'ofs_without_offer_for_sale',
      severity: 'warning',
      message:
        'Shares are marked for sale even though the proposed offer type in IPO Setup does not include an offer for sale.',
    });
  }

  if (
    isFilledDecimal(ipoReference.proposedOfsShares) &&
    isFilledDecimal(totalSharesOfferedForSale) &&
    compare(ipoReference.proposedOfsShares, totalSharesOfferedForSale) !== 0
  ) {
    issues.push({
      id: 'ofs-total-mismatch',
      code: 'ofs_total_mismatch',
      severity: 'warning',
      message:
        'Total shares marked for sale here do not match the proposed offer-for-sale size recorded in IPO Setup.',
    });
  }

  if (adjustedPreIssueShares === '') {
    issues.push({
      id: 'pre-issue-total-unavailable',
      code: 'pre_issue_total_unavailable',
      severity: 'info',
      message: 'Pre-issue share count is not yet available, so percentages cannot be computed.',
    });
  }
  if (freshIssueShares === '') {
    issues.push({
      id: 'fresh-issue-unavailable',
      code: 'fresh_issue_unavailable',
      severity: 'info',
      message: 'Fresh-issue share count is not yet available, so the post-issue view is indicative.',
    });
  }

  const promoterRows = rows.filter((row) => row.isPromoterOrGroup);
  const publicRows = rows.filter((row) => !row.isPromoterOrGroup);
  const promoterPreIssueShares = sumDecimals(promoterRows.map((row) => row.preIssueShares));
  const promoterPostIssueShares = sumDecimals(promoterRows.map((row) => row.postIssueShares));
  const publicPreIssueShares = sumDecimals(publicRows.map((row) => row.preIssueShares));
  const publicExistingPostIssueShares = sumDecimals(publicRows.map((row) => row.postIssueShares));
  const publicPostIssueShares = sumDecimals([
    publicExistingPostIssueShares,
    freshIssueShares,
    totalSharesOfferedForSale,
  ]);

  const totalOfferSizeShares = sumDecimals([freshIssueShares, totalSharesOfferedForSale]);

  return {
    rows,
    registerPreIssueShares,
    additionalPreIssueShares,
    adjustedPreIssueShares,
    freshIssueShares,
    freshIssueSourceIsOverride,
    totalSharesOfferedForSale,
    totalOtherExpectedTransfers,
    postIssueShares,
    capitalIncreaseShares: sumDecimals([freshIssueShares, additionalPreIssueShares]),
    ofsIncreasesCapital: false,
    totalOfferSizeShares,
    offerAsPercentageOfPostIssueCapital: isPositive(postIssueShares)
      ? pct(totalOfferSizeShares, postIssueShares, 4)
      : '',
    groups: {
      promoterPreIssueShares,
      promoterPreIssuePercentage: isPositive(adjustedPreIssueShares)
        ? pct(promoterPreIssueShares, adjustedPreIssueShares, 4)
        : '',
      promoterPostIssueShares,
      promoterPostIssuePercentage: isPositive(postIssueShares)
        ? pct(promoterPostIssueShares, postIssueShares, 4)
        : '',
      publicPreIssueShares,
      publicPostIssueShares,
      publicPostIssuePercentage: isPositive(postIssueShares)
        ? pct(publicPostIssueShares, postIssueShares, 4)
        : '',
    },
    issues,
  };
}

/* -------------------------------------------------------------------------- */
/* 5. Dilution                                                                 */
/* -------------------------------------------------------------------------- */

export type DilutionView = {
  promoterPreIssuePercentage: string;
  promoterPostIssuePercentage: string;
  promoterDilutionPercentagePoints: string;
  publicPostIssuePercentage: string;
  freshIssueDilutionPercentage: string;
  offerSizePercentageOfPostIssue: string;
  postIssuePaidUpCapital: string;
  paidUpCapitalIncrease: string;
};

export function computeDilution(
  view: PrePostIssueView,
  faceValuePerShare: string,
): DilutionView {
  const paidUpCapitalIncrease = mul(view.capitalIncreaseShares, faceValuePerShare);
  return {
    promoterPreIssuePercentage: view.groups.promoterPreIssuePercentage,
    promoterPostIssuePercentage: view.groups.promoterPostIssuePercentage,
    promoterDilutionPercentagePoints: subtract(
      view.groups.promoterPreIssuePercentage,
      view.groups.promoterPostIssuePercentage,
    ),
    publicPostIssuePercentage: view.groups.publicPostIssuePercentage,
    freshIssueDilutionPercentage: isPositive(view.postIssueShares)
      ? pct(view.freshIssueShares, view.postIssueShares, 4)
      : '',
    offerSizePercentageOfPostIssue: view.offerAsPercentageOfPostIssueCapital,
    postIssuePaidUpCapital: mul(view.postIssueShares, faceValuePerShare),
    paidUpCapitalIncrease,
  };
}

/* -------------------------------------------------------------------------- */
/* 6. Outstanding instruments                                                  */
/* -------------------------------------------------------------------------- */

export type OutstandingInstrumentsSummary = {
  instrumentCount: number;
  totalPotentialEquityShares: string;
  potentialDilutionPercentage: string;
  fullyDilutedShares: string;
  instrumentsSettlingBeforeFiling: number;
  instrumentsSurvivingFiling: number;
  instrumentsWithUnknownSettlement: number;
  totalConsiderationOnConversion: string;
};

export function computeOutstandingInstruments(
  section: OutstandingSecuritiesTransactionsAndConfirmations,
  postIssueShares: string,
): OutstandingInstrumentsSummary {
  const instruments = section.outstandingInstruments;
  const totalPotentialEquityShares = sumDecimals(
    instruments.map((item) => item.potentialEquitySharesOnConversion),
  );
  const fullyDilutedShares =
    postIssueShares === '' ? '' : add(postIssueShares, totalPotentialEquityShares || '0');

  return {
    instrumentCount: instruments.length,
    totalPotentialEquityShares,
    potentialDilutionPercentage: isPositive(fullyDilutedShares)
      ? pct(totalPotentialEquityShares, fullyDilutedShares, 4)
      : '',
    fullyDilutedShares,
    instrumentsSettlingBeforeFiling: instruments.filter(
      (item) => item.willConvertOrLapseBeforeFiling === 'yes',
    ).length,
    instrumentsSurvivingFiling: instruments.filter(
      (item) => item.willConvertOrLapseBeforeFiling === 'no',
    ).length,
    instrumentsWithUnknownSettlement: instruments.filter(
      (item) =>
        item.willConvertOrLapseBeforeFiling === '' ||
        item.willConvertOrLapseBeforeFiling === 'not_sure',
    ).length,
    totalConsiderationOnConversion: sumDecimals(
      instruments.map((item) =>
        mul(item.potentialEquitySharesOnConversion, item.conversionOrExercisePricePerShare),
      ),
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* 7. Promoter contribution & lock-in                                          */
/* -------------------------------------------------------------------------- */

export type LockInReadiness = {
  applicable: boolean | null;
  requiredPercentage: string;
  postIssueEquityShares: string;
  requiredContributionShares: string;
  earmarkedShares: string;
  eligibleShares: string;
  ineligibleShares: string;
  unclassifiedShares: string;
  shortfallShares: string;
  surplusShares: string;
  eligibleAsPercentageOfPostIssue: string;
  meetsRequirement: boolean | null;
  lotsMissingEligibilityAnswer: number;
  lotsNotDematerialised: number;
  encumberedContributionShares: string;
  encumbrancesRequiringRelease: number;
  totalEncumberedShares: string;
  promoterEncumberedShares: string;
};

export function computeLockInReadiness(
  section: PromoterContributionLockInAndEncumbrances,
  postIssueEquityShares: string,
): LockInReadiness {
  const lots = section.contributionLots;
  const applicable =
    section.minimumPromoterContributionApplicable === 'yes'
      ? true
      : section.minimumPromoterContributionApplicable === 'no'
        ? false
        : null;

  const requiredPercentage = isFilledDecimal(section.targetMinimumContributionPercentage)
    ? toDecimalString(section.targetMinimumContributionPercentage)
    : DEFAULT_MINIMUM_CONTRIBUTION_PERCENTAGE;

  const requiredContributionShares = isPositive(postIssueEquityShares)
    ? ceilShares(percentageOf(requiredPercentage, postIssueEquityShares, 6))
    : '';

  const earmarkedShares = sumDecimals(lots.map((lot) => lot.numberOfShares));
  const eligibleShares = sumDecimals(
    lots
      .filter((lot) => lot.eligibleForMinimumPromoterContribution === 'yes')
      .map((lot) => lot.numberOfShares),
  );
  const ineligibleShares = sumDecimals(
    lots
      .filter((lot) => lot.eligibleForMinimumPromoterContribution === 'no')
      .map((lot) => lot.numberOfShares),
  );
  const unclassifiedShares = sumDecimals(
    lots
      .filter(
        (lot) =>
          lot.eligibleForMinimumPromoterContribution === '' ||
          lot.eligibleForMinimumPromoterContribution === 'not_sure',
      )
      .map((lot) => lot.numberOfShares),
  );

  const shortfallRaw = subtract(requiredContributionShares, eligibleShares || '0');
  const shortfallShares =
    shortfallRaw === '' ? '' : isPositive(shortfallRaw) ? shortfallRaw : '0';
  const surplusShares =
    shortfallRaw === '' ? '' : compare(shortfallRaw, '0') === -1 ? negate(shortfallRaw) : '0';

  const encumbrances: Encumbrance[] = section.encumbrances;
  const promoterEncumberedShares = sumDecimals(
    encumbrances
      .filter(
        (item) => item.holderCategory === 'promoter' || item.holderCategory === 'promoter-group',
      )
      .map((item) => item.numberOfSharesEncumbered),
  );
  const encumberedContributionShares = sumDecimals(
    encumbrances
      .filter((item) => item.affectsPromoterContributionShares === 'yes')
      .map((item) => item.numberOfSharesEncumbered),
  );

  const meetsRequirement =
    requiredContributionShares === '' || eligibleShares === ''
      ? null
      : compare(eligibleShares, requiredContributionShares) !== -1;

  return {
    applicable,
    requiredPercentage,
    postIssueEquityShares: toDecimalString(postIssueEquityShares),
    requiredContributionShares,
    earmarkedShares,
    eligibleShares,
    ineligibleShares,
    unclassifiedShares,
    shortfallShares,
    surplusShares,
    eligibleAsPercentageOfPostIssue: isPositive(postIssueEquityShares)
      ? pct(eligibleShares, postIssueEquityShares, 4)
      : '',
    meetsRequirement,
    lotsMissingEligibilityAnswer: lots.filter(
      (lot) =>
        lot.eligibleForMinimumPromoterContribution === '' ||
        lot.eligibleForMinimumPromoterContribution === 'not_sure',
    ).length,
    lotsNotDematerialised: lots.filter((lot) => lot.dematerialised === 'no').length,
    encumberedContributionShares,
    encumbrancesRequiringRelease: encumbrances.filter(
      (item) =>
        item.affectsPromoterContributionShares === 'yes' &&
        item.willBeReleasedBeforeFiling !== 'yes',
    ).length,
    totalEncumberedShares: sumDecimals(
      encumbrances.map((item) => item.numberOfSharesEncumbered),
    ),
    promoterEncumberedShares,
  };
}

/* -------------------------------------------------------------------------- */
/* 8. Reconciliation                                                           */
/* -------------------------------------------------------------------------- */

export type ReconciliationStatus =
  | 'reconciled'
  | 'variance'
  | 'insufficient_data'
  | 'not_applicable';

export type ReconciliationGroup = 'capital' | 'ownership' | 'offer' | 'lock_in';

export type ReconciliationCheck = {
  id: string;
  group: ReconciliationGroup;
  label: string;
  status: ReconciliationStatus;
  expected: string;
  actual: string;
  difference: string;
  message: string;
};

function compareCheck(
  id: string,
  group: ReconciliationGroup,
  label: string,
  expected: string,
  actual: string,
  messages: { reconciled: string; variance: string; missing: string },
): ReconciliationCheck {
  if (!isFilledDecimal(expected) || !isFilledDecimal(actual)) {
    return {
      id,
      group,
      label,
      status: 'insufficient_data',
      expected,
      actual,
      difference: '',
      message: messages.missing,
    };
  }
  const delta = difference(expected, actual);
  const reconciled = isZero(delta);
  return {
    id,
    group,
    label,
    status: reconciled ? 'reconciled' : 'variance',
    expected,
    actual,
    difference: delta,
    message: reconciled ? messages.reconciled : messages.variance,
  };
}

export function reconcileCapitalOwnership(
  payload: CapitalOwnershipPayload,
  context: {
    totals: CapitalTotals;
    history: CapitalHistoryComputation;
    capTable: CapTable;
    prePost: PrePostIssueView;
    lockIn: LockInReadiness;
    ipoReference: IpoSetupReference;
  },
): ReconciliationCheck[] {
  const { totals, history, capTable, prePost, lockIn, ipoReference } = context;
  const structure = payload.currentCapitalStructure;
  const checks: ReconciliationCheck[] = [];

  checks.push(
    compareCheck(
      'authorised-capital-vs-classes',
      'capital',
      'Authorised equity capital matches the class-wise table',
      totals.declaredAuthorisedEquityCapital,
      totals.authorisedEquityCapitalFromClasses,
      {
        reconciled: 'Declared authorised equity capital equals shares × face value by class.',
        variance:
          'Declared authorised equity capital differs from the class-wise authorised shares × face value.',
        missing: 'Authorised capital or class-wise figures are not yet complete.',
      },
    ),
  );

  checks.push(
    compareCheck(
      'paid-up-capital-vs-classes',
      'capital',
      'Paid-up equity capital matches the class-wise table',
      totals.declaredPaidUpEquityCapital,
      totals.paidUpEquityCapitalFromClasses,
      {
        reconciled: 'Declared paid-up equity capital equals paid-up shares × face value by class.',
        variance:
          'Declared paid-up equity capital differs from the class-wise paid-up shares × face value.',
        missing: 'Paid-up capital or class-wise figures are not yet complete.',
      },
    ),
  );

  checks.push(
    compareCheck(
      'paid-up-capital-vs-audited',
      'capital',
      'Paid-up capital agrees with the latest audited financials',
      structure.paidUpCapitalAsPerLatestAuditedFinancials,
      firstFilled(totals.declaredPaidUpEquityCapital, totals.paidUpEquityCapitalFromClasses),
      {
        reconciled: 'Paid-up capital matches the latest audited financial statements.',
        variance:
          'Paid-up capital differs from the latest audited financial statements. Later capital events may explain this.',
        missing: 'Audited paid-up capital has not been entered.',
      },
    ),
  );

  if (isFilledDecimal(totals.authorisedEquityShares) && isFilledDecimal(totals.issuedEquityShares)) {
    const withinAuthorised = compare(totals.issuedEquityShares, totals.authorisedEquityShares) !== 1;
    checks.push({
      id: 'issued-within-authorised',
      group: 'capital',
      label: 'Issued shares are within authorised shares',
      status: withinAuthorised ? 'reconciled' : 'variance',
      expected: totals.authorisedEquityShares,
      actual: totals.issuedEquityShares,
      difference: difference(totals.authorisedEquityShares, totals.issuedEquityShares),
      message: withinAuthorised
        ? 'Issued equity shares do not exceed the authorised equity shares.'
        : 'Issued equity shares exceed the authorised equity shares.',
    });
  } else {
    checks.push({
      id: 'issued-within-authorised',
      group: 'capital',
      label: 'Issued shares are within authorised shares',
      status: 'insufficient_data',
      expected: totals.authorisedEquityShares,
      actual: totals.issuedEquityShares,
      difference: '',
      message: 'Authorised or issued share counts are not yet entered.',
    });
  }

  checks.push(
    compareCheck(
      'history-closing-vs-current',
      'capital',
      'Share capital history closes at the current share count',
      totals.currentEquityShares,
      history.closingEquityShares,
      {
        reconciled: 'The cumulative history ends at the current equity share count.',
        variance:
          'The cumulative history does not end at the current equity share count. An event may be missing or mis-typed.',
        missing:
          payload.shareCapitalHistory.capitalEvents.length === 0
            ? 'No capital events have been recorded yet.'
            : 'The cumulative history cannot be completed from the events entered.',
      },
    ),
  );

  checks.push(
    compareCheck(
      'register-vs-capital',
      'ownership',
      'Shareholder register totals match the paid-up share count',
      totals.currentEquityShares,
      capTable.totalEquitySharesFromRegister,
      {
        reconciled: 'Shareholder holdings add up to the current equity share count.',
        variance: 'Shareholder holdings do not add up to the current equity share count.',
        missing: 'Shareholder holdings or the current share count are incomplete.',
      },
    ),
  );

  checks.push(
    compareCheck(
      'shareholder-count',
      'ownership',
      'Number of shareholders matches the register',
      payload.shareholdersAndBeneficialOwnership.shareholders.length === 0
        ? ''
        : String(payload.shareholdersAndBeneficialOwnership.shareholders.length),
      payload.shareholdersAndBeneficialOwnership.totalNumberOfShareholders,
      {
        reconciled: 'Recorded shareholder rows match the stated number of shareholders.',
        variance: 'Recorded shareholder rows differ from the stated number of shareholders.',
        missing: 'The stated number of shareholders has not been provided.',
      },
    ),
  );

  const demat = sumDecimals(
    payload.shareholdersAndBeneficialOwnership.shareholders.map((item) =>
      sumDecimals([item.sharesInDematerialisedForm, item.sharesInPhysicalForm]),
    ),
  );
  checks.push(
    compareCheck(
      'demat-plus-physical',
      'ownership',
      'Dematerialised plus physical shares equal holdings',
      capTable.totalEquitySharesFromRegister,
      demat,
      {
        reconciled: 'Dematerialised and physical holdings add up to total holdings.',
        variance: 'Dematerialised plus physical holdings do not equal the total holdings.',
        missing: 'Dematerialised / physical split has not been entered for all shareholders.',
      },
    ),
  );

  const promoterDeclaredShares = sumDecimals(
    payload.promotersAndControl.promoters.map((item) => item.equitySharesHeld),
  );
  checks.push(
    compareCheck(
      'promoter-shares-vs-register',
      'ownership',
      'Promoter holdings match the shareholder register',
      capTable.groups.promoterShares,
      promoterDeclaredShares,
      {
        reconciled: 'Promoter holdings agree between the promoter list and the register.',
        variance: 'Promoter holdings differ between the promoter list and the shareholder register.',
        missing: 'Promoter holdings have not been entered in both places.',
      },
    ),
  );

  const { includesOfs } = offerTypeFlags(ipoReference.proposedOfferType);
  if (!ipoReference.available) {
    checks.push({
      id: 'ofs-vs-ipo-setup',
      group: 'offer',
      label: 'Offer-for-sale size matches IPO Setup',
      status: 'insufficient_data',
      expected: '',
      actual: prePost.totalSharesOfferedForSale,
      difference: '',
      message: 'IPO Setup & Eligibility has not been completed, so the offer size cannot be compared.',
    });
  } else if (!includesOfs && !isPositive(prePost.totalSharesOfferedForSale)) {
    checks.push({
      id: 'ofs-vs-ipo-setup',
      group: 'offer',
      label: 'Offer-for-sale size matches IPO Setup',
      status: 'not_applicable',
      expected: '',
      actual: '',
      difference: '',
      message: 'The proposed offer does not include an offer for sale.',
    });
  } else {
    checks.push(
      compareCheck(
        'ofs-vs-ipo-setup',
        'offer',
        'Offer-for-sale size matches IPO Setup',
        ipoReference.proposedOfsShares,
        prePost.totalSharesOfferedForSale,
        {
          reconciled: 'Shares marked for sale equal the offer-for-sale size in IPO Setup.',
          variance: 'Shares marked for sale differ from the offer-for-sale size in IPO Setup.',
          missing: 'Offer-for-sale quantities are incomplete in one of the two workstreams.',
        },
      ),
    );
  }

  const sellersExceeding = prePost.rows.filter((row) => row.offerExceedsHolding).length;
  checks.push({
    id: 'ofs-within-holdings',
    group: 'offer',
    label: 'Selling shareholders offer only shares they hold',
    status: sellersExceeding > 0 ? 'variance' : isPositive(prePost.totalSharesOfferedForSale) ? 'reconciled' : 'insufficient_data',
    expected: '',
    actual: String(sellersExceeding),
    difference: '',
    message:
      sellersExceeding > 0
        ? `${sellersExceeding} selling shareholder(s) are offering more shares than they hold.`
        : isPositive(prePost.totalSharesOfferedForSale)
          ? 'Every selling shareholder is offering shares within their existing holding.'
          : 'No offer-for-sale quantities have been recorded yet.',
  });

  checks.push(
    compareCheck(
      'pre-issue-shares-vs-ipo-setup',
      'offer',
      'Pre-issue share count matches IPO Setup',
      ipoReference.existingIssuedEquityShares,
      totals.currentEquityShares,
      {
        reconciled: 'Pre-issue equity shares agree with IPO Setup & Eligibility.',
        variance: 'Pre-issue equity shares differ from the figure recorded in IPO Setup & Eligibility.',
        missing: 'Pre-issue equity shares are not yet available in both workstreams.',
      },
    ),
  );

  checks.push({
    id: 'ofs-does-not-increase-capital',
    group: 'offer',
    label: 'Offer for sale does not increase share capital',
    status: prePost.postIssueShares === '' ? 'insufficient_data' : 'reconciled',
    expected: prePost.capitalIncreaseShares,
    actual: prePost.freshIssueShares,
    difference: '',
    message:
      prePost.postIssueShares === ''
        ? 'Post-issue share count is not yet computable.'
        : 'Post-issue capital reflects the fresh issue and recorded pre-issue allotments only; offer-for-sale shares change ownership, not capital.',
  });

  if (lockIn.applicable === false) {
    checks.push({
      id: 'minimum-promoter-contribution',
      group: 'lock_in',
      label: 'Minimum promoter contribution is met',
      status: 'not_applicable',
      expected: '',
      actual: '',
      difference: '',
      message: 'The issuer has indicated that minimum promoter contribution is not applicable.',
    });
  } else if (lockIn.meetsRequirement === null) {
    checks.push({
      id: 'minimum-promoter-contribution',
      group: 'lock_in',
      label: 'Minimum promoter contribution is met',
      status: 'insufficient_data',
      expected: lockIn.requiredContributionShares,
      actual: lockIn.eligibleShares,
      difference: '',
      message: 'Post-issue capital or eligible contribution lots are not yet complete.',
    });
  } else {
    checks.push({
      id: 'minimum-promoter-contribution',
      group: 'lock_in',
      label: 'Minimum promoter contribution is met',
      status: lockIn.meetsRequirement ? 'reconciled' : 'variance',
      expected: lockIn.requiredContributionShares,
      actual: lockIn.eligibleShares,
      difference: lockIn.shortfallShares,
      message: lockIn.meetsRequirement
        ? `Eligible lots cover the indicative ${lockIn.requiredPercentage}% minimum promoter contribution.`
        : `Eligible lots fall short of the indicative ${lockIn.requiredPercentage}% minimum promoter contribution.`,
    });
  }

  checks.push({
    id: 'contribution-shares-unencumbered',
    group: 'lock_in',
    label: 'Contribution shares are free of encumbrances',
    status:
      lockIn.encumbrancesRequiringRelease > 0
        ? 'variance'
        : payload.promoterContributionLockInAndEncumbrances.encumbrances.length === 0
          ? 'insufficient_data'
          : 'reconciled',
    expected: '0',
    actual: lockIn.encumberedContributionShares,
    difference: '',
    message:
      lockIn.encumbrancesRequiringRelease > 0
        ? `${lockIn.encumbrancesRequiringRelease} encumbrance(s) affect contribution shares without a confirmed release before filing.`
        : payload.promoterContributionLockInAndEncumbrances.encumbrances.length === 0
          ? 'No encumbrances have been recorded yet.'
          : 'Recorded encumbrances on contribution shares are marked for release before filing.',
  });

  checks.push(
    compareCheck(
      'contribution-lots-within-promoter-holding',
      'lock_in',
      'Earmarked contribution lots are within promoter holdings',
      capTable.groups.promoterAndGroupShares,
      lockIn.earmarkedShares,
      {
        reconciled: 'Earmarked contribution lots equal the promoter and promoter group holdings.',
        variance:
          'Earmarked contribution lots differ from the promoter and promoter group holdings in the register.',
        missing: 'Contribution lots or promoter holdings are incomplete.',
      },
    ),
  );

  return checks;
}

/* -------------------------------------------------------------------------- */
/* 9. Aggregate model                                                          */
/* -------------------------------------------------------------------------- */

export type CapitalOwnershipModel = {
  totals: CapitalTotals;
  history: CapitalHistoryComputation;
  capTable: CapTable;
  prePost: PrePostIssueView;
  dilution: DilutionView;
  outstanding: OutstandingInstrumentsSummary;
  lockIn: LockInReadiness;
  reconciliation: ReconciliationCheck[];
  faceValuePerShare: string;
};

function additionalPreIssueShares(section: PreAndPostIssueOwnership): string {
  return (
    sumDecimals([
      section.expectedPreIpoPlacementShares,
      section.expectedConversionSharesBeforeIssue,
      section.expectedEsopAllotmentSharesBeforeIssue,
    ]) || '0'
  );
}

/** Single entry point used by the Overview, Information and Capital Assessment tabs. */
export function computeCapitalOwnershipModel(
  payload: CapitalOwnershipPayload,
  ipoReference: IpoSetupReference,
): CapitalOwnershipModel {
  const totals = computeCurrentCapitalTotals(payload.currentCapitalStructure);
  const history = computeCapitalHistoryCumulative(payload.shareCapitalHistory.capitalEvents);
  const capTable = computeCapTable(
    payload.shareholdersAndBeneficialOwnership.shareholders,
    totals,
  );
  const prePost = computePrePostIssue(
    payload.shareholdersAndBeneficialOwnership.shareholders,
    ipoReference,
    payload.preAndPostIssueOwnership.shareholderOverlays,
    {
      preIssueTotalEquityShares: totals.currentEquityShares,
      additionalPreIssueShares: additionalPreIssueShares(payload.preAndPostIssueOwnership),
      freshIssueSharesOverride: payload.preAndPostIssueOwnership.freshIssueSharesOverride,
    },
  );
  const faceValuePerShare = firstFilled(
    totals.impliedEquityFaceValue,
    ipoReference.faceValuePerEquityShare,
  );
  const dilution = computeDilution(prePost, faceValuePerShare);
  const outstanding = computeOutstandingInstruments(
    payload.outstandingSecuritiesTransactionsAndConfirmations,
    prePost.postIssueShares,
  );
  const lockIn = computeLockInReadiness(
    payload.promoterContributionLockInAndEncumbrances,
    prePost.postIssueShares,
  );
  const reconciliation = reconcileCapitalOwnership(payload, {
    totals,
    history,
    capTable,
    prePost,
    lockIn,
    ipoReference,
  });

  return {
    totals,
    history,
    capTable,
    prePost,
    dilution,
    outstanding,
    lockIn,
    reconciliation,
    faceValuePerShare,
  };
}
