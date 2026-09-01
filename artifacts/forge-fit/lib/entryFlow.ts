export type EntryRoute = 'onboarding' | 'intro' | 'premium' | 'coach' | 'tabs';

export function getEntryRoute({
  onboardingComplete,
  introSeen,
  isPremium,
  subscriptionPurchaseEnabled,
  coachIntroPending,
}: {
  onboardingComplete: boolean;
  introSeen: boolean;
  isPremium: boolean;
  subscriptionPurchaseEnabled: boolean;
  coachIntroPending: boolean;
}): EntryRoute {
  if (!onboardingComplete) return 'onboarding';
  if (!introSeen) return 'intro';
  if (!isPremium && subscriptionPurchaseEnabled) return 'premium';
  return coachIntroPending ? 'coach' : 'tabs';
}