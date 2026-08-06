'use client';

import {
  AmountInputField,
  AmountUnitToggle,
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
  createEmptyEquityShareClass,
  createEmptyPreferenceShareClass,
} from '@/lib/capital-ownership/defaults';
import { formatMoneyCompact, formatPercent, formatShares } from '@/lib/capital-ownership/format';
import {
  capitalAmountUnitOptions,
  dematStatusOptions,
  depositoryConnectivityOptions,
  equityClassTypeOptions,
  preferenceClassTypeOptions,
} from '@/lib/capital-ownership/options';
import type {
  CurrentCapitalStructure,
  EquityShareClass,
  PreferenceShareClass,
} from '@/lib/capital-ownership/types';

const SECTION_ID = 'current-capital-structure' as const;

export function CurrentCapitalStructureForm() {
  const { payload, updateSection, model } = useCapitalOwnership();
  const value = payload.currentCapitalStructure;
  const unit = value.amountDisplayUnit;
  const totals = model.totals;

  const set = <K extends keyof CurrentCapitalStructure>(
    key: K,
    next: CurrentCapitalStructure[K],
  ) => {
    updateSection('currentCapitalStructure', { ...value, [key]: next }, SECTION_ID);
  };

  const setEquityClass = <K extends keyof EquityShareClass>(
    index: number,
    key: K,
    next: EquityShareClass[K],
  ) => {
    set(
      'equityClasses',
      replaceAt(value.equityClasses, index, { ...value.equityClasses[index], [key]: next }),
    );
  };

  const setPreferenceClass = <K extends keyof PreferenceShareClass>(
    index: number,
    key: K,
    next: PreferenceShareClass[K],
  ) => {
    set(
      'preferenceClasses',
      replaceAt(value.preferenceClasses, index, {
        ...value.preferenceClasses[index],
        [key]: next,
      }),
    );
  };

  return (
    <SectionCard
      title="Current Capital Structure"
      description="Authorised, issued, subscribed and paid-up capital by class as on the stated date. Amounts are stored in rupees; the unit below only changes how you type and read them."
    >
      <AmountUnitToggle
        unit={unit}
        onChange={(next) => set('amountDisplayUnit', next as CurrentCapitalStructure['amountDisplayUnit'])}
      />

      <FieldGrid>
        <DateField
          id="cap-structure-as-on-date"
          label="Capital structure as on date"
          required
          value={value.asOnDate}
          onChange={(next) => set('asOnDate', next)}
        />
        <SelectField
          id="cap-structure-amount-unit"
          label="Amount display unit"
          value={unit}
          onChange={(next) =>
            set('amountDisplayUnit', next as CurrentCapitalStructure['amountDisplayUnit'])
          }
          options={capitalAmountUnitOptions}
          includeEmpty={false}
          helper="Display preference only — the payload always stores rupees."
        />
      </FieldGrid>

      <RepeatableList
        title="Equity share classes"
        description="One row per class of equity shares. Share counts drive the cap table and every reconciliation check."
        addLabel="Add equity class"
        count={value.equityClasses.length}
        emptyMessage="No equity class recorded yet. Add at least one class."
        onAdd={() => set('equityClasses', [...value.equityClasses, createEmptyEquityShareClass()])}
      >
        {value.equityClasses.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.className || `Equity class ${index + 1}`}
            subtitle="Face value × paid-up shares feeds the declared paid-up capital check."
            requiresConfirmation={hasRecordData([
              item.className,
              item.faceValuePerShare,
              item.issuedShares,
              item.paidUpShares,
            ])}
            confirmMessage="Remove this equity class? Entered share counts will be lost."
            onRemove={() => set('equityClasses', removeAt(value.equityClasses, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`equity-class-${index}-name`}
                label="Class name"
                required
                value={item.className}
                onChange={(next) => setEquityClass(index, 'className', next)}
              />
              <SelectField
                id={`equity-class-${index}-type`}
                label="Rights type"
                value={item.classType}
                onChange={(next) =>
                  setEquityClass(index, 'classType', next as EquityShareClass['classType'])
                }
                options={equityClassTypeOptions}
              />
              <DecimalInputField
                id={`equity-class-${index}-face-value`}
                label="Face value per share (₹)"
                required
                value={item.faceValuePerShare}
                onChange={(next) => setEquityClass(index, 'faceValuePerShare', next)}
              />
              <DecimalInputField
                id={`equity-class-${index}-voting-rights`}
                label="Voting rights per share"
                value={item.votingRightsPerShare}
                onChange={(next) => setEquityClass(index, 'votingRightsPerShare', next)}
              />
              <DecimalInputField
                id={`equity-class-${index}-authorised`}
                label="Authorised shares"
                value={item.authorisedShares}
                onChange={(next) => setEquityClass(index, 'authorisedShares', next)}
              />
              <DecimalInputField
                id={`equity-class-${index}-issued`}
                label="Issued shares"
                required
                value={item.issuedShares}
                onChange={(next) => setEquityClass(index, 'issuedShares', next)}
              />
              <DecimalInputField
                id={`equity-class-${index}-subscribed`}
                label="Subscribed shares"
                value={item.subscribedShares}
                onChange={(next) => setEquityClass(index, 'subscribedShares', next)}
              />
              <DecimalInputField
                id={`equity-class-${index}-paid-up`}
                label="Paid-up shares"
                required
                value={item.paidUpShares}
                onChange={(next) => setEquityClass(index, 'paidUpShares', next)}
              />
              <DecimalInputField
                id={`equity-class-${index}-partly-paid`}
                label="Partly paid-up shares"
                value={item.partlyPaidShares}
                onChange={(next) => setEquityClass(index, 'partlyPaidShares', next)}
              />
              <DecimalInputField
                id={`equity-class-${index}-amount-paid-partly`}
                label="Amount paid up per partly paid share (₹)"
                value={item.amountPaidUpPerPartlyPaidShare}
                onChange={(next) => setEquityClass(index, 'amountPaidUpPerPartlyPaidShare', next)}
              />
              <AmountInputField
                id={`equity-class-${index}-share-premium`}
                label="Share premium balance"
                unit={unit}
                rupees={item.sharePremiumBalance}
                onChange={(next) => setEquityClass(index, 'sharePremiumBalance', next)}
              />
              <DecimalInputField
                id={`equity-class-${index}-calls-unpaid`}
                label="Calls unpaid (₹)"
                value={item.callsUnpaidAmount}
                onChange={(next) => setEquityClass(index, 'callsUnpaidAmount', next)}
              />
              <DecimalInputField
                id={`equity-class-${index}-forfeited`}
                label="Shares forfeited"
                value={item.sharesForfeited}
                onChange={(next) => setEquityClass(index, 'sharesForfeited', next)}
              />
              <TextInputField
                id={`equity-class-${index}-isin`}
                label="ISIN"
                value={item.isin}
                onChange={(next) => setEquityClass(index, 'isin', next)}
              />
              <SelectField
                id={`equity-class-${index}-demat-status`}
                label="Dematerialisation status"
                value={item.dematStatus}
                onChange={(next) =>
                  setEquityClass(index, 'dematStatus', next as EquityShareClass['dematStatus'])
                }
                options={dematStatusOptions}
              />
              <DecimalInputField
                id={`equity-class-${index}-demat-shares`}
                label="Shares in dematerialised form"
                value={item.sharesInDematerialisedForm}
                onChange={(next) => setEquityClass(index, 'sharesInDematerialisedForm', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`equity-class-${index}-rights`}
              label="Rights and restrictions"
              rows={2}
              value={item.rightsAndRestrictions}
              onChange={(next) => setEquityClass(index, 'rightsAndRestrictions', next)}
            />
            <TextAreaField
              id={`equity-class-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setEquityClass(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TernaryField
        id="cap-structure-has-preference"
        label="Does the company have preference shares?"
        required
        value={value.hasPreferenceShares}
        onChange={(next) => set('hasPreferenceShares', next)}
      />

      {value.hasPreferenceShares === 'yes' || value.hasPreferenceShares === 'not_sure' ? (
      <RepeatableList
        title="Preference share classes"
        description="Only add rows where preference capital is outstanding."
        addLabel="Add preference class"
        count={value.preferenceClasses.length}
        emptyMessage="No preference share class recorded."
        onAdd={() =>
          set('preferenceClasses', [...value.preferenceClasses, createEmptyPreferenceShareClass()])
        }
      >
        {value.preferenceClasses.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.className || `Preference class ${index + 1}`}
            requiresConfirmation={hasRecordData([
              item.className,
              item.faceValuePerShare,
              item.issuedShares,
              item.paidUpShares,
            ])}
            confirmMessage="Remove this preference class? Entered values will be lost."
            onRemove={() => set('preferenceClasses', removeAt(value.preferenceClasses, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`preference-class-${index}-name`}
                label="Class name"
                value={item.className}
                onChange={(next) => setPreferenceClass(index, 'className', next)}
              />
              <SelectField
                id={`preference-class-${index}-type`}
                label="Class type"
                value={item.classType}
                onChange={(next) =>
                  setPreferenceClass(index, 'classType', next as PreferenceShareClass['classType'])
                }
                options={preferenceClassTypeOptions}
              />
              <DecimalInputField
                id={`preference-class-${index}-face-value`}
                label="Face value per share (₹)"
                value={item.faceValuePerShare}
                onChange={(next) => setPreferenceClass(index, 'faceValuePerShare', next)}
              />
              <DecimalInputField
                id={`preference-class-${index}-authorised`}
                label="Authorised shares"
                value={item.authorisedShares}
                onChange={(next) => setPreferenceClass(index, 'authorisedShares', next)}
              />
              <DecimalInputField
                id={`preference-class-${index}-issued`}
                label="Issued shares"
                value={item.issuedShares}
                onChange={(next) => setPreferenceClass(index, 'issuedShares', next)}
              />
              <DecimalInputField
                id={`preference-class-${index}-paid-up`}
                label="Paid-up shares"
                value={item.paidUpShares}
                onChange={(next) => setPreferenceClass(index, 'paidUpShares', next)}
              />
              <DecimalInputField
                id={`preference-class-${index}-dividend-rate`}
                label="Dividend rate (%)"
                value={item.dividendRatePercentage}
                onChange={(next) => setPreferenceClass(index, 'dividendRatePercentage', next)}
              />
              <TernaryField
                id={`preference-class-${index}-cumulative`}
                label="Cumulative"
                value={item.isCumulative}
                onChange={(next) => setPreferenceClass(index, 'isCumulative', next)}
              />
              <TernaryField
                id={`preference-class-${index}-participating`}
                label="Participating"
                value={item.isParticipating}
                onChange={(next) => setPreferenceClass(index, 'isParticipating', next)}
              />
              <TernaryField
                id={`preference-class-${index}-convertible`}
                label="Convertible into equity"
                value={item.isConvertible}
                onChange={(next) => setPreferenceClass(index, 'isConvertible', next)}
              />
              {item.isConvertible === 'yes' ? (
                <DecimalInputField
                  id={`preference-class-${index}-potential-equity`}
                  label="Potential equity shares on conversion"
                  value={item.potentialEquitySharesOnConversion}
                  onChange={(next) =>
                    setPreferenceClass(index, 'potentialEquitySharesOnConversion', next)
                  }
                />
              ) : null}
              <TernaryField
                id={`preference-class-${index}-redeemable`}
                label="Redeemable"
                value={item.isRedeemable}
                onChange={(next) => setPreferenceClass(index, 'isRedeemable', next)}
              />
              {item.isRedeemable === 'yes' ? (
                <>
                  <DateField
                    id={`preference-class-${index}-redemption-date`}
                    label="Redemption date"
                    value={item.redemptionDate}
                    onChange={(next) => setPreferenceClass(index, 'redemptionDate', next)}
                  />
                  <DecimalInputField
                    id={`preference-class-${index}-redemption-amount`}
                    label="Redemption amount (₹)"
                    value={item.redemptionAmount}
                    onChange={(next) => setPreferenceClass(index, 'redemptionAmount', next)}
                  />
                </>
              ) : null}
              <TernaryField
                id={`preference-class-${index}-voting`}
                label="Carries voting rights"
                value={item.carriesVotingRights}
                onChange={(next) => setPreferenceClass(index, 'carriesVotingRights', next)}
              />
              <TextInputField
                id={`preference-class-${index}-isin`}
                label="ISIN"
                value={item.isin}
                onChange={(next) => setPreferenceClass(index, 'isin', next)}
              />
            </FieldGrid>
            {item.isConvertible === 'yes' ? (
              <TextAreaField
                id={`preference-class-${index}-conversion-terms`}
                label="Conversion terms"
                rows={2}
                value={item.conversionTerms}
                onChange={(next) => setPreferenceClass(index, 'conversionTerms', next)}
              />
            ) : null}
            {item.carriesVotingRights === 'yes' ? (
              <TextAreaField
                id={`preference-class-${index}-voting-description`}
                label="Voting rights description"
                rows={2}
                value={item.votingRightsDescription}
                onChange={(next) => setPreferenceClass(index, 'votingRightsDescription', next)}
              />
            ) : null}
            <TextAreaField
              id={`preference-class-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setPreferenceClass(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>
      ) : null}

      <SubSection
        title="Declared capital amounts"
        description="As stated in the memorandum, statutory registers and the latest audited financials."
      >
        <FieldGrid>
          <AmountInputField
            id="cap-structure-authorised-equity"
            label="Authorised equity share capital"
            required
            unit={unit}
            rupees={value.authorisedEquityShareCapital}
            onChange={(next) => set('authorisedEquityShareCapital', next)}
          />
          <AmountInputField
            id="cap-structure-authorised-preference"
            label="Authorised preference share capital"
            unit={unit}
            rupees={value.authorisedPreferenceShareCapital}
            onChange={(next) => set('authorisedPreferenceShareCapital', next)}
          />
          <AmountInputField
            id="cap-structure-total-authorised-moa"
            label="Total authorised share capital as per MoA"
            unit={unit}
            rupees={value.totalAuthorisedShareCapitalAsPerMoa}
            onChange={(next) => set('totalAuthorisedShareCapitalAsPerMoa', next)}
          />
          <AmountInputField
            id="cap-structure-issued-equity"
            label="Issued equity share capital"
            required
            unit={unit}
            rupees={value.issuedEquityShareCapital}
            onChange={(next) => set('issuedEquityShareCapital', next)}
          />
          <AmountInputField
            id="cap-structure-subscribed-equity"
            label="Subscribed equity share capital"
            unit={unit}
            rupees={value.subscribedEquityShareCapital}
            onChange={(next) => set('subscribedEquityShareCapital', next)}
          />
          <AmountInputField
            id="cap-structure-paid-up-equity"
            label="Paid-up equity share capital"
            required
            unit={unit}
            rupees={value.paidUpEquityShareCapital}
            onChange={(next) => set('paidUpEquityShareCapital', next)}
          />
          <AmountInputField
            id="cap-structure-paid-up-preference"
            label="Paid-up preference share capital"
            unit={unit}
            rupees={value.paidUpPreferenceShareCapital}
            onChange={(next) => set('paidUpPreferenceShareCapital', next)}
          />
          <AmountInputField
            id="cap-structure-paid-up-audited"
            label="Paid-up capital as per latest audited financials"
            unit={unit}
            rupees={value.paidUpCapitalAsPerLatestAuditedFinancials}
            onChange={(next) => set('paidUpCapitalAsPerLatestAuditedFinancials', next)}
          />
          <DateField
            id="cap-structure-audited-year-end"
            label="Latest audited financial year end"
            value={value.latestAuditedFinancialYearEnd}
            onChange={(next) => set('latestAuditedFinancialYearEnd', next)}
          />
          <DateField
            id="cap-structure-last-change"
            label="Last capital change date"
            value={value.lastCapitalChangeDate}
            onChange={(next) => set('lastCapitalChangeDate', next)}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Records, depository and issuer responses">
        <FieldGrid>
          <TernaryField
            id="cap-structure-mca-match"
            label="Share capital agrees with MCA records"
            required
            value={value.shareCapitalMatchesMcaRecords}
            onChange={(next) => set('shareCapitalMatchesMcaRecords', next)}
          />
          <TernaryField
            id="cap-structure-fully-paid"
            label="All shares fully paid up"
            required
            value={value.allSharesFullyPaidUp}
            onChange={(next) => set('allSharesFullyPaidUp', next)}
          />
          <TernaryField
            id="cap-structure-partly-paid"
            label="Partly paid shares outstanding"
            value={value.partlyPaidSharesOutstanding}
            onChange={(next) => set('partlyPaidSharesOutstanding', next)}
          />
          <TernaryField
            id="cap-structure-calls-arrears"
            label="Any calls in arrears?"
            value={value.hasCallsInArrears}
            onChange={(next) => set('hasCallsInArrears', next)}
          />
          <TernaryField
            id="cap-structure-forfeited"
            label="Any forfeited shares?"
            value={value.hasForfeitedShares}
            onChange={(next) => set('hasForfeitedShares', next)}
          />
          <TernaryField
            id="cap-structure-capital-reduction"
            label="Any capital reduction?"
            value={value.hasCapitalReduction}
            onChange={(next) => set('hasCapitalReduction', next)}
          />
          <TernaryField
            id="cap-structure-dvr"
            label="Any class with differential rights?"
            value={value.sharesWithDifferentialVotingRightsExist}
            onChange={(next) => set('sharesWithDifferentialVotingRightsExist', next)}
          />
          <TernaryField
            id="cap-structure-alteration-pending"
            label="Any capital alteration currently pending?"
            value={value.capitalAlterationCurrentlyPending}
            onChange={(next) => set('capitalAlterationCurrentlyPending', next)}
          />
          <TextInputField
            id="cap-structure-equity-isin"
            label="Equity ISIN"
            value={value.equityIsin}
            onChange={(next) => set('equityIsin', next)}
          />
          <SelectField
            id="cap-structure-depository"
            label="Depository connectivity"
            value={value.depositoryConnectivity}
            onChange={(next) =>
              set(
                'depositoryConnectivity',
                next as CurrentCapitalStructure['depositoryConnectivity'],
              )
            }
            options={depositoryConnectivityOptions}
          />
          <TextInputField
            id="cap-structure-rta"
            label="Registrar and transfer agent"
            value={value.registrarAndTransferAgentName}
            onChange={(next) => set('registrarAndTransferAgentName', next)}
          />
          <SelectField
            id="cap-structure-demat-overall"
            label="Overall dematerialisation status"
            required
            value={value.dematStatusOverall}
            onChange={(next) =>
              set('dematStatusOverall', next as CurrentCapitalStructure['dematStatusOverall'])
            }
            options={dematStatusOptions}
          />
          <TernaryField
            id="cap-structure-authorised-sufficient"
            label="Authorised capital sufficient for the proposed issue"
            value={value.authorisedCapitalSufficientForProposedIssue}
            onChange={(next) => set('authorisedCapitalSufficientForProposedIssue', next)}
          />
          {value.authorisedCapitalSufficientForProposedIssue === 'no' ? (
            <AmountInputField
              id="cap-structure-authorised-increase"
              label="Increase in authorised capital required"
              unit={unit}
              rupees={value.authorisedCapitalIncreaseRequiredAmount}
              onChange={(next) => set('authorisedCapitalIncreaseRequiredAmount', next)}
            />
          ) : null}
        </FieldGrid>

        {value.shareCapitalMatchesMcaRecords === 'no' ? (
          <TextAreaField
            id="cap-structure-mca-discrepancy"
            label="Discrepancy with MCA records — explanation"
            required
            value={value.discrepancyWithMcaRecordsExplanation}
            onChange={(next) => set('discrepancyWithMcaRecordsExplanation', next)}
          />
        ) : null}
        {value.partlyPaidSharesOutstanding === 'yes' ? (
          <TextAreaField
            id="cap-structure-partly-paid-details"
            label="Partly paid shares — details"
            required
            value={value.partlyPaidSharesDetails}
            onChange={(next) => set('partlyPaidSharesDetails', next)}
          />
        ) : null}
        {value.hasCallsInArrears === 'yes' ? (
          <TextAreaField
            id="cap-structure-calls-arrears-details"
            label="Calls in arrears — explanation"
            required
            value={value.callsInArrearsExplanation}
            onChange={(next) => set('callsInArrearsExplanation', next)}
          />
        ) : null}
        {value.hasForfeitedShares === 'yes' ? (
          <TextAreaField
            id="cap-structure-forfeited-details"
            label="Forfeited shares — explanation"
            required
            value={value.forfeitedSharesExplanation}
            onChange={(next) => set('forfeitedSharesExplanation', next)}
          />
        ) : null}
        {value.hasCapitalReduction === 'yes' ? (
          <TextAreaField
            id="cap-structure-reduction-details"
            label="Capital reduction — explanation"
            required
            value={value.capitalReductionExplanation}
            onChange={(next) => set('capitalReductionExplanation', next)}
          />
        ) : null}
        {value.sharesWithDifferentialVotingRightsExist === 'yes' ? (
          <TextAreaField
            id="cap-structure-dvr-details"
            label="Differential voting rights — details"
            required
            value={value.differentialVotingRightsDetails}
            onChange={(next) => set('differentialVotingRightsDetails', next)}
          />
        ) : null}
        {value.capitalAlterationCurrentlyPending === 'yes' ? (
          <TextAreaField
            id="cap-structure-alteration-details"
            label="Pending capital alteration — explanation"
            required
            value={value.capitalAlterationPendingExplanation}
            onChange={(next) => set('capitalAlterationPendingExplanation', next)}
          />
        ) : null}
      </SubSection>

      <TextAreaField
        id="cap-structure-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <StatGrid title="Computed (not persisted)">
        <ComputedStat
          label="Authorised equity shares"
          value={formatShares(totals.authorisedEquityShares)}
        />
        <ComputedStat label="Issued equity shares" value={formatShares(totals.issuedEquityShares)} />
        <ComputedStat
          label="Paid-up equity shares"
          value={formatShares(totals.paidUpEquityShares)}
        />
        <ComputedStat
          label="Paid-up capital from classes"
          value={formatMoneyCompact(totals.paidUpEquityCapitalFromClasses)}
        />
        <ComputedStat
          label="Authorised capital from classes"
          value={formatMoneyCompact(totals.authorisedEquityCapitalFromClasses)}
        />
        <ComputedStat
          label="Implied face value"
          value={formatMoneyCompact(totals.impliedEquityFaceValue)}
        />
        <ComputedStat
          label="Dematerialised holding"
          value={formatPercent(totals.dematerialisedPercentage)}
        />
        <ComputedStat
          label="Paid-up capital variance"
          value={formatMoneyCompact(totals.paidUpEquityCapitalVariance)}
        />
      </StatGrid>

      <CapitalOwnershipSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
