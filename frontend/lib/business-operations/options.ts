/**
 * UI option arrays and label maps for Business & Operations.
 *
 * Labels are presentation-only and must never be persisted inside the payload.
 */

import type {
  BusinessOperationsConfirmations,
  BusinessOperationsSectionId,
} from '@/lib/schemas/business-operations';
import {
  AUTOMATION_LEVEL_VALUES,
  BUSINESS_CLASSIFICATION_VALUES,
  BUSINESS_UNIT_STATUS_VALUES,
  CAPACITY_METRIC_UNIT_VALUES,
  CERTIFICATION_RENEWAL_STATUS_VALUES,
  COLLABORATION_NATURE_VALUES,
  CUSTOMER_MODEL_VALUES,
  DEPENDENCY_TYPE_VALUES,
  DISCLOSURE_CONSENT_VALUES,
  DOMESTIC_EXPORT_CLASSIFICATION_VALUES,
  EQUIPMENT_ORIGIN_VALUES,
  EQUIPMENT_STATUS_VALUES,
  EQUIPMENT_TENURE_VALUES,
  FACILITY_STATUS_VALUES,
  FACILITY_TENURE_VALUES,
  FACILITY_TYPE_VALUES,
  FIGURE_SOURCE_VALUES,
  GEOGRAPHIC_SCOPE_VALUES,
  HOSTING_MODEL_VALUES,
  INPUT_CATEGORY_VALUES,
  INSURANCE_POLICY_TYPE_VALUES,
  IP_OWNERSHIP_MODEL_VALUES,
  IP_STATUS_VALUES,
  IP_TYPE_VALUES,
  LIFECYCLE_STAGE_VALUES,
  LOGISTICS_MODEL_VALUES,
  MATERIALITY_STATUS_VALUES,
  OFFERING_COMMERCIAL_STATUS_VALUES,
  ORDER_BOOK_SECURITY_VALUES,
  ORDER_MODEL_VALUES,
  PLANNED_CAPACITY_STATUS_VALUES,
  PROCESS_EXECUTION_VALUES,
  PROCUREMENT_MODEL_VALUES,
  PRODUCT_TYPE_VALUES,
  PRODUCTION_MODEL_VALUES,
  PROFESSIONAL_REVIEW_STATUS_VALUES,
  RD_DELIVERY_MODEL_VALUES,
  REVENUE_MODEL_VALUES,
  SALES_CHANNEL_TYPE_VALUES,
  SOURCE_STATUS_VALUES,
  SOURCING_MODEL_VALUES,
  STRATEGY_CATEGORY_VALUES,
  STRATEGY_STATUS_VALUES,
  STRATEGY_TIME_HORIZON_VALUES,
  TECHNOLOGY_OWNERSHIP_VALUES,
  YES_NO_NOT_SURE_VALUES,
} from '@/lib/schemas/business-operations';

export type SelectOption = { value: string; label: string };

export const BUSINESS_OPERATIONS_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'information', label: 'Information' },
  { id: 'business-assessment', label: 'Business Assessment' },
] as const;

export type BusinessOperationsTabId = (typeof BUSINESS_OPERATIONS_TABS)[number]['id'];

/** Alias used by URL hook and barrel exports. */
export const TABS = BUSINESS_OPERATIONS_TABS;

export const BUSINESS_OPERATIONS_INFORMATION_SECTIONS: Array<{
  id: BusinessOperationsSectionId;
  label: string;
  description: string;
}> = [
  {
    id: 'business-profile-operating-model',
    label: 'Business Profile & Operating Model',
    description:
      'Commencement, classifications, customer and revenue models, geography and business units.',
  },
  {
    id: 'products-services-revenue-mix',
    label: 'Products, Services & Revenue Mix',
    description:
      'Product and service register, three-year revenue mix, launches and discontinuations.',
  },
  {
    id: 'customers-sales-distribution-geography',
    label: 'Customers, Sales, Distribution & Geography',
    description:
      'Customer profile, concentration, sales channels, geographic mix and order book.',
  },
  {
    id: 'suppliers-procurement-inventory-logistics',
    label: 'Suppliers, Procurement, Inventory & Logistics',
    description:
      'Key inputs, supplier concentration, procurement, inventory and logistics arrangements.',
  },
  {
    id: 'facilities-capacity-operational-process',
    label: 'Facilities, Capacity & Operational Process',
    description:
      'Facilities, capacity utilisation, planned capacity, process flow and utilities.',
  },
  {
    id: 'technology-quality-rd-ip',
    label: 'Technology, Quality, R&D & Intellectual Property',
    description:
      'Technology stack, machinery, quality, certifications, R&D spend and IP records.',
  },
  {
    id: 'workforce-collaborations-insurance-continuity',
    label: 'Workforce, Collaborations, Insurance & Continuity',
    description:
      'Workforce numbers, collaborations, operating dependencies, insurance and continuity.',
  },
  {
    id: 'competitive-strengths-strategy-confirmations',
    label: 'Competitive Strengths, Strategy, Dependencies & Confirmations',
    description:
      'Supported strengths, strategies, key dependencies and issuer confirmations.',
  },
];

