/**
 * Decimal-safe string arithmetic for Capital & Ownership.
 *
 * The persisted payload stores every amount, share count, ratio and percentage as a plain
 * decimal STRING (`''` when not provided). No third-party decimal dependency is added; the
 * helpers below implement exact fixed-point arithmetic on top of `BigInt`, so share counts
 * beyond `Number.MAX_SAFE_INTEGER` and rupee amounts with paise are never subject to binary
 * floating-point drift.
 *
 * Conventions used across the module:
 * - An input of `''`, `null`, `undefined` or an unparseable string is "absent".
 * - Every operation returns `''` when the result cannot be computed. `''` therefore means
 *   "not available", exactly as it does in the payload.
 * - `toNumber` exists only for charting/sorting; never round-trip a payload value through it.
 */

export type DecimalString = string;

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const TEN = BigInt(10);

const DECIMAL_PATTERN = /^[+-]?\d+(\.\d+)?$/;
const DEFAULT_DIVISION_SCALE = 12;
const MAX_SCALE = 30;

type Fixed = {
  /** Unscaled signed value: real value = `unscaled / 10 ** scale`. */
  unscaled: bigint;
  scale: number;
};

function pow10(exponent: number): bigint {
  let result = ONE;
  for (let index = 0; index < exponent; index += 1) result = result * TEN;
  return result;
}

function absBigInt(value: bigint): bigint {
  return value < ZERO ? -value : value;
}

/** Integer division rounding half away from zero. */
function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator === ZERO) return ZERO;
  const negative = (numerator < ZERO) !== (denominator < ZERO);
  const absNumerator = absBigInt(numerator);
  const absDenominator = absBigInt(denominator);
  const quotient = absNumerator / absDenominator;
  const remainder = absNumerator % absDenominator;
  const rounded = remainder * TWO >= absDenominator ? quotient + ONE : quotient;
  return negative ? -rounded : rounded;
}

function rescale(value: Fixed, scale: number): Fixed {
  if (value.scale === scale) return value;
  if (scale > value.scale) {
    return { unscaled: value.unscaled * pow10(scale - value.scale), scale };
  }
  return { unscaled: divideRoundHalfUp(value.unscaled, pow10(value.scale - scale)), scale };
}

function align(a: Fixed, b: Fixed): { left: Fixed; right: Fixed; scale: number } {
  const scale = Math.max(a.scale, b.scale);
  return { left: rescale(a, scale), right: rescale(b, scale), scale };
}

/** Parse a raw string into fixed-point form. Returns `null` when absent or unparseable. */
export function parseDecimal(raw: string | null | undefined): Fixed | null {
  if (raw === null || raw === undefined) return null;
  const cleaned = String(raw).replace(/[\s,_₹]/g, '');
  if (cleaned === '' || !DECIMAL_PATTERN.test(cleaned)) return null;
  const negative = cleaned.charAt(0) === '-';
  const unsigned = cleaned.replace(/^[+-]/, '');
  const dotIndex = unsigned.indexOf('.');
  const integerPart = dotIndex === -1 ? unsigned : unsigned.slice(0, dotIndex);
  const fractionPart = dotIndex === -1 ? '' : unsigned.slice(dotIndex + 1);
  const digits = `${integerPart}${fractionPart}`;
  const unscaled = BigInt(digits);
  return { unscaled: negative ? -unscaled : unscaled, scale: fractionPart.length };
}

function fixedToString(value: Fixed): string {
  const negative = value.unscaled < ZERO;
  let digits = absBigInt(value.unscaled).toString();
  let integerPart = digits;
  let fractionPart = '';
  if (value.scale > 0) {
    if (digits.length <= value.scale) digits = digits.padStart(value.scale + 1, '0');
    integerPart = digits.slice(0, digits.length - value.scale);
    fractionPart = digits.slice(digits.length - value.scale).replace(/0+$/, '');
  }
  integerPart = integerPart.replace(/^0+(?=\d)/, '');
  const body = fractionPart ? `${integerPart}.${fractionPart}` : integerPart;
  if (body === '0') return '0';
  return negative ? `-${body}` : body;
}

/** `true` when the value is a usable decimal (i.e. not empty and parseable). */
export function isFilledDecimal(value: string | null | undefined): boolean {
  return parseDecimal(value) !== null;
}

