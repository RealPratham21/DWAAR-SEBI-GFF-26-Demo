/**
 * Decimal-safe helpers for Intermediaries & Filing.
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

export function subtractDecimals(minuend: string, subtrahend: string): string {
  const a = parseDecimal(minuend);
  const b = parseDecimal(subtrahend);
  if (a === null && b === null) return '';
  return formatDecimal((a ?? 0) - (b ?? 0));
}

export function divideDecimals(numerator: string, denominator: string): string | null {
  const a = parseDecimal(numerator);
  const b = parseDecimal(denominator);
  if (a === null || b === null || b === 0) return null;
  return formatDecimal((a / b) * 100);
}

export function parseIsoDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

export function daysBetweenDates(fromDate: string, toDate: string): number | null {
  const from = parseIsoDate(fromDate);
  const to = parseIsoDate(toDate);
  if (!from || !to) return null;
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
