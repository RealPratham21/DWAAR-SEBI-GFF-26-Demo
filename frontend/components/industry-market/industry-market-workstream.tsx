'use client';

import { useEffect, useRef } from 'react';
import { IndustryMarketAssessmentTab } from '@/components/industry-market/assessment-tab';
import { IndustryMarketInformationTab } from '@/components/industry-market/information-tab';
import { IndustryMarketOverviewTab } from '@/components/industry-market/overview-tab';
import { PageHeader } from '@/components/page-header';
import {
  IndustryMarketProvider,
  useIndustryMarket,
} from '@/lib/industry-market/context';
import { useIndustryMarketUrlState } from '@/lib/industry-market/hooks/use-industry-market-url-state';
import {
  INDUSTRY_MARKET_TABS,
  type IndustryMarketTabId,
} from '@/lib/industry-market/options';
import type { IndustryMarketSectionId } from '@/lib/schemas/industry-market';
import type { Workstream } from '@/lib/types';
import { cn } from '@/lib/utils';

interface IndustryMarketWorkstreamProps {
  workstream: Workstream;
  initialTab?: string;
  initialSection?: string;
}

function IndustryMarketWorkstreamInner({
  workstream,
  initialTab,
  initialSection,
}: IndustryMarketWorkstreamProps) {
  const url = useIndustryMarketUrlState({ tab: initialTab, section: initialSection });
  const { confirmLeave, isLoading, loadError } = useIndustryMarket();
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  const handleTabChange = (tabId: IndustryMarketTabId) => {
    if (tabId === url.activeTab) return;
    if (!confirmLeave()) return;
    url.setActiveTab(tabId);
    mainScrollRef.current?.scrollTo({ top: 0 });
  };

  const handleContinueToInformation = (section?: IndustryMarketSectionId) => {
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
          aria-label="Industry & Market tabs"
        >
          {INDUSTRY_MARKET_TABS.map((tab) => (
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
          Loading Industry & Market…
        </p>
      ) : (
        <>
          {url.activeTab === 'overview' ? (
            <IndustryMarketOverviewTab
              onContinueToInformation={handleContinueToInformation}
              onOpenAssessment={() => handleTabChange('industry-assessment')}
            />
          ) : null}

          {url.activeTab === 'information' ? (
            <IndustryMarketInformationTab
              activeSection={url.activeSection}
              onSectionChange={url.setActiveSection}
            />
          ) : null}

          {url.activeTab === 'industry-assessment' ? <IndustryMarketAssessmentTab /> : null}
        </>
      )}
    </div>
  );
}

export function IndustryMarketWorkstream(props: IndustryMarketWorkstreamProps) {
  return (
    <IndustryMarketProvider>
      <IndustryMarketWorkstreamInner {...props} />
    </IndustryMarketProvider>
  );
}
