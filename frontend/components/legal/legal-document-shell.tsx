import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DwaarLogo } from '@/components/dwaar-logo';
import { AUTH_ROUTES, LEGAL_ROUTES } from '@/lib/auth/constants';
import { LegalPrototypeNotice } from '@/components/legal/legal-prototype-notice';

type LegalDocumentShellProps = {
  title: string;
  children: React.ReactNode;
};

export function LegalDocumentShell({ title, children }: LegalDocumentShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href={AUTH_ROUTES.home}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <DwaarLogo size="sm" wordmarkClassName="text-sm font-semibold" />
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8 space-y-3 border-b border-border pb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dwaar</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: August 2026</p>
          <LegalPrototypeNotice />
        </header>

        <div className="legal-document-body space-y-8 text-sm leading-relaxed text-foreground">
          {children}
        </div>

        <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>
            See also:{' '}
            <Link href={LEGAL_ROUTES.termsOfService} className="text-accent hover:underline">
              Terms of Service
            </Link>
            {' · '}
            <Link href={LEGAL_ROUTES.privacyPolicy} className="text-accent hover:underline">
              Privacy Policy
            </Link>
          </p>
        </footer>
      </article>
    </main>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}

export function TermsContent() {
  return (
    <>
      <LegalSection title="1. About Dwaar">
        <p>
          Dwaar is a software workspace that helps small and medium enterprises organise
          information, evidence, and draft content for IPO and Draft Red Herring Prospectus
          (DRHP) preparation. It is designed to reduce manual reconciliation and improve
          traceability between issuer inputs and draft disclosures.
        </p>
      </LegalSection>

      <LegalSection title="2. What Dwaar is not">
        <p>
          Dwaar does not provide legal, investment, merchant-banking, audit, statutory, SEBI, or
          other professional certification services. Nothing in the platform constitutes advice,
          approval, clearance, or sign-off by any regulator, exchange, merchant banker, lawyer,
          auditor, or other professional adviser.
        </p>
        <p>
          Any checklists, readiness indicators, generated text, or exports are assistive tools
          only. You remain responsible for verifying accuracy, completeness, and suitability
          before any filing, publication, or investor communication.
        </p>
      </LegalSection>

      <LegalSection title="3. Your responsibilities">
        <p>
          You are responsible for the accuracy, completeness, and authority of all information,
          documents, and representations you enter or upload. You must use Dwaar lawfully and
          only submit information and documents that you are authorised to use, store, and
          process through the workspace.
        </p>
        <p>
          You must maintain the confidentiality of your account credentials and notify us
          promptly if you suspect unauthorised access. You are responsible for activity
          conducted through your account except where caused by our gross negligence in this
          prototype deployment.
        </p>
      </LegalSection>

      <LegalSection title="4. Draft outputs and professional review">
        <p>
          DRHP chapters, reports, exports, and other generated content are working drafts
          intended to support internal preparation. They require independent review by qualified
          professionals before reliance in any regulatory, legal, or market context.
        </p>
        <p>
          Dwaar does not guarantee listing, filing acceptance, regulatory approval, investor
          interest, completeness of disclosure, or any particular compliance outcome.
        </p>
      </LegalSection>

      <LegalSection title="5. Prototype availability">
        <p>
          Dwaar is offered as a hackathon and demonstration prototype. Features, data, and
          service availability may change, be interrupted, or be reset without notice. We may
          modify, suspend, or withdraw functionality as part of development, testing, or demo
          operations.
        </p>
        <p>
          The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis to
          the extent permitted for a non-production prototype. We do not warrant uninterrupted
          or error-free operation.
        </p>
      </LegalSection>

      <LegalSection title="6. Acceptable use">
        <p>
          You must not misuse the platform, attempt unauthorised access, interfere with other
          users or infrastructure, upload malicious content, or use Dwaar for unlawful,
          misleading, or harmful purposes. We may restrict access where we reasonably believe
          these Terms are breached or where necessary to protect the prototype environment.
        </p>
      </LegalSection>

      <LegalSection title="7. Intellectual property">
        <p>
          Dwaar&apos;s software, branding, documentation, and underlying platform materials are
          owned by the project team or its licensors. We grant you a limited, non-exclusive,
          revocable licence to use the platform for your internal IPO preparation activities
          during the prototype period.
        </p>
        <p>
          You retain ownership of your issuer content and uploaded materials. You grant us the
          rights reasonably necessary to host, process, display, and generate draft outputs from
          that content solely to operate the workspace for you.
        </p>
      </LegalSection>

      <LegalSection title="8. Limitation of liability">
        <p>
          To the fullest extent permitted by applicable law, the Dwaar prototype team is not
          liable for indirect, incidental, special, or consequential losses arising from use of
          the platform, including loss of data, business interruption, or reliance on draft
          outputs. Our aggregate liability for direct losses arising from the prototype service
          is limited to the amount you paid to use Dwaar in the preceding twelve months, or
          zero where the prototype is provided without charge.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes">
        <p>
          We may update these Terms as the prototype evolves. Material changes will be reflected
          by updating the &quot;Last updated&quot; date. Continued use after changes constitutes
          acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Questions about these Terms for the prototype may be directed through the project
          channels provided for the SEBI GFF 2026 hackathon demonstration.
        </p>
      </LegalSection>
    </>
  );
}

