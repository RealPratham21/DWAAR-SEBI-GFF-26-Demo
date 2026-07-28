import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AUTH_ROUTES } from '@/lib/auth/constants';

export function PublicAuthShell({
  children,
  backHref = AUTH_ROUTES.home,
  backLabel = 'Back to Home',
}: {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Link>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-10">{children}</div>
    </main>
  );
}
