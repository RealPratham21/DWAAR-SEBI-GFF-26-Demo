import type { StatusType } from '@/lib/types';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
}

const statusConfig: Record<StatusType, { label: string; bgColor: string; textColor: string }> = {
  'not-started': {
    label: 'Not Started',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
  },
  'in-progress': {
    label: 'In Progress',
    bgColor: 'bg-warning/10',
    textColor: 'text-warning',
  },
  'pending-review': {
    label: 'Pending Review',
    bgColor: 'bg-warning/10',
    textColor: 'text-warning',
  },
  approved: {
    label: 'Approved',
    bgColor: 'bg-success/10',
    textColor: 'text-success',
  },
  blocked: {
    label: 'Blocked',
    bgColor: 'bg-destructive/10',
    textColor: 'text-destructive',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
        config.bgColor
      } ${config.textColor} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
    >
      {config.label}
    </span>
  );
}
