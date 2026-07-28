'use client';

import {
  fieldClassName,
  FormField,
  helperClassName,
} from '@/components/company-incorporation/form-primitives';
import {
  AUTHORISED_SIGNATORY_OPTIONS,
  BASIS_OF_AUTHORITY_OPTIONS,
  DESIGNATION_EXAMPLES,
  RELATIONSHIP_OPTIONS,
  YES_NO_OPTIONS,
} from '@/lib/onboarding/sme/constants';
import type { RoleAuthorityStepData } from '@/lib/onboarding/sme/types';

function fieldError(errors: Record<string, string> | undefined, path: string) {
  return errors?.[path] ?? errors?.[`alternateContact.${path}`];
}

export function RoleAuthorityStep({
  data,
  errors,
  onChange,
}: {
  data: RoleAuthorityStepData;
  errors?: Record<string, string>;
  onChange: (data: RoleAuthorityStepData) => void;
}) {
  const update = (patch: Partial<RoleAuthorityStepData>) => onChange({ ...data, ...patch });
  const updateAlternate = (patch: Partial<RoleAuthorityStepData['alternateContact']>) =>
    onChange({ ...data, alternateContact: { ...data.alternateContact, ...patch } });

  const needsBasis = data.authorisedSignatory === 'yes' || data.authorisedSignatory === 'unsure';
  const showAlternate =
    data.primaryOnboardingContact === 'no' || data.addAlternateContact;

  return (
    <div className="space-y-6">
      <FormField
        label="Designation"
        htmlFor="designation"
        required
        helper={`Examples: ${DESIGNATION_EXAMPLES.join(', ')}`}
        error={errors?.designation}
      >
        <input
          id="designation"
          className={fieldClassName}
          value={data.designation}
          onChange={(e) => update({ designation: e.target.value })}
        />
      </FormField>

      <FormField label="Relationship with the company" htmlFor="relationship" required error={errors?.relationship}>
        <select
          id="relationship"
          className={fieldClassName}
          value={data.relationship}
          onChange={(e) => update({ relationship: e.target.value })}
        >
          <option value="">Select relationship</option>
          {RELATIONSHIP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      {data.relationship === 'other' ? (
        <FormField label="Relationship description" htmlFor="relationshipOther" required error={errors?.relationshipOther}>
          <input
            id="relationshipOther"
            className={fieldClassName}
            value={data.relationshipOther}
            onChange={(e) => update({ relationshipOther: e.target.value })}
          />
        </FormField>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">
          Are you an authorised signatory? <span className="text-destructive">*</span>
        </legend>
        <div className="flex flex-wrap gap-4">
          {AUTHORISED_SIGNATORY_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="authorisedSignatory"
                value={option.value}
                checked={data.authorisedSignatory === option.value}
                onChange={() => update({ authorisedSignatory: option.value })}
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors?.authorisedSignatory ? (
          <p className="text-sm text-destructive">{errors.authorisedSignatory}</p>
        ) : null}
      </fieldset>

      {needsBasis ? (
        <>
          <FormField label="Basis of authority" htmlFor="basisOfAuthority" required error={errors?.basisOfAuthority}>
            <select
              id="basisOfAuthority"
              className={fieldClassName}
              value={data.basisOfAuthority}
              onChange={(e) => update({ basisOfAuthority: e.target.value })}
            >
              <option value="">Select basis</option>
              {BASIS_OF_AUTHORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          {data.basisOfAuthority === 'other' ? (
            <FormField
              label="Basis of authority description"
              htmlFor="basisOfAuthorityOther"
              required
              error={errors?.basisOfAuthorityOther}
            >
              <input
                id="basisOfAuthorityOther"
                className={fieldClassName}
                value={data.basisOfAuthorityOther}
                onChange={(e) => update({ basisOfAuthorityOther: e.target.value })}
              />
            </FormField>
          ) : null}
        </>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">
          Are you the primary Dwaar onboarding contact? <span className="text-destructive">*</span>
        </legend>
        <div className="flex gap-4">
          {YES_NO_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="primaryOnboardingContact"
                value={option.value}
                checked={data.primaryOnboardingContact === option.value}
                onChange={() =>
                  update({
                    primaryOnboardingContact: option.value,
                    addAlternateContact: option.value === 'no' ? false : data.addAlternateContact,
                  })
                }
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors?.primaryOnboardingContact ? (
          <p className="text-sm text-destructive">{errors.primaryOnboardingContact}</p>
        ) : null}
      </fieldset>

      {data.primaryOnboardingContact === 'yes' ? (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={data.addAlternateContact}
            onChange={(e) => update({ addAlternateContact: e.target.checked })}
          />
          Add an alternate contact
        </label>
      ) : null}

      {showAlternate ? (
        <div className="rounded-lg border border-border p-4 space-y-4">
          <h4 className="font-medium text-foreground">Alternate contact</h4>
          <FormField label="Full name" htmlFor="alt-fullName" required error={fieldError(errors, 'fullName')}>
            <input
              id="alt-fullName"
              className={fieldClassName}
              value={data.alternateContact.fullName}
              onChange={(e) => updateAlternate({ fullName: e.target.value })}
            />
          </FormField>
          <FormField label="Designation" htmlFor="alt-designation" required error={fieldError(errors, 'designation')}>
            <input
              id="alt-designation"
              className={fieldClassName}
              value={data.alternateContact.designation}
              onChange={(e) => updateAlternate({ designation: e.target.value })}
            />
          </FormField>
          <FormField label="Work email" htmlFor="alt-email" required error={fieldError(errors, 'email')}>
            <input
              id="alt-email"
              type="email"
              className={fieldClassName}
              value={data.alternateContact.email}
              onChange={(e) => updateAlternate({ email: e.target.value })}
            />
          </FormField>
          <FormField label="Mobile number" htmlFor="alt-mobile" required error={fieldError(errors, 'mobile')}>
            <input
              id="alt-mobile"
              type="tel"
              className={fieldClassName}
              value={data.alternateContact.mobile}
              onChange={(e) => updateAlternate({ mobile: e.target.value })}
            />
          </FormField>
        </div>
      ) : null}
    </div>
  );
}
