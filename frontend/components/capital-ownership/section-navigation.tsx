'use client';

import { CAPITAL_OWNERSHIP_INFORMATION_SECTIONS } from '@/lib/capital-ownership/options';
import type {
  CapitalOwnershipProgress,
  CapitalOwnershipSectionId,
  SectionStatus,
} from '@/lib/capital-ownership/types';
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

export function CapitalOwnershipSectionNavigation({
  activeSection,
  progress,
  dirtySections,
  onSelect,
}: {
  activeSection: CapitalOwnershipSectionId;
  progress: CapitalOwnershipProgress;
  dirtySections: Set<CapitalOwnershipSectionId>;
  onSelect: (section: CapitalOwnershipSectionId) => void;
}) {
  return (
    <nav aria-label="Capital & Ownership information sections" className="space-y-1">
      {CAPITAL_OWNERSHIP_INFORMATION_SECTIONS.map((section) => {
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
