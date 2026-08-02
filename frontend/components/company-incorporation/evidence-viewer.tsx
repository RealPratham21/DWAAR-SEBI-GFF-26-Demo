'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { Download, Loader2, Minus, Plus, RotateCcw, X } from 'lucide-react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/company-incorporation/status-badge';
import { requestDocumentDownloadUrl } from '@/lib/api/company-incorporation-documents';
import type {
  FactEvidenceItem,
  FactEvidenceResponse,
} from '@/lib/company-incorporation/extraction/types';
import { cn } from '@/lib/utils';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const LOW_OCR_CONFIDENCE = 0.8;

type SourceKind = 'pdf' | 'image' | 'unsupported';

interface NormalizedBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface RenderedSize {
  width: number;
  height: number;
}

interface EvidenceViewerProps {
  open: boolean;
  onClose: () => void;
  assertionId: string | null;
  evidence: FactEvidenceResponse | null;
  loading: boolean;
  sourceFilename?: string;
  versionNumber?: number;
  documentVersionId?: string | null;
}

function toNormalizedBox(item: FactEvidenceItem): NormalizedBox | null {
  const snapshot = item.bboxSnapshot;
  const values = [snapshot?.x0, snapshot?.y0, snapshot?.x1, snapshot?.y1];
  if (!values.every((value) => typeof value === 'number' && Number.isFinite(value))) {
    return null;
  }
  const [x0, y0, x1, y1] = values as [number, number, number, number];
  const withinUnitSquare = [x0, y0, x1, y1].every((value) => value >= -0.001 && value <= 1.001);
  if (!withinUnitSquare || x1 <= x0 || y1 <= y0) {
    return null;
  }
  return { x0, y0, x1, y1 };
}

function detectSourceKind(contentType: string | null, filename: string | null): SourceKind {
  const type = (contentType ?? '').toLowerCase();
  if (type.includes('pdf')) return 'pdf';
  if (type.startsWith('image/')) return 'image';
  const name = (filename ?? '').toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (/\.(png|jpe?g)$/.test(name)) return 'image';
  return 'unsupported';
}

function evidenceRoleLabel(role: string): string {
  switch (role) {
    case 'primary':
      return 'Primary evidence';
    case 'supporting':
      return 'Supporting evidence';
    case 'label':
      return 'Label reference';
    case 'context':
      return 'Surrounding context';
    default:
      return role ? role.replaceAll('_', ' ') : 'Evidence';
  }
}

function extractionMethodLabel(method: string): string {
  switch (method) {
    case 'native_text':
      return 'Native text';
    case 'ocr':
      return 'OCR';
    default:
      return method ? method.replaceAll('_', ' ') : 'Unknown';
  }
}

function qualityWarningsFor(item: FactEvidenceItem, box: NormalizedBox | null): string[] {
  const warnings: string[] = [];
  if (!box) {
    warnings.push('Exact location on the page is unavailable, so the quoted text is shown instead.');
  }
  if (item.extractionMethod === 'ocr') {
    warnings.push('This text was recovered by OCR from a scanned page.');
  }
  if (typeof item.ocrConfidence === 'number' && item.ocrConfidence < LOW_OCR_CONFIDENCE) {
    warnings.push(
      `OCR confidence for this block is ${Math.round(item.ocrConfidence * 100)}%. Confirm the value against the page.`,
    );
  }
  if (!item.quoteSnapshot.trim()) {
    warnings.push('No quoted text was captured for this evidence block.');
  }
  return warnings;
}

