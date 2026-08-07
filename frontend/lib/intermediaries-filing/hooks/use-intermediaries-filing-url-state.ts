'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  IF_INFORMATION_SECTIONS,
  IF_TABS,
  type IntermediariesFilingTabId,
} from '@/lib/intermediaries-filing/options';
import type { IntermediariesFilingSectionId } from '@/lib/schemas/intermediaries-filing';

const DEFAULT_TAB: IntermediariesFilingTabId = 'information';
const DEFAULT_SECTION: IntermediariesFilingSectionId = IF_INFORMATION_SECTIONS[0].id;

export function useIntermediariesFilingUrlState(initial?: {
  tab?: string;
  section?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = useMemo((): IntermediariesFilingTabId => {
    const fromUrl = searchParams.get('tab') ?? initial?.tab;
    if (fromUrl && IF_TABS.some((tab) => tab.id === fromUrl)) {
      return fromUrl as IntermediariesFilingTabId;
    }
    return DEFAULT_TAB;
  }, [initial?.tab, searchParams]);

  const activeSection = useMemo((): IntermediariesFilingSectionId => {
    const fromUrl = searchParams.get('section') ?? initial?.section;
    if (fromUrl && IF_INFORMATION_SECTIONS.some((section) => section.id === fromUrl)) {
      return fromUrl as IntermediariesFilingSectionId;
    }
    return DEFAULT_SECTION;
  }, [initial?.section, searchParams]);

  const replaceParams = useCallback(
    (next: {
      tab?: IntermediariesFilingTabId;
      section?: IntermediariesFilingSectionId;
    }) => {
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
    (tabId: IntermediariesFilingTabId) => {
      replaceParams({ tab: tabId });
    },
    [replaceParams],
  );

  const setActiveSection = useCallback(
    (sectionId: IntermediariesFilingSectionId) => {
      replaceParams({ tab: 'information', section: sectionId });
    },
    [replaceParams],
  );

  return { activeTab, activeSection, setActiveTab, setActiveSection };
}
