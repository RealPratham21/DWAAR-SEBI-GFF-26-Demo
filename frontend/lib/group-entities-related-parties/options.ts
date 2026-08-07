/**
 * UI option arrays and label maps for Group Entities & Related Parties.
 */

import {
  AGREEMENT_TYPE_VALUES,
  ARMS_LENGTH_STATUS_VALUES,
  AUDIT_STATUS_VALUES,
  CASH_NON_CASH_VALUES,
  CLASSIFICATION_FRAMEWORK_VALUES,
  CLASSIFICATION_READINESS_STATE_VALUES,
  COMMON_PERSON_RELATIONSHIP_TYPE_VALUES,
  CURRENT_HISTORICAL_VALUES,
  DEPENDENCY_TYPE_VALUES,
  ENTITY_CLASSIFICATION_BADGE_VALUES,
  ENTITY_INFORMATION_STATUS_VALUES,
  ENTITY_STATUS_VALUES,
  ENTITY_TYPE_VALUES,
  ICDR_GROUP_COMPANY_STATE_VALUES,
  ICDR_IDENTIFICATION_BASIS_VALUES,
  INTEREST_BEARING_VALUES,
  LINKED_PERSON_ROLE_VALUES,
  LISTED_STATUS_VALUES,
  MATERIALITY_METRIC_TYPE_VALUES,
  MATERIAL_SUBSIDIARY_PURPOSE_VALUES,
  OTHER_BUSINESS_INTEREST_TYPE_VALUES,
  OWNERSHIP_RELATIONSHIP_TYPE_VALUES,
  PROFESSIONAL_CONFIRMATION_STATUS_VALUES,
  RECURRING_NON_RECURRING_VALUES,
  REGULATORY_CLASSIFICATION_TYPE_VALUES,
  RELATED_PARTY_CATEGORY_VALUES,
  RELATED_PARTY_PARTY_TYPE_VALUES,
  RELATIONSHIP_CHANGE_EVENT_VALUES,
  RELATIONSHIP_SOURCE_TYPE_VALUES,
  RPT_BALANCE_TYPE_VALUES,
  RPT_TRANSACTION_TYPE_VALUES,
  SECURED_UNSECURED_VALUES,
  STANDALONE_CONSOLIDATED_VALUES,
  THRESHOLD_TYPE_VALUES,
  YES_NO_NOT_SURE_VALUES,
  type GroupEntitiesConfirmations,
  type GroupEntitiesSectionId,
} from '@/lib/schemas/group-entities-related-parties';

export type SelectOption = { value: string; label: string };

function toOptions(values: readonly string[], labels?: Record<string, string>): SelectOption[] {
  return values.map((value) => ({
    value,
    label: labels?.[value] ?? value.replaceAll('-', ' ').replaceAll('_', ' '),
  }));
}

export const GROUP_ENTITIES_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'information', label: 'Information' },
  { id: 'group-rpt-assessment', label: 'Group & RPT Assessment' },
] as const;

export type GroupEntitiesTabId = (typeof GROUP_ENTITIES_TABS)[number]['id'];

export const GROUP_ENTITIES_INFORMATION_SECTIONS: Array<{
  id: GroupEntitiesSectionId;
  label: string;
  description: string;
}> = [
  {
    id: 'group-structure-and-entity-master',
    label: 'Group Structure & Entity Master',
    description: 'Group snapshot and canonical Entity Master register.',
  },
  {
    id: 'ownership-control-and-relationship-mapping',
    label: 'Ownership, Control & Relationship Mapping',
    description: 'Ownership/control relationships, contractual arrangements and common-person links.',
  },
  {
    id: 'group-company-and-materiality-classification',
    label: 'Group Company & Materiality Classification',
    description: 'Regulatory classifications, ICDR Group Company determination and Materiality Policy.',
  },
  {
    id: 'related-party-universe-and-classification',
    label: 'Related Party Universe & Classification',
    description: 'Related-party identification across multiple classification frameworks.',
  },
  {
    id: 'related-party-transactions-balances-and-commitments',
    label: 'Related Party Transactions, Balances & Commitments',
    description: 'Central RPT register with outstanding balances and commitments.',
  },
  {
    id: 'common-pursuits-dependencies-and-conflicts',
    label: 'Common Pursuits, Dependencies & Conflicts',
    description: 'Common-pursuit screening, dependencies and business-interest overlaps.',
  },
  {
    id: 'group-entity-financial-regulatory-and-litigation-readiness',
    label: 'Group Entity Financial, Regulatory & Litigation Readiness',
    description: 'Lightweight due-diligence readiness for Group Companies and material entities.',
  },
  {
    id: 'changes-rpt-readiness-and-confirmations',
    label: 'Changes, RPT Readiness & Confirmations',
    description: 'Relationship changes, RPT readiness and issuer confirmations.',
  },
];

