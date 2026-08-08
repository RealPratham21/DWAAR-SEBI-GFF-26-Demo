'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  fetchGlobalEvidence,
  fetchGlobalEvidenceSummary,
  fetchGlobalFacts,
  fetchGlobalFactsSummary,
  type GlobalEvidence,
  type GlobalFact,
  type GlobalFactSummary,
  type GlobalEvidenceSummary,
} from '@/lib/api/facts-evidence';
import { formatWorkstreamLabel } from '@/lib/drhp/workstream-labels';

type Tab = 'facts' | 'evidence';

const SUPPORT_FILTER_OPTIONS = [
  { value: '', label: 'All support' },
  { value: 'document_backed', label: 'Document-backed' },
  { value: 'structured_issuer_input', label: 'Structured input' },
  { value: 'deterministic_calculation', label: 'Calculated' },
  { value: 'professional_confirmation', label: 'Professional confirmation' },
  { value: 'placeholder', label: 'Placeholder' },
];

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function FactDetailDrawer({
  fact,
  onClose,
}: {
  fact: GlobalFact;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button className="flex-1" aria-label="Close fact detail" onClick={onClose} />
      <aside className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">{fact.supportTypeLabel}</p>
            <h2 className="mt-1 text-lg font-semibold">{fact.label}</h2>
            <p className="text-sm text-muted-foreground">{fact.displayValue}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm">
          <section>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Canonical source</h3>
            <p className="mt-1">{fact.canonicalWorkstreamLabel}</p>
            <p className="text-muted-foreground">{fact.sectionLabel}</p>
            {fact.recordLabel && <p className="text-muted-foreground">{fact.recordLabel}</p>}
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Support</h3>
            <p className="mt-1">{fact.supportStateLabel}</p>
          </section>
          {fact.evidenceRefs.length > 0 ? (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Evidence</h3>
              <ul className="mt-2 space-y-2">
                {fact.evidenceRefs.map((ev, idx) => (
                  <li key={idx} className="rounded-md border border-border bg-muted/30 px-3 py-2">
                    <p className="font-medium">{ev.originalFilename ?? 'Document'}</p>
                    {ev.pageNumber != null && (
                      <p className="text-xs text-muted-foreground">Page {ev.pageNumber}</p>
                    )}
                    {ev.quoteSnapshot && (
                      <p className="mt-1 text-xs text-muted-foreground">{ev.quoteSnapshot}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Evidence</h3>
              <p className="mt-1 text-muted-foreground">
                Documentary evidence is not connected for this fact in the current prototype.
              </p>
            </section>
          )}
          {fact.calculatedFrom.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Derivation</h3>
              <ul className="mt-2 space-y-1">
                {fact.calculatedFrom.map((src, idx) => (
                  <li key={idx} className="text-muted-foreground">
                    {src.fieldLabel}: {String(src.valuePreview ?? '')}
                  </li>
                ))}
              </ul>
              {fact.calculationExpression && (
                <p className="mt-2 font-mono text-xs">{fact.calculationExpression}</p>
              )}
            </section>
          )}
          {fact.conflictingSource && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Conflicting source</h3>
              <p className="mt-1">
                {formatWorkstreamLabel(fact.conflictingSource.workstreamKey)} —{' '}
                {String(fact.conflictingSource.value ?? '')}
              </p>
            </section>
          )}
          <section>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Used in DRHP</h3>
            {fact.drhpUsage.length === 0 ? (
              <p className="mt-1 text-muted-foreground">Not referenced in the latest generated draft.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {fact.drhpUsage.map((usage) => (
                  <li key={`${usage.chapterKey}-${usage.blockId}`}>
                    <Link href={usage.openUrl} className="text-primary hover:underline">
                      Draft v{usage.documentVersionNumber} — {usage.chapterLabel}
                    </Link>
                    <p className="text-xs text-muted-foreground">{usage.sectionHeading}</p>
                    {usage.draftValuePreview != null && (
                      <p className="text-xs text-muted-foreground">
                        Draft value: {String(usage.draftValuePreview)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          {fact.relatedIssues.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Related issues</h3>
              <ul className="mt-2 space-y-2">
                {fact.relatedIssues.map((issue) => (
                  <li key={issue.issueId}>
                    <Link href={issue.openUrl} className="text-primary hover:underline">
                      {issue.title}
                    </Link>
                    <span className="ml-2 text-xs uppercase text-muted-foreground">{issue.severity}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <div className="border-t border-border px-6 py-4">
          <Link
            href={fact.openSourceUrl}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Open source
            <ExternalLink size={14} />
          </Link>
        </div>
      </aside>
    </div>
  );
}

function EvidenceDetailDrawer({ item, onClose }: { item: GlobalEvidence; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button className="flex-1" aria-label="Close evidence detail" onClick={onClose} />
      <aside className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{item.documentName}</h2>
            <p className="text-sm text-muted-foreground">
              Version {item.versionNumber ?? '—'}
              {item.pageNumber != null ? ` · Page ${item.pageNumber}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm">
          <section>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Category</h3>
            <p className="mt-1">{item.documentCategory || '—'}</p>
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Processing state</h3>
            <p className="mt-1 capitalize">{item.processingState}</p>
          </section>
          {item.extractedTextPreview && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Extracted snippet</h3>
              <p className="mt-1 text-muted-foreground">{item.extractedTextPreview}</p>
            </section>
          )}
          <section>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Supports facts</h3>
            <ul className="mt-2 list-disc pl-5">
              {item.supportedFactLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </section>
        </div>
        <div className="border-t border-border px-6 py-4">
          <Link
            href={item.openDocumentUrl}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Open document
            <ExternalLink size={14} />
          </Link>
        </div>
      </aside>
    </div>
  );
}

export function FactsEvidenceWorkspace() {
  const [tab, setTab] = useState<Tab>('facts');
  const [facts, setFacts] = useState<GlobalFact[]>([]);
  const [evidence, setEvidence] = useState<GlobalEvidence[]>([]);
  const [factSummary, setFactSummary] = useState<GlobalFactSummary | null>(null);
  const [evidenceSummary, setEvidenceSummary] = useState<GlobalEvidenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFact, setSelectedFact] = useState<GlobalFact | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<GlobalEvidence | null>(null);
  const [search, setSearch] = useState('');
  const [supportType, setSupportType] = useState('');
  const [workstream, setWorkstream] = useState('');
  const [usedInDrhp, setUsedInDrhp] = useState('');
  const [hasIssue, setHasIssue] = useState('');

  const loadFacts = useCallback(async () => {
    setLoading(true);
    try {
      const [list, summary] = await Promise.all([
        fetchGlobalFacts({
          search: search || undefined,
          workstream: workstream || undefined,
          supportType: supportType || undefined,
          usedInDrhp: usedInDrhp === 'yes' ? true : usedInDrhp === 'no' ? false : undefined,
          hasIssue: hasIssue === 'yes' ? true : hasIssue === 'no' ? false : undefined,
          pageSize: 100,
        }),
        fetchGlobalFactsSummary(),
      ]);
      setFacts(list.facts);
      setFactSummary(summary);
    } finally {
      setLoading(false);
    }
  }, [search, supportType, workstream, usedInDrhp, hasIssue]);

  const loadEvidence = useCallback(async () => {
    setLoading(true);
    try {
      const [list, summary] = await Promise.all([
        fetchGlobalEvidence(1),
        fetchGlobalEvidenceSummary(),
      ]);
      setEvidence(list.evidence);
      setEvidenceSummary(summary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'facts') void loadFacts();
    else void loadEvidence();
  }, [tab, loadFacts, loadEvidence]);

  const workstreamOptions = useMemo(() => {
    const keys = new Set(facts.map((f) => f.canonicalWorkstreamKey).filter(Boolean));
    return Array.from(keys).sort();
  }, [facts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facts & Evidence"
        description="Review canonical issuer facts, documentary support, and how they are used in the current DRHP draft."
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Facts & Evidence' },
        ]}
      />

      <div className="flex gap-2 border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'facts' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
          onClick={() => setTab('facts')}
        >
          Facts
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'evidence' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
          onClick={() => setTab('evidence')}
        >
          Evidence
        </button>
      </div>

      {tab === 'facts' && factSummary && (
        <div className="grid gap-4 md:grid-cols-5">
          <SummaryCard label="Canonical facts" value={factSummary.canonicalFacts} />
          <SummaryCard label="Document-backed" value={factSummary.documentBacked} />
          <SummaryCard label="Structured input" value={factSummary.structuredInput} />
          <SummaryCard label="Calculated" value={factSummary.calculated} />
          <SummaryCard label="Used in DRHP" value={factSummary.usedInDrhp} />
        </div>
      )}

      {tab === 'evidence' && evidenceSummary && (
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Documents" value={evidenceSummary.documents} />
          <SummaryCard label="Document versions" value={evidenceSummary.documentVersions} />
          <SummaryCard label="Evidence items" value={evidenceSummary.evidenceItems} />
          <SummaryCard label="Evidence-backed facts" value={evidenceSummary.evidenceBackedFacts} />
        </div>
      )}

      {tab === 'facts' && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={supportType}
            onChange={(e) => setSupportType(e.target.value)}
            aria-label="Support filter"
          >
            {SUPPORT_FILTER_OPTIONS.map((opt) => (
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
            value={usedInDrhp}
            onChange={(e) => setUsedInDrhp(e.target.value)}
            aria-label="DRHP usage filter"
          >
            <option value="">All DRHP usage</option>
            <option value="yes">Used in DRHP</option>
            <option value="no">Not used</option>
          </select>
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={hasIssue}
            onChange={(e) => setHasIssue(e.target.value)}
            aria-label="Issue filter"
          >
            <option value="">All issues</option>
            <option value="yes">Has issue</option>
            <option value="no">No issue</option>
          </select>
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm"
              placeholder="Search facts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tab === 'facts' ? (
        facts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
            <p className="text-foreground">No issuer facts are currently available.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Fact</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Support</th>
                  <th className="px-4 py-3">DRHP</th>
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {facts.map((fact) => (
                  <tr key={fact.factId} className="border-b border-border/70 hover:bg-muted/20">
                    <td className="px-4 py-3 align-top font-medium">{fact.label}</td>
                    <td className="px-4 py-3 align-top text-muted-foreground">{fact.displayValue}</td>
                    <td className="px-4 py-3 align-top">
                      <div>{fact.canonicalWorkstreamLabel}</div>
                      <div className="text-xs text-muted-foreground">{fact.sectionLabel}</div>
                    </td>
                    <td className="px-4 py-3 align-top">{fact.supportTypeLabel}</td>
                    <td className="px-4 py-3 align-top">
                      {fact.drhpUsageCount > 0 ? `${fact.drhpUsageCount} block(s)` : '—'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {fact.relatedIssueCount > 0 ? fact.relatedIssueCount : '—'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        onClick={() => setSelectedFact(fact)}
                      >
                        Inspect
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : evidence.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
          <p className="text-foreground">No documentary evidence is currently connected.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3">Facts supported</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((item) => (
                <tr key={item.evidenceId} className="border-b border-border/70 hover:bg-muted/20">
                  <td className="px-4 py-3 align-top font-medium">{item.documentName}</td>
                  <td className="px-4 py-3 align-top">{item.documentCategory}</td>
                  <td className="px-4 py-3 align-top">v{item.versionNumber}</td>
                  <td className="px-4 py-3 align-top">{item.pageNumber ?? '—'}</td>
                  <td className="px-4 py-3 align-top">{item.supportedFactLabels.join(', ')}</td>
                  <td className="px-4 py-3 align-top capitalize">{item.processingState}</td>
                  <td className="px-4 py-3 align-top">
                    <button
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      onClick={() => setSelectedEvidence(item)}
                    >
                      Inspect
                      <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedFact && <FactDetailDrawer fact={selectedFact} onClose={() => setSelectedFact(null)} />}
      {selectedEvidence && (
        <EvidenceDetailDrawer item={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
      )}
    </div>
  );
}
