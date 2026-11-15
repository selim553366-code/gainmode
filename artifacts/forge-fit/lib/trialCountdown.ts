/** Timing of the 15-minute free-trial offer. Pure, so it can be tested outside the app. */
export const TRIAL_OFFER_WINDOW_MS = 15 * 60 * 1000;

/** Milliseconds left in the offer at `now`; 0 once it has ended. */
export function trialOfferRemaining(startedAt: number, now: number) {
  return Math.max(0, startedAt + TRIAL_OFFER_WINDOW_MS - now);
}

/** Splits a duration into the hours, minutes and seconds the countdown shows, rounding seconds up. */
export function countdownParts(ms: number) {
  const total = Math.ceil(ms / 1000);
  return { hours: Math.floor(total / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 };
}
