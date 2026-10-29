export function canRestoreFitStateVersion(storedVersion: unknown, currentVersion: number): boolean {
  return typeof storedVersion === 'number'
    && Number.isInteger(storedVersion)
    && storedVersion >= 0
    && storedVersion <= currentVersion;
}

export function mergePersistedFitState<T extends { version: number }>(initialState: T, storedState: Partial<T>): T {
  return { ...initialState, ...storedState, version: initialState.version };
}
