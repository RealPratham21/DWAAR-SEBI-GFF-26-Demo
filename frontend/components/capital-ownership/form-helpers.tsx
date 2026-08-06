'use client';

import { useState, type ReactNode } from 'react';
import {
  fieldClassName,
  FormField,
} from '@/components/company-incorporation/form-primitives';
import {
  CheckboxField,
  ComputedStat,
  SelectField,
  TextInputField,
} from '@/components/ipo-setup/form-helpers';
import {
  amountUnitLabel,
  parseAmountInput,
  rupeesToUnitValue,
  unitValueToRupees,
} from '@/lib/capital-ownership/format';
import { yesNoNotSureOptions } from '@/lib/capital-ownership/options';
import type { AmountUnit, YesNoNotSureOrEmpty } from '@/lib/capital-ownership/types';

export { CheckboxField, ComputedStat, SelectField, TextInputField };

/** Two-column responsive grid used by every Capital & Ownership form block. */
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

/** Horizontal scroll wrapper so wide derived tables stay usable on narrow screens. */
export function TableScroll({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <div className="min-w-[720px]">{children}</div>
    </div>
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

/**
 * Decimal-safe numeric entry. The committed value is normalised through `parseAmountInput`,
 * while the visible text keeps whatever the user is mid-way through typing.
 */
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

/**
 * Money entry in the chosen display unit. The payload always stores rupees, so the typed
 * value is multiplied back up on every keystroke.
 */
export function AmountInputField({
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
  unit: AmountUnit;
  onChange: (rupees: string) => void;
  required?: boolean;
  helper?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? rupeesToUnitValue(rupees, unit, 6);

  return (
    <FormField
      label={`${label} (${amountUnitLabel(unit)})`}
      htmlFor={id}
      required={required}
      helper={helper}
      className={className}
    >
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={display}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(unitValueToRupees(parseAmountInput(event.target.value), unit));
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

export function AmountUnitToggle({
  unit,
  onChange,
}: {
  unit: AmountUnit;
  onChange: (unit: AmountUnit) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Amount display unit">
      <p className="text-sm font-medium text-foreground">Amount unit</p>
      {(['rupees', 'lakh', 'crore'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={unit === option}
          onClick={() => onChange(option)}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            unit === option
              ? 'border-accent bg-accent text-accent-foreground'
              : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          {amountUnitLabel(option)}
        </button>
      ))}
    </div>
  );
}

/** @deprecated C2 persists via the workspace API — kept as a no-op for any residual imports. */
export function SessionNotice() {
  return null;
}

export function PendingWorkstreamNotice({ message }: { message: string }) {
  return (
    <p
      role="status"
      className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
    >
      {message}
    </p>
  );
}

export function ReferenceValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
