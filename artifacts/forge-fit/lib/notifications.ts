import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import type * as Notifications from 'expo-notifications';
import { formatWorkoutReminder, Language, translate } from '@/lib/i18n';
import type { Profile, Workout } from '@/context/FitContext';
import { DAILY_MOOD_NOTIFICATION_HOUR, DAILY_MOOD_NOTIFICATION_MINUTE } from '@/lib/dailyMood';
import { isWeeklyAnalysisUnlocked } from '@/lib/weeklyEligibility';

export type NotificationSettings = {
  workoutReminder: boolean;
  waterReminder: boolean;
  mealReminder: boolean;
  coachCheckIn: boolean;
  weeklySummary: boolean;
};

export type NotificationSettingKey = keyof NotificationSettings;

const CHANNEL_ID = 'forge-fit-reminders';
const isAndroidExpoGo = Platform.OS === 'android' && isRunningInExpoGo();
export const notificationsSupported = Platform.OS !== 'web' && !isAndroidExpoGo;

type NotificationsModule = typeof import('expo-notifications');
type NotificationResponse = Notifications.NotificationResponse;

let notificationsModulePromise: Promise<NotificationsModule> | null = null;

function loadNotifications() {
  if (!notificationsSupported) return Promise.resolve(null);
  notificationsModulePromise ??= import('expo-notifications');
  return notificationsModulePromise;
}

if (notificationsSupported) {
  void loadNotifications().then((Notifications) => {
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  });
}

export function subscribeToNotificationResponses(onResponse: (response: NotificationResponse) => void) {
  if (!notificationsSupported) return () => undefined;

  let cancelled = false;
  let subscription: { remove: () => void } | null = null;
  void loadNotifications().then((Notifications) => {
    if (!Notifications || cancelled) return;
    subscription = Notifications.addNotificationResponseReceivedListener(onResponse);
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!cancelled && response) onResponse(response);
    }).catch(() => undefined);
  });

  return () => {
    cancelled = true;
    subscription?.remove();
  };
}

export function clearNotificationResponse() {
  if (!notificationsSupported) return;
  void loadNotifications().then((Notifications) => {
    void Notifications?.clearLastNotificationResponseAsync().catch(() => undefined);
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
  if (!notificationsSupported) return false;
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
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
  if (!notificationsSupported) return false;
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function hasNotificationPermission() {
  if (!notificationsSupported) return false;
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.granted;
}

function content(language: Language, titleKey: Parameters<typeof translate>[1], bodyKey: Parameters<typeof translate>[1]) {
  const source = titleKey === 'notificationDailyMoodTitle'
    ? 'forge-fit-daily-mood'
    : titleKey === 'notificationWorkoutTitle'
      ? 'forge-fit-workout'
      : titleKey === 'notificationCoachTitle'
        ? 'forge-fit-coach'
        : titleKey === 'notificationSummaryTitle' || titleKey === 'notificationWeightTitle'
          ? 'forge-fit-progress'
          : titleKey === 'notificationWaterTitle' || titleKey === 'notificationBreakfastTitle' || titleKey === 'notificationLunchTitle' || titleKey === 'notificationDinnerTitle'
            ? 'forge-fit-nutrition'
            : 'forge-fit-home';
  return {
    title: translate(language, titleKey),
    body: translate(language, bodyKey),
    sound: 'default' as const,
    data: { source },
  };
}

async function scheduleDaily(language: Language, titleKey: Parameters<typeof translate>[1], bodyKey: Parameters<typeof translate>[1], hour: number, minute = 0) {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: content(language, titleKey, bodyKey),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, channelId: CHANNEL_ID, hour, minute },
  });
}

async function scheduleWeekly(language: Language, titleKey: Parameters<typeof translate>[1], bodyKey: Parameters<typeof translate>[1], weekday: number, hour: number, minute = 0) {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: content(language, titleKey, bodyKey),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, channelId: CHANNEL_ID, weekday, hour, minute },
  });
}

async function scheduleWorkoutReminder(language: Language, workout: Workout, weekday: number) {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
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

async function scheduleWeightReminder(language: Language) {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: translate(language, 'notificationWeightTitle'),
      body: translate(language, 'notificationWeightBody'),
      sound: 'default',
      data: { source: 'forge-fit-progress' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10 * 24 * 60 * 60,
      repeats: true,
      channelId: CHANNEL_ID,
    },
  });
}

