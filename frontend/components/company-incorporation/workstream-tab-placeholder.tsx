'use client';

interface WorkstreamTabPlaceholderProps {
  title: string;
  description: string;
}

export function WorkstreamTabPlaceholder({ title, description }: WorkstreamTabPlaceholderProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
    </div>
  );
}
