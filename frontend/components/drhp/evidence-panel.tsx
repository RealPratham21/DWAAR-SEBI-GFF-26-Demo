'use client';

import Link from 'next/link';
import type {
  DrhpChapterReadinessResponse,
  DrhpRequirementReadiness,
  DocumentGenerationStatus,
  DrhpWorkstreamLink,
} from '@/lib/api/drhp';
import type { DrhpBlock, DrhpChapter } from '@/lib/drhp/types';
import { formatWorkstreamLabel, formatSectionLabel } from '@/lib/drhp/workstream-labels';

type GeneratedChapterMeta = {
  blockCount: number;
  sourceRefCount: number;
  placeholderCount: number;
  supportStates: Record<string, number>;
  warnings: string[];
};

type EvidencePanelProps = {
  chapter: DrhpChapter;
  selectedBlockId: string | null;
  selectedBlock?: DrhpBlock | null;
  readiness?: DrhpChapterReadinessResponse | null;
  readinessLoading?: boolean;
  generationStatus?: DocumentGenerationStatus | null;
  documentVersionId?: string | null;
  generatedChapterMeta?: GeneratedChapterMeta | null;
  hasGeneratedBlocks?: boolean;
};

function uniqueWorkstreamLinks(links: DrhpWorkstreamLink[]): DrhpWorkstreamLink[] {
  const seen = new Set<string>();
  const unique: DrhpWorkstreamLink[] = [];
  for (const link of links) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    unique.push(link);
  }
  return unique;
}

function formatSourceType(sourceType: string): string {
  return sourceType.replaceAll('_', ' ');
}