export function EvidenceViewer({
  open,
  onClose,
  assertionId,
  evidence,
  loading,
  sourceFilename,
  versionNumber,
  documentVersionId,
}: EvidenceViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageFrameRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const [resolvedFilename, setResolvedFilename] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [renderedSize, setRenderedSize] = useState<RenderedSize | null>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [activePage, setActivePage] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const items = useMemo(() => evidence?.items ?? [], [evidence]);

  const pageNumbers = useMemo(() => {
    const unique = new Set<number>();
    items.forEach((item) => unique.add(item.pageNumber));
    return Array.from(unique).sort((a, b) => a - b);
  }, [items]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setRenderError(null);
  }, [open, assertionId]);

  useEffect(() => {
    if (pageNumbers.length === 0) {
      setActivePage(null);
      return;
    }
    setActivePage((current) =>
      current !== null && pageNumbers.includes(current) ? current : pageNumbers[0],
    );
  }, [pageNumbers]);

  useEffect(() => {
    setSelectedItemId((current) => {
      if (current && items.some((item) => item.id === current)) return current;
      return items[0]?.id ?? null;
    });
  }, [items]);

  useEffect(() => {
    if (!open || !documentVersionId) {
      setDownloadUrl(null);
      setContentType(null);
      setResolvedFilename(null);
      return;
    }
    let cancelled = false;
    setUrlLoading(true);
    setUrlError(null);
    (async () => {
      try {
        const response = await requestDocumentDownloadUrl(documentVersionId);
        if (cancelled) return;
        setDownloadUrl(response.downloadUrl);
        setContentType(response.contentType);
        setResolvedFilename(response.originalFilename);
      } catch {
        if (cancelled) return;
        setDownloadUrl(null);
        setUrlError('Unable to open the source document. The quoted text is shown below instead.');
      } finally {
        if (!cancelled) setUrlLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentVersionId, open]);

  const sourceKind = detectSourceKind(contentType, resolvedFilename ?? sourceFilename ?? null);

  useEffect(() => {
    const frame = pageFrameRef.current;
    if (!open || !frame || typeof ResizeObserver === 'undefined') return;
    setFrameWidth(frame.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setFrameWidth(entry.contentRect.width);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [open]);

  // Load the PDF document once per source URL; page rendering is a separate effect.
  useEffect(() => {
    if (!open || sourceKind !== 'pdf' || !downloadUrl) {
      setPdfDocument(null);
      return;
    }
    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        try {
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url,
          ).toString();
        } catch {
          // Leaving workerSrc unset makes pdf.js load its worker module on the
          // main thread, which is slower but still renders the page.
        }
        const task = pdfjs.getDocument({ url: downloadUrl });
        loaded = await task.promise;
        if (cancelled) {
          void loaded.destroy();
          return;
        }
        setPdfDocument(loaded);
        setRenderError(null);
      } catch {
        if (cancelled) return;
        setPdfDocument(null);
        setRenderError(
          'The document page could not be displayed here. The quoted text and page reference are shown below.',
        );
      }
    })();
    return () => {
      cancelled = true;
      if (loaded) void loaded.destroy();
    };
  }, [downloadUrl, open, sourceKind]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!open || !pdfDocument || !canvas || !activePage || frameWidth <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        const pageNumber = Math.min(Math.max(activePage, 1), pdfDocument.numPages);
        const page = await pdfDocument.getPage(pageNumber);
        if (cancelled) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const displayScale = (frameWidth / baseViewport.width) * zoom;
        const viewport = page.getViewport({ scale: displayScale });
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas context unavailable.');

        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * devicePixelRatio);
        canvas.height = Math.floor(viewport.height * devicePixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        renderTaskRef.current?.cancel();
        const task = page.render({
          canvasContext: context,
          viewport,
          transform:
            devicePixelRatio === 1 ? undefined : [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0],
        });
        renderTaskRef.current = task;
        await task.promise;
        if (cancelled) return;
        setRenderedSize({ width: viewport.width, height: viewport.height });
        setRenderError(null);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.name === 'RenderingCancelledException') return;
        setRenderError(
          'The document page could not be displayed here. The quoted text and page reference are shown below.',
        );
      }
    })();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [activePage, frameWidth, open, pdfDocument, zoom]);

  const handleImageLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      setRenderedSize({ width: image.clientWidth, height: image.clientHeight });
      setRenderError(null);
    },
    [],
  );

  const pageItems = useMemo(
    () => items.filter((item) => item.pageNumber === activePage),
    [activePage, items],
  );

  const overlays = useMemo(() => {
    if (!renderedSize) return [];
    return pageItems
      .map((item) => ({ item, box: toNormalizedBox(item) }))
      .filter((entry): entry is { item: FactEvidenceItem; box: NormalizedBox } => entry.box !== null)
      .map(({ item, box }) => ({
        item,
        left: box.x0 * renderedSize.width,
        top: box.y0 * renderedSize.height,
        width: (box.x1 - box.x0) * renderedSize.width,
        height: (box.y1 - box.y0) * renderedSize.height,
      }));
  }, [pageItems, renderedSize]);

  const canRenderPage =
    (sourceKind === 'pdf' || sourceKind === 'image') && Boolean(downloadUrl) && !renderError;
  const unalignedItems = pageItems.filter((item) => toNormalizedBox(item) === null);
  const showQuoteFallback = !canRenderPage || unalignedItems.length > 0;
  const documentLabel = resolvedFilename ?? sourceFilename ?? 'Source document';

  if (!open) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="evidence-viewer-title"
      className="fixed inset-0 z-50 m-auto h-[min(100%-2rem,52rem)] w-[min(100%-2rem,72rem)] rounded-lg border border-border bg-card p-0 shadow-xl backdrop:bg-black/50"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id="evidence-viewer-title" className="text-base font-semibold text-foreground">
              Evidence
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {documentLabel}
              {typeof versionNumber === 'number' ? ` · Version ${versionNumber}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {downloadUrl ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(downloadUrl, '_blank', 'noopener,noreferrer')}
              >
                <Download size={14} />
                Open document
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close evidence viewer"
            >
              <X size={16} />
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-0 flex-1 flex-col border-b border-border lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
              {pageNumbers.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Evidence pages">
                  <span className="mr-1 text-xs text-muted-foreground">Page</span>
                  {pageNumbers.map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      type="button"
                      size="xs"
                      variant={pageNumber === activePage ? 'default' : 'outline'}
                      aria-pressed={pageNumber === activePage}
                      onClick={() => setActivePage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  ))}
                </div>
              ) : null}
              <div className="ml-auto flex items-center gap-1" role="group" aria-label="Zoom controls">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  aria-label="Zoom out"
                  disabled={zoom <= MIN_ZOOM}
                  onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
                >
                  <Minus size={12} />
                </Button>
                <span className="w-12 text-center text-xs text-muted-foreground" aria-live="polite">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  aria-label="Zoom in"
                  disabled={zoom >= MAX_ZOOM}
                  onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
                >
                  <Plus size={12} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  aria-label="Reset zoom"
                  onClick={() => setZoom(1)}
                >
                  <RotateCcw size={12} />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-muted/30 p-4">
              <div ref={pageFrameRef} className="mx-auto w-full">
                {loading || urlLoading ? (
                  <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    Loading evidence…
                  </div>
                ) : null}

                {!loading && !urlLoading && canRenderPage ? (
                  <div className="relative inline-block max-w-full">
                    {sourceKind === 'pdf' ? (
                      <canvas
                        ref={canvasRef}
                        className="block rounded-sm border border-border bg-white"
                        aria-label={`Page ${activePage ?? 1} of ${documentLabel}`}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={downloadUrl ?? ''}
                        alt={`Page ${activePage ?? 1} of ${documentLabel}`}
                        onLoad={handleImageLoad}
                        onError={() =>
                          setRenderError(
                            'The document image could not be displayed here. The quoted text and page reference are shown below.',
                          )
                        }
                        style={{ width: `${frameWidth * zoom}px` }}
                        className="block max-w-none rounded-sm border border-border bg-white"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0" aria-hidden>
                      {overlays.map(({ item, left, top, width, height }) => (
                        <span
                          key={item.id}
                          className={cn(
                            'absolute rounded-[2px] border-2',
                            item.id === selectedItemId
                              ? 'border-accent bg-accent/20'
                              : 'border-warning/70 bg-warning/10',
                          )}
                          style={{
                            left: `${left}px`,
                            top: `${top}px`,
                            width: `${width}px`,
                            height: `${height}px`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {!loading && !urlLoading && !canRenderPage ? (
                  <div className="rounded-md border border-dashed border-border bg-card px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      {urlError ??
                        renderError ??
                        (sourceKind === 'unsupported'
                          ? 'This document type cannot be previewed here. The quoted text and page reference are shown alongside.'
                          : 'No document preview is available. The quoted text and page reference are shown alongside.')}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-y-auto lg:w-[24rem]">
            <div className="space-y-4 p-4">
              {urlError && canRenderPage ? (
                <p className="border-l-2 border-warning pl-3 text-sm text-warning" role="status">
                  {urlError}
                </p>
              ) : null}

              {!loading && items.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                  No evidence references were recorded for this fact.
                </p>
              ) : null}

              {items.map((item) => {
                const box = toNormalizedBox(item);
                const warnings = qualityWarningsFor(item, box);
                const isSelected = item.id === selectedItemId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setActivePage(item.pageNumber);
                    }}
                    aria-pressed={isSelected}
                    className={cn(
                      'w-full rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSelected ? 'border-accent bg-accent/5' : 'border-border bg-card hover:bg-muted/40',
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge label={evidenceRoleLabel(item.evidenceRole)} tone="informative" />
                      <StatusBadge label={`Page ${item.pageNumber}`} />
                      <StatusBadge label={extractionMethodLabel(item.extractionMethod)} />
                      {typeof item.ocrConfidence === 'number' ? (
                        <StatusBadge
                          label={`OCR ${Math.round(item.ocrConfidence * 100)}%`}
                          tone={item.ocrConfidence < LOW_OCR_CONFIDENCE ? 'caution' : 'neutral'}
                        />
                      ) : null}
                      {box ? null : <StatusBadge label="Location unavailable" tone="caution" />}
                    </div>

                    <blockquote className="mt-3 border-l-2 border-border pl-3 text-sm text-foreground">
                      {item.quoteSnapshot.trim() || 'No quoted text captured.'}
                    </blockquote>

                    {warnings.length > 0 ? (
                      <ul className="mt-3 space-y-1">
                        {warnings.map((warning) => (
                          <li key={warning} className="text-xs text-muted-foreground">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </button>
                );
              })}

              {showQuoteFallback && items.length > 0 ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Where the highlighted location on the page is unavailable, the quoted text above is
                  the authoritative record of what was read from the document.
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </dialog>
  );
}
