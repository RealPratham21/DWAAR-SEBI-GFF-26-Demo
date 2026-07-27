import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { WorkstreamDisclosure } from '@/lib/workstream-content';

interface DisclosuresTabProps {
  disclosures: WorkstreamDisclosure[];
}

export function DisclosuresTab({ disclosures }: DisclosuresTabProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 size={18} className="text-success" />;
      case 'pending-review':
        return <Clock size={18} className="text-warning" />;
      case 'requires-revision':
        return <AlertCircle size={18} className="text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/5 border-success/20';
      case 'pending-review':
        return 'bg-warning/5 border-warning/20';
      case 'requires-revision':
        return 'bg-destructive/5 border-destructive/20';
      default:
        return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending-review':
        return 'Pending Review';
      case 'requires-revision':
        return 'Requires Revision';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {disclosures.map((disclosure) => (
        <div key={disclosure.id} className={`border border-border rounded-lg p-4 ${getStatusBg(disclosure.status)}`}>
          <div className="flex items-start gap-3 mb-3">
            {getStatusIcon(disclosure.status)}
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">{disclosure.section}</h4>
              <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-md ${
                disclosure.status === 'approved'
                  ? 'bg-success/10 text-success'
                  : disclosure.status === 'pending-review'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-destructive/10 text-destructive'
              }`}>
                {getStatusLabel(disclosure.status)}
              </span>
            </div>
          </div>
          <div className="bg-background rounded p-3 text-sm text-foreground leading-relaxed mb-3">
            {disclosure.content}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Source:</span> {disclosure.source}
          </p>
        </div>
      ))}
    </div>
  );
}
