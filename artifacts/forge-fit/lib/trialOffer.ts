import AsyncStorage from '@react-native-async-storage/async-storage';

export { TRIAL_OFFER_WINDOW_MS, countdownParts, trialOfferRemaining } from '@/lib/trialCountdown';

/**
 * The free-trial offer shown right after onboarding lasts 15 minutes from the moment the paywall
 * first appears. The start time is stored, so reopening the app keeps counting down instead of
 * starting over, and once it runs out the offer is gone for good: the paywall then sells the
 * subscription without the trial.
 */
const STARTED_AT_KEY = 'gainmode-trial-offer-started-at';

/** When the offer started, starting it now if this is the first time the paywall is shown. */
export async function startTrialOfferWindow(now = Date.now()): Promise<number> {
  try {
    const stored = Number(await AsyncStorage.getItem(STARTED_AT_KEY));
    if (Number.isFinite(stored) && stored > 0) return stored;
    await AsyncStorage.setItem(STARTED_AT_KEY, String(now));
  } catch {
    // Without storage the offer still runs for this session.
  }
  return now;
}
