'use client';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  officeAddressFormSchema,
  officeAddressSchema,
  officesArraySchema,
  type OfficeAddress,
} from '@/lib/schemas/company-incorporation';
import {
  occupancyTypeOptions,
  officeTypeOptions,
} from '@/lib/types/company-incorporation';
import { fieldClassName, FormField } from '@/components/company-incorporation/form-primitives';
import { RecordDialog } from '@/components/company-incorporation/record-dialog';
import { createRecordId } from '@/lib/company-incorporation/defaults';

const officeFormSchema = officeAddressFormSchema;
type OfficeFormValues = z.input<typeof officeFormSchema>;

const emptyOfficeValues: OfficeFormValues = {
  officeType: '' as OfficeFormValues['officeType'],
  addressLine1: '',
  addressLine2: '',
  locality: '',
  city: '',
  district: '',
  state: '',
  pinCode: '',
  country: '',
  effectiveFrom: '',
  effectiveUntil: '',
  occupancyType: '' as OfficeFormValues['occupancyType'],
};

interface OfficeDialogProps {
  open: boolean;
  initialOffice?: OfficeAddress | null;
  existingOffices: OfficeAddress[];
  onClose: () => void;
  onSave: (office: OfficeAddress) => void;
}

export function OfficeDialog({
  open,
  initialOffice,
  existingOffices,
  onClose,
  onSave,
}: OfficeDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OfficeFormValues>({
    resolver: zodResolver(officeFormSchema),
    defaultValues: emptyOfficeValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(initialOffice ? { ...initialOffice } : { ...emptyOfficeValues });
  }, [initialOffice, open, reset]);

  const submit = handleSubmit((values) => {
    const office = officeAddressSchema.parse({
      ...values,
      id: initialOffice?.id ?? createRecordId(),
    });

    const nextOffices = initialOffice
      ? existingOffices.map((item) => (item.id === office.id ? office : item))
      : [...existingOffices, office];

    const arrayResult = officesArraySchema.safeParse(nextOffices);
    if (!arrayResult.success) {
      const message =
        arrayResult.error.issues[0]?.message ??
        'Only one current registered office is allowed unless earlier records have an effective-until date';
      setError('officeType', { message });
      return;
    }

    onSave(office);
    onClose();
  });

  return (
    <RecordDialog
      open={open}
      title={initialOffice ? 'Edit Office' : 'Add Office'}
      description="Record registered, corporate, and communication office addresses."
      onClose={onClose}
      onSubmit={submit}
      submitLabel={initialOffice ? 'Save Office' : 'Add Office'}
      isSubmitting={isSubmitting}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Office type" htmlFor="officeType" required error={errors.officeType?.message}>
          <select id="officeType" {...register('officeType')} className={fieldClassName} defaultValue="">
            <option value="" disabled>
              Select office type
            </option>
            {officeTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Occupancy type"
          htmlFor="occupancyType"
          required
          error={errors.occupancyType?.message}
        >
          <select id="occupancyType" {...register('occupancyType')} className={fieldClassName} defaultValue="">
            <option value="" disabled>
              Select occupancy type
            </option>
            {occupancyTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Address line 1"
          htmlFor="addressLine1"
          required
          className="md:col-span-2"
          error={errors.addressLine1?.message}
        >
          <input id="addressLine1" {...register('addressLine1')} className={fieldClassName} />
        </FormField>

        <FormField
          label="Address line 2"
          htmlFor="addressLine2"
          className="md:col-span-2"
          error={errors.addressLine2?.message}
        >
          <input id="addressLine2" {...register('addressLine2')} className={fieldClassName} />
        </FormField>

        <FormField label="Locality" htmlFor="locality" error={errors.locality?.message}>
          <input id="locality" {...register('locality')} className={fieldClassName} />
        </FormField>

        <FormField label="City" htmlFor="city" required error={errors.city?.message}>
          <input id="city" {...register('city')} className={fieldClassName} />
        </FormField>

        <FormField label="District" htmlFor="district" error={errors.district?.message}>
          <input id="district" {...register('district')} className={fieldClassName} />
        </FormField>

        <FormField label="State" htmlFor="state" required error={errors.state?.message}>
          <input id="state" {...register('state')} className={fieldClassName} />
        </FormField>

        <FormField label="PIN code" htmlFor="pinCode" required error={errors.pinCode?.message}>
          <input id="pinCode" {...register('pinCode')} className={fieldClassName} />
        </FormField>

        <FormField label="Country" htmlFor="country" required error={errors.country?.message}>
          <input id="country" {...register('country')} className={fieldClassName} />
        </FormField>

        <FormField
          label="Effective from"
          htmlFor="effectiveFrom"
          required
          error={errors.effectiveFrom?.message}
        >
          <input
            id="effectiveFrom"
            type="date"
            {...register('effectiveFrom')}
            className={fieldClassName}
          />
        </FormField>

        <FormField
          label="Effective until"
          htmlFor="effectiveUntil"
          error={errors.effectiveUntil?.message}
        >
          <input
            id="effectiveUntil"
            type="date"
            {...register('effectiveUntil')}
            className={fieldClassName}
          />
        </FormField>
      </div>
    </RecordDialog>
  );
}
