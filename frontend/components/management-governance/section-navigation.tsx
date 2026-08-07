'use client';

import { MANAGEMENT_GOVERNANCE_INFORMATION_SECTIONS } from '@/lib/management-governance/options';
import type {
  ManagementGovernanceProgress,
  SectionStatus,
} from '@/lib/management-governance/types';
import type { ManagementGovernanceSectionId } from '@/lib/schemas/management-governance';
import { cn } from '@/lib/utils';

function statusLabel(status: SectionStatus | undefined): string {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'in_progress':
      return 'In progress';
    default:
      return 'Not started';
  }
}

export function ManagementGovernanceSectionNavigation({
  activeSection,
  progress,
  dirtySections,
  onSelect,
}: {
  activeSection: ManagementGovernanceSectionId;
  progress: ManagementGovernanceProgress;
  dirtySections: Set<ManagementGovernanceSectionId>;
  onSelect: (section: ManagementGovernanceSectionId) => void;
}) {
  return (
    <nav aria-label="Management & Governance information sections" className="space-y-1">
      {MANAGEMENT_GOVERNANCE_INFORMATION_SECTIONS.map((section) => {
        const selected = activeSection === section.id;
        return (
          <button
            key={section.id}
            type="button"
            aria-current={selected ? 'true' : undefined}
            onClick={() => onSelect(section.id)}
            className={cn(
              'w-full rounded-md px-3 py-2.5 text-left transition-colors',
              selected ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-muted/70',
            )}
          >
            <span className="block text-sm font-medium leading-snug">{section.label}</span>
            <span
              className={cn(
                'mt-1 block text-[11px]',
                selected ? 'text-accent-foreground/80' : 'text-muted-foreground',
              )}
            >
              {statusLabel(progress.sections[section.id])}
              {dirtySections.has(section.id) ? ' · not kept yet' : ''}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
