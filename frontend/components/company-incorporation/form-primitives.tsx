import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const fieldClassName =
  'w-full px-4 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent';

export const labelClassName = 'block text-sm font-medium text-foreground mb-2';

export const helperClassName = 'text-xs text-muted-foreground mt-1';

export const errorClassName = 'text-sm text-destructive mt-1';

export function FormField({
  label,
  htmlFor,
  required,
  helper,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-0', className)}>
      <label htmlFor={htmlFor} className={labelClassName}>
        {label}
        {required ? <span className="text-destructive ml-1">*</span> : null}
      </label>
      {children}
      {helper ? <p className={helperClassName}>{helper}</p> : null}
      {error ? <p className={errorClassName}>{error}</p> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/** Keeps bottom-right actions clear of the floating Copilot on desktop and mobile. */
export function FormActionRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-3 pb-24 md:pb-0 md:pr-[88px]">{children}</div>
  );
}
