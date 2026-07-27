'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  fieldClassName,
  FormActionRow,
  FormField,
  helperClassName,
  SectionCard,
} from '@/components/company-incorporation/form-primitives';
import { SearchableSelect } from '@/components/company-incorporation/searchable-select';
import { SessionSaveNotice } from '@/components/company-incorporation/session-save-notice';
import { buildClassificationSummary } from '@/lib/company-incorporation/classification-summary';
import { useCompanyIncorporation } from '@/lib/company-incorporation/context';
import type { CompanyIncorporationSessionData } from '@/lib/company-incorporation/defaults';
import { getEligibleIssuerContactPersons } from '@/lib/company-incorporation/eligible-contacts';
import {
  companyIdentitySchema,
  type CompanyIdentityInput,
} from '@/lib/schemas/company-incorporation';
import {
  companyCategoryOptions,
  companyClassOptions,
  companyStatusOptions,
  companySubCategoryOptions,
  governingActOptions,
  indianStateOptions,
  listedStatusOptions,
  registrarOfCompaniesOptions,
  specialCompanyTypeOptions,
} from '@/lib/types/company-incorporation';

export function LegalIdentityForm() {
  const { data, setIdentity, notifySaved, saveNotice, clearSaveNotice } =
    useCompanyIncorporation();
  const eligibleContacts = getEligibleIssuerContactPersons();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompanyIdentityInput>({
    resolver: zodResolver(companyIdentitySchema),
    defaultValues: data.identity,
    values: {
      ...data.identity,
      specialCompanyType: data.identity.specialCompanyType ?? 'none',
    },
  });

  const watchedClassification = watch([
    'companyClass',
    'companyCategory',
    'companySubCategory',
    'specialCompanyType',
  ]);
  const classificationSummary = buildClassificationSummary({
    companyClass: watchedClassification[0],
    companyCategory: watchedClassification[1],
    companySubCategory: watchedClassification[2],
    specialCompanyType:
      typeof watchedClassification[3] === 'string' ? watchedClassification[3] : undefined,
  });

  const onSubmit = handleSubmit((values) => {
    const specialCompanyType =
      typeof values.specialCompanyType === 'string' && values.specialCompanyType.length > 0
        ? values.specialCompanyType
        : 'none';

    setIdentity({
      ...values,
      specialCompanyType,
    } as CompanyIncorporationSessionData['identity']);
    notifySaved();
  });

  return (
    <SectionCard
      title="Legal Identity"
      description="Core incorporation and listing details as recorded with the Registrar of Companies."
    >
      {saveNotice ? <SessionSaveNotice message={saveNotice} onDismiss={clearSaveNotice} /> : null}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Current legal name"
            htmlFor="legalName"
            required
            error={errors.legalName?.message}
          >
            <input id="legalName" {...register('legalName')} className={fieldClassName} />
          </FormField>

          <FormField label="Company short name" htmlFor="shortName" error={errors.shortName?.message}>
            <input id="shortName" {...register('shortName')} className={fieldClassName} />
          </FormField>

          <FormField
            label="CIN"
            htmlFor="cin"
            required
            helper="Corporate Identity Number as issued by MCA. Basic format validation only."
            error={errors.cin?.message}
          >
            <input id="cin" {...register('cin')} className={fieldClassName} />
          </FormField>

          <FormField
            label="Registration number"
            htmlFor="registrationNumber"
            error={errors.registrationNumber?.message}
          >
            <input id="registrationNumber" {...register('registrationNumber')} className={fieldClassName} />
          </FormField>

          <FormField
            label="Date of incorporation"
            htmlFor="incorporationDate"
            required
            error={errors.incorporationDate?.message}
          >
            <input
              id="incorporationDate"
              type="date"
              {...register('incorporationDate')}
              className={fieldClassName}
            />
          </FormField>

          <FormField
            label="Incorporation city"
            htmlFor="incorporationCity"
            required
            error={errors.incorporationCity?.message}
          >
            <input id="incorporationCity" {...register('incorporationCity')} className={fieldClassName} />
          </FormField>

          <FormField
            label="Incorporation state"
            htmlFor="incorporationState"
            required
            error={errors.incorporationState?.message}
          >
            <Controller
              name="incorporationState"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  id="incorporationState"
                  options={indianStateOptions}
                  value={typeof field.value === 'string' ? field.value : ''}
                  onChange={field.onChange}
                  placeholder="Search state or UT…"
                  aria-invalid={Boolean(errors.incorporationState)}
                />
              )}
            />
          </FormField>

          <FormField
            label="Registrar of Companies"
            htmlFor="registrarOfCompanies"
            required
            helper="RoC office with jurisdiction over the company’s incorporation records."
            error={errors.registrarOfCompanies?.message}
          >
            <Controller
              name="registrarOfCompanies"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  id="registrarOfCompanies"
                  options={registrarOfCompaniesOptions}
                  value={typeof field.value === 'string' ? field.value : ''}
                  onChange={field.onChange}
                  placeholder="Search RoC office…"
                  aria-invalid={Boolean(errors.registrarOfCompanies)}
                />
              )}
            />
          </FormField>

          <FormField
            label="Company class"
            htmlFor="companyClass"
            required
            helper="Whether the company is public or private."
            error={errors.companyClass?.message}
          >
            <select id="companyClass" {...register('companyClass')} className={fieldClassName} defaultValue="">
              <option value="" disabled>
                Select company class
              </option>
              {companyClassOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Company category"
            htmlFor="companyCategory"
            required
            helper="Whether liability is limited by shares, guarantee, or is unlimited."
            error={errors.companyCategory?.message}
          >
            <select id="companyCategory" {...register('companyCategory')} className={fieldClassName} defaultValue="">
              <option value="" disabled>
                Select company category
              </option>
              {companyCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Company sub-category"
            htmlFor="companySubCategory"
            required
            helper="Ownership/control classification recorded for the company."
            error={errors.companySubCategory?.message}
          >
            <select
              id="companySubCategory"
              {...register('companySubCategory')}
              className={fieldClassName}
              defaultValue=""
            >
              <option value="" disabled>
                Select company sub-category
              </option>
              {companySubCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Special company type"
            htmlFor="specialCompanyType"
            helper="Additional statutory designation, where applicable."
            error={errors.specialCompanyType?.message}
          >
            <select
              id="specialCompanyType"
              {...register('specialCompanyType')}
              className={fieldClassName}
              defaultValue="none"
            >
              {specialCompanyTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Company status"
            htmlFor="companyStatus"
            required
            error={errors.companyStatus?.message}
          >
            <select id="companyStatus" {...register('companyStatus')} className={fieldClassName} defaultValue="">
              <option value="" disabled>
                Select company status
              </option>
              {companyStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Listed status"
            htmlFor="listedStatus"
            required
            error={errors.listedStatus?.message}
          >
            <select id="listedStatus" {...register('listedStatus')} className={fieldClassName} defaultValue="">
              <option value="" disabled>
                Select listed status
              </option>
              {listedStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Date of commencement of business"
            htmlFor="commencementDate"
            error={errors.commencementDate?.message}
          >
            <input
              id="commencementDate"
              type="date"
              {...register('commencementDate')}
              className={fieldClassName}
            />
          </FormField>

          <FormField
            label="Governing Act at original incorporation"
            htmlFor="governingAct"
            required
            error={errors.governingAct?.message}
          >
            <select id="governingAct" {...register('governingAct')} className={fieldClassName} defaultValue="">
              <option value="" disabled>
                Select governing Act
              </option>
              {governingActOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <div className="md:col-span-2 rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm font-medium text-foreground">Classification summary</p>
            <p className="text-sm text-muted-foreground mt-1">
              {classificationSummary ||
                'Select company class, category, and sub-category to generate a summary.'}
            </p>
          </div>

          <FormField label="Website" htmlFor="website" error={errors.website?.message}>
            <input id="website" type="url" {...register('website')} className={fieldClassName} />
          </FormField>

          <FormField label="Issuer email" htmlFor="email" required error={errors.email?.message}>
            <input id="email" type="email" {...register('email')} className={fieldClassName} />
          </FormField>

          <FormField label="Telephone" htmlFor="telephone" required error={errors.telephone?.message}>
            <input id="telephone" type="tel" {...register('telephone')} className={fieldClassName} />
          </FormField>

          <FormField
            label="DRHP contact person"
            htmlFor="issuerContactPersonId"
            className="md:col-span-2"
            helper="The contact person will normally be linked from the Company Secretary or Compliance Officer recorded under Management & Governance. This is required before the DRHP cover is ready for review."
            error={errors.issuerContactPersonId?.message}
          >
            {eligibleContacts.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  No eligible contact person is available yet.
                </p>
                <Link
                  href="/projects/demo/workstreams/management-governance"
                  className="text-sm text-accent hover:underline"
                >
                  Go to Management & Governance workstream
                </Link>
              </div>
            ) : (
              <Controller
                name="issuerContactPersonId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    id="issuerContactPersonId"
                    options={eligibleContacts.map((contact) => ({
                      value: contact.id,
                      label: `${contact.name} (${contact.role})`,
                    }))}
                    value={typeof field.value === 'string' ? field.value : ''}
                    onChange={field.onChange}
                    placeholder="Search contact person…"
                    aria-invalid={Boolean(errors.issuerContactPersonId)}
                  />
                )}
              />
            )}
            {eligibleContacts.length > 0 ? (
              <p className={helperClassName}>
                <Link
                  href="/projects/demo/workstreams/management-governance"
                  className="text-accent hover:underline"
                >
                  Manage contacts in Management & Governance
                </Link>
              </p>
            ) : null}
          </FormField>
        </div>

        <FormActionRow>
          <Button type="submit">Save Legal Identity</Button>
        </FormActionRow>
      </form>
    </SectionCard>
  );
}
