import assert from 'node:assert/strict';
import test from 'node:test';

import { daysUntilWeeklyAnalysis, isWeeklyAnalysisUnlocked, WEEKLY_ANALYSIS_WAIT_MS } from '../lib/weeklyEligibility.ts';

const now = Date.parse('2026-09-09T12:00:00.000Z');

test('keeps the weekly analysis locked before seven days', () => {
  const registeredAt = new Date(now - WEEKLY_ANALYSIS_WAIT_MS + 1).toISOString();

  assert.equal(isWeeklyAnalysisUnlocked(registeredAt, now), false);
  assert.equal(daysUntilWeeklyAnalysis(registeredAt, now), 1);
});

test('unlocks the weekly analysis at seven full days', () => {
  const registeredAt = new Date(now - WEEKLY_ANALYSIS_WAIT_MS).toISOString();

  assert.equal(isWeeklyAnalysisUnlocked(registeredAt, now), true);
  assert.equal(daysUntilWeeklyAnalysis(registeredAt, now), 0);
});

test('keeps users without a valid registration date locked', () => {
  assert.equal(isWeeklyAnalysisUnlocked(null, now), false);
  assert.equal(isWeeklyAnalysisUnlocked('not-a-date', now), false);
  assert.equal(daysUntilWeeklyAnalysis(null, now), 7);
});