import test from 'node:test';
import assert from 'node:assert/strict';
import { isDailyMoodDue } from '../lib/dailyMood.ts';

test('daily mood is not due before 19:50', () => {
  assert.equal(isDailyMoodDue(new Date(2026, 8, 4, 19, 49)), false);
  assert.equal(isDailyMoodDue(new Date(2026, 8, 4, 12, 0)), false);
});

test('daily mood is due at and after 19:50', () => {
  assert.equal(isDailyMoodDue(new Date(2026, 8, 4, 19, 50)), true);
  assert.equal(isDailyMoodDue(new Date(2026, 8, 4, 23, 59)), true);
});