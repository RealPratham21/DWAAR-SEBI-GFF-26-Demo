'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ProfileSectionId } from '@/lib/company-profile/build-profile-sections';

type ProfileSectionNavProps = {
  sections: Array<{ id: ProfileSectionId; label: string }>;
};

export function ProfileSectionNav({ sections }: ProfileSectionNavProps) {
  if (sections.length < 4) return null;

  return (
    <nav
      aria-label="Profile sections"
      className="flex flex-wrap gap-2 border-b border-border pb-4"
    >
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={cn(
            'rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground',
            'transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground',
          )}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}

type ProfileBreadcrumbsProps = {
  items: Array<{ label: string; href?: string }>;
};

export function ProfileBreadcrumbs({ items }: ProfileBreadcrumbsProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 ? <span aria-hidden>/</span> : null}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
