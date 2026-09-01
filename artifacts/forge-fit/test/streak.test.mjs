import test from 'node:test';
import assert from 'node:assert/strict';
import { addStreakActivity, getCurrentStreak, getStreakCalendar } from '../lib/streak.ts';
import { STREAK_PROMPT_COUNT, getStreakPrompt, streakPromptsByLanguage } from '../lib/streakPrompts.ts';

const now = new Date(2026, 8, 1, 12);

test('a new user starts at streak day zero', () => {
  assert.equal(getCurrentStreak([], now), 0);
});

test('streak counts consecutive local calendar days', () => {
  assert.equal(getCurrentStreak(['2026-08-29', '2026-08-30', '2026-08-31', '2026-09-01'], now), 4);
  assert.equal(getCurrentStreak(['2026-08-28', '2026-08-30', '2026-08-31', '2026-09-01'], now), 3);
});

test('yesterday remains visible until today is completed', () => {
  assert.equal(getCurrentStreak(['2026-08-30', '2026-08-31'], now), 2);
  assert.equal(getCurrentStreak(['2026-08-29'], now), 0);
});

test('streak activity is deduplicated and bounded', () => {
  assert.deepEqual(addStreakActivity(['2026-09-01', '2026-08-31'], now), ['2026-08-31', '2026-09-01']);
});

test('calendar marks completed days and today', () => {
  const calendar = getStreakCalendar(['2026-08-30', '2026-08-31', '2026-09-01'], now, 3);
  assert.deepEqual(calendar.map((day) => [day.isCompleted, day.isToday]), [[true, false], [true, false], [true, true]]);
});

test('every language has 365 unique day prompts', () => {
  for (const prompts of Object.values(streakPromptsByLanguage)) {
    assert.equal(prompts.length, STREAK_PROMPT_COUNT);
    assert.equal(new Set(prompts).size, STREAK_PROMPT_COUNT);
  }
  assert.match(getStreakPrompt('en', 365), /365/);
});