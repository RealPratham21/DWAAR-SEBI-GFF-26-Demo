import { describe, expect, it } from 'vitest';
import { isDeepEqual } from '@/lib/workspace/deep-equal';

describe('isDeepEqual', () => {
  it('treats missing keys and undefined as equal', () => {
    expect(isDeepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(true);
    expect(isDeepEqual({ a: '' }, { a: undefined })).toBe(true);
    expect(isDeepEqual({ a: null }, { a: '' })).toBe(true);
  });

  it('compares nested objects with different key counts', () => {
    expect(
      isDeepEqual(
        { nested: { a: 'x', b: '' } },
        { nested: { a: 'x' } },
      ),
    ).toBe(true);
  });

  it('detects real value changes', () => {
    expect(isDeepEqual({ a: 'draft' }, { a: 'saved' })).toBe(false);
    expect(isDeepEqual([{ id: '1' }], [{ id: '2' }])).toBe(false);
  });
});
