function isEmptyish(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

/**
 * Structural equality for the plain JSON values held in workstream payloads.
 * Used to decide whether a section really differs from the last persisted copy,
 * so a field event that re-sends an identical value never counts as a change.
 *
 * Treats missing keys, undefined, null, and empty string as equivalent at each
 * leaf so API-normalized payloads do not appear dirty against form defaults.
 */
export function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (isEmptyish(a) && isEmptyish(b)) return true;
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
  const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);

  for (const key of allKeys) {
    const leftHas = Object.prototype.hasOwnProperty.call(left, key);
    const rightHas = Object.prototype.hasOwnProperty.call(right, key);
    const leftValue = leftHas ? left[key] : undefined;
    const rightValue = rightHas ? right[key] : undefined;

    if (!isDeepEqual(leftValue, rightValue)) return false;
  }

  return true;
}
