export const FACTS_TABLE_COLUMNS = [
  'Fact',
  'Information value',
  'Document evidence',
  'Comparison',
  'Review',
  'Evidence quality',
  'Sources',
  'Issues',
  'Action',
] as const;

export const FACTS_EMPTY_MESSAGE = 'No facts or evidence are available yet.';

export const FACTS_SUPPORTING_TEXT =
  'Facts are extracted from uploaded documents and compared with the Information you have entered. A document value is only treated as approved once a reviewer approves it here; agreement with Information on its own is not an approval, and nothing on this tab changes the Information section.';
