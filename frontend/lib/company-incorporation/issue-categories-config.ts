export const ISSUE_CATEGORIES = [
  { id: 'missing-information', label: 'Missing Information' },
  { id: 'missing-evidence', label: 'Missing Evidence' },
  { id: 'conflicting-value', label: 'Conflicting Value' },
  { id: 'pending-corporate-event', label: 'Pending Corporate Event' },
  { id: 'outdated-registration', label: 'Outdated Registration' },
  { id: 'legal-review-required', label: 'Legal Review Required' },
  { id: 'merchant-banker-judgement', label: 'Merchant Banker Judgement Required' },
] as const;

export type IssueCategoryId = (typeof ISSUE_CATEGORIES)[number]['id'];
