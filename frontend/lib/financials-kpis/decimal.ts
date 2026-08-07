/**
 * Decimal-safe string arithmetic for Financials & KPIs.
 *
 * Re-exports the shared Capital & Ownership helpers so every workstream shares one
 * fixed-point implementation.
 */

export {
  DECIMAL_ZERO,
  abs,
  add,
  compare,
  difference,
  differsBeyond,
  div,
  equals,
  greaterThan,
  isBlank,
  isFilledDecimal,
  isInvalidDecimal,
  isNegative,
  isPositive,
  isWholeNumber,
  isZero,
  lessThan,
  maxDecimal,
  minDecimal,
  mul,
  negate,
  parseDecimal,
  pct,
  percentageOf,
  round,
  subtract,
  subtract as sub,
  sumDecimals,
  sumDecimalsStrict,
  toDecimalString,
  toFixedString,
  toNumber,
} from '@/lib/capital-ownership/decimal';

export type { DecimalString } from '@/lib/capital-ownership/decimal';
