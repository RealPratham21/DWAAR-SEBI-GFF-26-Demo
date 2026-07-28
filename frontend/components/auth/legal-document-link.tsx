'use client';

import Link from 'next/link';
import { LEGAL_ROUTES } from '@/lib/auth/constants';

/** TODO: Replace with real legal pages when published. */
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
      className="text-accent font-medium hover:underline"
      onClick={(event) => event.preventDefault()}
    >
      {label}
    </Link>
  );
}
