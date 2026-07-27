'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useCompanyIncorporation } from '@/lib/company-incorporation/context';
import type { CompanyIncorporationSessionData } from '@/lib/company-incorporation/defaults';
import {
  constitutionalRecordSchema,
  type ConstitutionalRecordInput,
} from '@/lib/schemas/company-incorporation';
import {
  certifiedCopyStatusOptions,
  legalReviewStatusOptions,
  operationsAlignmentStatusOptions,
} from '@/lib/types/company-incorporation';
import {
  fieldClassName,
  FormActionRow,
  FormField,
  SectionCard,
} from '@/components/company-incorporation/form-primitives';
import { SessionSaveNotice } from '@/components/company-incorporation/session-save-notice';

export function ConstitutionalRecordsForm() {
  const { data, setConstitutionalRecord, notifySaved, saveNotice, clearSaveNotice } =
    useCompanyIncorporation();
  const [clauseInput, setClauseInput] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConstitutionalRecordInput>({
    resolver: zodResolver(constitutionalRecordSchema),
    defaultValues: data.constitutionalRecord,
    values: data.constitutionalRecord,
  });

  const clauseNumbers = watch('mainObjectClauseNumbers') ?? [];

  const addClauseNumber = () => {
    const trimmed = clauseInput.trim();
    if (!trimmed || clauseNumbers.includes(trimmed)) return;
    setValue('mainObjectClauseNumbers', [...clauseNumbers, trimmed], { shouldDirty: true });
    setClauseInput('');
  };

  const removeClauseNumber = (clause: string) => {
    setValue(
      'mainObjectClauseNumbers',
      clauseNumbers.filter((item) => item !== clause),
      { shouldDirty: true },
    );
  };

  const onSubmit = handleSubmit((values) => {
    setConstitutionalRecord(values as CompanyIncorporationSessionData['constitutionalRecord']);
    notifySaved();
  });

  return (
    <SectionCard
      title="Constitutional Documents"
      description="Current MoA/AoA position, main objects, and legal-review status."
    >
      {saveNotice ? <SessionSaveNotice message={saveNotice} onDismiss={clearSaveNotice} /> : null}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Current MoA version date"
            htmlFor="moaVersionDate"
            error={errors.moaVersionDate?.message}
          >
            <input
              id="moaVersionDate"
              type="date"
              {...register('moaVersionDate')}
              className={fieldClassName}
            />
          </FormField>

          <FormField
            label="Current AoA version date"
            htmlFor="aoaVersionDate"
            error={errors.aoaVersionDate?.message}
          >
            <input
              id="aoaVersionDate"
              type="date"
              {...register('aoaVersionDate')}
              className={fieldClassName}
            />
          </FormField>

          <FormField
            label="MoA certified-copy status"
            htmlFor="moaCertifiedCopyStatus"
            error={errors.moaCertifiedCopyStatus?.message}
          >
            <select
              id="moaCertifiedCopyStatus"
              {...register('moaCertifiedCopyStatus')}
              className={fieldClassName}
              defaultValue=""
            >
              <option value="">Select status</option>
              {certifiedCopyStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="AoA certified-copy status"
            htmlFor="aoaCertifiedCopyStatus"
            error={errors.aoaCertifiedCopyStatus?.message}
          >
            <select
              id="aoaCertifiedCopyStatus"
              {...register('aoaCertifiedCopyStatus')}
              className={fieldClassName}
              defaultValue=""
            >
              <option value="">Select status</option>
              {certifiedCopyStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Latest MoA amendment date"
            htmlFor="latestMoaAmendmentDate"
            error={errors.latestMoaAmendmentDate?.message}
          >
            <input
              id="latestMoaAmendmentDate"
              type="date"
              {...register('latestMoaAmendmentDate')}
              className={fieldClassName}
            />
          </FormField>

          <FormField
            label="Latest AoA amendment date"
            htmlFor="latestAoaAmendmentDate"
            error={errors.latestAoaAmendmentDate?.message}
          >
            <input
              id="latestAoaAmendmentDate"
              type="date"
              {...register('latestAoaAmendmentDate')}
              className={fieldClassName}
            />
          </FormField>

          <FormField
            label="Whether current operations align with the main objects"
            htmlFor="operationsAlignmentStatus"
            error={errors.operationsAlignmentStatus?.message}
          >
            <select
              id="operationsAlignmentStatus"
              {...register('operationsAlignmentStatus')}
              className={fieldClassName}
              defaultValue=""
            >
              <option value="">Select option</option>
              {operationsAlignmentStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Legal-review status"
            htmlFor="legalReviewStatus"
            error={errors.legalReviewStatus?.message}
          >
            <select
              id="legalReviewStatus"
              {...register('legalReviewStatus')}
              className={fieldClassName}
              defaultValue=""
            >
              <option value="">Select status</option>
              {legalReviewStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField
          label="Main-object clause numbers"
          htmlFor="clauseInput"
          helper="Add one or more clause numbers that contain the principal main objects."
        >
          <div className="flex gap-2">
            <input
              id="clauseInput"
              value={clauseInput}
              onChange={(event) => setClauseInput(event.target.value)}
              className={fieldClassName}
              placeholder="e.g. III(A)"
            />
            <Button type="button" variant="outline" onClick={addClauseNumber}>
              Add
            </Button>
          </div>
          {clauseNumbers.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {clauseNumbers.map((clause) => (
                <span
                  key={clause}
                  className="inline-flex items-center gap-2 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground"
                >
                  {clause}
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => removeClauseNumber(clause)}
                    aria-label={`Remove clause ${clause}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </FormField>

        <FormField
          label="Exact main-object text"
          htmlFor="mainObjectText"
          error={errors.mainObjectText?.message}
        >
          <textarea
            id="mainObjectText"
            rows={6}
            {...register('mainObjectText')}
            className={fieldClassName}
          />
        </FormField>

        <FormActionRow>
          <Button type="submit">Save Constitutional Information</Button>
        </FormActionRow>
      </form>
    </SectionCard>
  );
}
