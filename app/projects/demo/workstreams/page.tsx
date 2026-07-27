import { PageHeader } from '@/components/page-header';
import { WorkstreamCard } from '@/components/workstream-card';
import { workstreams } from '@/lib/mock-data';
import type { DRHPPhase } from '@/lib/types';

const PHASE_INFO: Record<DRHPPhase, { title: string; description: string; color: string }> = {
  'establish': {
    title: '1. Establish Objectives',
    description: 'Define the IPO purpose and structure',
    color: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  },
  'core-disclosures': {
    title: '2. Core Disclosures',
    description: 'Provide comprehensive company information',
    color: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
  },
  'due-diligence': {
    title: '3. Due Diligence',
    description: 'Conduct legal and compliance verification',
    color: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
  },
  'filing': {
    title: '4. Filing & Final Review',
    description: 'Prepare final DRHP documentation',
    color: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  },
};

export default function WorkstreamsOverviewPage() {
  const phases: DRHPPhase[] = ['establish', 'core-disclosures', 'due-diligence', 'filing'];

  // Calculate phase metrics
  const getPhaseMetrics = (phase: DRHPPhase) => {
    const phaseWorkstreams = workstreams.filter((ws) => ws.phase === phase);
    const completedCount = phaseWorkstreams.filter((ws) => ws.status === 'approved').length;
    const inProgressCount = phaseWorkstreams.filter((ws) => ws.status === 'in-progress').length;
    const avgCompletion = phaseWorkstreams.length > 0
      ? Math.round(phaseWorkstreams.reduce((sum, ws) => sum + ws.completionPercentage, 0) / phaseWorkstreams.length)
      : 0;

    return { completed: completedCount, inProgress: inProgressCount, avgCompletion };
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="DRHP Preparation Phases"
        description="Track progress across 4 phases with 12 workstreams"
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'DRHP Phases' },
        ]}
      />

      {/* Phase Tabs / Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {phases.map((phase) => {
          const metrics = getPhaseMetrics(phase);
          const info = PHASE_INFO[phase];
          return (
            <div key={phase} className={`${info.color} border rounded-lg p-4 transition-all hover:shadow-md`}>
              <h3 className="font-semibold text-foreground text-sm">{info.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-3">{info.description}</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Progress:</span>
                  <span className="font-semibold text-foreground">{metrics.avgCompletion}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Workstreams:</span>
                  <span className="font-semibold text-foreground">{workstreams.filter((ws) => ws.phase === phase).length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Phase Sections */}
      {phases.map((phase) => {
        const phaseWorkstreams = workstreams.filter((ws) => ws.phase === phase);
        const info = PHASE_INFO[phase];

        return (
          <div key={phase} className={`border rounded-lg p-6 ${info.color}`}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">{info.title}</h2>
              <p className="text-muted-foreground mt-2">{info.description}</p>
            </div>

            {/* Workstream Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {phaseWorkstreams.map((ws) => (
                <WorkstreamCard key={ws.id} workstream={ws} />
              ))}
            </div>

            {phaseWorkstreams.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No workstreams in this phase</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
