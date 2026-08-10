import { cn } from '@/lib/utils';

type ProfileFieldProps = {
  label: string;
  value: string;
  emphasis?: boolean;
  fullWidth?: boolean;
  className?: string;
};

export function ProfileField({
  label,
  value,
  emphasis = false,
  fullWidth = false,
  className,
}: ProfileFieldProps) {
  return (
    <div className={cn(fullWidth ? 'col-span-full' : undefined, className)}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1 text-sm text-foreground',
          emphasis ? 'font-semibold' : 'font-medium',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

type ProfileFieldGridProps = {
  children: React.ReactNode;
  columns?: 2 | 3;
};

export function ProfileFieldGrid({ children, columns = 3 }: ProfileFieldGridProps) {
  return (
    <dl
      className={cn(
        'grid gap-x-6 gap-y-4',
        columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3',
      )}
    >
      {children}
    </dl>
  );
}
