import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  max?: number;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'compact';
}

export function MetricCard({
  label,
  value,
  max,
  description,
  icon,
  variant = 'default',
}: MetricCardProps) {
  const displayValue = max
    ? `${value}/${max}`
    : typeof value === 'number'
      ? `${value}%`
      : String(value);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{displayValue}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {icon && <div className="text-muted-foreground flex-shrink-0">{icon}</div>}
      </div>
      {!max && typeof value === 'number' && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
