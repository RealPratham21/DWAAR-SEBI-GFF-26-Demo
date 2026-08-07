'use client';

import { Plus } from 'lucide-react';
import {
  EntityPicker,
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
import { Button } from '@/components/ui/button';
import { useGroupEntities } from '@/lib/group-entities-related-parties/context';
import {
  createEmptyFrameworkClassification,
  createEmptyRelatedPartyRelationshipRecord,
} from '@/lib/group-entities-related-parties/defaults';
import { formatEntityLabel } from '@/lib/group-entities-related-parties/entities';
import {
  CLASSIFICATION_FRAMEWORK_OPTIONS,
  CURRENT_HISTORICAL_OPTIONS,
  LINKED_PERSON_ROLE_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
  RELATED_PARTY_CATEGORY_OPTIONS,
  RELATED_PARTY_PARTY_TYPE_OPTIONS,
  RELATIONSHIP_SOURCE_OPTIONS,
} from '@/lib/group-entities-related-parties/options';
import { countRelatedPartyReferences } from '@/lib/group-entities-related-parties/references';
import type {
  ClassificationFramework,
  CurrentHistorical,
  FrameworkClassification,
  LinkedPersonRole,
  ProfessionalConfirmationStatus,
  RelatedPartyCategory,
  RelatedPartyPartyType,
  RelatedPartyRelationshipRecord,
  RelatedPartyUniverseAndClassification,
  RelationshipSourceType,
} from '@/lib/schemas/group-entities-related-parties';

const SECTION_ID = 'related-party-universe-and-classification' as const;

export function RelatedPartyForm() {
  const { payload, updateSection } = useGroupEntities();
  const value = payload.relatedPartyUniverseAndClassification;

  const set = <K extends keyof RelatedPartyUniverseAndClassification>(
    key: K,
    next: RelatedPartyUniverseAndClassification[K],
  ) => {
    updateSection('relatedPartyUniverseAndClassification', { ...value, [key]: next }, SECTION_ID);
  };

  const setRelationships = (next: RelatedPartyRelationshipRecord[]) =>
    set('relatedPartyRelationships', next);

  const setRelationship = <K extends keyof RelatedPartyRelationshipRecord>(
    index: number,
    key: K,
    next: RelatedPartyRelationshipRecord[K],
  ) => {
    setRelationships(
      replaceAt(value.relatedPartyRelationships, index, {
        ...value.relatedPartyRelationships[index],
        [key]: next,
      }),
    );
  };

  const setFramework = <K extends keyof FrameworkClassification>(
    relIndex: number,
    fwIndex: number,
    key: K,
    next: FrameworkClassification[K],
  ) => {
    const rel = value.relatedPartyRelationships[relIndex];
    const frameworks = replaceAt(rel.frameworkClassifications, fwIndex, {
      ...rel.frameworkClassifications[fwIndex],
      [key]: next,
    });
    setRelationship(relIndex, 'frameworkClassifications', frameworks);
  };

  const removeRelationship = (index: number) => {
    const rel = value.relatedPartyRelationships[index];
    const refs = countRelatedPartyReferences(payload, rel.id);
    if (refs > 0) {
      window.alert(
        `This related party is referenced in ${refs} RPT transaction or balance record(s). Remove or reassign those first.`,
      );
      return;
    }
    setRelationships(removeAt(value.relatedPartyRelationships, index));
  };

  return (
    <SectionCard
      title="Related Party Universe & Classification"
      description="Related-party identification across multiple classification frameworks."
    >
      <RepeatableList
        title="Related party relationships"
        description="Entity and person related parties with multi-framework classification."
        addLabel="Add related party"
        onAdd={() =>
          setRelationships([...value.relatedPartyRelationships, createEmptyRelatedPartyRelationshipRecord()])
        }
        emptyMessage="No related party relationships recorded yet."
        count={value.relatedPartyRelationships.length}
      >
        {value.relatedPartyRelationships.map((rel, index) => {
          const isEntity = rel.partyType === 'entity';
          const isPerson = rel.partyType === 'person';
          const title =
            (isEntity
              ? formatEntityLabel(
                  payload.groupStructureAndEntityMaster.entities.find((e) => e.id === rel.linkedEntityId),
                  rel.linkedEntityId,
                )
              : rel.linkedPersonName) || `Related party ${index + 1}`;

          return (
            <RepeatableCard
              key={rel.id}
              title={title}
              subtitle={rel.relationshipCategory || rel.partyType || undefined}
              onRemove={() => removeRelationship(index)}
            >
              <FieldGrid columns={3}>
                <SelectField
                  id={`rp-${rel.id}-party-type`}
                  label="Party type"
                  value={rel.partyType}
                  onChange={(next) =>
                    setRelationship(index, 'partyType', next as RelatedPartyPartyType | '')
                  }
                  options={RELATED_PARTY_PARTY_TYPE_OPTIONS}
                />
                <SelectField
                  id={`rp-${rel.id}-category`}
                  label="Relationship category"
                  value={rel.relationshipCategory}
                  onChange={(next) =>
                    setRelationship(index, 'relationshipCategory', next as RelatedPartyCategory | '')
                  }
                  options={RELATED_PARTY_CATEGORY_OPTIONS}
                />
                <SelectField
                  id={`rp-${rel.id}-source-type`}
                  label="Relationship source"
                  value={rel.relationshipSourceType}
                  onChange={(next) =>
                    setRelationship(index, 'relationshipSourceType', next as RelationshipSourceType | '')
                  }
                  options={RELATIONSHIP_SOURCE_OPTIONS}
                />
              </FieldGrid>

              {isEntity ? (
                <EntityPicker
                  id={`rp-${rel.id}-entity`}
                  label="Linked entity"
                  value={rel.linkedEntityId}
                  onChange={(next) => setRelationship(index, 'linkedEntityId', next)}
                  payload={payload}
                />
              ) : null}

              {isPerson ? (
                <FieldGrid columns={3}>
                  <TextInputField
                    id={`rp-${rel.id}-person-name`}
                    label="Linked person name"
                    value={rel.linkedPersonName}
                    onChange={(next) => setRelationship(index, 'linkedPersonName', next)}
                  />
                  <SelectField
                    id={`rp-${rel.id}-person-role`}
                    label="Linked person role"
                    value={rel.linkedPersonRole}
                    onChange={(next) =>
                      setRelationship(index, 'linkedPersonRole', next as LinkedPersonRole | '')
                    }
                    options={LINKED_PERSON_ROLE_OPTIONS}
                  />
                  <TextInputField
                    id={`rp-${rel.id}-person-id`}
                    label="Linked person ID (workstream)"
                    value={rel.linkedPersonId}
                    onChange={(next) => setRelationship(index, 'linkedPersonId', next)}
                  />
                  <TextInputField
                    id={`rp-${rel.id}-workstream-source`}
                    label="Linked workstream source"
                    value={rel.linkedWorkstreamSource}
                    onChange={(next) => setRelationship(index, 'linkedWorkstreamSource', next)}
                  />
                </FieldGrid>
              ) : null}

              <SubSection
                title="Framework classifications"
                description="Classify under Companies Act, Ind AS 24, SEBI LODR, ICDR Group Company, etc."
                actions={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRelationship(index, 'frameworkClassifications', [
                        ...rel.frameworkClassifications,
                        createEmptyFrameworkClassification(),
                      ])
                    }
                  >
                    <Plus size={14} />
                    Add framework
                  </Button>
                }
              >
                {rel.frameworkClassifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No framework classifications added yet.</p>
                ) : (
                  rel.frameworkClassifications.map((fw, fwIndex) => (
                    <div key={`${rel.id}-fw-${fwIndex}`} className="space-y-3 rounded-md border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Framework {fwIndex + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setRelationship(
                              index,
                              'frameworkClassifications',
                              removeAt(rel.frameworkClassifications, fwIndex),
                            )
                          }
                        >
                          Remove
                        </Button>
                      </div>
                      <FieldGrid columns={3}>
                        <SelectField
                          id={`rp-${rel.id}-fw-${fwIndex}-framework`}
                          label="Framework"
                          value={fw.framework}
                          onChange={(next) =>
                            setFramework(index, fwIndex, 'framework', next as ClassificationFramework | '')
                          }
                          options={CLASSIFICATION_FRAMEWORK_OPTIONS}
                        />
                        <TernaryField
                          id={`rp-${rel.id}-fw-${fwIndex}-related`}
                          label="Related"
                          value={fw.related}
                          onChange={(next) => setFramework(index, fwIndex, 'related', next)}
                        />
                        <SelectField
                          id={`rp-${rel.id}-fw-${fwIndex}-current-historical`}
                          label="Current / historical"
                          value={fw.currentHistorical}
                          onChange={(next) =>
                            setFramework(index, fwIndex, 'currentHistorical', next as CurrentHistorical | '')
                          }
                          options={CURRENT_HISTORICAL_OPTIONS}
                        />
                        <SelectField
                          id={`rp-${rel.id}-fw-${fwIndex}-prof-confirm`}
                          label="Professional confirmation"
                          value={fw.professionalConfirmationStatus}
                          onChange={(next) =>
                            setFramework(
                              index,
                              fwIndex,
                              'professionalConfirmationStatus',
                              next as ProfessionalConfirmationStatus | '',
                            )
                          }
                          options={PROFESSIONAL_CONFIRMATION_OPTIONS}
                        />
                        <TextInputField
                          id={`rp-${rel.id}-fw-${fwIndex}-start`}
                          label="Relationship start date"
                          type="date"
                          value={fw.relationshipStartDate}
                          onChange={(next) => setFramework(index, fwIndex, 'relationshipStartDate', next)}
                        />
                        <TextInputField
                          id={`rp-${rel.id}-fw-${fwIndex}-end`}
                          label="Relationship end date"
                          type="date"
                          value={fw.relationshipEndDate}
                          onChange={(next) => setFramework(index, fwIndex, 'relationshipEndDate', next)}
                        />
                      </FieldGrid>
                      <TextAreaField
                        id={`rp-${rel.id}-fw-${fwIndex}-basis`}
                        label="Basis / rationale"
                        rows={2}
                        value={fw.basisRationale}
                        onChange={(next) => setFramework(index, fwIndex, 'basisRationale', next)}
                      />
                    </div>
                  ))
                )}
              </SubSection>

              <FieldGrid>
                <TextInputField
                  id={`rp-${rel.id}-reference`}
                  label="Reference"
                  value={rel.reference}
                  onChange={(next) => setRelationship(index, 'reference', next)}
                />
              </FieldGrid>
              <TextAreaField
                id={`rp-${rel.id}-notes`}
                label="Notes"
                rows={2}
                value={rel.notes}
                onChange={(next) => setRelationship(index, 'notes', next)}
              />
            </RepeatableCard>
          );
        })}
      </RepeatableList>

      <GroupEntitiesSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
