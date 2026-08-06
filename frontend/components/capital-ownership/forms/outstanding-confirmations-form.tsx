'use client';

import {
  CheckboxField,
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
  createEmptyOutstandingInstrument,
  createEmptyRecentTransaction,
} from '@/lib/capital-ownership/defaults';
import { formatMoneyCompact, formatPercent, formatShares } from '@/lib/capital-ownership/format';
import {
  CAPITAL_OWNERSHIP_CONFIRMATION_FIELDS,
  considerationTypeOptions,
  instrumentHolderCategoryOptions,
  outstandingInstrumentTypeOptions,
  shareholderCategoryOptions,
  transactionTypeOptions,
} from '@/lib/capital-ownership/options';
import type {
  OutstandingInstrument,
  OutstandingSecuritiesTransactionsAndConfirmations,
  RecentTransaction,
} from '@/lib/capital-ownership/types';

const SECTION_ID = 'outstanding-securities-confirmations' as const;

export function OutstandingConfirmationsForm() {
  const { payload, updateSection, model } = useCapitalOwnership();
  const value = payload.outstandingSecuritiesTransactionsAndConfirmations;
  const outstanding = model.outstanding;

  const set = <K extends keyof OutstandingSecuritiesTransactionsAndConfirmations>(
    key: K,
    next: OutstandingSecuritiesTransactionsAndConfirmations[K],
  ) => {
    updateSection(
      'outstandingSecuritiesTransactionsAndConfirmations',
      { ...value, [key]: next },
      SECTION_ID,
    );
  };

  const setInstrument = <K extends keyof OutstandingInstrument>(
    index: number,
    key: K,
    next: OutstandingInstrument[K],
  ) => {
    set(
      'outstandingInstruments',
      replaceAt(value.outstandingInstruments, index, {
        ...value.outstandingInstruments[index],
        [key]: next,
      }),
    );
  };

  const setTransaction = <K extends keyof RecentTransaction>(
    index: number,
    key: K,
    next: RecentTransaction[K],
  ) => {
    set(
      'recentTransactions',
      replaceAt(value.recentTransactions, index, {
        ...value.recentTransactions[index],
        [key]: next,
      }),
    );
  };

  const setConfirmation = (
    key: keyof OutstandingSecuritiesTransactionsAndConfirmations['confirmations'],
    checked: boolean,
  ) => {
    set('confirmations', { ...value.confirmations, [key]: checked });
  };

  const confirmationsChecked = CAPITAL_OWNERSHIP_CONFIRMATION_FIELDS.filter(
    (field) => value.confirmations[field.key],
  ).length;

  return (
    <SectionCard
      title="Outstanding Securities, Transactions & Confirmations"
      description="Convertibles and options that could dilute the offer, share transactions in the last eighteen months, and the issuer's confirmations."
    >
      <SubSection title="Outstanding convertible instruments and options">
        <FieldGrid>
          <TernaryField
            id="outstanding-any-convertibles"
            label="Any outstanding convertible instruments or options"
            required
            value={value.anyOutstandingConvertibleInstruments}
            onChange={(next) => set('anyOutstandingConvertibleInstruments', next)}
          />
          {value.anyOutstandingConvertibleInstruments === 'yes' ? (
            <TernaryField
              id="outstanding-settled-before-filing"
              label="All convertibles to be settled before filing"
              value={value.allConvertiblesToBeSettledBeforeFiling}
              onChange={(next) => set('allConvertiblesToBeSettledBeforeFiling', next)}
            />
          ) : null}
        </FieldGrid>
      </SubSection>

      {value.anyOutstandingConvertibleInstruments === 'yes' ||
      value.outstandingInstruments.length > 0 ? (
        <RepeatableList
          title="Outstanding instruments"
          description="Potential equity shares on conversion feed the fully diluted share count."
          addLabel="Add instrument"
          count={value.outstandingInstruments.length}
          emptyMessage="No outstanding instrument recorded yet."
          onAdd={() =>
            set('outstandingInstruments', [
              ...value.outstandingInstruments,
              createEmptyOutstandingInstrument(),
            ])
          }
        >
          {value.outstandingInstruments.map((item, index) => (
            <RepeatableCard
              key={item.id}
              title={item.schemeOrInstrumentName || `Instrument ${index + 1}`}
              subtitle={`${formatShares(item.potentialEquitySharesOnConversion)} potential equity shares`}
              requiresConfirmation={hasRecordData([
                item.instrumentType,
                item.schemeOrInstrumentName,
                item.numberOfInstrumentsOutstanding,
                item.potentialEquitySharesOnConversion,
              ])}
              confirmMessage="Remove this instrument? The potential dilution figure will be recalculated."
              onRemove={() =>
                set('outstandingInstruments', removeAt(value.outstandingInstruments, index))
              }
            >
              <FieldGrid>
                <SelectField
                  id={`instrument-${index}-type`}
                  label="Instrument type"
                  required
                  value={item.instrumentType}
                  onChange={(next) =>
                    setInstrument(index, 'instrumentType', next as OutstandingInstrument['instrumentType'])
                  }
                  options={outstandingInstrumentTypeOptions}
                />
                <TextInputField
                  id={`instrument-${index}-name`}
                  label="Scheme or instrument name"
                  value={item.schemeOrInstrumentName}
                  onChange={(next) => setInstrument(index, 'schemeOrInstrumentName', next)}
                />
                <DateField
                  id={`instrument-${index}-grant-date`}
                  label="Date of grant or issue"
                  value={item.dateOfGrantOrIssue}
                  onChange={(next) => setInstrument(index, 'dateOfGrantOrIssue', next)}
                />
                <DecimalInputField
                  id={`instrument-${index}-outstanding`}
                  label="Instruments outstanding"
                  value={item.numberOfInstrumentsOutstanding}
                  onChange={(next) => setInstrument(index, 'numberOfInstrumentsOutstanding', next)}
                />
                <DecimalInputField
                  id={`instrument-${index}-potential-shares`}
                  label="Potential equity shares on conversion"
                  required
                  value={item.potentialEquitySharesOnConversion}
                  onChange={(next) =>
                    setInstrument(index, 'potentialEquitySharesOnConversion', next)
                  }
                />
                <DecimalInputField
                  id={`instrument-${index}-exercise-price`}
                  label="Conversion or exercise price per share (₹)"
                  value={item.conversionOrExercisePricePerShare}
                  onChange={(next) =>
                    setInstrument(index, 'conversionOrExercisePricePerShare', next)
                  }
                />
                <TextInputField
                  id={`instrument-${index}-conversion-ratio`}
                  label="Conversion ratio"
                  value={item.conversionRatio}
                  onChange={(next) => setInstrument(index, 'conversionRatio', next)}
                />
                <TextInputField
                  id={`instrument-${index}-conversion-period`}
                  label="Conversion or exercise period"
                  value={item.conversionOrExercisePeriod}
                  onChange={(next) => setInstrument(index, 'conversionOrExercisePeriod', next)}
                />
                <DecimalInputField
                  id={`instrument-${index}-vested`}
                  label="Vested instruments outstanding"
                  value={item.vestedInstrumentsOutstanding}
                  onChange={(next) => setInstrument(index, 'vestedInstrumentsOutstanding', next)}
                />
                <DecimalInputField
                  id={`instrument-${index}-unvested`}
                  label="Unvested instruments outstanding"
                  value={item.unvestedInstrumentsOutstanding}
                  onChange={(next) => setInstrument(index, 'unvestedInstrumentsOutstanding', next)}
                />
                <SelectField
                  id={`instrument-${index}-holder-category`}
                  label="Holder category"
                  value={item.holderCategory}
                  onChange={(next) =>
                    setInstrument(index, 'holderCategory', next as OutstandingInstrument['holderCategory'])
                  }
                  options={instrumentHolderCategoryOptions}
                />
                <DecimalInputField
                  id={`instrument-${index}-holders`}
                  label="Number of holders"
                  value={item.numberOfHolders}
                  onChange={(next) => setInstrument(index, 'numberOfHolders', next)}
                />
                <TernaryField
                  id={`instrument-${index}-settles-before-filing`}
                  label="Will convert or lapse before filing"
                  value={item.willConvertOrLapseBeforeFiling}
                  onChange={(next) => setInstrument(index, 'willConvertOrLapseBeforeFiling', next)}
                />
                {item.willConvertOrLapseBeforeFiling === 'yes' ? (
                  <DateField
                    id={`instrument-${index}-settlement-date`}
                    label="Expected conversion or lapse date"
                    value={item.expectedConversionOrLapseDate}
                    onChange={(next) => setInstrument(index, 'expectedConversionOrLapseDate', next)}
                  />
                ) : null}
                <TernaryField
                  id={`instrument-${index}-approval`}
                  label="Shareholder approval obtained"
                  value={item.shareholderApprovalObtained}
                  onChange={(next) => setInstrument(index, 'shareholderApprovalObtained', next)}
                />
                <TernaryField
                  id={`instrument-${index}-sbeb-compliant`}
                  label="Compliant with share-based benefit regulations"
                  value={item.compliantWithShareBasedBenefitRegulations}
                  onChange={(next) =>
                    setInstrument(index, 'compliantWithShareBasedBenefitRegulations', next)
                  }
                />
                <TextInputField
                  id={`instrument-${index}-document`}
                  label="Document reference"
                  value={item.documentReference}
                  onChange={(next) => setInstrument(index, 'documentReference', next)}
                />
              </FieldGrid>
              <TextAreaField
                id={`instrument-${index}-notes`}
                label="Notes"
                rows={2}
                value={item.notes}
                onChange={(next) => setInstrument(index, 'notes', next)}
              />
            </RepeatableCard>
          ))}
        </RepeatableList>
      ) : null}

      {value.anyOutstandingConvertibleInstruments === 'yes' ? (
        <TextAreaField
          id="outstanding-instrument-notes"
          label="Outstanding instrument notes"
          rows={2}
          value={value.outstandingInstrumentNotes}
          onChange={(next) => set('outstandingInstrumentNotes', next)}
        />
      ) : null}

      <SubSection title="Share transactions in the last eighteen months">
        <FieldGrid>
          <TernaryField
            id="outstanding-recent-transactions"
            label="Any transactions in the last eighteen months"
            required
            value={value.anyTransactionsInLastEighteenMonths}
            onChange={(next) => set('anyTransactionsInLastEighteenMonths', next)}
          />
          {value.anyTransactionsInLastEighteenMonths === 'yes' ? (
            <TernaryField
              id="outstanding-weighted-average"
              label="Weighted average cost disclosure required"
              value={value.weightedAverageCostDisclosureRequired}
              onChange={(next) => set('weightedAverageCostDisclosureRequired', next)}
            />
          ) : null}
        </FieldGrid>
      </SubSection>

      {value.anyTransactionsInLastEighteenMonths === 'yes' ||
      value.recentTransactions.length > 0 ? (
        <RepeatableList
          title="Recent transactions"
          description="Primary allotments and secondary transfers that feed the weighted average cost disclosure."
          addLabel="Add transaction"
          count={value.recentTransactions.length}
          emptyMessage="No transaction recorded yet."
          onAdd={() =>
            set('recentTransactions', [...value.recentTransactions, createEmptyRecentTransaction()])
          }
        >
          {value.recentTransactions.map((item, index) => (
            <RepeatableCard
              key={item.id}
              title={`${item.transferorName || 'Transferor'} → ${item.transfereeName || 'Transferee'}`}
              subtitle={`${formatShares(item.numberOfShares)} shares`}
              requiresConfirmation={hasRecordData([
                item.transactionDate,
                item.transactionType,
                item.numberOfShares,
                item.transferorName,
                item.transfereeName,
              ])}
              confirmMessage="Remove this transaction? Entered values will be lost."
              onRemove={() => set('recentTransactions', removeAt(value.recentTransactions, index))}
            >
              <FieldGrid>
                <DateField
                  id={`transaction-${index}-date`}
                  label="Transaction date"
                  required
                  value={item.transactionDate}
                  onChange={(next) => setTransaction(index, 'transactionDate', next)}
                />
                <SelectField
                  id={`transaction-${index}-type`}
                  label="Transaction type"
                  required
                  value={item.transactionType}
                  onChange={(next) =>
                    setTransaction(index, 'transactionType', next as RecentTransaction['transactionType'])
                  }
                  options={transactionTypeOptions}
                />
                <TextInputField
                  id={`transaction-${index}-transferor`}
                  label="Transferor name"
                  value={item.transferorName}
                  onChange={(next) => setTransaction(index, 'transferorName', next)}
                />
                <SelectField
                  id={`transaction-${index}-transferor-category`}
                  label="Transferor category"
                  value={item.transferorCategory}
                  onChange={(next) =>
                    setTransaction(
                      index,
                      'transferorCategory',
                      next as RecentTransaction['transferorCategory'],
                    )
                  }
                  options={shareholderCategoryOptions}
                />
                <TextInputField
                  id={`transaction-${index}-transferee`}
                  label="Transferee name"
                  value={item.transfereeName}
                  onChange={(next) => setTransaction(index, 'transfereeName', next)}
                />
                <SelectField
                  id={`transaction-${index}-transferee-category`}
                  label="Transferee category"
                  value={item.transfereeCategory}
                  onChange={(next) =>
                    setTransaction(
                      index,
                      'transfereeCategory',
                      next as RecentTransaction['transfereeCategory'],
                    )
                  }
                  options={shareholderCategoryOptions}
                />
                <DecimalInputField
                  id={`transaction-${index}-shares`}
                  label="Number of shares"
                  required
                  value={item.numberOfShares}
                  onChange={(next) => setTransaction(index, 'numberOfShares', next)}
                />
                <DecimalInputField
                  id={`transaction-${index}-price`}
                  label="Price per share (₹)"
                  value={item.pricePerShare}
                  onChange={(next) => setTransaction(index, 'pricePerShare', next)}
                />
                <DecimalInputField
                  id={`transaction-${index}-total`}
                  label="Total consideration (₹)"
                  value={item.totalConsideration}
                  onChange={(next) => setTransaction(index, 'totalConsideration', next)}
                />
                <SelectField
                  id={`transaction-${index}-consideration-type`}
                  label="Consideration type"
                  value={item.considerationType}
                  onChange={(next) =>
                    setTransaction(
                      index,
                      'considerationType',
                      next as RecentTransaction['considerationType'],
                    )
                  }
                  options={considerationTypeOptions}
                />
                <TernaryField
                  id={`transaction-${index}-promoter`}
                  label="Involves promoter or promoter group"
                  value={item.involvesPromoterOrPromoterGroup}
                  onChange={(next) => setTransaction(index, 'involvesPromoterOrPromoterGroup', next)}
                />
                <TernaryField
                  id={`transaction-${index}-related-party`}
                  label="Related-party transaction"
                  value={item.isRelatedPartyTransaction}
                  onChange={(next) => setTransaction(index, 'isRelatedPartyTransaction', next)}
                />
                <TextInputField
                  id={`transaction-${index}-valuation-basis`}
                  label="Valuation basis"
                  value={item.valuationBasis}
                  onChange={(next) => setTransaction(index, 'valuationBasis', next)}
                />
                <TernaryField
                  id={`transaction-${index}-sh4`}
                  label="Form SH-4 or transfer deed available"
                  value={item.formSh4OrTransferDeedAvailable}
                  onChange={(next) => setTransaction(index, 'formSh4OrTransferDeedAvailable', next)}
                />
                <TernaryField
                  id={`transaction-${index}-disclosed`}
                  label="Disclosed in the offer document"
                  value={item.disclosedInOfferDocument}
                  onChange={(next) => setTransaction(index, 'disclosedInOfferDocument', next)}
                />
              </FieldGrid>
              <TextAreaField
                id={`transaction-${index}-notes`}
                label="Notes"
                rows={2}
                value={item.notes}
                onChange={(next) => setTransaction(index, 'notes', next)}
              />
            </RepeatableCard>
          ))}
        </RepeatableList>
      ) : null}

      {value.anyTransactionsInLastEighteenMonths === 'yes' ? (
        <TextAreaField
          id="outstanding-transaction-notes"
          label="Transaction notes"
          rows={2}
          value={value.transactionNotes}
          onChange={(next) => set('transactionNotes', next)}
        />
      ) : null}

      <SubSection title="Dematerialisation, transfers and title">
        <FieldGrid>
          <TernaryField
            id="outstanding-demat-before-filing"
            label="All shares dematerialised before filing"
            required
            value={value.allSharesDematerialisedBeforeFiling}
            onChange={(next) => set('allSharesDematerialisedBeforeFiling', next)}
          />
          <TernaryField
            id="outstanding-pending-transfers"
            label="Any pending share transfers"
            required
            value={value.anyPendingShareTransfers}
            onChange={(next) => set('anyPendingShareTransfers', next)}
          />
          <TernaryField
            id="outstanding-title-disputes"
            label="Any disputes over title to shares"
            required
            value={value.anyDisputesOverTitleToShares}
            onChange={(next) => set('anyDisputesOverTitleToShares', next)}
          />
        </FieldGrid>
        {value.anyPendingShareTransfers === 'yes' ? (
          <TextAreaField
            id="outstanding-pending-transfer-details"
            label="Pending share transfers — details"
            required
            value={value.pendingShareTransferDetails}
            onChange={(next) => set('pendingShareTransferDetails', next)}
          />
        ) : null}
        {value.anyDisputesOverTitleToShares === 'yes' ? (
          <TextAreaField
            id="outstanding-title-dispute-details"
            label="Title disputes — details"
            required
            value={value.titleDisputeDetails}
            onChange={(next) => set('titleDisputeDetails', next)}
          />
        ) : null}
      </SubSection>

      <SubSection
        title="Issuer confirmations"
        description={`${confirmationsChecked} of ${CAPITAL_OWNERSHIP_CONFIRMATION_FIELDS.length} acknowledged. Unchecked confirmations keep the Capital Assessment preliminary.`}
      >
        <div className="space-y-3">
          {CAPITAL_OWNERSHIP_CONFIRMATION_FIELDS.map((field) => (
            <CheckboxField
              key={field.key}
              id={`confirmation-${field.key}`}
              label={field.label}
              checked={value.confirmations[field.key]}
              onChange={(checked) => setConfirmation(field.key, checked)}
            />
          ))}
        </div>
      </SubSection>

      <TextAreaField
        id="outstanding-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <StatGrid title="Computed (not persisted)">
        <ComputedStat label="Instruments recorded" value={String(outstanding.instrumentCount)} />
        <ComputedStat
          label="Potential equity shares"
          value={formatShares(outstanding.totalPotentialEquityShares)}
        />
        <ComputedStat
          label="Potential dilution"
          value={formatPercent(outstanding.potentialDilutionPercentage)}
        />
        <ComputedStat
          label="Fully diluted shares"
          value={formatShares(outstanding.fullyDilutedShares)}
        />
        <ComputedStat
          label="Settling before filing"
          value={String(outstanding.instrumentsSettlingBeforeFiling)}
        />
        <ComputedStat
          label="Surviving filing"
          value={String(outstanding.instrumentsSurvivingFiling)}
        />
        <ComputedStat
          label="Settlement unanswered"
          value={String(outstanding.instrumentsWithUnknownSettlement)}
        />
        <ComputedStat
          label="Consideration on conversion"
          value={formatMoneyCompact(outstanding.totalConsiderationOnConversion)}
        />
      </StatGrid>

      <CapitalOwnershipSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
