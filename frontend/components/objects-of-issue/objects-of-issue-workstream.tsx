'use client';

import { useEffect, useRef } from 'react';
import { ObjectsOfIssueAssessmentTab } from '@/components/objects-of-issue/assessment-tab';
import { ObjectsOfIssueInformationTab } from '@/components/objects-of-issue/information-tab';
import { ObjectsOfIssueOverviewTab } from '@/components/objects-of-issue/overview-tab';
import { PageHeader } from '@/components/page-header';
import { ObjectsOfIssueProvider, useObjectsOfIssue } from '@/lib/objects-of-issue/context';
import { useObjectsOfIssueUrlState } from '@/lib/objects-of-issue/hooks/use-objects-of-issue-url-state';
import { OBJECTS_OF_ISSUE_TABS, type ObjectsOfIssueTabId } from '@/lib/objects-of-issue/options';
import type { ObjectsOfIssueSectionId } from '@/lib/objects-of-issue/types';
import type { Workstream } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ObjectsOfIssueWorkstreamProps {
  workstream: Workstream;
  initialTab?: string;
  initialSection?: string;
}

function ObjectsOfIssueWorkstreamInner({
  workstream,
  initialTab,
  initialSection,
}: ObjectsOfIssueWorkstreamProps) {
  const url = useObjectsOfIssueUrlState({ tab: initialTab, section: initialSection });
  const { isLoading, loadError } = useObjectsOfIssue();
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  const handleTabChange = (tabId: ObjectsOfIssueTabId) => {
    if (tabId === url.activeTab) return;
    url.setActiveTab(tabId);
    mainScrollRef.current?.scrollTo({ top: 0 });
  };

  const handleContinueToInformation = (section?: ObjectsOfIssueSectionId) => {
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
          aria-label="Objects of the Issue tabs"
        >
          {OBJECTS_OF_ISSUE_TABS.map((tab) => (
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
          Loading Objects of the Issue…
        </p>
      ) : (
        <>
          {url.activeTab === 'overview' ? (
            <ObjectsOfIssueOverviewTab
              onContinueToInformation={handleContinueToInformation}
              onOpenAssessment={() => handleTabChange('objects-assessment')}
            />
          ) : null}

          {url.activeTab === 'information' ? (
            <ObjectsOfIssueInformationTab
              activeSection={url.activeSection}
              onSectionChange={url.setActiveSection}
            />
          ) : null}

          {url.activeTab === 'objects-assessment' ? <ObjectsOfIssueAssessmentTab /> : null}
        </>
      )}
    </div>
  );
}

export function ObjectsOfIssueWorkstream(props: ObjectsOfIssueWorkstreamProps) {
  return (
    <ObjectsOfIssueProvider>
      <ObjectsOfIssueWorkstreamInner {...props} />
    </ObjectsOfIssueProvider>
  );
}
