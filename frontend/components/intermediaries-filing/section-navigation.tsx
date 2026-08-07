'use client';

import { IF_INFORMATION_SECTIONS } from '@/lib/intermediaries-filing/options';
import type { IfProgress, SectionStatus } from '@/lib/intermediaries-filing/types';
import type { IntermediariesFilingSectionId } from '@/lib/schemas/intermediaries-filing';
import { cn } from '@/lib/utils';

function statusLabel(status: SectionStatus | undefined): string {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'in_progress':
      return 'In progress';
    case 'not_yet_due':
      return 'Not yet due';
    case 'not_applicable':
      return 'Not applicable';
    default:
      return 'Not started';
  }
}

export function IntermediariesFilingSectionNavigation({
  activeSection,
  progress,
  dirtySections,
  onSelect,
}: {
  activeSection: IntermediariesFilingSectionId;
  progress: IfProgress;
  dirtySections: Set<IntermediariesFilingSectionId>;
  onSelect: (section: IntermediariesFilingSectionId) => void;
}) {
  return (
    <nav aria-label="Intermediaries & Filing information sections" className="space-y-1">
      {IF_INFORMATION_SECTIONS.map((section) => {
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
