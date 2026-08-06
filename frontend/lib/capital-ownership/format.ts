/**
 * Display formatting for Capital & Ownership.
 *
 * Formatting operates on Decimal-safe STRINGS and never routes a payload value through
 * `Number`, so large share counts and paise-level amounts render exactly as stored.
 * The payload always holds money in rupees; `amountDisplayUnit` only changes what the user
 * types and reads.
 */

import {
  div,
  isFilledDecimal,
  mul,
  round,
  toDecimalString,
  toFixedString,
} from '@/lib/capital-ownership/decimal';
import type { AmountUnit } from '@/lib/capital-ownership/types';

export const EM_DASH = '—';

const UNIT_MULTIPLIERS: Record<AmountUnit, string> = {
  rupees: '1',
  lakh: '100000',
  crore: '10000000',
};

const UNIT_SUFFIXES: Record<AmountUnit, string> = {
  rupees: '',
  lakh: ' lakh',
  crore: ' crore',
};

export function unitMultiplier(unit: AmountUnit): string {
  return UNIT_MULTIPLIERS[unit] ?? '1';
}

export function unitSuffix(unit: AmountUnit): string {
  return UNIT_SUFFIXES[unit] ?? '';
}

/** Convert a rupee amount into the chosen display unit (returns a decimal string). */
export function rupeesToUnitValue(
  rupees: string | null | undefined,
  unit: AmountUnit,
  decimalPlaces = 6,
): string {
  if (unit === 'rupees') return toDecimalString(rupees);
  return div(rupees, unitMultiplier(unit), decimalPlaces);
}

/** Convert a value typed in the chosen display unit back into rupees for the payload. */
export function unitValueToRupees(value: string | null | undefined, unit: AmountUnit): string {
  if (unit === 'rupees') return toDecimalString(value);
  return mul(value, unitMultiplier(unit));
}

/** Group an integer digit string with Indian separators (last three, then pairs). */
function groupIndian(integerDigits: string): string {
  if (integerDigits.length <= 3) return integerDigits;
  const lastThree = integerDigits.slice(-3);
  const rest = integerDigits.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}`;
}

export type IndianFormatOptions = {
  /** Fixed number of decimals. When omitted, trailing zeros are dropped. */
  fractionDigits?: number;
  fallback?: string;
};

/** Format a decimal string with Indian digit grouping. */
export function formatIndianDecimal(
  value: string | null | undefined,
  options: IndianFormatOptions = {},
): string {
  const fallback = options.fallback ?? EM_DASH;
  const normalised =
    options.fractionDigits === undefined
      ? toDecimalString(value)
      : toFixedString(value, options.fractionDigits);
  if (normalised === '') return fallback;
  const negative = normalised.charAt(0) === '-';
  const unsigned = negative ? normalised.slice(1) : normalised;
  const dotIndex = unsigned.indexOf('.');
  const integerDigits = dotIndex === -1 ? unsigned : unsigned.slice(0, dotIndex);
  const fractionDigits = dotIndex === -1 ? '' : unsigned.slice(dotIndex + 1);
  const grouped = groupIndian(integerDigits);
  const body = fractionDigits ? `${grouped}.${fractionDigits}` : grouped;
  return negative ? `-${body}` : body;
}

/** Format a rupee amount, optionally converted into the chosen display unit. */
export function formatMoney(
  rupees: string | null | undefined,
  unit: AmountUnit = 'rupees',
  options: IndianFormatOptions = {},
): string {
  const fallback = options.fallback ?? EM_DASH;
  if (!isFilledDecimal(rupees)) return fallback;
  const converted = rupeesToUnitValue(rupees, unit, 4);
  const fractionDigits = options.fractionDigits ?? (unit === 'rupees' ? undefined : 2);
  const formatted = formatIndianDecimal(converted, { fractionDigits, fallback });
  if (formatted === fallback) return fallback;
  return `₹${formatted}${unitSuffix(unit)}`;
}

/** Pick the most readable unit automatically (crore, then lakh, then rupees). */
export function formatMoneyCompact(
  rupees: string | null | undefined,
  fallback: string = EM_DASH,
): string {
  if (!isFilledDecimal(rupees)) return fallback;
  const normalised = toDecimalString(rupees);
  const magnitude = normalised.charAt(0) === '-' ? normalised.slice(1) : normalised;
  const integerLength = (magnitude.split('.')[0] ?? '').replace(/^0+(?=\d)/, '').length;
  if (integerLength >= 8) return formatMoney(rupees, 'crore', { fractionDigits: 2, fallback });
  if (integerLength >= 6) return formatMoney(rupees, 'lakh', { fractionDigits: 2, fallback });
  return formatMoney(rupees, 'rupees', { fallback });
}

/** Share counts are whole numbers; render them grouped without decimals. */
export function formatShares(
  value: string | null | undefined,
  fallback: string = EM_DASH,
): string {
  if (!isFilledDecimal(value)) return fallback;
  return formatIndianDecimal(value, { fallback });
}

export function formatPercent(
  value: string | null | undefined,
  fractionDigits = 2,
  fallback: string = EM_DASH,
): string {
  if (!isFilledDecimal(value)) return fallback;
  const formatted = formatIndianDecimal(value, { fractionDigits, fallback });
  if (formatted === fallback) return fallback;
  return `${formatted}%`;
}

export function formatDecimal(
  value: string | null | undefined,
  fractionDigits?: number,
  fallback: string = EM_DASH,
): string {
  return formatIndianDecimal(value, { fractionDigits, fallback });
}

/** Per-share prices normally read better with two decimals. */
export function formatPricePerShare(
  value: string | null | undefined,
  fallback: string = EM_DASH,
): string {
  if (!isFilledDecimal(value)) return fallback;
  return `₹${formatIndianDecimal(round(value, 2), { fallback })}`;
}

/**
 * Normalise raw keyboard input (commas, spaces, rupee sign) into a payload-safe decimal
 * string. Partial input such as `'12.'` normalises to `'12'`; unparseable input yields `''`.
 */
export function parseAmountInput(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  const trimmed = String(raw).trim();
  if (trimmed === '') return '';
  const withoutTrailingDot = trimmed.replace(/\.$/, '');
  return toDecimalString(withoutTrailingDot);
}

/** Human label for a display unit, used in field suffixes and column headers. */
export function amountUnitLabel(unit: AmountUnit): string {
  switch (unit) {
    case 'lakh':
      return '₹ lakh';
    case 'crore':
      return '₹ crore';
    default:
      return '₹';
  }
}

export function formatDate(value: string | null | undefined, fallback: string = EM_DASH): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
