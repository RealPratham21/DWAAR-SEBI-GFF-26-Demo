import type { Metadata } from 'next';
import { LegalDocumentShell, PrivacyContent } from '@/components/legal/legal-document-shell';

export const metadata: Metadata = {
  title: 'Privacy Policy | Dwaar',
  description: 'Prototype privacy policy for the Dwaar IPO preparation workspace.',
};

export default function PrivacyPage() {
  return (
    <LegalDocumentShell title="Privacy Policy">
      <PrivacyContent />
    </LegalDocumentShell>
  );
}
