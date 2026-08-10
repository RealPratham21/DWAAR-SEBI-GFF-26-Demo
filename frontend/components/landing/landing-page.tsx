import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CopyButton } from '@/components/landing/copy-button';
import { LandingEventLogoStrip } from '@/components/landing/landing-event-logo-strip';
import {
  LandingDashboardLink,
  LandingDemoLink,
  LandingNav,
} from '@/components/landing/landing-nav';
import {
  DrhpWorkspacePreview,
  FactsIssuesPreview,
  HeroDashboardPreview,
  TraceabilityChain,
} from '@/components/landing/product-previews';
import { SME_REGISTER_ROUTE } from '@/lib/auth/constants';
import { NIVARA_DEMO } from '@/lib/demo/constants';

const WORKFLOW_BEFORE = [
  'Documents',
  'spreadsheets',
  'email threads',
  'repeated information requests',
  'manual reconciliation',
  'drafting',
];

const WORKFLOW_DWAAR = ['Collect', 'Structure', 'Validate', 'Trace', 'Draft', 'Review'];

const PLATFORM_GROUPS = [
  {
    title: 'Structured Preparation',
    description:
      '12 IPO preparation workstreams covering company, capital, business, financial, governance, industry, legal, issue and filing information.',
  },
  {
    title: 'Facts & Evidence',
    description:
      'A canonical view of what Dwaar knows, where it came from, and whether documentary evidence exists.',
  },
  {
    title: 'Issues & Gaps',
    description:
      'Cross-workstream inconsistencies, missing information, evidence gaps, and professional-review items in one place.',
  },
  {
    title: 'Data Room',
    description: 'Central inventory of uploaded and expected due-diligence documents.',
  },
  {
    title: 'DRHP Workspace',
    description:
      'Generate a chapter-structured draft with persisted versions and source-level traceability.',
  },
  {
    title: 'Reports & Exports',
    description: 'Download DRHP PDF/DOCX plus preparation registers and structured reports.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Capture',
    description: 'Guided information collection across 12 workstreams.',
  },
  {
    step: '02',
    title: 'Organise',
    description: 'Normalise issuer facts, records and documents.',
  },
  {
    step: '03',
    title: 'Check',
    description: 'Identify missing information, inconsistencies and review requirements.',
  },
  {
    step: '04',
    title: 'Trace',
    description:
      'Connect disclosures to structured sources and documentary evidence where available.',
  },
  {
    step: '05',
    title: 'Generate',
    description: 'Create a coherent chapter-based draft DRHP.',
  },
  {
    step: '06',
    title: 'Review',
    description:
      'Hand the draft and preparation context to authorised professionals for due diligence and certification.',
  },
];

const PRODUCT_SURFACES = [
  {
    title: 'Preparation command centre',
    caption: 'Know what needs attention.',
    preview: <HeroDashboardPreview />,
  },
  {
    title: 'DRHP Draft Workspace',
    caption: 'Move from structured inputs to a downloadable draft.',
    preview: <DrhpWorkspacePreview />,
  },
  {
    title: 'Issues & Gaps',
    caption: 'Trace a disclosure back to its source.',
    preview: <FactsIssuesPreview />,
  },
];

function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent">{children}</p>
  );
}

