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
  TableScroll,
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
  createEmptyBeneficialOwner,
  createEmptyShareholder,
} from '@/lib/capital-ownership/defaults';
import { EM_DASH, formatPercent, formatShares } from '@/lib/capital-ownership/format';
import {
  acquisitionModeOptions,
  beneficialInterestNatureOptions,
  holderTypeOptions,
  identifierTypeOptions,
  residentialStatusOptions,
  SHAREHOLDER_CATEGORY_LABELS,
  shareholderCategoryOptions,
} from '@/lib/capital-ownership/options';
import type {
  BeneficialOwner,
  Shareholder,
  ShareholdersAndBeneficialOwnership,
} from '@/lib/capital-ownership/types';

const SECTION_ID = 'shareholders-beneficial-ownership' as const;

function categoryLabel(category: string): string {
  if (!category) return 'Category not set';
  return (
    SHAREHOLDER_CATEGORY_LABELS[category as keyof typeof SHAREHOLDER_CATEGORY_LABELS] ?? category
  );
}

export function ShareholdersForm() {
  const { payload, updateSection, model } = useCapitalOwnership();
  const value = payload.shareholdersAndBeneficialOwnership;
  const capTable = model.capTable;

  const equityClassOptions = useMemo(
    () =>
      payload.currentCapitalStructure.equityClasses.map((item, index) => ({
        value: item.id,
        label: item.className || `Equity class ${index + 1}`,
      })),
    [payload.currentCapitalStructure.equityClasses],
  );

  const shareholderOptions = useMemo(
    () =>
      value.shareholders.map((item, index) => ({
        value: item.id,
        label: item.name || `Shareholder ${index + 1}`,
      })),
    [value.shareholders],
  );

  const set = <K extends keyof ShareholdersAndBeneficialOwnership>(
    key: K,
    next: ShareholdersAndBeneficialOwnership[K],
  ) => {
    updateSection('shareholdersAndBeneficialOwnership', { ...value, [key]: next }, SECTION_ID);
  };

  const setShareholder = <K extends keyof Shareholder>(
    index: number,
    key: K,
    next: Shareholder[K],
  ) => {
    set(
      'shareholders',
      replaceAt(value.shareholders, index, { ...value.shareholders[index], [key]: next }),
    );
  };

  const setBeneficialOwner = <K extends keyof BeneficialOwner>(
    index: number,
    key: K,
    next: BeneficialOwner[K],
  ) => {
    set(
      'beneficialOwners',
      replaceAt(value.beneficialOwners, index, { ...value.beneficialOwners[index], [key]: next }),
    );
  };

  return (
    <SectionCard
      title="Shareholders & Beneficial Ownership"
      description="Register of members, category-wise holdings and significant beneficial owner details as on the stated date."
    >
      <FieldGrid>
        <DateField
          id="shareholding-as-on-date"
          label="Shareholding as on date"
          required
          value={value.shareholdingAsOnDate}
          onChange={(next) => set('shareholdingAsOnDate', next)}
        />
        <DecimalInputField
          id="shareholders-total-count"
          label="Total number of shareholders"
          required
          value={value.totalNumberOfShareholders}
          onChange={(next) => set('totalNumberOfShareholders', next)}
          helper="Compared with the number of rows recorded below."
        />
      </FieldGrid>

      <RepeatableList
        title="Shareholders"
        description="One row per holder on the register. Category drives the promoter, promoter group and public splits."
        addLabel="Add shareholder"
        count={value.shareholders.length}
        emptyMessage="No shareholder recorded yet."
        onAdd={() => set('shareholders', [...value.shareholders, createEmptyShareholder()])}
      >
        {value.shareholders.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.name || `Shareholder ${index + 1}`}
            subtitle={categoryLabel(item.category)}
            requiresConfirmation={hasRecordData([
              item.name,
              item.category,
              item.equitySharesHeld,
              item.preferenceSharesHeld,
            ])}
            confirmMessage="Remove this shareholder? Linked offer-for-sale and lock-in rows may lose their reference."
            onRemove={() => set('shareholders', removeAt(value.shareholders, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`shareholder-${index}-name`}
                label="Name"
                required
                value={item.name}
                onChange={(next) => setShareholder(index, 'name', next)}
              />
              <SelectField
                id={`shareholder-${index}-category`}
                label="Category"
                required
                value={item.category}
                onChange={(next) =>
                  setShareholder(index, 'category', next as Shareholder['category'])
                }
                options={shareholderCategoryOptions}
              />
              <SelectField
                id={`shareholder-${index}-holder-type`}
                label="Holder type"
                value={item.holderType}
                onChange={(next) =>
                  setShareholder(index, 'holderType', next as Shareholder['holderType'])
                }
                options={holderTypeOptions}
              />
              <SelectField
                id={`shareholder-${index}-residential-status`}
                label="Residential status"
                value={item.residentialStatus}
                onChange={(next) =>
                  setShareholder(index, 'residentialStatus', next as Shareholder['residentialStatus'])
                }
                options={residentialStatusOptions}
              />
              <TextInputField
                id={`shareholder-${index}-nationality`}
                label="Nationality"
                value={item.nationality}
                onChange={(next) => setShareholder(index, 'nationality', next)}
              />
              <SelectField
                id={`shareholder-${index}-identifier-type`}
                label="Identifier type"
                value={item.identifierType}
                onChange={(next) =>
                  setShareholder(index, 'identifierType', next as Shareholder['identifierType'])
                }
                options={identifierTypeOptions}
              />
              <TextInputField
                id={`shareholder-${index}-identifier-value`}
                label="Identifier value"
                value={item.identifierValue}
                onChange={(next) => setShareholder(index, 'identifierValue', next)}
              />
              <TextInputField
                id={`shareholder-${index}-din`}
                label="Director identification number"
                value={item.directorIdentificationNumber}
                onChange={(next) => setShareholder(index, 'directorIdentificationNumber', next)}
              />
              <SelectField
                id={`shareholder-${index}-equity-class`}
                label="Equity class held"
                value={item.equityClassId}
                onChange={(next) => setShareholder(index, 'equityClassId', next)}
                options={equityClassOptions}
                emptyLabel="Not linked to a class"
                helper="Optional link to a class recorded in Current Capital Structure."
              />
              <DecimalInputField
                id={`shareholder-${index}-equity-shares`}
                label="Equity shares held"
                required
                value={item.equitySharesHeld}
                onChange={(next) => setShareholder(index, 'equitySharesHeld', next)}
              />
              <DecimalInputField
                id={`shareholder-${index}-preference-shares`}
                label="Preference shares held"
                value={item.preferenceSharesHeld}
                onChange={(next) => setShareholder(index, 'preferenceSharesHeld', next)}
              />
              <DecimalInputField
                id={`shareholder-${index}-demat-shares`}
                label="Shares in dematerialised form"
                value={item.sharesInDematerialisedForm}
                onChange={(next) => setShareholder(index, 'sharesInDematerialisedForm', next)}
              />
              <DecimalInputField
                id={`shareholder-${index}-physical-shares`}
                label="Shares in physical form"
                value={item.sharesInPhysicalForm}
                onChange={(next) => setShareholder(index, 'sharesInPhysicalForm', next)}
              />
              <TextInputField
                id={`shareholder-${index}-folio`}
                label="Folio / DP client ID"
                value={item.folioOrDpClientId}
                onChange={(next) => setShareholder(index, 'folioOrDpClientId', next)}
              />
              <DateField
                id={`shareholder-${index}-earliest-acquisition`}
                label="Earliest acquisition date"
                value={item.dateOfEarliestAcquisition}
                onChange={(next) => setShareholder(index, 'dateOfEarliestAcquisition', next)}
              />
              <DateField
                id={`shareholder-${index}-latest-acquisition`}
                label="Latest acquisition date"
                value={item.dateOfLatestAcquisition}
                onChange={(next) => setShareholder(index, 'dateOfLatestAcquisition', next)}
              />
              <SelectField
                id={`shareholder-${index}-acquisition-mode`}
                label="Mode of acquisition"
                value={item.modeOfAcquisition}
                onChange={(next) =>
                  setShareholder(index, 'modeOfAcquisition', next as Shareholder['modeOfAcquisition'])
                }
                options={acquisitionModeOptions}
              />
              <DecimalInputField
                id={`shareholder-${index}-average-cost`}
                label="Average cost of acquisition per share (₹)"
                value={item.averageCostOfAcquisitionPerShare}
                onChange={(next) => setShareholder(index, 'averageCostOfAcquisitionPerShare', next)}
              />
              <DecimalInputField
                id={`shareholder-${index}-encumbered`}
                label="Shares encumbered"
                value={item.sharesEncumbered}
                onChange={(next) => setShareholder(index, 'sharesEncumbered', next)}
              />
              <TernaryField
                id={`shareholder-${index}-voting-differ`}
                label="Voting rights differ from shareholding"
                value={item.votingRightsDifferFromShareholding}
                onChange={(next) => setShareholder(index, 'votingRightsDifferFromShareholding', next)}
              />
              {item.votingRightsDifferFromShareholding === 'yes' ? (
                <DecimalInputField
                  id={`shareholder-${index}-voting-percentage`}
                  label="Voting rights (%)"
                  value={item.votingRightsPercentageIfDifferent}
                  onChange={(next) =>
                    setShareholder(index, 'votingRightsPercentageIfDifferent', next)
                  }
                />
              ) : null}
              <TernaryField
                id={`shareholder-${index}-promoter-group`}
                label="Part of the promoter group"
                value={item.isPartOfPromoterGroup}
                onChange={(next) => setShareholder(index, 'isPartOfPromoterGroup', next)}
              />
              <TernaryField
                id={`shareholder-${index}-beneficial-owner-differs`}
                label="Beneficial owner is different"
                value={item.beneficialOwnerIsDifferent}
                onChange={(next) => setShareholder(index, 'beneficialOwnerIsDifferent', next)}
              />
              {item.beneficialOwnerIsDifferent === 'yes' ? (
                <TextInputField
                  id={`shareholder-${index}-beneficial-owner-name`}
                  label="Beneficial owner name"
                  value={item.beneficialOwnerName}
                  onChange={(next) => setShareholder(index, 'beneficialOwnerName', next)}
                />
              ) : null}
              <TernaryField
                id={`shareholder-${index}-selling-shareholder`}
                label="Selling shareholder in the offer"
                value={item.isSellingShareholderInOffer}
                onChange={(next) => setShareholder(index, 'isSellingShareholderInOffer', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`shareholder-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setShareholder(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      {capTable.rows.length > 0 ? (
        <SubSection
          title="Cap table"
          description="Percentages use the current equity share count from Current Capital Structure where available."
        >
          <TableScroll>
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Shareholder
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Equity shares
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    % of equity
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Preference shares
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Encumbered
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Dematerialised
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {capTable.rows.map((row) => (
                  <tr key={row.shareholderId}>
                    <td className="px-3 py-2">{row.name || EM_DASH}</td>
                    <td className="px-3 py-2">{categoryLabel(row.category)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatShares(row.equityShares)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatPercent(row.percentageOfEquity)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatShares(row.preferenceShares)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatShares(row.encumberedShares)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatShares(row.dematerialisedShares)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </SubSection>
      ) : null}

      <SubSection
        title="Register of members and beneficial ownership"
        description="An unanswered question is never read as a negative declaration."
      >
        <FieldGrid>
          <TernaryField
            id="shareholders-register-maintained"
            label="Register of members maintained"
            required
            value={value.registerOfMembersMaintained}
            onChange={(next) => set('registerOfMembersMaintained', next)}
          />
          {value.registerOfMembersMaintained === 'yes' ? (
            <TernaryField
              id="shareholders-register-current"
              label="Register of members is up to date"
              value={value.registerOfMembersUpToDate}
              onChange={(next) => set('registerOfMembersUpToDate', next)}
            />
          ) : null}
          <TernaryField
            id="shareholders-register-reconciled"
            label="Shareholding reconciled with the register of members"
            value={value.shareholdingReconciledWithRegisterOfMembers}
            onChange={(next) => set('shareholdingReconciledWithRegisterOfMembers', next)}
          />
          <TernaryField
            id="shareholders-sbo-determination"
            label="Significant beneficial owner determination completed"
            required
            value={value.significantBeneficialOwnerDeterminationCompleted}
            onChange={(next) => set('significantBeneficialOwnerDeterminationCompleted', next)}
          />
          <TernaryField
            id="shareholders-nominee"
            label="Nominee shareholders exist"
            value={value.nomineeShareholdersExist}
            onChange={(next) => set('nomineeShareholdersExist', next)}
          />
          <TernaryField
            id="shareholders-foreign"
            label="Foreign shareholding exists"
            required
            value={value.foreignShareholdingExists}
            onChange={(next) => set('foreignShareholdingExists', next)}
          />
          {value.foreignShareholdingExists === 'yes' ? (
            <>
              <TernaryField
                id="shareholders-fdi-compliance"
                label="Foreign direct investment compliance confirmed"
                value={value.foreignDirectInvestmentComplianceConfirmed}
                onChange={(next) => set('foreignDirectInvestmentComplianceConfirmed', next)}
              />
              <TernaryField
                id="shareholders-fcgpr"
                label="Form FC-GPR filings completed"
                value={value.formFcGprFilingsCompleted}
                onChange={(next) => set('formFcGprFilingsCompleted', next)}
              />
              <TernaryField
                id="shareholders-sectoral-cap"
                label="Sectoral cap compliance confirmed"
                value={value.sectoralCapComplianceConfirmed}
                onChange={(next) => set('sectoralCapComplianceConfirmed', next)}
              />
            </>
          ) : null}
          <TernaryField
            id="shareholders-investor-agreements"
            label="Shareholder agreements with investors exist"
            required
            value={value.anyShareholderAgreementsWithInvestors}
            onChange={(next) => set('anyShareholderAgreementsWithInvestors', next)}
          />
        </FieldGrid>

        {value.significantBeneficialOwnerDeterminationCompleted === 'no' ? (
          <TextAreaField
            id="shareholders-sbo-not-applicable"
            label="Why the significant beneficial owner determination is not complete"
            value={value.significantBeneficialOwnerNotApplicableReason}
            onChange={(next) => set('significantBeneficialOwnerNotApplicableReason', next)}
          />
        ) : null}
        {value.nomineeShareholdersExist === 'yes' ? (
          <TextAreaField
            id="shareholders-nominee-details"
            label="Nominee shareholders — details"
            required
            value={value.nomineeShareholderDetails}
            onChange={(next) => set('nomineeShareholderDetails', next)}
          />
        ) : null}
        {value.foreignShareholdingExists === 'yes' ? (
          <TextAreaField
            id="shareholders-foreign-notes"
            label="Foreign investment notes"
            rows={2}
            value={value.foreignInvestmentNotes}
            onChange={(next) => set('foreignInvestmentNotes', next)}
          />
        ) : null}
        {value.anyShareholderAgreementsWithInvestors === 'yes' ? (
          <TextAreaField
            id="shareholders-investor-agreement-summary"
            label="Investor agreement summary"
            required
            value={value.investorAgreementSummary}
            onChange={(next) => set('investorAgreementSummary', next)}
          />
        ) : null}
      </SubSection>

      <RepeatableList
        title="Beneficial owners"
        description="Record every significant beneficial owner identified under section 90 of the Companies Act."
        addLabel="Add beneficial owner"
        count={value.beneficialOwners.length}
        emptyMessage="No beneficial owner recorded yet."
        onAdd={() => set('beneficialOwners', [...value.beneficialOwners, createEmptyBeneficialOwner()])}
      >
        {value.beneficialOwners.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.name || `Beneficial owner ${index + 1}`}
            requiresConfirmation={hasRecordData([
              item.name,
              item.identifierValue,
              item.directHoldingPercentage,
              item.indirectHoldingPercentage,
            ])}
            confirmMessage="Remove this beneficial owner record? Entered values will be lost."
            onRemove={() => set('beneficialOwners', removeAt(value.beneficialOwners, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`beneficial-owner-${index}-name`}
                label="Name"
                required
                value={item.name}
                onChange={(next) => setBeneficialOwner(index, 'name', next)}
              />
              <SelectField
                id={`beneficial-owner-${index}-linked-shareholder`}
                label="Linked shareholder"
                value={item.linkedShareholderId}
                onChange={(next) => setBeneficialOwner(index, 'linkedShareholderId', next)}
                options={shareholderOptions}
                emptyLabel="Holds indirectly / not linked"
              />
              <SelectField
                id={`beneficial-owner-${index}-identifier-type`}
                label="Identifier type"
                value={item.identifierType}
                onChange={(next) =>
                  setBeneficialOwner(index, 'identifierType', next as BeneficialOwner['identifierType'])
                }
                options={identifierTypeOptions}
              />
              <TextInputField
                id={`beneficial-owner-${index}-identifier-value`}
                label="Identifier value"
                value={item.identifierValue}
                onChange={(next) => setBeneficialOwner(index, 'identifierValue', next)}
              />
              <TextInputField
                id={`beneficial-owner-${index}-nationality`}
                label="Nationality"
                value={item.nationality}
                onChange={(next) => setBeneficialOwner(index, 'nationality', next)}
              />
              <SelectField
                id={`beneficial-owner-${index}-residential-status`}
                label="Residential status"
                value={item.residentialStatus}
                onChange={(next) =>
                  setBeneficialOwner(
                    index,
                    'residentialStatus',
                    next as BeneficialOwner['residentialStatus'],
                  )
                }
                options={residentialStatusOptions}
              />
              <TernaryField
                id={`beneficial-owner-${index}-is-sbo`}
                label="Significant beneficial owner"
                value={item.isSignificantBeneficialOwner}
                onChange={(next) => setBeneficialOwner(index, 'isSignificantBeneficialOwner', next)}
              />
              <SelectField
                id={`beneficial-owner-${index}-nature`}
                label="Nature of interest"
                value={item.natureOfInterest}
                onChange={(next) =>
                  setBeneficialOwner(
                    index,
                    'natureOfInterest',
                    next as BeneficialOwner['natureOfInterest'],
                  )
                }
                options={beneficialInterestNatureOptions}
              />
              <DecimalInputField
                id={`beneficial-owner-${index}-direct`}
                label="Direct holding (%)"
                value={item.directHoldingPercentage}
                onChange={(next) => setBeneficialOwner(index, 'directHoldingPercentage', next)}
              />
              <DecimalInputField
                id={`beneficial-owner-${index}-indirect`}
                label="Indirect holding (%)"
                value={item.indirectHoldingPercentage}
                onChange={(next) => setBeneficialOwner(index, 'indirectHoldingPercentage', next)}
              />
              <DateField
                id={`beneficial-owner-${index}-date`}
                label="Date of becoming beneficial owner"
                value={item.dateOfBecomingBeneficialOwner}
                onChange={(next) => setBeneficialOwner(index, 'dateOfBecomingBeneficialOwner', next)}
              />
              <TernaryField
                id={`beneficial-owner-${index}-ben1`}
                label="Declaration in Form BEN-1 received"
                value={item.declarationInFormBen1Received}
                onChange={(next) => setBeneficialOwner(index, 'declarationInFormBen1Received', next)}
              />
              <TernaryField
                id={`beneficial-owner-${index}-ben2`}
                label="Form BEN-2 filed"
                value={item.formBen2Filed}
                onChange={(next) => setBeneficialOwner(index, 'formBen2Filed', next)}
              />
              {item.formBen2Filed === 'yes' ? (
                <TextInputField
                  id={`beneficial-owner-${index}-ben2-reference`}
                  label="Form BEN-2 SRN / reference"
                  value={item.formBen2SrnOrReference}
                  onChange={(next) => setBeneficialOwner(index, 'formBen2SrnOrReference', next)}
                />
              ) : null}
              <TernaryField
                id={`beneficial-owner-${index}-ben3`}
                label="Register in Form BEN-3 maintained"
                value={item.registerInFormBen3Maintained}
                onChange={(next) => setBeneficialOwner(index, 'registerInFormBen3Maintained', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`beneficial-owner-${index}-chain`}
              label="Chain of ownership"
              rows={2}
              value={item.chainOfOwnershipDescription}
              onChange={(next) => setBeneficialOwner(index, 'chainOfOwnershipDescription', next)}
            />
            <TextAreaField
              id={`beneficial-owner-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setBeneficialOwner(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="shareholders-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <StatGrid title="Computed (not persisted)">
        <ComputedStat
          label="Shares on the register"
          value={formatShares(capTable.totalEquitySharesFromRegister)}
        />
        <ComputedStat
          label="Promoter & group holding"
          value={formatPercent(capTable.groups.promoterAndGroupPercentage)}
        />
        <ComputedStat label="Public holding" value={formatPercent(capTable.groups.publicPercentage)} />
        <ComputedStat
          label="Register variance"
          value={formatShares(capTable.registerVariance)}
        />
        <ComputedStat
          label="Encumbered shares"
          value={formatShares(capTable.totalEncumberedShares)}
        />
        <ComputedStat
          label="Rows without a category"
          value={String(capTable.shareholdersWithoutCategory)}
        />
        <ComputedStat
          label="Rows without a share count"
          value={String(capTable.shareholdersWithoutShareCount)}
        />
        <ComputedStat
          label="Preference shares held"
          value={formatShares(capTable.totalPreferenceShares)}
        />
      </StatGrid>

      <CapitalOwnershipSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
