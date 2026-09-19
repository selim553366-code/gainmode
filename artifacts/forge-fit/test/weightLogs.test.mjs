import assert from 'node:assert/strict';
import test from 'node:test';
import { upsertTodayWeightLog } from '../lib/nutritionDates.ts';

test('updates the current day weight instead of creating a same-day change', () => {
  const morning = new Date(2026, 8, 19, 8, 0, 0);
  const evening = new Date(2026, 8, 19, 20, 0, 0);
  const first = upsertTodayWeightLog([], 80, morning, 'first');
  const second = upsertTodayWeightLog(first.logs, 79.5, evening, 'second');

  assert.equal(first.addedNewDay, true);
  assert.equal(second.addedNewDay, false);
  assert.equal(second.logs.length, 1);
  assert.equal(second.logs[0].id, 'first');
  assert.equal(second.logs[0].value, 79.5);
});

test('keeps a separate record when the calendar day changes', () => {
  const today = new Date(2026, 8, 19, 8, 0, 0);
  const tomorrow = new Date(2026, 8, 20, 8, 0, 0);
  const first = upsertTodayWeightLog([], 80, today, 'first');
  const second = upsertTodayWeightLog(first.logs, 79.5, tomorrow, 'second');

  assert.equal(second.addedNewDay, true);
  assert.deepEqual(second.logs.map((log) => log.value), [80, 79.5]);
});