function RequirementList({
  title,
  items,
}: {
  title: string;
  items: DrhpRequirementReadiness[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.key} className="rounded-md border border-border bg-card px-3 py-2">
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {item.coverageStatus.replaceAll('_', ' ')}
              {item.placeholderAllowed ? ' · placeholder allowed' : ''}
            </p>
            {item.notes ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.notes}</p>
            ) : null}
            {item.workstreamLink ? (
              <Link
                href={item.workstreamLink.href}
                className="mt-1 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Open {item.workstreamLink.title}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BlockEvidenceView({ block }: { block: DrhpBlock }) {
  const workstreamHref = (slug: string) =>
    `/projects/demo/workstreams/${slug}?tab=information`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Evidence for selection</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Block <span className="font-mono">{block.id}</span>
          {block.supportState ? ` · ${formatSourceType(block.supportState)}` : ''}
        </p>
      </div>

      {block.sourceRefs && block.sourceRefs.length > 0 ? (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sources
          </h4>
          <ul className="space-y-2">
            {block.sourceRefs.map((source) => (
              <li key={source.refId} className="rounded-md border border-border bg-card px-3 py-2">
                <p className="text-sm font-medium text-foreground">
                  {formatWorkstreamLabel(source.workstreamKey)}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatSectionLabel(source.sectionKey)}
                  {source.fieldLabel ? ` · ${source.fieldLabel}` : ''}
                </p>
                {source.fieldPath ? (
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{source.fieldPath}</p>
                ) : null}
                {source.valuePreview != null && source.valuePreview !== '' ? (
                  <p className="mt-1 text-xs text-foreground">{String(source.valuePreview)}</p>
                ) : null}
                <Link
                  href={workstreamHref(source.workstreamKey)}
                  className="mt-1 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open workstream
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No source references are attached to this block yet.
        </p>
      )}

      {block.evidenceRefs.length > 0 ? (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Documentary evidence
          </h4>
          <ul className="space-y-2">
            {block.evidenceRefs.map((evidence) => (
              <li key={evidence.id} className="rounded-md border border-border bg-card px-3 py-2">
                <p className="text-sm font-medium text-foreground">{evidence.label}</p>
                {evidence.factKey ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">Fact: {evidence.factKey}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : block.supportState === 'structured_input_backed' ? (
        <p className="text-xs text-muted-foreground">
          Supported by structured user input — no documentary evidence is linked for this block.
        </p>
      ) : null}
    </div>
  );
}

function GeneratedChapterEvidence({
  chapter,
  generationStatus,
  documentVersionId,
  meta,
}: {
  chapter: DrhpChapter;
  generationStatus: DocumentGenerationStatus;
  documentVersionId: string;
  meta: GeneratedChapterMeta | null;
}) {
  const chapterRow = generationStatus.chapters.find((c) => c.chapterKey === chapter.key);
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Generated chapter</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Persisted draft AST loaded for this chapter. Select a block in the document preview to inspect
          field-level provenance.
        </p>
      </div>
      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <p>
          Version: <span className="font-mono text-foreground">{documentVersionId.slice(0, 8)}…</span>
        </p>
        <p className="mt-1">
          Status: <span className="text-foreground">{chapterRow?.status?.replaceAll('_', ' ') ?? chapter.status}</span>
        </p>
        {meta ? (
          <>
            <p className="mt-1">
              Blocks: <span className="text-foreground">{meta.blockCount}</span>
              {' · '}
              Source refs: <span className="text-foreground">{meta.sourceRefCount}</span>
              {' · '}
              Placeholders: <span className="text-foreground">{meta.placeholderCount}</span>
            </p>
            {chapterRow?.errorMessage ? (
              <p className="mt-1 text-amber-700 dark:text-amber-400">{chapterRow.errorMessage}</p>
            ) : null}
            {chapterRow?.warnings?.length ? (
              <ul className="mt-2 list-disc pl-4">
                {chapterRow.warnings.map((w, index) => (
                  <li key={`${w}-${index}`}>{w}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export function EvidencePanel({
  chapter,
  selectedBlockId,
  selectedBlock = null,
  readiness = null,
  readinessLoading = false,
  generationStatus = null,
  documentVersionId = null,
  generatedChapterMeta = null,
  hasGeneratedBlocks = false,
}: EvidencePanelProps) {
  if (selectedBlock) {
    return (
      <div className="p-4">
        <BlockEvidenceView block={selectedBlock} />
      </div>
    );
  }

  if (hasGeneratedBlocks && generationStatus && documentVersionId) {
    return (
      <div className="space-y-5 p-4">
        <GeneratedChapterEvidence
          chapter={chapter}
          generationStatus={generationStatus}
          documentVersionId={documentVersionId}
          meta={generatedChapterMeta}
        />
        {readiness ? (
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Source readiness (pre-generation): {readiness.satisfiedCount} satisfied ·{' '}
              {readiness.missingCount} missing
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  if (readinessLoading && !readiness) {
    return (
      <div className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-foreground">Evidence</h3>
        <p className="text-sm text-muted-foreground">Loading chapter readiness…</p>
      </div>
    );
  }

  if (!readiness) {
    return (
      <div className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-foreground">Evidence</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Chapter readiness is unavailable. Connect to the API to load requirement-level gaps.
        </p>
      </div>
    );
  }

  if (!readiness.supported || readiness.connectionStatus === 'not_connected') {
    return (
      <div className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-foreground">Evidence & readiness</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Source bundles are connected for this chapter via workstream mapping. Generate a draft to inspect
          block-level provenance.
        </p>
      </div>
    );
  }

  const workstreamLinks = uniqueWorkstreamLinks(readiness.workstreamLinks);

  return (
    <div className="space-y-5 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Evidence & readiness</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Requirement-level readiness from connected workstreams. Generate a draft DRHP to populate chapter
          content and block-level sources.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Satisfied" value={readiness.satisfiedCount} />
        <StatCard label="Missing" value={readiness.missingCount} />
        <StatCard label="Unknown applicability" value={readiness.unknownApplicabilityCount} />
        <StatCard label="Gaps / blockers" value={readiness.gapCount + readiness.blockingCount} />
      </div>

      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <p>
          Connection: <span className="text-foreground">{readiness.connectionStatus}</span>
        </p>
        <p className="mt-1">
          Generation:{' '}
          <span className="text-foreground">{readiness.generationStatus.replaceAll('_', ' ')}</span>
          {readiness.canGenerate ? ' · can generate later' : ' · cannot generate yet'}
        </p>
      </div>

      <RequirementList title="Blocking" items={readiness.blockingRequirements} />
      <RequirementList title="Missing" items={readiness.missingRequirements} />

      {workstreamLinks.length > 0 ? (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Workstreams
          </h4>
          <ul className="space-y-1">
            {workstreamLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <span className="sr-only">{chapter.key}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
