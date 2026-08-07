'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LAC_INFORMATION_SECTIONS,
  LAC_TABS,
  type LitigationApprovalsComplianceTabId,
} from '@/lib/litigation-approvals-compliance/options';
import type { LitigationApprovalsComplianceSectionId } from '@/lib/schemas/litigation-approvals-compliance';

const DEFAULT_TAB: LitigationApprovalsComplianceTabId = 'information';
const DEFAULT_SECTION: LitigationApprovalsComplianceSectionId = LAC_INFORMATION_SECTIONS[0].id;

export function useLitigationApprovalsComplianceUrlState(initial?: {
  tab?: string;
  section?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = useMemo((): LitigationApprovalsComplianceTabId => {
    const fromUrl = searchParams.get('tab') ?? initial?.tab;
    if (fromUrl && LAC_TABS.some((tab) => tab.id === fromUrl)) {
      return fromUrl as LitigationApprovalsComplianceTabId;
    }
    return DEFAULT_TAB;
  }, [initial?.tab, searchParams]);

  const activeSection = useMemo((): LitigationApprovalsComplianceSectionId => {
    const fromUrl = searchParams.get('section') ?? initial?.section;
    if (fromUrl && LAC_INFORMATION_SECTIONS.some((section) => section.id === fromUrl)) {
      return fromUrl as LitigationApprovalsComplianceSectionId;
    }
    return DEFAULT_SECTION;
  }, [initial?.section, searchParams]);

  const replaceParams = useCallback(
    (next: {
      tab?: LitigationApprovalsComplianceTabId;
      section?: LitigationApprovalsComplianceSectionId;
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
    (tabId: LitigationApprovalsComplianceTabId) => {
      replaceParams({ tab: tabId });
    },
    [replaceParams],
  );

  const setActiveSection = useCallback(
    (sectionId: LitigationApprovalsComplianceSectionId) => {
      replaceParams({ tab: 'information', section: sectionId });
    },
    [replaceParams],
  );

  return { activeTab, activeSection, setActiveTab, setActiveSection };
}
