'use client';

import { FileText, MessageSquare } from 'lucide-react';
import { CopilotPanel } from '@/components/drhp/copilot-panel';
import { EvidencePanel } from '@/components/drhp/evidence-panel';
import type { DrhpChapterReadinessResponse } from '@/lib/api/drhp';
import type { DrhpChapter, DrhpBlock, DrhpInspectorTab } from '@/lib/drhp/types';
import { cn } from '@/lib/utils';

type InspectorPaneProps = {
  chapter: DrhpChapter;
  selectedBlockId: string | null;
  selectedBlock?: DrhpBlock | null;
  activeTab: DrhpInspectorTab;
  onTabChange: (tab: DrhpInspectorTab) => void;
  readiness?: DrhpChapterReadinessResponse | null;
  readinessLoading?: boolean;
  generationStatus?: import('@/lib/api/drhp').DocumentGenerationStatus | null;
  documentVersionId?: string | null;
  generatedChapterMeta?: {
    blockCount: number;
    sourceRefCount: number;
    placeholderCount: number;
    supportStates: Record<string, number>;
    warnings: string[];
  } | null;
  hasGeneratedBlocks?: boolean;
};

const TABS: Array<{ id: DrhpInspectorTab; label: string; icon: typeof FileText }> = [
  { id: 'evidence', label: 'Evidence', icon: FileText },
  { id: 'copilot', label: 'Dwaar Copilot', icon: MessageSquare },
];

export function InspectorPane({
  chapter,
  selectedBlockId,
  selectedBlock = null,
  activeTab,
  onTabChange,
  readiness = null,
  readinessLoading = false,
  generationStatus = null,
  documentVersionId = null,
  generatedChapterMeta = null,
  hasGeneratedBlocks = false,
}: InspectorPaneProps) {
  return (
    <aside
      aria-label="Context inspector"
      className="flex h-full min-h-0 min-w-0 flex-col border-l border-border bg-card"
    >
      <div className="flex border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 px-3 py-3 text-xs font-medium transition-colors',
                selected
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === 'evidence' ? (
          <EvidencePanel
            chapter={chapter}
            selectedBlockId={selectedBlockId}
            selectedBlock={selectedBlock}
            readiness={readiness}
            readinessLoading={readinessLoading}
            generationStatus={generationStatus}
            documentVersionId={documentVersionId}
            generatedChapterMeta={generatedChapterMeta}
            hasGeneratedBlocks={hasGeneratedBlocks}
          />
        ) : (
          <CopilotPanel
            chapter={chapter}
            selectedBlockId={selectedBlockId}
            selectedBlock={selectedBlock}
            documentVersionId={documentVersionId}
          />
        )}
      </div>
    </aside>
  );
}
