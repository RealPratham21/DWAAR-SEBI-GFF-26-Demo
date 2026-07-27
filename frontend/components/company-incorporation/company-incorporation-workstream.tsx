'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { CompanyIncorporationInformationTab } from '@/components/company-incorporation/company-incorporation-information-tab';
import { WorkstreamTabPlaceholder } from '@/components/company-incorporation/workstream-tab-placeholder';
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
                onClick={() => setActiveTab(tab.id)}
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
          <WorkstreamTabPlaceholder
            title="Overview"
            description="A structured summary of this workstream will appear here once section information has been saved and review workflows are connected."
          />
        ) : null}

        {activeTab === 'information' ? <CompanyIncorporationInformationTab /> : null}

        {activeTab === 'documents' ? (
          <WorkstreamTabPlaceholder
            title="Documents"
            description="Document upload, categorisation, and evidence linking for this workstream will be added in a later release."
          />
        ) : null}

        {activeTab === 'questions' ? (
          <WorkstreamTabPlaceholder
            title="Questions & Conflicts"
            description="Reviewer questions and detected information conflicts will be managed here once professional review workflows are connected."
          />
        ) : null}

        {activeTab === 'facts' ? (
          <WorkstreamTabPlaceholder
            title="Facts & Evidence"
            description="Extracted facts and supporting evidence references will appear here once document processing is connected."
          />
        ) : null}

        {activeTab === 'disclosures' ? (
          <WorkstreamTabPlaceholder
            title="Generated Disclosures"
            description="Draft DRHP disclosure text generated from verified information will be available here in a later release."
          />
        ) : null}

        {activeTab === 'review' ? (
          <WorkstreamTabPlaceholder
            title="Review History"
            description="Merchant banker and legal review comments will be tracked here once review workflows are connected."
          />
        ) : null}
      </div>
    </CompanyIncorporationProvider>
  );
}
