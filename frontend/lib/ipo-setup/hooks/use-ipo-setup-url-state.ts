'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  IPO_SETUP_INFORMATION_SECTIONS,
  IPO_SETUP_TABS,
  type IpoSetupTabId,
} from '@/lib/ipo-setup/options';
import type { IpoSetupSectionId } from '@/lib/schemas/ipo-setup';

function isTab(value: string | null | undefined): value is IpoSetupTabId {
  return IPO_SETUP_TABS.some((tab) => tab.id === value);
}

function isSection(value: string | null | undefined): value is IpoSetupSectionId {
  return IPO_SETUP_INFORMATION_SECTIONS.some((section) => section.id === value);
}

export function useIpoSetupUrlState(initial?: { tab?: string; section?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skipNextSyncRef = useRef(false);

  const [activeTab, setActiveTabState] = useState<IpoSetupTabId>(() => {
    if (isTab(initial?.tab)) return initial.tab;
    if (isTab(searchParams.get('tab'))) return searchParams.get('tab') as IpoSetupTabId;
    return 'information';
  });
  const [activeSection, setActiveSectionState] = useState<IpoSetupSectionId>(() => {
    if (isSection(initial?.section)) return initial.section;
    if (isSection(searchParams.get('section'))) {
      return searchParams.get('section') as IpoSetupSectionId;
    }
    return 'ipo-direction';
  });

  const writeUrl = useCallback(
    (next: { tab?: IpoSetupTabId; section?: IpoSetupSectionId }) => {
      const params = new URLSearchParams(searchParams.toString());
      const tab = next.tab ?? activeTab;
      const section = next.section ?? activeSection;

      if (tab !== 'information') params.set('tab', tab);
      else params.delete('tab');

      if (tab === 'information' && section !== 'ipo-direction') {
        params.set('section', section);
      } else {
        params.delete('section');
      }

      skipNextSyncRef.current = true;
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [activeSection, activeTab, pathname, router, searchParams],
  );

  const setActiveTab = useCallback(
    (tab: IpoSetupTabId) => {
      setActiveTabState(tab);
      writeUrl({ tab });
    },
    [writeUrl],
  );

  const setActiveSection = useCallback(
    (section: IpoSetupSectionId) => {
      setActiveSectionState(section);
      setActiveTabState('information');
      writeUrl({ tab: 'information', section });
    },
    [writeUrl],
  );

  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    const tab = searchParams.get('tab');
    const section = searchParams.get('section');
    if (isTab(tab)) setActiveTabState(tab);
    else if (!tab) setActiveTabState('information');
    if (isSection(section)) setActiveSectionState(section);
    else if (!section) setActiveSectionState('ipo-direction');
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
