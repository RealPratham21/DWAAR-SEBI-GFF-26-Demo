/** Indian States and Union Territories for incorporation / office address selects. */
export const INDIAN_STATES_AND_UTS = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export type IndianStateOrUt = (typeof INDIAN_STATES_AND_UTS)[number];

/** MCA Registrar of Companies jurisdictions (includes fallback option). */
export const REGISTRAR_OF_COMPANIES_OPTIONS = [
  'Registrar of Companies, Ahmedabad',
  'Registrar of Companies, Bangalore',
  'Registrar of Companies, Chandigarh',
  'Registrar of Companies, Chennai',
  'Registrar of Companies, Coimbatore',
  'Registrar of Companies, Cuttack',
  'Registrar of Companies, Delhi',
  'Registrar of Companies, Ernakulam',
  'Registrar of Companies, Goa',
  'Registrar of Companies, Gwalior',
  'Registrar of Companies, Guwahati',
  'Registrar of Companies, Hyderabad',
  'Registrar of Companies, Jaipur',
  'Registrar of Companies, Kanpur',
  'Registrar of Companies, Kolkata',
  'Registrar of Companies, Mumbai',
  'Registrar of Companies, Patna',
  'Registrar of Companies, Pune',
  'Registrar of Companies, Ranchi',
  'Registrar of Companies, Shillong',
  'Registrar of Companies, Vijayawada',
  'Other / Not listed',
] as const;

export type RegistrarOfCompaniesOption = (typeof REGISTRAR_OF_COMPANIES_OPTIONS)[number];

export const COMPANY_CATEGORY_VALUES = [
  'company-limited-by-shares',
  'company-limited-by-guarantee',
  'unlimited-company',
] as const;

export const COMPANY_SUB_CATEGORY_VALUES = [
  'non-government-company',
  'union-government-company',
  'state-government-company',
  'subsidiary-of-foreign-company',
  'other',
] as const;

export const COMPANY_STATUS_VALUES = [
  'active',
  'dormant',
  'under-process-of-striking-off',
  'struck-off',
  'amalgamated',
  'under-liquidation',
  'liquidated',
  'other',
] as const;

export const GOVERNING_ACT_VALUES = [
  'companies-act-2013',
  'companies-act-1956',
  'companies-act-1913',
  'other-predecessor-legislation',
] as const;

export const SPECIAL_COMPANY_TYPE_VALUES = [
  'none',
  'one-person-company',
  'section-8-company',
  'producer-company',
  'nidhi-company',
  'other',
] as const;

export const CORPORATE_EVENT_STATUS_VALUES = [
  'planned',
  'resolution-passed',
  'filed',
  'approved',
  'effective',
] as const;

export type CompanyCategory = (typeof COMPANY_CATEGORY_VALUES)[number];
export type CompanySubCategory = (typeof COMPANY_SUB_CATEGORY_VALUES)[number];
export type CompanyStatus = (typeof COMPANY_STATUS_VALUES)[number];
export type GoverningAct = (typeof GOVERNING_ACT_VALUES)[number];
export type SpecialCompanyType = (typeof SPECIAL_COMPANY_TYPE_VALUES)[number];
export type CorporateEventStatus = (typeof CORPORATE_EVENT_STATUS_VALUES)[number];
