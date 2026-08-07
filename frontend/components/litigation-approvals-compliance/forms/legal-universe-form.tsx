'use client';

import {
  asEnumValue,
  FieldGrid,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/litigation-approvals-compliance/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/litigation-approvals-compliance/repeatable-card';
import { LitigationApprovalsComplianceSectionActions } from '@/components/litigation-approvals-compliance/section-actions';
import { useLitigationApprovalsCompliance } from '@/lib/litigation-approvals-compliance/context';
import {
  createEmptyLegalPartyReviewRecord,
  createEmptyQualitativeMaterialityCriterion,
  createEmptyQuantitativeMaterialityCriterion,
} from '@/lib/litigation-approvals-compliance/defaults';
import {
  CURRENT_HISTORICAL_OPTIONS,
  LEGAL_PARTY_CATEGORY_OPTIONS,
  MATERIALITY_METRIC_TYPE_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
  QUALITATIVE_CRITERION_TYPE_OPTIONS,
  STANDALONE_CONSOLIDATED_OPTIONS,
} from '@/lib/litigation-approvals-compliance/options';
import type {
  CurrentHistorical,
  LegalPartyCategory,
  LegalUniverseMaterialityPolicyAndPartyMapping,
  MaterialityMetricType,
  ProfessionalConfirmationStatus,
  QualitativeCriterionType,
  StandaloneConsolidated,
} from '@/lib/schemas/litigation-approvals-compliance';

const SECTION_ID = 'legal-universe-materiality-policy-and-party-mapping' as const;

export function LegalUniverseForm() {
  const { payload, updateSection } = useLitigationApprovalsCompliance();
  const value = payload.legalUniverseMaterialityPolicyAndPartyMapping;

  const set = <K extends keyof LegalUniverseMaterialityPolicyAndPartyMapping>(
    key: K,
    next: LegalUniverseMaterialityPolicyAndPartyMapping[K],
  ) => {
    updateSection('legalUniverseMaterialityPolicyAndPartyMapping', { ...value, [key]: next }, SECTION_ID);
  };

  const setSnapshot = <
    K extends keyof LegalUniverseMaterialityPolicyAndPartyMapping['legalDdSnapshot'],
  >(
    key: K,
    next: LegalUniverseMaterialityPolicyAndPartyMapping['legalDdSnapshot'][K],
  ) => {
    set('legalDdSnapshot', { ...value.legalDdSnapshot, [key]: next });
  };

  const setPolicy = <
    K extends keyof LegalUniverseMaterialityPolicyAndPartyMapping['litigationMaterialityPolicy'],
  >(
    key: K,
    next: LegalUniverseMaterialityPolicyAndPartyMapping['litigationMaterialityPolicy'][K],
  ) => {
    set('litigationMaterialityPolicy', { ...value.litigationMaterialityPolicy, [key]: next });
  };

  const snapshotTernaries = [
    ['litigationExists', 'Litigation exists'],
    ['criminalMattersExist', 'Criminal matters exist'],
    ['taxDisputesExist', 'Tax disputes exist'],
    ['regulatoryStatutoryActionsExist', 'Regulatory/statutory actions exist'],
    ['civilArbitrationMattersExist', 'Civil/arbitration matters exist'],
    ['sebiExchangeActionsExist', 'SEBI/exchange actions exist'],
    ['materialApprovalsPending', 'Material approvals pending'],
    ['expiredApprovalsExist', 'Expired approvals exist'],
    ['knownComplianceExceptionsExist', 'Known compliance exceptions exist'],
    ['materialCreditorDuesExist', 'Material creditor dues exist'],
    ['materialDevelopmentsSinceLatestFinancialsExist', 'Material developments since latest financials'],
  ] as const;

  return (
    <SectionCard
      title="Legal Universe, Materiality Policy & Party Mapping"
      description="Legal DD snapshot, party review register and board-approved materiality policy."
    >
      <SubSection title="Legal DD snapshot">
        <FieldGrid columns={3}>
          <TextInputField
            id="lac-legal-dd-as-of"
            label="Legal DD as-of date"
            type="date"
            value={value.legalDdSnapshot.legalDdAsOfDate}
            onChange={(next) => setSnapshot('legalDdAsOfDate', next)}
          />
          <TextInputField
            id="lac-legal-search-update"
            label="Latest legal search update"
            type="date"
            value={value.legalDdSnapshot.latestLegalSearchUpdateDate}
            onChange={(next) => setSnapshot('latestLegalSearchUpdateDate', next)}
          />
          <TextInputField
            id="lac-latest-financials-date"
            label="Latest financial information date"
            type="date"
            value={value.legalDdSnapshot.latestFinancialInformationDate}
            onChange={(next) => setSnapshot('latestFinancialInformationDate', next)}
          />
          <TextInputField
            id="lac-target-drhp"
            label="Target DRHP filing date"
            type="date"
            value={value.legalDdSnapshot.targetDrhpFilingDate}
            onChange={(next) => setSnapshot('targetDrhpFilingDate', next)}
          />
        </FieldGrid>
        <FieldGrid columns={3}>
          {snapshotTernaries.map(([key, label]) => (
            <TernaryField
              key={key}
              id={`lac-snapshot-${key}`}
              label={label}
              value={value.legalDdSnapshot[key]}
              onChange={(next) => setSnapshot(key, next)}
            />
          ))}
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Legal party reviews"
        description="Relevant parties in the legal DD universe."
        addLabel="Add party review"
        onAdd={() =>
          set('legalPartyReviews', [...value.legalPartyReviews, createEmptyLegalPartyReviewRecord()])
        }
        emptyMessage="No party review records yet."
        count={value.legalPartyReviews.length}
      >
        {value.legalPartyReviews.map((party, index) => (
          <RepeatableCard
            key={party.legalPartyReviewId}
            title={party.displayName.trim() || `Party review ${index + 1}`}
            subtitle={party.partyCategory.replaceAll('-', ' ') || undefined}
            onRemove={() =>
              set('legalPartyReviews', removeAt(value.legalPartyReviews, index))
            }
            requiresConfirmation
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`lac-party-cat-${index}`}
                label="Party category"
                value={party.partyCategory}
                onChange={(next) =>
                  set(
                    'legalPartyReviews',
                    replaceAt(value.legalPartyReviews, index, {
                      ...party,
                      partyCategory: asEnumValue<LegalPartyCategory>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...LEGAL_PARTY_CATEGORY_OPTIONS]}
              />
              <TextInputField
                id={`lac-party-name-${index}`}
                label="Display name"
                value={party.displayName}
                onChange={(next) =>
                  set(
                    'legalPartyReviews',
                    replaceAt(value.legalPartyReviews, index, { ...party, displayName: next }),
                  )
                }
              />
              <SelectField
                id={`lac-party-current-${index}`}
                label="Current / historical"
                value={party.currentHistorical}
                onChange={(next) =>
                  set(
                    'legalPartyReviews',
                    replaceAt(value.legalPartyReviews, index, {
                      ...party,
                      currentHistorical: asEnumValue<CurrentHistorical>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...CURRENT_HISTORICAL_OPTIONS]}
              />
              <TernaryField
                id={`lac-party-search-${index}`}
                label="Legal search completed"
                value={party.legalSearchCompleted}
                onChange={(next) =>
                  set(
                    'legalPartyReviews',
                    replaceAt(value.legalPartyReviews, index, { ...party, legalSearchCompleted: next }),
                  )
                }
              />
              <TextInputField
                id={`lac-party-search-date-${index}`}
                label="Search as-of date"
                type="date"
                value={party.searchAsOfDate}
                onChange={(next) =>
                  set(
                    'legalPartyReviews',
                    replaceAt(value.legalPartyReviews, index, { ...party, searchAsOfDate: next }),
                  )
                }
              />
              <SelectField
                id={`lac-party-counsel-${index}`}
                label="External counsel review"
                value={party.externalCounselReviewStatus}
                onChange={(next) =>
                  set(
                    'legalPartyReviews',
                    replaceAt(value.legalPartyReviews, index, {
                      ...party,
                      externalCounselReviewStatus: asEnumValue<ProfessionalConfirmationStatus>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...PROFESSIONAL_CONFIRMATION_OPTIONS]}
              />
              <TextAreaField
                id={`lac-party-notes-${index}`}
                label="Notes"
                value={party.notes}
                onChange={(next) =>
                  set(
                    'legalPartyReviews',
                    replaceAt(value.legalPartyReviews, index, { ...party, notes: next }),
                  )
                }
                rows={2}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Litigation materiality policy">
        <FieldGrid columns={3}>
          <TernaryField
            id="lac-policy-exists"
            label="Policy exists"
            value={value.litigationMaterialityPolicy.policyExists}
            onChange={(next) => setPolicy('policyExists', next)}
          />
          <TernaryField
            id="lac-policy-adopted"
            label="Adopted"
            value={value.litigationMaterialityPolicy.adopted}
            onChange={(next) => setPolicy('adopted', next)}
          />
          <TextInputField
            id="lac-policy-board-date"
            label="Board approval date"
            type="date"
            value={value.litigationMaterialityPolicy.boardApprovalDate}
            onChange={(next) => setPolicy('boardApprovalDate', next)}
          />
          <TextInputField
            id="lac-policy-resolution"
            label="Board resolution reference"
            value={value.litigationMaterialityPolicy.boardResolutionReference}
            onChange={(next) => setPolicy('boardResolutionReference', next)}
          />
          <TextInputField
            id="lac-policy-version"
            label="Policy version"
            value={value.litigationMaterialityPolicy.policyVersion}
            onChange={(next) => setPolicy('policyVersion', next)}
          />
          <TextAreaField
            id="lac-policy-notes"
            label="Notes"
            value={value.litigationMaterialityPolicy.notes}
            onChange={(next) => setPolicy('notes', next)}
            rows={2}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Quantitative materiality criteria"
        addLabel="Add criterion"
        onAdd={() =>
          set('quantitativeMaterialityCriteria', [
            ...value.quantitativeMaterialityCriteria,
            createEmptyQuantitativeMaterialityCriterion(),
          ])
        }
        emptyMessage="No quantitative criteria yet."
        count={value.quantitativeMaterialityCriteria.length}
      >
        {value.quantitativeMaterialityCriteria.map((criterion, index) => (
          <RepeatableCard
            key={criterion.materialityCriterionId}
            title={`Quantitative criterion ${index + 1}`}
            onRemove={() =>
              set(
                'quantitativeMaterialityCriteria',
                removeAt(value.quantitativeMaterialityCriteria, index),
              )
            }
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`lac-quant-metric-${index}`}
                label="Metric"
                value={criterion.metric}
                onChange={(next) =>
                  set(
                    'quantitativeMaterialityCriteria',
                    replaceAt(value.quantitativeMaterialityCriteria, index, {
                      ...criterion,
                      metric: asEnumValue<MaterialityMetricType>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...MATERIALITY_METRIC_TYPE_OPTIONS]}
              />
              <TextInputField
                id={`lac-quant-pct-${index}`}
                label="Percentage threshold"
                value={criterion.percentageThreshold}
                onChange={(next) =>
                  set(
                    'quantitativeMaterialityCriteria',
                    replaceAt(value.quantitativeMaterialityCriteria, index, {
                      ...criterion,
                      percentageThreshold: next,
                    }),
                  )
                }
              />
              <TextInputField
                id={`lac-quant-abs-${index}`}
                label="Absolute threshold"
                value={criterion.absoluteThreshold}
                onChange={(next) =>
                  set(
                    'quantitativeMaterialityCriteria',
                    replaceAt(value.quantitativeMaterialityCriteria, index, {
                      ...criterion,
                      absoluteThreshold: next,
                    }),
                  )
                }
              />
              <SelectField
                id={`lac-quant-basis-${index}`}
                label="Standalone / consolidated basis"
                value={criterion.standaloneConsolidatedBasis}
                onChange={(next) =>
                  set(
                    'quantitativeMaterialityCriteria',
                    replaceAt(value.quantitativeMaterialityCriteria, index, {
                      ...criterion,
                      standaloneConsolidatedBasis: asEnumValue<StandaloneConsolidated>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...STANDALONE_CONSOLIDATED_OPTIONS]}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Qualitative materiality criteria"
        addLabel="Add criterion"
        onAdd={() =>
          set('qualitativeMaterialityCriteria', [
            ...value.qualitativeMaterialityCriteria,
            createEmptyQualitativeMaterialityCriterion(),
          ])
        }
        emptyMessage="No qualitative criteria yet."
        count={value.qualitativeMaterialityCriteria.length}
      >
        {value.qualitativeMaterialityCriteria.map((criterion, index) => (
          <RepeatableCard
            key={criterion.qualitativeCriterionId}
            title={criterion.criterionType.replaceAll('-', ' ') || `Qualitative criterion ${index + 1}`}
            onRemove={() =>
              set(
                'qualitativeMaterialityCriteria',
                removeAt(value.qualitativeMaterialityCriteria, index),
              )
            }
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`lac-qual-type-${index}`}
                label="Criterion type"
                value={criterion.criterionType}
                onChange={(next) =>
                  set(
                    'qualitativeMaterialityCriteria',
                    replaceAt(value.qualitativeMaterialityCriteria, index, {
                      ...criterion,
                      criterionType: asEnumValue<QualitativeCriterionType>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...QUALITATIVE_CRITERION_TYPE_OPTIONS]}
              />
              <TernaryField
                id={`lac-qual-enabled-${index}`}
                label="Enabled"
                value={criterion.enabled}
                onChange={(next) =>
                  set(
                    'qualitativeMaterialityCriteria',
                    replaceAt(value.qualitativeMaterialityCriteria, index, {
                      ...criterion,
                      enabled: next,
                    }),
                  )
                }
              />
              <TextAreaField
                id={`lac-qual-desc-${index}`}
                label="Description"
                value={criterion.description}
                onChange={(next) =>
                  set(
                    'qualitativeMaterialityCriteria',
                    replaceAt(value.qualitativeMaterialityCriteria, index, {
                      ...criterion,
                      description: next,
                    }),
                  )
                }
                rows={2}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <LitigationApprovalsComplianceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
