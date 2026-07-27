'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface RecordDialogProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  children: ReactNode;
  isSubmitting?: boolean;
}

export function RecordDialog({
  open,
  title,
  description,
  onClose,
  onSubmit,
  submitLabel,
  children,
  isSubmitting,
}: RecordDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-dialog-title"
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card shadow-xl"
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <div>
            <h2 id="record-dialog-title" className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            {description ? (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </Button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="px-6 py-6 space-y-4"
        >
          {children}
          <div className="flex justify-end gap-3 pt-4 border-t border-border pb-24 md:pb-0 md:pr-[88px]">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
