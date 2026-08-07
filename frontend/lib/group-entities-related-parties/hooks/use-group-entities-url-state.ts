'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  GROUP_ENTITIES_INFORMATION_SECTIONS,
  GROUP_ENTITIES_TABS,
  type GroupEntitiesTabId,
} from '@/lib/group-entities-related-parties/options';
import type { GroupEntitiesSectionId } from '@/lib/schemas/group-entities-related-parties';

const DEFAULT_TAB: GroupEntitiesTabId = 'information';
const DEFAULT_SECTION: GroupEntitiesSectionId = GROUP_ENTITIES_INFORMATION_SECTIONS[0].id;

export function useGroupEntitiesUrlState(initial?: {
  tab?: string;
  section?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = useMemo((): GroupEntitiesTabId => {
    const fromUrl = searchParams.get('tab') ?? initial?.tab;
    if (fromUrl && GROUP_ENTITIES_TABS.some((tab) => tab.id === fromUrl)) {
      return fromUrl as GroupEntitiesTabId;
    }
    return DEFAULT_TAB;
  }, [initial?.tab, searchParams]);

  const activeSection = useMemo((): GroupEntitiesSectionId => {
    const fromUrl = searchParams.get('section') ?? initial?.section;
    if (
      fromUrl &&
      GROUP_ENTITIES_INFORMATION_SECTIONS.some((section) => section.id === fromUrl)
    ) {
      return fromUrl as GroupEntitiesSectionId;
    }
    return DEFAULT_SECTION;
  }, [initial?.section, searchParams]);

  const replaceParams = useCallback(
    (next: { tab?: GroupEntitiesTabId; section?: GroupEntitiesSectionId }) => {
      const params = new URLSearchParams(searchParams.toString());
      const tab = next.tab ?? activeTab;
      const section = next.section ?? activeSection;

      if (tab === DEFAULT_TAB) params.delete('tab');
      else params.set('tab', tab);

      if (tab === 'information') {
        if (section === DEFAULT_SECTION) params.delete('section');
        else params.set('section', section);
      } else {
        params.delete('section');
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [activeSection, activeTab, pathname, router, searchParams],
  );

  const setActiveTab = useCallback(
    (tabId: GroupEntitiesTabId) => {
      replaceParams({ tab: tabId });
    },
    [replaceParams],
  );

  const setActiveSection = useCallback(
    (sectionId: GroupEntitiesSectionId) => {
      replaceParams({ tab: 'information', section: sectionId });
    },
    [replaceParams],
  );

  return { activeTab, activeSection, setActiveTab, setActiveSection };
}
