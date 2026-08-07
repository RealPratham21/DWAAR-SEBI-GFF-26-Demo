'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/company-incorporation/form-primitives';
import { Button } from '@/components/ui/button';

export function RepeatableList({
  title,
  description,
  addLabel,
  onAdd,
  emptyMessage,
  count,
  children,
}: {
  title: string;
  description?: string;
  addLabel: string;
  onAdd: () => void;
  emptyMessage: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {title}
            <span className="ml-2 text-xs font-normal text-muted-foreground">{count}</span>
          </h4>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus size={14} />
          {addLabel}
        </Button>
      </div>
      {count === 0 ? <EmptyState message={emptyMessage} /> : <div className="space-y-4">{children}</div>}
    </section>
  );
}

export function RepeatableCard({
  title,
  subtitle,
  onRemove,
  removeLabel = 'Remove',
  requiresConfirmation = false,
  confirmMessage = 'Remove this record? Entered values will be lost.',
  children,
}: {
  title: string;
  subtitle?: string;
  onRemove: () => void;
  removeLabel?: string;
  requiresConfirmation?: boolean;
  confirmMessage?: string;
  children: ReactNode;
}) {
  const handleRemove = () => {
    if (requiresConfirmation && !window.confirm(confirmMessage)) return;
    onRemove();
  };

  return (
    <article className="space-y-4 rounded-md border border-border bg-muted/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h5 className="text-sm font-semibold text-foreground">{title}</h5>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <Button type="button" variant="destructive" size="sm" onClick={handleRemove}>
          <Trash2 size={14} />
          {removeLabel}
        </Button>
      </div>
      {children}
    </article>
  );
}

export function hasRecordData(values: Array<string | undefined | null>): boolean {
  return values.some((value) => (value ?? '').trim() !== '');
}

export function replaceAt<T>(list: T[], index: number, next: T): T[] {
  return list.map((item, itemIndex) => (itemIndex === index ? next : item));
}

export function removeAt<T>(list: T[], index: number): T[] {
  return list.filter((_, itemIndex) => itemIndex !== index);
}
