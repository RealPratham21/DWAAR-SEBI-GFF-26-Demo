'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SessionSaveNotice({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 flex items-start justify-between gap-3">
      <p className="text-sm text-foreground">{message}</p>
      {onDismiss ? (
        <Button type="button" variant="ghost" size="icon-sm" onClick={onDismiss} aria-label="Dismiss">
          <X size={16} />
        </Button>
      ) : null}
    </div>
  );
}