export function LandingPage() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />

      {/* Hero */}
      <section className="border-b border-border bg-[oklch(0.99_0.005_280)]">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <SectionEyebrow>SEBI Securities Market TechSprint @ GFF 2026</SectionEyebrow>
            <LandingEventLogoStrip />
            <h1 className="max-w-xl text-4xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-5xl">
              From company information to a review-ready DRHP.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Dwaar gives SME promoters a structured path to organise IPO disclosures, surface gaps,
              connect evidence, and prepare a traceable draft offer document for professional review.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LandingDemoLink className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Explore Nivara Demo
                <ArrowRight size={16} />
              </LandingDemoLink>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                How Dwaar Works
              </a>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Built by Prathamesh Bhamare · Team Stay24
            </p>
          </div>
          <div className="lg:pl-4" aria-hidden="false">
            <HeroDashboardPreview />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="why" className="scroll-mt-20 border-b border-border py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionEyebrow>Why Dwaar</SectionEyebrow>
          <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            The first mile of an SME IPO is still painfully manual.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Time',
                body: 'Repeated information gathering, reconciliation and drafting.',
              },
              {
                title: 'Cost',
                body: 'Specialist involvement begins very early, before information is even organised.',
              },
              {
                title: 'Complexity',
                body: 'Corporate, financial, operational, legal and offer disclosures must eventually become one coherent document.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/30"
              >
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-3xl text-base leading-relaxed text-muted-foreground">
            What if promoters could organise the first draft properly before handing it over for
            professional due diligence?
          </p>
        </div>
      </section>

      {/* Before → Dwaar */}
      <section className="border-b border-border bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionEyebrow>Workflow</SectionEyebrow>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            From scattered inputs to a structured preparation path.
          </h2>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Before
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {WORKFLOW_BEFORE.map((step, i) => (
                  <span key={step} className="inline-flex items-center gap-2">
                    {i > 0 && <span className="text-border">→</span>}
                    <span className="rounded-md border border-border bg-background px-2.5 py-1">
                      {step}
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-accent/20 bg-card p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">With Dwaar</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                {WORKFLOW_DWAAR.map((step, i) => (
                  <span key={step} className="inline-flex items-center gap-2">
                    {i > 0 && <span className="text-muted-foreground">→</span>}
                    <span
                      className={`rounded-md border px-2.5 py-1 ${
                        step === 'Review'
                          ? 'border-primary/30 bg-primary/5 font-medium text-primary'
                          : 'border-border bg-background text-foreground'
                      }`}
                    >
                      {step}
                    </span>
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Professional review, certification and filing remain with authorised intermediaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform */}
      <section id="platform" className="scroll-mt-20 border-b border-border py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionEyebrow>Platform</SectionEyebrow>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            One workspace for disclosure preparation.
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_GROUPS.map((group) => (
              <div
                key={group.title}
                className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent/25"
              >
                <h3 className="text-base font-semibold text-foreground">{group.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {group.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Traceability */}
      <section className="border-b border-border bg-[oklch(0.99_0.005_280)] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionEyebrow>Traceability</SectionEyebrow>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                A draft is only useful if you can trace where it came from.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Dwaar retains provenance through source and evidence references so generated
                disclosures can be inspected instead of becoming opaque output. Calculations and
                structured inputs remain distinguishable from narrative generation.
              </p>
            </div>
            <TraceabilityChain />
          </div>
        </div>
      </section>

      {/* Product surfaces */}
      <section className="border-b border-border py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionEyebrow>Product</SectionEyebrow>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">See the workspace in action.</h2>
          <div className="mt-12 space-y-16">
            {PRODUCT_SURFACES.map((surface, index) => (
              <div
                key={surface.title}
                className={`grid items-center gap-8 lg:grid-cols-2 ${
                  index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{surface.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{surface.caption}</p>
                </div>
                <div>{surface.preview}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-b border-border bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionEyebrow>Process</SectionEyebrow>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How Dwaar works</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl border border-border bg-card p-5"
              >
                <span className="text-xs font-bold text-accent">{item.step}</span>
                <h3 className="mt-2 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nivara demo */}
      <section id="demo" className="scroll-mt-20 border-b border-border py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-2xl border border-accent/25 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 sm:p-10">
            <SectionEyebrow>Demo</SectionEyebrow>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Try the complete flow with Nivara.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {NIVARA_DEMO.issuerName} is a pre-filled demonstration issuer so reviewers can explore
              the complete product without manually completing the extensive IPO-preparation
              questionnaire.
            </p>

            <div className="mt-8 max-w-md rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Demo credentials
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="flex items-center gap-2 font-mono text-foreground">
                    <span className="break-all">{NIVARA_DEMO.email}</span>
                    <CopyButton value={NIVARA_DEMO.email} label="email" />
                  </dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Password</dt>
                  <dd className="flex items-center gap-2 font-mono text-foreground">
                    {NIVARA_DEMO.password}
                    <CopyButton value={NIVARA_DEMO.password} label="password" />
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <LandingDemoLink className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Open Nivara Demo
                <ArrowRight size={16} />
              </LandingDemoLink>
              <Link
                href={SME_REGISTER_ROUTE}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Start fresh onboarding
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-b border-border py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Explore how an SME moves from information to draft.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Open the pre-filled Nivara workspace or start a fresh issuer journey.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <LandingDemoLink className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Explore Nivara Demo
            </LandingDemoLink>
            <LandingDashboardLink className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              Open Dashboard
            </LandingDashboardLink>
          </div>
        </div>
      </section>

      {/* Hackathon / footer */}
      <footer className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 border-b border-border pb-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-lg font-semibold text-foreground">Dwaar</p>
              <p className="mt-1 text-sm text-muted-foreground">SME IPO preparation workspace</p>
              <p className="mt-4 text-sm text-muted-foreground">
                Built for SEBI Securities Market TechSprint @ GFF 2026
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Problem Statement: Simplifying IPO Offer Document Preparation for SMEs
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Team</span> Stay24
              </p>
              <p className="mt-1">
                <span className="font-medium text-foreground">Built by</span> Prathamesh Bhamare
              </p>
            </div>
          </div>
          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Dwaar assists with preparation and organisation. Professional due diligence,
            certification and regulatory filing remain the responsibility of authorised
            intermediaries and professionals.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            &copy; {year} Dwaar. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
