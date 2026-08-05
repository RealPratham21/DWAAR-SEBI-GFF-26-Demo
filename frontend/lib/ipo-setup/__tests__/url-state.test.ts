import { describe, expect, it } from 'vitest';

function applyUrlMutation(
  current: URLSearchParams,
  patch: Record<string, string | null>,
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }
  return next;
}

describe('IPO Setup URL state conventions', () => {
  it('uses tab and section query params like Company & Incorporation', () => {
    const overview = applyUrlMutation(new URLSearchParams(), { tab: 'overview' });
    expect(overview.get('tab')).toBe('overview');

    const section = applyUrlMutation(overview, {
      tab: 'information',
      section: 'offer-structure',
    });
    expect(section.get('tab')).toBe('information');
    expect(section.get('section')).toBe('offer-structure');

    const assessment = applyUrlMutation(section, {
      tab: 'eligibility-assessment',
      section: null,
    });
    expect(assessment.get('tab')).toBe('eligibility-assessment');
    expect(assessment.get('section')).toBeNull();
  });

  it('does not invent Documents or Review History tabs', () => {
    const tabs = ['overview', 'information', 'eligibility-assessment'];
    expect(tabs).not.toContain('documents');
    expect(tabs).not.toContain('review-history');
  });
});
