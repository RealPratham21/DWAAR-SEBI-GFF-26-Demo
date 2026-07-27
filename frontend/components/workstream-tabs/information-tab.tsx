import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { WorkstreamInformationField } from '@/lib/workstream-content';

interface InformationTabProps {
  fields: WorkstreamInformationField[];
}

export function InformationTab({ fields }: InformationTabProps) {
  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={index} className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">{field.label}</p>
              <p className="text-base font-semibold text-foreground">{field.value}</p>
            </div>
            <div className="flex items-center gap-2">
              {field.verified && (
                <div className="flex items-center gap-1 px-2 py-1 bg-success/10 rounded-md">
                  <CheckCircle2 size={16} className="text-success" />
                  <span className="text-xs font-medium text-success">Verified</span>
                </div>
              )}
              {field.conflict && (
                <div className="flex items-center gap-1 px-2 py-1 bg-warning/10 rounded-md" title={field.conflict}>
                  <AlertCircle size={16} className="text-warning" />
                  <span className="text-xs font-medium text-warning">Conflict</span>
                </div>
              )}
            </div>
          </div>
          {field.conflict && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              <span className="font-medium">Note:</span> {field.conflict}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
