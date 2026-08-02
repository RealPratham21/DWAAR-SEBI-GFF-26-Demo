'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { CompanyIncorporationDisclosuresTab } from '@/components/company-incorporation/company-incorporation-disclosures-tab';
import { CompanyIncorporationDocumentsTab } from '@/components/company-incorporation/company-incorporation-documents-tab';
import { CompanyIncorporationFactsTab } from '@/components/company-incorporation/company-incorporation-facts-tab';
import { CompanyIncorporationInformationTab } from '@/components/company-incorporation/company-incorporation-information-tab';
import { CompanyIncorporationOverviewTab } from '@/components/company-incorporation/company-incorporation-overview-tab';
import { CompanyIncorporationQuestionsTab } from '@/components/company-incorporation/company-incorporation-questions-tab';
import { CompanyIncorporationReviewTab } from '@/components/company-incorporation/company-incorporation-review-tab';
import { CompanyIncorporationProvider } from '@/lib/company-incorporation/context';
import { useCompanyIncorporationPipeline } from '@/lib/company-incorporation/hooks/use-company-incorporation-pipeline';
import { useCompanyIncorporationUrlState } from '@/lib/company-incorporation/hooks/use-company-incorporation-url-state';
import type { Workstream } from '@/lib/types';
import { WORKSTREAM_TABS } from '@/lib/types/company-incorporation';
import { cn } from '@/lib/utils';

interface CompanyIncorporationWorkstreamProps {
  workstream: Workstream;
  initialTab?: string;
  initialSection?: string;
  initialAssertionId?: string;
  initialIssueId?: string;
  initialDocumentVersionId?: string;
}

export function CompanyIncorporationWorkstream({
  workstream,
  initialTab,
  initialSection,
  initialAssertionId,
  initialIssueId,
  initialDocumentVersionId,
}: CompanyIncorporationWorkstreamProps) {
  const url = useCompanyIncorporationUrlState({
    tab: initialTab,
    section: initialSection,
    assertionId: initialAssertionId,
    issueId: initialIssueId,
    documentVersionId: initialDocumentVersionId,
  });
  const [refreshToken, setRefreshToken] = useState(0);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  const bumpRefresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  const pipelineEnabled =
    url.activeTab === 'documents' ||
    url.activeTab === 'facts' ||
    url.activeTab === 'questions' ||
    url.activeTab === 'overview';

  const pipeline = useCompanyIncorporationPipeline({
    enabled: pipelineEnabled,
    onPipelineBecameIdle: bumpRefresh,
  });

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  const handleTabChange = (tabId: (typeof WORKSTREAM_TABS)[number]['id']) => {
    url.setActiveTab(tabId);
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
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Company & Incorporation tabs">
            {WORKSTREAM_TABS.map((tab) => (
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

        {url.activeTab === 'overview' ? (
          <CompanyIncorporationOverviewTab
            enabled
            refreshToken={refreshToken}
            onContinueToInformation={() => handleTabChange('information')}
          />
        ) : null}

        {url.activeTab === 'information' ? (
          <CompanyIncorporationInformationTab
            activeSection={url.activeSection}
            onSectionChange={url.setActiveSection}
          />
        ) : null}

        {url.activeTab === 'documents' ? (
          <CompanyIncorporationDocumentsTab
            pipeline={pipeline}
            focusedDocumentVersionId={url.documentVersionId}
            onUploadFinalized={() => {
              void pipeline.refresh({ silent: true });
            }}
          />
        ) : null}

        {url.activeTab === 'questions' ? (
          <CompanyIncorporationQuestionsTab
            enabled
            issueId={url.issueId}
            refreshToken={refreshToken}
            pipelineAggregation={pipeline.data?.aggregation ?? null}
            onOpenIssue={(issueId) => url.openIssue(issueId)}
            onCloseIssue={url.closeIssue}
            onResolved={bumpRefresh}
            onViewEvidenceAssertion={(assertionId) => url.openAssertion(assertionId)}
          />
        ) : null}

        {url.activeTab === 'facts' ? (
          <CompanyIncorporationFactsTab
            enabled
            assertionId={url.assertionId}
            documentVersionId={url.documentVersionId}
            refreshToken={refreshToken}
            pipelineAggregation={pipeline.data?.aggregation ?? null}
            pipelineDocuments={pipeline.data?.documents ?? []}
            onOpenAssertion={(assertionId) => url.openAssertion(assertionId)}
            onCloseAssertion={url.closeAssertion}
            onReviewed={bumpRefresh}
          />
        ) : null}

        {url.activeTab === 'disclosures' ? <CompanyIncorporationDisclosuresTab /> : null}

        {url.activeTab === 'review' ? <CompanyIncorporationReviewTab /> : null}
      </div>
    </CompanyIncorporationProvider>
  );
}
