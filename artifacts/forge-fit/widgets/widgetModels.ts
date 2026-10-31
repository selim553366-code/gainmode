import type { Language } from '@/lib/i18n';
import { getCurrentStreak, getStreakCalendar } from '@/lib/streak';
import { badgeProgress, nextBadge, type BadgeMetrics } from '@/lib/badges';
import { quoteOfTheDay } from '@/lib/widgetQuotes';

export const GAINMODE_WIDGETS = [
  'TodayProgress',
  'Breathe',
  'Streak',
  'StartWorkout',
  'WeeklyConsistency',
  'Motivation',
  'NextGoal',
  'Performance',
  'GoodNight',
] as const;

export type GainModeWidgetName = (typeof GAINMODE_WIDGETS)[number];

type WidgetWorkout = {
  day?: string;
  name?: string;
  duration?: number;
  completed?: boolean;
  exercises?: { completed?: boolean }[];
};

export type WidgetSnapshot = {
  language: Language;
  workouts: WidgetWorkout[];
  activityLog: { date: string; minutes: number; calories: number }[];
  streakDates: string[];
  achievementStats: { workouts: number; minutes: number; exercises: number; meals: number; weightLogs: number };
  unlockedBadgeIds: string[];
  meals: { calories: number; date?: string }[];
  calorieGoal: number | null;
};

const languages: Language[] = ['tr', 'en', 'de', 'fr', 'es'];

export function parseWidgetSnapshot(value: string | null): WidgetSnapshot {
  let raw: Partial<WidgetSnapshot> = {};
  try {
    raw = value ? JSON.parse(value) as Partial<WidgetSnapshot> : {};
  } catch (error) {
    console.warn('Saved GainMode widget data could not be read.', error);
  }
  const language = languages.includes(raw.language as Language) ? raw.language as Language : 'tr';
  return {
    language,
    workouts: Array.isArray(raw.workouts) ? raw.workouts : [],
    activityLog: Array.isArray(raw.activityLog) ? raw.activityLog : [],
    streakDates: Array.isArray(raw.streakDates) ? raw.streakDates : [],
    achievementStats: {
      workouts: Number(raw.achievementStats?.workouts) || 0,
      minutes: Number(raw.achievementStats?.minutes) || 0,
      exercises: Number(raw.achievementStats?.exercises) || 0,
      meals: Number(raw.achievementStats?.meals) || 0,
      weightLogs: Number(raw.achievementStats?.weightLogs) || 0,
    },
    unlockedBadgeIds: Array.isArray(raw.unlockedBadgeIds) ? raw.unlockedBadgeIds : [],
    meals: Array.isArray(raw.meals) ? raw.meals : [],
    calorieGoal: Number.isFinite(raw.calorieGoal) ? Number(raw.calorieGoal) : null,
  };
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const weekdayKeys = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function createWidgetModel(snapshot: WidgetSnapshot, now = new Date()) {
  const today = dateKey(now);
  const todayIndex = now.getDay();
  const todayWorkout = snapshot.workouts.find((workout) => workout.day === weekdayKeys[now.getDay()]);
  const futureWorkouts = snapshot.workouts
    .filter((workout) => !workout.completed && weekdayKeys.includes(workout.day ?? ''))
    .sort((a, b) => {
      const distance = (workout: WidgetWorkout) => {
        const dayIndex = weekdayKeys.indexOf(workout.day ?? '');
        return (dayIndex - todayIndex + 7) % 7 || 7;
      };
      return distance(a) - distance(b);
    });
  const nextWorkout = todayWorkout ?? futureWorkouts[0] ?? null;
  const todayLog = snapshot.activityLog.filter((entry) => entry.date === today);
  const activeMinutes = Math.round(todayLog.reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0));
  const activeCalories = Math.round(todayLog.reduce((sum, entry) => sum + (Number(entry.calories) || 0), 0));
  const exerciseCount = todayWorkout?.exercises?.length ?? 0;
  const completedExercises = todayWorkout?.exercises?.filter((exercise) => exercise.completed).length ?? 0;
  const workoutProgress = exerciseCount ? completedExercises / exerciseCount : 0;
  const currentStreak = getCurrentStreak(snapshot.streakDates, now);
  const streakWeek = getStreakCalendar(snapshot.streakDates, now, 7);
  const metrics: BadgeMetrics = {
    ...snapshot.achievementStats,
    streak: currentStreak,
    activeDays: snapshot.streakDates.length,
    onTargetDays: 0,
  };
  const next = nextBadge(metrics, snapshot.unlockedBadgeIds);
  const currentWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 12);
  const previousWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 12);
  const currentWeekKey = dateKey(currentWeekStart);
  const previousWeekKey = dateKey(previousWeekStart);
  const currentWeekMinutes = snapshot.activityLog
    .filter((entry) => entry.date >= currentWeekKey && entry.date <= today)
    .reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0);
  const previousWeekMinutes = snapshot.activityLog
    .filter((entry) => entry.date >= previousWeekKey && entry.date < currentWeekKey)
    .reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0);
  const performanceChange = previousWeekMinutes > 0
    ? Math.round(((currentWeekMinutes - previousWeekMinutes) / previousWeekMinutes) * 100)
    : null;

  return {
    language: snapshot.language,
    todayWorkout,
    nextWorkout,
    activeMinutes,
    activeCalories,
    workoutProgress,
    completedExercises,
    exerciseCount,
    currentStreak,
    streakWeek,
    quote: quoteOfTheDay(snapshot.language, now),
    nextBadge: next,
    nextBadgeTitle: next ? next.title[snapshot.language] : '',
    nextBadgeProgress: next ? badgeProgress(next, metrics) : 1,
    performanceBars: streakWeek.map((day) => snapshot.activityLog
      .filter((entry) => entry.date === day.date)
      .reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0)),
    currentWeekMinutes: Math.round(currentWeekMinutes),
    performanceChange,
    isNight: now.getHours() >= 21 || now.getHours() < 6,
    localTime: now.toLocaleTimeString(snapshot.language, { hour: '2-digit', minute: '2-digit' }),
  };
}

export type WidgetModel = ReturnType<typeof createWidgetModel>;
