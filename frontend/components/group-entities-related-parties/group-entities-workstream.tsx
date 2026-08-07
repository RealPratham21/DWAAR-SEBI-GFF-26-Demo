'use client';

import { GroupEntitiesAssessmentTab } from '@/components/group-entities-related-parties/assessment-tab';
import { GroupEntitiesInformationTab } from '@/components/group-entities-related-parties/information-tab';
import { GroupEntitiesOverviewTab } from '@/components/group-entities-related-parties/overview-tab';
import { PageHeader } from '@/components/page-header';
import {
  GroupEntitiesProvider,
  useGroupEntities,
} from '@/lib/group-entities-related-parties/context';
import { useGroupEntitiesUrlState } from '@/lib/group-entities-related-parties/hooks/use-group-entities-url-state';
import {
  GROUP_ENTITIES_TABS,
  type GroupEntitiesTabId,
} from '@/lib/group-entities-related-parties/options';
import type { GroupEntitiesSectionId } from '@/lib/schemas/group-entities-related-parties';
import type { Workstream } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface GroupEntitiesWorkstreamProps {
  workstream: Workstream;
  initialTab?: string;
  initialSection?: string;
}

function GroupEntitiesWorkstreamInner({
  workstream,
  initialTab,
  initialSection,
}: GroupEntitiesWorkstreamProps) {
  const url = useGroupEntitiesUrlState({ tab: initialTab, section: initialSection });
  const { confirmLeave, isLoading, loadError } = useGroupEntities();
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  const handleTabChange = (tabId: GroupEntitiesTabId) => {
    if (tabId === url.activeTab) return;
    if (url.activeTab === 'information' && !confirmLeave()) return;
    url.setActiveTab(tabId);
    mainScrollRef.current?.scrollTo({ top: 0 });
  };

  const handleContinueToInformation = (section?: GroupEntitiesSectionId) => {
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
          aria-label="Group Entities & Related Parties tabs"
        >
          {GROUP_ENTITIES_TABS.map((tab) => (
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
          Loading Group Entities & Related Parties…
        </p>
      ) : (
        <>
          {url.activeTab === 'overview' ? (
            <GroupEntitiesOverviewTab
              onContinueToInformation={handleContinueToInformation}
              onOpenAssessment={() => handleTabChange('group-rpt-assessment')}
            />
          ) : null}

          {url.activeTab === 'information' ? (
            <GroupEntitiesInformationTab
              activeSection={url.activeSection}
              onSectionChange={url.setActiveSection}
            />
          ) : null}

          {url.activeTab === 'group-rpt-assessment' ? <GroupEntitiesAssessmentTab /> : null}
        </>
      )}
    </div>
  );
}

export function GroupEntitiesRelatedPartiesWorkstream(props: GroupEntitiesWorkstreamProps) {
  return (
    <GroupEntitiesProvider>
      <GroupEntitiesWorkstreamInner {...props} />
    </GroupEntitiesProvider>
  );
}
