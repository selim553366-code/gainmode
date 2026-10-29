import assert from 'node:assert/strict';
import test from 'node:test';
import { canRestoreFitStateVersion, mergePersistedFitState } from '../lib/fitStateMigration.ts';

test('accepts every stored state version at or below the current app version', () => {
  for (const version of [0, 1, 3, 4, 5]) {
    assert.equal(canRestoreFitStateVersion(version, 5), true);
  }
});

test('rejects malformed and newer state versions without treating them as a fresh install', () => {
  for (const version of [undefined, null, '5', NaN, -1, 6]) {
    assert.equal(canRestoreFitStateVersion(version, 5), false);
  }
});

test('migration keeps the local account, completed onboarding, profile, and saved data', () => {
  const defaults = {
    version: 5,
    accountId: 'new-local-id',
    onboardingComplete: false,
    profile: null,
    meals: [],
    workouts: [],
    introSeen: false,
  };
  const prior = {
    version: 4,
    accountId: 'existing-local-id',
    onboardingComplete: true,
    profile: { goal: 'muscle' },
    meals: [{ id: 'meal-1', name: 'Lunch' }],
    workouts: [{ id: 'workout-1' }],
  };

  const restored = mergePersistedFitState(defaults, prior);

  assert.equal(restored.version, 5);
  assert.equal(restored.accountId, 'existing-local-id');
  assert.equal(restored.onboardingComplete, true);
  assert.deepEqual(restored.profile, prior.profile);
  assert.deepEqual(restored.meals, prior.meals);
  assert.deepEqual(restored.workouts, prior.workouts);
  assert.equal(restored.introSeen, false);
});
