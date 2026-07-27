'use client';

import { useState } from 'react';
import { ChevronDown, AlertCircle, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { issues } from '@/lib/mock-data';

type SeverityType = 'critical' | 'high' | 'medium' | 'low';

const severityConfig: Record<SeverityType, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Critical' },
  high: { bg: 'bg-destructive/5', text: 'text-destructive', label: 'High' },
  medium: { bg: 'bg-warning/10', text: 'text-warning', label: 'Medium' },
  low: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Low' },
};

export default function GapsPage() {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const critical = issues.filter((i) => i.severity === 'critical');
  const high = issues.filter((i) => i.severity === 'high');
  const medium = issues.filter((i) => i.severity === 'medium');

  const IssueItem = ({ issue }: { issue: typeof issues[0] }) => {
    const severity = severityConfig[issue.severity];
    const isExpanded = expandedIssue === issue.id;

    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start gap-4 flex-1 text-left">
            <AlertCircle size={20} className={`flex-shrink-0 mt-0.5 ${severity.text}`} />
            <div className="flex-1">
              <p className="font-medium text-foreground">{issue.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{issue.workstream}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${severity.bg} ${severity.text}`}>
              {severity.label}
            </span>
            <ChevronDown
              size={20}
              className={`flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {isExpanded && (
          <div className="border-t border-border px-6 py-4 bg-muted/30">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Status</p>
                <StatusBadge status={issue.status} />
              </div>

              {issue.evidence && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Details
                  </p>
                  <p className="text-sm text-foreground">{issue.evidence}</p>
                </div>
              )}

              {issue.relatedFacts && issue.relatedFacts.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Related Facts
                  </p>
                  <div className="space-y-1">
                    {issue.relatedFacts.map((fact, idx) => (
                      <div key={idx} className="text-xs bg-background rounded px-2 py-1 text-foreground">
                        {fact}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 transition-opacity">
                    Resolve
                  </button>
                  <button className="flex-1 px-3 py-2 border border-border text-foreground rounded-md font-medium text-sm hover:bg-muted transition-colors">
                    Learn More
                  </button>
                </div>
                <button className="w-full px-3 py-2 bg-accent/10 border border-accent/20 text-accent rounded-md font-medium text-sm hover:bg-accent/20 transition-colors inline-flex items-center justify-center gap-2">
                  <Sparkles size={16} />
                  Ask Dwaar for Help
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Issues & Gaps"
        description="Track and resolve issues preventing DRHP readiness"
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Issues & Gaps' },
        ]}
      />

      {/* Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-xs font-medium text-destructive uppercase">Critical</p>
          <p className="text-2xl font-bold text-destructive mt-2">{critical.length}</p>
        </div>
        <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-4">
          <p className="text-xs font-medium text-destructive uppercase">High</p>
          <p className="text-2xl font-bold text-destructive mt-2">{high.length}</p>
        </div>
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <p className="text-xs font-medium text-warning uppercase">Medium</p>
          <p className="text-2xl font-bold text-warning mt-2">{medium.length}</p>
        </div>
        <div className="bg-muted border border-border rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Total</p>
          <p className="text-2xl font-bold text-foreground mt-2">{issues.length}</p>
        </div>
      </div>

      {/* Critical Issues */}
      {critical.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Critical Issues ({critical.length})</h2>
          <div className="space-y-3">
            {critical.map((issue) => (
              <IssueItem key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* High Issues */}
      {high.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">High Priority Issues ({high.length})</h2>
          <div className="space-y-3">
            {high.map((issue) => (
              <IssueItem key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Issues */}
      {medium.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Medium Priority Issues ({medium.length})</h2>
          <div className="space-y-3">
            {medium.map((issue) => (
              <IssueItem key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
