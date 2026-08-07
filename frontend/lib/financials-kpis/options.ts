/**
 * UI option arrays and label maps for Financials & KPIs.
 */

import {
  ACCOUNTING_FRAMEWORK_VALUES,
  ACCOUNTING_POLICY_CATEGORY_VALUES,
  AUDIT_OPINION_VALUES,
  AUDITED_STATUS_VALUES,
  CONSOLIDATION_METHOD_VALUES,
  DISPLAY_UNIT_VALUES,
  DRHP_LOCATION_VALUES,
  FINALISATION_STATUS_VALUES,
  FINANCIAL_PRESENTATION_VALUES,
  FULL_YEAR_OR_INTERIM_VALUES,
  KPI_CATEGORY_VALUES,
  KPI_PROPOSED_TREATMENT_VALUES,
  PERIOD_BASIS_VALUES,
  PROFESSIONAL_CONFIRMATION_STATUS_VALUES,
  REPORTING_ENTITY_TYPE_VALUES,
  RESTATED_STATUS_VALUES,
  RESTATEMENT_ADJUSTMENT_CATEGORY_VALUES,
  RESTATEMENT_EXERCISE_STATUS_VALUES,
  SOURCE_STATUS_VALUES,
  YES_NO_NOT_SURE_VALUES,
} from '@/lib/schemas/financials-kpis';
import type {
  FinancialsKpisConfirmations,
  FinancialsKpisSectionId,
} from '@/lib/schemas/financials-kpis';

export type SelectOption = { value: string; label: string };

export const FINANCIALS_KPIS_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'information', label: 'Information' },
  { id: 'financial-assessment', label: 'Financial Assessment' },
] as const;

export type FinancialsKpisTabId = (typeof FINANCIALS_KPIS_TABS)[number]['id'];

export const TABS = FINANCIALS_KPIS_TABS;

export const FINANCIALS_KPIS_INFORMATION_SECTIONS: Array<{
  id: FinancialsKpisSectionId;
  label: string;
  description: string;
}> = [
  {
    id: 'reporting-scope-periods-and-auditor-readiness',
    label: 'Reporting Scope, Periods & Auditor Readiness',
    description:
      'Reporting basis, entity scope, the shared financial-period registry and auditor readiness.',
  },
  {
    id: 'restated-statement-of-profit-and-loss',
    label: 'Restated Statement of Profit & Loss',
    description:
      'Period-based P&L grid, exceptional items and per-share information using the shared period registry.',
  },
  {
    id: 'assets-liabilities-equity-and-cash-flows',
    label: 'Assets, Liabilities, Equity & Cash Flows',
    description:
      'Balance sheet, cash flow and changes-in-equity grids driven by the shared period registry.',
  },
  {
    id: 'restatement-adjustments-policies-and-auditor-matters',
    label: 'Restatement Adjustments, Policies & Auditor Matters',
    description:
      'Restatement adjustment register, accounting policies and audit-report matters.',
  },
  {
    id: 'other-financial-information',
    label: 'Other Financial Information',
    description:
      'Segments, related parties, contingencies, working capital, indebtedness, tax and dividends.',
  },
  {
    id: 'ratios-capitalisation-and-issue-price-metrics',
    label: 'Ratios, Capitalisation & Issue-Price Metrics',
    description:
      'Derived ratios, non-GAAP formula registry, SME eligibility and capitalisation views.',
  },
  {
    id: 'kpi-selection-governance-and-peer-comparison',
    label: 'KPI Selection, Governance & Peer Comparison',
    description:
      'Selected-data inventory, KPI register, governance certifications and peer comparison.',
  },
  {
    id: 'mda-trends-material-developments-and-confirmations',
    label: 'MD&A, Trends, Material Developments & Confirmations',
    description:
      'Performance factors, variance analysis, liquidity, trends, subsequent events and confirmations.',
  },
];

export const INFORMATION_SECTIONS = FINANCIALS_KPIS_INFORMATION_SECTIONS;

export const FINANCIALS_KPIS_SECTION_LABELS: Record<FinancialsKpisSectionId, string> = {
  'reporting-scope-periods-and-auditor-readiness': 'Reporting Scope, Periods & Auditor Readiness',
  'restated-statement-of-profit-and-loss': 'Restated Statement of Profit & Loss',
  'assets-liabilities-equity-and-cash-flows': 'Assets, Liabilities, Equity & Cash Flows',
  'restatement-adjustments-policies-and-auditor-matters':
    'Restatement Adjustments, Policies & Auditor Matters',
  'other-financial-information': 'Other Financial Information',
  'ratios-capitalisation-and-issue-price-metrics': 'Ratios, Capitalisation & Issue-Price Metrics',
  'kpi-selection-governance-and-peer-comparison': 'KPI Selection, Governance & Peer Comparison',
  'mda-trends-material-developments-and-confirmations':
    'MD&A, Trends, Material Developments & Confirmations',
};

