import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { formatWorkoutReminder, Language, translate } from '@/lib/i18n';
import type { Profile, Workout } from '@/context/FitContext';
import { DAILY_MOOD_NOTIFICATION_HOUR, DAILY_MOOD_NOTIFICATION_MINUTE } from '@/lib/dailyMood';

export type NotificationSettings = {
  workoutReminder: boolean;
  waterReminder: boolean;
  mealReminder: boolean;
  coachCheckIn: boolean;
  weeklySummary: boolean;
};

export type NotificationSettingKey = keyof NotificationSettings;

const CHANNEL_ID = 'forge-fit-reminders';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const dayToWeekday: Record<string, number> = {
  SUN: 1,
  MON: 2,
  TUE: 3,
  WED: 4,
  THU: 5,
  FRI: 6,
  SAT: 7,
};

async function prepareNotifications() {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'GainMode reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: undefined,
    });
  }
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.granted;
}

export async function requestNotificationPermission() {
  if (Platform.OS === 'web') return true;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function hasNotificationPermission() {
  if (Platform.OS === 'web') return true;
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.granted;
}

function content(language: Language, titleKey: Parameters<typeof translate>[1], bodyKey: Parameters<typeof translate>[1]) {
  const isDailyMood = titleKey === 'notificationDailyMoodTitle';
  return {
    title: translate(language, titleKey),
    body: translate(language, bodyKey),
    sound: 'default' as const,
    data: { source: isDailyMood ? 'forge-fit-daily-mood' : 'forge-fit-reminder' },
  };
}

async function scheduleDaily(language: Language, titleKey: Parameters<typeof translate>[1], bodyKey: Parameters<typeof translate>[1], hour: number, minute = 0) {
  await Notifications.scheduleNotificationAsync({
    content: content(language, titleKey, bodyKey),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, channelId: CHANNEL_ID, hour, minute },
  });
}

async function scheduleWeekly(language: Language, titleKey: Parameters<typeof translate>[1], bodyKey: Parameters<typeof translate>[1], weekday: number, hour: number, minute = 0) {
  await Notifications.scheduleNotificationAsync({
    content: content(language, titleKey, bodyKey),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, channelId: CHANNEL_ID, weekday, hour, minute },
  });
}

async function scheduleWorkoutReminder(language: Language, workout: Workout, weekday: number) {
  const workoutName = translate(language, workout.name as Parameters<typeof translate>[1]) || workout.name;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: translate(language, 'notificationWorkoutTitle'),
      body: formatWorkoutReminder(language, workoutName, workout.duration),
      sound: 'default',
      data: { source: 'forge-fit-workout', workoutDay: workout.day },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, channelId: CHANNEL_ID, weekday, hour: 9, minute: 0 },
  });
}

let notificationSync = Promise.resolve();

async function syncFitnessNotificationsNow({
  settings,
  profile,
  workouts,
  language,
}: {
  settings: NotificationSettings;
  profile: Profile | null;
  workouts: Workout[];
  language: Language;
}) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!(await requestNotificationPermission())) return;
  if (!(await prepareNotifications())) return;

  if (settings.workoutReminder && profile) {
    await Promise.all(workouts.map((workout) => {
      const weekday = dayToWeekday[workout.day];
      return weekday ? scheduleWorkoutReminder(language, workout, weekday) : Promise.resolve();
    }));
  }
  if (settings.waterReminder) {
    await Promise.all([10, 13, 16, 19].map((hour) => scheduleDaily(language, 'notificationWaterTitle', 'notificationWaterBody', hour)));
  }
  if (settings.mealReminder) {
    await Promise.all([
      scheduleDaily(language, 'notificationBreakfastTitle', 'notificationBreakfastBody', 9),
      scheduleDaily(language, 'notificationLunchTitle', 'notificationLunchBody', 13),
      scheduleDaily(language, 'notificationDinnerTitle', 'notificationDinnerBody', 19),
    ]);
  }
  if (settings.coachCheckIn) {
    await scheduleDaily(language, 'notificationCoachTitle', 'notificationCoachBody', 20);
  }
  await scheduleDaily(language, 'notificationDailyMoodTitle', 'notificationDailyMoodBody', DAILY_MOOD_NOTIFICATION_HOUR, DAILY_MOOD_NOTIFICATION_MINUTE);
  if (settings.weeklySummary) {
    await scheduleWeekly(language, 'notificationSummaryTitle', 'notificationSummaryBody', 1, 18);
  }
}

export function syncFitnessNotifications(args: {
  settings: NotificationSettings;
  profile: Profile | null;
  workouts: Workout[];
  language: Language;
}) {
  const nextSync = notificationSync.catch(() => undefined).then(() => syncFitnessNotificationsNow(args));
  notificationSync = nextSync.catch(() => undefined);
  return nextSync;
}