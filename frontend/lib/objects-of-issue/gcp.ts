/**
 * General Corporate Purposes (GCP) cap helper for Objects of the Issue.
 *
 * SEBI ICDR practice caps the General Corporate Purposes object at the lower of a percentage
 * of the fresh issue proceeds and an absolute rupee ceiling. Both figures are indicative
 * defaults for this demo and are versioned so a future rule change never silently reinterprets
 * an already-computed cap — always read `ruleVersion` alongside the amounts.
 *
 * Issue expenses are a distinct object from GCP and are NEVER counted towards the GCP cap or
 * folded into `gcpProposedAmount`; see `gcpIncludesIssueExpenses` in `compute.ts`, which is
 * always `false` by construction.
 */

import { minDecimal, percentageOf, toDecimalString } from '@/lib/objects-of-issue/decimal';

export const GCP_RULE_VERSION = 1 as const;

/** Percentage of fresh-issue proceeds indicatively available for General Corporate Purposes. */
export const GCP_PERCENT_OF_FRESH_PROCEEDS = '15';

/** Absolute rupee ceiling on General Corporate Purposes (₹10 crore). */
export const GCP_ABSOLUTE_CAP_RUPEES = '100000000';

export type GcpCapResult = {
  percentCap: string;
  absoluteCap: string;
  applicableCap: string;
  ruleVersion: typeof GCP_RULE_VERSION;
};

export function calculateGcpCap(freshIssueProceedsRupees: string): GcpCapResult {
  const percentCap = percentageOf(GCP_PERCENT_OF_FRESH_PROCEEDS, freshIssueProceedsRupees, 2);
  const absoluteCap = toDecimalString(GCP_ABSOLUTE_CAP_RUPEES);
  const applicableCap =
    percentCap === '' ? absoluteCap : minDecimal(percentCap, absoluteCap);
  return {
    percentCap,
    absoluteCap,
    applicableCap,
    ruleVersion: GCP_RULE_VERSION,
  };
}
