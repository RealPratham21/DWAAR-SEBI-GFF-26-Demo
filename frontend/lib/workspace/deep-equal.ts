/**
 * Structural equality for the plain JSON values held in workstream payloads.
 * Used to decide whether a section really differs from the last persisted copy,
 * so a field event that re-sends an identical value never counts as a change.
 */
export function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;

  const aIsArray = Array.isArray(a);
  if (aIsArray !== Array.isArray(b)) return false;

  if (aIsArray) {
    const left = a as unknown[];
    const right = b as unknown[];
    if (left.length !== right.length) return false;
    return left.every((item, index) => isDeepEqual(item, right[index]));
  }

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const leftKeys = Object.keys(left);
  if (leftKeys.length !== Object.keys(right).length) return false;
  return leftKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(right, key) && isDeepEqual(left[key], right[key]),
  );
}
