'use client';

import { useState } from 'react';
import { ChevronRight, ZoomIn, ZoomOut, FileText, CheckCircle2, AlertCircle, Calculator, MessageSquare, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { drwhChapters } from '@/lib/mock-data';

export default function DRHPPreviewPage() {
  const [selectedChapter, setSelectedChapter] = useState(drwhChapters[0]);
  const [zoom, setZoom] = useState(100);
  const [evidenceTab, setEvidenceTab] = useState(0);

  const evidenceTabs = [
    { label: 'Evidence', icon: FileText },
    { label: 'Inputs', icon: CheckCircle2 },
    { label: 'Calculations', icon: Calculator },
    { label: 'Open Gaps', icon: AlertCircle },
    { label: 'Review', icon: BarChart3 },
    { label: 'Copilot', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="DRHP Preview"
        description="Review your complete DRHP document with evidence tracking"
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'DRHP Preview' },
        ]}
      />

      <div className="grid lg:grid-cols-5 gap-6 min-h-[700px]">
        {/* Chapter Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-4 sticky top-6 max-h-[700px] overflow-y-auto">
            <h3 className="font-semibold text-foreground mb-4 text-sm">Chapters</h3>
            <div className="space-y-1">
              {drwhChapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => setSelectedChapter(chapter)}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors font-medium ${
                    selectedChapter.id === chapter.id
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="leading-tight pr-2">{chapter.title}</span>
                    {selectedChapter.id === chapter.id && (
                      <ChevronRight size={14} className="flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Document Preview */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="text-sm font-medium text-muted-foreground w-12 text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn size={18} />
                </button>
              </div>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 transition-opacity">
                Download PDF
              </button>
            </div>

            {/* Document Content */}
            <div className="bg-card border border-border rounded-lg p-6 overflow-auto max-h-[600px]">
              <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
                <div className="w-[8.5in] bg-white text-black p-8 shadow-lg">
                  <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
                    <h1 className="text-2xl font-bold">DRAFT RED HERRING PROSPECTUS</h1>
                    <p className="text-sm mt-2 text-gray-600">
                      Aarohan Embedded Systems Limited
                    </p>
                  </div>

                  <h2 className="text-xl font-bold mt-8 mb-4">{selectedChapter.title}</h2>

                  <div className="space-y-4 text-sm text-gray-800">
                    <p>
                      This is a preview of the {selectedChapter.title.toLowerCase()} section containing{' '}
                      {selectedChapter.subsections} subsections.
                    </p>

                    <p>
                      Document Status: <span className="font-semibold">In Preparation</span>
                    </p>

                    <div className="mt-6 p-4 bg-gray-100 rounded">
                      <p className="font-semibold mb-2">Section Contents:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        {Array.from({ length: selectedChapter.subsections }).map((_, idx) => (
                          <li key={idx}>Subsection {idx + 1}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-12 pt-4 border-t border-gray-300 text-xs text-gray-600 text-center">
                    <p>This is a preliminary draft for internal review purposes only.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Pane */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full">
            {/* Tab Headers */}
            <div className="border-b border-border overflow-x-auto">
              <div className="flex gap-2 p-2">
                {evidenceTabs.map((tab, idx) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => setEvidenceTab(idx)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition-colors flex-shrink-0 ${
                        idx === evidenceTab
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title={tab.label}
                    >
                      <Icon size={14} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              {evidenceTab === 0 && (
                <div className="space-y-3">
                  <div className="p-3 bg-success/10 border border-success/20 rounded-lg flex items-start gap-3">
                    <FileText size={16} className="text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Certificate of Incorporation</p>
                      <p className="text-xs text-muted-foreground">Verified • 2.1 MB</p>
                    </div>
                  </div>
                  <div className="p-3 bg-success/10 border border-success/20 rounded-lg flex items-start gap-3">
                    <FileText size={16} className="text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Board Resolution</p>
                      <p className="text-xs text-muted-foreground">Verified • 0.9 MB</p>
                    </div>
                  </div>
                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-3">
                    <FileText size={16} className="text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">PAN Certificate</p>
                      <p className="text-xs text-muted-foreground">Pending • 0.3 MB</p>
                    </div>
                  </div>
                </div>
              )}

              {evidenceTab === 1 && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Company Information</p>
                    <p className="font-medium text-foreground">5 of 8 fields completed</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Financial Data</p>
                    <p className="font-medium text-foreground">3 years of audited statements</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Governance</p>
                    <p className="font-medium text-foreground">Board composition verified</p>
                  </div>
                </div>
              )}

              {evidenceTab === 2 && (
                <div className="space-y-3">
                  <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                    <p className="text-xs font-medium text-accent mb-1">Revenue Calculation</p>
                    <p className="font-medium text-foreground">₹61.50 Cr (FY2024)</p>
                    <p className="text-xs text-muted-foreground mt-1">Based on 3 business segments</p>
                  </div>
                  <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                    <p className="text-xs font-medium text-accent mb-1">Gross Margin</p>
                    <p className="font-medium text-foreground">42.3%</p>
                    <p className="text-xs text-muted-foreground mt-1">Consistent with industry peers</p>
                  </div>
                </div>
              )}

              {evidenceTab === 3 && (
                <div className="space-y-3">
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-xs font-medium text-destructive mb-1">Critical Gap</p>
                    <p className="font-medium text-foreground">₹0.80 Cr evidence missing</p>
                    <p className="text-xs text-muted-foreground mt-1">25% of objects not supported</p>
                  </div>
                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-xs font-medium text-warning mb-1">Pending Review</p>
                    <p className="font-medium text-foreground">2 related party transactions</p>
                    <p className="text-xs text-muted-foreground mt-1">Awaiting MBA approval</p>
                  </div>
                </div>
              )}

              {evidenceTab === 4 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-foreground">Completeness</span>
                    <span className="font-bold text-accent">72%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-foreground">Evidence Coverage</span>
                    <span className="font-bold text-success">68%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-foreground">Verification Status</span>
                    <span className="font-bold text-warning">4 pending</span>
                  </div>
                  <div className="p-3 bg-success/10 border border-success/20 rounded-lg mt-3">
                    <p className="text-xs font-medium text-success">Overall Ready: 68%</p>
                  </div>
                </div>
              )}

              {evidenceTab === 5 && (
                <div className="space-y-3">
                  <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                    <p className="text-xs font-medium text-accent mb-2">Ask Dwaar Copilot</p>
                    <p className="text-sm text-foreground mb-3">
                      Get context-aware suggestions to fill gaps and strengthen your DRHP disclosures.
                    </p>
                    <button className="w-full px-3 py-2 bg-accent text-accent-foreground rounded-md font-medium text-xs hover:opacity-90 transition-opacity">
                      Open Chat
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
