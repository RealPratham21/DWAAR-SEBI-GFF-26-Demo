import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { BusinessOperationsWorkstream } from '@/components/business-operations/business-operations-workstream';
import { CapitalOwnershipWorkstream } from '@/components/capital-ownership/capital-ownership-workstream';
import { CompanyIncorporationWorkstream } from '@/components/company-incorporation/company-incorporation-workstream';
import { IpoSetupEligibilityWorkstream } from '@/components/ipo-setup/ipo-setup-workstream';
import { FinancialsKpisWorkstream } from '@/components/financials-kpis/financials-kpis-workstream';
import { IndustryMarketWorkstream } from '@/components/industry-market/industry-market-workstream';
import { GroupEntitiesRelatedPartiesWorkstream } from '@/components/group-entities-related-parties/group-entities-workstream';
import { ManagementGovernanceWorkstream } from '@/components/management-governance/management-governance-workstream';
import { ObjectsOfIssueWorkstream } from '@/components/objects-of-issue/objects-of-issue-workstream';
import { getWorkstreamBySlug } from '@/lib/workstreams-config';

interface WorkstreamDetailPageProps {
  params: Promise<{
    workstreamSlug: string;
  }>;
  searchParams: Promise<{
    tab?: string;
    section?: string;
    assertionId?: string;
    issueId?: string;
    documentVersionId?: string;
  }>;
}

export default async function WorkstreamDetailPage({
  params,
  searchParams,
}: WorkstreamDetailPageProps) {
  const { workstreamSlug } = await params;
  const { tab, section, assertionId, issueId, documentVersionId } = await searchParams;
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
    return (
      <Suspense
        fallback={
          <div className="py-8 text-sm text-muted-foreground" aria-live="polite">
            Loading Company & Incorporation…
          </div>
        }
      >
        <CompanyIncorporationWorkstream
          workstream={workstream}
          initialTab={tab}
          initialSection={section}
          initialAssertionId={assertionId}
          initialIssueId={issueId}
          initialDocumentVersionId={documentVersionId}
        />
      </Suspense>
    );
  }

  if (workstream.slug === 'ipo-setup-eligibility') {
    return (
      <Suspense
        fallback={
          <div className="py-8 text-sm text-muted-foreground" aria-live="polite">
            Loading IPO Setup & Eligibility…
          </div>
        }
      >
        <IpoSetupEligibilityWorkstream
          workstream={workstream}
          initialTab={tab}
          initialSection={section}
        />
      </Suspense>
    );
  }

  if (workstream.slug === 'capital-ownership') {
    return (
      <Suspense
        fallback={
          <div className="py-8 text-sm text-muted-foreground" aria-live="polite">
            Loading Capital & Ownership…
          </div>
        }
      >
        <CapitalOwnershipWorkstream
          workstream={workstream}
          initialTab={tab}
          initialSection={section}
        />
      </Suspense>
    );
  }

  if (workstream.slug === 'business-operations') {
    return (
      <Suspense
        fallback={
          <div className="py-8 text-sm text-muted-foreground" aria-live="polite">
            Loading Business & Operations…
          </div>
        }
      >
        <BusinessOperationsWorkstream
          workstream={workstream}
          initialTab={tab}
          initialSection={section}
        />
      </Suspense>
    );
  }

  if (workstream.slug === 'financials-kpis') {
    return (
      <Suspense
        fallback={
          <div className="py-8 text-sm text-muted-foreground" aria-live="polite">
            Loading Financials & KPIs…
          </div>
        }
      >
        <FinancialsKpisWorkstream
          workstream={workstream}
          initialTab={tab}
          initialSection={section}
        />
      </Suspense>
    );
  }

  if (workstream.slug === 'management-governance') {
    return (
      <Suspense
        fallback={
          <div className="py-8 text-sm text-muted-foreground" aria-live="polite">
            Loading Management & Governance…
          </div>
        }
      >
        <ManagementGovernanceWorkstream
          workstream={workstream}
          initialTab={tab}
          initialSection={section}
        />
      </Suspense>
    );
  }

  if (workstream.slug === 'objects-of-issue') {
    return (
      <Suspense
        fallback={
          <div className="py-8 text-sm text-muted-foreground" aria-live="polite">
            Loading Objects of the Issue…
          </div>
        }
      >
        <ObjectsOfIssueWorkstream workstream={workstream} initialTab={tab} initialSection={section} />
      </Suspense>
    );
  }

  if (workstream.slug === 'industry-market') {
    return (
      <Suspense
        fallback={
          <div className="py-8 text-sm text-muted-foreground" aria-live="polite">
            Loading Industry & Market…
          </div>
        }
      >
        <IndustryMarketWorkstream
          workstream={workstream}
          initialTab={tab}
          initialSection={section}
        />
      </Suspense>
    );
  }

  if (workstream.slug === 'group-entities-related-parties') {
    return (
      <Suspense
        fallback={
          <div className="py-8 text-sm text-muted-foreground" aria-live="polite">
            Loading Group Entities & Related Parties…
          </div>
        }
      >
        <GroupEntitiesRelatedPartiesWorkstream
          workstream={workstream}
          initialTab={tab}
          initialSection={section}
        />
      </Suspense>
    );
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
