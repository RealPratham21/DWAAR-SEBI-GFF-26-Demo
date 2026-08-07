'use client';

import { useEffect, useRef } from 'react';
import { ManagementGovernanceAssessmentTab } from '@/components/management-governance/assessment-tab';
import { ManagementGovernanceInformationTab } from '@/components/management-governance/information-tab';
import { ManagementGovernanceOverviewTab } from '@/components/management-governance/overview-tab';
import { PageHeader } from '@/components/page-header';
import {
  ManagementGovernanceProvider,
  useManagementGovernance,
} from '@/lib/management-governance/context';
import { useManagementGovernanceUrlState } from '@/lib/management-governance/hooks/use-management-governance-url-state';
import {
  MANAGEMENT_GOVERNANCE_TABS,
  type ManagementGovernanceTabId,
} from '@/lib/management-governance/options';
import type { ManagementGovernanceSectionId } from '@/lib/schemas/management-governance';
import type { Workstream } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ManagementGovernanceWorkstreamProps {
  workstream: Workstream;
  initialTab?: string;
  initialSection?: string;
}

function ManagementGovernanceWorkstreamInner({
  workstream,
  initialTab,
  initialSection,
}: ManagementGovernanceWorkstreamProps) {
  const url = useManagementGovernanceUrlState({ tab: initialTab, section: initialSection });
  const { confirmLeave, isLoading, loadError } = useManagementGovernance();
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  const handleTabChange = (tabId: ManagementGovernanceTabId) => {
    if (tabId === url.activeTab) return;
    if (!confirmLeave()) return;
    url.setActiveTab(tabId);
    mainScrollRef.current?.scrollTo({ top: 0 });
  };

  const handleContinueToInformation = (section?: ManagementGovernanceSectionId) => {
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
          aria-label="Management & Governance tabs"
        >
          {MANAGEMENT_GOVERNANCE_TABS.map((tab) => (
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
          Loading Management & Governance…
        </p>
      ) : (
        <>
          {url.activeTab === 'overview' ? (
            <ManagementGovernanceOverviewTab
              onContinueToInformation={handleContinueToInformation}
              onOpenAssessment={() => handleTabChange('governance-assessment')}
            />
          ) : null}

          {url.activeTab === 'information' ? (
            <ManagementGovernanceInformationTab
              activeSection={url.activeSection}
              onSectionChange={url.setActiveSection}
            />
          ) : null}

          {url.activeTab === 'governance-assessment' ? <ManagementGovernanceAssessmentTab /> : null}
        </>
      )}
    </div>
  );
}

export function ManagementGovernanceWorkstream(props: ManagementGovernanceWorkstreamProps) {
  return (
    <ManagementGovernanceProvider>
      <ManagementGovernanceWorkstreamInner {...props} />
    </ManagementGovernanceProvider>
  );
}
