import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { WorkstreamFact } from '@/lib/workstream-content';

interface FactsTabProps {
  facts: WorkstreamFact[];
}

export function FactsTab({ facts }: FactsTabProps) {
  return (
    <div className="space-y-4">
      {facts.map((fact) => (
        <div key={fact.id} className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h4 className="font-semibold text-foreground">{fact.title}</h4>
              <p className="text-lg font-bold text-accent mt-1">{fact.value}</p>
              <p className="text-xs text-muted-foreground mt-2">Source: {fact.source}</p>
            </div>
            {fact.verified ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-success/10 rounded-md flex-shrink-0">
                <CheckCircle2 size={16} className="text-success" />
                <span className="text-xs font-medium text-success">Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-warning/10 rounded-md flex-shrink-0">
                <AlertCircle size={16} className="text-warning" />
                <span className="text-xs font-medium text-warning">Unverified</span>
              </div>
            )}
          </div>

          {fact.conflict && (
            <div className="mt-3 pt-3 border-t border-border bg-destructive/5 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive text-sm">Conflicting Information Found</p>
                  <p className="text-xs text-destructive mt-1">
                    <span className="font-medium">Conflicting Value:</span> {fact.conflict.conflictingValue}
                  </p>
                  <p className="text-xs text-destructive mt-1">
                    <span className="font-medium">Source:</span> {fact.conflict.conflictingSource}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
