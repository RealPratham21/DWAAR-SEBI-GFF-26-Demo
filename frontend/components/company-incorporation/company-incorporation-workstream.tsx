'use client';

import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { CompanyIncorporationDisclosuresTab } from '@/components/company-incorporation/company-incorporation-disclosures-tab';
import { CompanyIncorporationDocumentsTab } from '@/components/company-incorporation/company-incorporation-documents-tab';
import { CompanyIncorporationFactsTab } from '@/components/company-incorporation/company-incorporation-facts-tab';
import { CompanyIncorporationInformationTab } from '@/components/company-incorporation/company-incorporation-information-tab';
import { CompanyIncorporationOverviewTab } from '@/components/company-incorporation/company-incorporation-overview-tab';
import { CompanyIncorporationQuestionsTab } from '@/components/company-incorporation/company-incorporation-questions-tab';
import { CompanyIncorporationReviewTab } from '@/components/company-incorporation/company-incorporation-review-tab';
import { CompanyIncorporationProvider } from '@/lib/company-incorporation/context';
import type { Workstream } from '@/lib/types';
import {
  WORKSTREAM_TABS,
  type WorkstreamTabId,
} from '@/lib/types/company-incorporation';
import { cn } from '@/lib/utils';

interface CompanyIncorporationWorkstreamProps {
  workstream: Workstream;
}

export function CompanyIncorporationWorkstream({ workstream }: CompanyIncorporationWorkstreamProps) {
  const [activeTab, setActiveTab] = useState<WorkstreamTabId>('information');
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  const handleTabChange = (tabId: WorkstreamTabId) => {
    setActiveTab(tabId);
    mainScrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    <CompanyIncorporationProvider>
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
          <div className="flex gap-1 overflow-x-auto">
            {WORKSTREAM_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'px-4 py-3 border-b-2 whitespace-nowrap font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' ? (
          <CompanyIncorporationOverviewTab
            onContinueToInformation={() => handleTabChange('information')}
          />
        ) : null}

        {activeTab === 'information' ? <CompanyIncorporationInformationTab /> : null}

        {activeTab === 'documents' ? <CompanyIncorporationDocumentsTab /> : null}

        {activeTab === 'questions' ? <CompanyIncorporationQuestionsTab /> : null}

        {activeTab === 'facts' ? <CompanyIncorporationFactsTab /> : null}

        {activeTab === 'disclosures' ? <CompanyIncorporationDisclosuresTab /> : null}

        {activeTab === 'review' ? <CompanyIncorporationReviewTab /> : null}
      </div>
    </CompanyIncorporationProvider>
  );
}