/** `true` when the value is empty / whitespace-only. */
export function isBlank(value: string | null | undefined): boolean {
  return value === null || value === undefined || String(value).trim() === '';
}

/** `true` when a non-empty value cannot be parsed as a decimal. */
export function isInvalidDecimal(value: string | null | undefined): boolean {
  return !isBlank(value) && parseDecimal(value) === null;
}

/** Normalise raw user input into the canonical payload form (`''` when absent/invalid). */
export function toDecimalString(raw: string | null | undefined): DecimalString {
  const parsed = parseDecimal(raw);
  return parsed === null ? '' : fixedToString(parsed);
}

export function add(a: string | null | undefined, b: string | null | undefined): DecimalString {
  const left = parseDecimal(a);
  const right = parseDecimal(b);
  if (left === null || right === null) return '';
  const aligned = align(left, right);
  return fixedToString({
    unscaled: aligned.left.unscaled + aligned.right.unscaled,
    scale: aligned.scale,
  });
}

export function subtract(a: string | null | undefined, b: string | null | undefined): DecimalString {
  const left = parseDecimal(a);
  const right = parseDecimal(b);
  if (left === null || right === null) return '';
  const aligned = align(left, right);
  return fixedToString({
    unscaled: aligned.left.unscaled - aligned.right.unscaled,
    scale: aligned.scale,
  });
}

export function mul(a: string | null | undefined, b: string | null | undefined): DecimalString {
  const left = parseDecimal(a);
  const right = parseDecimal(b);
  if (left === null || right === null) return '';
  return fixedToString({
    unscaled: left.unscaled * right.unscaled,
    scale: left.scale + right.scale,
  });
}

export function div(
  a: string | null | undefined,
  b: string | null | undefined,
  decimalPlaces: number = DEFAULT_DIVISION_SCALE,
): DecimalString {
  const left = parseDecimal(a);
  const right = parseDecimal(b);
  if (left === null || right === null || right.unscaled === ZERO) return '';
  const scale = Math.max(0, Math.min(MAX_SCALE, Math.trunc(decimalPlaces)));
  const shift = scale + right.scale - left.scale;
  let numerator = left.unscaled;
  let denominator = right.unscaled;
  if (shift >= 0) numerator = numerator * pow10(shift);
  else denominator = denominator * pow10(-shift);
  return fixedToString({ unscaled: divideRoundHalfUp(numerator, denominator), scale });
}

/** `part` as a percentage of `total`. Returns `''` when either side is absent or total is zero. */
export function pct(
  part: string | null | undefined,
  total: string | null | undefined,
  decimalPlaces = 6,
): DecimalString {
  const scaled = mul(part, '100');
  if (scaled === '') return '';
  return div(scaled, total, decimalPlaces);
}

/** Apply a percentage to a base value: `percentageOf('20', '1000') === '200'`. */
export function percentageOf(
  percentage: string | null | undefined,
  base: string | null | undefined,
  decimalPlaces = 6,
): DecimalString {
  const product = mul(percentage, base);
  if (product === '') return '';
  return div(product, '100', decimalPlaces);
}

export function negate(value: string | null | undefined): DecimalString {
  const parsed = parseDecimal(value);
  if (parsed === null) return '';
  return fixedToString({ unscaled: -parsed.unscaled, scale: parsed.scale });
}

export function abs(value: string | null | undefined): DecimalString {
  const parsed = parseDecimal(value);
  if (parsed === null) return '';
  return fixedToString({ unscaled: absBigInt(parsed.unscaled), scale: parsed.scale });
}

/** Round to a fixed number of decimal places (half away from zero). */
export function round(value: string | null | undefined, decimalPlaces = 2): DecimalString {
  const parsed = parseDecimal(value);
  if (parsed === null) return '';
  const scale = Math.max(0, Math.min(MAX_SCALE, Math.trunc(decimalPlaces)));
  return fixedToString(rescale(parsed, scale));
}

/** `-1 | 0 | 1`, or `null` when either side is absent. */
export function compare(a: string | null | undefined, b: string | null | undefined): number | null {
  const left = parseDecimal(a);
  const right = parseDecimal(b);
  if (left === null || right === null) return null;
  const aligned = align(left, right);
  if (aligned.left.unscaled < aligned.right.unscaled) return -1;
  if (aligned.left.unscaled > aligned.right.unscaled) return 1;
  return 0;
}

