/** Display-only DRHP value formatters — mirrors backend export/formatters.py */

import {
  inferColumnSemanticTypes,
  inferSemanticTypeFromHeader,
  isIdentifier,
  isQuantitative,
} from '@/lib/drhp/publication/semantic-types';
import {
  headingsAreDuplicate,
  isInternalHeading,
  normalizeHeadingText,
  shouldSuppressSectionHeading,
} from '@/lib/drhp/publication/theme';

const PLACEHOLDER_TOKEN = '[●]';
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}[T ]/;
const SLUG_LIKE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)+$/;
const FY_PERIOD_RE = /^(?:nivara-)?fy\s*(\d{4})$/i;
const FY_SLUG_RE = /^[a-z0-9]+-fy(\d{4})$/i;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ENUM_OVERRIDES: Record<string, string> = {
  'capital-expenditure': 'Capital expenditure',
  'working-capital': 'Working capital',
  'managing-director': 'Managing Director',
  'non-executive-director': 'Non-Executive Director',
  'book-built': 'Book built',
  promoter: 'Promoter',
  nil: 'Nil',
  'n/a': 'Not Applicable',
};

const NUMERIC_HEADER_HINTS = ['amount', 'shares', 'capital', 'price', 'percent', '₹', 'lakh', 'crore'];
const TEXT_HEADER_HINTS = ['particular', 'description', 'name', 'party', 'parties', 'din', 'cin', 'telephone', 'phone'];

export function formatIndianInteger(value: number): string {
  const negative = value < 0;
  const digits = String(Math.abs(value));
  if (digits.length <= 3) return `${negative ? '-' : ''}${digits}`;
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const parts: string[] = [];
  let remaining = rest;
  while (remaining.length > 0) {
    parts.unshift(remaining.slice(-2));
    remaining = remaining.slice(0, -2);
  }
  return `${negative ? '-' : ''}${parts.join(',')},${lastThree}`;
}

export function formatIndianDecimal(value: number, decimals = 2): string {
  if (Number.isInteger(value)) return formatIndianInteger(value);
  const [whole, fractional] = Math.abs(value).toFixed(decimals).split('.');
  const sign = value < 0 ? '-' : '';
  return `${sign}${formatIndianInteger(Number(whole))}.${fractional}`;
}

export function formatInrAmount(value: number): string {
  if (Number.isInteger(value)) return `₹${formatIndianInteger(value)}`;
  return `₹${formatIndianDecimal(value)}`;
}

export function formatFinancialPeriod(value: string): string {
  const cleaned = value.trim();
  const match = FY_PERIOD_RE.exec(cleaned) ?? FY_SLUG_RE.exec(cleaned);
  if (match) return `FY ${match[1]}`;
  return cleaned;
}

