'use client';

import { IntermediariesFilingFilingReadinessTab } from '@/components/intermediaries-filing/filing-readiness-tab';
import { IntermediariesFilingInformationTab } from '@/components/intermediaries-filing/information-tab';
import { IntermediariesFilingOverviewTab } from '@/components/intermediaries-filing/overview-tab';
import { PageHeader } from '@/components/page-header';
import {
  IntermediariesFilingProvider,
  useIntermediariesFiling,
} from '@/lib/intermediaries-filing/context';
import { useIntermediariesFilingUrlState } from '@/lib/intermediaries-filing/hooks/use-intermediaries-filing-url-state';
import {
  IF_TABS,
  type IntermediariesFilingTabId,
} from '@/lib/intermediaries-filing/options';
import type { IntermediariesFilingSectionId } from '@/lib/schemas/intermediaries-filing';
import type { Workstream } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface IntermediariesFilingWorkstreamProps {
  workstream: Workstream;
  initialTab?: string;
  initialSection?: string;
}

function IntermediariesFilingWorkstreamInner({
  workstream,
  initialTab,
  initialSection,
}: IntermediariesFilingWorkstreamProps) {
  const url = useIntermediariesFilingUrlState({ tab: initialTab, section: initialSection });
  const { confirmLeave, isLoading, loadError } = useIntermediariesFiling();
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  const handleTabChange = (tabId: IntermediariesFilingTabId) => {
    if (tabId === url.activeTab) return;
    if (url.activeTab === 'information' && !confirmLeave()) return;
    url.setActiveTab(tabId);
    mainScrollRef.current?.scrollTo({ top: 0 });
  };

  const handleContinueToInformation = (section?: IntermediariesFilingSectionId) => {
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
          aria-label="Intermediaries & Filing tabs"
        >
          {IF_TABS.map((tab) => (
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
          Loading Intermediaries & Filing…
        </p>
      ) : (
        <>
          {url.activeTab === 'overview' ? (
            <IntermediariesFilingOverviewTab
              onContinueToInformation={handleContinueToInformation}
              onOpenFilingReadiness={() => handleTabChange('filing-readiness')}
            />
          ) : null}

          {url.activeTab === 'information' ? (
            <IntermediariesFilingInformationTab
              activeSection={url.activeSection}
              onSectionChange={url.setActiveSection}
            />
          ) : null}

          {url.activeTab === 'filing-readiness' ? <IntermediariesFilingFilingReadinessTab /> : null}
        </>
      )}
    </div>
  );
}

export function IntermediariesFilingWorkstream(props: IntermediariesFilingWorkstreamProps) {
  return (
    <IntermediariesFilingProvider>
      <IntermediariesFilingWorkstreamInner {...props} />
    </IntermediariesFilingProvider>
  );
}
