import test from 'node:test';
import assert from 'node:assert/strict';
import { countEnabledNotifications, restoreNotificationPreferences } from '../lib/notificationPreferences.ts';

const defaults = { workoutReminder: true, waterReminder: true, mealReminder: true, coachCheckIn: true, weeklySummary: true };

test('saved reminder choices survive a restart', () => {
  const restored = restoreNotificationPreferences({ waterReminder: false, mealReminder: false }, defaults);
  assert.deepEqual(restored, { ...defaults, waterReminder: false, mealReminder: false });
  assert.equal(countEnabledNotifications(restored), 3);
});

test('missing or malformed saved choices fall back to the defaults', () => {
  assert.deepEqual(restoreNotificationPreferences(undefined, defaults), defaults);
  assert.deepEqual(restoreNotificationPreferences('off', defaults), defaults);
  assert.deepEqual(restoreNotificationPreferences({ waterReminder: 'no', unknown: false }, defaults), defaults);
});
