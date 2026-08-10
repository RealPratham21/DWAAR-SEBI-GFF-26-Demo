import type { Metadata } from 'next';
import { LegalDocumentShell, TermsContent } from '@/components/legal/legal-document-shell';

export const metadata: Metadata = {
  title: 'Terms of Service | Dwaar',
  description: 'Prototype terms of service for the Dwaar IPO preparation workspace.',
};

export default function TermsPage() {
  return (
    <LegalDocumentShell title="Terms of Service">
      <TermsContent />
    </LegalDocumentShell>
  );
}
