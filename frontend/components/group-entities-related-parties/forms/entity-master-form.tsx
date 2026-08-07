'use client';

import {
  CheckboxField,
  ClassificationBadgeList,
  EntityBadge,
  FieldGrid,
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
import { createEmptyEntityRecord } from '@/lib/group-entities-related-parties/defaults';
import {
  isCompanyEntityType,
  isListedEntity,
  isLlpEntityType,
} from '@/lib/group-entities-related-parties/entities';
import {
  ENTITY_STATUS_OPTIONS,
  ENTITY_TYPE_OPTIONS,
  LISTED_STATUS_OPTIONS,
} from '@/lib/group-entities-related-parties/options';
import {
  countEntityReferences,
  formatEntityDependencyMessage,
} from '@/lib/group-entities-related-parties/references';
import type {
  EntityClassificationBadge,
  EntityRecord,
  EntityStatus,
  EntityType,
  GroupSnapshot,
  GroupStructureAndEntityMaster,
  ListedStatus,
} from '@/lib/schemas/group-entities-related-parties';

const SECTION_ID = 'group-structure-and-entity-master' as const;

function entityHasData(entity: EntityRecord): boolean {
  return Boolean(
    entity.identity.legalName.trim() ||
      entity.identity.displayName.trim() ||
      entity.entityType ||
      entity.registration.cin.trim() ||
      entity.registration.llpin.trim(),
  );
}

export function EntityMasterForm() {
  const { payload, updateSection } = useGroupEntities();
  const value = payload.groupStructureAndEntityMaster;

  const set = <K extends keyof GroupStructureAndEntityMaster>(
    key: K,
    next: GroupStructureAndEntityMaster[K],
  ) => {
    updateSection('groupStructureAndEntityMaster', { ...value, [key]: next }, SECTION_ID);
  };

  const setSnapshot = <K extends keyof GroupSnapshot>(key: K, next: GroupSnapshot[K]) => {
    set('groupSnapshot', { ...value.groupSnapshot, [key]: next });
  };

  const setEntities = (next: EntityRecord[]) => set('entities', next);

  const setEntity = <K extends keyof EntityRecord>(index: number, key: K, next: EntityRecord[K]) => {
    setEntities(replaceAt(value.entities, index, { ...value.entities[index], [key]: next }));
  };

  const setIdentity = <K extends keyof EntityRecord['identity']>(
    index: number,
    key: K,
    next: EntityRecord['identity'][K],
  ) => {
    const entity = value.entities[index];
    setEntity(index, 'identity', { ...entity.identity, [key]: next });
  };

  const setRegistration = <K extends keyof EntityRecord['registration']>(
    index: number,
    key: K,
    next: EntityRecord['registration'][K],
  ) => {
    const entity = value.entities[index];
    setEntity(index, 'registration', { ...entity.registration, [key]: next });
  };

  const setListing = <K extends keyof EntityRecord['listing']>(
    index: number,
    key: K,
    next: EntityRecord['listing'][K],
  ) => {
    const entity = value.entities[index];
    setEntity(index, 'listing', { ...entity.listing, [key]: next });
  };

  const setBusinessProfile = <K extends keyof EntityRecord['businessProfile']>(
    index: number,
    key: K,
    next: EntityRecord['businessProfile'][K],
  ) => {
    const entity = value.entities[index];
    setEntity(index, 'businessProfile', { ...entity.businessProfile, [key]: next });
  };

  const toggleBadge = (index: number, badge: EntityClassificationBadge) => {
    const entity = value.entities[index];
    const badges = entity.classificationBadges.includes(badge)
      ? entity.classificationBadges.filter((item) => item !== badge)
      : [...entity.classificationBadges, badge];
    setEntity(index, 'classificationBadges', badges);
  };

  const removeEntity = (index: number) => {
    const entity = value.entities[index];
    const deps = countEntityReferences(payload, entity.id);
    if (deps.length > 0) {
      window.alert(formatEntityDependencyMessage(deps));
      return;
    }
    if (entityHasData(entity) && !window.confirm('Remove this entity? Entered values will be lost.')) {
      return;
    }
    setEntities(removeAt(value.entities, index));
  };

  const snapshotTernaries = [
    ['holdingParentCompanyExists', 'Holding/parent company exists'],
    ['ultimateHoldingCompanyExists', 'Ultimate holding company exists'],
    ['subsidiariesExist', 'Subsidiaries exist'],
    ['stepDownSubsidiariesExist', 'Step-down subsidiaries exist'],
    ['associatesExist', 'Associates exist'],
    ['jointVenturesExist', 'Joint ventures exist'],
    ['foreignGroupEntitiesExist', 'Foreign group entities exist'],
    ['promoterGroupEntitiesExist', 'Promoter-group entities exist'],
    ['otherCommonControlEntitiesExist', 'Other common-control entities exist'],
    ['historicalEntitiesRelevant', 'Historical entities relevant'],
  ] as const;

  return (
    <SectionCard
      title="Group Structure & Entity Master"
      description="Group snapshot and canonical Entity Master register — each entity exists once with multiple classifications."
    >
      <SubSection
        title="Group snapshot"
        description="High-level group structure indicators as of the readiness date."
      >
        <FieldGrid>
          <TextInputField
            id="ge-group-as-of-date"
            label="Structure as of date"
            type="date"
            value={value.groupSnapshot.structureAsOfDate}
            onChange={(next) => setSnapshot('structureAsOfDate', next)}
          />
        </FieldGrid>
        <FieldGrid columns={3}>
          {snapshotTernaries.map(([key, label]) => (
            <TernaryField
              key={key}
              id={`ge-snapshot-${key}`}
              label={label}
              value={value.groupSnapshot[key]}
              onChange={(next) => setSnapshot(key, next)}
            />
          ))}
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Entity Master"
        description="Canonical entity register — stable IDs referenced across ownership, classification, RPT and readiness sections."
        addLabel="Add entity"
        onAdd={() => setEntities([...value.entities, createEmptyEntityRecord()])}
        emptyMessage="No entities recorded yet."
        count={value.entities.length}
      >
        {value.entities.map((entity, index) => (
          <RepeatableCard
            key={entity.id}
            title={entity.identity.displayName || entity.identity.legalName || `Entity ${index + 1}`}
            subtitle={entity.entityType || undefined}
            onRemove={() => removeEntity(index)}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`ent-${entity.id}-type`}
                label="Entity type"
                value={entity.entityType}
                onChange={(next) => setEntity(index, 'entityType', next as EntityType | '')}
                options={ENTITY_TYPE_OPTIONS}
              />
              <SelectField
                id={`ent-${entity.id}-status`}
                label="Status"
                value={entity.status}
                onChange={(next) => setEntity(index, 'status', next as EntityStatus | '')}
                options={ENTITY_STATUS_OPTIONS}
              />
              <CheckboxField
                id={`ent-${entity.id}-active`}
                label="Currently active"
                checked={entity.currentlyActive}
                onChange={(next) => setEntity(index, 'currentlyActive', next)}
              />
            </FieldGrid>

            <SubSection title="Identity">
              <FieldGrid columns={3}>
                <TextInputField
                  id={`ent-${entity.id}-legal-name`}
                  label="Legal name"
                  value={entity.identity.legalName}
                  onChange={(next) => setIdentity(index, 'legalName', next)}
                />
                <TextInputField
                  id={`ent-${entity.id}-display-name`}
                  label="Display name"
                  value={entity.identity.displayName}
                  onChange={(next) => setIdentity(index, 'displayName', next)}
                />
                <TextInputField
                  id={`ent-${entity.id}-former-name`}
                  label="Former name"
                  value={entity.identity.formerName}
                  onChange={(next) => setIdentity(index, 'formerName', next)}
                />
              </FieldGrid>
            </SubSection>

            <SubSection title="Registration">
              <FieldGrid columns={3}>
                {isCompanyEntityType(entity.entityType) ? (
                  <TextInputField
                    id={`ent-${entity.id}-cin`}
                    label="CIN"
                    value={entity.registration.cin}
                    onChange={(next) => setRegistration(index, 'cin', next)}
                  />
                ) : null}
                {isLlpEntityType(entity.entityType) ? (
                  <TextInputField
                    id={`ent-${entity.id}-llpin`}
                    label="LLPIN"
                    value={entity.registration.llpin}
                    onChange={(next) => setRegistration(index, 'llpin', next)}
                  />
                ) : null}
                <TextInputField
                  id={`ent-${entity.id}-reg-no`}
                  label="Registration number"
                  value={entity.registration.registrationNumber}
                  onChange={(next) => setRegistration(index, 'registrationNumber', next)}
                />
                <TextInputField
                  id={`ent-${entity.id}-other-id`}
                  label="Other identifier"
                  value={entity.registration.otherIdentifier}
                  onChange={(next) => setRegistration(index, 'otherIdentifier', next)}
                />
                <TextInputField
                  id={`ent-${entity.id}-country`}
                  label="Country of incorporation"
                  value={entity.registration.countryOfIncorporation}
                  onChange={(next) => setRegistration(index, 'countryOfIncorporation', next)}
                />
                <TextInputField
                  id={`ent-${entity.id}-state`}
                  label="State"
                  value={entity.registration.state}
                  onChange={(next) => setRegistration(index, 'state', next)}
                />
                <TextInputField
                  id={`ent-${entity.id}-inc-date`}
                  label="Incorporation date"
                  type="date"
                  value={entity.registration.incorporationDate}
                  onChange={(next) => setRegistration(index, 'incorporationDate', next)}
                />
                <TextInputField
                  id={`ent-${entity.id}-fy-end`}
                  label="Financial year end"
                  value={entity.registration.financialYearEnd}
                  onChange={(next) => setRegistration(index, 'financialYearEnd', next)}
                />
                <TextInputField
                  id={`ent-${entity.id}-website`}
                  label="Website"
                  value={entity.registration.website}
                  onChange={(next) => setRegistration(index, 'website', next)}
                />
              </FieldGrid>
              <FieldGrid>
                <TextAreaField
                  id={`ent-${entity.id}-reg-office`}
                  label="Registered office"
                  rows={2}
                  value={entity.registration.registeredOffice}
                  onChange={(next) => setRegistration(index, 'registeredOffice', next)}
                />
                <TextAreaField
                  id={`ent-${entity.id}-corp-office`}
                  label="Corporate office"
                  rows={2}
                  value={entity.registration.corporateOffice}
                  onChange={(next) => setRegistration(index, 'corporateOffice', next)}
                />
              </FieldGrid>
            </SubSection>

            <SubSection title="Listing">
              <FieldGrid columns={3}>
                <SelectField
                  id={`ent-${entity.id}-listed-status`}
                  label="Listed status"
                  value={entity.listing.listedStatus}
                  onChange={(next) => setListing(index, 'listedStatus', next as ListedStatus | '')}
                  options={LISTED_STATUS_OPTIONS}
                />
                {isListedEntity(entity) ? (
                  <>
                    <TextInputField
                      id={`ent-${entity.id}-exchange`}
                      label="Exchange"
                      value={entity.listing.exchange}
                      onChange={(next) => setListing(index, 'exchange', next)}
                    />
                    <TextInputField
                      id={`ent-${entity.id}-security-type`}
                      label="Security type listed"
                      value={entity.listing.securityTypeListed}
                      onChange={(next) => setListing(index, 'securityTypeListed', next)}
                    />
                    <TextInputField
                      id={`ent-${entity.id}-listing-date`}
                      label="Listing date"
                      type="date"
                      value={entity.listing.listingDate}
                      onChange={(next) => setListing(index, 'listingDate', next)}
                    />
                  </>
                ) : null}
                {entity.listing.listedStatus === 'delisted' ? (
                  <>
                    <TernaryField
                      id={`ent-${entity.id}-delisted-status`}
                      label="Delisted status confirmed"
                      value={entity.listing.delistedStatus}
                      onChange={(next) => setListing(index, 'delistedStatus', next)}
                    />
                    <TextInputField
                      id={`ent-${entity.id}-delisting-date`}
                      label="Delisting date"
                      type="date"
                      value={entity.listing.delistingDate}
                      onChange={(next) => setListing(index, 'delistingDate', next)}
                    />
                  </>
                ) : null}
              </FieldGrid>
            </SubSection>

            <SubSection title="Business profile">
              <FieldGrid columns={3}>
                <TextInputField
                  id={`ent-${entity.id}-principal-business`}
                  label="Principal business"
                  value={entity.businessProfile.principalBusiness}
                  onChange={(next) => setBusinessProfile(index, 'principalBusiness', next)}
                />
                <TextInputField
                  id={`ent-${entity.id}-industry`}
                  label="Industry"
                  value={entity.businessProfile.industry}
                  onChange={(next) => setBusinessProfile(index, 'industry', next)}
                />
                <TextInputField
                  id={`ent-${entity.id}-operational-status`}
                  label="Operational status"
                  value={entity.businessProfile.operationalStatus}
                  onChange={(next) => setBusinessProfile(index, 'operationalStatus', next)}
                />
                <TextInputField
                  id={`ent-${entity.id}-relevant-from`}
                  label="Relationship relevant from"
                  type="date"
                  value={entity.businessProfile.relationshipRelevantFrom}
                  onChange={(next) => setBusinessProfile(index, 'relationshipRelevantFrom', next)}
                />
                <TextInputField
                  id={`ent-${entity.id}-relevant-until`}
                  label="Relationship relevant until"
                  type="date"
                  value={entity.businessProfile.relationshipRelevantUntil}
                  onChange={(next) => setBusinessProfile(index, 'relationshipRelevantUntil', next)}
                />
              </FieldGrid>
              <FieldGrid>
                <TextAreaField
                  id={`ent-${entity.id}-other-businesses`}
                  label="Other businesses"
                  rows={2}
                  value={entity.businessProfile.otherBusinesses}
                  onChange={(next) => setBusinessProfile(index, 'otherBusinesses', next)}
                />
                <TextAreaField
                  id={`ent-${entity.id}-products-services`}
                  label="Products / services"
                  rows={2}
                  value={entity.businessProfile.productsServices}
                  onChange={(next) => setBusinessProfile(index, 'productsServices', next)}
                />
                <TextAreaField
                  id={`ent-${entity.id}-geographies`}
                  label="Geographies"
                  rows={2}
                  value={entity.businessProfile.geographies}
                  onChange={(next) => setBusinessProfile(index, 'geographies', next)}
                />
              </FieldGrid>
            </SubSection>

            <SubSection title="Classification badges">
              <ClassificationBadgeList
                badges={entity.classificationBadges}
                onToggle={(badge) => toggleBadge(index, badge)}
              />
              <EntityBadge entity={entity} />
            </SubSection>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <GroupEntitiesSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