/** Alias used by URL hook and barrel exports. */
export const INFORMATION_SECTIONS = BUSINESS_OPERATIONS_INFORMATION_SECTIONS;

export const BUSINESS_OPERATIONS_SECTION_LABELS: Record<BusinessOperationsSectionId, string> = {
  'business-profile-operating-model': 'Business Profile & Operating Model',
  'products-services-revenue-mix': 'Products, Services & Revenue Mix',
  'customers-sales-distribution-geography': 'Customers, Sales, Distribution & Geography',
  'suppliers-procurement-inventory-logistics': 'Suppliers, Procurement, Inventory & Logistics',
  'facilities-capacity-operational-process': 'Facilities, Capacity & Operational Process',
  'technology-quality-rd-ip': 'Technology, Quality, R&D & Intellectual Property',
  'workforce-collaborations-insurance-continuity':
    'Workforce, Collaborations, Insurance & Continuity',
  'competitive-strengths-strategy-confirmations':
    'Competitive Strengths, Strategy, Dependencies & Confirmations',
};

function optionsFrom(
  values: readonly string[],
  labels: Record<string, string>,
): SelectOption[] {
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

/* -------------------------------------------------------------------------- */
/* Label maps                                                                  */
/* -------------------------------------------------------------------------- */

export const YES_NO_NOT_SURE_LABELS: Record<(typeof YES_NO_NOT_SURE_VALUES)[number], string> = {
  yes: 'Yes',
  no: 'No',
  not_sure: 'Not sure',
};

export const BUSINESS_CLASSIFICATION_LABELS: Record<
  (typeof BUSINESS_CLASSIFICATION_VALUES)[number],
  string
> = {
  manufacturing: 'Manufacturing',
  'trading-or-distribution': 'Trading or distribution',
  services: 'Services',
  'software-or-technology-platform': 'Software or technology platform',
  'engineering-epc-project': 'Engineering / EPC / project business',
  'contract-manufacturing': 'Contract manufacturing',
  'retail-or-consumer': 'Retail or consumer business',
  mixed: 'Mixed',
  other: 'Other',
};

export const CUSTOMER_MODEL_LABELS: Record<(typeof CUSTOMER_MODEL_VALUES)[number], string> = {
  b2b: 'B2B',
  b2c: 'B2C',
  b2g: 'B2G',
  mixed: 'Mixed',
};

export const REVENUE_MODEL_LABELS: Record<(typeof REVENUE_MODEL_VALUES)[number], string> = {
  'product-sales': 'Product sales',
  'service-fees': 'Service fees',
  subscription: 'Subscription',
  commission: 'Commission',
  'project-billing': 'Project billing',
  licensing: 'Licensing',
  'job-work': 'Job work',
  rental: 'Rental',
  other: 'Other',
};

export const ORDER_MODEL_LABELS: Record<(typeof ORDER_MODEL_VALUES)[number], string> = {
  'purchase-orders': 'Purchase orders',
  'long-term-contracts': 'Long-term contracts',
  'framework-agreements': 'Framework agreements',
  'subscription-contracts': 'Subscription contracts',
  'spot-sales': 'Spot sales',
  'tender-based': 'Tender based',
  mixed: 'Mixed',
};

export const BUSINESS_UNIT_STATUS_LABELS: Record<
  (typeof BUSINESS_UNIT_STATUS_VALUES)[number],
  string
> = {
  active: 'Active',
  inactive: 'Inactive',
  planned: 'Planned',
  discontinued: 'Discontinued',
  other: 'Other',
};

export const PRODUCT_TYPE_LABELS: Record<(typeof PRODUCT_TYPE_VALUES)[number], string> = {
  product: 'Product',
  service: 'Service',
  solution: 'Solution',
  platform: 'Platform',
  project: 'Project',
  'trading-category': 'Trading category',
};

export const LIFECYCLE_STAGE_LABELS: Record<(typeof LIFECYCLE_STAGE_VALUES)[number], string> = {
  introduction: 'Introduction',
  growth: 'Growth',
  maturity: 'Maturity',
  decline: 'Decline',
  discontinued: 'Discontinued',
  other: 'Other',
};

export const SOURCING_MODEL_LABELS: Record<(typeof SOURCING_MODEL_VALUES)[number], string> = {
  'in-house': 'In-house',
  outsourced: 'Outsourced',
  'third-party-sourced': 'Third-party sourced',
  mixed: 'Mixed',
};

export const DOMESTIC_EXPORT_CLASSIFICATION_LABELS: Record<
  (typeof DOMESTIC_EXPORT_CLASSIFICATION_VALUES)[number],
  string
> = {
  domestic: 'Domestic',
  export: 'Export',
  both: 'Both',
};

export const FIGURE_SOURCE_LABELS: Record<(typeof FIGURE_SOURCE_VALUES)[number], string> = {
  'audited-financials': 'Audited financials',
  'auditor-certificate': 'Auditor certificate',
  'management-records': 'Management records',
  estimate: 'Estimate',
  'not-available': 'Not available',
};

export const OFFERING_COMMERCIAL_STATUS_LABELS: Record<
  (typeof OFFERING_COMMERCIAL_STATUS_VALUES)[number],
  string
> = {
  active: 'Active',
  launched: 'Launched',
  discontinued: 'Discontinued',
  planned: 'Planned',
  other: 'Other',
};

export const DISCLOSURE_CONSENT_LABELS: Record<
  (typeof DISCLOSURE_CONSENT_VALUES)[number],
  string
> = {
  consented: 'Consented',
  'not-consented': 'Not consented',
  pending: 'Pending',
  'confidential-label-used': 'Confidential label used',
  'not-applicable': 'Not applicable',
  unknown: 'Unknown',
};

export const SALES_CHANNEL_TYPE_LABELS: Record<
  (typeof SALES_CHANNEL_TYPE_VALUES)[number],
  string
> = {
  'direct-sales': 'Direct sales',
  distributors: 'Distributors',
  dealers: 'Dealers',
  'online-marketplace': 'Online marketplace',
  'own-website-or-app': 'Own website or app',
  'retail-stores': 'Retail stores',
  'agents-or-brokers': 'Agents or brokers',
  tender: 'Tender',
  franchise: 'Franchise',
  other: 'Other',
};

export const GEOGRAPHIC_SCOPE_LABELS: Record<(typeof GEOGRAPHIC_SCOPE_VALUES)[number], string> = {
  india: 'India',
  export: 'Export',
  region: 'Region',
  country: 'Country',
};

export const ORDER_BOOK_SECURITY_LABELS: Record<
  (typeof ORDER_BOOK_SECURITY_VALUES)[number],
  string
> = {
  secured: 'Secured',
  unsecured: 'Unsecured',
  mixed: 'Mixed',
  unknown: 'Unknown',
};

export const INPUT_CATEGORY_LABELS: Record<(typeof INPUT_CATEGORY_VALUES)[number], string> = {
  'raw-material': 'Raw material',
  component: 'Component',
  packaging: 'Packaging',
  consumable: 'Consumable',
  utility: 'Utility',
  'service-input': 'Service input',
  'software-or-data': 'Software or data',
  other: 'Other',
};

export const PROCUREMENT_MODEL_LABELS: Record<
  (typeof PROCUREMENT_MODEL_VALUES)[number],
  string
> = {
  centralised: 'Centralised',
  decentralised: 'Decentralised',
  mixed: 'Mixed',
};

export const PRODUCTION_MODEL_LABELS: Record<(typeof PRODUCTION_MODEL_VALUES)[number], string> = {
  'make-to-order': 'Make to order',
  'make-to-stock': 'Make to stock',
  mixed: 'Mixed',
  'not-applicable': 'Not applicable',
};

export const LOGISTICS_MODEL_LABELS: Record<(typeof LOGISTICS_MODEL_VALUES)[number], string> = {
  'in-house': 'In-house',
  'third-party': 'Third-party',
  mixed: 'Mixed',
};

export const FACILITY_TYPE_LABELS: Record<(typeof FACILITY_TYPE_VALUES)[number], string> = {
  'manufacturing-plant': 'Manufacturing plant',
  office: 'Office',
  warehouse: 'Warehouse',
  'service-centre': 'Service centre',
  'retail-location': 'Retail location',
  'data-centre': 'Data centre',
  laboratory: 'Laboratory',
  'project-site': 'Project site',
  'third-party-facility': 'Third-party facility',
  other: 'Other',
};

export const FACILITY_TENURE_LABELS: Record<(typeof FACILITY_TENURE_VALUES)[number], string> = {
  owned: 'Owned',
  leased: 'Leased',
  licensed: 'Licensed',
  'third-party': 'Third-party',
};

export const FACILITY_STATUS_LABELS: Record<(typeof FACILITY_STATUS_VALUES)[number], string> = {
  operational: 'Operational',
  'under-construction': 'Under construction',
  planned: 'Planned',
  mothballed: 'Mothballed',
  closed: 'Closed',
  other: 'Other',
};

export const CAPACITY_METRIC_UNIT_LABELS: Record<
  (typeof CAPACITY_METRIC_UNIT_VALUES)[number],
  string
> = {
  units: 'Units',
  tonnes: 'Tonnes',
  metres: 'Metres',
  litres: 'Litres',
  hours: 'Hours',
  transactions: 'Transactions',
  seats: 'Seats',
  projects: 'Projects',
  stores: 'Stores',
  'active-users': 'Active users',
  'service-hours': 'Service hours',
  other: 'Other',
};

export const PLANNED_CAPACITY_STATUS_LABELS: Record<
  (typeof PLANNED_CAPACITY_STATUS_VALUES)[number],
  string
> = {
  planned: 'Planned',
  approved: 'Approved',
  'under-implementation': 'Under implementation',
  commissioned: 'Commissioned',
  deferred: 'Deferred',
  cancelled: 'Cancelled',
  other: 'Other',
};

export const PROCESS_EXECUTION_LABELS: Record<
  (typeof PROCESS_EXECUTION_VALUES)[number],
  string
> = {
  'in-house': 'In-house',
  outsourced: 'Outsourced',
  mixed: 'Mixed',
};

export const TECHNOLOGY_OWNERSHIP_LABELS: Record<
  (typeof TECHNOLOGY_OWNERSHIP_VALUES)[number],
  string
> = {
  proprietary: 'Proprietary',
  'third-party': 'Third-party',
  mixed: 'Mixed',
  licensed: 'Licensed',
};

export const AUTOMATION_LEVEL_LABELS: Record<(typeof AUTOMATION_LEVEL_VALUES)[number], string> = {
  manual: 'Manual',
  'semi-automated': 'Semi-automated',
  'highly-automated': 'Highly automated',
  'fully-automated': 'Fully automated',
  'not-applicable': 'Not applicable',
  unknown: 'Unknown',
};

export const HOSTING_MODEL_LABELS: Record<(typeof HOSTING_MODEL_VALUES)[number], string> = {
  'on-premise': 'On-premise',
  'private-cloud': 'Private cloud',
  'public-cloud': 'Public cloud',
  hybrid: 'Hybrid',
  saas: 'SaaS',
  'not-applicable': 'Not applicable',
  unknown: 'Unknown',
};

export const EQUIPMENT_TENURE_LABELS: Record<(typeof EQUIPMENT_TENURE_VALUES)[number], string> = {
  owned: 'Owned',
  leased: 'Leased',
  other: 'Other',
};

export const EQUIPMENT_ORIGIN_LABELS: Record<(typeof EQUIPMENT_ORIGIN_VALUES)[number], string> = {
  imported: 'Imported',
  domestic: 'Domestic',
  mixed: 'Mixed',
  unknown: 'Unknown',
};

export const EQUIPMENT_STATUS_LABELS: Record<(typeof EQUIPMENT_STATUS_VALUES)[number], string> = {
  operational: 'Operational',
  'under-installation': 'Under installation',
  idle: 'Idle',
  disposed: 'Disposed',
  other: 'Other',
};

export const CERTIFICATION_RENEWAL_STATUS_LABELS: Record<
  (typeof CERTIFICATION_RENEWAL_STATUS_VALUES)[number],
  string
> = {
  current: 'Current',
  'renewal-in-progress': 'Renewal in progress',
  expired: 'Expired',
  'not-renewed': 'Not renewed',
  'not-applicable': 'Not applicable',
  unknown: 'Unknown',
};

export const RD_DELIVERY_MODEL_LABELS: Record<(typeof RD_DELIVERY_MODEL_VALUES)[number], string> = {
  internal: 'Internal',
  outsourced: 'Outsourced',
  mixed: 'Mixed',
  'not-applicable': 'Not applicable',
};

export const IP_TYPE_LABELS: Record<(typeof IP_TYPE_VALUES)[number], string> = {
  patent: 'Patent',
  trademark: 'Trademark',
  copyright: 'Copyright',
  design: 'Design',
  'trade-secret': 'Trade secret',
  'domain-name': 'Domain name',
  other: 'Other',
};

export const IP_STATUS_LABELS: Record<(typeof IP_STATUS_VALUES)[number], string> = {
  registered: 'Registered',
  applied: 'Applied',
  pending: 'Pending',
  expired: 'Expired',
  abandoned: 'Abandoned',
  'licensed-in': 'Licensed in',
  other: 'Other',
};

export const IP_OWNERSHIP_MODEL_LABELS: Record<
  (typeof IP_OWNERSHIP_MODEL_VALUES)[number],
  string
> = {
  owned: 'Owned',
  licensed: 'Licensed',
  'jointly-owned': 'Jointly owned',
  other: 'Other',
};

export const MATERIALITY_STATUS_LABELS: Record<
  (typeof MATERIALITY_STATUS_VALUES)[number],
  string
> = {
  material: 'Material',
  'not-material': 'Not material',
  not_sure: 'Not sure',
};

export const COLLABORATION_NATURE_LABELS: Record<
  (typeof COLLABORATION_NATURE_VALUES)[number],
  string
> = {
  'technical-collaboration': 'Technical collaboration',
  'joint-venture': 'Joint venture',
  licensing: 'Licensing',
  distribution: 'Distribution',
  research: 'Research',
  franchise: 'Franchise',
  other: 'Other',
};

export const INSURANCE_POLICY_TYPE_LABELS: Record<
  (typeof INSURANCE_POLICY_TYPE_VALUES)[number],
  string
> = {
  property: 'Property',
  'plant-and-machinery': 'Plant and machinery',
  stock: 'Stock',
  'business-interruption': 'Business interruption',
  'public-liability': 'Public liability',
  'product-liability': 'Product liability',
  'directors-and-officers': 'Directors and officers',
  cyber: 'Cyber',
  'key-person': 'Key person',
  'marine-or-transit': 'Marine or transit',
  other: 'Other',
};

export const STRATEGY_CATEGORY_LABELS: Record<
  (typeof STRATEGY_CATEGORY_VALUES)[number],
  string
> = {
  growth: 'Growth',
  diversification: 'Diversification',
  'geographic-expansion': 'Geographic expansion',
  'product-development': 'Product development',
  'capacity-expansion': 'Capacity expansion',
  'digital-transformation': 'Digital transformation',
  'cost-optimisation': 'Cost optimisation',
  other: 'Other',
};

export const STRATEGY_TIME_HORIZON_LABELS: Record<
  (typeof STRATEGY_TIME_HORIZON_VALUES)[number],
  string
> = {
  'near-term': 'Near term',
  'medium-term': 'Medium term',
  'long-term': 'Long term',
  ongoing: 'Ongoing',
  other: 'Other',
};

export const STRATEGY_STATUS_LABELS: Record<(typeof STRATEGY_STATUS_VALUES)[number], string> = {
  proposed: 'Proposed',
  approved: 'Approved',
  'in-progress': 'In progress',
  completed: 'Completed',
  deferred: 'Deferred',
  abandoned: 'Abandoned',
  other: 'Other',
};

export const DEPENDENCY_TYPE_LABELS: Record<(typeof DEPENDENCY_TYPE_VALUES)[number], string> = {
  customer: 'Customer',
  supplier: 'Supplier',
  technology: 'Technology',
  regulatory: 'Regulatory',
  'key-person': 'Key person',
  facility: 'Facility',
  logistics: 'Logistics',
  financing: 'Financing',
  'contract-manufacturing': 'Contract manufacturing',
  'outsourced-service-delivery': 'Outsourced service delivery',
  franchise: 'Franchise',
  'cloud-or-platform': 'Cloud or platform',
  distributor: 'Distributor',
  other: 'Other',
};

export const PROFESSIONAL_REVIEW_STATUS_LABELS: Record<
  (typeof PROFESSIONAL_REVIEW_STATUS_VALUES)[number],
  string
> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
  'not-required': 'Not required',
  not_sure: 'Not sure',
};