export const GROUP_ENTITIES_SECTION_LABELS: Record<GroupEntitiesSectionId, string> =
  Object.fromEntries(
    GROUP_ENTITIES_INFORMATION_SECTIONS.map((section) => [section.id, section.label]),
  ) as Record<GroupEntitiesSectionId, string>;

export const SESSION_SAVE_NOTICE_GR1 =
  'Your section updates are saved for this session. Permanent saving will be connected in the next increment.';

export const YES_NO_NOT_SURE_OPTIONS = toOptions(YES_NO_NOT_SURE_VALUES, {
  yes: 'Yes',
  no: 'No',
  not_sure: 'Not sure',
});

export const ENTITY_TYPE_OPTIONS = toOptions(ENTITY_TYPE_VALUES);
export const ENTITY_STATUS_OPTIONS = toOptions(ENTITY_STATUS_VALUES);
export const LISTED_STATUS_OPTIONS = toOptions(LISTED_STATUS_VALUES);
export const ENTITY_CLASSIFICATION_BADGE_OPTIONS = toOptions(ENTITY_CLASSIFICATION_BADGE_VALUES);
export const OWNERSHIP_RELATIONSHIP_TYPE_OPTIONS = toOptions(OWNERSHIP_RELATIONSHIP_TYPE_VALUES);
export const CURRENT_HISTORICAL_OPTIONS = toOptions(CURRENT_HISTORICAL_VALUES);
export const PROFESSIONAL_CONFIRMATION_OPTIONS = toOptions(PROFESSIONAL_CONFIRMATION_STATUS_VALUES);
export const AGREEMENT_TYPE_OPTIONS = toOptions(AGREEMENT_TYPE_VALUES);
export const COMMON_PERSON_RELATIONSHIP_OPTIONS = toOptions(COMMON_PERSON_RELATIONSHIP_TYPE_VALUES);
export const REGULATORY_CLASSIFICATION_OPTIONS = toOptions(REGULATORY_CLASSIFICATION_TYPE_VALUES);
export const CLASSIFICATION_READINESS_OPTIONS = toOptions(CLASSIFICATION_READINESS_STATE_VALUES);
export const ICDR_GROUP_COMPANY_STATE_OPTIONS = toOptions(ICDR_GROUP_COMPANY_STATE_VALUES);
export const ICDR_IDENTIFICATION_BASIS_OPTIONS = toOptions(ICDR_IDENTIFICATION_BASIS_VALUES);
export const MATERIALITY_METRIC_OPTIONS = toOptions(MATERIALITY_METRIC_TYPE_VALUES);
export const THRESHOLD_TYPE_OPTIONS = toOptions(THRESHOLD_TYPE_VALUES);
export const STANDALONE_CONSOLIDATED_OPTIONS = toOptions(STANDALONE_CONSOLIDATED_VALUES);
export const MATERIAL_SUBSIDIARY_PURPOSE_OPTIONS = toOptions(MATERIAL_SUBSIDIARY_PURPOSE_VALUES);
export const RELATED_PARTY_PARTY_TYPE_OPTIONS = toOptions(RELATED_PARTY_PARTY_TYPE_VALUES);
export const LINKED_PERSON_ROLE_OPTIONS = toOptions(LINKED_PERSON_ROLE_VALUES);
export const RELATED_PARTY_CATEGORY_OPTIONS = toOptions(RELATED_PARTY_CATEGORY_VALUES);
export const CLASSIFICATION_FRAMEWORK_OPTIONS = toOptions(CLASSIFICATION_FRAMEWORK_VALUES);
export const RELATIONSHIP_SOURCE_OPTIONS = toOptions(RELATIONSHIP_SOURCE_TYPE_VALUES);
export const RPT_TRANSACTION_TYPE_OPTIONS = toOptions(RPT_TRANSACTION_TYPE_VALUES);
export const ARMS_LENGTH_STATUS_OPTIONS = toOptions(ARMS_LENGTH_STATUS_VALUES);
export const RECURRING_OPTIONS = toOptions(RECURRING_NON_RECURRING_VALUES);
export const CASH_NON_CASH_OPTIONS = toOptions(CASH_NON_CASH_VALUES);
export const RPT_BALANCE_TYPE_OPTIONS = toOptions(RPT_BALANCE_TYPE_VALUES);
export const SECURED_UNSECURED_OPTIONS = toOptions(SECURED_UNSECURED_VALUES);
export const INTEREST_BEARING_OPTIONS = toOptions(INTEREST_BEARING_VALUES);
export const DEPENDENCY_TYPE_OPTIONS = toOptions(DEPENDENCY_TYPE_VALUES);
export const OTHER_BUSINESS_INTEREST_OPTIONS = toOptions(OTHER_BUSINESS_INTEREST_TYPE_VALUES);
export const AUDIT_STATUS_OPTIONS = toOptions(AUDIT_STATUS_VALUES);
export const ENTITY_INFORMATION_STATUS_OPTIONS = toOptions(ENTITY_INFORMATION_STATUS_VALUES);
export const RELATIONSHIP_CHANGE_EVENT_OPTIONS = toOptions(RELATIONSHIP_CHANGE_EVENT_VALUES);

