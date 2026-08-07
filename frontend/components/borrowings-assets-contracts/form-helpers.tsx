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
import { formatAssetLabel, formatContractLabel, formatPropertyLabel } from '@/lib/borrowings-assets-contracts/masters';
import { formatFacilityLabel } from '@/lib/borrowings-assets-contracts/facilities';
import {
  SESSION_SAVE_NOTICE_BAC1,
  YES_NO_NOT_SURE_OPTIONS,
} from '@/lib/borrowings-assets-contracts/options';
import type {
  BorrowingsAssetsContractsPayload,
  SecuredClassification,
  YesNoNotSureOrEmpty,
} from '@/lib/schemas/borrowings-assets-contracts';
import { cn } from '@/lib/utils';

export { CheckboxField, ComputedStat, SelectField, TextInputField, SectionCard };

export function asEnumValue<T extends string>(value: string): T {
  return value as T;
}

export const SECURED_CLASSIFICATION_BADGE_LABELS: Record<SecuredClassification, string> = {
  secured: 'Secured',
  unsecured: 'Unsecured',
  'partially-secured': 'Partially secured',
};

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

export function FacilitySelect({
  id,
  label,
  value,
  onChange,
  payload,
  required,
  helper,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  payload: BorrowingsAssetsContractsPayload;
  required?: boolean;
  helper?: string;
}) {
  const facilities = payload.financialIndebtednessAndFacilityMaster.facilities;
  const options = [
    { value: '', label: 'Select facility…' },
    ...facilities.map((facility) => ({
      value: facility.id,
      label: formatFacilityLabel(facility),
    })),
  ];
  return (
    <SelectField
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      required={required}
      helper={helper}
    />
  );
}

export function PropertySelect({
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
  payload: BorrowingsAssetsContractsPayload;
  helper?: string;
}) {
  const properties = payload.immovablePropertiesAndOccupancyRights.properties;
  const options = [
    { value: '', label: 'Select property…' },
    ...properties.map((property) => ({
      value: property.id,
      label: formatPropertyLabel(property),
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

export function AssetSelect({
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
  payload: BorrowingsAssetsContractsPayload;
  helper?: string;
}) {
  const assets = payload.materialAssetsEncumbranceAndInsuranceLinkage.assets;
  const options = [
    { value: '', label: 'Select asset…' },
    ...assets.map((asset) => ({
      value: asset.id,
      label: formatAssetLabel(asset),
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

export function ContractSelect({
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
  payload: BorrowingsAssetsContractsPayload;
  helper?: string;
}) {
  const contracts = payload.materialBusinessStrategicAndOtherContracts.contracts;
  const options = [
    { value: '', label: 'Select contract…' },
    ...contracts.map((contract) => ({
      value: contract.id,
      label: formatContractLabel(contract),
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

export function SecuredClassificationBadge({
  classification,
}: {
  classification: SecuredClassification | '';
}) {
  if (!classification) return null;
  return (
    <span
      className={cn(
        'rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        classification === 'secured'
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
          : classification === 'unsecured'
            ? 'border-sky-500/40 bg-sky-500/10 text-sky-900 dark:text-sky-100'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100',
      )}
    >
      {SECURED_CLASSIFICATION_BADGE_LABELS[classification] ?? classification}
    </span>
  );
}

export function FundNonFundBadge({ value }: { value: string }) {
  if (!value) return null;
  const label = value === 'fund-based' ? 'Fund-based' : value === 'non-fund-based' ? 'Non-fund' : value;
  return (
    <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium">
      {label}
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
      {SESSION_SAVE_NOTICE_BAC1}
    </p>
  );
}

export function ScrollTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}
