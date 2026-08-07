'use client';

import { LitigationApprovalsComplianceAssessmentTab } from '@/components/litigation-approvals-compliance/assessment-tab';
import { LitigationApprovalsComplianceInformationTab } from '@/components/litigation-approvals-compliance/information-tab';
import { LitigationApprovalsComplianceOverviewTab } from '@/components/litigation-approvals-compliance/overview-tab';
import { PageHeader } from '@/components/page-header';
import {
  LitigationApprovalsComplianceProvider,
  useLitigationApprovalsCompliance,
} from '@/lib/litigation-approvals-compliance/context';
import { useLitigationApprovalsComplianceUrlState } from '@/lib/litigation-approvals-compliance/hooks/use-litigation-approvals-compliance-url-state';
import {
  LAC_TABS,
  type LitigationApprovalsComplianceTabId,
} from '@/lib/litigation-approvals-compliance/options';
import type { LitigationApprovalsComplianceSectionId } from '@/lib/schemas/litigation-approvals-compliance';
import type { Workstream } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface LitigationApprovalsComplianceWorkstreamProps {
  workstream: Workstream;
  initialTab?: string;
  initialSection?: string;
}

function LitigationApprovalsComplianceWorkstreamInner({
  workstream,
  initialTab,
  initialSection,
}: LitigationApprovalsComplianceWorkstreamProps) {
  const url = useLitigationApprovalsComplianceUrlState({ tab: initialTab, section: initialSection });
  const { confirmLeave, isLoading, loadError } = useLitigationApprovalsCompliance();
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  const handleTabChange = (tabId: LitigationApprovalsComplianceTabId) => {
    if (tabId === url.activeTab) return;
    if (url.activeTab === 'information' && !confirmLeave()) return;
    url.setActiveTab(tabId);
    mainScrollRef.current?.scrollTo({ top: 0 });
  };

  const handleContinueToInformation = (section?: LitigationApprovalsComplianceSectionId) => {
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
          aria-label="Litigation, Approvals & Compliance tabs"
        >
          {LAC_TABS.map((tab) => (
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
          Loading Litigation, Approvals & Compliance…
        </p>
      ) : (
        <>
          {url.activeTab === 'overview' ? (
            <LitigationApprovalsComplianceOverviewTab
              onContinueToInformation={handleContinueToInformation}
              onOpenAssessment={() => handleTabChange('legal-compliance-assessment')}
            />
          ) : null}

          {url.activeTab === 'information' ? (
            <LitigationApprovalsComplianceInformationTab
              activeSection={url.activeSection}
              onSectionChange={url.setActiveSection}
            />
          ) : null}

          {url.activeTab === 'legal-compliance-assessment' ? (
            <LitigationApprovalsComplianceAssessmentTab />
          ) : null}
        </>
      )}
    </div>
  );
}

export function LitigationApprovalsComplianceWorkstream(
  props: LitigationApprovalsComplianceWorkstreamProps,
) {
  return (
    <LitigationApprovalsComplianceProvider>
      <LitigationApprovalsComplianceWorkstreamInner {...props} />
    </LitigationApprovalsComplianceProvider>
  );
}
