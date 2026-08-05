'use client';

import type { ReactNode } from 'react';
import {
  fieldClassName,
  FormField,
  helperClassName,
} from '@/components/company-incorporation/form-primitives';
import { cn } from '@/lib/utils';

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required,
  helper,
  includeEmpty = true,
  emptyLabel = 'Select…',
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  helper?: string;
  includeEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
}) {
  return (
    <FormField label={label} htmlFor={id} required={required} helper={helper} className={className}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      >
        {includeEmpty ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

export function TextInputField({
  id,
  label,
  value,
  onChange,
  required,
  helper,
  type = 'text',
  placeholder,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helper?: string;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <FormField label={label} htmlFor={id} required={required} helper={helper} className={className}>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      />
    </FormField>
  );
}

export function NumberInputField({
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
  return (
    <FormField label={label} htmlFor={id} required={required} helper={helper} className={className}>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      />
    </FormField>
  );
}

export function CheckboxField({
  id,
  label,
  checked,
  onChange,
  helper,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  helper?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex items-start gap-3 text-sm text-foreground">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
        />
        <span>{label}</span>
      </label>
      {helper ? <p className={cn(helperClassName, 'ml-7')}>{helper}</p> : null}
    </div>
  );
}

export function ComputedStat({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export function PersistenceBanner() {
  return null;
}
