/**
 * Demo-only feature flags for Nivara sample data actions.
 *
 * Set NEXT_PUBLIC_ENABLE_NIVARA_SAMPLE_DATA=true to show "Use Nivara sample data"
 * on workstream Information tabs. Defaults to enabled in development.
 */

export function isNivaraSampleDataEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_ENABLE_NIVARA_SAMPLE_DATA;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV === 'development';
}

export const NIVARA_SAMPLE_CONFIRM_MESSAGE =
  'Replace your current unsaved changes with Nivara sample data?';
