'use client';

import { ConstitutionalAmendmentsSection } from '@/components/company-incorporation/constitutional-amendments-section';
import { ConstitutionalRecordsForm } from '@/components/company-incorporation/constitutional-records-form';
import { CorporateEventsSection } from '@/components/company-incorporation/corporate-events-section';
import { InformationSectionNavigation } from '@/components/company-incorporation/information-section-navigation';
import { IssuerConfirmationsForm } from '@/components/company-incorporation/issuer-confirmations-form';
import { LegalIdentityForm } from '@/components/company-incorporation/legal-identity-form';
import { OfficesSection } from '@/components/company-incorporation/offices-section';
import { RegistrationsSection } from '@/components/company-incorporation/registrations-section';
import type { InformationSectionId } from '@/lib/types/company-incorporation';

interface CompanyIncorporationInformationTabProps {
  activeSection: InformationSectionId;
  onSectionChange: (section: InformationSectionId) => void;
}

export function CompanyIncorporationInformationTab({
  activeSection,
  onSectionChange,
}: CompanyIncorporationInformationTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <InformationSectionNavigation
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
      </aside>

      <div className="space-y-6">
        {activeSection === 'legal-identity' ? <LegalIdentityForm /> : null}
        {activeSection === 'corporate-history' ? <CorporateEventsSection /> : null}
        {activeSection === 'offices-contact' ? <OfficesSection /> : null}
        {activeSection === 'constitutional-documents' ? (
          <div className="space-y-6">
            <ConstitutionalRecordsForm />
            <div className="bg-card border border-border rounded-lg p-6">
              <ConstitutionalAmendmentsSection />
            </div>
          </div>
        ) : null}
        {activeSection === 'core-registrations' ? <RegistrationsSection /> : null}
        {activeSection === 'issuer-confirmations' ? <IssuerConfirmationsForm /> : null}
      </div>
    </div>
  );
}
