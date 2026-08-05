'use client';

import { SectionCard } from '@/components/company-incorporation/form-primitives';
import {
  SelectField,
  TextInputField,
} from '@/components/ipo-setup/form-helpers';
import { IpoSectionSaveActions } from '@/components/ipo-setup/section-save-actions';
import { formatReferencedCompanyClass, useIpoSetup } from '@/lib/ipo-setup/context';
import {
  eligibilityProfileOptions,
  FILING_QUARTER_OPTIONS,
  preparationStageOptions,
  pricingMethodOptions,
  proposedOfferTypeOptions,
  publicConversionStatusOptions,
  targetSmePlatformOptions,
  yesNoNotSureOptions,
} from '@/lib/ipo-setup/options';
import type { IpoDirection } from '@/lib/schemas/ipo-setup';

export function IpoDirectionForm() {
  const { payload, updateSection, companyReference } = useIpoSetup();
  const value = payload.ipoDirection;

  const set = <K extends keyof IpoDirection>(key: K, next: IpoDirection[K]) => {
    updateSection('ipoDirection', { ...value, [key]: next }, 'ipo-direction');
  };

  const showTechRoute =
    value.targetSmePlatform === 'nse-emerge' ||
    value.targetSmePlatform === 'undecided' ||
    value.eligibilityProfile === 'nse-technology-startup-route';

  const conversion = value.publicCompanyConversionStatus;
  const showProposedDate = conversion === 'in-progress' || conversion === 'not-started';
  const showCompletedFields = conversion === 'completed' || conversion === 'in-progress';

  const profileOptions = showTechRoute
    ? eligibilityProfileOptions
    : eligibilityProfileOptions.filter((option) => option.value !== 'nse-technology-startup-route');

  return (
    <SectionCard
      title="IPO Direction"
      description="Capture the current preparation direction. Company class is shown from Company & Incorporation and is not edited here."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="preparationStage"
          label="Current preparation stage"
          required
          value={value.preparationStage}
          onChange={(next) => set('preparationStage', next as IpoDirection['preparationStage'])}
          options={preparationStageOptions}
        />
        <SelectField
          id="targetSmePlatform"
          label="Target SME platform"
          required
          value={value.targetSmePlatform}
          onChange={(next) => set('targetSmePlatform', next as IpoDirection['targetSmePlatform'])}
          options={targetSmePlatformOptions}
        />
        <SelectField
          id="eligibilityProfile"
          label="Eligibility profile"
          required
          value={value.eligibilityProfile}
          onChange={(next) => set('eligibilityProfile', next as IpoDirection['eligibilityProfile'])}
          options={profileOptions}
          helper={
            showTechRoute
              ? 'NSE technology-startup route is shown because NSE Emerge (or undecided) is selected.'
              : 'Technology-startup route appears when NSE Emerge is relevant.'
          }
        />
        <SelectField
          id="proposedOfferType"
          label="Proposed offer type"
          required
          value={value.proposedOfferType}
          onChange={(next) => set('proposedOfferType', next as IpoDirection['proposedOfferType'])}
          options={proposedOfferTypeOptions}
        />
        <SelectField
          id="proposedPricingMethod"
          label="Proposed pricing method"
          required
          value={value.proposedPricingMethod}
          onChange={(next) =>
            set('proposedPricingMethod', next as IpoDirection['proposedPricingMethod'])
          }
          options={pricingMethodOptions}
        />
        <SelectField
          id="targetFilingQuarter"
          label="Target filing quarter"
          value={value.targetFilingQuarter}
          onChange={(next) => set('targetFilingQuarter', next)}
          options={FILING_QUARTER_OPTIONS}
        />
        <TextInputField
          id="targetFilingFinancialYear"
          label="Target filing financial year"
          value={value.targetFilingFinancialYear}
          onChange={(next) => set('targetFilingFinancialYear', next)}
          placeholder="e.g. FY 2026-27"
        />
        <TextInputField
          id="tentativeFilingDate"
          label="Tentative filing date"
          type="date"
          value={value.tentativeFilingDate}
          onChange={(next) => set('tentativeFilingDate', next)}
          helper="Optional"
        />
        <TextInputField
          id="targetListingPeriod"
          label="Target listing period"
          value={value.targetListingPeriod}
          onChange={(next) => set('targetListingPeriod', next)}
          placeholder="e.g. H2 FY 2026-27"
          helper="Optional"
        />
      </div>

      <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">Company class (from Company & Incorporation)</p>
        <p className="mt-1 text-muted-foreground">
          {formatReferencedCompanyClass(companyReference.companyClass)}
        </p>
        {companyReference.legalName ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Legal name: {companyReference.legalName}
            {companyReference.cin ? ` · CIN ${companyReference.cin}` : ''}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Company & Incorporation identity is not available yet.
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          This workstream does not overwrite Company & Incorporation’s authoritative company class.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="publicCompanyConversionStatus"
          label="Public-company conversion status"
          required
          value={value.publicCompanyConversionStatus}
          onChange={(next) =>
            set(
              'publicCompanyConversionStatus',
              next as IpoDirection['publicCompanyConversionStatus'],
            )
          }
          options={publicConversionStatusOptions}
        />
        {showProposedDate ? (
          <TextInputField
            id="proposedConversionDate"
            label="Proposed conversion date"
            type="date"
            value={value.proposedConversionDate}
            onChange={(next) => set('proposedConversionDate', next)}
          />
        ) : null}
        {showCompletedFields ? (
          <>
            <TextInputField
              id="actualConversionDate"
              label="Actual conversion date"
              type="date"
              value={value.actualConversionDate}
              onChange={(next) => set('actualConversionDate', next)}
            />
            <TextInputField
              id="newLegalNameAfterConversion"
              label="New legal name"
              value={value.newLegalNameAfterConversion}
              onChange={(next) => set('newLegalNameAfterConversion', next)}
            />
            <TextInputField
              id="conversionSrnOrReference"
              label="Conversion SRN / reference"
              value={value.conversionSrnOrReference}
              onChange={(next) => set('conversionSrnOrReference', next)}
            />
            <SelectField
              id="freshCertificateOfIncorporationAvailable"
              label="Fresh certificate of incorporation available"
              value={value.freshCertificateOfIncorporationAvailable}
              onChange={(next) =>
                set(
                  'freshCertificateOfIncorporationAvailable',
                  next as IpoDirection['freshCertificateOfIncorporationAvailable'],
                )
              }
              options={yesNoNotSureOptions}
            />
          </>
        ) : null}
      </div>

      <IpoSectionSaveActions sectionId="ipo-direction" />
    </SectionCard>
  );
}
