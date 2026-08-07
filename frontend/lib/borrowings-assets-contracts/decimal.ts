/**
 * Decimal-safe helpers for Borrowings, Assets & Contracts.
 */

export function parseDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function isFilledDecimal(value: string): boolean {
  return parseDecimal(value) !== null;
}

export function formatDecimal(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value)) return '';
  return value.toFixed(fractionDigits).replace(/\.?0+$/, '') || '0';
}

export function addDecimals(...values: string[]): string {
  let total = 0;
  let hasValue = false;
  for (const value of values) {
    const parsed = parseDecimal(value);
    if (parsed !== null) {
      total += parsed;
      hasValue = true;
    }
  }
  return hasValue ? formatDecimal(total) : '';
}

export function divideDecimals(numerator: string, denominator: string): string | null {
  const num = parseDecimal(numerator);
  const den = parseDecimal(denominator);
  if (num === null || den === null || den === 0) return null;
  return formatDecimal((num / den) * 100);
}

export function percentageOf(part: string, whole: string): string | null {
  return divideDecimals(part, whole);
}

export function subtractDecimals(minuend: string, subtrahend: string): string {
  const a = parseDecimal(minuend);
  const b = parseDecimal(subtrahend);
  if (a === null && b === null) return '';
  return formatDecimal((a ?? 0) - (b ?? 0));
}
