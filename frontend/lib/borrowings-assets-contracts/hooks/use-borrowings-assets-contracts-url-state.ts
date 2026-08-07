'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BAC_INFORMATION_SECTIONS,
  BAC_TABS,
  type BorrowingsAssetsContractsTabId,
} from '@/lib/borrowings-assets-contracts/options';
import type { BorrowingsAssetsContractsSectionId } from '@/lib/schemas/borrowings-assets-contracts';

const DEFAULT_TAB: BorrowingsAssetsContractsTabId = 'information';
const DEFAULT_SECTION: BorrowingsAssetsContractsSectionId = BAC_INFORMATION_SECTIONS[0].id;

export function useBorrowingsAssetsContractsUrlState(initial?: {
  tab?: string;
  section?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = useMemo((): BorrowingsAssetsContractsTabId => {
    const fromUrl = searchParams.get('tab') ?? initial?.tab;
    if (fromUrl && BAC_TABS.some((tab) => tab.id === fromUrl)) {
      return fromUrl as BorrowingsAssetsContractsTabId;
    }
    return DEFAULT_TAB;
  }, [initial?.tab, searchParams]);

  const activeSection = useMemo((): BorrowingsAssetsContractsSectionId => {
    const fromUrl = searchParams.get('section') ?? initial?.section;
    if (
      fromUrl &&
      BAC_INFORMATION_SECTIONS.some((section) => section.id === fromUrl)
    ) {
      return fromUrl as BorrowingsAssetsContractsSectionId;
    }
    return DEFAULT_SECTION;
  }, [initial?.section, searchParams]);

  const replaceParams = useCallback(
    (next: { tab?: BorrowingsAssetsContractsTabId; section?: BorrowingsAssetsContractsSectionId }) => {
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
    (tabId: BorrowingsAssetsContractsTabId) => {
      replaceParams({ tab: tabId });
    },
    [replaceParams],
  );

  const setActiveSection = useCallback(
    (sectionId: BorrowingsAssetsContractsSectionId) => {
      replaceParams({ tab: 'information', section: sectionId });
    },
    [replaceParams],
  );

  return { activeTab, activeSection, setActiveTab, setActiveSection };
}
