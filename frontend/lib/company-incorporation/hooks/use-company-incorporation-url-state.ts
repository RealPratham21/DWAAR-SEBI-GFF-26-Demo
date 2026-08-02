'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  INFORMATION_SECTIONS,
  WORKSTREAM_TABS,
  type InformationSectionId,
  type WorkstreamTabId,
} from '@/lib/types/company-incorporation';

function isWorkstreamTabId(value: string | null | undefined): value is WorkstreamTabId {
  return WORKSTREAM_TABS.some((tab) => tab.id === value);
}

function isInformationSectionId(value: string | null | undefined): value is InformationSectionId {
  return INFORMATION_SECTIONS.some((section) => section.id === value);
}

export interface CompanyIncorporationUrlState {
  activeTab: WorkstreamTabId;
  activeSection: InformationSectionId;
  assertionId: string | null;
  issueId: string | null;
  documentVersionId: string | null;
  setActiveTab: (tab: WorkstreamTabId) => void;
  setActiveSection: (section: InformationSectionId) => void;
  openAssertion: (assertionId: string, opts?: { tab?: WorkstreamTabId }) => void;
  openIssue: (issueId: string, opts?: { tab?: WorkstreamTabId }) => void;
  focusDocumentVersion: (documentVersionId: string, opts?: { tab?: WorkstreamTabId }) => void;
  closeAssertion: () => void;
  closeIssue: () => void;
  clearDocumentVersionFocus: () => void;
}

function readParam(params: URLSearchParams, key: string): string | null {
  const value = params.get(key);
  return value && value.trim() ? value : null;
}