function optionsFrom(values: readonly string[], labels: Record<string, string>): SelectOption[] {
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

export const YES_NO_NOT_SURE_LABELS: Record<(typeof YES_NO_NOT_SURE_VALUES)[number], string> = {
  yes: 'Yes',
  no: 'No',
  not_sure: 'Not sure',
};

export const SOURCE_STATUS_LABELS: Record<(typeof SOURCE_STATUS_VALUES)[number], string> = {
  audited_financial_statements: 'Audited financial statements',
  restated_financial_information: 'Restated financial information',
  auditor_certificate: 'Auditor certificate',
  management_accounts: 'Management accounts',
  management_estimate: 'Management estimate',
  pending_confirmation: 'Pending confirmation',
  not_available: 'Not available',
};

export const ACCOUNTING_FRAMEWORK_LABELS: Record<
  (typeof ACCOUNTING_FRAMEWORK_VALUES)[number],
  string
> = {
  'indian-gaap': 'Indian GAAP / Accounting Standards',
  'ind-as': 'Ind AS',
  'sector-specific': 'Sector-specific framework',
  'transition-in-progress': 'Transition in progress',
  'professional-confirmation-required': 'Professional confirmation required',
};

export const FINANCIAL_PRESENTATION_LABELS: Record<
  (typeof FINANCIAL_PRESENTATION_VALUES)[number],
  string
> = {
  standalone: 'Standalone',
  consolidated: 'Consolidated',
  both: 'Both',
};

export const DISPLAY_UNIT_LABELS: Record<(typeof DISPLAY_UNIT_VALUES)[number], string> = {
  rupees: 'Rupees',
  thousand: '₹ thousand',
  lakh: '₹ lakh',
  crore: '₹ crore',
  million: 'Million',
};

export const REPORTING_ENTITY_TYPE_LABELS: Record<
  (typeof REPORTING_ENTITY_TYPE_VALUES)[number],
  string
> = {
  issuer: 'Issuer',
  subsidiary: 'Subsidiary',
  associate: 'Associate',
  'joint-venture': 'Joint venture',
  'foreign-entity': 'Foreign entity',
  predecessor: 'Predecessor entity',
  'promoting-company': 'Promoting company',
  other: 'Other',
};

export const CONSOLIDATION_METHOD_LABELS: Record<
  (typeof CONSOLIDATION_METHOD_VALUES)[number],
  string
> = {
  'full-consolidation': 'Full consolidation',
  'equity-method': 'Equity method',
  proportionate: 'Proportionate',
  'not-consolidated': 'Not consolidated',
  other: 'Other',
};

export const FULL_YEAR_OR_INTERIM_LABELS: Record<
  (typeof FULL_YEAR_OR_INTERIM_VALUES)[number],
  string
> = {
  'full-year': 'Full year',
  interim: 'Interim / stub',
};

export const PERIOD_BASIS_LABELS: Record<(typeof PERIOD_BASIS_VALUES)[number], string> = {
  standalone: 'Standalone',
  consolidated: 'Consolidated',
};

export const AUDITED_STATUS_LABELS: Record<(typeof AUDITED_STATUS_VALUES)[number], string> = {
  audited: 'Audited',
  unaudited: 'Unaudited',
  reviewed: 'Reviewed',
  pending: 'Pending',
  'not-applicable': 'Not applicable',
};

export const RESTATED_STATUS_LABELS: Record<(typeof RESTATED_STATUS_VALUES)[number], string> = {
  restated: 'Restated',
  'not-restated': 'Not restated',
  'restatement-in-progress': 'Restatement in progress',
  pending: 'Pending',
};

export const FINALISATION_STATUS_LABELS: Record<
  (typeof FINALISATION_STATUS_VALUES)[number],
  string
> = {
  finalised: 'Finalised',
  draft: 'Draft',
  'pending-auditor': 'Pending auditor',
  'pending-board': 'Pending board',
};

export const RESTATEMENT_EXERCISE_STATUS_LABELS: Record<
  (typeof RESTATEMENT_EXERCISE_STATUS_VALUES)[number],
  string
> = {
  'not-started': 'Not started',
  'data-collection': 'Data collection',
  'under-preparation': 'Under preparation',
  'under-auditor-review': 'Under auditor review',
  completed: 'Completed',
  'pending-professional-appointment': 'Pending professional appointment',
};

export const PROFESSIONAL_CONFIRMATION_STATUS_LABELS: Record<
  (typeof PROFESSIONAL_CONFIRMATION_STATUS_VALUES)[number],
  string
> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  not_required: 'Not required',
  not_sure: 'Not sure',
};

