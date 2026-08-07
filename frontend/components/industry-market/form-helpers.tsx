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
import { formatSourceLabel, getSourceById } from '@/lib/industry-market/sources';
import {
  ACTUAL_ESTIMATE_FORECAST_LABELS,
  CLAIM_STATUS_LABELS,
  DATA_NATURE_LABELS,
  SESSION_SAVE_NOTICE_IM2,
  SOURCE_READINESS_STATUS_LABELS,
  SOURCE_TYPE_LABELS,
  YES_NO_NOT_SURE_OPTIONS,
} from '@/lib/industry-market/options';
import type {
  ActualEstimateForecast,
  ClaimStatus,
  DataNature,
  IndustryMarketPayload,
  SourceReadinessStatus,
  SourceRecord,
  YesNoNotSureOrEmpty,
} from '@/lib/schemas/industry-market';
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

/** IM1 session-only persistence notice. Permanent saving arrives in IM2. */
export function SessionNotice() {
  return (
    <p
      role="status"
      className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
    >
      {SESSION_SAVE_NOTICE_IM2}
    </p>
  );
}

function badgeTone(tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'): string {
  switch (tone) {
    case 'success':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200';
    case 'warning':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100';
    case 'danger':
      return 'border-destructive/30 bg-destructive/10 text-destructive';
    case 'info':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100';
    default:
      return 'border-border bg-muted/40 text-muted-foreground';
  }
}

function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        badgeTone(tone),
      )}
    >
      {label}
    </span>
  );
}

export function SourceBadge({ source }: { source: SourceRecord | undefined }) {
  if (!source) return <Badge label="No source" tone="neutral" />;
  const typeLabel = source.sourceType
    ? SOURCE_TYPE_LABELS[source.sourceType as keyof typeof SOURCE_TYPE_LABELS] ?? source.sourceType
    : 'Source';
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge label={typeLabel} tone="info" />
      {source.sourceReadinessStatus ? (
        <StaleSourceIndicator status={source.sourceReadinessStatus} />
      ) : null}
    </span>
  );
}

export function DataNatureBadge({ dataNature }: { dataNature: DataNature | '' }) {
  if (!dataNature) return null;
  const label = DATA_NATURE_LABELS[dataNature as keyof typeof DATA_NATURE_LABELS] ?? dataNature;
  const tone =
    dataNature === 'actual'
      ? 'success'
      : dataNature === 'forecast-projected'
        ? 'info'
        : 'warning';
  return <Badge label={label} tone={tone} />;
}

export function ActualEstimateForecastBadge({
  value,
}: {
  value: ActualEstimateForecast | '';
}) {
  if (!value) return null;
  const label =
    ACTUAL_ESTIMATE_FORECAST_LABELS[value as keyof typeof ACTUAL_ESTIMATE_FORECAST_LABELS] ??
    value;
  const tone = value === 'actual' ? 'success' : value === 'forecast' ? 'info' : 'warning';
  return <Badge label={label} tone={tone} />;
}

export function ClaimStatusBadge({ status }: { status: ClaimStatus | '' }) {
  if (!status) return <Badge label="Not assessed" tone="neutral" />;
  const label = CLAIM_STATUS_LABELS[status as keyof typeof CLAIM_STATUS_LABELS] ?? status;
  const tone =
    status === 'substantiated'
      ? 'success'
      : status === 'potentially_substantiated'
        ? 'info'
        : status === 'do_not_use' || status === 'contradictory_sources'
          ? 'danger'
          : 'warning';
  return <Badge label={label} tone={tone} />;
}

export function StaleSourceIndicator({ status }: { status: SourceReadinessStatus | '' }) {
  if (!status) return null;
  const label =
    SOURCE_READINESS_STATUS_LABELS[status as keyof typeof SOURCE_READINESS_STATUS_LABELS] ??
    status;
  const tone =
    status === 'current'
      ? 'success'
      : status === 'potentially_stale' || status === 'superseded'
        ? 'warning'
        : status === 'professional_confirmation_required'
          ? 'danger'
          : 'neutral';
  return <Badge label={label} tone={tone} />;
}

export function SourcePicker({
  id,
  label,
  payload,
  value,
  onChange,
  required,
  helper,
  includeEmpty = true,
  emptyLabel = 'No source selected',
}: {
  id: string;
  label: string;
  payload: IndustryMarketPayload;
  value: string;
  onChange: (sourceId: string) => void;
  required?: boolean;
  helper?: string;
  includeEmpty?: boolean;
  emptyLabel?: string;
}) {
  const sources = payload.researchSourcesAndIndustryReportGovernance.sources;
  const options = sources.map((source) => ({
    value: source.id,
    label: formatSourceLabel(source),
  }));
  const selected = getSourceById(payload, value);

  return (
    <div className="space-y-1">
      <SelectField
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        options={options}
        required={required}
        helper={helper}
        includeEmpty={includeEmpty}
        emptyLabel={emptyLabel}
      />
      {selected ? (
        <div className="flex flex-wrap items-center gap-1 pl-0.5">
          <SourceBadge source={selected} />
          {selected.dataNature ? <DataNatureBadge dataNature={selected.dataNature} /> : null}
        </div>
      ) : null}
    </div>
  );
}