export const ENTITY_CLASSIFICATION_BADGE_LABELS: Record<string, string> = {
  parent: 'Parent',
  'ultimate-parent': 'Ultimate Parent',
  subsidiary: 'Subsidiary',
  'step-down-subsidiary': 'Step-down Subsidiary',
  associate: 'Associate',
  jv: 'Joint Venture',
  'common-control-entity': 'Common-control Entity',
  'promoter-group-entity': 'Promoter Group Entity',
  'related-party': 'Related Party',
  'icdr-group-company': 'ICDR Group Company',
  'material-subsidiary': 'Material Subsidiary',
  other: 'Other',
};

export const GROUP_ENTITIES_CONFIRMATION_FIELDS: Array<{
  key: keyof GroupEntitiesConfirmations;
  label: string;
}> = [
  { key: 'allSubsidiariesDisclosed', label: 'All subsidiaries disclosed' },
  { key: 'stepDownSubsidiariesDisclosed', label: 'Step-down subsidiaries disclosed' },
  { key: 'associatesJvsDisclosed', label: 'Associates and JVs disclosed' },
  {
    key: 'ultimateParentControlStructureAccurate',
    label: 'Ultimate parent/control structure accurate',
  },
  {
    key: 'promoterGroupRelationshipsComplete',
    label: 'Promoter-group relationships complete',
  },
  {
    key: 'accountingStandardRelatedPartiesIdentified',
    label: 'Applicable accounting-standard related parties identified',
  },
  {
    key: 'companiesActRelatedPartiesConsidered',
    label: 'Companies Act related parties considered',
  },
  {
    key: 'historicalRelatedPartiesIncluded',
    label: 'Historical related parties included',
  },
  {
    key: 'icdrGroupCompaniesIdentified',
    label: 'ICDR Group Companies identified using applicable criteria and Board policy',
  },
  {
    key: 'subsidiariesPromotersNotDuplicatedAsGroupCompanies',
    label: 'Subsidiaries/promoters not incorrectly duplicated as Group Companies',
  },
  { key: 'currentMaterialityPolicyCaptured', label: 'Current Materiality Policy captured' },
  { key: 'rptRegisterComplete', label: 'RPT register complete' },
  { key: 'outstandingBalancesComplete', label: 'Outstanding balances complete' },
  { key: 'commitmentsComplete', label: 'Commitments complete' },
  { key: 'guaranteesCollateralComplete', label: 'Guarantees/collateral complete' },
  { key: 'loansAdvancesComplete', label: 'Loans and advances complete' },
  { key: 'commonPursuitsDisclosed', label: 'Common pursuits disclosed' },
  {
    key: 'groupCompanyDependenciesDisclosed',
    label: 'Group-company dependencies disclosed',
  },
  {
    key: 'competingGroupBusinessesDisclosed',
    label: 'Competing group businesses disclosed',
  },
  {
    key: 'groupCompanyFinancialInformationCurrent',
    label: 'Group-company financial information current to extent available',
  },
  {
    key: 'negativeNetWorthAuditorConcernsDisclosed',
    label: 'Negative net-worth/auditor concerns disclosed',
  },
  {
    key: 'ibcWindingUpStrikeOffDisclosed',
    label: 'IBC/winding-up/strike-off matters disclosed',
  },
  {
    key: 'informationUnavailableFromGroupCompaniesIdentified',
    label: 'Information unavailable from Group Companies identified',
  },
  {
    key: 'conflictingClassificationsFlagged',
    label: 'Conflicting classifications flagged',
  },
  {
    key: 'linkedWorkstreamValuesReconciled',
    label: 'Linked-workstream values reconciled',
  },
  {
    key: 'professionalConfirmationRequired',
    label: 'Professional/accounting/legal/merchant-banker confirmation remains required',
  },
];
