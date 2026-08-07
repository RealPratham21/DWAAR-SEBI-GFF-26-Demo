/**
 * Display formatting for Financials & KPIs.
 */

import {
  div,
  isFilledDecimal,
  mul,
  toDecimalString,
} from '@/lib/financials-kpis/decimal';
import {
  EM_DASH,
  formatIndianDecimal,
  formatMoney as formatMoneyBase,
  formatPercent as formatPercentBase,
  type IndianFormatOptions,
} from '@/lib/capital-ownership/format';
import { SOURCE_STATUS_LABELS } from '@/lib/financials-kpis/options';
import type { DisplayUnit, SourceStatus } from '@/lib/schemas/financials-kpis';

export {
  EM_DASH,
  formatDate,
  formatDecimal,
  formatIndianDecimal,
  formatMoneyCompact,
  formatShares,
  parseAmountInput,
} from '@/lib/capital-ownership/format';

export type { IndianFormatOptions };

const DISPLAY_UNIT_MULTIPLIERS: Record<DisplayUnit, string> = {
  rupees: '1',
  thousand: '1000',
  lakh: '100000',
  crore: '10000000',
  million: '1000000',
};

const DISPLAY_UNIT_SUFFIXES: Record<DisplayUnit, string> = {
  rupees: '',
  thousand: ' thousand',
  lakh: ' lakh',
  crore: ' crore',
  million: ' million',
};

export function displayUnitMultiplier(unit: DisplayUnit | ''): string {
  if (!unit) return '1';
  return DISPLAY_UNIT_MULTIPLIERS[unit] ?? '1';
}

export function displayUnitSuffix(unit: DisplayUnit | ''): string {
  if (!unit) return '';
  return DISPLAY_UNIT_SUFFIXES[unit] ?? '';
}

/** Convert rupee payload amount into the chosen display unit. */
export function rupeesToDisplayUnit(
  rupees: string | null | undefined,
  unit: DisplayUnit | '',
  decimalPlaces = 6,
): string {
  if (!unit || unit === 'rupees') return toDecimalString(rupees);
  return div(rupees, displayUnitMultiplier(unit), decimalPlaces);
}

/** Convert a display-unit value back into rupees for the payload. */
export function displayUnitToRupees(value: string | null | undefined, unit: DisplayUnit | ''): string {
  if (!unit || unit === 'rupees') return toDecimalString(value);
  return mul(value, displayUnitMultiplier(unit));
}

export function formatMoney(
  value: string | null | undefined,
  displayUnit: DisplayUnit | '' = 'rupees',
  options: IndianFormatOptions = {},
): string {
  if (!isFilledDecimal(value)) return options.fallback ?? EM_DASH;
  if (!displayUnit || displayUnit === 'rupees') {
    return formatMoneyBase(value, 'rupees', options);
  }
  const converted = rupeesToDisplayUnit(value, displayUnit);
  const formatted = formatIndianDecimal(converted, options);
  const suffix = displayUnitSuffix(displayUnit);
  return suffix ? `${formatted}${suffix}` : formatted;
}

export function formatPercent(
  value: string | null | undefined,
  fractionDigits = 2,
  fallback: string = EM_DASH,
): string {
  return formatPercentBase(value, fractionDigits, fallback);
}

export type SourceStatusBadgeVariant =
  | 'audited'
  | 'restated'
  | 'estimate'
  | 'pending'
  | 'unavailable'
  | 'neutral';

export function sourceStatusBadgeVariant(status: SourceStatus | ''): SourceStatusBadgeVariant {
  switch (status) {
    case 'audited_financial_statements':
    case 'auditor_certificate':
      return 'audited';
    case 'restated_financial_information':
      return 'restated';
    case 'management_accounts':
    case 'management_estimate':
      return 'estimate';
    case 'pending_confirmation':
      return 'pending';
    case 'not_available':
      return 'unavailable';
    default:
      return 'neutral';
  }
}

export function formatSourceStatus(status: SourceStatus | ''): string {
  if (!status) return EM_DASH;
  return SOURCE_STATUS_LABELS[status] ?? status;
}

export function sourceStatusBadgeLabel(status: SourceStatus | ''): string {
  return formatSourceStatus(status);
}

export function isAuditedOrRestatedSource(status: SourceStatus | ''): boolean {
  return (
    status === 'audited_financial_statements' ||
    status === 'restated_financial_information' ||
    status === 'auditor_certificate'
  );
}

export function isEstimateSource(status: SourceStatus | ''): boolean {
  return status === 'management_accounts' || status === 'management_estimate';
}
