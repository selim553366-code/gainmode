export type CoachAtmosphere = 'morning' | 'night';

/** Choose the coach's scene from the device's local time, independent of theme. */
export function getCoachAtmosphere(date = new Date()): CoachAtmosphere {
  const hour = date.getHours();
  return hour >= 18 || hour < 6 ? 'night' : 'morning';
}
