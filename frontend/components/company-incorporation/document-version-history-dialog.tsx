'use client';

import { useEffect, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DocumentVersionSummary } from '@/lib/company-incorporation/documents/types';
import {
  formatFileSize,
  formatUploadedAt,
  versionStatusLabel,
} from '@/lib/company-incorporation/documents/utils';

interface DocumentVersionHistoryDialogProps {
  open: boolean;
  requirementName: string;
  versions: DocumentVersionSummary[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onDownload: (versionId: string) => void;
}

export function DocumentVersionHistoryDialog({
  open,
  requirementName,
  versions,
  isLoading,
  error,
  onClose,
  onDownload,
}: DocumentVersionHistoryDialogProps) {
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

  if (!open) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-[min(100%-2rem,36rem)] rounded-lg border border-border bg-card p-0 shadow-xl backdrop:bg-black/40"
      aria-labelledby="document-version-history-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="document-version-history-title" className="text-base font-semibold text-foreground">
              Version history
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{requirementName}</p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </Button>
        </div>

        {isLoading ? <p className="text-sm text-muted-foreground">Loading version history…</p> : null}
        {error ? (
          <p className="text-sm text-destructive border-l-2 border-destructive pl-3" role="alert">
            {error}
          </p>
        ) : null}

        {!isLoading && !error ? (
          <div className="space-y-3 max-h-[24rem] overflow-y-auto">
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No uploaded versions yet.</p>
            ) : (
              versions.map((version) => (
                <div key={version.id} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Version {version.versionNumber}
                    </span>
                    <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                      {versionStatusLabel(version.status)}
                    </span>
                    {version.isCurrent ? (
                      <span className="text-xs rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                        Current
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Historical version</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground break-all">{version.originalFilename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(version.sizeBytes)} · {formatUploadedAt(version.uploadedAt)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(version.id)}
                  >
                    <Download size={14} />
                    Download
                  </Button>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
