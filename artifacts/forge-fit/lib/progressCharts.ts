/** One completed exercise, stamped with the day it was done, so progress can be charted over time. */
export type ActivityEntry = {
  id: string;
  date: string;
  workoutId: string;
  exerciseId: string;
  minutes: number;
  calories: number;
};

export type ChartPoint = { date: string; value: number };

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toDayKey(value: string | undefined, fallback: Date) {
  if (!value) return dayKey(fallback);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value.slice(0, 10) : dayKey(parsed);
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/** The last `days` calendar days ending today, oldest first. */
export function lastDays(days: number, now = new Date()) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - index), 12);
    return dayKey(date);
  });
}

export function restoreActivityLog(value: unknown): ActivityEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ActivityEntry => (
    Boolean(item)
    && typeof item === 'object'
    && typeof item.id === 'string'
    && typeof item.date === 'string'
    && typeof item.workoutId === 'string'
    && typeof item.exerciseId === 'string'
    && Number.isFinite(item.minutes)
    && Number.isFinite(item.calories)
  ));
}

/** Records exercises finished today. An exercise already logged today is not counted twice. */
export function logCompletedExercises(
  log: ActivityEntry[],
  completed: { workoutId: string; exerciseId: string; minutes: number; calories: number }[],
  now = new Date(),
) {
  const today = dayKey(now);
  const fresh = completed.filter((item) => !log.some((entry) => entry.date === today && entry.workoutId === item.workoutId && entry.exerciseId === item.exerciseId));
  if (!fresh.length) return log;
  return [...log, ...fresh.map((item) => ({
    ...item,
    id: `${today}:${item.workoutId}:${item.exerciseId}`,
    date: today,
    minutes: Math.max(0, item.minutes),
    calories: Math.max(0, Math.round(item.calories)),
  }))];
}

/** Undoes today's record when an exercise is unchecked; earlier days are history and stay. */
export function unlogExercises(log: ActivityEntry[], workoutId: string, exerciseIds: string[], now = new Date()) {
  const today = dayKey(now);
  const next = log.filter((entry) => !(entry.date === today && entry.workoutId === workoutId && exerciseIds.includes(entry.exerciseId)));
  return next.length === log.length ? log : next;
}

/** Minutes and calories per day over the last `days` days, zero-filled. */
export function dailyActivity(log: ActivityEntry[], days: number, now = new Date()) {
  const totals = new Map<string, { minutes: number; calories: number }>();
  log.forEach((entry) => {
    const current = totals.get(entry.date) ?? { minutes: 0, calories: 0 };
    totals.set(entry.date, { minutes: current.minutes + entry.minutes, calories: current.calories + entry.calories });
  });
  return lastDays(days, now).map((date) => ({
    date,
    minutes: Math.round(totals.get(date)?.minutes ?? 0),
    calories: Math.round(totals.get(date)?.calories ?? 0),
  }));
}

/**
 * Body weight since the start: the onboarding weight on the registration day, then the last
 * entry of each logged day. `change` is current minus start (negative means weight lost).
 */
export function bodyWeightSeries({
  startWeight,
  registeredAt,
  weightLogs,
  now = new Date(),
}: {
  startWeight: number | null | undefined;
  registeredAt: string | null | undefined;
  weightLogs: { value: number; date: string }[];
  now?: Date;
}) {
  const byDay = new Map<string, number>();
  [...weightLogs]
    .filter((item) => Number.isFinite(item.value) && item.value > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((item) => byDay.set(toDayKey(item.date, now), item.value));
  const startDay = registeredAt ? toDayKey(registeredAt, now) : null;
  if (startWeight && startWeight > 0 && startDay && ![...byDay.keys()].some((date) => date <= startDay)) {
    byDay.set(startDay, startWeight);
  }
  const points: ChartPoint[] = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value: round1(value) }));
  const start = points[0]?.value ?? (startWeight || null);
  const current = points.at(-1)?.value ?? (startWeight || null);
  return { points, start, current, change: start !== null && current !== null ? round1(current - start) : null };
}

/** Heaviest dumbbell used on each day, starting from the onboarding dumbbell weight. */
export function liftedWeightSeries({
  history,
  startWeightKg,
  registeredAt,
  now = new Date(),
}: {
  history: { weightKg: number; date: string }[];
  startWeightKg?: number | null;
  registeredAt?: string | null;
  now?: Date;
}) {
  const byDay = new Map<string, number>();
  history.forEach((item) => {
    if (!Number.isFinite(item.weightKg) || item.weightKg <= 0) return;
    const date = toDayKey(item.date, now);
    byDay.set(date, Math.max(byDay.get(date) ?? 0, item.weightKg));
  });
  const startDay = registeredAt ? toDayKey(registeredAt, now) : null;
  if (startWeightKg && startWeightKg > 0 && startDay && ![...byDay.keys()].some((date) => date <= startDay)) {
    byDay.set(startDay, startWeightKg);
  }
  const points: ChartPoint[] = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value: round1(value) }));
  const start = points[0]?.value ?? null;
  const best = points.length ? Math.max(...points.map((point) => point.value)) : null;
  return { points, start, best, increase: start !== null && best !== null ? round1(best - start) : null };
}

export type AdherenceDay = { date: string; eaten: number; status: 'on' | 'under' | 'over' | 'none' };

/** Within ±20% of the calorie goal counts as on target (same rule as the weekly summary). */
export function calorieAdherence(meals: { calories: number; date?: string }[], calorieGoal: number | null, days: number, now = new Date()) {
  const eaten = new Map<string, number>();
  meals.forEach((meal) => {
    const date = toDayKey(meal.date, now);
    eaten.set(date, (eaten.get(date) ?? 0) + (Number.isFinite(meal.calories) ? meal.calories : 0));
  });
  const series: AdherenceDay[] = lastDays(days, now).map((date) => {
    const total = Math.round(eaten.get(date) ?? 0);
    if (!total || !calorieGoal) return { date, eaten: total, status: 'none' };
    if (total < calorieGoal * 0.8) return { date, eaten: total, status: 'under' };
    if (total > calorieGoal * 1.2) return { date, eaten: total, status: 'over' };
    return { date, eaten: total, status: 'on' };
  });
  const tracked = series.filter((day) => day.status !== 'none').length;
  const onTarget = series.filter((day) => day.status === 'on').length;
  return { series, tracked, onTarget, rate: tracked ? Math.round((onTarget / tracked) * 100) : null };
}
