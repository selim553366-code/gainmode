import assert from 'node:assert/strict';
import test from 'node:test';
import { bodyWeightSeries, calorieAdherence, dailyActivity, lastDays, liftedWeightSeries, logCompletedExercises, restoreActivityLog, unlogExercises } from '../lib/progressCharts.ts';

const now = new Date(2026, 9, 26, 15, 0);

test('lastDays ends today, oldest first', () => {
  assert.deepEqual(lastDays(3, now), ['2026-10-24', '2026-10-25', '2026-10-26']);
});

test('logs completed exercises once per day and undoes only today', () => {
  const item = { workoutId: 'w1', exerciseId: 'e1', minutes: 10, calories: 54.6 };
  const once = logCompletedExercises([], [item], now);
  assert.equal(once.length, 1);
  assert.equal(once[0].calories, 55);
  assert.equal(once[0].date, '2026-10-26');
  assert.equal(logCompletedExercises(once, [item], now), once);
  const yesterday = logCompletedExercises([], [item], new Date(2026, 9, 25, 9));
  const both = logCompletedExercises(yesterday, [item], now);
  assert.equal(both.length, 2);
  assert.deepEqual(unlogExercises(both, 'w1', ['e1'], now).map((entry) => entry.date), ['2026-10-25']);
});

test('daily activity sums per day and zero-fills', () => {
  const log = [
    { id: 'a', date: '2026-10-26', workoutId: 'w', exerciseId: 'a', minutes: 7.5, calories: 40 },
    { id: 'b', date: '2026-10-26', workoutId: 'w', exerciseId: 'b', minutes: 7.5, calories: 35 },
    { id: 'c', date: '2026-10-24', workoutId: 'w', exerciseId: 'c', minutes: 20, calories: 120 },
  ];
  assert.deepEqual(dailyActivity(log, 3, now), [
    { date: '2026-10-24', minutes: 20, calories: 120 },
    { date: '2026-10-25', minutes: 0, calories: 0 },
    { date: '2026-10-26', minutes: 15, calories: 75 },
  ]);
});

test('restoreActivityLog drops malformed entries', () => {
  assert.deepEqual(restoreActivityLog(null), []);
  assert.equal(restoreActivityLog([{ id: 'x' }, { id: 'a', date: '2026-10-26', workoutId: 'w', exerciseId: 'e', minutes: 3, calories: 9 }]).length, 1);
});

test('body weight starts at the onboarding weight and keeps the last entry per day', () => {
  const series = bodyWeightSeries({
    startWeight: 82,
    registeredAt: '2026-10-01T10:00:00.000Z',
    weightLogs: [
      { value: 81.4, date: '2026-10-10T08:00:00' },
      { value: 81, date: '2026-10-10T20:00:00' },
      { value: 79.6, date: '2026-10-25T08:00:00' },
    ],
    now,
  });
  assert.deepEqual(series.points.map((point) => point.value), [82, 81, 79.6]);
  assert.equal(series.change, -2.4);
});

test('body weight with no logs still reports the start', () => {
  const series = bodyWeightSeries({ startWeight: 70, registeredAt: '2026-10-20', weightLogs: [], now });
  assert.equal(series.points.length, 1);
  assert.equal(series.change, 0);
});

test('lifted weight keeps the heaviest load per day and measures the increase', () => {
  const series = liftedWeightSeries({
    history: [
      { weightKg: 8, date: '2026-10-05T10:00:00' },
      { weightKg: 10, date: '2026-10-05T10:20:00' },
      { weightKg: 12.5, date: '2026-10-19T10:00:00' },
    ],
    startWeightKg: 6,
    registeredAt: '2026-10-01',
    now,
  });
  assert.deepEqual(series.points.map((point) => point.value), [6, 10, 12.5]);
  assert.equal(series.increase, 6.5);
});

test('calorie adherence uses a ±20% band and ignores untracked days', () => {
  const meals = [
    { calories: 2000, date: '2026-10-26T12:00:00' },
    { calories: 1000, date: '2026-10-25T12:00:00' },
    { calories: 2700, date: '2026-10-24T12:00:00' },
  ];
  const result = calorieAdherence(meals, 2000, 4, now);
  assert.deepEqual(result.series.map((day) => day.status), ['none', 'over', 'under', 'on']);
  assert.equal(result.tracked, 3);
  assert.equal(result.rate, 33);
});
