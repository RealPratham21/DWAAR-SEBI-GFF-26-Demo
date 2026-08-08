'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  fetchIssuesGaps,
  fetchIssuesGapsSummary,
  patchIssueAcknowledgement,
  type GlobalIssue,
  type GlobalIssueSummary,
  type IssueSeverity,
} from '@/lib/api/issues-gaps';
import { formatWorkstreamLabel } from '@/lib/drhp/workstream-labels';

const SEVERITY_STYLES: Record<IssueSeverity, string> = {
  blocking: 'bg-destructive/15 text-destructive border-destructive/30',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-muted text-muted-foreground border-border',
};

const CATEGORY_FILTER_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'missing_information', label: 'Missing information' },
  { value: 'inconsistent_information', label: 'Inconsistency' },
  { value: 'evidence_gap', label: 'Evidence' },
  { value: 'professional_confirmation', label: 'Professional review' },
  { value: 'approval_or_renewal', label: 'Regulatory / approval' },
  { value: 'drhp_readiness', label: 'DRHP readiness' },
  { value: 'generation_warning', label: 'Generation warning' },
  { value: 'stale_draft', label: 'Stale draft' },
];

function formatCategory(category: string): string {
  return category.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function SummaryCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'danger' | 'warning' | 'muted';
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-destructive/20 bg-destructive/5'
      : tone === 'warning'
        ? 'border-warning/20 bg-warning/5'
        : tone === 'muted'
          ? 'border-border bg-muted/40'
          : 'border-border bg-card';
  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function IssueDetailDrawer({
  issue,
  onClose,
  onAcknowledged,
}: {
  issue: GlobalIssue;
  onClose: () => void;
  onAcknowledged: (updated: GlobalIssue) => void;
}) {
  const [note, setNote] = useState(issue.acknowledgementNote ?? '');
  const [saving, setSaving] = useState(false);

  const handleAcknowledge = async () => {
    setSaving(true);
    try {
      await patchIssueAcknowledgement(issue.id, { acknowledged: true, note: note || null });
      onAcknowledged({
        ...issue,
        acknowledged: true,
        lifecycleState: 'acknowledged',
        acknowledgementNote: note || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button className="flex-1" aria-label="Close issue detail" onClick={onClose} />
      <aside className="flex h-full w-full max-w-lg flex-col border-l border-border bg-background shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium uppercase ${SEVERITY_STYLES[issue.severity]}`}
            >
              {issue.severity}
            </span>
            <h2 className="mt-2 text-lg font-semibold text-foreground">{issue.title}</h2>
            <p className="text-sm text-muted-foreground capitalize">{issue.lifecycleState}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm">
          <section>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Description</h3>
            <p className="mt-1 text-foreground">{issue.description}</p>
          </section>

          {issue.whyItMatters && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Why it matters</h3>
              <p className="mt-1 text-foreground">{issue.whyItMatters}</p>
            </section>
          )}

          <section className="grid grid-cols-2 gap-3">
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Category</h3>
              <p className="mt-1">{formatCategory(issue.category)}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Workstream</h3>
              <p className="mt-1">{issue.workstreamLabel || '—'}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Section</h3>
              <p className="mt-1">{issue.sectionLabel || '—'}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Record</h3>
              <p className="mt-1">{issue.recordLabel || '—'}</p>
            </div>
          </section>

          {issue.metadata?.canonicalSource != null && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Canonical source</h3>
              <p className="mt-1">
                {formatWorkstreamLabel(String(issue.metadata.canonicalSource))}
              </p>
            </section>
          )}

          {issue.metadata?.conflictingSource != null && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Conflicting source</h3>
              <p className="mt-1">
                {formatWorkstreamLabel(String(issue.metadata.conflictingSource))}
              </p>
            </section>
          )}

          {issue.evidenceRefs.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Evidence</h3>
              <ul className="mt-2 space-y-2">
                {issue.evidenceRefs.map((ref, idx) => (
                  <li key={idx} className="rounded-md border border-border bg-muted/30 px-3 py-2">
                    <p className="font-medium">{ref.originalFilename ?? 'Document'}</p>
                    {ref.pageNumbers?.length ? (
                      <p className="text-xs text-muted-foreground">Pages: {ref.pageNumbers.join(', ')}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {issue.affectedDrhpChapterLabels.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Affected DRHP chapters</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {issue.affectedDrhpChapterLabels.map((label) => (
                  <span key={label} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                    {label}
                  </span>
                ))}
              </div>
            </section>
          )}

          {issue.suggestedAction && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Suggested action</h3>
              <p className="mt-1 text-foreground">{issue.suggestedAction}</p>
            </section>
          )}

          <section>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Acknowledgement note</h3>
            <textarea
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note — does not clear the issue."
            />
            {!issue.acknowledged && (
              <Button className="mt-2" onClick={handleAcknowledge} disabled={saving}>
                Acknowledge
              </Button>
            )}
            {issue.acknowledged && (
              <p className="mt-2 text-xs text-muted-foreground">Acknowledged — source issue remains open.</p>
            )}
          </section>
        </div>

        <div className="flex gap-2 border-t border-border px-6 py-4">
          {issue.openSourceUrl && (
            <Link
              href={issue.openSourceUrl}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Open source
              <ExternalLink size={14} />
            </Link>
          )}
          {issue.openDrhpUrl && (
            <Link
              href={issue.openDrhpUrl}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              View affected DRHP chapter
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}

export function IssuesGapsWorkspace() {
  const [issues, setIssues] = useState<GlobalIssue[]>([]);
  const [summary, setSummary] = useState<GlobalIssueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GlobalIssue | null>(null);
  const [severity, setSeverity] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [workstream, setWorkstream] = useState<string>('');
  const [lifecycleState, setLifecycleState] = useState<string>('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, summaryData] = await Promise.all([
        fetchIssuesGaps({
          severity: (severity || undefined) as IssueSeverity | undefined,
          category: category || undefined,
          workstream: workstream || undefined,
          lifecycleState: (lifecycleState || undefined) as GlobalIssue['lifecycleState'] | undefined,
          search: search || undefined,
        }),
        fetchIssuesGapsSummary(),
      ]);
      setIssues(list.issues);
      setSummary(summaryData);
    } finally {
      setLoading(false);
    }
  }, [severity, category, workstream, lifecycleState, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const workstreamOptions = useMemo(() => {
    const keys = new Set(issues.map((i) => i.workstreamKey).filter(Boolean));
    return Array.from(keys).sort();
  }, [issues]);

  const needsAttention = (summary?.blocking ?? 0) + (summary?.high ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issues & Gaps"
        description="Review unresolved information, inconsistencies, evidence gaps and preparation items across the IPO process."
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Issues & Gaps' },
        ]}
      />

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Blocking" value={summary.blocking} tone="danger" />
          <SummaryCard label="Needs attention" value={needsAttention} tone="warning" />
          <SummaryCard label="Professional review" value={summary.professionalReview} />
          <SummaryCard label="Acknowledged" value={summary.acknowledged} tone="muted" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          aria-label="Severity filter"
        >
          <option value="">All severities</option>
          <option value="blocking">Blocking</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category filter"
        >
          {CATEGORY_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={workstream}
          onChange={(e) => setWorkstream(e.target.value)}
          aria-label="Workstream filter"
        >
          <option value="">All workstreams</option>
          {workstreamOptions.map((key) => (
            <option key={key} value={key}>
              {formatWorkstreamLabel(key)}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={lifecycleState}
          onChange={(e) => setLifecycleState(e.target.value)}
          aria-label="Status filter"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
        </select>

        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm"
            placeholder="Search issues…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading issues…</p>
      ) : issues.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
          <p className="text-foreground">No open issues detected from the information currently available.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Workstream / Section</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Affected DRHP</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className="border-b border-border/70 hover:bg-muted/20">
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium uppercase ${SEVERITY_STYLES[issue.severity]}`}
                    >
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <button
                      className="text-left font-medium text-foreground hover:underline"
                      onClick={() => setSelected(issue)}
                    >
                      {issue.title}
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">
                    <div>{issue.workstreamLabel || '—'}</div>
                    <div className="text-xs">{issue.sectionLabel || '—'}</div>
                  </td>
                  <td className="px-4 py-3 align-top">{formatCategory(issue.category)}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="max-w-[220px] truncate text-xs text-muted-foreground">
                      {issue.affectedDrhpChapterLabels.slice(0, 3).join(', ') ||
                        issue.affectedDrhpChapters.slice(0, 3).join(', ') ||
                        '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top capitalize">{issue.lifecycleState}</td>
                  <td className="px-4 py-3 align-top">
                    <button
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      onClick={() => setSelected(issue)}
                    >
                      Review
                      <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <IssueDetailDrawer
          issue={selected}
          onClose={() => setSelected(null)}
          onAcknowledged={(updated) => {
            setSelected(updated);
            setIssues((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
            void load();
          }}
        />
      )}
    </div>
  );
}