export const RESTATEMENT_ADJUSTMENT_CATEGORY_LABELS: Record<
  (typeof RESTATEMENT_ADJUSTMENT_CATEGORY_VALUES)[number],
  string
> = {
  'prior-period-error': 'Prior-period error',
  'accounting-policy-change': 'Accounting policy change',
  'accounting-estimate-change': 'Accounting estimate change',
  'auditor-qualification': 'Auditor qualification',
  reclassification: 'Reclassification',
  regrouping: 'Regrouping',
  'consolidation-adjustment': 'Consolidation adjustment',
  'merger-acquisition': 'Merger / acquisition',
  'related-party-adjustment': 'Related-party adjustment',
  'tax-adjustment': 'Tax adjustment',
  'share-based-payment-adjustment': 'Share-based payment adjustment',
  'capital-adjustment': 'Capital adjustment',
  'exceptional-non-recurring': 'Exceptional / non-recurring item',
  other: 'Other',
};

export const ACCOUNTING_POLICY_CATEGORY_LABELS: Record<
  (typeof ACCOUNTING_POLICY_CATEGORY_VALUES)[number],
  string
> = {
  'revenue-recognition': 'Revenue recognition',
  inventory: 'Inventory',
  'ppe-and-depreciation': 'PPE and depreciation',
  intangibles: 'Intangibles',
  impairment: 'Impairment',
  'borrowing-costs': 'Borrowing costs',
  leases: 'Leases',
  'employee-benefits': 'Employee benefits',
  'foreign-currency': 'Foreign currency',
  'financial-instruments': 'Financial instruments',
  taxation: 'Taxation',
  'provisions-and-contingencies': 'Provisions and contingencies',
  'government-grants': 'Government grants',
  'business-combinations': 'Business combinations',
  consolidation: 'Consolidation',
  'related-parties': 'Related parties',
  'share-based-payments': 'Share-based payments',
  other: 'Other',
};

export const AUDIT_OPINION_LABELS: Record<(typeof AUDIT_OPINION_VALUES)[number], string> = {
  unmodified: 'Unmodified',
  qualified: 'Qualified',
  adverse: 'Adverse',
  disclaimer: 'Disclaimer',
  pending: 'Pending',
};

export const KPI_CATEGORY_LABELS: Record<(typeof KPI_CATEGORY_VALUES)[number], string> = {
  'gaap-financial': 'GAAP financial',
  'non-gaap-financial': 'Non-GAAP financial',
  operational: 'Operational',
};

export const KPI_PROPOSED_TREATMENT_LABELS: Record<
  (typeof KPI_PROPOSED_TREATMENT_VALUES)[number],
  string
> = {
  'include-as-kpi': 'Include as KPI',
  'disclose-elsewhere': 'Disclose elsewhere',
  exclude: 'Exclude',
};

export const DRHP_LOCATION_LABELS: Record<(typeof DRHP_LOCATION_VALUES)[number], string> = {
  'basis-for-issue-price': 'Basis for Issue Price',
  'our-business': 'Our Business',
  both: 'Both',
};

