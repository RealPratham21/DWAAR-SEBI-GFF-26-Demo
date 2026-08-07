'use client';

import { useEffect, useRef } from 'react';
import { FinancialsKpisAssessmentTab } from '@/components/financials-kpis/assessment-tab';
import { FinancialsKpisInformationTab } from '@/components/financials-kpis/information-tab';
import { FinancialsKpisOverviewTab } from '@/components/financials-kpis/overview-tab';
import { PageHeader } from '@/components/page-header';
import { FinancialsKpisProvider, useFinancialsKpis } from '@/lib/financials-kpis/context';
import { useFinancialsKpisUrlState } from '@/lib/financials-kpis/hooks/use-financials-kpis-url-state';
import { FINANCIALS_KPIS_TABS, type FinancialsKpisTabId } from '@/lib/financials-kpis/options';
import type { FinancialsKpisSectionId } from '@/lib/schemas/financials-kpis';
import type { Workstream } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FinancialsKpisWorkstreamProps {
  workstream: Workstream;
  initialTab?: string;
  initialSection?: string;
}

function FinancialsKpisWorkstreamInner({
  workstream,
  initialTab,
  initialSection,
}: FinancialsKpisWorkstreamProps) {
  const url = useFinancialsKpisUrlState({ tab: initialTab, section: initialSection });
  const { confirmLeave, isLoading, loadError } = useFinancialsKpis();
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollRef.current = document.querySelector('main');
  }, []);

  const handleTabChange = (tabId: FinancialsKpisTabId) => {
    if (tabId === url.activeTab) return;
    if (!confirmLeave()) return;
    url.setActiveTab(tabId);
    mainScrollRef.current?.scrollTo({ top: 0 });
  };

  const handleContinueToInformation = (section?: FinancialsKpisSectionId) => {
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
          aria-label="Financials & KPIs tabs"
        >
          {FINANCIALS_KPIS_TABS.map((tab) => (
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
          Loading Financials & KPIs…
        </p>
      ) : (
        <>
          {url.activeTab === 'overview' ? (
            <FinancialsKpisOverviewTab
              onContinueToInformation={handleContinueToInformation}
              onOpenAssessment={() => handleTabChange('financial-assessment')}
            />
          ) : null}

          {url.activeTab === 'information' ? (
            <FinancialsKpisInformationTab
              activeSection={url.activeSection}
              onSectionChange={url.setActiveSection}
            />
          ) : null}

          {url.activeTab === 'financial-assessment' ? <FinancialsKpisAssessmentTab /> : null}
        </>
      )}
    </div>
  );
}

export function FinancialsKpisWorkstream(props: FinancialsKpisWorkstreamProps) {
  return (
    <FinancialsKpisProvider>
      <FinancialsKpisWorkstreamInner {...props} />
    </FinancialsKpisProvider>
  );
}
