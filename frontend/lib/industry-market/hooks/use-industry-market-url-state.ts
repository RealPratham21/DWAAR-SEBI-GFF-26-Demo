'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  INDUSTRY_MARKET_INFORMATION_SECTIONS,
  INDUSTRY_MARKET_TABS,
  type IndustryMarketTabId,
} from '@/lib/industry-market/options';
import type { IndustryMarketSectionId } from '@/lib/schemas/industry-market';

const DEFAULT_TAB: IndustryMarketTabId = 'information';
const DEFAULT_SECTION: IndustryMarketSectionId = 'industry-scope-and-company-market-mapping';

function isTab(value: string | null | undefined): value is IndustryMarketTabId {
  return INDUSTRY_MARKET_TABS.some((tab) => tab.id === value);
}

function isSection(value: string | null | undefined): value is IndustryMarketSectionId {
  return INDUSTRY_MARKET_INFORMATION_SECTIONS.some((section) => section.id === value);
}

export function useIndustryMarketUrlState(initial?: { tab?: string; section?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skipNextSyncRef = useRef(false);

  const [activeTab, setActiveTabState] = useState<IndustryMarketTabId>(() => {
    if (isTab(initial?.tab)) return initial.tab;
    const fromUrl = searchParams.get('tab');
    if (isTab(fromUrl)) return fromUrl;
    return DEFAULT_TAB;
  });
  const [activeSection, setActiveSectionState] = useState<IndustryMarketSectionId>(() => {
    if (isSection(initial?.section)) return initial.section;
    const fromUrl = searchParams.get('section');
    if (isSection(fromUrl)) return fromUrl;
    return DEFAULT_SECTION;
  });

  const writeUrl = useCallback(
    (next: { tab?: IndustryMarketTabId; section?: IndustryMarketSectionId }) => {
      const params = new URLSearchParams(searchParams.toString());
      const tab = next.tab ?? activeTab;
      const section = next.section ?? activeSection;

      if (tab !== DEFAULT_TAB) params.set('tab', tab);
      else params.delete('tab');

      if (tab === DEFAULT_TAB && section !== DEFAULT_SECTION) params.set('section', section);
      else params.delete('section');

      skipNextSyncRef.current = true;
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [activeSection, activeTab, pathname, router, searchParams],
  );

  const setActiveTab = useCallback(
    (tab: IndustryMarketTabId) => {
      setActiveTabState(tab);
      writeUrl({ tab });
    },
    [writeUrl],
  );

  const setActiveSection = useCallback(
    (section: IndustryMarketSectionId) => {
      setActiveSectionState(section);
      setActiveTabState(DEFAULT_TAB);
      writeUrl({ tab: DEFAULT_TAB, section });
    },
    [writeUrl],
  );

  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    const tabParam = searchParams.get('tab');
    const sectionParam = searchParams.get('section');
    if (isTab(tabParam)) setActiveTabState(tabParam);
    if (isSection(sectionParam)) setActiveSectionState(sectionParam);
  }, [searchParams]);

  return useMemo(
    () => ({
      activeTab,
      activeSection,
      setActiveTab,
      setActiveSection,
    }),
    [activeSection, activeTab, setActiveSection, setActiveTab],
  );
}
