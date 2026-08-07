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
import { formatEntityLabel, getEntityById } from '@/lib/group-entities-related-parties/entities';
import {
  ENTITY_CLASSIFICATION_BADGE_LABELS,
  SESSION_SAVE_NOTICE_GR1,
  YES_NO_NOT_SURE_OPTIONS,
} from '@/lib/group-entities-related-parties/options';
import type {
  EntityClassificationBadge,
  EntityRecord,
  GroupEntitiesRelatedPartiesPayload,
  YesNoNotSureOrEmpty,
} from '@/lib/schemas/group-entities-related-parties';
import { cn } from '@/lib/utils';

export { CheckboxField, ComputedStat, SelectField, TextInputField, SectionCard };

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

export function EntityPicker({
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
  payload: GroupEntitiesRelatedPartiesPayload;
  required?: boolean;
  helper?: string;
}) {
  const entities = payload.groupStructureAndEntityMaster.entities;
  const options = [
    { value: '', label: 'Select entity…' },
    ...entities.map((entity) => ({
      value: entity.id,
      label: formatEntityLabel(entity),
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

export function RelatedPartyPicker({
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
  payload: GroupEntitiesRelatedPartiesPayload;
  helper?: string;
}) {
  const relationships =
    payload.relatedPartyUniverseAndClassification.relatedPartyRelationships;
  const options = [
    { value: '', label: 'Select related party…' },
    ...relationships.map((rp) => ({
      value: rp.id,
      label:
        rp.linkedPersonName ||
        formatEntityLabel(getEntityById(payload, rp.linkedEntityId), rp.linkedEntityId) ||
        rp.relationshipCategory ||
        rp.id.slice(0, 8),
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

export function ClassificationBadgeList({
  badges,
  onToggle,
}: {
  badges: EntityClassificationBadge[];
  onToggle: (badge: EntityClassificationBadge) => void;
}) {
  const allBadges = Object.keys(ENTITY_CLASSIFICATION_BADGE_LABELS) as EntityClassificationBadge[];
  return (
    <div className="flex flex-wrap gap-2">
      {allBadges.map((badge) => {
        const active = badges.includes(badge);
        return (
          <button
            key={badge}
            type="button"
            onClick={() => onToggle(badge)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/50',
            )}
          >
            {ENTITY_CLASSIFICATION_BADGE_LABELS[badge] ?? badge}
          </button>
        );
      })}
    </div>
  );
}

export function EntityBadge({ entity }: { entity: EntityRecord | undefined }) {
  if (!entity) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {entity.classificationBadges.slice(0, 4).map((badge) => (
        <span
          key={badge}
          className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium"
        >
          {ENTITY_CLASSIFICATION_BADGE_LABELS[badge] ?? badge}
        </span>
      ))}
    </div>
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
      {SESSION_SAVE_NOTICE_GR1}
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
