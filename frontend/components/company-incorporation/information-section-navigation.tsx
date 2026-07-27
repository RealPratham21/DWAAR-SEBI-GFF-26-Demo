'use client';

import { cn } from '@/lib/utils';
import type { InformationSectionId } from '@/lib/types/company-incorporation';
import { INFORMATION_SECTIONS } from '@/lib/types/company-incorporation';

interface InformationSectionNavigationProps {
  activeSection: InformationSectionId;
  onSectionChange: (section: InformationSectionId) => void;
}

export function InformationSectionNavigation({
  activeSection,
  onSectionChange,
}: InformationSectionNavigationProps) {
  return (
    <nav className="space-y-1">
      {INFORMATION_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onSectionChange(section.id)}
          className={cn(
            'w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
            activeSection === section.id
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
