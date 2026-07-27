'use client';

import { useState } from 'react';
import { AlertTriangle, BookOpen, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { ProgressBar } from '@/components/progress-bar';
import { StatusBadge } from '@/components/status-badge';
import { workstreams } from '@/lib/mock-data';
import { WORKSTREAM_GUIDANCE } from '@/lib/workstream-guidance';
import { getWorkstreamContent } from '@/lib/workstream-content';
import { InformationTab } from '@/components/workstream-tabs/information-tab';
import { DocumentsTab } from '@/components/workstream-tabs/documents-tab';
import { QuestionsTab } from '@/components/workstream-tabs/questions-tab';
import { FactsTab } from '@/components/workstream-tabs/facts-tab';
import { DisclosuresTab } from '@/components/workstream-tabs/disclosures-tab';

interface WorkstreamDetailPageProps {
  params: Promise<{
    workstreamSlug: string;
  }>;
}

export default function WorkstreamDetailPage({
  params,
}: WorkstreamDetailPageProps) {
  const [activeTab, setActiveTab] = useState(0);
  const resolvedParams = params instanceof Promise ? { workstreamSlug: 'company-overview' } : params;
  const workstreamSlug = resolvedParams.workstreamSlug;

  const workstream = workstreams.find((ws) => ws.slug === workstreamSlug);
  const content = getWorkstreamContent(workstreamSlug);
  const guidance = WORKSTREAM_GUIDANCE[workstreamSlug];

  if (!workstream) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Workstream not found</p>
      </div>
    );
  }

  const tabs = [
    { label: 'Overview', id: 'overview' },
    { label: 'Information', id: 'information' },
    { label: 'Documents', id: 'documents' },
    { label: 'Questions', id: 'questions' },
    { label: 'Extracted Facts', id: 'facts' },
    { label: 'Generated Disclosures', id: 'disclosures' },
  ];

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

      {/* Status and Progress */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
          <StatusBadge status={workstream.status} />
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <ProgressBar
            value={workstream.completionPercentage}
            label="Completion"
            showLabel
          />
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Open Issues</p>
          <p className="text-2xl font-bold text-foreground">{workstream.openIssuesCount}</p>
        </div>
      </div>

      {/* Warning */}
      {workstream.openIssuesCount > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-warning">Evidence Gaps Detected</h3>
            <p className="text-sm text-warning/80 mt-1">
              {workstream.openIssuesCount} issue{workstream.openIssuesCount !== 1 ? 's' : ''} require attention before this section can be marked complete.
            </p>
          </div>
        </div>
      )}

      {/* Guidance Box */}
      {guidance && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={20} className="text-accent" />
              <h3 className="font-semibold text-foreground">Key Requirements</h3>
            </div>
            <ul className="space-y-2">
              {guidance.keyRequirements.map((req, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-foreground">
                  <span className="text-accent font-bold">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={20} className="text-warning" />
              <h3 className="font-semibold text-foreground">Common Issues</h3>
            </div>
            <ul className="space-y-2">
              {guidance.commonIssues.map((issue, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-foreground">
                  <span className="text-warning font-bold">!</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Estimated Effort</p>
              <p className="text-sm font-semibold text-foreground">{guidance.estimatedTime}</p>
            </div>
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">SEBI Reference</p>
              <p className="text-sm font-semibold text-foreground">{guidance.sebiReference}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Related Workstreams</p>
              <div className="space-y-1">
                {guidance.relatedWorkstreams.slice(0, 2).map((ws, idx) => (
                  <p key={idx} className="text-sm text-accent font-medium">{ws}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-3 border-b-2 whitespace-nowrap font-medium text-sm transition-colors ${
                idx === activeTab
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 0 && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">About This Section</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {workstream.title} is a critical component of your DRHP. This section contains details that
                investors and regulators need to understand your company and the IPO rationale. Ensure
                all information is accurate, complete, and well-supported by evidence.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Evidence Coverage
                  </p>
                  <ProgressBar
                    value={workstream.evidenceCoverage}
                    label="Coverage"
                    showLabel
                    size="lg"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Completion Progress
                  </p>
                  <ProgressBar
                    value={workstream.completionPercentage}
                    label="Progress"
                    showLabel
                    size="lg"
                  />
                </div>
              </div>
            </div>

            {workstream.subsections && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">Subsections</h3>
                <div className="space-y-2">
                  {workstream.subsections.map((subsection, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                    >
                      <span className="text-sm text-foreground">{subsection}</span>
                      <div className="w-12 h-1 bg-muted rounded-full">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 1 && content && (
          <InformationTab fields={content.information} />
        )}

        {activeTab === 2 && content && (
          <DocumentsTab documents={content.documents} />
        )}

        {activeTab === 3 && content && (
          <QuestionsTab questions={content.questions} />
        )}

        {activeTab === 4 && content && (
          <FactsTab facts={content.facts} />
        )}

        {activeTab === 5 && content && (
          <DisclosuresTab disclosures={content.disclosures} />
        )}
      </div>

      {/* Ask Dwaar CTA */}
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles size={20} className="text-accent" />
          <h3 className="font-semibold text-foreground">Need Guidance?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Click the Dwaar Copilot button to ask questions specific to this workstream or get recommendations.
        </p>
        <button className="inline-flex items-center gap-2 px-6 py-2 bg-accent text-accent-foreground rounded-md font-medium hover:opacity-90 transition-opacity">
          <Sparkles size={16} />
          Ask Dwaar Copilot
        </button>
      </div>
    </div>
  );
}
