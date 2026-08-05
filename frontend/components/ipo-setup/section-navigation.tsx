'use client';

import { IPO_SETUP_INFORMATION_SECTIONS } from '@/lib/ipo-setup/options';
import type { WorkspaceProgress } from '@/lib/ipo-setup/api-types';
import type { IpoSetupSectionId, SectionStatus } from '@/lib/ipo-setup/types';
import { cn } from '@/lib/utils';

function statusLabel(status: SectionStatus): string {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'in_progress':
      return 'In progress';
    default:
      return 'Not started';
  }
}

export function IpoSetupSectionNavigation({
  activeSection,
  progress,
  dirtySections,
  onSelect,
}: {
  activeSection: IpoSetupSectionId;
  progress: WorkspaceProgress;
  dirtySections: Set<IpoSetupSectionId>;
  onSelect: (section: IpoSetupSectionId) => void;
}) {
  return (
    <nav aria-label="IPO Setup information sections" className="space-y-1">
      {IPO_SETUP_INFORMATION_SECTIONS.map((section) => {
        const status = progress.sections[section.id];
        const selected = activeSection === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={cn(
              'w-full rounded-md px-3 py-2.5 text-left transition-colors',
              selected
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground hover:bg-muted/70',
            )}
          >
            <span className="block text-sm font-medium leading-snug">{section.label}</span>
            <span
              className={cn(
                'mt-1 block text-[11px]',
                selected ? 'text-accent-foreground/80' : 'text-muted-foreground',
              )}
            >
              {statusLabel(status)}
              {dirtySections.has(section.id) ? ' · unsaved' : ''}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
