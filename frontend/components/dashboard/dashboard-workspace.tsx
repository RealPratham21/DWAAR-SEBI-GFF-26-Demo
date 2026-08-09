'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Download,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { downloadDrhpExport } from '@/lib/api/drhp';
import {
  fetchDashboardSummary,
  type DashboardSummary,
} from '@/lib/api/dashboard-summary';
import { workspaceLabels } from '@/lib/workspace/format';

function formatGeneratedAt(value: string | null): string {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

const SEVERITY_STYLES: Record<string, string> = {
  blocking: 'bg-destructive/15 text-destructive border-destructive/30',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  low: 'bg-muted text-muted-foreground border-border',
  document: 'bg-primary/10 text-primary border-primary/20',
};

const PROGRESS_CHIP: Record<string, string> = {
  complete: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-primary/10 text-primary border-primary/20',
  not_started: 'bg-muted text-muted-foreground border-border',
};

function KpiCard({
  label,
  primary,
  secondary,
  href,
}: {
  label: string;
  primary: string;
  secondary: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent/40">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{primary}</p>
      <p className="mt-1 text-sm text-muted-foreground">{secondary}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

function formatContextChip(
  value: string,
  formatter?: (value: string) => string,
): string {
  if (!value) return '';
  if (formatter) {
    const formatted = formatter(value);
    if (formatted && formatted !== value) return formatted;
  }
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function IssuerContextStrip({ summary }: { summary: DashboardSummary }) {
  const ctx = summary.issuerContext;
  const chips = [
    ctx.issuerName,
    formatContextChip(ctx.targetExchange, workspaceLabels.intendedExchange),
    formatContextChip(ctx.issueType, workspaceLabels.proposedIssueType),
    formatContextChip(ctx.preparationStage, workspaceLabels.preparationStage),
    formatContextChip(ctx.targetTimeline, workspaceLabels.targetTimeline),
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded-full border border-border bg-muted/40 px-3 py-1 text-foreground"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

function WorkstreamMatrix({ items }: { items: DashboardSummary['workstreams']['items'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Workstream</th>
            <th className="pb-3 px-2 font-medium">Info</th>
            <th className="pb-3 px-2 font-medium">Issues</th>
            <th className="pb-3 px-2 font-medium">Documents</th>
            <th className="pb-3 pl-2 font-medium">Status</th>
            <th className="pb-3 pl-2 font-medium w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((ws) => {
            const infoPct =
              ws.totalSections > 0
                ? Math.round((ws.completedSections / ws.totalSections) * 100)
                : 0;
            return (
              <tr key={ws.key} className="group hover:bg-muted/30">
                <td className="py-3 pr-4">
                  <Link href={ws.href} className="font-medium text-foreground hover:text-accent">
                    {ws.label}
                  </Link>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-muted-foreground">
                      {ws.completedSections}/{ws.totalSections}
                    </span>
                    <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
                      <div className="h-full bg-accent" style={{ width: `${infoPct}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  {ws.openIssues > 0 ? (
                    <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      {ws.openIssues}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td className="py-3 px-2 tabular-nums text-muted-foreground">
                  {ws.documentExpected > 0
                    ? `${ws.documentProvided}/${ws.documentExpected}`
                    : '—'}
                </td>
                <td className="py-3 pl-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                      PROGRESS_CHIP[ws.progressState] ?? PROGRESS_CHIP.not_started
                    }`}
                  >
                    {ws.progressStateLabel}
                  </span>
                </td>
                <td className="py-3 pl-2">
                  <Link
                    href={ws.href}
                    className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-accent"
                    aria-label={`Open ${ws.label}`}
                  >
                    <ArrowRight size={16} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NeedsAttentionPanel({ issues }: { issues: DashboardSummary['issues'] }) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold text-foreground">Needs Your Attention</h2>
      </div>
      <div className="flex-1 divide-y divide-border">
        {issues.topIssues.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No open issues requiring immediate attention.
          </p>
        ) : (
          issues.topIssues.map((issue) => (
            <Link
              key={issue.issueId}
              href={issue.href}
              className="block px-5 py-4 transition-colors hover:bg-muted/40"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded border px-2 py-0.5 text-xs font-semibold uppercase ${
                    SEVERITY_STYLES[issue.severity] ?? SEVERITY_STYLES.medium
                  }`}
                >
                  {issue.severityLabel}
                </span>
                {issue.workstreamLabel && (
                  <span className="text-xs text-muted-foreground">{issue.workstreamLabel}</span>
                )}
              </div>
              <p className="font-medium text-foreground">{issue.title}</p>
              {issue.reason && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{issue.reason}</p>
              )}
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent">
                Review <ArrowRight size={12} />
              </span>
            </Link>
          ))
        )}
      </div>
      {issues.open > 0 && (
        <div className="border-t border-border px-5 py-3">
          <Link
            href="/projects/demo/issues-gaps"
            className="text-sm font-medium text-accent hover:opacity-80"
          >
            View all {issues.open} issues →
          </Link>
        </div>
      )}
    </div>
  );
}

function SupportTypeBar({ facts }: { facts: DashboardSummary['factsEvidence'] }) {
  const segments = [
    { label: 'Document-backed', value: facts.documentBackedFacts, color: 'bg-primary' },
    { label: 'Structured input', value: facts.structuredInputFacts, color: 'bg-accent' },
    { label: 'Calculated', value: facts.calculatedFacts, color: 'bg-violet-500' },
    { label: 'Professional confirmation', value: facts.professionalConfirmationFacts, color: 'bg-amber-500' },
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className="space-y-2">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
        {segments.map((seg) =>
          seg.value > 0 ? (
            <div
              key={seg.label}
              className={`${seg.color} h-full`}
              style={{ width: `${(seg.value / total) * 100}%` }}
              title={`${seg.label}: ${seg.value}`}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((seg) => (
          <span key={seg.label} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${seg.color}`} />
            {seg.label}: {seg.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function DueDiligencePanel({
  facts,
  dataRoom,
}: {
  facts: DashboardSummary['factsEvidence'];
  dataRoom: DashboardSummary['dataRoom'];
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-4 font-semibold text-foreground">Due Diligence Coverage</h2>
      <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
        <Link href="/projects/demo/facts" className="rounded-md border border-border p-3 hover:bg-muted/40">
          <p className="text-xs text-muted-foreground">Canonical facts</p>
          <p className="text-lg font-semibold">{facts.canonicalFacts}</p>
        </Link>
        <Link href="/projects/demo/facts" className="rounded-md border border-border p-3 hover:bg-muted/40">
          <p className="text-xs text-muted-foreground">Document-backed</p>
          <p className="text-lg font-semibold">{facts.documentBackedFacts}</p>
        </Link>
        <Link href="/projects/demo/facts" className="rounded-md border border-border p-3 hover:bg-muted/40">
          <p className="text-xs text-muted-foreground">Structured inputs</p>
          <p className="text-lg font-semibold">{facts.structuredInputFacts}</p>
        </Link>
        <Link href="/projects/demo/facts" className="rounded-md border border-border p-3 hover:bg-muted/40">
          <p className="text-xs text-muted-foreground">Calculated</p>
          <p className="text-lg font-semibold">{facts.calculatedFacts}</p>
        </Link>
        <Link
          href="/projects/demo/issues-gaps?category=professional_confirmation"
          className="rounded-md border border-border p-3 hover:bg-muted/40"
        >
          <p className="text-xs text-muted-foreground">Professional confirmation</p>
          <p className="text-lg font-semibold">{facts.professionalConfirmationFacts}</p>
        </Link>
        <Link href="/projects/demo/drhp" className="rounded-md border border-border p-3 hover:bg-muted/40">
          <p className="text-xs text-muted-foreground">Facts in latest DRHP</p>
          <p className="text-lg font-semibold">{facts.factsUsedInLatestDrhp}</p>
        </Link>
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Fact support types
      </p>
      <SupportTypeBar facts={facts} />

      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Data Room
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Link href="/projects/demo/data-room" className="hover:text-accent">
            <span className="text-muted-foreground">Uploaded documents</span>
            <p className="font-semibold">{dataRoom.uploadedDocuments}</p>
          </Link>
          <Link href="/projects/demo/data-room" className="hover:text-accent">
            <span className="text-muted-foreground">Provided / applicable</span>
            <p className="font-semibold">
              {dataRoom.providedRequirements}/{dataRoom.expectedApplicable}
            </p>
          </Link>
          <Link
            href="/projects/demo/data-room?status=not_provided"
            className="hover:text-accent"
          >
            <span className="text-muted-foreground">Missing expected</span>
            <p className="font-semibold">{dataRoom.missingRequirements}</p>
          </Link>
          <Link href="/projects/demo/data-room" className="hover:text-accent">
            <span className="text-muted-foreground">Evidence items</span>
            <p className="font-semibold">{facts.evidenceItems}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function DrhpWidget({
  drhp,
  onDownload,
  downloading,
}: {
  drhp: DashboardSummary['drhp'];
  onDownload: (format: 'pdf' | 'docx') => void;
  downloading: 'pdf' | 'docx' | null;
}) {
  const chapterSegments = useMemo(() => {
    if (!drhp.exists || drhp.chapterTotal === 0) return [];
    const total = drhp.chapterTotal;
    return [
      { label: 'Generated', value: drhp.generated, color: 'bg-emerald-500' },
      { label: 'With warnings', value: drhp.generatedWithWarnings, color: 'bg-amber-500' },
      { label: 'Blocked', value: drhp.blocked, color: 'bg-destructive' },
      { label: 'Failed', value: drhp.failed, color: 'bg-muted-foreground' },
    ].filter((s) => s.value > 0 || s.label === 'Generated');
  }, [drhp]);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-foreground">Draft DRHP</h2>
          {!drhp.exists ? (
            <p className="mt-1 text-sm text-muted-foreground">No draft generated yet</p>
          ) : (
            <>
              <p className="mt-1 text-lg font-bold text-foreground">
                Draft v{drhp.versionNumber}
              </p>
              <p className="text-sm text-muted-foreground">{drhp.statusLabel}</p>
              <p className="text-xs text-muted-foreground">
                {formatGeneratedAt(drhp.generatedAt)}
              </p>
            </>
          )}
        </div>
        <FileText className="text-accent" size={28} />
      </div>

      {drhp.exists ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Chapters</p>
              <p className="font-semibold">{drhp.chapterTotal}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Generated</p>
              <p className="font-semibold">{drhp.generated}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">With warnings</p>
              <p className="font-semibold">{drhp.generatedWithWarnings}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Blocked / failed</p>
              <p className="font-semibold">
                {drhp.blocked} / {drhp.failed}
              </p>
            </div>
          </div>

          {chapterSegments.length > 0 && drhp.chapterTotal > 0 && (
            <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-muted">
              {chapterSegments.map((seg) => (
                <div
                  key={seg.label}
                  className={`${seg.color} h-full`}
                  style={{ width: `${(seg.value / drhp.chapterTotal) * 100}%` }}
                />
              ))}
            </div>
          )}

          {drhp.stale && (
            <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
              Source information changed since this draft was generated.
              {drhp.affectedChapterCount > 0 && (
                <span> {drhp.affectedChapterCount} chapters affected.</span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Link
              href={drhp.openUrl}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              View Draft
            </Link>
            {drhp.exportAvailable && drhp.versionId && (
              <>
                <button
                  type="button"
                  disabled={downloading !== null}
                  onClick={() => onDownload('pdf')}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  <Download size={16} />
                  {downloading === 'pdf' ? 'Preparing…' : 'Download PDF'}
                </button>
                <button
                  type="button"
                  disabled={downloading !== null}
                  onClick={() => onDownload('docx')}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  <Download size={16} />
                  {downloading === 'docx' ? 'Preparing…' : 'Download DOCX'}
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <Link
          href="/projects/demo/drhp"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Generate Draft DRHP
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-28 rounded-full bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-lg border border-border bg-muted/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
        <div className="h-96 rounded-lg border border-border bg-muted/40" />
        <div className="h-96 rounded-lg border border-border bg-muted/40" />
      </div>
    </div>
  );
}

export function DashboardWorkspace() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<'pdf' | 'docx' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!summary?.drhp.versionId) return;
    setDownloading(format);
    try {
      await downloadDrhpExport(summary.drhp.versionId, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dashboard" description="IPO preparation command centre" />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dashboard" description="IPO preparation command centre" />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 text-destructive" size={32} />
          <p className="font-medium text-foreground">{error ?? 'Dashboard unavailable'}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { workstreams, issues, factsEvidence, dataRoom, drhp, nextActions } = summary;
  const ws = workstreams;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="IPO preparation command centre"
      />

      <IssuerContextStrip summary={summary} />

      {summary.warnings.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          {summary.warnings.join(' ')}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Preparation Progress"
          primary={`${ws.complete} / ${ws.total} workstreams`}
          secondary={`${ws.completedSections} of ${ws.totalSections} sections complete`}
          href="/projects/demo/workstreams"
        />
        <KpiCard
          label="Open Issues"
          primary={`${issues.open} open`}
          secondary={[
            issues.high > 0 ? `${issues.high} high` : null,
            issues.professionalReview > 0
              ? `${issues.professionalReview} professional review`
              : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'No high-severity issues'}
          href="/projects/demo/issues-gaps"
        />
        <KpiCard
          label="Facts & Evidence"
          primary={`${factsEvidence.canonicalFacts} canonical facts`}
          secondary={`${factsEvidence.documentBackedFacts} document-backed · ${factsEvidence.factsUsedInLatestDrhp} used in DRHP`}
          href="/projects/demo/facts"
        />
        <KpiCard
          label="Latest DRHP"
          primary={
            drhp.exists ? `Draft v${drhp.versionNumber}` : 'Not generated'
          }
          secondary={
            drhp.exists
              ? `${drhp.chapterTotal} chapters · ${drhp.statusLabel.toLowerCase()}`
              : 'Generate when core information is ready'
          }
          href="/projects/demo/drhp"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">IPO Preparation Overview</h2>
            <Link
              href="/projects/demo/workstreams"
              className="text-sm font-medium text-accent hover:opacity-80"
            >
              All workstreams
            </Link>
          </div>
          <WorkstreamMatrix items={ws.items} />
        </div>
        <NeedsAttentionPanel issues={issues} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <DrhpWidget drhp={drhp} onDownload={handleDownload} downloading={downloading} />
        <DueDiligencePanel facts={factsEvidence} dataRoom={dataRoom} />
      </div>

      {nextActions.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Next Best Actions</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="divide-y divide-border">
              {nextActions.map((action, index) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/40"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{action.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <span className="flex flex-shrink-0 items-center gap-1 text-sm font-medium text-accent">
                    {action.actionLabel}
                    <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-3 font-semibold text-foreground">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {drhp.exists && (
            <Link
              href="/projects/demo/drhp"
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              View Draft DRHP
              <ArrowRight size={16} />
            </Link>
          )}
          <Link
            href="/projects/demo/issues-gaps"
            className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
          >
            Review Issues & Gaps
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/projects/demo/data-room"
            className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
          >
            Open Data Room
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/projects/demo/exports"
            className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
          >
            Download Readiness Report
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
