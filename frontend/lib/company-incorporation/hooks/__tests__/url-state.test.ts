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

describe('company incorporation URL state helpers', () => {
  it('supports tab=facts and tab=questions', () => {
    const facts = applyUrlMutation(new URLSearchParams('section=legal-identity'), {
      tab: 'facts',
      section: null,
    });
    expect(facts.get('tab')).toBe('facts');
    expect(facts.get('section')).toBeNull();

    const questions = applyUrlMutation(facts, { tab: 'questions' });
    expect(questions.get('tab')).toBe('questions');
  });

  it('opens assertion and issue detail params', () => {
    const withAssertion = applyUrlMutation(new URLSearchParams('tab=facts'), {
      assertionId: '11111111-1111-1111-1111-111111111111',
    });
    expect(withAssertion.get('assertionId')).toBe('11111111-1111-1111-1111-111111111111');

    const withIssue = applyUrlMutation(new URLSearchParams('tab=questions'), {
      issueId: '22222222-2222-2222-2222-222222222222',
    });
    expect(withIssue.get('issueId')).toBe('22222222-2222-2222-2222-222222222222');
  });

  it('closing a drawer removes only its detail parameter', () => {
    const params = new URLSearchParams(
      'tab=facts&assertionId=a1&documentVersionId=v1&foo=bar',
    );
    const closed = applyUrlMutation(params, { assertionId: null });
    expect(closed.get('assertionId')).toBeNull();
    expect(closed.get('documentVersionId')).toBe('v1');
    expect(closed.get('foo')).toBe('bar');
    expect(closed.get('tab')).toBe('facts');
  });

  it('preserves unrelated query parameters across tab changes', () => {
    const params = applyUrlMutation(new URLSearchParams('utm=demo&tab=information'), {
      tab: 'questions',
      issueId: 'i1',
    });
    expect(params.get('utm')).toBe('demo');
    expect(params.get('tab')).toBe('questions');
    expect(params.get('issueId')).toBe('i1');
  });
});
