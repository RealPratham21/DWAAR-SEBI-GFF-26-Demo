'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useCompanyIncorporation } from '@/lib/company-incorporation/context';
import type { IssuerConfirmation } from '@/lib/schemas/company-incorporation';
import { FormActionRow, SectionCard } from '@/components/company-incorporation/form-primitives';
import { SessionSaveNotice } from '@/components/company-incorporation/session-save-notice';

const confirmationFields: {
  name: keyof IssuerConfirmation;
  label: string;
}[] = [
  {
    name: 'allFormerNamesDisclosed',
    label: 'All known former company names have been disclosed.',
  },
  {
    name: 'allCompanyClassChangesDisclosed',
    label: 'All changes in company class or legal form have been disclosed.',
  },
  {
    name: 'allRegisteredOfficeChangesDisclosed',
    label: 'All registered-office changes have been disclosed.',
  },
  {
    name: 'currentMoaWillBeProvided',
    label: 'The current Memorandum of Association will be provided.',
  },
  {
    name: 'currentAoaWillBeProvided',
    label: 'The current Articles of Association will be provided.',
  },
  {
    name: 'mainObjectsReflectCurrentBusiness',
    label: 'The principal business is covered by the current main objects.',
  },
  {
    name: 'registrationsUseCurrentLegalName',
    label:
      'Core registrations use the current legal name, or pending amendments have been disclosed.',
  },
  {
    name: 'noMaterialCorporateEventOmitted',
    label: 'No material incorporation or constitutional event has been omitted.',
  },
  {
    name: 'authorisedRepresentativeDeclaration',
    label: 'The information is being submitted by an authorised representative.',
  },
];

export function IssuerConfirmationsForm() {
  const { data, setConfirmations, notifySaved, saveNotice, clearSaveNotice } =
    useCompanyIncorporation();

  const { register, handleSubmit } = useForm<IssuerConfirmation>({
    defaultValues: data.confirmations,
    values: data.confirmations,
  });

  const onSubmit = handleSubmit((values) => {
    setConfirmations(values);
    notifySaved();
  });

  return (
    <SectionCard
      title="Issuer Confirmations"
      description="Management representations for incorporation and constitutional disclosures."
    >
      {saveNotice ? <SessionSaveNotice message={saveNotice} onDismiss={clearSaveNotice} /> : null}

      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          These confirmations are management representations and will later be verified against
          supporting documents and professional review.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {confirmationFields.map((field) => (
          <label
            key={field.name}
            className="flex items-start gap-3 rounded-md border border-border bg-card px-4 py-3 cursor-pointer hover:bg-muted/20"
          >
            <input
              type="checkbox"
              {...register(field.name)}
              className="mt-1 h-4 w-4 rounded border-input accent-accent"
            />
            <span className="text-sm text-foreground">{field.label}</span>
          </label>
        ))}

        <FormActionRow>
          <Button type="submit">Save Confirmations</Button>
        </FormActionRow>
      </form>
    </SectionCard>
  );
}
