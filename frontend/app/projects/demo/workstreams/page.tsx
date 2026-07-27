import { PageHeader } from '@/components/page-header';
import { WorkstreamCard } from '@/components/workstream-card';
import { DRHP_PHASES, getWorkstreamsByPhase } from '@/lib/workstreams-config';

export default function WorkstreamsOverviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="DRHP Preparation Phases"
        description="12 workstreams organised across 4 DRHP preparation phases"
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'DRHP Phases' },
        ]}
      />

      {/* Phase Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DRHP_PHASES.map((phase) => (
          <div
            key={phase.id}
            className={`${phase.color} border rounded-lg p-4 transition-all hover:shadow-md`}
          >
            <h3 className="font-semibold text-foreground text-sm">{phase.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
          </div>
        ))}
      </div>

      {/* Phase Sections */}
      {DRHP_PHASES.map((phase) => {
        const phaseWorkstreams = getWorkstreamsByPhase(phase.id);

        return (
          <div key={phase.id} className={`border rounded-lg p-6 ${phase.color}`}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">{phase.title}</h2>
              <p className="text-muted-foreground mt-2">{phase.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {phaseWorkstreams.map((workstream) => (
                <WorkstreamCard key={workstream.slug} workstream={workstream} />
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
