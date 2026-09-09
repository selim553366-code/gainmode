export const WEEKLY_ANALYSIS_WAIT_MS = 7 * 24 * 60 * 60 * 1000;

export function isWeeklyAnalysisUnlocked(registeredAt: string | null | undefined, now = Date.now()) {
  if (!registeredAt) return false;
  const registeredTime = Date.parse(registeredAt);
  return Number.isFinite(registeredTime) && now - registeredTime >= WEEKLY_ANALYSIS_WAIT_MS;
}

export function daysUntilWeeklyAnalysis(registeredAt: string | null | undefined, now = Date.now()) {
  if (!registeredAt) return 7;
  const registeredTime = Date.parse(registeredAt);
  if (!Number.isFinite(registeredTime)) return 7;
  return Math.max(0, Math.ceil((registeredTime + WEEKLY_ANALYSIS_WAIT_MS - now) / (24 * 60 * 60 * 1000)));
}