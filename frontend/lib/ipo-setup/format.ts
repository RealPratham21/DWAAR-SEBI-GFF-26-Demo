/** Amount formatting helpers for IPO Setup (display only; payload stores rupees). */

import type { AmountUnit } from '@/lib/ipo-setup/types';

const LAKH = 100_000;
const CRORE = 10_000_000;

export function unitMultiplier(unit: AmountUnit): number {
  return unit === 'lakh' ? LAKH : CRORE;
}

export function rupeesToDisplay(rupees: number | null | undefined, unit: AmountUnit): string {
  if (rupees === null || rupees === undefined || Number.isNaN(rupees)) return '';
  const value = rupees / unitMultiplier(unit);
  return formatIndianNumber(value);
}

export function displayToRupees(display: string, unit: AmountUnit): number | null {
  const cleaned = display.replace(/,/g, '').trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return parsed * unitMultiplier(unit);
}

export function formatIndianNumber(value: number): string {
  if (!Number.isFinite(value)) return '';
  const negative = value < 0;
  const abs = Math.abs(value);
  const [intPart, fracPart] = abs.toFixed(abs % 1 === 0 ? 0 : 2).split('.');
  const lastThree = intPart.slice(-3);
  const other = intPart.slice(0, -3);
  const grouped = other
    ? `${other.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}`
    : lastThree;
  const withFrac = fracPart ? `${grouped}.${fracPart}` : grouped;
  return negative ? `-${withFrac}` : withFrac;
}

export function formatRupeesCompact(rupees: number | null | undefined): string {
  if (rupees === null || rupees === undefined || Number.isNaN(rupees)) return '—';
  if (Math.abs(rupees) >= CRORE) {
    return `₹${formatIndianNumber(rupees / CRORE)} crore`;
  }
  if (Math.abs(rupees) >= LAKH) {
    return `₹${formatIndianNumber(rupees / LAKH)} lakh`;
  }
  return `₹${formatIndianNumber(rupees)}`;
}

export function formatShares(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return formatIndianNumber(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${formatIndianNumber(Number(value.toFixed(2)))}%`;
}
