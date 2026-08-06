'use client';

import { useEffect, useRef } from 'react';
import { CapitalOwnershipAssessmentTab } from '@/components/capital-ownership/assessment-tab';
import { CapitalOwnershipInformationTab } from '@/components/capital-ownership/information-tab';
import { CapitalOwnershipOverviewTab } from '@/components/capital-ownership/overview-tab';
import { PageHeader } from '@/components/page-header';
import { CapitalOwnershipProvider, useCapitalOwnership } from '@/lib/capital-ownership/context';
import { useCapitalOwnershipUrlState } from '@/lib/capital-ownership/hooks/use-capital-ownership-url-state';
import {
  CAPITAL_OWNERSHIP_TABS,
  type CapitalOwnershipTabId,
} from '@/lib/capital-ownership/options';
import type { CapitalOwnershipSectionId } from '@/lib/capital-ownership/types';
import type { Workstream } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CapitalOwnershipWorkstreamProps {
  workstream: Workstream;
  initialTab?: string;
  initialSection?: string;
}

function CapitalOwnershipWorkstreamInner({
  workstream,
  initialTab,
  initialSection,
}: CapitalOwnershipWorkstreamProps) {
  const url = useCapitalOwnershipUrlState({ tab: initialTab, section: initialSection });
  const { confirmLeave, isLoading, loadError } = useCapitalOwnership();
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  const handleTabChange = (tabId: CapitalOwnershipTabId) => {
    if (tabId === url.activeTab) return;
    if (!confirmLeave()) return;
    url.setActiveTab(tabId);
    mainScrollRef.current?.scrollTo({ top: 0 });
  };

  const handleContinueToInformation = (section?: CapitalOwnershipSectionId) => {
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
          aria-label="Capital & Ownership tabs"
        >
          {CAPITAL_OWNERSHIP_TABS.map((tab) => (
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
          Loading Capital & Ownership…
        </p>
      ) : (
        <>
          {url.activeTab === 'overview' ? (
            <CapitalOwnershipOverviewTab
              onContinueToInformation={handleContinueToInformation}
              onOpenAssessment={() => handleTabChange('capital-assessment')}
            />
          ) : null}

          {url.activeTab === 'information' ? (
            <CapitalOwnershipInformationTab
              activeSection={url.activeSection}
              onSectionChange={url.setActiveSection}
            />
          ) : null}

          {url.activeTab === 'capital-assessment' ? <CapitalOwnershipAssessmentTab /> : null}
        </>
      )}
    </div>
  );
}

export function CapitalOwnershipWorkstream(props: CapitalOwnershipWorkstreamProps) {
  return (
    <CapitalOwnershipProvider>
      <CapitalOwnershipWorkstreamInner {...props} />
    </CapitalOwnershipProvider>
  );
}
