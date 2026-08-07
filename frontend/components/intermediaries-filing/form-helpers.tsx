'use client';

import type { ReactNode } from 'react';
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
  formatDocumentVersionLabel,
  formatFilingLabel,
  getFilings,
  getOfferDocumentVersions,
} from '@/lib/intermediaries-filing/filings';
import {
  formatIntermediaryLabel,
  getIntermediaries,
} from '@/lib/intermediaries-filing/intermediaries';
import {
  READINESS_STATE_OPTIONS,
  RECONCILIATION_STATUS_LABELS,
  SESSION_SAVE_NOTICE_IF1,
  YES_NO_NOT_SURE_OPTIONS,
} from '@/lib/intermediaries-filing/options';
import type { LinkedWorkstreamReferences } from '@/lib/intermediaries-filing/types';
import type {
  IntermediariesFilingPayload,
  ReadinessState,
  ReconciliationStatus,
  YesNoNotSureOrEmpty,
} from '@/lib/schemas/intermediaries-filing';
import { cn } from '@/lib/utils';

export {
  CheckboxField,
  ComputedStat,
  SelectField,
  TextInputField,
  SectionCard,
};

export function asEnumValue<T extends string>(value: string): T {
  return value as T;
}

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

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  rows = 3,
  helper,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  helper?: string;
}) {
  return (
    <FormField label={label} htmlFor={id} helper={helper}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldClassName, 'min-h-[80px] resize-y')}
      />
    </FormField>
  );
}

export function TernaryField({
  id,
  label,
  value,
  onChange,
  helper,
}: {
  id: string;
  label: string;
  value: YesNoNotSureOrEmpty;
  onChange: (value: YesNoNotSureOrEmpty) => void;
  helper?: string;
}) {
  return (
    <SelectField
      id={id}
      label={label}
      value={value}
      onChange={(next) => onChange(next as YesNoNotSureOrEmpty)}
      options={[{ value: '', label: 'Select…' }, ...YES_NO_NOT_SURE_OPTIONS]}
      helper={helper}
    />
  );
}

function badgeTone(status: string): string {
  switch (status) {
    case 'reconciled':
    case 'appears-consistent':
    case 'ready':
    case 'confirmed':
    case 'complete':
    case 'active':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200';
    case 'potential-inconsistency':
    case 'potential-concern':
    case 'potential_concern':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100';
    case 'missing-information':
    case 'missing_information':
    case 'pending-linked-workstream':
    case 'pending-professional-confirmation':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100';
    default:
      return 'border-border bg-muted/30 text-foreground';
  }
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  if (!status) return null;
  const display =
    label ??
    RECONCILIATION_STATUS_LABELS[status] ??
    READINESS_STATE_OPTIONS.find((option) => option.value === status)?.label ??
    status.replaceAll('-', ' ').replaceAll('_', ' ');
  return (
    <span
      className={cn(
        'rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        badgeTone(status),
      )}
    >
      {display}
    </span>
  );
}

export function ReconciliationStatusBadge({ status }: { status: ReconciliationStatus | '' }) {
  if (!status) return null;
  return <StatusBadge status={status} label={RECONCILIATION_STATUS_LABELS[status]} />;
}

export function ReadinessStateBadge({ status }: { status: ReadinessState | '' }) {
  if (!status) return null;
  return <StatusBadge status={status} />;
}

export function IntermediarySelect({
  id,
  label,
  value,
  onChange,
  payload,
  filter,
  helper,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  payload: IntermediariesFilingPayload;
  filter?: (intermediaryId: string) => boolean;
  helper?: string;
}) {
  const intermediaries = getIntermediaries(payload).filter((intermediary) =>
    filter ? filter(intermediary.intermediaryId) : true,
  );
  const options = [
    { value: '', label: 'Select intermediary…' },
    ...intermediaries.map((intermediary) => ({
      value: intermediary.intermediaryId,
      label: formatIntermediaryLabel(intermediary),
    })),
  ];
  return (
    <SelectField
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      helper={helper}
    />
  );
}

