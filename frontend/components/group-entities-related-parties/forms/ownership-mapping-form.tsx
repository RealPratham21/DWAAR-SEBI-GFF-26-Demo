'use client';

import {
  EntityPicker,
  FieldGrid,
  LinkedWorkstreamNotice,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/group-entities-related-parties/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/group-entities-related-parties/repeatable-card';
import { GroupEntitiesSectionActions } from '@/components/group-entities-related-parties/section-actions';
import { DecimalInputField } from '@/components/management-governance/form-helpers';
import { useGroupEntities } from '@/lib/group-entities-related-parties/context';
import { deriveOwnershipChainSummary } from '@/lib/group-entities-related-parties/compute';
import {
  createEmptyCommonPersonRelationshipRecord,
  createEmptyContractualArrangementRecord,
  createEmptyOwnershipRelationshipRecord,
} from '@/lib/group-entities-related-parties/defaults';
import { formatEntityLabel } from '@/lib/group-entities-related-parties/entities';
import {
  AGREEMENT_TYPE_OPTIONS,
  COMMON_PERSON_RELATIONSHIP_OPTIONS,
  CURRENT_HISTORICAL_OPTIONS,
  LINKED_PERSON_ROLE_OPTIONS,
  OWNERSHIP_RELATIONSHIP_TYPE_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
} from '@/lib/group-entities-related-parties/options';
import type {
  AgreementType,
  CommonPersonRelationshipRecord,
  CommonPersonRelationshipType,
  ContractualArrangementRecord,
  CurrentHistorical,
  LinkedPersonRole,
  OwnershipControlAndRelationshipMapping,
  OwnershipRelationshipRecord,
  OwnershipRelationshipType,
  ProfessionalConfirmationStatus,
} from '@/lib/schemas/group-entities-related-parties';

const SECTION_ID = 'ownership-control-and-relationship-mapping' as const;

export function OwnershipMappingForm() {
  const { payload, updateSection, linkedReferences } = useGroupEntities();
  const value = payload.ownershipControlAndRelationshipMapping;
  const chainSummary = deriveOwnershipChainSummary(payload);

  const set = <K extends keyof OwnershipControlAndRelationshipMapping>(
    key: K,
    next: OwnershipControlAndRelationshipMapping[K],
  ) => {
    updateSection('ownershipControlAndRelationshipMapping', { ...value, [key]: next }, SECTION_ID);
  };

  const setOwnership = (next: OwnershipRelationshipRecord[]) => set('ownershipRelationships', next);

  const setOwnershipRecord = <K extends keyof OwnershipRelationshipRecord>(
    index: number,
    key: K,
    next: OwnershipRelationshipRecord[K],
  ) => {
    setOwnership(replaceAt(value.ownershipRelationships, index, { ...value.ownershipRelationships[index], [key]: next }));
  };

  const setArrangements = (next: ContractualArrangementRecord[]) => set('contractualArrangements', next);

  const setArrangement = <K extends keyof ContractualArrangementRecord>(
    index: number,
    key: K,
    next: ContractualArrangementRecord[K],
  ) => {
    setArrangements(
      replaceAt(value.contractualArrangements, index, { ...value.contractualArrangements[index], [key]: next }),
    );
  };

  const setCommonPerson = (next: CommonPersonRelationshipRecord[]) =>
    set('commonPersonRelationships', next);

  const setCommonPersonRecord = <K extends keyof CommonPersonRelationshipRecord>(
    index: number,
    key: K,
    next: CommonPersonRelationshipRecord[K],
  ) => {
    setCommonPerson(
      replaceAt(value.commonPersonRelationships, index, {
        ...value.commonPersonRelationships[index],
        [key]: next,
      }),
    );
  };

  const controlRightFields = [
    ['rightToAppointRemoveBoard', 'Right to appoint/remove board'],
    ['boardNominationRights', 'Board nomination rights'],
    ['vetoRights', 'Veto rights'],
    ['affirmativeVotingRights', 'Affirmative voting rights'],
    ['managementControlRights', 'Management control rights'],
    ['jointControlArrangement', 'Joint control arrangement'],
    ['participationInBusinessDecisions', 'Participation in business decisions'],
  ] as const;

  return (
    <SectionCard
      title="Ownership, Control & Relationship Mapping"
      description="Ownership and control relationships, contractual arrangements and common-person links."
    >
      <RepeatableList
        title="Ownership relationships"
        description="Parent/investee links with ownership percentages and control rights."
        addLabel="Add ownership relationship"
        onAdd={() => setOwnership([...value.ownershipRelationships, createEmptyOwnershipRelationshipRecord()])}
        emptyMessage="No ownership relationships recorded yet."
        count={value.ownershipRelationships.length}
      >
        {value.ownershipRelationships.map((rel, index) => (
          <RepeatableCard
            key={rel.id}
            title={`${formatEntityLabel(payload.groupStructureAndEntityMaster.entities.find((e) => e.id === rel.parentPartyEntityId), rel.parentPartyEntityId)} → ${formatEntityLabel(payload.groupStructureAndEntityMaster.entities.find((e) => e.id === rel.investeeEntityId), rel.investeeEntityId)}`}
            subtitle={rel.relationshipType || undefined}
            onRemove={() => setOwnership(removeAt(value.ownershipRelationships, index))}
          >
            <FieldGrid columns={3}>
              <EntityPicker
                id={`own-${rel.id}-parent`}
                label="Parent party"
                value={rel.parentPartyEntityId}
                onChange={(next) => setOwnershipRecord(index, 'parentPartyEntityId', next)}
                payload={payload}
              />
              <EntityPicker
                id={`own-${rel.id}-investee`}
                label="Investee entity"
                value={rel.investeeEntityId}
                onChange={(next) => setOwnershipRecord(index, 'investeeEntityId', next)}
                payload={payload}
              />
              <SelectField
                id={`own-${rel.id}-type`}
                label="Relationship type"
                value={rel.relationshipType}
                onChange={(next) =>
                  setOwnershipRecord(index, 'relationshipType', next as OwnershipRelationshipType | '')
                }
                options={OWNERSHIP_RELATIONSHIP_TYPE_OPTIONS}
              />
              <DecimalInputField
                id={`own-${rel.id}-equity`}
                label="Equity ownership %"
                value={rel.equityOwnershipPercent}
                onChange={(next) => setOwnershipRecord(index, 'equityOwnershipPercent', next)}
              />
              <DecimalInputField
                id={`own-${rel.id}-voting`}
                label="Voting rights %"
                value={rel.votingRightsPercent}
                onChange={(next) => setOwnershipRecord(index, 'votingRightsPercent', next)}
              />
              <DecimalInputField
                id={`own-${rel.id}-economic`}
                label="Economic interest %"
                value={rel.economicInterestPercent}
                onChange={(next) => setOwnershipRecord(index, 'economicInterestPercent', next)}
              />
              <DecimalInputField
                id={`own-${rel.id}-diluted`}
                label="Fully diluted interest %"
                value={rel.fullyDilutedInterestPercent}
                onChange={(next) => setOwnershipRecord(index, 'fullyDilutedInterestPercent', next)}
              />
              <DecimalInputField
                id={`own-${rel.id}-indirect`}
                label="Effective indirect interest %"
                value={rel.effectiveIndirectInterestPercent}
                onChange={(next) => setOwnershipRecord(index, 'effectiveIndirectInterestPercent', next)}
              />
              <SelectField
                id={`own-${rel.id}-current-historical`}
                label="Current / historical"
                value={rel.currentHistorical}
                onChange={(next) =>
                  setOwnershipRecord(index, 'currentHistorical', next as CurrentHistorical | '')
                }
                options={CURRENT_HISTORICAL_OPTIONS}
              />
              <TextInputField
                id={`own-${rel.id}-effective-from`}
                label="Effective from"
                type="date"
                value={rel.effectiveFrom}
                onChange={(next) => setOwnershipRecord(index, 'effectiveFrom', next)}
              />
              <TextInputField
                id={`own-${rel.id}-effective-until`}
                label="Effective until"
                type="date"
                value={rel.effectiveUntil}
                onChange={(next) => setOwnershipRecord(index, 'effectiveUntil', next)}
              />
              <SelectField
                id={`own-${rel.id}-prof-confirm`}
                label="Professional confirmation"
                value={rel.professionalConfirmationStatus}
                onChange={(next) =>
                  setOwnershipRecord(
                    index,
                    'professionalConfirmationStatus',
                    next as ProfessionalConfirmationStatus | '',
                  )
                }
                options={PROFESSIONAL_CONFIRMATION_OPTIONS}
              />
            </FieldGrid>

            <SubSection title="Control rights">
              <FieldGrid columns={3}>
                {controlRightFields.map(([key, label]) => (
                  <TernaryField
                    key={key}
                    id={`own-${rel.id}-${key}`}
                    label={label}
                    value={rel[key]}
                    onChange={(next) => setOwnershipRecord(index, key, next)}
                  />
                ))}
              </FieldGrid>
            </SubSection>

            <TextAreaField
              id={`own-${rel.id}-notes`}
              label="Notes"
              rows={2}
              value={rel.notes}
              onChange={(next) => setOwnershipRecord(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Contractual arrangements"
        description="Shareholders, voting, management and joint-control agreements."
        addLabel="Add arrangement"
        onAdd={() => setArrangements([...value.contractualArrangements, createEmptyContractualArrangementRecord()])}
        emptyMessage="No contractual arrangements recorded yet."
        count={value.contractualArrangements.length}
      >
        {value.contractualArrangements.map((arrangement, index) => (
          <RepeatableCard
            key={arrangement.id}
            title={arrangement.agreementType || `Arrangement ${index + 1}`}
            onRemove={() => setArrangements(removeAt(value.contractualArrangements, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`arr-${arrangement.id}-type`}
                label="Agreement type"
                value={arrangement.agreementType}
                onChange={(next) =>
                  setArrangement(index, 'agreementType', next as AgreementType | '')
                }
                options={AGREEMENT_TYPE_OPTIONS}
              />
              <TextInputField
                id={`arr-${arrangement.id}-date`}
                label="Agreement date"
                type="date"
                value={arrangement.agreementDate}
                onChange={(next) => setArrangement(index, 'agreementDate', next)}
              />
              <TextInputField
                id={`arr-${arrangement.id}-effective`}
                label="Effective date"
                type="date"
                value={arrangement.effectiveDate}
                onChange={(next) => setArrangement(index, 'effectiveDate', next)}
              />
              <TextInputField
                id={`arr-${arrangement.id}-expiry`}
                label="Expiry date"
                type="date"
                value={arrangement.expiryDate}
                onChange={(next) => setArrangement(index, 'expiryDate', next)}
              />
              <TextInputField
                id={`arr-${arrangement.id}-status`}
                label="Current status"
                value={arrangement.currentStatus}
                onChange={(next) => setArrangement(index, 'currentStatus', next)}
              />
              <TextInputField
                id={`arr-${arrangement.id}-reference`}
                label="Reference"
                value={arrangement.reference}
                onChange={(next) => setArrangement(index, 'reference', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`arr-${arrangement.id}-rights`}
              label="Rights description"
              rows={2}
              value={arrangement.rightsDescription}
              onChange={(next) => setArrangement(index, 'rightsDescription', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Common-person relationships"
        description="Links through common promoters, directors, KMP or beneficial owners."
        addLabel="Add common-person relationship"
        onAdd={() =>
          setCommonPerson([
            ...value.commonPersonRelationships,
            createEmptyCommonPersonRelationshipRecord(),
          ])
        }
        emptyMessage="No common-person relationships recorded yet."
        count={value.commonPersonRelationships.length}
      >
        <LinkedWorkstreamNotice
          available={linkedReferences.capitalOwnership.available}
          workstreamName="Capital & Ownership"
        />
        <LinkedWorkstreamNotice
          available={linkedReferences.managementGovernance.available}
          workstreamName="Management & Governance"
        />
        {value.commonPersonRelationships.map((rel, index) => (
          <RepeatableCard
            key={rel.id}
            title={rel.linkedPersonName || rel.relationshipType || `Common person ${index + 1}`}
            onRemove={() => setCommonPerson(removeAt(value.commonPersonRelationships, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`cpr-${rel.id}-type`}
                label="Relationship type"
                value={rel.relationshipType}
                onChange={(next) =>
                  setCommonPersonRecord(index, 'relationshipType', next as CommonPersonRelationshipType | '')
                }
                options={COMMON_PERSON_RELATIONSHIP_OPTIONS}
              />
              <TextInputField
                id={`cpr-${rel.id}-person-name`}
                label="Linked person name"
                value={rel.linkedPersonName}
                onChange={(next) => setCommonPersonRecord(index, 'linkedPersonName', next)}
              />
              <SelectField
                id={`cpr-${rel.id}-person-role`}
                label="Linked person role"
                value={rel.linkedPersonRole}
                onChange={(next) =>
                  setCommonPersonRecord(index, 'linkedPersonRole', next as LinkedPersonRole | '')
                }
                options={LINKED_PERSON_ROLE_OPTIONS}
              />
              <TextInputField
                id={`cpr-${rel.id}-person-id`}
                label="Linked person ID (workstream)"
                value={rel.linkedPersonId}
                onChange={(next) => setCommonPersonRecord(index, 'linkedPersonId', next)}
              />
              <TextInputField
                id={`cpr-${rel.id}-source`}
                label="Linked workstream source"
                value={rel.linkedWorkstreamSource}
                onChange={(next) => setCommonPersonRecord(index, 'linkedWorkstreamSource', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`cpr-${rel.id}-notes`}
              label="Notes"
              rows={2}
              value={rel.notes}
              onChange={(next) => setCommonPersonRecord(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Ownership chain summary (derived)" description="Read-only preview of current ownership links involving the issuer.">
        {chainSummary.length === 0 ? (
          <p className="text-xs text-muted-foreground">No ownership chain links derived yet.</p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
            {chainSummary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </SubSection>

      <TextAreaField
        id="own-section-notes"
        label="Section notes"
        rows={3}
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <GroupEntitiesSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
