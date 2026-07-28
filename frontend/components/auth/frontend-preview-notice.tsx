import { Info } from 'lucide-react';

export function FrontendPreviewNotice({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 flex items-start gap-3"
    >
      <Info size={18} className="text-accent flex-shrink-0 mt-0.5" aria-hidden />
      <p className="text-sm text-foreground">{message}</p>
    </div>
  );
}
