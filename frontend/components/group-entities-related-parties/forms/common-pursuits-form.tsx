'use client';

import {
  EntityPicker,
  FieldGrid,
  SectionCard,
  SelectField,
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
import {
  createEmptyCommonPursuitRecord,
  createEmptyCommonPursuitScreening,
  createEmptyInterCompanyDependencyRecord,
  createEmptyOtherBusinessInterestRecord,
} from '@/lib/group-entities-related-parties/defaults';
import { formatEntityLabel } from '@/lib/group-entities-related-parties/entities';
import {
  DEPENDENCY_TYPE_OPTIONS,
  OTHER_BUSINESS_INTEREST_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
} from '@/lib/group-entities-related-parties/options';
import type {
  CommonPursuitRecord,
  CommonPursuitScreening,
  CommonPursuitsDependenciesAndConflicts,
  DependencyType,
  InterCompanyDependencyRecord,
  OtherBusinessInterestRecord,
  OtherBusinessInterestType,
  ProfessionalConfirmationStatus,
} from '@/lib/schemas/group-entities-related-parties';

const SECTION_ID = 'common-pursuits-dependencies-and-conflicts' as const;

const screeningTernaries = [
  ['sameLineOfBusiness', 'Same line of business'],
  ['constitutionalObjectsPermitSameBusiness', 'Constitutional objects permit same business'],
  ['overlappingProductsServices', 'Overlapping products/services'],
  ['sameCustomerSegment', 'Same customer segment'],
  ['sameGeography', 'Same geography'],
  ['sameSuppliers', 'Same suppliers'],
  ['sameTenderBiddingOpportunities', 'Same tender/bidding opportunities'],
  ['sameDistributionChannels', 'Same distribution channels'],
  ['sameTechnologyIp', 'Same technology/IP'],
  ['sameBrand', 'Same brand'],
  ['sharedEmployeesResources', 'Shared employees/resources'],
  ['sharedPromotersManagement', 'Shared promoters/management'],
] as const;

export function CommonPursuitsForm() {
  const { payload, updateSection } = useGroupEntities();
  const value = payload.commonPursuitsDependenciesAndConflicts;

  const set = <K extends keyof CommonPursuitsDependenciesAndConflicts>(
    key: K,
    next: CommonPursuitsDependenciesAndConflicts[K],
  ) => {
    updateSection('commonPursuitsDependenciesAndConflicts', { ...value, [key]: next }, SECTION_ID);
  };

  const setScreenings = (next: CommonPursuitScreening[]) => set('commonPursuitScreenings', next);

  const setScreening = <K extends keyof CommonPursuitScreening>(
    index: number,
    key: K,
    next: CommonPursuitScreening[K],
  ) => {
    setScreenings(replaceAt(value.commonPursuitScreenings, index, { ...value.commonPursuitScreenings[index], [key]: next }));
  };

  const setRecords = (next: CommonPursuitRecord[]) => set('commonPursuitRecords', next);

  const setRecord = <K extends keyof CommonPursuitRecord>(
    index: number,
    key: K,
    next: CommonPursuitRecord[K],
  ) => {
    setRecords(replaceAt(value.commonPursuitRecords, index, { ...value.commonPursuitRecords[index], [key]: next }));
  };

  const setDependencies = (next: InterCompanyDependencyRecord[]) => set('interCompanyDependencies', next);

  const setDependency = <K extends keyof InterCompanyDependencyRecord>(
    index: number,
    key: K,
    next: InterCompanyDependencyRecord[K],
  ) => {
    setDependencies(
      replaceAt(value.interCompanyDependencies, index, { ...value.interCompanyDependencies[index], [key]: next }),
    );
  };

  const setInterests = (next: OtherBusinessInterestRecord[]) => set('otherBusinessInterests', next);

  const setInterest = <K extends keyof OtherBusinessInterestRecord>(
    index: number,
    key: K,
    next: OtherBusinessInterestRecord[K],
  ) => {
    setInterests(replaceAt(value.otherBusinessInterests, index, { ...value.otherBusinessInterests[index], [key]: next }));
  };

  return (
    <SectionCard
      title="Common Pursuits, Dependencies & Conflicts"
      description="Common-pursuit screening, inter-company dependencies and business-interest overlaps."
    >
      <RepeatableList
        title="Common pursuit screenings"
        description="Per-entity screening checklist for overlapping business activities."
        addLabel="Add screening"
        onAdd={() => setScreenings([...value.commonPursuitScreenings, createEmptyCommonPursuitScreening()])}
        emptyMessage="No common pursuit screenings recorded yet."
        count={value.commonPursuitScreenings.length}
      >
        {value.commonPursuitScreenings.map((screening, index) => (
          <RepeatableCard
            key={screening.entityId || `screening-${index}`}
            title={
              formatEntityLabel(
                payload.groupStructureAndEntityMaster.entities.find((e) => e.id === screening.entityId),
                screening.entityId,
              ) || `Screening ${index + 1}`
            }
            onRemove={() => setScreenings(removeAt(value.commonPursuitScreenings, index))}
          >
            <EntityPicker
              id={`cps-${index}-entity`}
              label="Entity"
              value={screening.entityId}
              onChange={(next) => setScreening(index, 'entityId', next)}
              payload={payload}
            />
            <FieldGrid columns={3}>
              {screeningTernaries.map(([key, label]) => (
                <TernaryField
                  key={key}
                  id={`cps-${index}-${key}`}
                  label={label}
                  value={screening[key]}
                  onChange={(next) => setScreening(index, key, next)}
                />
              ))}
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Common pursuit records"
        description="Documented overlaps, competition extent and conflict-management mechanisms."
        addLabel="Add common pursuit record"
        onAdd={() => setRecords([...value.commonPursuitRecords, createEmptyCommonPursuitRecord()])}
        emptyMessage="No common pursuit records yet."
        count={value.commonPursuitRecords.length}
      >
        {value.commonPursuitRecords.map((record, index) => (
          <RepeatableCard
            key={record.id}
            title={
              formatEntityLabel(
                payload.groupStructureAndEntityMaster.entities.find((e) => e.id === record.entityId),
                record.entityId,
              ) || `Common pursuit ${index + 1}`
            }
            onRemove={() => setRecords(removeAt(value.commonPursuitRecords, index))}
          >
            <FieldGrid columns={3}>
              <EntityPicker
                id={`cpr-${record.id}-entity`}
                label="Entity"
                value={record.entityId}
                onChange={(next) => setRecord(index, 'entityId', next)}
                payload={payload}
              />
              <DecimalInputField
                id={`cpr-${record.id}-revenue`}
                label="Existing revenue from overlapping business"
                value={record.existingRevenueFromOverlappingBusiness}
                onChange={(next) => setRecord(index, 'existingRevenueFromOverlappingBusiness', next)}
              />
              <SelectField
                id={`cpr-${record.id}-prof-review`}
                label="Professional review status"
                value={record.professionalReviewStatus}
                onChange={(next) =>
                  setRecord(index, 'professionalReviewStatus', next as ProfessionalConfirmationStatus | '')
                }
                options={PROFESSIONAL_CONFIRMATION_OPTIONS}
              />
              <TernaryField
                id={`cpr-${record.id}-historical-conflict`}
                label="Historical conflict"
                value={record.historicalConflict}
                onChange={(next) => setRecord(index, 'historicalConflict', next)}
              />
              <TernaryField
                id={`cpr-${record.id}-non-compete`}
                label="Non-compete agreement"
                value={record.nonCompeteAgreement}
                onChange={(next) => setRecord(index, 'nonCompeteAgreement', next)}
              />
              <TernaryField
                id={`cpr-${record.id}-exclusivity`}
                label="Exclusivity agreement"
                value={record.exclusivityAgreement}
                onChange={(next) => setRecord(index, 'exclusivityAgreement', next)}
              />
            </FieldGrid>
            <FieldGrid>
              <TextAreaField
                id={`cpr-${record.id}-nature`}
                label="Nature of overlap"
                rows={2}
                value={record.natureOfOverlap}
                onChange={(next) => setRecord(index, 'natureOfOverlap', next)}
              />
              <TextAreaField
                id={`cpr-${record.id}-conflict-mgmt`}
                label="Conflict management mechanism"
                rows={2}
                value={record.conflictManagementMechanism}
                onChange={(next) => setRecord(index, 'conflictManagementMechanism', next)}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Inter-company dependencies"
        description="Supplier, customer, service and other operational dependencies on group entities."
        addLabel="Add dependency"
        onAdd={() => setDependencies([...value.interCompanyDependencies, createEmptyInterCompanyDependencyRecord()])}
        emptyMessage="No inter-company dependencies recorded yet."
        count={value.interCompanyDependencies.length}
      >
        {value.interCompanyDependencies.map((dep, index) => (
          <RepeatableCard
            key={dep.id}
            title={dep.dependencyType || `Dependency ${index + 1}`}
            onRemove={() => setDependencies(removeAt(value.interCompanyDependencies, index))}
          >
            <FieldGrid columns={3}>
              <EntityPicker
                id={`dep-${dep.id}-entity`}
                label="Entity"
                value={dep.entityId}
                onChange={(next) => setDependency(index, 'entityId', next)}
                payload={payload}
              />
              <SelectField
                id={`dep-${dep.id}-type`}
                label="Dependency type"
                value={dep.dependencyType}
                onChange={(next) => setDependency(index, 'dependencyType', next as DependencyType | '')}
                options={DEPENDENCY_TYPE_OPTIONS}
              />
              <DecimalInputField
                id={`dep-${dep.id}-annual-value`}
                label="Annual transaction value"
                value={dep.annualTransactionValue}
                onChange={(next) => setDependency(index, 'annualTransactionValue', next)}
              />
              <DecimalInputField
                id={`dep-${dep.id}-pct`}
                label="% of issuer revenue/purchases/cost"
                value={dep.percentageOfIssuerRevenuePurchasesCost}
                onChange={(next) => setDependency(index, 'percentageOfIssuerRevenuePurchasesCost', next)}
              />
              <TernaryField
                id={`dep-${dep.id}-contract`}
                label="Contract exists"
                value={dep.contractExists}
                onChange={(next) => setDependency(index, 'contractExists', next)}
              />
              <TernaryField
                id={`dep-${dep.id}-alternatives`}
                label="Alternatives available"
                value={dep.alternativesAvailable}
                onChange={(next) => setDependency(index, 'alternativesAvailable', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`dep-${dep.id}-description`}
              label="Description"
              rows={2}
              value={dep.description}
              onChange={(next) => setDependency(index, 'description', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Other business interests"
        description="Commercial interests, proposed businesses and asset relationships with group entities."
        addLabel="Add business interest"
        onAdd={() => setInterests([...value.otherBusinessInterests, createEmptyOtherBusinessInterestRecord()])}
        emptyMessage="No other business interests recorded yet."
        count={value.otherBusinessInterests.length}
      >
        {value.otherBusinessInterests.map((interest, index) => (
          <RepeatableCard
            key={interest.id}
            title={interest.interestType || `Interest ${index + 1}`}
            onRemove={() => setInterests(removeAt(value.otherBusinessInterests, index))}
          >
            <FieldGrid columns={3}>
              <EntityPicker
                id={`obi-${interest.id}-entity`}
                label="Entity"
                value={interest.entityId}
                onChange={(next) => setInterest(index, 'entityId', next)}
                payload={payload}
              />
              <SelectField
                id={`obi-${interest.id}-type`}
                label="Interest type"
                value={interest.interestType}
                onChange={(next) =>
                  setInterest(index, 'interestType', next as OtherBusinessInterestType | '')
                }
                options={OTHER_BUSINESS_INTEREST_OPTIONS}
              />
              <DecimalInputField
                id={`obi-${interest.id}-value`}
                label="Value"
                value={interest.value}
                onChange={(next) => setInterest(index, 'value', next)}
              />
              <TextInputField
                id={`obi-${interest.id}-status`}
                label="Current status"
                value={interest.currentStatus}
                onChange={(next) => setInterest(index, 'currentStatus', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`obi-${interest.id}-nature`}
              label="Nature"
              rows={2}
              value={interest.nature}
              onChange={(next) => setInterest(index, 'nature', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <GroupEntitiesSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
