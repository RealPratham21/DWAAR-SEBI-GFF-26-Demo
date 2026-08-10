import { Building2 } from 'lucide-react';
import { ProfileChip } from '@/components/company-profile/profile-chip';
import { ProfileField, ProfileFieldGrid } from '@/components/company-profile/profile-field';
import { companyMonogram } from '@/lib/company-profile/utils';
import type { ProfileFieldItem } from '@/lib/company-profile/build-profile-sections';

type CompanyIdentityHeaderProps = {
  legalName: string;
  tagline: string;
  location: string;
  chips: string[];
  atAGlance: ProfileFieldItem[];
};

export function CompanyIdentityHeader({
  legalName,
  tagline,
  location,
  chips,
  atAGlance,
}: CompanyIdentityHeaderProps) {
  const monogram = companyMonogram(legalName);

  return (
    <header className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 text-base font-bold text-primary"
          >
            {monogram}
          </div>
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <Building2 className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {legalName}
                </h1>
                {tagline ? (
                  <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
                ) : null}
                {location ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">{location}</p>
                ) : null}
              </div>
            </div>
            {chips.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {chips.map((chip, index) => (
                  <ProfileChip key={chip} variant={index === 0 ? 'neutral' : 'accent'}>
                    {chip}
                  </ProfileChip>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground lg:text-right">
          Canonical issuer identity and IPO context for this workspace — sourced from submitted
          onboarding information.
        </p>
      </div>

      {atAGlance.length > 0 ? (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            At a glance
          </p>
          <ProfileFieldGrid columns={3}>
            {atAGlance.map((item) => (
              <ProfileField
                key={item.label}
                label={item.label}
                value={item.value}
                emphasis={item.emphasis}
              />
            ))}
          </ProfileFieldGrid>
        </div>
      ) : null}
    </header>
  );
}
