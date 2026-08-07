'use client';

import { useState, type ReactNode } from 'react';
import {
  fieldClassName,
  FormField,
  SectionCard,
} from '@/components/company-incorporation/form-primitives';
import {
  CheckboxField,
  ComputedStat,
  SelectField,
  TextInputField,
} from '@/components/ipo-setup/form-helpers';
import {
  formatMoney,
  formatSourceStatus,
  parseAmountInput,
  rupeesToDisplayUnit,
  displayUnitToRupees,
  sourceStatusBadgeVariant,
  type SourceStatusBadgeVariant,
} from '@/lib/financials-kpis/format';
import { SOURCE_STATUS_OPTIONS, YES_NO_NOT_SURE_OPTIONS } from '@/lib/financials-kpis/options';
import type { DisplayUnit, SourceStatus, YesNoNotSureOrEmpty } from '@/lib/schemas/financials-kpis';
import type { FinancialPeriod } from '@/lib/schemas/financials-kpis';
import { cn } from '@/lib/utils';

export { CheckboxField, ComputedStat, SelectField, TextInputField, SectionCard };

const yesNoNotSureOptions = YES_NO_NOT_SURE_OPTIONS;

export function FieldGrid({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={
        columns === 3
          ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
          : 'grid gap-4 md:grid-cols-2'
      }
    >
      {children}
    </div>
  );
}

export function SubSection({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-md border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function StatGrid({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div>
      {title ? (
        <h4 className="mb-2 text-sm font-semibold text-foreground">{title}</h4>
      ) : null}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{children}</div>
    </div>
  );
}

/** Horizontal scroll wrapper so wide financial grids stay usable on narrow screens. */
export function PeriodGrid({
  children,
  minWidth = 720,
}: {
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <div style={{ minWidth }}>{children}</div>
    </div>
  );
}

const SOURCE_BADGE_TONE: Record<SourceStatusBadgeVariant, string> = {
  audited: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
  restated: 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100',
  estimate: 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100',
  pending: 'border-violet-500/30 bg-violet-500/10 text-violet-900 dark:text-violet-100',
  unavailable: 'border-border bg-muted/40 text-muted-foreground',
  neutral: 'border-border bg-background text-muted-foreground',
};

export function SourceStatusBadge({ status }: { status: SourceStatus | '' }) {
  const variant = sourceStatusBadgeVariant(status);
  return (
    <span
      className={cn(
        'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        SOURCE_BADGE_TONE[variant],
      )}
    >
      {formatSourceStatus(status)}
    </span>
  );
}

export function DateField({
  id,
  label,
  value,
  onChange,
  required,
  helper,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helper?: string;
  className?: string;
}) {
  return (
    <TextInputField
      id={id}
      label={label}
      type="date"
      value={value}
      onChange={onChange}
      required={required}
      helper={helper}
      className={className}
    />
  );
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  required,
  helper,
  placeholder,
  rows = 3,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helper?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <FormField label={label} htmlFor={id} required={required} helper={helper} className={className}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      />
    </FormField>
  );
}

export function DecimalInputField({
  id,
  label,
  value,
  onChange,
  required,
  helper,
  placeholder,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helper?: string;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <FormField label={label} htmlFor={id} required={required} helper={helper} className={className}>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={draft ?? value}
        placeholder={placeholder}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(parseAmountInput(event.target.value));
        }}
        onBlur={() => setDraft(null)}
        className={fieldClassName}
      />
    </FormField>
  );
}

export function DisplayUnitAmountField({
  id,
  label,
  rupees,
  unit,
  onChange,
  required,
  helper,
  className,
}: {
  id: string;
  label: string;
  rupees: string;
  unit: DisplayUnit | '';
  onChange: (rupees: string) => void;
  required?: boolean;
  helper?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? rupeesToDisplayUnit(rupees, unit, 6);

  return (
    <FormField label={label} htmlFor={id} required={required} helper={helper} className={className}>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={display}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(displayUnitToRupees(parseAmountInput(event.target.value), unit));
        }}
        onBlur={() => setDraft(null)}
        className={fieldClassName}
      />
    </FormField>
  );
}

export function TernaryField({
  id,
  label,
  value,
  onChange,
  required,
  helper,
  className,
}: {
  id: string;
  label: string;
  value: YesNoNotSureOrEmpty;
  onChange: (value: YesNoNotSureOrEmpty) => void;
  required?: boolean;
  helper?: string;
  className?: string;
}) {
  return (
    <SelectField
      id={id}
      label={label}
      value={value}
      onChange={(next) => onChange(next as YesNoNotSureOrEmpty)}
      options={yesNoNotSureOptions}
      required={required}
      helper={helper}
      emptyLabel="Not answered"
      className={className}
    />
  );
}

export function SourceStatusField({
  id,
  label,
  value,
  onChange,
  helper,
}: {
  id: string;
  label: string;
  value: SourceStatus | '';
  onChange: (value: SourceStatus | '') => void;
  helper?: string;
}) {
  return (
    <SelectField
      id={id}
      label={label}
      value={value}
      onChange={(next) => onChange(next as SourceStatus | '')}
      options={SOURCE_STATUS_OPTIONS}
      emptyLabel="Not set"
      helper={helper}
    />
  );
}

