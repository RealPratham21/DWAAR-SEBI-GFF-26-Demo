import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Workstream } from '@/lib/types';
import type { DashboardCompanyIncorporationProgress } from '@/lib/company-incorporation/types';

interface WorkstreamCardProps {
  workstream: Workstream;
  actionLabel?: 'Start Section' | 'Open Section' | 'Continue' | 'Information complete';
  companyIncorporationProgress?: DashboardCompanyIncorporationProgress;
}

function resolveActionLabel(
  defaultLabel: WorkstreamCardProps['actionLabel'],
  progress?: DashboardCompanyIncorporationProgress,
): string {
  if (!progress) {
    return defaultLabel ?? 'Start Section';
  }
  if (progress.overallStatus === 'complete') {
    return 'Information complete';
  }
  if (progress.overallStatus === 'in_progress') {
    return 'Continue';
  }
  return 'Not started';
}

export function WorkstreamCard({
  workstream,
  actionLabel = 'Start Section',
  companyIncorporationProgress,
}: WorkstreamCardProps) {
  const resolvedActionLabel = resolveActionLabel(actionLabel, companyIncorporationProgress);

  return (
    <Link href={`/projects/demo/workstreams/${workstream.slug}`} prefetch={false}>
      <div className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors cursor-pointer group h-full flex flex-col">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
            {workstream.sequence}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
              {workstream.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {workstream.description}
            </p>
            {companyIncorporationProgress ? (
              <p className="text-xs text-muted-foreground mt-2">
                Information: {companyIncorporationProgress.sectionsComplete} of{' '}
                {companyIncorporationProgress.totalSections} sections complete
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-end pt-4 border-t border-border">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-accent">
            {resolvedActionLabel}
            <ArrowRight
              size={16}
              className="text-muted-foreground group-hover:text-accent transition-colors"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
