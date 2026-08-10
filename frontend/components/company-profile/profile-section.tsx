import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProfileSectionProps = {
  id: string;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
};

export function ProfileSection({ id, title, icon: Icon, children, className }: ProfileSectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-24', className)}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">{title}</h2>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5">{children}</div>
    </section>
  );
}
