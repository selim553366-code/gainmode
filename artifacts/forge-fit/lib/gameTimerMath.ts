/** Timing of the gaming-session timer. Pure, so it can be tested outside the app. */
export const GAME_TIMER_MIN_MINUTES = 15;
export const GAME_TIMER_MAX_MINUTES = 8 * 60;
export const GAME_TIMER_STEP_MINUTES = 15;
export const GAME_TIMER_PRESETS = [30, 60, 90, 120, 180];

/** Keeps a chosen length between 15 minutes and 8 hours, rounded to the 15-minute step. */
export function clampGameMinutes(minutes: number) {
  const stepped = Math.round(minutes / GAME_TIMER_STEP_MINUTES) * GAME_TIMER_STEP_MINUTES;
  return Math.min(GAME_TIMER_MAX_MINUTES, Math.max(GAME_TIMER_MIN_MINUTES, stepped));
}

/** Milliseconds left until `endsAt`; 0 once the session is over. */
export function gameTimeLeft(endsAt: number, now: number) {
  return Math.max(0, endsAt - now);
}

/** "1 h 30 min", "45 min" style length, with the unit words supplied by the caller. */
export function formatGameLength(minutes: number, hourUnit: string, minuteUnit: string) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} ${minuteUnit}`;
  return m ? `${h} ${hourUnit} ${m} ${minuteUnit}` : `${h} ${hourUnit}`;
}
