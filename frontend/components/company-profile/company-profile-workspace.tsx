'use client';

import {
  Briefcase,
  Building2,
  Landmark,
  MapPin,
  Target,
  User,
  Users,
} from 'lucide-react';
import { CompanyIdentityHeader } from '@/components/company-profile/company-identity-header';
import { ProfileStatusChip } from '@/components/company-profile/profile-chip';
import { ProfileField, ProfileFieldGrid } from '@/components/company-profile/profile-field';
import { ProfileSection } from '@/components/company-profile/profile-section';
import {
  ProfileBreadcrumbs,
  ProfileSectionNav,
} from '@/components/company-profile/profile-section-nav';
import { buildProfileSections } from '@/lib/company-profile/build-profile-sections';
import { displayWebsiteLabel, normalizeWebsiteHref } from '@/lib/company-profile/utils';
import { useWorkspaceBootstrap } from '@/lib/workspace/context';

export function CompanyProfileWorkspace() {
  const bootstrap = useWorkspaceBootstrap();
  const sections = buildProfileSections(bootstrap);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <ProfileBreadcrumbs
        items={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Company Profile' },
        ]}
      />

      <CompanyIdentityHeader {...sections.hero} />

      {sections.navSections.length >= 4 ? (
        <ProfileSectionNav sections={sections.navSections} />
      ) : null}

      <ProfileSection id="overview" title="Company overview" icon={Building2}>
        <ProfileFieldGrid>
          {sections.overview.map((item) => (
            <ProfileField
              key={item.label}
              label={item.label}
              value={item.value}
              emphasis={item.emphasis}
            />
          ))}
        </ProfileFieldGrid>
      </ProfileSection>

      <ProfileSection id="business" title="Business profile" icon={Briefcase}>
        <ProfileFieldGrid columns={2}>
          {sections.business.fields.map((item) => (
            <ProfileField key={item.label} label={item.label} value={item.value} />
          ))}
        </ProfileFieldGrid>
        {sections.business.operationsDescription ? (
          <div className="mt-4 border-t border-border pt-4">
            <ProfileField
              label="Operations description"
              value={sections.business.operationsDescription}
              fullWidth
            />
          </div>
        ) : null}
      </ProfileSection>

      {sections.ipo.length > 0 ? (
        <ProfileSection id="ipo" title="IPO intent" icon={Target}>
          <ProfileFieldGrid>
            {sections.ipo.map((item) => (
              <ProfileField key={item.label} label={item.label} value={item.value} />
            ))}
          </ProfileFieldGrid>
        </ProfileSection>
      ) : null}

      {sections.office.addressLines.length > 0 ||
      sections.office.email ||
      sections.office.website ? (
        <ProfileSection id="office" title="Registered office & contact" icon={MapPin}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            {sections.office.addressLines.length > 0 ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Registered office
                </p>
                <address className="mt-2 space-y-0.5 text-sm font-medium not-italic text-foreground">
                  {sections.office.addressLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </address>
              </div>
            ) : null}

            <div className="space-y-4">
              {sections.office.email ? (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Company email
                  </p>
                  <a
                    href={`mailto:${sections.office.email}`}
                    className="mt-1 block text-sm font-medium text-primary hover:underline"
                  >
                    {sections.office.email}
                  </a>
                </div>
              ) : null}
              {sections.office.website ? (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Website
                  </p>
                  <a
                    href={normalizeWebsiteHref(sections.office.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm font-medium text-primary hover:underline"
                  >
                    {displayWebsiteLabel(sections.office.website)}
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </ProfileSection>
      ) : null}

      <ProfileSection id="representative" title="Authorised representative" icon={User}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-sm font-semibold text-foreground"
          >
            {sections.representative.name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? '')
              .join('')}
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="text-lg font-semibold text-foreground">{sections.representative.name}</p>
              <p className="text-sm text-muted-foreground">
                {[sections.representative.designation, sections.representative.relationship]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Contact
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <a
                    href={`mailto:${sections.representative.email}`}
                    className="block font-medium text-primary hover:underline"
                  >
                    {sections.representative.email}
                  </a>
                  {sections.representative.phone ? (
                    <p className="font-medium tabular-nums text-foreground">
                      {sections.representative.phone}
                    </p>
                  ) : null}
                </div>
              </div>

              {sections.representative.authority.length > 0 ? (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Authority
                  </p>
                  <ul className="mt-2 space-y-2">
                    {sections.representative.authority.map((item) => (
                      <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <ProfileStatusChip value={item.value} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </ProfileSection>

      {sections.registrations.length > 0 ? (
        <ProfileSection id="registrations" title="Registrations & identifiers" icon={Landmark}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.registrations.map((item) => (
              <div
                key={`${item.label}-${item.value}`}
                className="rounded-md border border-border bg-muted/20 px-3 py-2.5"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 font-mono text-sm font-semibold tracking-wide text-foreground">
                  {item.value}
                </p>
                {item.detail ? (
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                ) : null}
              </div>
            ))}
          </div>
        </ProfileSection>
      ) : null}

      {sections.ownership.length > 0 ? (
        <ProfileSection id="ownership" title="Ownership snapshot" icon={Users}>
          <ProfileFieldGrid columns={2}>
            {sections.ownership.map((item) => (
              <ProfileField key={item.label} label={item.label} value={item.value} />
            ))}
          </ProfileFieldGrid>
        </ProfileSection>
      ) : null}
    </div>
  );
}
