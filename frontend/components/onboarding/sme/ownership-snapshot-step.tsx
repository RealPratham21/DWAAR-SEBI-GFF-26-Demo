'use client';

import {
  fieldClassName,
  FormField,
  helperClassName,
} from '@/components/company-incorporation/form-primitives';
import { YES_NO_UNSURE_OPTIONS } from '@/lib/onboarding/sme/constants';
import type { OwnershipSnapshotStepData } from '@/lib/onboarding/sme/types';

export function OwnershipSnapshotStep({
  data,
  errors,
  onChange,
}: {
  data: OwnershipSnapshotStepData;
  errors?: Record<string, string>;
  onChange: (data: OwnershipSnapshotStepData) => void;
}) {
  const update = (patch: Partial<OwnershipSnapshotStepData>) => onChange({ ...data, ...patch });

  const promoter = Number(data.promoterHoldingPercent) || 0;
  const nonPromoter = Number(data.nonPromoterHoldingPercent) || 0;
  const total = promoter + nonPromoter;
  const totalValid = data.promoterHoldingPercent !== '' && data.nonPromoterHoldingPercent !== '' && Math.abs(total - 100) <= 0.01;

  return (
    <div className="space-y-6">
      <p className={helperClassName}>
        This is an initial ownership snapshot. Detailed shareholders, securities and capital history
        will be collected under Capital & Ownership.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="Number of promoters" htmlFor="promoterCount" required error={errors?.promoterCount}>
          <input
            id="promoterCount"
            type="number"
            min={0}
            className={fieldClassName}
            value={data.promoterCount}
            onChange={(e) => update({ promoterCount: e.target.value })}
          />
        </FormField>
        <FormField label="Number of directors" htmlFor="directorCount" required error={errors?.directorCount}>
          <input
            id="directorCount"
            type="number"
            min={1}
            className={fieldClassName}
            value={data.directorCount}
            onChange={(e) => update({ directorCount: e.target.value })}
          />
        </FormField>
        <FormField
          label="Promoter holding (%)"
          htmlFor="promoterHoldingPercent"
          required
          error={errors?.promoterHoldingPercent}
        >
          <input
            id="promoterHoldingPercent"
            type="number"
            min={0}
            max={100}
            step="0.01"
            className={fieldClassName}
            value={data.promoterHoldingPercent}
            onChange={(e) => update({ promoterHoldingPercent: e.target.value })}
          />
        </FormField>
        <FormField
          label="Non-promoter holding (%)"
          htmlFor="nonPromoterHoldingPercent"
          required
          error={errors?.nonPromoterHoldingPercent}
        >
          <input
            id="nonPromoterHoldingPercent"
            type="number"
            min={0}
            max={100}
            step="0.01"
            className={fieldClassName}
            value={data.nonPromoterHoldingPercent}
            onChange={(e) => update({ nonPromoterHoldingPercent: e.target.value })}
          />
        </FormField>
      </div>

      <p
        className={
          totalValid
            ? 'text-sm text-success'
            : 'text-sm text-muted-foreground'
        }
        aria-live="polite"
      >
        Combined holding total: {total.toFixed(2)}% {totalValid ? '(valid)' : '(must total 100%)'}
      </p>

      {[
        {
          key: 'institutionalShareholdersPresent' as const,
          label: 'Institutional shareholders present?',
        },
        {
          key: 'foreignShareholdersPresent' as const,
          label: 'Foreign shareholders present?',
        },
        {
          key: 'promoterGroupEntitiesPresent' as const,
          label: 'Promoter group entities present?',
        },
      ].map(({ key, label }) => (
        <fieldset key={key} className="space-y-2">
          <legend className="text-sm font-medium text-foreground">
            {label} <span className="text-destructive">*</span>
          </legend>
          <div className="flex flex-wrap gap-4">
            {YES_NO_UNSURE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={key}
                  value={option.value}
                  checked={data[key] === option.value}
                  onChange={() => update({ [key]: option.value })}
                />
                {option.label}
              </label>
            ))}
          </div>
          {errors?.[key] ? <p className="text-sm text-destructive">{errors[key]}</p> : null}
        </fieldset>
      ))}
    </div>
  );
}