export function useCompanyIncorporationUrlState(
  initial?: {
    tab?: string;
    section?: string;
    assertionId?: string;
    issueId?: string;
    documentVersionId?: string;
  },
): CompanyIncorporationUrlState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skipNextSyncRef = useRef(false);

  const [activeTab, setActiveTabState] = useState<WorkstreamTabId>(() => {
    if (isWorkstreamTabId(initial?.tab)) return initial.tab;
    if (isWorkstreamTabId(searchParams.get('tab'))) return searchParams.get('tab') as WorkstreamTabId;
    return 'information';
  });
  const [activeSection, setActiveSectionState] = useState<InformationSectionId>(() => {
    if (isInformationSectionId(initial?.section)) return initial.section;
    if (isInformationSectionId(searchParams.get('section'))) {
      return searchParams.get('section') as InformationSectionId;
    }
    return 'legal-identity';
  });
  const [assertionId, setAssertionId] = useState<string | null>(
    () => initial?.assertionId ?? readParam(searchParams, 'assertionId'),
  );
  const [issueId, setIssueId] = useState<string | null>(
    () => initial?.issueId ?? readParam(searchParams, 'issueId'),
  );
  const [documentVersionId, setDocumentVersionId] = useState<string | null>(
    () => initial?.documentVersionId ?? readParam(searchParams, 'documentVersionId'),
  );

  const writeUrl = useCallback(
    (next: {
      tab?: WorkstreamTabId;
      section?: InformationSectionId;
      assertionId?: string | null;
      issueId?: string | null;
      documentVersionId?: string | null;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      const tab = next.tab ?? activeTab;
      const section = next.section ?? activeSection;
      const nextAssertion =
        next.assertionId !== undefined ? next.assertionId : assertionId;
      const nextIssue = next.issueId !== undefined ? next.issueId : issueId;
      const nextDocumentVersion =
        next.documentVersionId !== undefined ? next.documentVersionId : documentVersionId;

      if (tab && tab !== 'information') {
        params.set('tab', tab);
      } else {
        params.delete('tab');
      }

      if (tab === 'information' && section && section !== 'legal-identity') {
        params.set('section', section);
      } else if (tab !== 'information') {
        params.delete('section');
      } else if (section === 'legal-identity') {
        params.delete('section');
      } else {
        params.set('section', section);
      }

      if (nextAssertion) params.set('assertionId', nextAssertion);
      else params.delete('assertionId');

      if (nextIssue) params.set('issueId', nextIssue);
      else params.delete('issueId');

      if (nextDocumentVersion) params.set('documentVersionId', nextDocumentVersion);
      else params.delete('documentVersionId');

      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      skipNextSyncRef.current = true;
      router.replace(href, { scroll: false });
    },
    [
      activeSection,
      activeTab,
      assertionId,
      documentVersionId,
      issueId,
      pathname,
      router,
      searchParams,
    ],
  );

  // Keep local state in sync with browser back/forward and external query changes.
  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    const tabParam = searchParams.get('tab');
    const sectionParam = searchParams.get('section');
    if (isWorkstreamTabId(tabParam)) {
      setActiveTabState(tabParam);
    } else if (!tabParam) {
      setActiveTabState('information');
    }
    if (isInformationSectionId(sectionParam)) {
      setActiveSectionState(sectionParam);
    } else if (!sectionParam) {
      setActiveSectionState('legal-identity');
    }
    setAssertionId(readParam(searchParams, 'assertionId'));
    setIssueId(readParam(searchParams, 'issueId'));
    setDocumentVersionId(readParam(searchParams, 'documentVersionId'));
  }, [searchParams]);

  const setActiveTab = useCallback(
    (tab: WorkstreamTabId) => {
      setActiveTabState(tab);
      writeUrl({
        tab,
        assertionId: tab === 'facts' ? assertionId : null,
        issueId: tab === 'questions' ? issueId : null,
        documentVersionId:
          tab === 'facts' || tab === 'documents' ? documentVersionId : null,
      });
    },
    [assertionId, documentVersionId, issueId, writeUrl],
  );

  const setActiveSection = useCallback(
    (section: InformationSectionId) => {
      setActiveSectionState(section);
      writeUrl({ tab: 'information', section });
    },
    [writeUrl],
  );

  const openAssertion = useCallback(
    (id: string, opts?: { tab?: WorkstreamTabId }) => {
      const tab = opts?.tab ?? 'facts';
      setActiveTabState(tab);
      setAssertionId(id);
      writeUrl({ tab, assertionId: id });
    },
    [writeUrl],
  );

  const openIssue = useCallback(
    (id: string, opts?: { tab?: WorkstreamTabId }) => {
      const tab = opts?.tab ?? 'questions';
      setActiveTabState(tab);
      setIssueId(id);
      writeUrl({ tab, issueId: id });
    },
    [writeUrl],
  );

  const focusDocumentVersion = useCallback(
    (id: string, opts?: { tab?: WorkstreamTabId }) => {
      const tab = opts?.tab ?? 'facts';
      setActiveTabState(tab);
      setDocumentVersionId(id);
      writeUrl({ tab, documentVersionId: id });
    },
    [writeUrl],
  );

  const closeAssertion = useCallback(() => {
    setAssertionId(null);
    writeUrl({ assertionId: null });
  }, [writeUrl]);

  const closeIssue = useCallback(() => {
    setIssueId(null);
    writeUrl({ issueId: null });
  }, [writeUrl]);

  const clearDocumentVersionFocus = useCallback(() => {
    setDocumentVersionId(null);
    writeUrl({ documentVersionId: null });
  }, [writeUrl]);

  return useMemo(
    () => ({
      activeTab,
      activeSection,
      assertionId,
      issueId,
      documentVersionId,
      setActiveTab,
      setActiveSection,
      openAssertion,
      openIssue,
      focusDocumentVersion,
      closeAssertion,
      closeIssue,
      clearDocumentVersionFocus,
    }),
    [
      activeSection,
      activeTab,
      assertionId,
      clearDocumentVersionFocus,
      closeAssertion,
      closeIssue,
      documentVersionId,
      focusDocumentVersion,
      issueId,
      openAssertion,
      openIssue,
      setActiveSection,
      setActiveTab,
    ],
  );
}
