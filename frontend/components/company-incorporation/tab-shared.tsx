import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabEmptyPanelProps {
  message: string;
  supportingText?: string;
  children?: ReactNode;
  className?: string;
}

export function TabEmptyPanel({
  message,
  supportingText,
  children,
  className,
}: TabEmptyPanelProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {supportingText ? (
        <p className="text-sm text-muted-foreground leading-relaxed">{supportingText}</p>
      ) : null}
      {children}
    </div>
  );
}

interface InfoBadgeProps {
  label: string;
}

export function InfoBadge({ label }: InfoBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {label}
    </span>
  );
}

interface RequirementLevelBadgeProps {
  level: 'mandatory' | 'conditional';
}

export function RequirementLevelBadge({ level }: RequirementLevelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        level === 'mandatory'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-warning/10 text-warning',
      )}
    >
      {level === 'mandatory' ? 'Mandatory' : 'Conditional'}
    </span>
  );
}

interface NeutralStatusBadgeProps {
  label: string;
}

export function NeutralStatusBadge({ label }: NeutralStatusBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground whitespace-nowrap">
      {label}
    </span>
  );
}

interface DisabledActionButtonProps {
  label: string;
  disabledReason: string;
}

export function DisabledActionButton({ label, disabledReason }: DisabledActionButtonProps) {
  return (
    <button
      type="button"
      disabled
      title={disabledReason}
      aria-label={`${label}. ${disabledReason}`}
      className="inline-flex h-7 items-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium text-muted-foreground opacity-50 cursor-not-allowed"
    >
      {label}
    </button>
  );
}
