'use client';

import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { DisabledActionButton, NeutralStatusBadge } from '@/components/company-incorporation/tab-shared';
import {
  DISCLOSURE_ACTION_DISABLED_REASON,
  DISCLOSURE_BLOCKS,
  DISCLOSURE_BLOCK_STATUS_LABELS,
} from '@/lib/company-incorporation/disclosure-blocks-config';

export function CompanyIncorporationDisclosuresTab() {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Generated Disclosures"
        description="DRHP disclosure blocks that will be generated from verified facts and supporting evidence in this workstream."
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each block remains unavailable until verified information and supporting evidence are in
          place.
        </p>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {DISCLOSURE_BLOCKS.map((block) => (
          <div
            key={block.id}
            className="bg-card border border-border rounded-lg p-5 space-y-4 flex flex-col"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-medium text-foreground">{block.name}</h4>
                <NeutralStatusBadge label={DISCLOSURE_BLOCK_STATUS_LABELS[block.status]} />
              </div>
              <p className="text-xs text-muted-foreground">
                Target DRHP section:{' '}
                <span className="text-foreground">{block.targetSection}</span>
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{block.message}</p>
            </div>

            <div className="flex flex-wrap gap-2 mt-auto md:pr-[88px]">
              <DisabledActionButton
                label="Generate"
                disabledReason={DISCLOSURE_ACTION_DISABLED_REASON}
              />
              <DisabledActionButton
                label="Preview"
                disabledReason={DISCLOSURE_ACTION_DISABLED_REASON}
              />
              <DisabledActionButton
                label="View Evidence"
                disabledReason={DISCLOSURE_ACTION_DISABLED_REASON}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
