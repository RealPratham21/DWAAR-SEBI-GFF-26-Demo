import type { ReactNode } from 'react';

/** Static product-preview compositions derived from Dwaar UI patterns (not screenshots). */

function BrowserFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-primary/5">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </div>
        <span className="ml-2 truncate text-xs text-muted-foreground">{title}</span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function HeroDashboardPreview() {
  return (
    <BrowserFrame title="dwaar.app/projects/demo">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {['Preparation', 'Issues', 'Facts', 'DRHP'].map((label, i) => (
            <div
              key={label}
              className="min-w-[7rem] flex-1 rounded-lg border border-border bg-background px-3 py-2"
            >
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {['11/12', '17 open', '286 facts', 'Draft v2'][i]}
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            IPO Preparation Overview
          </p>
          {[
            ['Company & Incorporation', '6/6', 'Complete'],
            ['Capital & Ownership', '7/7', 'In progress'],
            ['Financials & KPIs', '8/8', 'Complete'],
          ].map(([name, info, status]) => (
            <div
              key={name}
              className="flex items-center justify-between border-t border-border py-2 text-xs first:border-t-0 first:pt-0"
            >
              <span className="truncate text-foreground">{name}</span>
              <span className="ml-2 shrink-0 text-muted-foreground">{info}</span>
              <span className="ml-2 hidden shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary sm:inline">
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

export function DrhpWorkspacePreview() {
  return (
    <BrowserFrame title="dwaar.app/projects/demo/drhp">
      <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr]">
        <div className="space-y-1.5">
          {[
            'Cover Page & Front Matter',
            'Risk Factors',
            'Financial Information & MD&A',
            'Management & Governance',
          ].map((chapter, i) => (
            <div
              key={chapter}
              className={`rounded-md border px-2 py-1.5 text-[11px] ${
                i === 2
                  ? 'border-accent/40 bg-accent/5 font-medium text-foreground'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {chapter}
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Draft block</p>
          <p className="mt-2 text-xs leading-relaxed text-foreground">
            The Company was incorporated on 14 March 2018 under the Companies Act, 2013…
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              Source: C&I · CoI
            </span>
            <span className="rounded border border-accent/30 bg-accent/5 px-1.5 py-0.5 text-[10px] text-accent">
              3 facts linked
            </span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

export function FactsIssuesPreview() {
  return (
    <BrowserFrame title="dwaar.app/projects/demo/issues-gaps">
      <div className="space-y-2">
        {[
          { severity: 'High', title: 'Fresh Issue share count differs across sources', ws: 'Capital & Ownership' },
          { severity: 'Medium', title: 'Professional confirmation pending on KPI restatement', ws: 'Financials & KPIs' },
        ].map((issue) => (
          <div key={issue.title} className="rounded-lg border border-border bg-background p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-destructive">
                {issue.severity}
              </span>
              <span className="text-[10px] text-muted-foreground">{issue.ws}</span>
            </div>
            <p className="text-xs font-medium text-foreground">{issue.title}</p>
          </div>
        ))}
        <div className="rounded-lg border border-dashed border-border px-3 py-2 text-center text-[10px] text-muted-foreground">
          Cross-workstream reconciliation in one view
        </div>
      </div>
    </BrowserFrame>
  );
}

export function TraceabilityChain() {
  const steps = [
    'Document / Structured Input',
    'Canonical Fact',
    'Reconciliation / Issue',
    'Disclosure',
    'DRHP Block',
  ];

  return (
    <div className="mx-auto max-w-md space-y-0">
      {steps.map((step, index) => (
        <div key={step} className="flex flex-col items-center">
          <div className="w-full rounded-lg border border-border bg-card px-4 py-3 text-center text-sm font-medium text-foreground">
            {step}
          </div>
          {index < steps.length - 1 && (
            <div className="flex h-6 items-center text-muted-foreground" aria-hidden>
              ↓
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
