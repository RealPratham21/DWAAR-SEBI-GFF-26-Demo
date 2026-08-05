'use client';

import Link from 'next/link';
import type {
  DrhpChapterReadinessResponse,
  DrhpRequirementReadiness,
  DrhpWorkstreamLink,
} from '@/lib/api/drhp';
import type { DrhpChapter } from '@/lib/drhp/types';

type EvidencePanelProps = {
  chapter: DrhpChapter;
  selectedBlockId: string | null;
  readiness?: DrhpChapterReadinessResponse | null;
  readinessLoading?: boolean;
};

/** Dedupe by href so the same workstream tab is listed once. */
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

export function EvidencePanel({
  chapter,
  selectedBlockId,
  readiness = null,
  readinessLoading = false,
}: EvidencePanelProps) {
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
        <h3 className="text-sm font-semibold text-foreground">Evidence</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This chapter is not connected yet. Source documents and facts will appear here once a
          workstream adapter is available.
        </p>
        {selectedBlockId ? (
          <p className="text-xs text-muted-foreground">
            Selected block context: <span className="font-mono">{selectedBlockId}</span>
          </p>
        ) : null}
      </div>
    );
  }

  const workstreamLinks = uniqueWorkstreamLinks(readiness.workstreamLinks);

  return (
    <div className="space-y-5 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Evidence & readiness</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Requirement-level readiness from the DRHP module. No draft has been generated yet.
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
      <RequirementList
        title="Unknown applicability"
        items={readiness.unknownApplicabilityRequirements}
      />
      <RequirementList title="Future gaps (placeholder)" items={readiness.gapRequirements} />
      <RequirementList title="Satisfied" items={readiness.satisfiedRequirements} />

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

      {selectedBlockId ? (
        <p className="text-xs text-muted-foreground">
          Selected block context: <span className="font-mono">{selectedBlockId}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          No generated blocks exist yet. Generate is not available in G1.
        </p>
      )}

      {/* Keep chapter key referenced for accessibility / future block linking. */}
      <span className="sr-only">{chapter.key}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
