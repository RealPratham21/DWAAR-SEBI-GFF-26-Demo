'use client';

import { Button } from '@/components/ui/button';

export function OnboardingReviewCard({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <section className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {children}
      </dl>
    </section>
  );
}

export function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium">{value || 'Not provided'}</dd>
    </>
  );
}
