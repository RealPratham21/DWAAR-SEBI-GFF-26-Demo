'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  corporateEventFormSchema,
  corporateEventSchema,
  type CorporateEvent,
} from '@/lib/schemas/company-incorporation';
import {
  corporateEventStatusOptions,
  corporateEventTypeOptions,
} from '@/lib/types/company-incorporation';
import { fieldClassName, FormField } from '@/components/company-incorporation/form-primitives';
import { RecordDialog } from '@/components/company-incorporation/record-dialog';
import { createRecordId } from '@/lib/company-incorporation/defaults';

type CorporateEventFormValues = z.input<typeof corporateEventFormSchema>;

const emptyEventValues: CorporateEventFormValues = {
  eventType: '' as CorporateEventFormValues['eventType'],
  eventStatus: '' as CorporateEventFormValues['eventStatus'],
  effectiveDate: '',
  previousValue: '',
  newValue: '',
  description: '',
  reason: '',
  boardResolutionDate: '',
  shareholderResolutionDate: '',
  approvalAuthority: '',
  filingForm: '',
  srn: '',
  filingDate: '',
  certificateOrOrderDate: '',
};

interface CorporateEventDialogProps {
  open: boolean;
  initialEvent?: CorporateEvent | null;
  onClose: () => void;
  onSave: (event: CorporateEvent) => void;
}

export function CorporateEventDialog({
  open,
  initialEvent,
  onClose,
  onSave,
}: CorporateEventDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CorporateEventFormValues>({
    resolver: zodResolver(corporateEventFormSchema),
    defaultValues: emptyEventValues,
  });

  const eventStatus = watch('eventStatus');
  const isEffective = eventStatus === 'effective';

  useEffect(() => {
    if (!open) return;
    reset(initialEvent ? { ...initialEvent } : { ...emptyEventValues });
  }, [initialEvent, open, reset]);

  const submit = handleSubmit((values) => {
    const parsed = corporateEventSchema.parse({
      ...values,
      id: initialEvent?.id ?? createRecordId(),
    });
    onSave(parsed);
    onClose();
  });

  return (
    <RecordDialog
      open={open}
      title={initialEvent ? 'Edit Corporate Event' : 'Add Corporate Event'}
      description="Record a material corporate history event for DRHP disclosure."
      onClose={onClose}
      onSubmit={submit}
      submitLabel={initialEvent ? 'Save Event' : 'Add Event'}
      isSubmitting={isSubmitting}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Event type" htmlFor="eventType" required error={errors.eventType?.message}>
          <select id="eventType" {...register('eventType')} className={fieldClassName} defaultValue="">
            <option value="" disabled>
              Select event type
            </option>
            {corporateEventTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Event status"
          htmlFor="eventStatus"
          required
          helper={
            eventStatus && eventStatus !== 'effective'
              ? 'This event is not yet legally effective. Provide milestone dates below as applicable.'
              : undefined
          }
          error={errors.eventStatus?.message}
        >
          <select id="eventStatus" {...register('eventStatus')} className={fieldClassName} defaultValue="">
            <option value="" disabled>
              Select event status
            </option>
            {corporateEventStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Legal effective date"
          htmlFor="effectiveDate"
          required={isEffective}
          helper="Required only when the event status is Effective. Not inferred from other milestone dates."
          error={errors.effectiveDate?.message}
        >
          <input
            id="effectiveDate"
            type="date"
            {...register('effectiveDate')}
            className={fieldClassName}
          />
        </FormField>

        <FormField label="Previous value or status" htmlFor="previousValue" error={errors.previousValue?.message}>
          <input id="previousValue" {...register('previousValue')} className={fieldClassName} />
        </FormField>

        <FormField label="New value or status" htmlFor="newValue" error={errors.newValue?.message}>
          <input id="newValue" {...register('newValue')} className={fieldClassName} />
        </FormField>

        <FormField
          label="Short description"
          htmlFor="description"
          required
          className="md:col-span-2"
          error={errors.description?.message}
        >
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            className={fieldClassName}
          />
        </FormField>

        <FormField label="Reason" htmlFor="reason" className="md:col-span-2" error={errors.reason?.message}>
          <textarea id="reason" rows={2} {...register('reason')} className={fieldClassName} />
        </FormField>

        <FormField
          label="Board resolution date"
          htmlFor="boardResolutionDate"
          error={errors.boardResolutionDate?.message}
        >
          <input
            id="boardResolutionDate"
            type="date"
            {...register('boardResolutionDate')}
            className={fieldClassName}
          />
        </FormField>

        <FormField
          label="Shareholder resolution date"
          htmlFor="shareholderResolutionDate"
          error={errors.shareholderResolutionDate?.message}
        >
          <input
            id="shareholderResolutionDate"
            type="date"
            {...register('shareholderResolutionDate')}
            className={fieldClassName}
          />
        </FormField>

        <FormField
          label="Approval authority"
          htmlFor="approvalAuthority"
          error={errors.approvalAuthority?.message}
        >
          <input id="approvalAuthority" {...register('approvalAuthority')} className={fieldClassName} />
        </FormField>

        <FormField label="Filing form" htmlFor="filingForm" error={errors.filingForm?.message}>
          <input id="filingForm" {...register('filingForm')} className={fieldClassName} />
        </FormField>

        <FormField label="SRN" htmlFor="srn" error={errors.srn?.message}>
          <input id="srn" {...register('srn')} className={fieldClassName} />
        </FormField>

        <FormField label="Filing date" htmlFor="filingDate" error={errors.filingDate?.message}>
          <input id="filingDate" type="date" {...register('filingDate')} className={fieldClassName} />
        </FormField>

        <FormField
          label="Certificate or order date"
          htmlFor="certificateOrOrderDate"
          error={errors.certificateOrOrderDate?.message}
        >
          <input
            id="certificateOrOrderDate"
            type="date"
            {...register('certificateOrOrderDate')}
            className={fieldClassName}
          />
        </FormField>
      </div>
    </RecordDialog>
  );
}
