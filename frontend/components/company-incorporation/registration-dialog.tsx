'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  companyRegistrationFormSchema,
  companyRegistrationSchema,
  type CompanyRegistration,
  type RegistrationType,
} from '@/lib/schemas/company-incorporation';
import {
  registrationStatusOptions,
  registrationTypeOptions,
  updateTrackingStatusOptions,
} from '@/lib/types/company-incorporation';
import { REGISTRATION_NUMBER_FIELD_CONFIG } from '@/lib/company-incorporation/registration-field-config';
import { fieldClassName, FormField } from '@/components/company-incorporation/form-primitives';
import { RecordDialog } from '@/components/company-incorporation/record-dialog';
import { createRecordId } from '@/lib/company-incorporation/defaults';

type RegistrationFormValues = z.input<typeof companyRegistrationFormSchema>;

const emptyRegistrationValues: RegistrationFormValues = {
  registrationType: '' as RegistrationFormValues['registrationType'],
  registrationNumber: '',
  issuingAuthority: '',
  legalNameOnRegistration: '',
  addressOnRegistration: '',
  issueDate: '',
  effectiveDate: '',
  expiryDate: '',
  currentStatus: '' as RegistrationFormValues['currentStatus'],
  previousRegistrationNumber: '',
  updatedAfterNameChange: '' as RegistrationFormValues['updatedAfterNameChange'],
  updatedAfterOfficeChange: '' as RegistrationFormValues['updatedAfterOfficeChange'],
};

interface RegistrationDialogProps {
  open: boolean;
  initialRegistration?: CompanyRegistration | null;
  onClose: () => void;
  onSave: (registration: CompanyRegistration) => void;
}

export function RegistrationDialog({
  open,
  initialRegistration,
  onClose,
  onSave,
}: RegistrationDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(companyRegistrationFormSchema),
    defaultValues: emptyRegistrationValues,
  });

  const registrationType = watch('registrationType') as RegistrationType | '';
  const numberFieldConfig =
    registrationType && registrationType in REGISTRATION_NUMBER_FIELD_CONFIG
      ? REGISTRATION_NUMBER_FIELD_CONFIG[registrationType]
      : REGISTRATION_NUMBER_FIELD_CONFIG.other;

  useEffect(() => {
    if (!open) return;
    reset(initialRegistration ? { ...initialRegistration } : { ...emptyRegistrationValues });
  }, [initialRegistration, open, reset]);

  const submit = handleSubmit((values) => {
    onSave(
      companyRegistrationSchema.parse({
        ...values,
        id: initialRegistration?.id ?? createRecordId(),
      }),
    );
    onClose();
  });

  return (
    <RecordDialog
      open={open}
      title={initialRegistration ? 'Edit Registration' : 'Add Registration'}
      description="Record fundamental statutory registrations used across DRHP disclosures."
      onClose={onClose}
      onSubmit={submit}
      submitLabel={initialRegistration ? 'Save Registration' : 'Add Registration'}
      isSubmitting={isSubmitting}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Registration type"
          htmlFor="registrationType"
          required
          error={errors.registrationType?.message}
        >
          <select
            id="registrationType"
            {...register('registrationType')}
            className={fieldClassName}
            defaultValue=""
          >
            <option value="" disabled>
              Select registration type
            </option>
            {registrationTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label={numberFieldConfig.label}
          htmlFor="registrationNumber"
          required
          helper={`${numberFieldConfig.helper} Expected format: ${numberFieldConfig.formatHint}.`}
          error={errors.registrationNumber?.message}
        >
          <input
            id="registrationNumber"
            {...register('registrationNumber')}
            className={fieldClassName}
          />
        </FormField>

        <FormField
          label="Issuing authority"
          htmlFor="issuingAuthority"
          error={errors.issuingAuthority?.message}
        >
          <input id="issuingAuthority" {...register('issuingAuthority')} className={fieldClassName} />
        </FormField>

        <FormField
          label="Legal name on registration"
          htmlFor="legalNameOnRegistration"
          error={errors.legalNameOnRegistration?.message}
        >
          <input
            id="legalNameOnRegistration"
            {...register('legalNameOnRegistration')}
            className={fieldClassName}
          />
        </FormField>

        <FormField
          label="Address on registration"
          htmlFor="addressOnRegistration"
          className="md:col-span-2"
          error={errors.addressOnRegistration?.message}
        >
          <textarea
            id="addressOnRegistration"
            rows={2}
            {...register('addressOnRegistration')}
            className={fieldClassName}
          />
        </FormField>

        <FormField label="Issue date" htmlFor="issueDate" error={errors.issueDate?.message}>
          <input id="issueDate" type="date" {...register('issueDate')} className={fieldClassName} />
        </FormField>

        <FormField
          label="Effective date"
          htmlFor="effectiveDate"
          error={errors.effectiveDate?.message}
        >
          <input
            id="effectiveDate"
            type="date"
            {...register('effectiveDate')}
            className={fieldClassName}
          />
        </FormField>

        <FormField label="Expiry date" htmlFor="expiryDate" error={errors.expiryDate?.message}>
          <input id="expiryDate" type="date" {...register('expiryDate')} className={fieldClassName} />
        </FormField>

        <FormField
          label="Current status"
          htmlFor="currentStatus"
          error={errors.currentStatus?.message}
        >
          <select id="currentStatus" {...register('currentStatus')} className={fieldClassName} defaultValue="">
            <option value="">Select status</option>
            {registrationStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Previous registration number"
          htmlFor="previousRegistrationNumber"
          error={errors.previousRegistrationNumber?.message}
        >
          <input
            id="previousRegistrationNumber"
            {...register('previousRegistrationNumber')}
            className={fieldClassName}
          />
        </FormField>

        <FormField
          label="Updated after company name change?"
          htmlFor="updatedAfterNameChange"
          error={errors.updatedAfterNameChange?.message}
        >
          <select
            id="updatedAfterNameChange"
            {...register('updatedAfterNameChange')}
            className={fieldClassName}
            defaultValue=""
          >
            <option value="">Select option</option>
            {updateTrackingStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Updated after registered-office change?"
          htmlFor="updatedAfterOfficeChange"
          error={errors.updatedAfterOfficeChange?.message}
        >
          <select
            id="updatedAfterOfficeChange"
            {...register('updatedAfterOfficeChange')}
            className={fieldClassName}
            defaultValue=""
          >
            <option value="">Select option</option>
            {updateTrackingStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </RecordDialog>
  );
}
