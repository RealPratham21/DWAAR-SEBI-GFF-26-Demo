'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { helperClassName } from '@/components/company-incorporation/form-primitives';
import {
  ACCEPTED_DOCUMENT_MIME_TYPES,
  INITIAL_DOCUMENT_CHECKLIST,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
} from '@/lib/onboarding/sme/constants';

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function InitialDocumentsStep({
  selections,
  onSelectFile,
  onRemoveFile,
  onSkipForNow,
  skippedForNow,
}: {
  selections: Record<string, { fileName: string; fileSize: number; mimeType: string } | null>;
  onSelectFile: (documentId: string, file: File | null) => void;
  onRemoveFile: (documentId: string) => void;
  onSkipForNow: () => void;
  skippedForNow: boolean;
}) {
  const [fileError, setFileError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_DOCUMENT_MIME_TYPES.includes(file.type as (typeof ACCEPTED_DOCUMENT_MIME_TYPES)[number])) {
      return 'Only PDF, JPEG, PNG, or WebP files are supported.';
    }
    if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      return 'Each file must be 20 MB or smaller.';
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <p className={helperClassName}>
        Select starter documents for this frontend session only. You may skip and provide documents
        later in the project workspace.
      </p>

      {fileError ? <p className="text-sm text-destructive">{fileError}</p> : null}

      <div className="space-y-4">
        {INITIAL_DOCUMENT_CHECKLIST.map((item) => {
          const selected = selections[item.id];
          return (
            <div key={item.id} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-foreground">{item.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.why}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                  {item.requirementLevel}
                </span>
              </div>

              {selected ? (
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{selected.fileName}</p>
                    <p className="text-muted-foreground">{formatFileSize(selected.fileSize)}</p>
                    <p className="text-xs text-accent mt-1">Selected for this frontend session only</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => onRemoveFile(item.id)}>
                    Remove selection
                  </Button>
                </div>
              ) : (
                <label className="inline-flex">
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      event.target.value = '';
                      if (!file) return;
                      const error = validateFile(file);
                      if (error) {
                        setFileError(error);
                        return;
                      }
                      setFileError(null);
                      onSelectFile(item.id, file);
                    }}
                  />
                  <span className="inline-flex items-center px-4 py-2 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-muted">
                    Choose file
                  </span>
                </label>
              )}
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" onClick={onSkipForNow}>
        {skippedForNow ? 'Documents marked as skip for now' : 'Skip for now'}
      </Button>
    </div>
  );
}
