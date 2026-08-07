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
import { YES_NO_NOT_SURE_OPTIONS } from '@/lib/management-governance/options';
import type { YesNoNotSureOrEmpty } from '@/lib/schemas/management-governance';

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
          onChange(event.target.value.replace(/[^\d.-]/g, ''));
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

/** M1 session-only persistence notice. Permanent saving arrives in M2. */
export function SessionNotice() {
  return (
    <p
      role="status"
      className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
    >
      Changes are kept in this browser session until you choose Keep section updates. Permanent
      saving connected in M2.
    </p>
  );
}
