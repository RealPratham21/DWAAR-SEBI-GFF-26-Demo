'use client';

import { useMemo } from 'react';
import {
  ComputedStat,
  DateField,
  DecimalInputField,
  FieldGrid,
  SelectField,
  StatGrid,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/capital-ownership/form-helpers';
import {
  hasRecordData,
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/capital-ownership/repeatable-card';
import { CapitalOwnershipSectionActions } from '@/components/capital-ownership/section-actions';
import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { useCapitalOwnership } from '@/lib/capital-ownership/context';
import {
  createEmptyEncumbrance,
  createEmptyPromoterContributionLot,
} from '@/lib/capital-ownership/defaults';
import { formatPercent, formatShares } from '@/lib/capital-ownership/format';
import {
  considerationTypeOptions,
  contributionAcquisitionModeOptions,
  encumbranceTypeOptions,
  lockInPeriodOptions,
  shareholderCategoryOptions,
} from '@/lib/capital-ownership/options';
import type {
  Encumbrance,
  PromoterContributionLockInAndEncumbrances,
  PromoterContributionLot,
} from '@/lib/capital-ownership/types';

const SECTION_ID = 'promoter-contribution-lock-in' as const;

export function ContributionLockInForm() {
  const { payload, updateSection, model } = useCapitalOwnership();
  const value = payload.promoterContributionLockInAndEncumbrances;
  const lockIn = model.lockIn;
  const contributionApplicable = value.minimumPromoterContributionApplicable !== 'no';

  const shareholderOptions = useMemo(
    () =>
      payload.shareholdersAndBeneficialOwnership.shareholders.map((item, index) => ({
        value: item.id,
        label: item.name || `Shareholder ${index + 1}`,
      })),
    [payload.shareholdersAndBeneficialOwnership.shareholders],
  );

  const promoterOptions = useMemo(
    () =>
      payload.promotersAndControl.promoters.map((item, index) => ({
        value: item.id,
        label: item.name || `Promoter ${index + 1}`,
      })),
    [payload.promotersAndControl.promoters],
  );

  const set = <K extends keyof PromoterContributionLockInAndEncumbrances>(
    key: K,
    next: PromoterContributionLockInAndEncumbrances[K],
  ) => {
    updateSection('promoterContributionLockInAndEncumbrances', { ...value, [key]: next }, SECTION_ID);
  };

  const setLot = <K extends keyof PromoterContributionLot>(
    index: number,
    key: K,
    next: PromoterContributionLot[K],
  ) => {
    set(
      'contributionLots',
      replaceAt(value.contributionLots, index, { ...value.contributionLots[index], [key]: next }),
    );
  };

  const setEncumbrance = <K extends keyof Encumbrance>(
    index: number,
    key: K,
    next: Encumbrance[K],
  ) => {
    set(
      'encumbrances',
      replaceAt(value.encumbrances, index, { ...value.encumbrances[index], [key]: next }),
    );
  };

  return (
    <SectionCard
      title="Promoter Contribution, Lock-In & Encumbrances"
      description="Shares earmarked for the minimum promoter contribution, their eligibility, and any encumbrance that could block lock-in."
    >
      <FieldGrid>
        <TernaryField
          id="lock-in-applicable"
          label="Minimum promoter contribution applicable"
          required
          value={value.minimumPromoterContributionApplicable}
          onChange={(next) => set('minimumPromoterContributionApplicable', next)}
        />
        <DecimalInputField
          id="lock-in-target-percentage"
          label="Target minimum contribution (%)"
          value={value.targetMinimumContributionPercentage}
          onChange={(next) => set('targetMinimumContributionPercentage', next)}
          helper={`Defaults to ${lockIn.requiredPercentage}% of post-issue capital when left blank.`}
        />
        <DecimalInputField
          id="lock-in-proposed-shares"
          label="Proposed minimum contribution shares"
          value={value.proposedMinimumContributionShares}
          onChange={(next) => set('proposedMinimumContributionShares', next)}
        />
        {!contributionApplicable ? (
          <TernaryField
            id="lock-in-exemption-claimed"
            label="Exemption from minimum contribution claimed"
            value={value.exemptionFromMinimumContributionClaimed}
            onChange={(next) => set('exemptionFromMinimumContributionClaimed', next)}
          />
        ) : null}
      </FieldGrid>

      {value.exemptionFromMinimumContributionClaimed === 'yes' ? (
        <TextAreaField
          id="lock-in-exemption-basis"
          label="Basis of the exemption"
          required
          value={value.exemptionBasis}
          onChange={(next) => set('exemptionBasis', next)}
        />
      ) : null}

      <RepeatableList
        title="Contribution lots"
        description="Each lot is a block of promoter shares with a single acquisition date and mode. Eligibility drives the minimum-contribution check."
        addLabel="Add contribution lot"
        count={value.contributionLots.length}
        emptyMessage="No contribution lot recorded yet."
        onAdd={() =>
          set('contributionLots', [...value.contributionLots, createEmptyPromoterContributionLot()])
        }
      >
        {value.contributionLots.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.holderName || `Contribution lot ${index + 1}`}
            subtitle={`${formatShares(item.numberOfShares)} shares`}
            requiresConfirmation={hasRecordData([
              item.holderName,
              item.numberOfShares,
              item.dateOfAcquisition,
              item.modeOfAcquisition,
            ])}
            confirmMessage="Remove this contribution lot? The minimum-contribution check will be recalculated."
            onRemove={() => set('contributionLots', removeAt(value.contributionLots, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`contribution-lot-${index}-holder-name`}
                label="Holder name"
                value={item.holderName}
                onChange={(next) => setLot(index, 'holderName', next)}
              />
              <SelectField
                id={`contribution-lot-${index}-promoter`}
                label="Promoter"
                value={item.promoterId}
                onChange={(next) => setLot(index, 'promoterId', next)}
                options={promoterOptions}
                emptyLabel="Not yet attributed"
              />
              <SelectField
                id={`contribution-lot-${index}-shareholder`}
                label="Linked shareholder"
                value={item.shareholderId}
                onChange={(next) => setLot(index, 'shareholderId', next)}
                options={shareholderOptions}
                emptyLabel="Not linked"
              />
              <DecimalInputField
                id={`contribution-lot-${index}-shares`}
                label="Number of shares"
                required
                value={item.numberOfShares}
                onChange={(next) => setLot(index, 'numberOfShares', next)}
              />
              <DecimalInputField
                id={`contribution-lot-${index}-face-value`}
                label="Face value per share (₹)"
                value={item.faceValuePerShare}
                onChange={(next) => setLot(index, 'faceValuePerShare', next)}
              />
              <DateField
                id={`contribution-lot-${index}-acquisition-date`}
                label="Date of acquisition"
                required
                value={item.dateOfAcquisition}
                onChange={(next) => setLot(index, 'dateOfAcquisition', next)}
              />
              <DateField
                id={`contribution-lot-${index}-allotment-date`}
                label="Date of allotment or transfer"
                value={item.dateOfAllotmentOrTransfer}
                onChange={(next) => setLot(index, 'dateOfAllotmentOrTransfer', next)}
              />
              <SelectField
                id={`contribution-lot-${index}-mode`}
                label="Mode of acquisition"
                required
                value={item.modeOfAcquisition}
                onChange={(next) =>
                  setLot(index, 'modeOfAcquisition', next as PromoterContributionLot['modeOfAcquisition'])
                }
                options={contributionAcquisitionModeOptions}
              />
              <DecimalInputField
                id={`contribution-lot-${index}-price`}
                label="Acquisition price per share (₹)"
                value={item.acquisitionPricePerShare}
                onChange={(next) => setLot(index, 'acquisitionPricePerShare', next)}
              />
              <SelectField
                id={`contribution-lot-${index}-consideration`}
                label="Consideration type"
                value={item.considerationType}
                onChange={(next) =>
                  setLot(index, 'considerationType', next as PromoterContributionLot['considerationType'])
                }
                options={considerationTypeOptions}
              />
              <TernaryField
                id={`contribution-lot-${index}-fully-paid`}
                label="Fully paid up"
                value={item.fullyPaidUp}
                onChange={(next) => setLot(index, 'fullyPaidUp', next)}
              />
              <TernaryField
                id={`contribution-lot-${index}-demat`}
                label="Dematerialised"
                value={item.dematerialised}
                onChange={(next) => setLot(index, 'dematerialised', next)}
              />
              <TernaryField
                id={`contribution-lot-${index}-eligible`}
                label="Eligible for minimum promoter contribution"
                required
                value={item.eligibleForMinimumPromoterContribution}
                onChange={(next) => setLot(index, 'eligibleForMinimumPromoterContribution', next)}
              />
              <SelectField
                id={`contribution-lot-${index}-lock-in-period`}
                label="Proposed lock-in period"
                value={item.proposedLockInPeriod}
                onChange={(next) =>
                  setLot(index, 'proposedLockInPeriod', next as PromoterContributionLot['proposedLockInPeriod'])
                }
                options={lockInPeriodOptions}
              />
              <TextInputField
                id={`contribution-lot-${index}-lock-in-basis`}
                label="Lock-in start date basis"
                value={item.lockInStartDateBasis}
                onChange={(next) => setLot(index, 'lockInStartDateBasis', next)}
              />
              <TernaryField
                id={`contribution-lot-${index}-encumbered`}
                label="Encumbered"
                value={item.isEncumbered}
                onChange={(next) => setLot(index, 'isEncumbered', next)}
              />
              <TextInputField
                id={`contribution-lot-${index}-isin`}
                label="ISIN"
                value={item.isin}
                onChange={(next) => setLot(index, 'isin', next)}
              />
            </FieldGrid>
            {item.eligibleForMinimumPromoterContribution === 'no' ? (
              <TextAreaField
                id={`contribution-lot-${index}-ineligibility-reason`}
                label="Reason the lot is ineligible"
                rows={2}
                value={item.ineligibilityReason}
                onChange={(next) => setLot(index, 'ineligibilityReason', next)}
              />
            ) : null}
            <TextAreaField
              id={`contribution-lot-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setLot(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Encumbrances"
        description="Pledges, liens and undertakings over shares. Encumbrances on contribution shares must be released before filing."
        addLabel="Add encumbrance"
        count={value.encumbrances.length}
        emptyMessage="No encumbrance recorded yet."
        onAdd={() => set('encumbrances', [...value.encumbrances, createEmptyEncumbrance()])}
      >
        {value.encumbrances.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.holderName || `Encumbrance ${index + 1}`}
            subtitle={`${formatShares(item.numberOfSharesEncumbered)} shares encumbered`}
            requiresConfirmation={hasRecordData([
              item.holderName,
              item.encumbranceType,
              item.numberOfSharesEncumbered,
              item.inFavourOf,
            ])}
            confirmMessage="Remove this encumbrance? Entered values will be lost."
            onRemove={() => set('encumbrances', removeAt(value.encumbrances, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`encumbrance-${index}-holder-name`}
                label="Holder name"
                value={item.holderName}
                onChange={(next) => setEncumbrance(index, 'holderName', next)}
              />
              <SelectField
                id={`encumbrance-${index}-shareholder`}
                label="Linked shareholder"
                value={item.shareholderId}
                onChange={(next) => setEncumbrance(index, 'shareholderId', next)}
                options={shareholderOptions}
                emptyLabel="Recorded by name only"
              />
              <SelectField
                id={`encumbrance-${index}-holder-category`}
                label="Holder category"
                value={item.holderCategory}
                onChange={(next) =>
                  setEncumbrance(index, 'holderCategory', next as Encumbrance['holderCategory'])
                }
                options={shareholderCategoryOptions}
              />
              <SelectField
                id={`encumbrance-${index}-type`}
                label="Encumbrance type"
                required
                value={item.encumbranceType}
                onChange={(next) =>
                  setEncumbrance(index, 'encumbranceType', next as Encumbrance['encumbranceType'])
                }
                options={encumbranceTypeOptions}
              />
              <DecimalInputField
                id={`encumbrance-${index}-shares`}
                label="Number of shares encumbered"
                required
                value={item.numberOfSharesEncumbered}
                onChange={(next) => setEncumbrance(index, 'numberOfSharesEncumbered', next)}
              />
              <TextInputField
                id={`encumbrance-${index}-in-favour-of`}
                label="In favour of"
                value={item.inFavourOf}
                onChange={(next) => setEncumbrance(index, 'inFavourOf', next)}
              />
              <DateField
                id={`encumbrance-${index}-created`}
                label="Created date"
                value={item.createdDate}
                onChange={(next) => setEncumbrance(index, 'createdDate', next)}
              />
              <DateField
                id={`encumbrance-${index}-expected-release`}
                label="Expected release date"
                value={item.expectedReleaseDate}
                onChange={(next) => setEncumbrance(index, 'expectedReleaseDate', next)}
              />
              <TernaryField
                id={`encumbrance-${index}-released-before-filing`}
                label="Will be released before filing"
                value={item.willBeReleasedBeforeFiling}
                onChange={(next) => setEncumbrance(index, 'willBeReleasedBeforeFiling', next)}
              />
              <TernaryField
                id={`encumbrance-${index}-affects-contribution`}
                label="Affects promoter contribution shares"
                value={item.affectsPromoterContributionShares}
                onChange={(next) => setEncumbrance(index, 'affectsPromoterContributionShares', next)}
              />
              <TernaryField
                id={`encumbrance-${index}-disclosed`}
                label="Disclosed to the stock exchange or depository"
                value={item.disclosedToStockExchangeOrDepository}
                onChange={(next) =>
                  setEncumbrance(index, 'disclosedToStockExchangeOrDepository', next)
                }
              />
              <TextInputField
                id={`encumbrance-${index}-document`}
                label="Document reference"
                value={item.documentReference}
                onChange={(next) => setEncumbrance(index, 'documentReference', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`encumbrance-${index}-purpose`}
              label="Purpose"
              rows={2}
              value={item.purpose}
              onChange={(next) => setEncumbrance(index, 'purpose', next)}
            />
            {item.willBeReleasedBeforeFiling === 'yes' ? (
              <TextAreaField
                id={`encumbrance-${index}-release-plan`}
                label="Release plan"
                rows={2}
                value={item.releasePlan}
                onChange={(next) => setEncumbrance(index, 'releasePlan', next)}
              />
            ) : null}
            <TextAreaField
              id={`encumbrance-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setEncumbrance(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Lock-in readiness questions">
        <FieldGrid>
          <TernaryField
            id="lock-in-brought-in-before-opening"
            label="Contribution brought in before issue opening"
            required
            value={value.contributionBroughtInBeforeIssueOpening}
            onChange={(next) => set('contributionBroughtInBeforeIssueOpening', next)}
          />
          <TernaryField
            id="lock-in-ineligible-shares-exist"
            label="Shares ineligible for contribution exist"
            required
            value={value.sharesIneligibleForContributionExist}
            onChange={(next) => set('sharesIneligibleForContributionExist', next)}
          />
          <TernaryField
            id="lock-in-entire-pre-issue-understood"
            label="Lock-in of the remaining pre-issue capital is understood"
            required
            value={value.entirePreIssueCapitalLockInUnderstood}
            onChange={(next) => set('entirePreIssueCapitalLockInUnderstood', next)}
          />
          <DecimalInputField
            id="lock-in-exempt-shares"
            label="Pre-issue capital exempt from lock-in (shares)"
            value={value.preIssueCapitalExemptFromLockInShares}
            onChange={(next) => set('preIssueCapitalExemptFromLockInShares', next)}
          />
          <TernaryField
            id="lock-in-any-encumbrance"
            label="Any encumbrance on promoter shares"
            required
            value={value.anyEncumbranceOnPromoterShares}
            onChange={(next) => set('anyEncumbranceOnPromoterShares', next)}
          />
          {value.anyEncumbranceOnPromoterShares === 'yes' ? (
            <TernaryField
              id="lock-in-encumbrance-release-confirmed"
              label="Encumbrance release before lock-in confirmed"
              value={value.encumbranceReleaseBeforeLockInConfirmed}
              onChange={(next) => set('encumbranceReleaseBeforeLockInConfirmed', next)}
            />
          ) : null}
          <TernaryField
            id="lock-in-demat"
            label="Lock-in shares to be held in dematerialised form"
            value={value.lockInSharesToBeHeldInDematerialisedForm}
            onChange={(next) => set('lockInSharesToBeHeldInDematerialisedForm', next)}
          />
          <TernaryField
            id="lock-in-professional-confirmation"
            label="Lock-in compliance professionally confirmed"
            value={value.lockInComplianceProfessionallyConfirmed}
            onChange={(next) => set('lockInComplianceProfessionallyConfirmed', next)}
          />
        </FieldGrid>

        {value.sharesIneligibleForContributionExist === 'yes' ? (
          <TextAreaField
            id="lock-in-ineligible-details"
            label="Ineligible shares — details"
            required
            value={value.ineligibleSharesDetails}
            onChange={(next) => set('ineligibleSharesDetails', next)}
          />
        ) : null}
        {value.preIssueCapitalExemptFromLockInShares ? (
          <TextAreaField
            id="lock-in-exempt-basis"
            label="Basis for the pre-issue capital exempt from lock-in"
            rows={2}
            value={value.preIssueCapitalExemptFromLockInBasis}
            onChange={(next) => set('preIssueCapitalExemptFromLockInBasis', next)}
          />
        ) : null}
      </SubSection>

      <TextAreaField
        id="lock-in-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <StatGrid title="Computed (not persisted)">
        <ComputedStat
          label="Required contribution"
          value={formatShares(lockIn.requiredContributionShares)}
        />
        <ComputedStat label="Eligible shares" value={formatShares(lockIn.eligibleShares)} />
        <ComputedStat label="Shortfall" value={formatShares(lockIn.shortfallShares)} />
        <ComputedStat
          label="Eligible % of post-issue"
          value={formatPercent(lockIn.eligibleAsPercentageOfPostIssue)}
        />
        <ComputedStat label="Earmarked shares" value={formatShares(lockIn.earmarkedShares)} />
        <ComputedStat label="Ineligible shares" value={formatShares(lockIn.ineligibleShares)} />
        <ComputedStat
          label="Encumbered contribution shares"
          value={formatShares(lockIn.encumberedContributionShares)}
        />
        <ComputedStat
          label="Encumbrances needing release"
          value={String(lockIn.encumbrancesRequiringRelease)}
        />
      </StatGrid>

      <CapitalOwnershipSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
