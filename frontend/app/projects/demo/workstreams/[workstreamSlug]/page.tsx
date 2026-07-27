import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { CompanyIncorporationWorkstream } from '@/components/company-incorporation/company-incorporation-workstream';
import { getWorkstreamBySlug } from '@/lib/workstreams-config';

interface WorkstreamDetailPageProps {
  params: Promise<{
    workstreamSlug: string;
  }>;
}

export default async function WorkstreamDetailPage({
  params,
}: WorkstreamDetailPageProps) {
  const { workstreamSlug } = await params;
  const workstream = getWorkstreamBySlug(workstreamSlug);

  if (!workstream) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Workstream not found</p>
        <Link
          href="/projects/demo/workstreams"
          className="inline-flex items-center gap-2 mt-4 text-sm text-accent font-medium hover:opacity-80"
        >
          <ArrowLeft size={16} />
          Back to DRHP Phases
        </Link>
      </div>
    );
  }

  if (workstream.slug === 'company-incorporation') {
    return <CompanyIncorporationWorkstream workstream={workstream} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={workstream.title}
        description={workstream.description}
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'DRHP Preparation', href: '/projects/demo/workstreams' },
          { label: workstream.title },
        ]}
      />

      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Workstream {workstream.sequence} of 12. Detailed section content, forms, and document
          workflows will be added here in a later release.
        </p>
      </div>
    </div>
  );
}
