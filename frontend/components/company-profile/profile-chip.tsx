import { cn } from '@/lib/utils';

type ProfileChipProps = {
  children: React.ReactNode;
  variant?: 'neutral' | 'accent';
  className?: string;
};

export function ProfileChip({ children, variant = 'neutral', className }: ProfileChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium',
        variant === 'accent'
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border bg-muted/40 text-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}

type ProfileStatusChipProps = {
  value: string;
};

const POSITIVE = new Set(['yes', 'Yes', 'YES']);
const NEGATIVE = new Set(['no', 'No', 'NO']);

export function ProfileStatusChip({ value }: ProfileStatusChipProps) {
  const normalized = value.trim();
  const tone = POSITIVE.has(normalized)
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
    : NEGATIVE.has(normalized)
      ? 'border-border bg-muted/50 text-muted-foreground'
      : 'border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-200';

  return (
    <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-xs font-medium', tone)}>
      {value}
    </span>
  );
}