export const YES_NO_NOT_SURE_OPTIONS = optionsFrom(YES_NO_NOT_SURE_VALUES, YES_NO_NOT_SURE_LABELS);
export const SOURCE_STATUS_OPTIONS = optionsFrom(SOURCE_STATUS_VALUES, SOURCE_STATUS_LABELS);
export const ACCOUNTING_FRAMEWORK_OPTIONS = optionsFrom(
  ACCOUNTING_FRAMEWORK_VALUES,
  ACCOUNTING_FRAMEWORK_LABELS,
);
export const FINANCIAL_PRESENTATION_OPTIONS = optionsFrom(
  FINANCIAL_PRESENTATION_VALUES,
  FINANCIAL_PRESENTATION_LABELS,
);
export const DISPLAY_UNIT_OPTIONS = optionsFrom(DISPLAY_UNIT_VALUES, DISPLAY_UNIT_LABELS);
export const REPORTING_ENTITY_TYPE_OPTIONS = optionsFrom(
  REPORTING_ENTITY_TYPE_VALUES,
  REPORTING_ENTITY_TYPE_LABELS,
);
export const CONSOLIDATION_METHOD_OPTIONS = optionsFrom(
  CONSOLIDATION_METHOD_VALUES,
  CONSOLIDATION_METHOD_LABELS,
);
export const FULL_YEAR_OR_INTERIM_OPTIONS = optionsFrom(
  FULL_YEAR_OR_INTERIM_VALUES,
  FULL_YEAR_OR_INTERIM_LABELS,
);
export const PERIOD_BASIS_OPTIONS = optionsFrom(PERIOD_BASIS_VALUES, PERIOD_BASIS_LABELS);
export const AUDITED_STATUS_OPTIONS = optionsFrom(AUDITED_STATUS_VALUES, AUDITED_STATUS_LABELS);
export const RESTATED_STATUS_OPTIONS = optionsFrom(RESTATED_STATUS_VALUES, RESTATED_STATUS_LABELS);
export const FINALISATION_STATUS_OPTIONS = optionsFrom(
  FINALISATION_STATUS_VALUES,
  FINALISATION_STATUS_LABELS,
);
export const RESTATEMENT_EXERCISE_STATUS_OPTIONS = optionsFrom(
  RESTATEMENT_EXERCISE_STATUS_VALUES,
  RESTATEMENT_EXERCISE_STATUS_LABELS,
);
export const PROFESSIONAL_CONFIRMATION_STATUS_OPTIONS = optionsFrom(
  PROFESSIONAL_CONFIRMATION_STATUS_VALUES,
  PROFESSIONAL_CONFIRMATION_STATUS_LABELS,
);
export const RESTATEMENT_ADJUSTMENT_CATEGORY_OPTIONS = optionsFrom(
  RESTATEMENT_ADJUSTMENT_CATEGORY_VALUES,
  RESTATEMENT_ADJUSTMENT_CATEGORY_LABELS,
);
export const ACCOUNTING_POLICY_CATEGORY_OPTIONS = optionsFrom(
  ACCOUNTING_POLICY_CATEGORY_VALUES,
  ACCOUNTING_POLICY_CATEGORY_LABELS,
);
export const AUDIT_OPINION_OPTIONS = optionsFrom(AUDIT_OPINION_VALUES, AUDIT_OPINION_LABELS);
export const KPI_CATEGORY_OPTIONS = optionsFrom(KPI_CATEGORY_VALUES, KPI_CATEGORY_LABELS);
export const KPI_PROPOSED_TREATMENT_OPTIONS = optionsFrom(
  KPI_PROPOSED_TREATMENT_VALUES,
  KPI_PROPOSED_TREATMENT_LABELS,
);
export const DRHP_LOCATION_OPTIONS = optionsFrom(DRHP_LOCATION_VALUES, DRHP_LOCATION_LABELS);

export const FINANCIALS_KPIS_CONFIRMATION_FIELDS: Array<{
  key: keyof FinancialsKpisConfirmations;
  label: string;
}> = [
  {
    key: 'reportingScopeAndEntitiesComplete',
    label: 'Reporting scope and entities are complete',
  },
  { key: 'periodsAreCorrect', label: 'Financial periods are correct' },
  { key: 'valuesMatchIdentifiedSources', label: 'Values match identified sources' },
  {
    key: 'shareCapitalReconcilesWithCapitalOwnership',
    label: 'Share capital reconciles with Capital & Ownership',
  },
  {
    key: 'revenueSegmentsReconcileWithBusinessOperations',
    label: 'Revenue / segments reconcile with Business & Operations',
  },
  {
    key: 'workingCapitalReconcilesWithObjectsOfIssue',
    label: 'Working capital reconciles with Objects of the Issue',
  },
  {
    key: 'borrowingTotalsReconcileWithAvailableRecords',
    label: 'Borrowing totals reconcile with available records',
  },
  { key: 'restatementAdjustmentsComplete', label: 'Restatement adjustments are complete' },
  { key: 'auditorRemarksDisclosed', label: 'Auditor remarks are disclosed' },
  { key: 'exceptionalItemsDisclosed', label: 'Exceptional items are disclosed' },
  {
    key: 'relatedPartyTransactionsComplete',
    label: 'Related-party transactions are complete',
  },
  {
    key: 'contingenciesAndCommitmentsComplete',
    label: 'Contingencies and commitments are complete',
  },
  {
    key: 'subsequentDevelopmentsDisclosed',
    label: 'Subsequent developments are disclosed',
  },
  {
    key: 'investorSharedHistoricalMetricsConsidered',
    label: 'Investor-shared historical metrics were considered',
  },
  { key: 'boardUsedMetricsConsidered', label: 'Board-used metrics were considered' },
  { key: 'kpiFormulasComplete', label: 'KPI formulas are complete' },
  {
    key: 'historicalKpiDisclosuresExcludeProjections',
    label: 'Historical KPI disclosures exclude projections',
  },
  {
    key: 'peerInformationWillUseTraceableSources',
    label: 'Peer information will use traceable sources',
  },
  {
    key: 'auditCommitteeApprovalRemainsRequired',
    label: 'Audit Committee approval remains required',
  },
  {
    key: 'professionalCertificationRemainsRequired',
    label: 'Professional certification remains required',
  },
  {
    key: 'noRegulatoryOrAuditorConclusionRepresented',
    label: 'No regulatory or auditor conclusion is being represented',
  },
];
