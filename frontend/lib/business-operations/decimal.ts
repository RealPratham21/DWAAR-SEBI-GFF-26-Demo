/**
 * Decimal-safe string arithmetic for Business & Operations.
 *
 * Re-exports the Capital & Ownership helpers so both workstreams share one
 * fixed-point implementation. `sub` is an alias for `subtract`.
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
