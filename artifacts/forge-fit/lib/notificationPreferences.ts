export type NotificationPreferenceKey = 'workoutReminder' | 'waterReminder' | 'mealReminder' | 'coachCheckIn' | 'weeklySummary';
export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const notificationPreferenceKeys: NotificationPreferenceKey[] = ['workoutReminder', 'waterReminder', 'mealReminder', 'coachCheckIn', 'weeklySummary'];

/** Restores saved reminder choices over the defaults, ignoring anything that is not a boolean. */
export function restoreNotificationPreferences(stored: unknown, defaults: NotificationPreferences): NotificationPreferences {
  const restored = { ...defaults };
  if (!stored || typeof stored !== 'object') return restored;
  for (const key of notificationPreferenceKeys) {
    const value = (stored as Record<string, unknown>)[key];
    if (typeof value === 'boolean') restored[key] = value;
  }
  return restored;
}

export function countEnabledNotifications(preferences: NotificationPreferences) {
  return notificationPreferenceKeys.filter((key) => preferences[key]).length;
}
