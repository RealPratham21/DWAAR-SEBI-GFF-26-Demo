'use client';

import {
  ComputedStat,
  DecimalInputField,
  FieldGrid,
  PureOfsBanner,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
} from '@/components/objects-of-issue/form-helpers';
import { ObjectsOfIssueSectionActions } from '@/components/objects-of-issue/section-actions';
import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { useObjectsOfIssue } from '@/lib/objects-of-issue/context';
import { EM_DASH, formatMoney } from '@/lib/objects-of-issue/format';
import { DECLARED_OFFER_TYPE_OPTIONS } from '@/lib/objects-of-issue/options';
import type { DeclaredOfferType, ProceedsAndFundingSummary } from '@/lib/objects-of-issue/types';

const SECTION_ID = 'proceeds-and-funding-summary' as const;

export function ProceedsFundingForm() {
  const { payload, updateSection, model } = useObjectsOfIssue();
  const value = payload.proceedsAndFundingSummary;

  const set = <K extends keyof ProceedsAndFundingSummary>(
    key: K,
    next: ProceedsAndFundingSummary[K],
  ) => {
    updateSection('proceedsAndFundingSummary', { ...value, [key]: next }, SECTION_ID);
  };

  const isPureOfs = value.declaredOfferType === 'offer-for-sale';

  return (
    <SectionCard
      title="Proceeds & Funding Summary"
      description="Offer type, gross fresh-issue proceeds, issue expenses and net proceeds available for the objects."
    >
      {isPureOfs ? <PureOfsBanner /> : null}

      <FieldGrid>
        <SelectField
          id="pf-declared-offer-type"
          label="Declared offer type"
          required
          value={value.declaredOfferType}
          onChange={(next) => set('declaredOfferType', next as DeclaredOfferType | '')}
          options={DECLARED_OFFER_TYPE_OPTIONS}
          helper="A manual placeholder for O1 — Increment O2 will read this from IPO Setup & Eligibility."
        />
        <TernaryField
          id="pf-issue-made-to-raise-funds"
          label="Issue made to raise funds for the stated objects"
          required
          value={value.issueMadeToRaiseFundsForObjects}
          onChange={(next) => set('issueMadeToRaiseFundsForObjects', next)}
        />
        <TernaryField
          id="pf-scheme-of-arrangement"
          label="Scheme of arrangement involved"
          value={value.schemeOfArrangementInvolved}
          onChange={(next) => set('schemeOfArrangementInvolved', next)}
        />
      </FieldGrid>

      {!isPureOfs ? (
        <SubSection
          title="Fresh issue proceeds"
          description="Gross proceeds from the fresh issue and estimated issue-related expenses."
        >
          <FieldGrid>
            <DecimalInputField
              id="pf-fresh-issue-gross-proceeds"
              label="Fresh issue — gross proceeds (₹)"
              required
              value={value.freshIssueGrossProceeds}
              onChange={(next) => set('freshIssueGrossProceeds', next)}
            />
            <DecimalInputField
              id="pf-issue-expenses"
              label="Estimated issue-related expenses (₹)"
              value={value.estimatedIssueRelatedExpenses}
              onChange={(next) => set('estimatedIssueRelatedExpenses', next)}
            />
            <ComputedStat
              label="Net proceeds available for objects"
              value={model.netFreshIssueProceeds ? formatMoney(model.netFreshIssueProceeds) : EM_DASH}
            />
          </FieldGrid>
        </SubSection>
      ) : (
        <SubSection
          title="Offer for sale"
          description="Proceeds from the offer for sale go to the selling shareholders, not the issuer."
        >
          <TextAreaField
            id="pf-ofs-proceeds-note"
            label="Offer-for-sale proceeds — note"
            required
            rows={2}
            placeholder="e.g. Proceeds from the offer for sale will be paid to the selling shareholder(s); the issuer will not receive any part of the offer-for-sale proceeds."
            value={value.offerForSaleProceedsNote}
            onChange={(next) => set('offerForSaleProceedsNote', next)}
          />
        </SubSection>
      )}

      <TextAreaField
        id="pf-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <ObjectsOfIssueSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
