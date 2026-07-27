'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { facts } from '@/lib/mock-data';

export default function FactsPage() {
  const [selectedFact, setSelectedFact] = useState<string | null>(null);
  const currentFact = facts.find((f) => f.id === selectedFact);

  const getVerificationBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      verified: { bg: 'bg-success/10', text: 'text-success', label: 'Verified' },
      pending: { bg: 'bg-warning/10', text: 'text-warning', label: 'Pending' },
      unverified: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Unverified' },
      'pending-update': {
        bg: 'bg-warning/10',
        text: 'text-warning',
        label: 'Pending Update',
      },
    };
    const config = statusMap[status] || statusMap.unverified;
    return (
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Facts & Evidence"
        description="Manage key company facts and their evidence sources"
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Facts & Evidence' },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Facts List */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Fact</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Value</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {facts.map((fact) => (
                    <tr
                      key={fact.id}
                      onClick={() => setSelectedFact(fact.id)}
                      className={`border-b border-border cursor-pointer transition-colors ${
                        selectedFact === fact.id
                          ? 'bg-accent/10'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{fact.fact}</td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">
                        {fact.value}
                      </td>
                      <td className="px-4 py-3">
                        {getVerificationBadge(fact.verificationStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Fact Details Panel */}
        <div>
          {currentFact ? (
            <div className="bg-card border border-border rounded-lg p-6 sticky top-6">
              <h3 className="font-semibold text-foreground mb-4">{currentFact.fact}</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Value</p>
                  <p className="text-foreground font-medium">{currentFact.value}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Source</p>
                  <p className="text-foreground text-sm">{currentFact.source}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Verification Status
                  </p>
                  {getVerificationBadge(currentFact.verificationStatus)}
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Used in DRHP Sections
                  </p>
                  <div className="space-y-1">
                    {currentFact.drwhUses.map((use, idx) => (
                      <div key={idx} className="text-xs bg-muted/50 rounded px-2 py-1 text-foreground">
                        {use}
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full mt-4 px-3 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 transition-opacity">
                  View Evidence
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 text-center sticky top-6">
              <p className="text-muted-foreground">Select a fact to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
