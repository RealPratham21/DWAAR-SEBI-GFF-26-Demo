'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  finalizeDataRoomUpload,
  fetchDataRoomDocuments,
  fetchDataRoomDownloadUrl,
  fetchDataRoomRequirements,
  fetchDataRoomSummary,
  formatBytes,
  formatDate,
  initiateDataRoomUpload,
  uploadFileToPresignedUrl,
  WORKSTREAM_ORDER,
  type DataRoomDocument,
  type DataRoomRequirement,
  type DataRoomSummary,
} from '@/lib/api/data-room';
import {
  finalizeDocumentUpload,
  initiateDocumentUpload,
  uploadFileToPresignedUrl as uploadCiFile,
} from '@/lib/api/company-incorporation-documents';
import { computeSha256 } from '@/lib/company-incorporation/documents/utils';

type Tab = 'all' | 'workstreams' | 'missing';

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function StatusChip({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
      {label}
    </span>
  );
}

function UsageSummary({ document }: { document: DataRoomDocument }) {
  const parts: string[] = [];
  if (document.factCount > 0) parts.push(`${document.factCount} facts`);
  if (document.evidenceCount > 0) parts.push(`${document.evidenceCount} evidence`);
  if (document.drhpUsageCount > 0) parts.push(`${document.drhpUsageCount} DRHP blocks`);
  if (parts.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        {document.processingCapability === 'document_extraction'
          ? 'Processing pipeline'
          : 'Stored only'}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">{parts.join(' · ')}</span>;
}

function DocumentDetailDrawer({
  document,
  onClose,
  onUploadVersion,
}: {
  document: DataRoomDocument;
  onClose: () => void;
  onUploadVersion: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const { downloadUrl } = await fetchDataRoomDownloadUrl(document.globalDocumentId);
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button className="flex-1" aria-label="Close document detail" onClick={onClose} />
      <aside className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">{document.workstreamLabel}</p>
            <h2 className="mt-1 text-lg font-semibold">{document.title}</h2>
            <p className="text-sm text-muted-foreground">{document.filename}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm">
          <section>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Document</h3>
            <p className="mt-1">{document.category}</p>
            {document.requirementKey && (
              <p className="text-muted-foreground">Requirement: {document.requirementKey}</p>
            )}
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Version</h3>
            <p className="mt-1">Current: v{document.currentVersion}</p>
            <ul className="mt-2 space-y-1">
              {document.versions.map((version) => (
                <li key={version.versionNumber} className="text-muted-foreground">
                  v{version.versionNumber}
                  {version.isCurrent ? ' — Current' : ' — Superseded'} —{' '}
                  {formatDate(version.uploadedAt)}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Processing</h3>
            <p className="mt-1">{document.processingCapabilityLabel}</p>
            <p className="text-muted-foreground">State: {document.statusLabel}</p>
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Facts & Evidence</h3>
            {document.factCount > 0 || document.evidenceCount > 0 ? (
              <>
                <p className="mt-1">
                  {document.factCount} supported facts · {document.evidenceCount} evidence items
                </p>
                {document.openFactsUrl && (
                  <Link href={document.openFactsUrl} className="mt-2 inline-flex text-primary hover:underline">
                    View Facts & Evidence
                  </Link>
                )}
              </>
            ) : (
              <p className="mt-1 text-muted-foreground">
                No fact-level evidence linkage is currently connected.
              </p>
            )}
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">DRHP usage</h3>
            {document.drhpUsage.length === 0 ? (
              <p className="mt-1 text-muted-foreground">Not referenced in the current generated draft.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {document.drhpUsage.map((usage) => (
                  <li key={`${usage.chapterKey}-${usage.blockId}`}>
                    <Link href={usage.openUrl} className="text-primary hover:underline">
                      {usage.chapterLabel}
                    </Link>
                    <p className="text-xs text-muted-foreground">{usage.sectionHeading}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {document.relatedIssues.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Issues</h3>
              <ul className="mt-2 space-y-2">
                {document.relatedIssues.map((issue) => (
                  <li key={issue.issueId}>
                    <Link href={issue.openUrl} className="text-primary hover:underline">
                      {issue.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {document.inspection && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Inspection</h3>
              <p className="mt-1">{document.inspection.label || document.inspection.status}</p>
            </section>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border px-6 py-4">
          {document.openUrl && (
            <Link
              href={document.openUrl}
              className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
            >
              {document.originType === 'company_incorporation' ? 'Open document evidence' : 'View'}
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
            Download
          </Button>
          {document.originType === 'data_room' && (
            <Button variant="outline" size="sm" onClick={onUploadVersion}>
              Upload new version
            </Button>
          )}
          <Link
            href={document.openWorkstreamUrl}
            className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
          >
            Open workstream
          </Link>
        </div>
      </aside>
    </div>
  );
}

function UploadDialog({
  requirements,
  prefilled,
  onClose,
  onComplete,
}: {
  requirements: DataRoomRequirement[];
  prefilled?: DataRoomRequirement | null;
  onClose: () => void;
  onComplete: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [workstreamKey, setWorkstreamKey] = useState(prefilled?.workstreamKey ?? '');
  const [requirementKey, setRequirementKey] = useState(prefilled?.requirementKey ?? '');
  const [title, setTitle] = useState(prefilled?.title ?? '');
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const workstreamOptions = useMemo(() => {
    const keys = new Set(requirements.map((r) => r.workstreamKey));
    return WORKSTREAM_ORDER.filter((key) => keys.has(key));
  }, [requirements]);

  const requirementOptions = useMemo(
    () => requirements.filter((r) => r.workstreamKey === workstreamKey),
    [requirements, workstreamKey],
  );

  useEffect(() => {
    if (prefilled) return;
    if (!workstreamKey && workstreamOptions.length > 0) {
      setWorkstreamKey(workstreamOptions[0]);
    }
  }, [prefilled, workstreamKey, workstreamOptions]);

  async function handleSubmit() {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !workstreamKey || !requirementKey || !title.trim()) {
      setError('Select workstream, requirement, title, and file.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const checksumSha256 = await computeSha256(file);
      if (workstreamKey === 'company-incorporation') {
        const ciKey = requirementKey.replace(/^company-incorporation:/, '');
        const initiated = await initiateDocumentUpload({
          requirementKey: ciKey,
          filename: file.name,
          contentType: file.type || 'application/pdf',
          sizeBytes: file.size,
          checksumSha256,
        });
        await uploadCiFile(file, initiated.uploadUrl, initiated.requiredHeaders, () => undefined);
        await finalizeDocumentUpload(initiated.versionId);
      } else {
        const initiated = await initiateDataRoomUpload({
          workstreamKey,
          requirementKey,
          title: title.trim(),
          category: prefilled?.category ?? '',
          filename: file.name,
          contentType: file.type || 'application/pdf',
          sizeBytes: file.size,
          checksumSha256,
          note,
        });
        await uploadFileToPresignedUrl(file, initiated.uploadUrl, {
          'Content-Type': file.type || 'application/pdf',
          'Content-Length': String(file.size),
        });
        await finalizeDataRoomUpload(initiated.versionId);
      }
      onComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Upload document</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4 text-sm">
          <label className="block">
            <span className="text-xs font-medium uppercase text-muted-foreground">Workstream</span>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              value={workstreamKey}
              disabled={Boolean(prefilled)}
              onChange={(e) => {
                setWorkstreamKey(e.target.value);
                setRequirementKey('');
              }}
            >
              <option value="">Select workstream</option>
              {workstreamOptions.map((key) => (
                <option key={key} value={key}>
                  {requirements.find((r) => r.workstreamKey === key)?.workstreamLabel ?? key}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase text-muted-foreground">Requirement / category</span>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              value={requirementKey}
              disabled={Boolean(prefilled)}
              onChange={(e) => {
                setRequirementKey(e.target.value);
                const req = requirements.find((r) => r.requirementKey === e.target.value);
                if (req && !title) setTitle(req.title);
              }}
            >
              <option value="">Select requirement</option>
              {requirementOptions.map((req) => (
                <option key={req.requirementKey} value={req.requirementKey}>
                  {req.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase text-muted-foreground">Title</span>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase text-muted-foreground">Optional note</span>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase text-muted-foreground">File</span>
            <input ref={fileInputRef} type="file" className="mt-1 w-full text-sm" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg" />
          </label>
          {workstreamKey === 'company-incorporation' && (
            <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              This file enters the Company & Incorporation processing and evidence workflow.
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DataRoomWorkspace() {
  const [tab, setTab] = useState<Tab>('all');
  const [summary, setSummary] = useState<DataRoomSummary | null>(null);
  const [documents, setDocuments] = useState<DataRoomDocument[]>([]);
  const [requirements, setRequirements] = useState<DataRoomRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [workstreamFilter, setWorkstreamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [capabilityFilter, setCapabilityFilter] = useState('');
  const [drhpFilter, setDrhpFilter] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<DataRoomDocument | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadPrefill, setUploadPrefill] = useState<DataRoomRequirement | null>(null);
  const [expandedWorkstreams, setExpandedWorkstreams] = useState<Set<string>>(new Set(WORKSTREAM_ORDER));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const usedInDrhp =
        drhpFilter === 'yes' ? true : drhpFilter === 'no' ? false : undefined;
      const [summaryRes, docsRes, reqsRes] = await Promise.all([
        fetchDataRoomSummary(),
        fetchDataRoomDocuments({
          search: search || undefined,
          workstream: workstreamFilter || undefined,
          status: statusFilter || undefined,
          capability: capabilityFilter || undefined,
          usedInDrhp,
          pageSize: 200,
        }),
        fetchDataRoomRequirements({
          search: search || undefined,
          workstream: workstreamFilter || undefined,
          status: tab === 'missing' ? 'not_provided' : statusFilter === 'not_provided' ? 'not_provided' : undefined,
        }),
      ]);
      setSummary(summaryRes);
      setDocuments(docsRes.documents);
      setRequirements(reqsRes.requirements);
    } finally {
      setLoading(false);
    }
  }, [search, workstreamFilter, statusFilter, capabilityFilter, drhpFilter, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const missingRequirements = useMemo(
    () =>
      requirements.filter(
        (req) =>
          req.status === 'not_provided' &&
          req.applicability !== 'not_applicable',
      ),
    [requirements],
  );

  const workstreamGroups = useMemo(() => {
    return WORKSTREAM_ORDER.map((key) => {
      const wsReqs = requirements.filter((r) => r.workstreamKey === key);
      const wsDocs = documents.filter((d) => d.workstreamKey === key);
      const applicable = wsReqs.filter((r) => r.applicability !== 'not_applicable');
      return {
        workstreamKey: key,
        workstreamLabel: wsReqs[0]?.workstreamLabel ?? key,
        providedCount: applicable.filter((r) => r.status === 'provided' || r.status === 'partially_provided').length,
        expectedCount: applicable.length,
        missingCount: applicable.filter((r) => r.status === 'not_provided').length,
        documents: wsDocs,
        missingRequirements: applicable.filter((r) => r.status === 'not_provided'),
      };
    }).filter((group) => group.expectedCount > 0 || group.documents.length > 0);
  }, [requirements, documents]);

  function openUploadForRequirement(req: DataRoomRequirement) {
    setUploadPrefill(req);
    setUploadOpen(true);
  }

  function toggleWorkstream(key: string) {
    setExpandedWorkstreams((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Room"
        description="Global document workspace for IPO / DRHP preparation — uploaded files and expected supporting documents"
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Data Room' },
        ]}
        action={
          <Button
            onClick={() => {
              setUploadPrefill(null);
              setUploadOpen(true);
            }}
          >
            <Upload size={16} className="mr-2" />
            Upload document
          </Button>
        }
      />

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard label="Uploaded documents" value={summary.totalDocuments} />
          <SummaryCard label="Expected / requested" value={summary.applicableRequirements} />
          <SummaryCard label="Missing" value={summary.missingRequirements} />
          <SummaryCard label="Linked to DRHP" value={summary.documentsUsedInDrhp} />
          <SummaryCard label="Document-backed facts" value={summary.documentBackedDocuments} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm"
            placeholder="Search documents, categories, workstreams…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={workstreamFilter}
          onChange={(e) => setWorkstreamFilter(e.target.value)}
        >
          <option value="">All workstreams</option>
          {WORKSTREAM_ORDER.map((key) => (
            <option key={key} value={key}>
              {requirements.find((r) => r.workstreamKey === key)?.workstreamLabel ?? key}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="uploaded">Uploaded</option>
          <option value="processed">Processed</option>
          <option value="processing">Processing</option>
          <option value="not_provided">Missing / requested</option>
        </select>
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={capabilityFilter}
          onChange={(e) => setCapabilityFilter(e.target.value)}
        >
          <option value="">All capabilities</option>
          <option value="document_extraction">Document-backed processing</option>
          <option value="stored_only">Stored only</option>
        </select>
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={drhpFilter}
          onChange={(e) => setDrhpFilter(e.target.value)}
        >
          <option value="">DRHP usage: All</option>
          <option value="yes">Used in DRHP</option>
          <option value="no">Not in DRHP</option>
        </select>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(
          [
            ['all', 'All documents'],
            ['workstreams', 'By workstream'],
            ['missing', 'Requested / missing'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading data room…</p>
      ) : tab === 'all' ? (
        documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents have been uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Workstream</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Support / usage</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.globalDocumentId} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{doc.filename}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{doc.workstreamLabel}</td>
                    <td className="px-4 py-3">{doc.category}</td>
                    <td className="px-4 py-3">v{doc.currentVersion}</td>
                    <td className="px-4 py-3">
                      <StatusChip label={doc.statusLabel} />
                    </td>
                    <td className="px-4 py-3">
                      <UsageSummary document={doc} />
                    </td>
                    <td className="px-4 py-3">{formatDate(doc.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        onClick={() => setSelectedDocument(doc)}
                      >
                        View <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tab === 'workstreams' ? (
        <div className="space-y-3">
          {workstreamGroups.map((group) => (
            <div key={group.workstreamKey} className="rounded-lg border border-border bg-card">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                onClick={() => toggleWorkstream(group.workstreamKey)}
              >
                <div>
                  <p className="font-semibold">{group.workstreamLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    Provided {group.providedCount} · Expected {group.expectedCount} · Missing{' '}
                    {group.missingCount}
                  </p>
                </div>
                {expandedWorkstreams.has(group.workstreamKey) ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
              {expandedWorkstreams.has(group.workstreamKey) && (
                <div className="space-y-4 border-t border-border px-4 py-3 text-sm">
                  {group.documents.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Uploaded</p>
                      <ul className="mt-2 space-y-1">
                        {group.documents.map((doc) => (
                          <li key={doc.globalDocumentId}>
                            <button
                              className="text-primary hover:underline"
                              onClick={() => setSelectedDocument(doc)}
                            >
                              {doc.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {group.missingRequirements.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Still expected</p>
                      <ul className="mt-2 space-y-2">
                        {group.missingRequirements.map((req) => (
                          <li key={req.requirementKey} className="flex items-center justify-between gap-4">
                            <span>{req.title}</span>
                            <Button size="sm" variant="outline" onClick={() => openUploadForRequirement(req)}>
                              Upload
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : missingRequirements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No outstanding expected documents are currently identified from the available information.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Document / requirement</th>
                <th className="px-4 py-3">Workstream</th>
                <th className="px-4 py-3">Why needed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {missingRequirements.map((req) => (
                <tr key={req.requirementKey} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{req.title}</td>
                  <td className="px-4 py-3">{req.workstreamLabel}</td>
                  <td className="px-4 py-3 text-muted-foreground">{req.purpose}</td>
                  <td className="px-4 py-3">
                    <StatusChip label={req.statusLabel} />
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => openUploadForRequirement(req)}>
                      Upload
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedDocument && (
        <DocumentDetailDrawer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onUploadVersion={() => {
            setUploadPrefill(null);
            setUploadOpen(true);
          }}
        />
      )}

      {uploadOpen && (
        <UploadDialog
          requirements={requirements}
          prefilled={uploadPrefill}
          onClose={() => {
            setUploadOpen(false);
            setUploadPrefill(null);
          }}
          onComplete={() => void load()}
        />
      )}
    </div>
  );
}
