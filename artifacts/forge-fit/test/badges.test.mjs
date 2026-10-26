import assert from 'node:assert/strict';
import test from 'node:test';
import { BADGE_TIERS, badges, countOnTargetDays, nextBadge } from '../lib/badges.ts';

const zero = { workouts: 0, minutes: 0, exercises: 0, streak: 0, activeDays: 0, meals: 0, weightLogs: 0, onTargetDays: 0 };

test('badge ids are unique and every badge has a tier and five languages', () => {
  assert.equal(new Set(badges.map((badge) => badge.id)).size, badges.length);
  for (const badge of badges) {
    assert.ok(BADGE_TIERS.includes(badge.tier), badge.id);
    assert.deepEqual(Object.keys(badge.title).sort(), ['de', 'en', 'es', 'fr', 'tr']);
  }
});

test('earlier badges keep their ids so saved unlocks survive', () => {
  for (const id of ['first-workout', 'workout-25', 'workout-100', 'workout-400', 'minutes-600', 'streak-3', 'streak-7', 'streak-30', 'active-100', 'meal-1', 'meal-50', 'meal-400', 'weight-1', 'weight-10', 'exercise-50']) {
    assert.ok(badges.some((badge) => badge.id === id), id);
  }
});

test('within a metric, a higher target is never a commoner tier', () => {
  const byMetric = new Map();
  badges.forEach((badge) => byMetric.set(badge.metric, [...(byMetric.get(badge.metric) ?? []), badge]));
  for (const list of byMetric.values()) {
    const sorted = [...list].sort((a, b) => a.target - b.target);
    sorted.slice(1).forEach((badge, index) => assert.ok(BADGE_TIERS.indexOf(badge.tier) >= BADGE_TIERS.indexOf(sorted[index].tier), badge.id));
  }
});

test('next badge is the closest locked one', () => {
  assert.equal(nextBadge({ ...zero, workouts: 8 }, ['first-workout']).id, 'workout-10');
  assert.equal(nextBadge(zero, []).tier, 'bronze');
  assert.equal(nextBadge(zero, badges.map((badge) => badge.id)), null);
});

test('on-target days use the ±20% band per calendar day', () => {
  const meals = [
    { calories: 1000, date: '2026-10-20T08:00:00' },
    { calories: 1000, date: '2026-10-20T19:00:00' },
    { calories: 3000, date: '2026-10-21T12:00:00' },
    { calories: 1700, date: '2026-10-22' },
  ];
  assert.equal(countOnTargetDays(meals, 2000), 2);
  assert.equal(countOnTargetDays(meals, null), 0);
});
