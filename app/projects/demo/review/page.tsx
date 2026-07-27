import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { drwhChapters } from '@/lib/mock-data';

export default function ReviewPage() {
  const readySections = drwhChapters.filter((ch) => ch.status === 'approved').length;
  const pendingSections = drwhChapters.filter((ch) => ch.status === 'pending-review').length;
  const blockingSections = drwhChapters.filter((ch) => ch.status === 'blocked').length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Merchant Banker Review"
        description="Filing readiness assessment and banker feedback"
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Merchant Banker Review' },
        ]}
      />

      {/* Filing Readiness */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">Filing Readiness Assessment</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="text-sm text-foreground">DRHP Draft Completion</span>
            <span className="font-medium text-foreground">42%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="text-sm text-foreground">Evidence Coverage</span>
            <span className="font-medium text-foreground">48%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="text-sm text-foreground">Open Issues</span>
            <span className="font-medium text-destructive">5</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="text-sm text-foreground">Blocking Issues</span>
            <span className="font-medium text-destructive">1</span>
          </div>
        </div>
      </div>

      {/* Blocking Issues */}
      {blockingSections > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
            <h3 className="font-semibold text-destructive">Critical Issues Blocking Filing</h3>
          </div>
          <p className="text-sm text-destructive/80">
            {blockingSections} section{blockingSections !== 1 ? 's' : ''} have critical issues that must be resolved.
          </p>
        </div>
      )}

      {/* Section Review Status */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Section Review Status</h3>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 size={18} className="text-success" />
            <span className="text-foreground">
              <span className="font-medium">{readySections}</span> sections approved
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <AlertTriangle size={18} className="text-warning" />
            <span className="text-foreground">
              <span className="font-medium">{pendingSections}</span> sections pending review
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <AlertTriangle size={18} className="text-destructive" />
            <span className="text-foreground">
              <span className="font-medium">{blockingSections}</span> section{blockingSections !== 1 ? 's' : ''} blocked
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-foreground">DRHP Section</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Evidence Coverage</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Open Gaps</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Issuer Status</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Banker Status</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {drwhChapters.map((section) => (
                  <tr key={section.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-foreground">{section.title}</td>
                    <td className="px-6 py-3">
                      <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">{Math.floor(Math.random() * 5)}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={section.status} size="sm" />
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status="in-progress" size="sm" />
                    </td>
                    <td className="px-6 py-3">
                      <button className="text-accent hover:opacity-80 font-medium text-xs">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Banker Comments */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Latest Banker Comments</h3>
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="font-medium text-foreground">Company Overview Section</span>
              <span className="text-xs text-muted-foreground">2 hours ago</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Please provide additional details on competitive positioning and market analysis.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="font-medium text-foreground">Financial Performance Section</span>
              <span className="text-xs text-muted-foreground">1 day ago</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Reconciliation of depreciation schedules approved. Awaiting FY2025 audit completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
