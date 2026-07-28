'use client';

import { SearchableSelect } from '@/components/company-incorporation/searchable-select';
import {
  fieldClassName,
  FormField,
  helperClassName,
} from '@/components/company-incorporation/form-primitives';
import { INDIAN_STATES_AND_UTS, REGISTRAR_OF_COMPANIES_OPTIONS } from '@/lib/company-incorporation/options';
import { COMPANY_CLASS_OPTIONS } from '@/lib/onboarding/sme/constants';
import type { CompanyIdentityStepData } from '@/lib/onboarding/sme/types';

const stateOptions = INDIAN_STATES_AND_UTS.map((state) => ({ value: state, label: state }));
const rocOptions = REGISTRAR_OF_COMPANIES_OPTIONS.map((roc) => ({ value: roc, label: roc }));

export function CompanyIdentityStep({
  data,
  errors,
  onChange,
}: {
  data: CompanyIdentityStepData;
  errors?: Record<string, string>;
  onChange: (data: CompanyIdentityStepData) => void;
}) {
  const update = (patch: Partial<CompanyIdentityStepData>) => onChange({ ...data, ...patch });
  const updateOffice = (patch: Partial<CompanyIdentityStepData['registeredOffice']>) =>
    onChange({ ...data, registeredOffice: { ...data.registeredOffice, ...patch } });

  const officeErrors = (field: string) =>
    errors?.[`registeredOffice.${field}`] ?? errors?.[field];

  return (
    <div className="space-y-6">
      <p className={helperClassName}>
        This initial identity will later appear in Company Profile and Company & Incorporation.
        Supporting documents will still be required.
      </p>

      <FormField label="Current legal name" htmlFor="legalName" required error={errors?.legalName}>
        <input
          id="legalName"
          className={fieldClassName}
          value={data.legalName}
          onChange={(e) => update({ legalName: e.target.value })}
        />
      </FormField>

      <FormField label="CIN" htmlFor="cin" required error={errors?.cin}>
        <input
          id="cin"
          className={fieldClassName}
          value={data.cin}
          onChange={(e) => update({ cin: e.target.value.toUpperCase() })}
        />
      </FormField>

      <FormField
        label="Date of incorporation"
        htmlFor="incorporationDate"
        required
        error={errors?.incorporationDate}
      >
        <input
          id="incorporationDate"
          type="date"
          className={fieldClassName}
          value={data.incorporationDate}
          onChange={(e) => update({ incorporationDate: e.target.value })}
        />
      </FormField>

      <FormField label="Company class" htmlFor="companyClass" required error={errors?.companyClass}>
        <select
          id="companyClass"
          className={fieldClassName}
          value={data.companyClass}
          onChange={(e) => update({ companyClass: e.target.value })}
        >
          <option value="">Select class</option>
          {COMPANY_CLASS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Registered state or Union Territory"
        htmlFor="registeredState"
        required
        error={errors?.registeredState}
      >
        <SearchableSelect
          id="registeredState"
          options={stateOptions}
          value={data.registeredState}
          onChange={(value) => update({ registeredState: value })}
          aria-invalid={Boolean(errors?.registeredState)}
        />
      </FormField>

      <FormField
        label="Registrar of Companies"
        htmlFor="registrarOfCompanies"
        required
        error={errors?.registrarOfCompanies}
      >
        <SearchableSelect
          id="registrarOfCompanies"
          options={rocOptions}
          value={data.registrarOfCompanies}
          onChange={(value) => update({ registrarOfCompanies: value })}
          aria-invalid={Boolean(errors?.registrarOfCompanies)}
        />
      </FormField>

      <div className="space-y-4 rounded-lg border border-border p-4">
        <h4 className="font-medium text-foreground">Registered office address</h4>
        <FormField label="Address line 1" htmlFor="addressLine1" required error={officeErrors('addressLine1')}>
          <input
            id="addressLine1"
            className={fieldClassName}
            value={data.registeredOffice.addressLine1}
            onChange={(e) => updateOffice({ addressLine1: e.target.value })}
          />
        </FormField>
        <FormField label="Address line 2" htmlFor="addressLine2" error={officeErrors('addressLine2')}>
          <input
            id="addressLine2"
            className={fieldClassName}
            value={data.registeredOffice.addressLine2}
            onChange={(e) => updateOffice({ addressLine2: e.target.value })}
          />
        </FormField>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Locality" htmlFor="locality" error={officeErrors('locality')}>
            <input
              id="locality"
              className={fieldClassName}
              value={data.registeredOffice.locality}
              onChange={(e) => updateOffice({ locality: e.target.value })}
            />
          </FormField>
          <FormField label="City" htmlFor="city" required error={officeErrors('city')}>
            <input
              id="city"
              className={fieldClassName}
              value={data.registeredOffice.city}
              onChange={(e) => updateOffice({ city: e.target.value })}
            />
          </FormField>
          <FormField label="District" htmlFor="district" error={officeErrors('district')}>
            <input
              id="district"
              className={fieldClassName}
              value={data.registeredOffice.district}
              onChange={(e) => updateOffice({ district: e.target.value })}
            />
          </FormField>
          <FormField label="State or Union Territory" htmlFor="officeState" required error={officeErrors('state')}>
            <SearchableSelect
              id="officeState"
              options={stateOptions}
              value={data.registeredOffice.state}
              onChange={(value) => updateOffice({ state: value })}
              aria-invalid={Boolean(officeErrors('state'))}
            />
          </FormField>
          <FormField label="PIN code" htmlFor="pinCode" required error={officeErrors('pinCode')}>
            <input
              id="pinCode"
              className={fieldClassName}
              inputMode="numeric"
              value={data.registeredOffice.pinCode}
              onChange={(e) => updateOffice({ pinCode: e.target.value })}
            />
          </FormField>
          <FormField label="Country" htmlFor="country" required error={officeErrors('country')}>
            <input
              id="country"
              className={fieldClassName}
              value={data.registeredOffice.country}
              onChange={(e) => updateOffice({ country: e.target.value })}
            />
          </FormField>
        </div>
      </div>

      <FormField label="Company email" htmlFor="companyEmail" required error={errors?.companyEmail}>
        <input
          id="companyEmail"
          type="email"
          className={fieldClassName}
          value={data.companyEmail}
          onChange={(e) => update({ companyEmail: e.target.value })}
        />
      </FormField>

      <FormField label="Company website" htmlFor="companyWebsite" error={errors?.companyWebsite}>
        <input
          id="companyWebsite"
          type="url"
          className={fieldClassName}
          placeholder="https://"
          value={data.companyWebsite}
          onChange={(e) => update({ companyWebsite: e.target.value })}
        />
      </FormField>
    </div>
  );
}
