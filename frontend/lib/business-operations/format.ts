/**
 * Display formatting for Business & Operations.
 *
 * Reuses Capital & Ownership helpers. Share-count formatting is exposed as
 * `formatCount` for operational headcount / unit figures.
 */

export {
  EM_DASH,
  amountUnitLabel,
  formatDate,
  formatDecimal,
  formatIndianDecimal,
  formatMoney,
  formatMoneyCompact,
  formatPercent,
  formatShares as formatCount,
  formatShares,
  parseAmountInput,
  rupeesToUnitValue,
  unitMultiplier,
  unitSuffix,
  unitValueToRupees,
} from '@/lib/capital-ownership/format';

export type { IndianFormatOptions } from '@/lib/capital-ownership/format';
