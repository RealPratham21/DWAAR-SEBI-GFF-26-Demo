'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  constitutionalAmendmentSchema,
  type ConstitutionalAmendment,
} from '@/lib/schemas/company-incorporation';
import { constitutionalDocumentTypeOptions } from '@/lib/types/company-incorporation';
import { fieldClassName, FormField } from '@/components/company-incorporation/form-primitives';
import { RecordDialog } from '@/components/company-incorporation/record-dialog';
import { createRecordId } from '@/lib/company-incorporation/defaults';

const amendmentFormSchema = constitutionalAmendmentSchema.omit({ id: true });
type AmendmentFormValues = z.input<typeof amendmentFormSchema>;

const emptyAmendmentValues: AmendmentFormValues = {
  documentType: '' as AmendmentFormValues['documentType'],
  amendmentDate: '',
  clauseReference: '',
  previousText: '',
  amendedText: '',
  reason: '',
  boardResolutionDate: '',
  shareholderResolutionDate: '',
  filingForm: '',
  srn: '',
  effectiveDate: '',
};

interface ConstitutionalAmendmentDialogProps {
  open: boolean;
  initialAmendment?: ConstitutionalAmendment | null;
  onClose: () => void;
  onSave: (amendment: ConstitutionalAmendment) => void;
}

export function ConstitutionalAmendmentDialog({
  open,
  initialAmendment,
  onClose,
  onSave,
}: ConstitutionalAmendmentDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AmendmentFormValues>({
    resolver: zodResolver(amendmentFormSchema),
    defaultValues: emptyAmendmentValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(initialAmendment ? { ...initialAmendment } : { ...emptyAmendmentValues });
  }, [initialAmendment, open, reset]);

  const submit = handleSubmit((values) => {
    onSave(
      constitutionalAmendmentSchema.parse({
        ...values,
        id: initialAmendment?.id ?? createRecordId(),
      }),
    );
    onClose();
  });

  return (
    <RecordDialog
      open={open}
      title={initialAmendment ? 'Edit Amendment' : 'Add Amendment'}
      description="Record MoA or AoA amendments relevant to the issuer’s constitutional documents."
      onClose={onClose}
      onSubmit={submit}
      submitLabel={initialAmendment ? 'Save Amendment' : 'Add Amendment'}
      isSubmitting={isSubmitting}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Document type"
          htmlFor="documentType"
          required
          error={errors.documentType?.message}
        >
          <select id="documentType" {...register('documentType')} className={fieldClassName} defaultValue="">
            <option value="" disabled>
              Select document type
            </option>
            {constitutionalDocumentTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Amendment date"
          htmlFor="amendmentDate"
          required
          error={errors.amendmentDate?.message}
        >
          <input
            id="amendmentDate"
            type="date"
            {...register('amendmentDate')}
            className={fieldClassName}
          />
        </FormField>

        <FormField
          label="Clause reference"
          htmlFor="clauseReference"
          required
          className="md:col-span-2"
          error={errors.clauseReference?.message}
        >
          <input id="clauseReference" {...register('clauseReference')} className={fieldClassName} />
        </FormField>

        <FormField
          label="Previous text"
          htmlFor="previousText"
          className="md:col-span-2"
          error={errors.previousText?.message}
        >
          <textarea id="previousText" rows={3} {...register('previousText')} className={fieldClassName} />
        </FormField>

        <FormField
          label="Amended text"
          htmlFor="amendedText"
          required
          className="md:col-span-2"
          error={errors.amendedText?.message}
        >
          <textarea id="amendedText" rows={3} {...register('amendedText')} className={fieldClassName} />
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

        <FormField label="Filing form" htmlFor="filingForm" error={errors.filingForm?.message}>
          <input id="filingForm" {...register('filingForm')} className={fieldClassName} />
        </FormField>

        <FormField label="SRN" htmlFor="srn" error={errors.srn?.message}>
          <input id="srn" {...register('srn')} className={fieldClassName} />
        </FormField>

        <FormField label="Effective date" htmlFor="effectiveDate" error={errors.effectiveDate?.message}>
          <input
            id="effectiveDate"
            type="date"
            {...register('effectiveDate')}
            className={fieldClassName}
          />
        </FormField>
      </div>
    </RecordDialog>
  );
}
