import Link from 'next/link';
import { ArrowRight, AlertCircle } from 'lucide-react';
import type { Workstream } from '@/lib/types';
import { StatusBadge } from './status-badge';
import { ProgressBar } from './progress-bar';

interface WorkstreamCardProps {
  workstream: Workstream;
}

export function WorkstreamCard({ workstream }: WorkstreamCardProps) {
  return (
    <Link href={`/projects/demo/workstreams/${workstream.slug}`}>
      <div className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
              {workstream.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{workstream.description}</p>
          </div>
          <StatusBadge status={workstream.status} size="sm" />
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <ProgressBar
              value={workstream.completionPercentage}
              label="Completion"
              showLabel
              size="sm"
            />
          </div>
          <div>
            <ProgressBar
              value={workstream.evidenceCoverage}
              label="Evidence Coverage"
              showLabel
              size="sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{workstream.openIssuesCount} open issues</span>
          </div>
          <ArrowRight
            size={16}
            className="text-muted-foreground group-hover:text-accent transition-colors"
          />
        </div>

        {workstream.openIssuesCount > 0 && (
          <div className="mt-3 pt-3 border-t border-border flex items-start gap-2 text-xs text-destructive">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{workstream.openIssuesCount} issue{workstream.openIssuesCount !== 1 ? 's' : ''} to resolve</span>
          </div>
        )}
      </div>
    </Link>
  );
}