/** F1 session-only persistence notice. Permanent saving arrives in F2. */
export function SessionNotice() {
  return (
    <p
      role="status"
      className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
    >
      Changes are kept in this browser session until you choose Keep section updates. Permanent
      saving connected in F2.
    </p>
  );
}

type FinancialGridTableProps = {
  periods: FinancialPeriod[];
  lineKeys: readonly string[];
  getLineLabel: (lineKey: string) => string;
  getAmount: (periodId: string, lineKey: string) => string;
  getSourceStatus?: (periodId: string, lineKey: string) => SourceStatus | '';
  onAmountChange?: (periodId: string, lineKey: string, amount: string) => void;
  onSourceStatusChange?: (periodId: string, lineKey: string, status: SourceStatus | '') => void;
  displayUnit?: DisplayUnit | '';
  readOnly?: boolean;
  showSourceStatus?: boolean;
};

export function FinancialGridTable({
  periods,
  lineKeys,
  getLineLabel,
  getAmount,
  getSourceStatus,
  onAmountChange,
  onSourceStatusChange,
  displayUnit = 'rupees',
  readOnly = false,
  showSourceStatus = false,
}: FinancialGridTableProps) {
  if (periods.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add financial periods in Reporting Scope before entering line values.
      </p>
    );
  }

  return (
    <PeriodGrid minWidth={Math.max(720, 220 + periods.length * 160)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="sticky left-0 z-10 min-w-[220px] bg-muted/40 px-3 py-2 text-left text-xs font-semibold text-foreground">
              Line item
            </th>
            {periods.map((period) => (
              <th
                key={period.id}
                className="min-w-[140px] px-3 py-2 text-left text-xs font-semibold text-foreground"
              >
                <span className="block">{period.label || 'Unnamed period'}</span>
                {period.fullYearOrInterim ? (
                  <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                    {period.fullYearOrInterim === 'interim' ? 'Interim' : 'Full year'}
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lineKeys.map((lineKey) => (
            <tr key={lineKey} className="border-b border-border/70">
              <td className="sticky left-0 z-10 bg-card px-3 py-2 text-xs font-medium text-foreground">
                {getLineLabel(lineKey)}
              </td>
              {periods.map((period) => {
                const amount = getAmount(period.id, lineKey);
                const sourceStatus = getSourceStatus?.(period.id, lineKey) ?? '';
                return (
                  <td key={`${period.id}-${lineKey}`} className="px-3 py-2 align-top">
                    {readOnly ? (
                      <span className="tabular-nums text-foreground">
                        {amount ? formatMoney(amount, displayUnit) : '—'}
                      </span>
                    ) : (
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label={`${getLineLabel(lineKey)} — ${period.label}`}
                        value={rupeesToDisplayUnit(amount, displayUnit, 6)}
                        onChange={(event) =>
                          onAmountChange?.(
                            period.id,
                            lineKey,
                            displayUnitToRupees(parseAmountInput(event.target.value), displayUnit),
                          )
                        }
                        className={cn(fieldClassName, 'h-8 text-xs tabular-nums')}
                      />
                    )}
                    {showSourceStatus && sourceStatus ? (
                      <div className="mt-1">
                        {readOnly ? (
                          <SourceStatusBadge status={sourceStatus} />
                        ) : (
                          <select
                            aria-label={`Source — ${getLineLabel(lineKey)} — ${period.label}`}
                            value={sourceStatus}
                            onChange={(event) =>
                              onSourceStatusChange?.(
                                period.id,
                                lineKey,
                                event.target.value as SourceStatus | '',
                              )
                            }
                            className={cn(fieldClassName, 'h-7 text-[10px]')}
                          >
                            <option value="">Source</option>
                            {SOURCE_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </PeriodGrid>
  );
}

export function upsertGridLineValue<
  T extends { id: string; periodId: string; lineKey: string },
>(
  rows: T[],
  periodId: string,
  lineKey: string,
  patch: Partial<T>,
  factory: () => T,
): T[] {
  const index = rows.findIndex((row) => row.periodId === periodId && row.lineKey === lineKey);
  if (index >= 0) {
    return rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));
  }
  return [...rows, { ...factory(), periodId, lineKey, ...patch }];
}

export function getGridAmount<
  T extends { periodId: string; lineKey: string; amount: string },
>(rows: T[], periodId: string, lineKey: string): string {
  return rows.find((row) => row.periodId === periodId && row.lineKey === lineKey)?.amount ?? '';
}

export function getGridSourceStatus<
  T extends { periodId: string; lineKey: string; sourceStatus: SourceStatus | '' },
>(rows: T[], periodId: string, lineKey: string): SourceStatus | '' {
  return rows.find((row) => row.periodId === periodId && row.lineKey === lineKey)?.sourceStatus ?? '';
}
