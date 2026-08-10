import Link from 'next/link';
import { LEGAL_ROUTES } from '@/lib/auth/constants';

export function LegalDocumentLink({
  label,
  href,
}: {
  label: string;
  href: typeof LEGAL_ROUTES.termsOfService | typeof LEGAL_ROUTES.privacyPolicy;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent font-medium hover:underline"
    >
      {label}
    </Link>
  );
}
