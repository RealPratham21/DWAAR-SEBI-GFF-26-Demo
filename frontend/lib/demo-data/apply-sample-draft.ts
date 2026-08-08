/**
 * Shared helper to replace a workstream draft with Nivara sample data without persisting.
 */

export function applyWorkstreamSampleDraft<T>(
  sample: T,
  clonePayload: (payload: T) => T,
  setPayload: (payload: T) => void,
  clearSaveState: () => void,
): void {
  setPayload(clonePayload(sample));
  clearSaveState();
}