export const SOURCE_STATUS_LABELS: Record<(typeof SOURCE_STATUS_VALUES)[number], string> = {
  available: 'Available',
  pending: 'Pending',
  'not-available': 'Not available',
  not_sure: 'Not sure',
};

export const DOMESTIC_OR_IMPORTED_LABELS: Record<string, string> = {
  domestic: 'Domestic',
  imported: 'Imported',
  both: 'Both',
  unknown: 'Unknown',
};

export const OFFERING_CHANGE_TYPE_LABELS: Record<string, string> = {
  launch: 'Launch',
  discontinuation: 'Discontinuation',
  other: 'Other',
};

/* -------------------------------------------------------------------------- */
/* Select option arrays                                                        */
/* -------------------------------------------------------------------------- */

export const YES_NO_NOT_SURE_OPTIONS = optionsFrom(YES_NO_NOT_SURE_VALUES, YES_NO_NOT_SURE_LABELS);
export const BUSINESS_CLASSIFICATION_OPTIONS = optionsFrom(
  BUSINESS_CLASSIFICATION_VALUES,
  BUSINESS_CLASSIFICATION_LABELS,
);
export const CUSTOMER_MODEL_OPTIONS = optionsFrom(CUSTOMER_MODEL_VALUES, CUSTOMER_MODEL_LABELS);
export const REVENUE_MODEL_OPTIONS = optionsFrom(REVENUE_MODEL_VALUES, REVENUE_MODEL_LABELS);
export const ORDER_MODEL_OPTIONS = optionsFrom(ORDER_MODEL_VALUES, ORDER_MODEL_LABELS);
export const BUSINESS_UNIT_STATUS_OPTIONS = optionsFrom(
  BUSINESS_UNIT_STATUS_VALUES,
  BUSINESS_UNIT_STATUS_LABELS,
);
export const PRODUCT_TYPE_OPTIONS = optionsFrom(PRODUCT_TYPE_VALUES, PRODUCT_TYPE_LABELS);
export const LIFECYCLE_STAGE_OPTIONS = optionsFrom(LIFECYCLE_STAGE_VALUES, LIFECYCLE_STAGE_LABELS);
export const SOURCING_MODEL_OPTIONS = optionsFrom(SOURCING_MODEL_VALUES, SOURCING_MODEL_LABELS);
export const DOMESTIC_EXPORT_CLASSIFICATION_OPTIONS = optionsFrom(
  DOMESTIC_EXPORT_CLASSIFICATION_VALUES,
  DOMESTIC_EXPORT_CLASSIFICATION_LABELS,
);
export const FIGURE_SOURCE_OPTIONS = optionsFrom(FIGURE_SOURCE_VALUES, FIGURE_SOURCE_LABELS);
export const OFFERING_COMMERCIAL_STATUS_OPTIONS = optionsFrom(
  OFFERING_COMMERCIAL_STATUS_VALUES,
  OFFERING_COMMERCIAL_STATUS_LABELS,
);
export const DISCLOSURE_CONSENT_OPTIONS = optionsFrom(
  DISCLOSURE_CONSENT_VALUES,
  DISCLOSURE_CONSENT_LABELS,
);
export const SALES_CHANNEL_TYPE_OPTIONS = optionsFrom(
  SALES_CHANNEL_TYPE_VALUES,
  SALES_CHANNEL_TYPE_LABELS,
);
export const GEOGRAPHIC_SCOPE_OPTIONS = optionsFrom(
  GEOGRAPHIC_SCOPE_VALUES,
  GEOGRAPHIC_SCOPE_LABELS,
);
export const ORDER_BOOK_SECURITY_OPTIONS = optionsFrom(
  ORDER_BOOK_SECURITY_VALUES,
  ORDER_BOOK_SECURITY_LABELS,
);
export const INPUT_CATEGORY_OPTIONS = optionsFrom(INPUT_CATEGORY_VALUES, INPUT_CATEGORY_LABELS);
export const PROCUREMENT_MODEL_OPTIONS = optionsFrom(
  PROCUREMENT_MODEL_VALUES,
  PROCUREMENT_MODEL_LABELS,
);
export const PRODUCTION_MODEL_OPTIONS = optionsFrom(
  PRODUCTION_MODEL_VALUES,
  PRODUCTION_MODEL_LABELS,
);
export const LOGISTICS_MODEL_OPTIONS = optionsFrom(LOGISTICS_MODEL_VALUES, LOGISTICS_MODEL_LABELS);
export const FACILITY_TYPE_OPTIONS = optionsFrom(FACILITY_TYPE_VALUES, FACILITY_TYPE_LABELS);
export const FACILITY_TENURE_OPTIONS = optionsFrom(FACILITY_TENURE_VALUES, FACILITY_TENURE_LABELS);
export const FACILITY_STATUS_OPTIONS = optionsFrom(FACILITY_STATUS_VALUES, FACILITY_STATUS_LABELS);
export const CAPACITY_METRIC_UNIT_OPTIONS = optionsFrom(
  CAPACITY_METRIC_UNIT_VALUES,
  CAPACITY_METRIC_UNIT_LABELS,
);
export const PLANNED_CAPACITY_STATUS_OPTIONS = optionsFrom(
  PLANNED_CAPACITY_STATUS_VALUES,
  PLANNED_CAPACITY_STATUS_LABELS,
);
export const PROCESS_EXECUTION_OPTIONS = optionsFrom(
  PROCESS_EXECUTION_VALUES,
  PROCESS_EXECUTION_LABELS,
);
export const TECHNOLOGY_OWNERSHIP_OPTIONS = optionsFrom(
  TECHNOLOGY_OWNERSHIP_VALUES,
  TECHNOLOGY_OWNERSHIP_LABELS,
);
export const AUTOMATION_LEVEL_OPTIONS = optionsFrom(
  AUTOMATION_LEVEL_VALUES,
  AUTOMATION_LEVEL_LABELS,
);
export const HOSTING_MODEL_OPTIONS = optionsFrom(HOSTING_MODEL_VALUES, HOSTING_MODEL_LABELS);
export const EQUIPMENT_TENURE_OPTIONS = optionsFrom(
  EQUIPMENT_TENURE_VALUES,
  EQUIPMENT_TENURE_LABELS,
);
export const EQUIPMENT_ORIGIN_OPTIONS = optionsFrom(
  EQUIPMENT_ORIGIN_VALUES,
  EQUIPMENT_ORIGIN_LABELS,
);
export const EQUIPMENT_STATUS_OPTIONS = optionsFrom(
  EQUIPMENT_STATUS_VALUES,
  EQUIPMENT_STATUS_LABELS,
);
export const CERTIFICATION_RENEWAL_STATUS_OPTIONS = optionsFrom(
  CERTIFICATION_RENEWAL_STATUS_VALUES,
  CERTIFICATION_RENEWAL_STATUS_LABELS,
);
export const RD_DELIVERY_MODEL_OPTIONS = optionsFrom(
  RD_DELIVERY_MODEL_VALUES,
  RD_DELIVERY_MODEL_LABELS,
);
export const IP_TYPE_OPTIONS = optionsFrom(IP_TYPE_VALUES, IP_TYPE_LABELS);
export const IP_STATUS_OPTIONS = optionsFrom(IP_STATUS_VALUES, IP_STATUS_LABELS);
export const IP_OWNERSHIP_MODEL_OPTIONS = optionsFrom(
  IP_OWNERSHIP_MODEL_VALUES,
  IP_OWNERSHIP_MODEL_LABELS,
);
export const MATERIALITY_STATUS_OPTIONS = optionsFrom(
  MATERIALITY_STATUS_VALUES,
  MATERIALITY_STATUS_LABELS,
);
export const COLLABORATION_NATURE_OPTIONS = optionsFrom(
  COLLABORATION_NATURE_VALUES,
  COLLABORATION_NATURE_LABELS,
);
export const INSURANCE_POLICY_TYPE_OPTIONS = optionsFrom(
  INSURANCE_POLICY_TYPE_VALUES,
  INSURANCE_POLICY_TYPE_LABELS,
);
export const STRATEGY_CATEGORY_OPTIONS = optionsFrom(
  STRATEGY_CATEGORY_VALUES,
  STRATEGY_CATEGORY_LABELS,
);
export const STRATEGY_TIME_HORIZON_OPTIONS = optionsFrom(
  STRATEGY_TIME_HORIZON_VALUES,
  STRATEGY_TIME_HORIZON_LABELS,
);
export const STRATEGY_STATUS_OPTIONS = optionsFrom(STRATEGY_STATUS_VALUES, STRATEGY_STATUS_LABELS);
export const DEPENDENCY_TYPE_OPTIONS = optionsFrom(DEPENDENCY_TYPE_VALUES, DEPENDENCY_TYPE_LABELS);
export const PROFESSIONAL_REVIEW_STATUS_OPTIONS = optionsFrom(
  PROFESSIONAL_REVIEW_STATUS_VALUES,
  PROFESSIONAL_REVIEW_STATUS_LABELS,
);
export const SOURCE_STATUS_OPTIONS = optionsFrom(SOURCE_STATUS_VALUES, SOURCE_STATUS_LABELS);
export const DOMESTIC_OR_IMPORTED_OPTIONS = optionsFrom(
  ['domestic', 'imported', 'both', 'unknown'],
  DOMESTIC_OR_IMPORTED_LABELS,
);
export const OFFERING_CHANGE_TYPE_OPTIONS = optionsFrom(
  ['launch', 'discontinuation', 'other'],
  OFFERING_CHANGE_TYPE_LABELS,
);

