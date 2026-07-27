import Link from 'next/link';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { MetricCard } from '@/components/metric-card';
import { WorkstreamCard } from '@/components/workstream-card';
import { dashboardMetrics, workstreams, actionItems, issues } from '@/lib/mock-data';

export default function DashboardPage() {
  const blockingIssues = issues.filter((i) => i.severity === 'critical');
  const topActions = actionItems.slice(0, 4);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Get an overview of your DRHP preparation progress and next steps"
      />

      {/* Metrics Section */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Readiness Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label={dashboardMetrics.drwhReadiness.label}
            value={dashboardMetrics.drwhReadiness.value}
            description={dashboardMetrics.drwhReadiness.description}
          />
          <MetricCard
            label={dashboardMetrics.informationCompleteness.label}
            value={dashboardMetrics.informationCompleteness.value}
            description={dashboardMetrics.informationCompleteness.description}
          />
          <MetricCard
            label={dashboardMetrics.evidenceCoverage.label}
            value={dashboardMetrics.evidenceCoverage.value}
            description={dashboardMetrics.evidenceCoverage.description}
          />
          <MetricCard
            label={dashboardMetrics.sectionsReady.label}
            value={dashboardMetrics.sectionsReady.value}
            max={dashboardMetrics.sectionsReady.max}
            description={dashboardMetrics.sectionsReady.description}
          />
        </div>
      </div>

      {/* Alerts */}
      {blockingIssues.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">Blocking Issues</h3>
            <p className="text-sm text-destructive/80 mt-1">
              {blockingIssues.length} critical issue{blockingIssues.length !== 1 ? 's' : ''} must be resolved before DRHP filing.
            </p>
            <Link
              href="/projects/demo/gaps"
              className="text-sm text-destructive font-medium hover:opacity-80 mt-2 inline-flex items-center gap-1"
            >
              Review Issues
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recommended Next Steps</h2>
          <Link
            href="/projects/demo/gaps"
            className="text-sm text-accent hover:opacity-80 font-medium"
          >
            View All
          </Link>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="divide-y divide-border">
            {topActions.map((action) => (
              <div key={action.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{action.workstream}</p>
                </div>
                <div className="text-xs font-medium text-muted-foreground whitespace-nowrap ml-4">
                  {action.dueDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DRHP Workstreams */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workstreams.slice(0, 6).map((ws) => (
            <WorkstreamCard key={ws.id} workstream={ws} />
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            href="/projects/demo/data-room"
            className="px-4 py-3 border border-border rounded-md hover:bg-muted transition-colors text-sm font-medium text-foreground flex items-center justify-between"
          >
            Upload Documents
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/projects/demo/facts"
            className="px-4 py-3 border border-border rounded-md hover:bg-muted transition-colors text-sm font-medium text-foreground flex items-center justify-between"
          >
            Add Company Facts
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/projects/demo/drhp"
            className="px-4 py-3 border border-border rounded-md hover:bg-muted transition-colors text-sm font-medium text-foreground flex items-center justify-between"
          >
            Preview DRHP
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/projects/demo/review"
            className="px-4 py-3 border border-border rounded-md hover:bg-muted transition-colors text-sm font-medium text-foreground flex items-center justify-between"
          >
            Merchant Banker Review
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
