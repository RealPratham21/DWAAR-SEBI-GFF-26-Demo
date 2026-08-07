'use client';

import { INDUSTRY_MARKET_INFORMATION_SECTIONS } from '@/lib/industry-market/options';
import type { IndustryMarketProgress, SectionStatus } from '@/lib/industry-market/types';
import type { IndustryMarketSectionId } from '@/lib/schemas/industry-market';
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

export function IndustryMarketSectionNavigation({
  activeSection,
  progress,
  dirtySections,
  onSelect,
}: {
  activeSection: IndustryMarketSectionId;
  progress: IndustryMarketProgress;
  dirtySections: Set<IndustryMarketSectionId>;
  onSelect: (section: IndustryMarketSectionId) => void;
}) {
  return (
    <nav aria-label="Industry & Market information sections" className="space-y-1">
      {INDUSTRY_MARKET_INFORMATION_SECTIONS.map((section) => {
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
