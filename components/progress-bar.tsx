interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showLabel = true,
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);

  const sizeClass = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs font-medium text-foreground">{label}</span>}
          <span className="text-xs text-muted-foreground">{percentage}%</span>
        </div>
      )}
      <div className={`bg-muted rounded-full overflow-hidden ${sizeClass}`}>
        <div
          className="bg-accent h-full transition-all rounded-full"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
