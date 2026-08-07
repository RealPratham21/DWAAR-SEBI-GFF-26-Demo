'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { MetricCard } from '@/components/metric-card';
import { WorkstreamCard } from '@/components/workstream-card';
import { WORKSTREAMS } from '@/lib/workstreams-config';
import { useWorkspaceBootstrap } from '@/lib/workspace/context';
import { workspaceLabels } from '@/lib/workspace/format';

const NEUTRAL_ASSESSMENT = 'Not assessed';

export default function DashboardPage() {
  const bootstrap = useWorkspaceBootstrap();

  const nextActions = [
    {
      id: 'company-incorporation',
      title: 'Review Company & Incorporation',
      description: 'Complete detailed issuer information in the first DRHP workstream.',
      href: '/projects/demo/workstreams/company-incorporation',
    },
    {
      id: 'company-profile',
      title: 'Review your company profile',
      description: 'Confirm the company, registration, and IPO intent captured during onboarding.',
      href: '/projects/demo/company-profile',
    },
    {
      id: 'data-room',
      title: 'Prepare supporting documents',
      description: 'Document storage is not connected yet. Keep source files ready for upload later.',
      href: '/projects/demo/data-room',
    },
    {
      id: 'facts',
      title: 'Start building verified facts',
      description: 'No facts have been verified yet. Add evidence-backed company facts when ready.',
      href: '/projects/demo/facts',
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Workspace for ${bootstrap.workspace.displayName}`}
      />

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Onboarding Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Company class"
            value={workspaceLabels.companyClass(bootstrap.company.companyClass)}
            description="From submitted onboarding"
            variant="compact"
          />
          <MetricCard
            label="Intended exchange"
            value={workspaceLabels.intendedExchange(bootstrap.ipoIntent.intendedExchange)}
            description="Target SME listing venue"
            variant="compact"
          />
          <MetricCard
            label="Target timeline"
            value={workspaceLabels.targetTimeline(bootstrap.ipoIntent.targetTimeline)}
            description="IPO planning horizon"
            variant="compact"
          />
          <MetricCard
            label="Preparation stage"
            value={workspaceLabels.preparationStage(bootstrap.ipoIntent.preparationStage)}
            description="Current IPO readiness stage"
            variant="compact"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Workspace Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="DRHP readiness"
            value={NEUTRAL_ASSESSMENT}
            description="Assessment not started"
            variant="compact"
          />
          <MetricCard
            label="Information completeness"
            value={NEUTRAL_ASSESSMENT}
            description="Detailed disclosures not started"
            variant="compact"
          />
          <MetricCard
            label="Evidence coverage"
            value="Document storage not connected"
            description="Onboarding metadata is not treated as uploaded documents"
            variant="compact"
          />
          <MetricCard
            label="Verified facts"
            value="No facts verified yet"
            description="Facts and evidence tracking not started"
            variant="compact"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recommended Next Steps</h2>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="divide-y divide-border">
            {nextActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                </div>
                <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">DRHP Preparation Progress</h2>
          <Link
            href="/projects/demo/workstreams"
            className="text-sm text-accent hover:opacity-80 font-medium"
          >
            View All
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {bootstrap.companyIncorporation.overallStatus === 'not_started'
            ? 'Workstream progress tracking has not started. Begin with Company & Incorporation to expand beyond onboarding.'
            : `Company & Incorporation: ${bootstrap.companyIncorporation.sectionsComplete} of ${bootstrap.companyIncorporation.totalSections} Information sections complete.`}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WORKSTREAMS.slice(0, 9).map((ws) => (
            <WorkstreamCard
              key={ws.slug}
              workstream={ws}
              companyIncorporationProgress={
                ws.slug === 'company-incorporation' ? bootstrap.companyIncorporation : undefined
              }
              businessOperationsProgress={
                ws.slug === 'business-operations' ? bootstrap.businessOperations : undefined
              }
              objectsOfIssueProgress={
                ws.slug === 'objects-of-issue' ? bootstrap.objectsOfIssue : undefined
              }
              financialsKpisProgress={
                ws.slug === 'financials-kpis' ? bootstrap.financialsKpis : undefined
              }
              managementGovernanceProgress={
                ws.slug === 'management-governance' ? bootstrap.managementGovernance : undefined
              }
              industryMarketProgress={
                ws.slug === 'industry-market' ? bootstrap.industryMarket : undefined
              }
              groupEntitiesProgress={
                ws.slug === 'group-entities-related-parties'
                  ? bootstrap.groupEntitiesRelatedParties
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            href="/projects/demo/data-room"
            className="px-4 py-3 border border-border rounded-md hover:bg-muted transition-colors text-sm font-medium text-foreground flex items-center justify-between"
          >
            Review document checklist
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/projects/demo/facts"
            className="px-4 py-3 border border-border rounded-md hover:bg-muted transition-colors text-sm font-medium text-foreground flex items-center justify-between"
          >
            Add company facts
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/projects/demo/drhp"
            className="px-4 py-3 border border-border rounded-md hover:bg-muted transition-colors text-sm font-medium text-foreground flex items-center justify-between"
          >
            Open DRHP Draft Workspace
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/projects/demo/review"
            className="px-4 py-3 border border-border rounded-md hover:bg-muted transition-colors text-sm font-medium text-foreground flex items-center justify-between"
          >
            Merchant banker review
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