export function FilingSelect({
  id,
  label,
  value,
  onChange,
  payload,
  helper,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  payload: IntermediariesFilingPayload;
  helper?: string;
}) {
  const filings = getFilings(payload);
  const options = [
    { value: '', label: 'Select filing…' },
    ...filings.map((filing) => ({
      value: filing.filingId,
      label: formatFilingLabel(filing),
    })),
  ];
  return (
    <SelectField
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      helper={helper}
    />
  );
}

export function DocumentVersionSelect({
  id,
  label,
  value,
  onChange,
  payload,
  helper,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  payload: IntermediariesFilingPayload;
  helper?: string;
}) {
  const versions = getOfferDocumentVersions(payload);
  const options = [
    { value: '', label: 'Select document version…' },
    ...versions.map((version) => ({
      value: version.documentVersionId,
      label: formatDocumentVersionLabel(version),
    })),
  ];
  return (
    <SelectField
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      helper={helper}
    />
  );
}

export function LinkedWorkstreamPanel({
  title,
  available,
  fields,
}: {
  title: string;
  available: boolean;
  fields: Array<{ label: string; value: string | null | undefined }>;
}) {
  return (
    <section className="space-y-3 rounded-md border border-dashed border-border bg-muted/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Read-only linked snapshot
        </span>
      </div>
      {!available ? (
        <p className="text-xs text-muted-foreground">
          Linked workstream data is not yet available — showing placeholders until IPO Setup /
          Capital are connected.
        </p>
      ) : null}
      <dl className="grid gap-2 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="text-[11px] text-muted-foreground">{field.label}</dt>
            <dd className="text-sm text-foreground">{field.value?.trim() || '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function LinkedWorkstreamNotice({
  available,
  workstreamName,
}: {
  available: boolean;
  workstreamName: string;
}) {
  if (available) return null;
  return (
    <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      {workstreamName} linked data is not yet available — showing as pending linked workstream.
    </p>
  );
}

export function SessionNotice() {
  return (
    <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      {SESSION_SAVE_NOTICE_IF1}
    </p>
  );
}

export function linkedIpoFields(
  payload: IntermediariesFilingPayload,
  linkedReferences: LinkedWorkstreamReferences,
) {
  const snapshot = payload.issueConfigurationAndFilingSnapshot.ipoSetupLinkedSnapshot;
  const linked = linkedReferences.ipoSetup;
  return [
    { label: 'Target SME platform', value: snapshot.targetSmePlatform || linked.targetSmePlatform },
    { label: 'Issue method', value: snapshot.issueMethod || linked.issueMethod },
    { label: 'Fresh issue', value: snapshot.freshIssue || linked.freshIssue },
    { label: 'OFS', value: snapshot.ofs || linked.ofs },
    { label: 'Total offer', value: snapshot.totalOffer || linked.totalOffer },
    { label: 'Face value', value: snapshot.faceValue || linked.faceValue },
    {
      label: 'Proposed final issue price',
      value: snapshot.proposedFinalIssuePrice || linked.proposedFinalIssuePrice,
    },
    { label: 'Target filing date', value: snapshot.targetFilingDate || linked.targetFilingDate },
    { label: 'Issue stage', value: snapshot.issueStage || linked.issueStage },
  ];
}

export function linkedCapitalFields(
  payload: IntermediariesFilingPayload,
  linkedReferences: LinkedWorkstreamReferences,
) {
  const snapshot = payload.issueConfigurationAndFilingSnapshot.capitalLinkedSnapshot;
  const linked = linkedReferences.capitalOwnership;
  return [
    { label: 'Pre-issue shares', value: snapshot.preIssueShares || linked.preIssueShares },
    { label: 'Fresh issue shares', value: snapshot.freshIssueShares || linked.freshIssueShares },
    { label: 'OFS shares', value: snapshot.ofsShares || linked.ofsShares },
    { label: 'Post-issue shares', value: snapshot.postIssueShares || linked.postIssueShares },
    {
      label: 'Promoter contribution',
      value: snapshot.promoterContribution || linked.promoterContribution,
    },
    {
      label: 'Selling shareholders',
      value: snapshot.sellingShareholders || linked.sellingShareholders,
    },
  ];
}
