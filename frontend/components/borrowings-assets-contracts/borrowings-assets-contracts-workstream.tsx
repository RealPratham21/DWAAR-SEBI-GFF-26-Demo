'use client';

import { BorrowingsAssetsContractsAssessmentTab } from '@/components/borrowings-assets-contracts/assessment-tab';
import { BorrowingsAssetsContractsInformationTab } from '@/components/borrowings-assets-contracts/information-tab';
import { BorrowingsAssetsContractsOverviewTab } from '@/components/borrowings-assets-contracts/overview-tab';
import { PageHeader } from '@/components/page-header';
import {
  BorrowingsAssetsContractsProvider,
  useBorrowingsAssetsContracts,
} from '@/lib/borrowings-assets-contracts/context';
import { useBorrowingsAssetsContractsUrlState } from '@/lib/borrowings-assets-contracts/hooks/use-borrowings-assets-contracts-url-state';
import {
  BAC_TABS,
  type BorrowingsAssetsContractsTabId,
} from '@/lib/borrowings-assets-contracts/options';
import type { BorrowingsAssetsContractsSectionId } from '@/lib/schemas/borrowings-assets-contracts';
import type { Workstream } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface BorrowingsAssetsContractsWorkstreamProps {
  workstream: Workstream;
  initialTab?: string;
  initialSection?: string;
}

function BorrowingsAssetsContractsWorkstreamInner({
  workstream,
  initialTab,
  initialSection,
}: BorrowingsAssetsContractsWorkstreamProps) {
  const url = useBorrowingsAssetsContractsUrlState({ tab: initialTab, section: initialSection });
  const { confirmLeave, isLoading, loadError } = useBorrowingsAssetsContracts();
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  const handleTabChange = (tabId: BorrowingsAssetsContractsTabId) => {
    if (tabId === url.activeTab) return;
    if (!confirmLeave()) return;
    url.setActiveTab(tabId);
    mainScrollRef.current?.scrollTo({ top: 0 });
  };

  const handleContinueToInformation = (section?: BorrowingsAssetsContractsSectionId) => {
    if (!confirmLeave()) return;
    if (section) url.setActiveSection(section);
    else url.setActiveTab('information');
    mainScrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={workstream.title}
        description={workstream.description}
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'DRHP Preparation', href: '/projects/demo/workstreams' },
          { label: workstream.title },
        ]}
      />

      <div className="border-b border-border">
        <div
          className="flex gap-1 overflow-x-auto"
          role="tablist"
          aria-label="Borrowings, Assets & Contracts tabs"
        >
          {BAC_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={url.activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                url.activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loadError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {loadError}
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Loading Borrowings, Assets & Contracts…
        </p>
      ) : (
        <>
          {url.activeTab === 'overview' ? (
            <BorrowingsAssetsContractsOverviewTab
              onContinueToInformation={handleContinueToInformation}
              onOpenAssessment={() => handleTabChange('borrowings-contracts-assessment')}
            />
          ) : null}

          {url.activeTab === 'information' ? (
            <BorrowingsAssetsContractsInformationTab
              activeSection={url.activeSection}
              onSectionChange={url.setActiveSection}
            />
          ) : null}

          {url.activeTab === 'borrowings-contracts-assessment' ? (
            <BorrowingsAssetsContractsAssessmentTab />
          ) : null}
        </>
      )}
    </div>
  );
}

export function BorrowingsAssetsContractsWorkstream(props: BorrowingsAssetsContractsWorkstreamProps) {
  return (
    <BorrowingsAssetsContractsProvider>
      <BorrowingsAssetsContractsWorkstreamInner {...props} />
    </BorrowingsAssetsContractsProvider>
  );
}