export function formatDate(value: string): string {
  const cleaned = value.trim();
  if (!cleaned) return cleaned;
  const datePart = ISO_DATETIME_RE.test(cleaned) ? cleaned.slice(0, 10) : cleaned;
  if (!ISO_DATE_RE.test(datePart)) return value;
  const [year, month, day] = datePart.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

export function humanizeEnum(value: string): string {
  const lowered = value.trim().toLowerCase();
  if (ENUM_OVERRIDES[lowered]) return ENUM_OVERRIDES[lowered];
  if (FY_SLUG_RE.test(value.trim())) return formatFinancialPeriod(value.trim());
  if (SLUG_LIKE_RE.test(value.trim())) {
    return value.trim().split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return value.trim();
}

function formatQuantitative(value: number, semanticType?: string | null): string {
  const st = semanticType?.toLowerCase();
  if (st === 'share_count' || st === 'shares') return formatIndianInteger(value);
  if (st === 'percentage') return `${value}%`;
  if (['currency_inr', 'currency', 'inr', 'rupee'].includes(st ?? '')) return formatInrAmount(value);
  if (['lakh', 'crore', 'decimal', 'financial_value'].includes(st ?? '')) return formatIndianDecimal(value);
  return formatIndianInteger(value);
}

function formatStringValue(value: string, semanticType?: string | null): string {
  const cleaned = value.trim();
  if (!cleaned) return '';
  if (ENUM_OVERRIDES[cleaned.toLowerCase()]) return ENUM_OVERRIDES[cleaned.toLowerCase()];
  if (cleaned === PLACEHOLDER_TOKEN) return PLACEHOLDER_TOKEN;
  if (semanticType === 'financial_period' || FY_PERIOD_RE.test(cleaned) || FY_SLUG_RE.test(cleaned)) {
    return formatFinancialPeriod(cleaned);
  }
  if (isIdentifier(semanticType)) return cleaned;
  if (ISO_DATE_RE.test(cleaned) || ISO_DATETIME_RE.test(cleaned)) return formatDate(cleaned);
  if (cleaned.startsWith('₹')) {
    const n = Number(cleaned.slice(1).replace(/,/g, ''));
    if (!Number.isNaN(n)) return formatInrAmount(n);
  }
  if (isQuantitative(semanticType)) {
    const numeric = cleaned.replace(/,/g, '').replace('%', '');
    const n = Number(numeric);
    if (!Number.isNaN(n)) {
      if (cleaned.endsWith('%')) return `${n}%`;
      return formatQuantitative(n, semanticType);
    }
  }
  if (SLUG_LIKE_RE.test(cleaned)) return humanizeEnum(cleaned);
  return cleaned.replace(/\bnivara-fy\d{4}\b/gi, (m) => formatFinancialPeriod(m)).trim();
}

function formatDictValue(value: Record<string, unknown>): string {
  for (const key of ['counterparty', 'counterpartyName', 'partyName', 'relatedPartyName', 'entityName', 'companyName', 'name']) {
    if (value[key]) return String(value[key]).trim();
  }
  if (value.line1 || value.city) {
    const parts = ['line1', 'line2', 'line3', 'city', 'state', 'pincode', 'country']
      .map((k) => value[k])
      .filter(Boolean)
      .map(String);
    if (parts.length) return parts.join(', ');
  }
  if (value.identifierValue != null) return String(value.identifierValue).trim();
  return PLACEHOLDER_TOKEN;
}

export function formatDrhpValue(value: unknown, semanticType?: string | null): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (isIdentifier(semanticType)) return String(value);
    if (isQuantitative(semanticType)) return formatQuantitative(value, semanticType);
    return String(value);
  }
  if (typeof value === 'string') return formatStringValue(value, semanticType);
  if (Array.isArray(value)) {
    const parts = value.map((item) => formatDrhpValue(item, semanticType)).filter(Boolean);
    return parts.length ? parts.join(', ') : PLACEHOLDER_TOKEN;
  }
  if (typeof value === 'object') return formatDictValue(value as Record<string, unknown>);
  return PLACEHOLDER_TOKEN;
}

export function formatTableCell(value: unknown, semanticType?: string | null): string {
  return formatDrhpValue(value, semanticType);
}

export function inferColumnAlignments(headers: string[], rows: string[][]): Array<'left' | 'right'> {
  return headers.map((header, colIndex) => {
    const semantic = inferSemanticTypeFromHeader(header);
    if (semantic && isQuantitative(semantic)) return 'right';
    const headerLower = header.toLowerCase();
    if (TEXT_HEADER_HINTS.some((h) => headerLower.includes(h))) return 'left';
    if (NUMERIC_HEADER_HINTS.some((h) => headerLower.includes(h))) return 'right';
    const sample = rows.slice(0, 8).map((row) => row[colIndex] ?? '');
    const numericHits = sample.filter((cell) => /^[₹-]?\d/.test(cell.trim())).length;
    return sample.length && numericHits >= Math.max(1, Math.floor(sample.length / 2)) ? 'right' : 'left';
  });
}

export {
  headingsAreDuplicate,
  inferColumnSemanticTypes,
  inferSemanticTypeFromHeader,
  isInternalHeading,
  normalizeHeadingText,
  shouldSuppressSectionHeading,
};
