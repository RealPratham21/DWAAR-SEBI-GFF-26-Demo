'use client';

import { Plus, Trash2 } from 'lucide-react';
import { SearchableSelect } from '@/components/company-incorporation/searchable-select';
import {
  fieldClassName,
  FormField,
  helperClassName,
} from '@/components/company-incorporation/form-primitives';
import { Button } from '@/components/ui/button';
import { INDIAN_STATES_AND_UTS } from '@/lib/company-incorporation/options';
import { createRecordId } from '@/lib/company-incorporation/defaults';
import {
  EMPLOYEE_COUNT_RANGE_OPTIONS,
  GST_REGISTRATION_REQUIRED_OPTIONS,
  PRIMARY_INDUSTRY_OPTIONS,
} from '@/lib/onboarding/sme/constants';
import type { BusinessClassificationStepData, GstRegistrationEntry } from '@/lib/onboarding/sme/types';

const stateOptions = INDIAN_STATES_AND_UTS.map((state) => ({ value: state, label: state }));
const industryOptions = PRIMARY_INDUSTRY_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}));

export function BusinessClassificationStep({
  data,
  errors,
  onChange,
}: {
  data: BusinessClassificationStepData;
  errors?: Record<string, string>;
  onChange: (data: BusinessClassificationStepData) => void;
}) {
  const update = (patch: Partial<BusinessClassificationStepData>) => onChange({ ...data, ...patch });

  const addGst = () => {
    const entry: GstRegistrationEntry = {
      id: createRecordId(),
      gstin: '',
      state: '',
      principalPlaceOfBusiness: '',
    };
    update({ gstRegistrations: [...data.gstRegistrations, entry] });
  };

  const updateGst = (id: string, patch: Partial<GstRegistrationEntry>) => {
    update({
      gstRegistrations: data.gstRegistrations.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    });
  };

  const removeGst = (id: string) => {
    update({ gstRegistrations: data.gstRegistrations.filter((entry) => entry.id !== id) });
  };

  return (
    <div className="space-y-6">
      <FormField label="Primary industry" htmlFor="primaryIndustry" required error={errors?.primaryIndustry}>
        <SearchableSelect
          id="primaryIndustry"
          options={industryOptions}
          value={data.primaryIndustry}
          onChange={(value) => update({ primaryIndustry: value })}
          aria-invalid={Boolean(errors?.primaryIndustry)}
        />
      </FormField>

      {data.primaryIndustry === 'other' ? (
        <FormField
          label="Primary industry description"
          htmlFor="primaryIndustryOther"
          required
          error={errors?.primaryIndustryOther}
        >
          <input
            id="primaryIndustryOther"
            className={fieldClassName}
            value={data.primaryIndustryOther}
            onChange={(e) => update({ primaryIndustryOther: e.target.value })}
          />
        </FormField>
      ) : null}

      <FormField
        label="Business sector"
        htmlFor="businessSector"
        required
        helper="Use the sector that most closely represents the company’s principal revenue-generating activity."
        error={errors?.businessSector}
      >
        <input
          id="businessSector"
          className={fieldClassName}
          value={data.businessSector}
          onChange={(e) => update({ businessSector: e.target.value })}
        />
      </FormField>

      <FormField
        label="Short description of operations"
        htmlFor="operationsDescription"
        required
        helper="Initial summary only — not the final DRHP business disclosure."
        error={errors?.operationsDescription}
      >
        <textarea
          id="operationsDescription"
          rows={4}
          className={fieldClassName}
          value={data.operationsDescription}
          onChange={(e) => update({ operationsDescription: e.target.value })}
        />
      </FormField>

      <FormField label="PAN" htmlFor="pan" required error={errors?.pan}>
        <input
          id="pan"
          className={fieldClassName}
          value={data.pan}
          onChange={(e) => update({ pan: e.target.value.toUpperCase() })}
        />
      </FormField>

      <FormField
        label="Is the company required to hold a GST registration?"
        htmlFor="gstRegistrationRequired"
        required
        error={errors?.gstRegistrationRequired}
      >
        <select
          id="gstRegistrationRequired"
          className={fieldClassName}
          value={data.gstRegistrationRequired}
          onChange={(e) => update({ gstRegistrationRequired: e.target.value })}
        >
          <option value="">Select an option</option>
          {GST_REGISTRATION_REQUIRED_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-medium text-foreground">GST registrations</h4>
          <Button type="button" variant="outline" size="sm" onClick={addGst}>
            <Plus size={16} />
            Add GSTIN
          </Button>
        </div>
        {errors?.gstRegistrations ? (
          <p className="text-sm text-destructive">{errors.gstRegistrations}</p>
        ) : null}
        {data.gstRegistrations.length === 0 ? (
          <p className={helperClassName}>No GSTIN records added yet.</p>
        ) : (
          data.gstRegistrations.map((entry, index) => (
            <div key={entry.id} className="rounded-lg border border-border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">GSTIN {index + 1}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeGst(entry.id)}>
                  <Trash2 size={16} />
                  Remove
                </Button>
              </div>
              <FormField label="GSTIN" htmlFor={`gstin-${entry.id}`} required>
                <input
                  id={`gstin-${entry.id}`}
                  className={fieldClassName}
                  value={entry.gstin}
                  onChange={(e) => updateGst(entry.id, { gstin: e.target.value.toUpperCase() })}
                />
              </FormField>
              <FormField label="State or Union Territory" htmlFor={`gst-state-${entry.id}`} required>
                <SearchableSelect
                  id={`gst-state-${entry.id}`}
                  options={stateOptions}
                  value={entry.state}
                  onChange={(value) => updateGst(entry.id, { state: value })}
                />
              </FormField>
              <FormField label="Principal place of business" htmlFor={`gst-ppob-${entry.id}`}>
                <input
                  id={`gst-ppob-${entry.id}`}
                  className={fieldClassName}
                  value={entry.principalPlaceOfBusiness}
                  onChange={(e) =>
                    updateGst(entry.id, { principalPlaceOfBusiness: e.target.value })
                  }
                />
              </FormField>
            </div>
          ))
        )}
      </div>

      <FormField label="Udyam registration" htmlFor="udyamRegistration" error={errors?.udyamRegistration}>
        <input
          id="udyamRegistration"
          className={fieldClassName}
          value={data.udyamRegistration}
          onChange={(e) => update({ udyamRegistration: e.target.value.toUpperCase() })}
        />
      </FormField>

      <FormField label="Import Export Code" htmlFor="importExportCode" error={errors?.importExportCode}>
        <input
          id="importExportCode"
          className={fieldClassName}
          value={data.importExportCode}
          onChange={(e) => update({ importExportCode: e.target.value.toUpperCase() })}
        />
      </FormField>

      <FormField
        label="Employee count range"
        htmlFor="employeeCountRange"
        required
        error={errors?.employeeCountRange}
      >
        <select
          id="employeeCountRange"
          className={fieldClassName}
          value={data.employeeCountRange}
          onChange={(e) => update({ employeeCountRange: e.target.value })}
        >
          <option value="">Select range</option>
          {EMPLOYEE_COUNT_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}
