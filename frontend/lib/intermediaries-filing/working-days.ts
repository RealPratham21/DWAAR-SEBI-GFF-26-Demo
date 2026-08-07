/**
 * Preliminary working-day helpers for issue programme T+3 scheduling (IF1).
 *
 * Uses weekend-only logic. Exchange holidays are not available in IF1.
 */

import { formatIsoDate, parseIsoDate } from '@/lib/intermediaries-filing/decimal';

export function addWorkingDays(dateInput: string | Date, days: number): string {
  const start =
    typeof dateInput === 'string'
      ? parseIsoDate(dateInput) ?? new Date(dateInput)
      : new Date(dateInput);
  if (Number.isNaN(start.getTime())) return '';

  const result = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return formatIsoDate(result);
}

export type PreliminaryTPlus3Schedule = {
  t: string;
  tPlus1: string;
  tPlus2: string;
  tPlus3: string;
  disclaimer: string;
};

const T_PLUS3_DISCLAIMER =
  'Preliminary working-day schedule based on Saturday/Sunday exclusion only. Exchange holidays and authoritative listing calendars require professional and exchange confirmation.';

export function computePreliminaryTPlus3(issueClosingDate: string): PreliminaryTPlus3Schedule {
  const t = issueClosingDate.trim();
  if (!t || !parseIsoDate(t)) {
    return {
      t: '',
      tPlus1: '',
      tPlus2: '',
      tPlus3: '',
      disclaimer: T_PLUS3_DISCLAIMER,
    };
  }

  return {
    t,
    tPlus1: addWorkingDays(t, 1),
    tPlus2: addWorkingDays(t, 2),
    tPlus3: addWorkingDays(t, 3),
    disclaimer: T_PLUS3_DISCLAIMER,
  };
}
