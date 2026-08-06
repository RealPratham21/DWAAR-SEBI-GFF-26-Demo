'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  OBJECTS_OF_ISSUE_INFORMATION_SECTIONS,
  OBJECTS_OF_ISSUE_TABS,
  type ObjectsOfIssueTabId,
} from '@/lib/objects-of-issue/options';
import type { ObjectsOfIssueSectionId } from '@/lib/schemas/objects-of-issue';

const DEFAULT_TAB: ObjectsOfIssueTabId = 'information';
const DEFAULT_SECTION: ObjectsOfIssueSectionId = 'proceeds-and-funding-summary';

function isTab(value: string | null | undefined): value is ObjectsOfIssueTabId {
  return OBJECTS_OF_ISSUE_TABS.some((tab) => tab.id === value);
}

function isSection(value: string | null | undefined): value is ObjectsOfIssueSectionId {
  return OBJECTS_OF_ISSUE_INFORMATION_SECTIONS.some((section) => section.id === value);
}

export function useObjectsOfIssueUrlState(initial?: { tab?: string; section?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skipNextSyncRef = useRef(false);

  const [activeTab, setActiveTabState] = useState<ObjectsOfIssueTabId>(() => {
    if (isTab(initial?.tab)) return initial.tab;
    const fromUrl = searchParams.get('tab');
    if (isTab(fromUrl)) return fromUrl;
    return DEFAULT_TAB;
  });
  const [activeSection, setActiveSectionState] = useState<ObjectsOfIssueSectionId>(() => {
    if (isSection(initial?.section)) return initial.section;
    const fromUrl = searchParams.get('section');
    if (isSection(fromUrl)) return fromUrl;
    return DEFAULT_SECTION;
  });

  const writeUrl = useCallback(
    (next: { tab?: ObjectsOfIssueTabId; section?: ObjectsOfIssueSectionId }) => {
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
    (tab: ObjectsOfIssueTabId) => {
      setActiveTabState(tab);
      writeUrl({ tab });
    },
    [writeUrl],
  );

  const setActiveSection = useCallback(
    (section: ObjectsOfIssueSectionId) => {
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
    const tab = searchParams.get('tab');
    const section = searchParams.get('section');
    if (isTab(tab)) setActiveTabState(tab);
    else if (!tab) setActiveTabState(DEFAULT_TAB);
    if (isSection(section)) setActiveSectionState(section);
    else if (!section) setActiveSectionState(DEFAULT_SECTION);
  }, [searchParams]);

  return useMemo(
    () => ({ activeTab, activeSection, setActiveTab, setActiveSection }),
    [activeSection, activeTab, setActiveSection, setActiveTab],
  );
}
