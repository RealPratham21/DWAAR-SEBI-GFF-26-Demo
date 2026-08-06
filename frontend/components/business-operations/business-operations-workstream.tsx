'use client';

import { useEffect, useRef } from 'react';
import { BusinessOperationsAssessmentTab } from '@/components/business-operations/assessment-tab';
import { BusinessOperationsInformationTab } from '@/components/business-operations/information-tab';
import { BusinessOperationsOverviewTab } from '@/components/business-operations/overview-tab';
import { PageHeader } from '@/components/page-header';
import {
  BusinessOperationsProvider,
  useBusinessOperations,
} from '@/lib/business-operations/context';
import { useBusinessOperationsUrlState } from '@/lib/business-operations/hooks/use-business-operations-url-state';
import {
  BUSINESS_OPERATIONS_TABS,
  type BusinessOperationsTabId,
} from '@/lib/business-operations/options';
import type { BusinessOperationsSectionId } from '@/lib/business-operations/types';
import type { Workstream } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BusinessOperationsWorkstreamProps {
  workstream: Workstream;
  initialTab?: string;
  initialSection?: string;
}

function BusinessOperationsWorkstreamInner({
  workstream,
  initialTab,
  initialSection,
}: BusinessOperationsWorkstreamProps) {
  const url = useBusinessOperationsUrlState({ tab: initialTab, section: initialSection });
  const { confirmLeave, isLoading, loadError } = useBusinessOperations();
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  const handleTabChange = (tabId: BusinessOperationsTabId) => {
    if (tabId === url.activeTab) return;
    if (!confirmLeave()) return;
    url.setActiveTab(tabId);
    mainScrollRef.current?.scrollTo({ top: 0 });
  };

  const handleContinueToInformation = (section?: BusinessOperationsSectionId) => {
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
          aria-label="Business & Operations tabs"
        >
          {BUSINESS_OPERATIONS_TABS.map((tab) => (
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
          Loading Business & Operations…
        </p>
      ) : (
        <>
          {url.activeTab === 'overview' ? (
            <BusinessOperationsOverviewTab
              onContinueToInformation={handleContinueToInformation}
              onOpenAssessment={() => handleTabChange('business-assessment')}
            />
          ) : null}

          {url.activeTab === 'information' ? (
            <BusinessOperationsInformationTab
              activeSection={url.activeSection}
              onSectionChange={url.setActiveSection}
            />
          ) : null}

          {url.activeTab === 'business-assessment' ? (
            <BusinessOperationsAssessmentTab />
          ) : null}
        </>
      )}
    </div>
  );
}

export function BusinessOperationsWorkstream(props: BusinessOperationsWorkstreamProps) {
  return (
    <BusinessOperationsProvider>
      <BusinessOperationsWorkstreamInner {...props} />
    </BusinessOperationsProvider>
  );
}
