'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import {
  downloadButtonLabel,
  downloadReportExport,
  fetchReportsExportSummary,
  formatGeneratedAt,
  type ReportCard,
  type ReportsExportSummary,
} from '@/lib/api/reports-exports';

function cardIcon(cardId: string) {
  switch (cardId) {
    case 'readiness':
      return <BarChart3 size={24} />;
    case 'issues':
      return <AlertCircle size={24} />;
    case 'facts-evidence':
      return <CheckCircle2 size={24} />;
    case 'data-room':
    case 'workbook':
      return <FileSpreadsheet size={24} />;
    default:
      return <FileText size={24} />;
  }
}

function ExportCard({
  card,
  summary,
  onDownload,
  downloading,
}: {
  card: ReportCard;
  summary: ReportsExportSummary;
  onDownload: (card: ReportCard) => void;
  downloading: boolean;
}) {
  const isDrhp = card.cardId === 'drhp-docx' || card.cardId === 'drhp-pdf';
  const drhpMeta = card.cardId === 'drhp-docx' ? summary.drhpDocx : summary.drhpPdf;
  const showStale = isDrhp && drhpMeta.stale && drhpMeta.available;

  return (
    <div className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-accent">
      <div className="mb-4 flex items-start justify-between">
        <div className="text-accent">{cardIcon(card.cardId)}</div>
        <span className="text-xs font-medium text-muted-foreground">{card.statusLabel}</span>
      </div>

      <h3 className="mb-2 font-semibold text-foreground">{card.title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{card.description}</p>

      {card.progressRatio != null && card.progressCaption && (
        <div className="mb-4">
          <div className="mb-1 text-xs text-muted-foreground">{card.progressCaption}</div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${Math.round(card.progressRatio * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="mb-4 border-t border-border py-3">
        <p className="text-xs font-medium uppercase text-muted-foreground">Format</p>
        <p className="text-sm text-foreground">{card.formatLabel}</p>
        {card.detailLabel && (
          <p className="mt-2 text-sm text-muted-foreground">{card.detailLabel}</p>
        )}
        {isDrhp && drhpMeta.generatedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Generated: {formatGeneratedAt(drhpMeta.generatedAt)}
          </p>
        )}
      </div>

      {showStale && (
        <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
          Source information has changed since Draft v{drhpMeta.versionNumber} was generated.
          {drhpMeta.affectedChapterCount > 0 && (
            <span> {drhpMeta.affectedChapterCount} chapters may be affected.</span>
          )}
          <div className="mt-2">
            <Link href={drhpMeta.openDrhpUrl} className="text-primary hover:underline">
              Open DRHP
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!card.available || downloading}
        onClick={() => onDownload(card)}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 font-medium transition-opacity ${
          card.available
            ? 'bg-primary text-primary-foreground hover:opacity-90'
            : 'cursor-not-allowed bg-muted text-muted-foreground'
        }`}
      >
        <Download size={18} />
        {downloading ? 'Preparing…' : card.available ? downloadButtonLabel(card.downloadKind) : 'Not available'}
      </button>

      {!card.available && card.disabledReason && (
        <p className="mt-2 text-center text-xs text-muted-foreground">{card.disabledReason}</p>
      )}

      {card.cardId === 'issues' && card.available && (
        <button
          type="button"
          disabled={downloading}
          onClick={() => onDownload({ ...card, downloadKind: 'issues-csv' })}
          className="mt-2 w-full text-center text-xs text-primary hover:underline"
        >
          Download CSV instead
        </button>
      )}
    </div>
  );
}

export function ReportsExportsWorkspace() {
  const [summary, setSummary] = useState<ReportsExportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingKind, setDownloadingKind] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(await fetchReportsExportSummary());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load exports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = useMemo(() => summary?.cards ?? [], [summary]);

  async function handleDownload(card: ReportCard) {
    setDownloadingKind(card.downloadKind);
    setError('');
    try {
      const versionId =
        card.downloadKind === 'drhp-docx'
          ? summary?.drhpDocx.versionId
          : card.downloadKind === 'drhp-pdf'
            ? summary?.drhpPdf.versionId
            : null;
      await downloadReportExport(card.downloadKind, versionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloadingKind(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports & Export"
        description="Generate and download reports and registers from live project data"
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Reports & Export' },
        ]}
      />

      {summary && (
        <p className="text-sm text-muted-foreground">
          {summary.issuer} · {summary.workstreams.complete} of {summary.workstreams.total} workstreams
          complete · refreshed {formatGeneratedAt(summary.generatedAt)}
        </p>
      )}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading export options…</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <ExportCard
              key={card.cardId}
              card={card}
              summary={summary!}
              onDownload={handleDownload}
              downloading={downloadingKind === card.downloadKind}
            />
          ))}
        </div>
      )}
    </div>
  );
}
