/**
 * Display formatting for Objects of the Issue.
 *
 * Reuses Capital & Ownership helpers. Repeatable-record counts are exposed as
 * `formatCount` for readability in overview cards and tables.
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
