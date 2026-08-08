'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, Loader2 } from 'lucide-react';
import { downloadDrhpExport } from '@/lib/api/drhp';
import { cn } from '@/lib/utils';

type ExportMenuProps = {
  documentVersionId: string | null;
  documentStatus: string | null | undefined;
  completedChapters: number;
};

export function ExportMenu({
  documentVersionId,
  documentStatus,
  completedChapters,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState<'pdf' | 'docx' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canExport =
    Boolean(documentVersionId) &&
    completedChapters > 0 &&
    documentStatus !== 'queued';

  const exportBlockedDuringRun =
    documentStatus === 'generating' && completedChapters === 0;

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const handleExport = useCallback(
    async (format: 'pdf' | 'docx') => {
      if (!documentVersionId || !canExport) return;
      setLoadingFormat(format);
      setError(null);
      setOpen(false);
      try {
        await downloadDrhpExport(documentVersionId, format);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed. Please try again.');
      } finally {
        setLoadingFormat(null);
      }
    },
    [canExport, documentVersionId],
  );

  const disabledReason = exportBlockedDuringRun
    ? 'Generation in progress'
    : completedChapters <= 0
      ? 'Generate a draft before exporting'
      : !documentVersionId
        ? 'No generated draft loaded'
        : 'Export unavailable';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        disabled={!canExport || loadingFormat !== null || exportBlockedDuringRun}
        title={canExport ? 'Export this DRHP draft' : disabledReason}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium',
          canExport
            ? 'text-foreground hover:bg-muted'
            : 'cursor-not-allowed text-muted-foreground opacity-60',
        )}
      >
        {loadingFormat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        Export
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && canExport ? (
        <div className="absolute right-0 z-20 mt-1 min-w-[10rem] rounded-md border border-border bg-popover p-1 shadow-md">
          <button
            type="button"
            className="flex w-full rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
            onClick={() => void handleExport('pdf')}
          >
            Download PDF
          </button>
          <button
            type="button"
            className="flex w-full rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
            onClick={() => void handleExport('docx')}
          >
            Download DOCX
          </button>
        </div>
      ) : null}
      {error ? <p className="absolute right-0 top-full mt-1 max-w-xs text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
