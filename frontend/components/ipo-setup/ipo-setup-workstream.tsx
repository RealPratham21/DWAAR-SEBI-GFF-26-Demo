'use client';

import { useEffect, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { IpoSetupAssessmentTab } from '@/components/ipo-setup/assessment-tab';
import { IpoSetupInformationTab } from '@/components/ipo-setup/information-tab';
import { IpoSetupOverviewTab } from '@/components/ipo-setup/overview-tab';
import { IpoSetupProvider, useIpoSetup } from '@/lib/ipo-setup/context';
import { useIpoSetupUrlState } from '@/lib/ipo-setup/hooks/use-ipo-setup-url-state';
import { IPO_SETUP_TABS, type IpoSetupTabId } from '@/lib/ipo-setup/options';
import type { Workstream } from '@/lib/types';
import { cn } from '@/lib/utils';

interface IpoSetupWorkstreamProps {
  workstream: Workstream;
  initialTab?: string;
  initialSection?: string;
}

function IpoSetupWorkstreamInner({
  workstream,
  initialTab,
  initialSection,
}: IpoSetupWorkstreamProps) {
  const url = useIpoSetupUrlState({ tab: initialTab, section: initialSection });
  const { confirmLeave, isLoading, loadError } = useIpoSetup();
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  const handleTabChange = (tabId: IpoSetupTabId) => {
    if (tabId === url.activeTab) return;
    if (url.activeTab === 'information' && !confirmLeave()) return;
    url.setActiveTab(tabId);
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
          aria-label="IPO Setup & Eligibility tabs"
        >
          {IPO_SETUP_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={url.activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'px-4 py-3 border-b-2 whitespace-nowrap font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
          Loading IPO Setup & Eligibility…
        </p>
      ) : (
        <>
          {url.activeTab === 'overview' ? (
            <IpoSetupOverviewTab
              onContinueToInformation={() => handleTabChange('information')}
              onOpenAssessment={() => handleTabChange('eligibility-assessment')}
            />
          ) : null}

          {url.activeTab === 'information' ? (
            <IpoSetupInformationTab
              activeSection={url.activeSection}
              onSectionChange={url.setActiveSection}
            />
          ) : null}

          {url.activeTab === 'eligibility-assessment' ? <IpoSetupAssessmentTab /> : null}
        </>
      )}
    </div>
  );
}

export function IpoSetupEligibilityWorkstream(props: IpoSetupWorkstreamProps) {
  return (
    <IpoSetupProvider>
      <IpoSetupWorkstreamInner {...props} />
    </IpoSetupProvider>
  );
}
