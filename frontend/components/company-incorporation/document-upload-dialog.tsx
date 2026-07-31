'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UploadDialogPhase } from '@/lib/company-incorporation/documents/types';
import { formatFileSize } from '@/lib/company-incorporation/documents/utils';

interface DocumentUploadDialogProps {
  open: boolean;
  file: File | null;
  phase: UploadDialogPhase;
  progress: number;
  error: string | null;
  onCancel: () => void;
  onRetry: () => void;
}

const PHASE_LABELS: Record<UploadDialogPhase, string> = {
  idle: 'Ready',
  preparing: 'Preparing upload',
  uploading: 'Uploading',
  finalizing: 'Finalizing',
  uploaded: 'Uploaded',
  failed: 'Upload failed',
};

export function DocumentUploadDialog({
  open,
  file,
  phase,
  progress,
  error,
  onCancel,
  onRetry,
}: DocumentUploadDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open || !file) {
    return null;
  }

  const busy = phase === 'preparing' || phase === 'uploading' || phase === 'finalizing';

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-[min(100%-2rem,28rem)] rounded-lg border border-border bg-card p-0 shadow-xl backdrop:bg-black/40"
      aria-labelledby="document-upload-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) {
          onCancel();
        }
      }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="document-upload-dialog-title" className="text-base font-semibold text-foreground">
              Upload document
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{PHASE_LABELS[phase]}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close upload dialog"
          >
            <X size={16} />
          </Button>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Filename</dt>
          <dd className="text-foreground break-all">{file.name}</dd>
          <dt className="text-muted-foreground">Type</dt>
          <dd className="text-foreground">{file.type || 'Unknown'}</dd>
          <dt className="text-muted-foreground">Size</dt>
          <dd className="text-foreground">{formatFileSize(file.size)}</dd>
        </dl>

        {phase === 'uploading' ? (
          <div className="space-y-2" aria-live="polite">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{progress}% uploaded</p>
          </div>
        ) : null}

        {busy ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <Loader2 size={16} className="animate-spin" />
            <span>{PHASE_LABELS[phase]}…</span>
          </div>
        ) : null}

        {phase === 'uploaded' ? (
          <p className="text-sm text-success" aria-live="polite">
            Upload completed and verified.
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive border-l-2 border-destructive pl-3" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          {phase === 'failed' ? (
            <Button type="button" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            {phase === 'uploaded' ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
