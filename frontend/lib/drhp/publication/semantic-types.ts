/** Semantic display types — mirrors backend export/semantic_types.py */

const QUANTITATIVE_TYPES = new Set([
  'currency_inr',
  'currency',
  'inr',
  'rupee',
  'currency_lakh',
  'lakh',
  'currency_crore',
  'crore',
  'share_count',
  'shares',
  'integer',
  'decimal',
  'percentage',
  'ratio',
  'financial_value',
]);

const IDENTIFIER_TYPES = new Set([
  'telephone',
  'phone',
  'cin',
  'din',
  'pan',
  'srn',
  'gstin',
  'registration_number',
  'licence_number',
  'license_number',
  'application_number',
  'filing_reference',
  'case_number',
  'contract_reference',
  'identifier',
  'plain_text',
  'entity_name',
]);

const HEADER_RULES: Array<[string[], string]> = [
  [['share', 'no. of shares', 'number of shares'], 'share_count'],
  [['amount', '₹', 'rupee', 'in lakhs'], 'currency_inr'],
  [['percentage', 'percent', '%'], 'percentage'],
  [['telephone', 'phone', 'mobile'], 'telephone'],
  [['din'], 'din'],
  [['cin'], 'cin'],
  [['pan'], 'pan'],
  [['gstin'], 'gstin'],
  [['party', 'parties', 'counterparty'], 'entity_name'],
  [['fy ', 'financial year', 'year ended'], 'financial_period'],
];

export function isQuantitative(semanticType?: string | null): boolean {
  return Boolean(semanticType && QUANTITATIVE_TYPES.has(semanticType.toLowerCase()));
}

export function isIdentifier(semanticType?: string | null): boolean {
  return Boolean(semanticType && IDENTIFIER_TYPES.has(semanticType.toLowerCase()));
}

export function inferSemanticTypeFromHeader(header: string): string | null {
  const lowered = header.trim().toLowerCase();
  if (!lowered) return null;
  for (const [hints, semanticType] of HEADER_RULES) {
    if (hints.some((hint) => lowered.includes(hint))) return semanticType;
  }
  if (['particular', 'description', 'name', 'nature', 'term', 'meaning'].some((h) => lowered.includes(h))) {
    return 'plain_text';
  }
  return null;
}

export function inferColumnSemanticTypes(headers: string[]): Array<string | null> {
  return headers.map((header) => inferSemanticTypeFromHeader(header));
}
