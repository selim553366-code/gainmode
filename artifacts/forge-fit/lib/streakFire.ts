export type FireTier = 'none' | 'spark' | 'blaze' | 'inferno' | 'legend';

/** Days at which the streak fire grows and changes colour. */
export const FIRE_MILESTONES = [10, 50, 100] as const;

export function fireTier(days: number): FireTier {
  if (days <= 0) return 'none';
  if (days >= 100) return 'legend';
  if (days >= 50) return 'inferno';
  if (days >= 10) return 'blaze';
  return 'spark';
}

/** Days left until the next milestone, or null once the largest fire is reached. */
export function daysToNextFire(days: number) {
  const next = FIRE_MILESTONES.find((milestone) => days < milestone);
  return next === undefined ? null : next - Math.max(0, days);
}

/** Progress (0–1) from the previous milestone to the next one. */
export function fireTierProgress(days: number) {
  const next = FIRE_MILESTONES.find((milestone) => days < milestone);
  if (next === undefined) return 1;
  const previous = [...FIRE_MILESTONES].reverse().find((milestone) => days >= milestone) ?? 0;
  return Math.max(0, Math.min(1, (days - previous) / (next - previous)));
}

/**
 * Flame size: grows a little every day inside a tier and jumps at each milestone,
 * so day 10, 50 and 100 are visibly bigger fires.
 */
export function fireScale(days: number) {
  const tier = fireTier(days);
  if (tier === 'none') return 0;
  const base = { spark: 0.55, blaze: 0.74, inferno: 0.88, legend: 1 }[tier];
  const growth = { spark: 0.1, blaze: 0.1, inferno: 0.08, legend: 0 }[tier];
  return Math.round((base + growth * fireTierProgress(days)) * 1000) / 1000;
}
