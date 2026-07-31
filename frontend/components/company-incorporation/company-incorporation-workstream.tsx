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
  INFORMATION_SECTIONS,
  WORKSTREAM_TABS,
  type InformationSectionId,
  type WorkstreamTabId,
} from '@/lib/types/company-incorporation';
import { cn } from '@/lib/utils';

interface CompanyIncorporationWorkstreamProps {
  workstream: Workstream;
  initialTab?: string;
  initialSection?: string;
}

function isWorkstreamTabId(value: string | undefined): value is WorkstreamTabId {
  return WORKSTREAM_TABS.some((tab) => tab.id === value);
}

function isInformationSectionId(value: string | undefined): value is InformationSectionId {
  return INFORMATION_SECTIONS.some((section) => section.id === value);
}

export function CompanyIncorporationWorkstream({
  workstream,
  initialTab,
  initialSection,
}: CompanyIncorporationWorkstreamProps) {
  const [activeTab, setActiveTab] = useState<WorkstreamTabId>(
    isWorkstreamTabId(initialTab) ? initialTab : 'information',
  );
  const [activeSection, setActiveSection] = useState<InformationSectionId>(
    isInformationSectionId(initialSection) ? initialSection : 'legal-identity',
  );
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  useEffect(() => {
    if (isWorkstreamTabId(initialTab)) {
      setActiveTab(initialTab);
    }
    if (isInformationSectionId(initialSection)) {
      setActiveSection(initialSection);
    }
  }, [initialSection, initialTab]);

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

        {activeTab === 'information' ? (
          <CompanyIncorporationInformationTab
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        ) : null}

        {activeTab === 'documents' ? <CompanyIncorporationDocumentsTab /> : null}

        {activeTab === 'questions' ? <CompanyIncorporationQuestionsTab /> : null}

        {activeTab === 'facts' ? <CompanyIncorporationFactsTab /> : null}

        {activeTab === 'disclosures' ? <CompanyIncorporationDisclosuresTab /> : null}

        {activeTab === 'review' ? <CompanyIncorporationReviewTab /> : null}
      </div>
    </CompanyIncorporationProvider>
  );
}