export function isZero(value: string | null | undefined): boolean {
  const parsed = parseDecimal(value);
  return parsed !== null && parsed.unscaled === ZERO;
}

export function isPositive(value: string | null | undefined): boolean {
  const parsed = parseDecimal(value);
  return parsed !== null && parsed.unscaled > ZERO;
}

export function isNegative(value: string | null | undefined): boolean {
  const parsed = parseDecimal(value);
  return parsed !== null && parsed.unscaled < ZERO;
}

export function greaterThan(a: string | null | undefined, b: string | null | undefined): boolean {
  return compare(a, b) === 1;
}

export function lessThan(a: string | null | undefined, b: string | null | undefined): boolean {
  return compare(a, b) === -1;
}

export function equals(a: string | null | undefined, b: string | null | undefined): boolean {
  return compare(a, b) === 0;
}

export function maxDecimal(a: string | null | undefined, b: string | null | undefined): DecimalString {
  const result = compare(a, b);
  if (result === null) return '';
  return result >= 0 ? toDecimalString(a) : toDecimalString(b);
}

export function minDecimal(a: string | null | undefined, b: string | null | undefined): DecimalString {
  const result = compare(a, b);
  if (result === null) return '';
  return result <= 0 ? toDecimalString(a) : toDecimalString(b);
}

/**
 * Sum every parseable value, ignoring blanks.
 * Returns `''` when no value in the list is present, so empty tables render as "—" rather
 * than a misleading zero.
 */
export function sumDecimals(values: Array<string | null | undefined>): DecimalString {
  let total: Fixed | null = null;
  for (const value of values) {
    const parsed = parseDecimal(value);
    if (parsed === null) continue;
    if (total === null) {
      total = parsed;
      continue;
    }
    const aligned = align(total, parsed);
    total = {
      unscaled: aligned.left.unscaled + aligned.right.unscaled,
      scale: aligned.scale,
    };
  }
  return total === null ? '' : fixedToString(total);
}

/** Like `sumDecimals` but returns `''` if any entry is present-but-unparseable or missing. */
export function sumDecimalsStrict(values: Array<string | null | undefined>): DecimalString {
  let total = '0';
  for (const value of values) {
    total = add(total, value);
    if (total === '') return '';
  }
  return total;
}

/** Absolute difference between two values; `''` when either is absent. */
export function difference(a: string | null | undefined, b: string | null | undefined): DecimalString {
  return abs(subtract(a, b));
}

/** `true` when both values are present and differ by more than `tolerance`. */
export function differsBeyond(
  a: string | null | undefined,
  b: string | null | undefined,
  tolerance = '0',
): boolean {
  const delta = difference(a, b);
  if (delta === '') return false;
  return greaterThan(delta, tolerance);
}

/** Display/sorting only — never write the result back into the payload. */
export function toNumber(value: string | null | undefined): number | null {
  const normalised = toDecimalString(value);
  if (normalised === '') return null;
  const parsed = Number(normalised);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Fixed-point string with exactly `decimalPlaces` digits after the point (`''` when absent). */
export function toFixedString(value: string | null | undefined, decimalPlaces = 2): string {
  const parsed = parseDecimal(value);
  if (parsed === null) return '';
  const scale = Math.max(0, Math.min(MAX_SCALE, Math.trunc(decimalPlaces)));
  const scaled = rescale(parsed, scale);
  const negative = scaled.unscaled < ZERO;
  let digits = absBigInt(scaled.unscaled).toString();
  if (scale === 0) return negative && digits !== '0' ? `-${digits}` : digits;
  digits = digits.padStart(scale + 1, '0');
  const integerPart = digits.slice(0, digits.length - scale).replace(/^0+(?=\d)/, '');
  const fractionPart = digits.slice(digits.length - scale);
  const body = `${integerPart}.${fractionPart}`;
  return negative && !/^0(\.0*)?$/.test(body) ? `-${body}` : body;
}

/** `true` when the value is a whole number (used for share-count validation). */
export function isWholeNumber(value: string | null | undefined): boolean {
  const parsed = parseDecimal(value);
  if (parsed === null) return false;
  if (parsed.scale === 0) return true;
  return parsed.unscaled % pow10(parsed.scale) === ZERO;
}

/** Zero as a canonical decimal string. */
export const DECIMAL_ZERO: DecimalString = '0';
