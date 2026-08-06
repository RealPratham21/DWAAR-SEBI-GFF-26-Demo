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
  createEmptyControlArrangement,
  createEmptyPromoter,
  createEmptyPromoterGroupMember,
} from '@/lib/capital-ownership/defaults';
import { formatPercent, formatShares } from '@/lib/capital-ownership/format';
import {
  controlArrangementTypeOptions,
  identifierTypeOptions,
  promoterGroupBasisOptions,
  promoterGroupRelationshipOptions,
  promoterStatusBasisOptions,
  promoterTypeOptions,
  residentialStatusOptions,
} from '@/lib/capital-ownership/options';
import type {
  ControlArrangement,
  Promoter,
  PromoterGroupMember,
  PromotersAndControl,
} from '@/lib/capital-ownership/types';

const SECTION_ID = 'promoters-and-control' as const;

export function PromotersControlForm() {
  const { payload, updateSection, model } = useCapitalOwnership();
  const value = payload.promotersAndControl;
  const capTable = model.capTable;
  const hasPromoter = value.companyHasIdentifiedPromoter === 'yes';

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
      value.promoters.map((item, index) => ({
        value: item.id,
        label: item.name || `Promoter ${index + 1}`,
      })),
    [value.promoters],
  );

  const set = <K extends keyof PromotersAndControl>(key: K, next: PromotersAndControl[K]) => {
    updateSection('promotersAndControl', { ...value, [key]: next }, SECTION_ID);
  };

  const setPromoter = <K extends keyof Promoter>(index: number, key: K, next: Promoter[K]) => {
    set('promoters', replaceAt(value.promoters, index, { ...value.promoters[index], [key]: next }));
  };

  const setGroupMember = <K extends keyof PromoterGroupMember>(
    index: number,
    key: K,
    next: PromoterGroupMember[K],
  ) => {
    set(
      'promoterGroupMembers',
      replaceAt(value.promoterGroupMembers, index, {
        ...value.promoterGroupMembers[index],
        [key]: next,
      }),
    );
  };

  const setArrangement = <K extends keyof ControlArrangement>(
    index: number,
    key: K,
    next: ControlArrangement[K],
  ) => {
    set(
      'controlArrangements',
      replaceAt(value.controlArrangements, index, {
        ...value.controlArrangements[index],
        [key]: next,
      }),
    );
  };

  return (
    <SectionCard
      title="Promoters & Control"
      description="Promoters, promoter group members, and the agreements or rights that confer control over the issuer."
    >
      <FieldGrid>
        <TernaryField
          id="promoters-has-identified-promoter"
          label="The company has an identified promoter"
          required
          value={value.companyHasIdentifiedPromoter}
          onChange={(next) => set('companyHasIdentifiedPromoter', next)}
        />
        <TernaryField
          id="promoters-identification-complete"
          label="Promoter identification is complete"
          required
          value={value.promoterIdentificationComplete}
          onChange={(next) => set('promoterIdentificationComplete', next)}
        />
        <TernaryField
          id="promoters-group-identification-complete"
          label="Promoter group identification is complete"
          required
          value={value.promoterGroupIdentificationComplete}
          onChange={(next) => set('promoterGroupIdentificationComplete', next)}
        />
        <TernaryField
          id="promoters-professional-confirmation"
          label="Professional confirmation on promoter identification obtained"
          value={value.professionalConfirmationOnPromoterIdentification}
          onChange={(next) => set('professionalConfirmationOnPromoterIdentification', next)}
        />
      </FieldGrid>

      {value.companyHasIdentifiedPromoter === 'no' ? (
        <TextAreaField
          id="promoters-no-promoter-explanation"
          label="Why the issuer is classified as promoter-less"
          required
          value={value.noPromoterExplanation}
          onChange={(next) => set('noPromoterExplanation', next)}
        />
      ) : null}

      {hasPromoter || value.promoters.length > 0 ? (
        <RepeatableList
          title="Promoters"
          description="Holdings recorded here are compared with the promoter rows on the shareholder register."
          addLabel="Add promoter"
          count={value.promoters.length}
          emptyMessage="No promoter recorded yet."
          onAdd={() => set('promoters', [...value.promoters, createEmptyPromoter()])}
        >
          {value.promoters.map((item, index) => (
            <RepeatableCard
              key={item.id}
              title={item.name || `Promoter ${index + 1}`}
              requiresConfirmation={hasRecordData([
                item.name,
                item.identifierValue,
                item.equitySharesHeld,
                item.basisOfPromoterStatus,
              ])}
              confirmMessage="Remove this promoter? Linked promoter group members and contribution lots may lose their reference."
              onRemove={() => set('promoters', removeAt(value.promoters, index))}
            >
              <FieldGrid>
                <TextInputField
                  id={`promoter-${index}-name`}
                  label="Name"
                  required
                  value={item.name}
                  onChange={(next) => setPromoter(index, 'name', next)}
                />
                <SelectField
                  id={`promoter-${index}-type`}
                  label="Promoter type"
                  required
                  value={item.promoterType}
                  onChange={(next) =>
                    setPromoter(index, 'promoterType', next as Promoter['promoterType'])
                  }
                  options={promoterTypeOptions}
                />
                <SelectField
                  id={`promoter-${index}-linked-shareholder`}
                  label="Linked shareholder"
                  value={item.linkedShareholderId}
                  onChange={(next) => setPromoter(index, 'linkedShareholderId', next)}
                  options={shareholderOptions}
                  emptyLabel="Holds no shares directly"
                />
                <SelectField
                  id={`promoter-${index}-basis`}
                  label="Basis of promoter status"
                  required
                  value={item.basisOfPromoterStatus}
                  onChange={(next) =>
                    setPromoter(
                      index,
                      'basisOfPromoterStatus',
                      next as Promoter['basisOfPromoterStatus'],
                    )
                  }
                  options={promoterStatusBasisOptions}
                />
                <SelectField
                  id={`promoter-${index}-identifier-type`}
                  label="Identifier type"
                  value={item.identifierType}
                  onChange={(next) =>
                    setPromoter(index, 'identifierType', next as Promoter['identifierType'])
                  }
                  options={identifierTypeOptions}
                />
                <TextInputField
                  id={`promoter-${index}-identifier-value`}
                  label="Identifier value"
                  value={item.identifierValue}
                  onChange={(next) => setPromoter(index, 'identifierValue', next)}
                />
                <TextInputField
                  id={`promoter-${index}-din`}
                  label="Director identification number"
                  value={item.directorIdentificationNumber}
                  onChange={(next) => setPromoter(index, 'directorIdentificationNumber', next)}
                />
                <TextInputField
                  id={`promoter-${index}-nationality`}
                  label="Nationality"
                  value={item.nationality}
                  onChange={(next) => setPromoter(index, 'nationality', next)}
                />
                <SelectField
                  id={`promoter-${index}-residential-status`}
                  label="Residential status"
                  value={item.residentialStatus}
                  onChange={(next) =>
                    setPromoter(index, 'residentialStatus', next as Promoter['residentialStatus'])
                  }
                  options={residentialStatusOptions}
                />
                <DateField
                  id={`promoter-${index}-date`}
                  label="Date of becoming promoter"
                  value={item.dateOfBecomingPromoter}
                  onChange={(next) => setPromoter(index, 'dateOfBecomingPromoter', next)}
                />
                <DecimalInputField
                  id={`promoter-${index}-shares`}
                  label="Equity shares held"
                  value={item.equitySharesHeld}
                  onChange={(next) => setPromoter(index, 'equitySharesHeld', next)}
                />
                <TernaryField
                  id={`promoter-${index}-is-director`}
                  label="Also a director"
                  value={item.isAlsoDirector}
                  onChange={(next) => setPromoter(index, 'isAlsoDirector', next)}
                />
                {item.isAlsoDirector === 'yes' ? (
                  <TextInputField
                    id={`promoter-${index}-designation`}
                    label="Designation"
                    value={item.designation}
                    onChange={(next) => setPromoter(index, 'designation', next)}
                  />
                ) : null}
                <TernaryField
                  id={`promoter-${index}-selling`}
                  label="Selling in the offer"
                  value={item.isPartOfPromoterSellingInOffer}
                  onChange={(next) => setPromoter(index, 'isPartOfPromoterSellingInOffer', next)}
                />
              </FieldGrid>
              {item.basisOfPromoterStatus === 'other' ? (
                <TextAreaField
                  id={`promoter-${index}-basis-explanation`}
                  label="Basis of promoter status — explanation"
                  rows={2}
                  value={item.basisExplanation}
                  onChange={(next) => setPromoter(index, 'basisExplanation', next)}
                />
              ) : null}
              <TextAreaField
                id={`promoter-${index}-relationship`}
                label="Relationship with other promoters"
                rows={2}
                value={item.relationshipWithOtherPromoters}
                onChange={(next) => setPromoter(index, 'relationshipWithOtherPromoters', next)}
              />
              <TextAreaField
                id={`promoter-${index}-notes`}
                label="Notes"
                rows={2}
                value={item.notes}
                onChange={(next) => setPromoter(index, 'notes', next)}
              />
            </RepeatableCard>
          ))}
        </RepeatableList>
      ) : null}

      <RepeatableList
        title="Promoter group members"
        description="Immediate relatives and entities pulled in by the promoter group definition."
        addLabel="Add promoter group member"
        count={value.promoterGroupMembers.length}
        emptyMessage="No promoter group member recorded yet."
        onAdd={() =>
          set('promoterGroupMembers', [
            ...value.promoterGroupMembers,
            createEmptyPromoterGroupMember(),
          ])
        }
      >
        {value.promoterGroupMembers.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.name || `Promoter group member ${index + 1}`}
            requiresConfirmation={hasRecordData([
              item.name,
              item.relationshipToPromoter,
              item.equitySharesHeld,
            ])}
            confirmMessage="Remove this promoter group member? Entered values will be lost."
            onRemove={() =>
              set('promoterGroupMembers', removeAt(value.promoterGroupMembers, index))
            }
          >
            <FieldGrid>
              <TextInputField
                id={`promoter-group-${index}-name`}
                label="Name"
                required
                value={item.name}
                onChange={(next) => setGroupMember(index, 'name', next)}
              />
              <SelectField
                id={`promoter-group-${index}-related-promoter`}
                label="Related promoter"
                value={item.relatedPromoterId}
                onChange={(next) => setGroupMember(index, 'relatedPromoterId', next)}
                options={promoterOptions}
                emptyLabel="Not attributable to one promoter"
              />
              <SelectField
                id={`promoter-group-${index}-relationship`}
                label="Relationship to promoter"
                required
                value={item.relationshipToPromoter}
                onChange={(next) =>
                  setGroupMember(
                    index,
                    'relationshipToPromoter',
                    next as PromoterGroupMember['relationshipToPromoter'],
                  )
                }
                options={promoterGroupRelationshipOptions}
              />
              <SelectField
                id={`promoter-group-${index}-basis`}
                label="Inclusion basis"
                value={item.inclusionBasis}
                onChange={(next) =>
                  setGroupMember(index, 'inclusionBasis', next as PromoterGroupMember['inclusionBasis'])
                }
                options={promoterGroupBasisOptions}
              />
              <SelectField
                id={`promoter-group-${index}-member-type`}
                label="Member type"
                value={item.memberType}
                onChange={(next) =>
                  setGroupMember(index, 'memberType', next as PromoterGroupMember['memberType'])
                }
                options={promoterTypeOptions}
              />
              <SelectField
                id={`promoter-group-${index}-identifier-type`}
                label="Identifier type"
                value={item.identifierType}
                onChange={(next) =>
                  setGroupMember(
                    index,
                    'identifierType',
                    next as PromoterGroupMember['identifierType'],
                  )
                }
                options={identifierTypeOptions}
              />
              <TextInputField
                id={`promoter-group-${index}-identifier-value`}
                label="Identifier value"
                value={item.identifierValue}
                onChange={(next) => setGroupMember(index, 'identifierValue', next)}
              />
              <TernaryField
                id={`promoter-group-${index}-is-shareholder`}
                label="Is a shareholder"
                value={item.isShareholder}
                onChange={(next) => setGroupMember(index, 'isShareholder', next)}
              />
              {item.isShareholder === 'yes' ? (
                <>
                  <SelectField
                    id={`promoter-group-${index}-linked-shareholder`}
                    label="Linked shareholder"
                    value={item.linkedShareholderId}
                    onChange={(next) => setGroupMember(index, 'linkedShareholderId', next)}
                    options={shareholderOptions}
                    emptyLabel="Not linked"
                  />
                  <DecimalInputField
                    id={`promoter-group-${index}-shares`}
                    label="Equity shares held"
                    value={item.equitySharesHeld}
                    onChange={(next) => setGroupMember(index, 'equitySharesHeld', next)}
                  />
                </>
              ) : null}
            </FieldGrid>
            {item.inclusionBasis === 'other' ? (
              <TextAreaField
                id={`promoter-group-${index}-basis-explanation`}
                label="Inclusion basis — explanation"
                rows={2}
                value={item.inclusionBasisExplanation}
                onChange={(next) => setGroupMember(index, 'inclusionBasisExplanation', next)}
              />
            ) : null}
            <TextAreaField
              id={`promoter-group-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setGroupMember(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Control arrangements"
        description="Agreements and rights that confer control. Arrangements surviving listing without an agreed termination are flagged in the Capital Assessment."
        addLabel="Add control arrangement"
        count={value.controlArrangements.length}
        emptyMessage="No control arrangement recorded yet."
        onAdd={() =>
          set('controlArrangements', [...value.controlArrangements, createEmptyControlArrangement()])
        }
      >
        {value.controlArrangements.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.arrangementName || `Control arrangement ${index + 1}`}
            requiresConfirmation={hasRecordData([
              item.arrangementType,
              item.arrangementName,
              item.partiesInvolved,
              item.keyRightsSummary,
            ])}
            confirmMessage="Remove this control arrangement? Entered values will be lost."
            onRemove={() => set('controlArrangements', removeAt(value.controlArrangements, index))}
          >
            <FieldGrid>
              <SelectField
                id={`control-arrangement-${index}-type`}
                label="Arrangement type"
                required
                value={item.arrangementType}
                onChange={(next) =>
                  setArrangement(
                    index,
                    'arrangementType',
                    next as ControlArrangement['arrangementType'],
                  )
                }
                options={controlArrangementTypeOptions}
              />
              <TextInputField
                id={`control-arrangement-${index}-name`}
                label="Arrangement name"
                value={item.arrangementName}
                onChange={(next) => setArrangement(index, 'arrangementName', next)}
              />
              <DateField
                id={`control-arrangement-${index}-effective`}
                label="Effective date"
                value={item.effectiveDate}
                onChange={(next) => setArrangement(index, 'effectiveDate', next)}
              />
              <DateField
                id={`control-arrangement-${index}-expiry`}
                label="Expiry date"
                value={item.expiryDate}
                onChange={(next) => setArrangement(index, 'expiryDate', next)}
              />
              <TernaryField
                id={`control-arrangement-${index}-confers-control`}
                label="Confers control over the issuer"
                value={item.conferControlOverIssuer}
                onChange={(next) => setArrangement(index, 'conferControlOverIssuer', next)}
              />
              <TernaryField
                id={`control-arrangement-${index}-survives`}
                label="Survives post-listing"
                value={item.survivesPostListing}
                onChange={(next) => setArrangement(index, 'survivesPostListing', next)}
              />
              {item.survivesPostListing === 'yes' ? (
                <TernaryField
                  id={`control-arrangement-${index}-termination`}
                  label="Termination on listing agreed"
                  value={item.terminationOnListingAgreed}
                  onChange={(next) => setArrangement(index, 'terminationOnListingAgreed', next)}
                />
              ) : null}
              <TernaryField
                id={`control-arrangement-${index}-amendment`}
                label="Amendment required before filing"
                value={item.amendmentRequiredBeforeFiling}
                onChange={(next) => setArrangement(index, 'amendmentRequiredBeforeFiling', next)}
              />
              <TernaryField
                id={`control-arrangement-${index}-disclosed`}
                label="Disclosed in the offer document"
                value={item.disclosedInOfferDocument}
                onChange={(next) => setArrangement(index, 'disclosedInOfferDocument', next)}
              />
              <TextInputField
                id={`control-arrangement-${index}-document`}
                label="Document reference"
                value={item.documentReference}
                onChange={(next) => setArrangement(index, 'documentReference', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`control-arrangement-${index}-parties`}
              label="Parties involved"
              required
              rows={2}
              value={item.partiesInvolved}
              onChange={(next) => setArrangement(index, 'partiesInvolved', next)}
            />
            <TextAreaField
              id={`control-arrangement-${index}-rights`}
              label="Key rights summary"
              rows={2}
              value={item.keyRightsSummary}
              onChange={(next) => setArrangement(index, 'keyRightsSummary', next)}
            />
            <TextAreaField
              id={`control-arrangement-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setArrangement(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Control, changes and disqualifications">
        <FieldGrid>
          <TernaryField
            id="promoters-control-without-shareholding"
            label="Any person exercises control without shareholding"
            required
            value={value.anyPersonExercisingControlWithoutShareholding}
            onChange={(next) => set('anyPersonExercisingControlWithoutShareholding', next)}
          />
          <TernaryField
            id="promoters-change-in-control"
            label="Change in control in the last three years"
            required
            value={value.changeInControlInLastThreeYears}
            onChange={(next) => set('changeInControlInLastThreeYears', next)}
          />
          <TernaryField
            id="promoters-body-corporate"
            label="Any promoter is a body corporate"
            value={value.anyPromoterIsBodyCorporate}
            onChange={(next) => set('anyPromoterIsBodyCorporate', next)}
          />
          {value.anyPromoterIsBodyCorporate === 'yes' ? (
            <TernaryField
              id="promoters-body-corporate-disclosed"
              label="Body corporate promoter ownership disclosed"
              value={value.promoterBodyCorporateOwnershipDisclosed}
              onChange={(next) => set('promoterBodyCorporateOwnershipDisclosed', next)}
            />
          ) : null}
          <TernaryField
            id="promoters-wilful-defaulter"
            label="Any promoter classified as a wilful defaulter"
            value={value.anyPromoterClassifiedAsWilfulDefaulter}
            onChange={(next) => set('anyPromoterClassifiedAsWilfulDefaulter', next)}
          />
        </FieldGrid>

        {value.anyPersonExercisingControlWithoutShareholding === 'yes' ? (
          <TextAreaField
            id="promoters-control-without-shareholding-details"
            label="Control without shareholding — details"
            required
            value={value.controlWithoutShareholdingDetails}
            onChange={(next) => set('controlWithoutShareholdingDetails', next)}
          />
        ) : null}
        {value.changeInControlInLastThreeYears === 'yes' ? (
          <TextAreaField
            id="promoters-change-in-control-details"
            label="Change in control — details"
            required
            value={value.changeInControlDetails}
            onChange={(next) => set('changeInControlDetails', next)}
          />
        ) : null}
        {value.anyPromoterClassifiedAsWilfulDefaulter === 'yes' ? (
          <TextAreaField
            id="promoters-disqualification-details"
            label="Promoter disqualification — details"
            required
            value={value.promoterDisqualificationDetails}
            onChange={(next) => set('promoterDisqualificationDetails', next)}
          />
        ) : null}
      </SubSection>

      <TextAreaField
        id="promoters-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <StatGrid title="Computed (not persisted)">
        <ComputedStat
          label="Promoter shares (register)"
          value={formatShares(capTable.groups.promoterShares)}
        />
        <ComputedStat
          label="Promoter group shares"
          value={formatShares(capTable.groups.promoterGroupShares)}
        />
        <ComputedStat
          label="Promoter & group holding"
          value={formatPercent(capTable.groups.promoterAndGroupPercentage)}
        />
        <ComputedStat label="Promoter records" value={String(value.promoters.length)} />
      </StatGrid>

      <CapitalOwnershipSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
