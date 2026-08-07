'use client';

import type { ReactNode } from 'react';
import {
  fieldClassName,
  FormField,
  SectionCard,
} from '@/components/company-incorporation/form-primitives';
import {
  ComputedStat,
  SelectField,
  TextInputField,
} from '@/components/ipo-setup/form-helpers';
import { formatApprovalLabel, getApprovals } from '@/lib/litigation-approvals-compliance/approvals';
import { formatMatterLabel, getMatters } from '@/lib/litigation-approvals-compliance/matters';
import {
  APPROVAL_STATUS_LABELS,
  CONDITION_COMPLIANCE_STATUS_LABELS,
  MATTER_OUTCOME_STATUS_LABELS,
  RECONCILIATION_STATUS_LABELS,
  SESSION_SAVE_NOTICE_LAC1,
  YES_NO_NOT_SURE_OPTIONS,
} from '@/lib/litigation-approvals-compliance/options';
import type {
  ApprovalStatus,
  ConditionComplianceStatus,
  LitigationApprovalsCompliancePayload,
  MatterOutcomeStatus,
  ReconciliationStatus,
  YesNoNotSureOrEmpty,
} from '@/lib/schemas/litigation-approvals-compliance';
import { cn } from '@/lib/utils';

export { ComputedStat, SelectField, TextInputField, SectionCard };

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

export function MatterSelect({
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
  payload: LitigationApprovalsCompliancePayload;
  filter?: (matterId: string) => boolean;
  helper?: string;
}) {
  const matters = getMatters(payload).filter((matter) =>
    filter ? filter(matter.matterId) : true,
  );
  const options = [
    { value: '', label: 'Select matter…' },
    ...matters.map((matter) => ({
      value: matter.matterId,
      label: formatMatterLabel(matter),
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

export function ApprovalSelect({
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
  payload: LitigationApprovalsCompliancePayload;
  helper?: string;
}) {
  const approvals = getApprovals(payload);
  const options = [
    { value: '', label: 'Select approval…' },
    ...approvals.map((approval) => ({
      value: approval.approvalId,
      label: formatApprovalLabel(approval),
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

export function LegalPartySelect({
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
  payload: LitigationApprovalsCompliancePayload;
  helper?: string;
}) {
  const parties =
    payload.legalUniverseMaterialityPolicyAndPartyMapping.legalPartyReviews;
  const options = [
    { value: '', label: 'Select party…' },
    ...parties.map((party) => ({
      value: party.legalPartyReviewId,
      label: party.displayName.trim() || party.partyCategory.replaceAll('-', ' ') || party.legalPartyReviewId.slice(0, 8),
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

function badgeTone(status: string): string {
  switch (status) {
    case 'reconciled':
    case 'compliant':
    case 'resolved':
    case 'closed':
    case 'valid':
    case 'active':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200';
    case 'potential-inconsistency':
    case 'potential_concern':
    case 'delayed':
    case 'expired-renewal-not-applied':
    case 'expired-renewal-applied':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100';
    case 'pending':
    case 'renewal-pending':
    case 'application-pending':
    case 'appeal-pending':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100';
    case 'missing-information':
    case 'missing_information':
    case 'not-sure':
      return 'border-border bg-muted/40 text-muted-foreground';
    default:
      return 'border-border bg-muted/30 text-foreground';
  }
}

export function MatterOutcomeStatusBadge({ status }: { status: MatterOutcomeStatus | '' }) {
  if (!status) return null;
  return (
    <span
      className={cn(
        'rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        badgeTone(status),
      )}
    >
      {MATTER_OUTCOME_STATUS_LABELS[status] ?? status.replaceAll('-', ' ')}
    </span>
  );
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus | '' }) {
  if (!status) return null;
  return (
    <span
      className={cn(
        'rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        badgeTone(status),
      )}
    >
      {APPROVAL_STATUS_LABELS[status] ?? status.replaceAll('-', ' ')}
    </span>
  );
}

export function ReconciliationStatusBadge({ status }: { status: ReconciliationStatus | '' }) {
  if (!status) return null;
  return (
    <span
      className={cn(
        'rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        badgeTone(status),
      )}
    >
      {RECONCILIATION_STATUS_LABELS[status] ?? status.replaceAll('-', ' ')}
    </span>
  );
}

export function ConditionComplianceStatusBadge({
  status,
}: {
  status: ConditionComplianceStatus | '';
}) {
  if (!status) return null;
  return (
    <span
      className={cn(
        'rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        badgeTone(status),
      )}
    >
      {CONDITION_COMPLIANCE_STATUS_LABELS[status] ?? status.replaceAll('-', ' ')}
    </span>
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
      {SESSION_SAVE_NOTICE_LAC1}
    </p>
  );
}
