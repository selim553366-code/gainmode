export const DAILY_MOOD_NOTIFICATION_HOUR = 19;
export const DAILY_MOOD_NOTIFICATION_MINUTE = 50;

export function isDailyMoodDue(date = new Date()) {
  return date.getHours() > DAILY_MOOD_NOTIFICATION_HOUR
    || (date.getHours() === DAILY_MOOD_NOTIFICATION_HOUR && date.getMinutes() >= DAILY_MOOD_NOTIFICATION_MINUTE);
}