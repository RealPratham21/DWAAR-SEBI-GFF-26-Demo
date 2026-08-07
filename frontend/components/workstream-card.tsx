import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Workstream } from '@/lib/types';
import type { DashboardCompanyIncorporationProgress } from '@/lib/company-incorporation/types';
import type { DashboardBusinessOperationsProgress } from '@/lib/business-operations/api-types';
import type { DashboardObjectsIssueProgress } from '@/lib/objects-of-issue/api-types';
import type { DashboardFinancialsKpisProgress } from '@/lib/financials-kpis/api-types';
import type { DashboardManagementGovernanceProgress } from '@/lib/management-governance/api-types';

type WorkstreamProgressSummary = {
  overallStatus: 'not_started' | 'in_progress' | 'complete';
  sectionsComplete: number;
  totalSections: number;
};

interface WorkstreamCardProps {
  workstream: Workstream;
  actionLabel?: 'Start Section' | 'Open Section' | 'Continue' | 'Information complete';
  companyIncorporationProgress?: DashboardCompanyIncorporationProgress;
  businessOperationsProgress?: DashboardBusinessOperationsProgress;
  objectsOfIssueProgress?: DashboardObjectsIssueProgress;
  financialsKpisProgress?: DashboardFinancialsKpisProgress;
  managementGovernanceProgress?: DashboardManagementGovernanceProgress;
}

function resolveActionLabel(
  defaultLabel: WorkstreamCardProps['actionLabel'],
  progress?: WorkstreamProgressSummary,
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
  businessOperationsProgress,
  objectsOfIssueProgress,
  financialsKpisProgress,
  managementGovernanceProgress,
}: WorkstreamCardProps) {
  const progress =
    companyIncorporationProgress ??
    businessOperationsProgress ??
    objectsOfIssueProgress ??
    financialsKpisProgress ??
    managementGovernanceProgress;
  const resolvedActionLabel = resolveActionLabel(actionLabel, progress);

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
            {progress ? (
              <p className="text-xs text-muted-foreground mt-2">
                Information: {progress.sectionsComplete} of {progress.totalSections} sections
                complete
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