export const BUSINESS_OPERATIONS_CONFIRMATION_FIELDS: Array<{
  key: keyof BusinessOperationsConfirmations;
  label: string;
}> = [
  {
    key: 'allMaterialActivitiesDisclosed',
    label: 'All material business activities are disclosed',
  },
  {
    key: 'productsAndServicesAreComplete',
    label: 'The products and services register is complete',
  },
  {
    key: 'revenueMixReconciles',
    label: 'Revenue mix figures reconcile approximately to 100% by year',
  },
  {
    key: 'customerConcentrationIsComplete',
    label: 'Customer concentration information is complete',
  },
  {
    key: 'supplierConcentrationIsComplete',
    label: 'Supplier concentration information is complete',
  },
  {
    key: 'allFacilitiesAreIncluded',
    label: 'All material facilities are included',
  },
  {
    key: 'capacityUnitsAndFiguresAreConsistent',
    label: 'Capacity units and figures are consistent across periods',
  },
  {
    key: 'outsourcedOperationsAreDisclosed',
    label: 'Outsourced and third-party operations are disclosed',
  },
  {
    key: 'technologyAndIpDependenciesAreDisclosed',
    label: 'Technology and intellectual-property dependencies are disclosed',
  },
  {
    key: 'qualityIncidentsAndRecallsAreDisclosed',
    label: 'Quality incidents and recalls are disclosed',
  },
  {
    key: 'insuranceAndContinuityInformationIsComplete',
    label: 'Insurance and continuity information is complete',
  },
  {
    key: 'strengthClaimsHaveSupportingSources',
    label: 'Competitive strength claims have supporting sources',
  },
  {
    key: 'strategiesContainNoUnsupportedProjections',
    label: 'Strategies contain no unsupported revenue or profit projections',
  },
  {
    key: 'professionalReviewRemainsRequired',
    label: 'Professional review of this workstream remains required',
  },
];