export function PrivacyContent() {
  return (
    <>
      <LegalSection title="1. Scope">
        <p>
          This Privacy Policy describes, at a high level, how the Dwaar prototype processes
          information when you create an account, complete onboarding, use workstreams, upload
          documents, generate drafts, and export reports. It applies to the demonstration
          environment built for the SEBI GFF 2026 hackathon.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we process">
        <p>
          <strong className="text-foreground">Account and contact information.</strong> When you
          register, we process your name, email address, mobile number, and account credentials.
          Passwords are stored using one-way hashing (Argon2) rather than in plain text.
        </p>
        <p>
          <strong className="text-foreground">Issuer and onboarding information.</strong> During
          SME onboarding and workspace use, we process company identity, corporate structure,
          financial, operational, governance, legal, and offering-related information that you
          enter into workstreams.
        </p>
        <p>
          <strong className="text-foreground">Uploaded documents and evidence.</strong> Files you
          upload for the data room, evidence linking, and document processing flows are stored
          in the platform&apos;s configured object storage together with related metadata (such as
          filenames, versions, and processing status).
        </p>
        <p>
          <strong className="text-foreground">Generated content.</strong> We store DRHP chapter
          versions, facts, issues, reports, exports, and related traceability records created
          from your workspace activity.
        </p>
        <p>
          <strong className="text-foreground">Technical and service information.</strong> We
          process authentication tokens, session records, server logs, and basic operational
          data needed to run and secure the prototype. In production deployments of this
          frontend, anonymous page analytics may be collected through Vercel Analytics.
        </p>
      </LegalSection>

      <LegalSection title="3. How we use information">
        <p>We use the information above to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>authenticate users and maintain sessions;</li>
          <li>operate issuer workspaces and onboarding flows;</li>
          <li>generate and store DRHP drafts and related structured outputs;</li>
          <li>support evidence traceability, issues tracking, and reporting;</li>
          <li>run document ingestion and structured extraction where enabled;</li>
          <li>maintain security, troubleshoot errors, and improve prototype operation.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. AI-assisted features">
        <p>
          When AI-assisted features are enabled in a deployment, relevant workspace content may
          be transmitted to third-party language-model providers configured for that environment
          (for example, Cohere) to generate draft narrative text or Copilot responses. You
          should not submit information through those features unless you are authorised to
          disclose it for this purpose.
        </p>
      </LegalSection>

      <LegalSection title="5. Storage and infrastructure">
        <p>
          Prototype data is stored in a PostgreSQL database and in S3-compatible object storage
          according to the deployment&apos;s environment configuration. We do not represent a
          specific data residency, retention schedule, or encryption-at-rest standard in this
          prototype documentation unless separately confirmed for a production deployment.
        </p>
      </LegalSection>

      <LegalSection title="6. Your obligations">
        <p>
          You should only provide information and documents that you are authorised to disclose
          to the platform and that are appropriate for an IPO preparation workspace. You are
          responsible for ensuring that uploads do not infringe third-party rights or breach
          contractual or regulatory restrictions.
        </p>
      </LegalSection>

      <LegalSection title="7. Sharing">
        <p>
          We do not sell personal information. In this prototype, information is processed to
          operate your workspace and may be handled by infrastructure and AI service providers
          configured for the deployment (such as hosting, database, object storage, and optional
          model providers). We have not implemented a full third-party subprocessors register
          for the hackathon build.
        </p>
      </LegalSection>

      <LegalSection title="8. Retention and deletion">
        <p>
          The prototype does not currently provide a self-service account deletion workflow or
          published retention schedule. Data may persist for the life of the demonstration
          environment and may be reset as part of testing or demo maintenance.
        </p>
      </LegalSection>

      <LegalSection title="9. Security">
        <p>
          We apply reasonable technical measures appropriate to a prototype, including hashed
          passwords, authenticated API access, and HTTP-only refresh cookies for session
          management. No online system is completely secure, and you should use strong passwords
          and protect your credentials.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes">
        <p>
          We may update this Privacy Policy as the prototype evolves. Changes will be reflected
          by updating the &quot;Last updated&quot; date above.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          Privacy questions about the prototype may be directed through the project channels
          provided for the SEBI GFF 2026 hackathon demonstration.
        </p>
      </LegalSection>
    </>
  );
}
