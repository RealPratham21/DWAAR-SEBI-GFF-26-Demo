'use client';

import {
  asEnumValue,
  ComputedStat,
  FieldGrid,
  IntermediarySelect,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/intermediaries-filing/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/intermediaries-filing/repeatable-card';
import { IntermediariesFilingSectionActions } from '@/components/intermediaries-filing/section-actions';
import { useIntermediariesFiling } from '@/lib/intermediaries-filing/context';
import {
  createEmptyNominatedInvestorRecord,
  createEmptyUnderwritingCommitmentRecord,
} from '@/lib/intermediaries-filing/defaults';
import { PROFESSIONAL_CONFIRMATION_OPTIONS } from '@/lib/intermediaries-filing/options';
import type {
  ProfessionalConfirmationStatus,
  UnderwritingMarketMakingAndDistributionArrangements,
} from '@/lib/schemas/intermediaries-filing';

const SECTION_ID = 'underwriting-market-making-and-distribution-arrangements' as const;

export function UnderwritingForm() {
  const { payload, model, updateSection } = useIntermediariesFiling();
  const value = payload.underwritingMarketMakingAndDistributionArrangements;

  const set = (next: UnderwritingMarketMakingAndDistributionArrangements) => {
    updateSection('underwritingMarketMakingAndDistributionArrangements', next, SECTION_ID);
  };

  const setSummary = (
    patch: Partial<UnderwritingMarketMakingAndDistributionArrangements['underwritingSummary']>,
  ) => set({ ...value, underwritingSummary: { ...value.underwritingSummary, ...patch } });

  const setCommitments = (
    underwritingCommitments: UnderwritingMarketMakingAndDistributionArrangements['underwritingCommitments'],
  ) => set({ ...value, underwritingCommitments });

  const setCommitment = (
    index: number,
    next: UnderwritingMarketMakingAndDistributionArrangements['underwritingCommitments'][number],
  ) => setCommitments(replaceAt(value.underwritingCommitments, index, next));

  const setNominatedInvestors = (
    nominatedInvestors: UnderwritingMarketMakingAndDistributionArrangements['nominatedInvestors'],
  ) => set({ ...value, nominatedInvestors });

  const setNominatedInvestor = (
    index: number,
    next: UnderwritingMarketMakingAndDistributionArrangements['nominatedInvestors'][number],
  ) => setNominatedInvestors(replaceAt(value.nominatedInvestors, index, next));

  const setMarketMakerConfig = (
    patch: Partial<UnderwritingMarketMakingAndDistributionArrangements['marketMakerConfiguration']>,
  ) => set({ ...value, marketMakerConfiguration: { ...value.marketMakerConfiguration, ...patch } });

  const setMarketMakerReservation = (
    patch: Partial<UnderwritingMarketMakingAndDistributionArrangements['marketMakerReservation']>,
  ) => set({ ...value, marketMakerReservation: { ...value.marketMakerReservation, ...patch } });

  const setMarketMakingArrangement = (
    patch: Partial<UnderwritingMarketMakingAndDistributionArrangements['marketMakingArrangement']>,
  ) => set({ ...value, marketMakingArrangement: { ...value.marketMakingArrangement, ...patch } });

  return (
    <SectionCard
      title="Underwriting, Market Making & Distribution Arrangements"
      description="Underwriting commitments, nominated investors, Market Maker configuration and reservation."
    >
      <SubSection title="Underwriting summary">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ComputedStat
            label="Total underwriting %"
            value={model.underwritingAggregates.totalUnderwritingPercentage || '—'}
          />
          <ComputedStat
            label="Uncovered shares"
            value={model.underwritingAggregates.uncoveredShares || '—'}
          />
          <ComputedStat
            label="Own-account %"
            value={model.underwritingAggregates.ownAccountPercentage || '—'}
          />
        </div>
        <FieldGrid columns={3}>
          <TextInputField
            id="issue-shares"
            label="Issue shares"
            value={value.underwritingSummary.issueShares}
            onChange={(next) => setSummary({ issueShares: next })}
          />
          <TextInputField
            id="issue-amount"
            label="Issue amount"
            value={value.underwritingSummary.issueAmount}
            onChange={(next) => setSummary({ issueAmount: next })}
          />
          <TextInputField
            id="total-underwriting-commitment"
            label="Total underwriting commitment"
            value={value.underwritingSummary.totalUnderwritingCommitment}
            onChange={(next) => setSummary({ totalUnderwritingCommitment: next })}
          />
          <TextInputField
            id="total-underwriting-percentage"
            label="Total underwriting percentage"
            value={value.underwritingSummary.totalUnderwritingPercentage}
            onChange={(next) => setSummary({ totalUnderwritingPercentage: next })}
          />
          <TernaryField
            id="underwriting-agreement-executed"
            label="Underwriting agreement executed"
            value={value.underwritingSummary.underwritingAgreementExecuted}
            onChange={(next) => setSummary({ underwritingAgreementExecuted: next })}
          />
          <SelectField
            id="underwriting-professional-confirmation"
            label="Professional confirmation"
            value={value.underwritingSummary.professionalConfirmation}
            onChange={(next) =>
              setSummary({
                professionalConfirmation: asEnumValue<ProfessionalConfirmationStatus>(next),
              })
            }
            options={[{ value: '', label: 'Select…' }, ...PROFESSIONAL_CONFIRMATION_OPTIONS]}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Underwriting commitments"
        addLabel="Add commitment"
        onAdd={() =>
          setCommitments([...value.underwritingCommitments, createEmptyUnderwritingCommitmentRecord()])
        }
        emptyMessage="No underwriting commitments recorded."
        count={value.underwritingCommitments.length}
      >
        {value.underwritingCommitments.map((commitment, index) => (
          <RepeatableCard
            key={commitment.underwritingCommitmentId}
            title={`Commitment ${index + 1}`}
            onRemove={() => setCommitments(removeAt(value.underwritingCommitments, index))}
            removeLabel="Remove commitment"
          >
            <FieldGrid columns={3}>
              <IntermediarySelect
                id={`commitment-intermediary-${index}`}
                label="Intermediary"
                value={commitment.intermediaryId}
                onChange={(next) =>
                  setCommitment(index, { ...commitment, intermediaryId: next })
                }
                payload={payload}
              />
              <TextInputField
                id={`shares-underwritten-${index}`}
                label="Shares underwritten"
                value={commitment.sharesUnderwritten}
                onChange={(next) =>
                  setCommitment(index, { ...commitment, sharesUnderwritten: next })
                }
              />
              <TextInputField
                id={`amount-underwritten-${index}`}
                label="Amount underwritten"
                value={commitment.amountUnderwritten}
                onChange={(next) =>
                  setCommitment(index, { ...commitment, amountUnderwritten: next })
                }
              />
              <TextInputField
                id={`percentage-of-issue-${index}`}
                label="Percentage of issue"
                value={commitment.percentageOfIssue}
                onChange={(next) =>
                  setCommitment(index, { ...commitment, percentageOfIssue: next })
                }
              />
              <TernaryField
                id={`own-account-${index}`}
                label="Own account"
                value={commitment.ownAccount}
                onChange={(next) => setCommitment(index, { ...commitment, ownAccount: next })}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Nominated investors"
        addLabel="Add nominated investor"
        onAdd={() =>
          setNominatedInvestors([...value.nominatedInvestors, createEmptyNominatedInvestorRecord()])
        }
        emptyMessage="No nominated investors recorded."
        count={value.nominatedInvestors.length}
      >
        {value.nominatedInvestors.map((investor, index) => (
          <RepeatableCard
            key={investor.nominatedInvestorId}
            title={investor.investorName || `Nominated investor ${index + 1}`}
            onRemove={() => setNominatedInvestors(removeAt(value.nominatedInvestors, index))}
            removeLabel="Remove investor"
          >
            <FieldGrid columns={3}>
              <TernaryField
                id={`nominated-applicable-${index}`}
                label="Applicable"
                value={investor.applicable}
                onChange={(next) => setNominatedInvestor(index, { ...investor, applicable: next })}
              />
              <TextInputField
                id={`investor-name-${index}`}
                label="Investor name"
                value={investor.investorName}
                onChange={(next) =>
                  setNominatedInvestor(index, { ...investor, investorName: next })
                }
              />
              <IntermediarySelect
                id={`linked-entity-${index}`}
                label="Linked intermediary entity"
                value={investor.linkedIntermediaryEntityId}
                onChange={(next) =>
                  setNominatedInvestor(index, { ...investor, linkedIntermediaryEntityId: next })
                }
                payload={payload}
              />
              <TernaryField
                id={`disclosure-included-${index}`}
                label="Disclosure included"
                value={investor.disclosureIncluded}
                onChange={(next) =>
                  setNominatedInvestor(index, { ...investor, disclosureIncluded: next })
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Market Maker configuration">
        <FieldGrid columns={3}>
          <IntermediarySelect
            id="market-maker-intermediary"
            label="Market Maker intermediary"
            value={value.marketMakerConfiguration.marketMakerIntermediaryId}
            onChange={(next) => setMarketMakerConfig({ marketMakerIntermediaryId: next })}
            payload={payload}
          />
          <TernaryField
            id="market-making-agreement-executed"
            label="Agreement executed"
            value={value.marketMakerConfiguration.agreementExecuted}
            onChange={(next) => setMarketMakerConfig({ agreementExecuted: next })}
          />
          <TextInputField
            id="mandatory-period"
            label="Mandatory period"
            value={value.marketMakerConfiguration.mandatoryPeriod}
            onChange={(next) => setMarketMakerConfig({ mandatoryPeriod: next })}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Market Maker reservation">
        <FieldGrid columns={3}>
          <TextInputField
            id="reserved-shares"
            label="Reserved shares"
            value={value.marketMakerReservation.reservedShares}
            onChange={(next) => setMarketMakerReservation({ reservedShares: next })}
          />
          <TextInputField
            id="reservation-percentage"
            label="Percentage"
            value={value.marketMakerReservation.percentage}
            onChange={(next) => setMarketMakerReservation({ percentage: next })}
          />
          <TextInputField
            id="allocation-status"
            label="Allocation status"
            value={value.marketMakerReservation.allocationStatus}
            onChange={(next) => setMarketMakerReservation({ allocationStatus: next })}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Market making arrangement">
        <FieldGrid columns={3}>
          <TernaryField
            id="quote-obligations-reviewed"
            label="Quote obligations reviewed"
            value={value.marketMakingArrangement.quoteObligationsReviewed}
            onChange={(next) => setMarketMakingArrangement({ quoteObligationsReviewed: next })}
          />
          <TernaryField
            id="agreement-disclosed"
            label="Agreement disclosed"
            value={value.marketMakingArrangement.agreementDisclosed}
            onChange={(next) => setMarketMakingArrangement({ agreementDisclosed: next })}
          />
        </FieldGrid>
        <TextAreaField
          id="market-making-notes"
          label="Notes"
          value={value.marketMakingArrangement.notes}
          onChange={(next) => setMarketMakingArrangement({ notes: next })}
        />
      </SubSection>

      <IntermediariesFilingSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
