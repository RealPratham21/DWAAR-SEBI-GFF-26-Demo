import { Download, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { WorkstreamDocument } from '@/lib/workstream-content';

interface DocumentsTabProps {
  documents: WorkstreamDocument[];
}

export function DocumentsTab({ documents }: DocumentsTabProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 size={18} className="text-success" />;
      case 'pending':
        return <Clock size={18} className="text-warning" />;
      case 'flagged':
        return <AlertCircle size={18} className="text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-success/10';
      case 'pending':
        return 'bg-warning/10';
      case 'flagged':
        return 'bg-destructive/10';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div key={doc.id} className={`border border-border rounded-lg p-4 ${getStatusBg(doc.status)}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                {getStatusIcon(doc.status)}
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-foreground truncate">{doc.name}</h4>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{doc.category}</span>
                    <span>{doc.size}</span>
                    <span>{doc.uploadDate}</span>
                  </div>
                  {doc.crossRef && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="font-medium">Cross-ref:</span> {doc.crossRef}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <button className="flex-shrink-0 p-2 hover:bg-background rounded-md transition-colors">
              <Download size={18} className="text-accent" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
