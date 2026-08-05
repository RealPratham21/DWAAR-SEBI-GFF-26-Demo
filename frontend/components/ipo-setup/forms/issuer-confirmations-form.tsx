'use client';

import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { CheckboxField } from '@/components/ipo-setup/form-helpers';
import { IpoSectionSaveActions } from '@/components/ipo-setup/section-save-actions';
import { useIpoSetup } from '@/lib/ipo-setup/context';
import { ISSUER_CONFIRMATION_FIELDS } from '@/lib/ipo-setup/options';
import type { IssuerConfirmations } from '@/lib/schemas/ipo-setup';

export function IssuerConfirmationsForm() {
  const { payload, updateSection } = useIpoSetup();
  const value = payload.issuerConfirmations;

  return (
    <SectionCard
      title="Issuer Confirmations"
      description="Confirmations are not required merely to keep progress, but incomplete confirmations remain visible in assessment."
    >
      <div className="space-y-4">
        {ISSUER_CONFIRMATION_FIELDS.map((field) => (
          <CheckboxField
            key={field.key}
            id={field.key}
            label={field.label}
            checked={value[field.key]}
            onChange={(checked) =>
              updateSection(
                'issuerConfirmations',
                { ...value, [field.key]: checked } satisfies IssuerConfirmations,
                'issuer-confirmations',
              )
            }
          />
        ))}
      </div>

      <IpoSectionSaveActions sectionId="issuer-confirmations" />
    </SectionCard>
  );
}
