import assert from 'node:assert/strict';
import test from 'node:test';
import { getMealsForRange, localDateKey, mealDateKey } from '../lib/nutritionDates.ts';

const now = new Date();
const today = localDateKey(now);
const yesterdayDate = new Date(now);
yesterdayDate.setDate(yesterdayDate.getDate() - 1);
const yesterday = localDateKey(yesterdayDate);
const olderDate = new Date(now);
olderDate.setDate(olderDate.getDate() - 40);
const older = localDateKey(olderDate);
const meals = [
  { id: 'today', date: `${today}T12:00:00`, calories: 500 },
  { id: 'yesterday', date: `${yesterday}T12:00:00`, calories: 700 },
  { id: 'older', date: `${older}T12:00:00`, calories: 900 },
  { id: 'legacy', calories: 300 },
];

test('daily range includes only today meals and resets the visible calorie total', () => {
  const visible = getMealsForRange(meals, 'daily', now);
  assert.deepEqual(visible.map((meal) => meal.id), ['today', 'legacy']);
  assert.equal(visible.reduce((sum, meal) => sum + meal.calories, 0), 800);
});

test('weekly and monthly ranges keep recent history available', () => {
  assert.deepEqual(getMealsForRange(meals, 'weekly', now).map((meal) => meal.id), ['today', 'yesterday', 'legacy']);
  const expectedMonthly = now.getDate() === 1 ? ['today', 'legacy'] : ['today', 'yesterday', 'legacy'];
  assert.deepEqual(getMealsForRange(meals, 'monthly', now).map((meal) => meal.id), expectedMonthly);
});

test('ISO timestamps are converted to the device local calendar date', () => {
  const timestamp = new Date(now);
  timestamp.setHours(23, 45, 0, 0);
  assert.equal(mealDateKey(timestamp.toISOString()), localDateKey(timestamp));
  assert.equal(mealDateKey(today), today);
});