async function syncFitnessNotificationsNow({
  settings,
  profile,
  workouts,
  language,
  weightLogs,
  registeredAt,
  premiumActive,
}: {
  settings: NotificationSettings;
  profile: Profile | null;
  workouts: Workout[];
  language: Language;
  weightLogs: { date: string }[];
  registeredAt: string | null;
  premiumActive: boolean;
}) {
  if (!notificationsSupported) return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  // Clearing everything above also clears the trial reminder, so put it back while it is still due.
  await restoreTrialReminder();
  if (!premiumActive) return;
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
  if (settings.weeklySummary && isWeeklyAnalysisUnlocked(registeredAt)) {
    await scheduleWeekly(language, 'notificationSummaryTitle', 'notificationSummaryBody', 1, 18);
  }
  if (profile && weightLogs.length > 0) {
    await scheduleWeightReminder(language);
  }
}

export function syncFitnessNotifications(args: {
  settings: NotificationSettings;
  profile: Profile | null;
  workouts: Workout[];
  language: Language;
  weightLogs: { date: string }[];
  registeredAt: string | null;
  premiumActive: boolean;
}) {
  if (!notificationsSupported) return Promise.resolve();
  const nextSync = notificationSync.catch(() => undefined).then(() => syncFitnessNotificationsNow(args));
  notificationSync = nextSync.catch(() => undefined);
  return nextSync;
}

const TRIAL_REMINDER_KEY = 'gainmode-trial-reminder';
/** A day before the trial converts: the end of day 2 of a 3-day trial. */
export const TRIAL_REMINDER_AFTER_MS = 2 * 24 * 60 * 60 * 1000;

const TRIAL_REMINDER_COPY: Record<Language, { title: string; body: string }> = {
  tr: { title: 'Ücretsiz denemen yarın bitiyor', body: 'GainMode Access aboneliğin yarın başlıyor. Devam etmek istemezsen mağaza ayarlarından istediğin zaman iptal edebilirsin.' },
  en: { title: 'Your free trial ends tomorrow', body: 'Your GainMode Access subscription starts tomorrow. If you do not want to continue, you can cancel anytime in your store settings.' },
  de: { title: 'Dein Gratis-Test endet morgen', body: 'Dein GainMode Access-Abo beginnt morgen. Wenn du nicht weitermachen willst, kannst du es jederzeit in den Store-Einstellungen kündigen.' },
  fr: { title: 'Ton essai gratuit se termine demain', body: 'Ton abonnement GainMode Access commence demain. Si tu ne veux pas continuer, tu peux l’annuler à tout moment dans les réglages du store.' },
  es: { title: 'Tu prueba gratis termina mañana', body: 'Tu suscripción a GainMode Access empieza mañana. Si no quieres continuar, puedes cancelarla cuando quieras en los ajustes de la tienda.' },
};

async function scheduleTrialReminderAt(language: Language, fireAt: number) {
  const Notifications = await loadNotifications();
  if (!Notifications || fireAt <= Date.now()) return;
  if (!(await prepareNotifications())) return;
  const copy = TRIAL_REMINDER_COPY[language] ?? TRIAL_REMINDER_COPY.en;
  await Notifications.scheduleNotificationAsync({
    content: { title: copy.title, body: copy.body, sound: 'default', data: { source: 'forge-fit-home' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, channelId: CHANNEL_ID, date: new Date(fireAt) },
  });
}

/**
 * Reminds the person a day before their free trial turns into a paid subscription, as the
 * paywall promises. Asks for notification permission if needed; without it nothing is sent.
 */
export async function scheduleTrialReminder(language: Language, trialStartedAt = Date.now()) {
  if (!notificationsSupported) return false;
  const fireAt = trialStartedAt + TRIAL_REMINDER_AFTER_MS;
  try {
    await AsyncStorage.setItem(TRIAL_REMINDER_KEY, JSON.stringify({ fireAt, language }));
  } catch {
    // The reminder below still goes out; it just will not survive a later resync.
  }
  if (!(await requestNotificationPermission())) return false;
  await scheduleTrialReminderAt(language, fireAt);
  return true;
}

async function restoreTrialReminder() {
  try {
    const raw = await AsyncStorage.getItem(TRIAL_REMINDER_KEY);
    if (!raw) return;
    const { fireAt, language } = JSON.parse(raw) as { fireAt: number; language: Language };
    if (fireAt > Date.now()) await scheduleTrialReminderAt(language, fireAt);
    else await AsyncStorage.removeItem(TRIAL_REMINDER_KEY);
  } catch {
    // A broken record should not stop the other reminders.
  }
}

