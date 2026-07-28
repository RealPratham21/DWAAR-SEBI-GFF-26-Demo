'use client';

import {
  fieldClassName,
  FormField,
  helperClassName,
} from '@/components/company-incorporation/form-primitives';
import {
  ISSUE_PURPOSE_OPTIONS,
  MERCHANT_BANKER_APPOINTED_OPTIONS,
  PREPARATION_STAGE_OPTIONS,
  PROPOSED_ISSUE_TYPE_OPTIONS,
  SME_EXCHANGE_OPTIONS,
  TARGET_TIMELINE_OPTIONS,
} from '@/lib/onboarding/sme/constants';
import type { IpoIntentStepData } from '@/lib/onboarding/sme/types';

export function IpoIntentStep({
  data,
  errors,
  onChange,
}: {
  data: IpoIntentStepData;
  errors?: Record<string, string>;
  onChange: (data: IpoIntentStepData) => void;
}) {
  const update = (patch: Partial<IpoIntentStepData>) => onChange({ ...data, ...patch });

  const togglePurpose = (value: string) => {
    const exists = data.primaryPurposes.includes(value);
    update({
      primaryPurposes: exists
        ? data.primaryPurposes.filter((item) => item !== value)
        : [...data.primaryPurposes, value],
    });
  };

  return (
    <div className="space-y-6">
      <FormField
        label="Proposed issue type"
        htmlFor="proposedIssueType"
        required
        error={errors?.proposedIssueType}
      >
        <select
          id="proposedIssueType"
          className={fieldClassName}
          value={data.proposedIssueType}
          onChange={(e) => update({ proposedIssueType: e.target.value })}
        >
          <option value="">Select issue type</option>
          {PROPOSED_ISSUE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      <div className="space-y-3">
        <FormField
          label="Indicative issue size (₹ crore)"
          htmlFor="issueSizeCrore"
          required={!data.issueSizeNotDecided}
          error={errors?.issueSizeCrore}
        >
          <input
            id="issueSizeCrore"
            type="number"
            min={0}
            step="0.01"
            disabled={data.issueSizeNotDecided}
            className={fieldClassName}
            value={data.issueSizeCrore}
            onChange={(e) => update({ issueSizeCrore: e.target.value })}
          />
        </FormField>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={data.issueSizeNotDecided}
            onChange={(e) =>
              update({
                issueSizeNotDecided: e.target.checked,
                issueSizeCrore: e.target.checked ? '' : data.issueSizeCrore,
              })
            }
          />
          Not Decided
        </label>
      </div>

      <FormField label="Target timeline" htmlFor="targetTimeline" required error={errors?.targetTimeline}>
        <select
          id="targetTimeline"
          className={fieldClassName}
          value={data.targetTimeline}
          onChange={(e) => update({ targetTimeline: e.target.value })}
        >
          <option value="">Select timeline</option>
          {TARGET_TIMELINE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Intended SME exchange"
        htmlFor="intendedExchange"
        required
        helper="Selection does not imply exchange eligibility or approval."
        error={errors?.intendedExchange}
      >
        <select
          id="intendedExchange"
          className={fieldClassName}
          value={data.intendedExchange}
          onChange={(e) => update({ intendedExchange: e.target.value })}
        >
          <option value="">Select exchange</option>
          {SME_EXCHANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">
          Primary purpose of the issue <span className="text-destructive">*</span>
        </legend>
        <div className="grid sm:grid-cols-2 gap-2">
          {ISSUE_PURPOSE_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.primaryPurposes.includes(option.value)}
                onChange={() => togglePurpose(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors?.primaryPurposes ? (
          <p className="text-sm text-destructive">{errors.primaryPurposes}</p>
        ) : null}
      </fieldset>

      {data.primaryPurposes.includes('other') ? (
        <FormField
          label="Other purpose description"
          htmlFor="primaryPurposeOther"
          required
          error={errors?.primaryPurposeOther}
        >
          <input
            id="primaryPurposeOther"
            className={fieldClassName}
            value={data.primaryPurposeOther}
            onChange={(e) => update({ primaryPurposeOther: e.target.value })}
          />
        </FormField>
      ) : null}

      <FormField
        label="Merchant banker appointed?"
        htmlFor="merchantBankerAppointed"
        required
        error={errors?.merchantBankerAppointed}
      >
        <select
          id="merchantBankerAppointed"
          className={fieldClassName}
          value={data.merchantBankerAppointed}
          onChange={(e) => update({ merchantBankerAppointed: e.target.value })}
        >
          <option value="">Select status</option>
          {MERCHANT_BANKER_APPOINTED_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      {data.merchantBankerAppointed === 'yes' ? (
        <FormField
          label="Merchant banker name"
          htmlFor="merchantBankerName"
          required
          error={errors?.merchantBankerName}
        >
          <input
            id="merchantBankerName"
            className={fieldClassName}
            value={data.merchantBankerName}
            onChange={(e) => update({ merchantBankerName: e.target.value })}
          />
        </FormField>
      ) : null}

      <FormField
        label="Current preparation stage"
        htmlFor="preparationStage"
        required
        error={errors?.preparationStage}
      >
        <select
          id="preparationStage"
          className={fieldClassName}
          value={data.preparationStage}
          onChange={(e) => update({ preparationStage: e.target.value })}
        >
          <option value="">Select stage</option>
          {PREPARATION_STAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}
