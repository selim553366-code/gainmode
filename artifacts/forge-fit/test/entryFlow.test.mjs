import assert from 'node:assert/strict';
import test from 'node:test';
import { getEntryRoute } from '../lib/entryFlow.ts';

const baseState = {
  onboardingComplete: false,
  introSeen: false,
  isPremium: false,
  subscriptionPurchaseEnabled: true,
  coachIntroPending: false,
};

test('a clean install starts with onboarding before any paywall or tabs', () => {
  assert.equal(getEntryRoute(baseState), 'onboarding');
});

test('completed onboarding shows the intro exactly once', () => {
  assert.equal(getEntryRoute({ ...baseState, onboardingComplete: true }), 'intro');
});

test('a non-premium user reaches the Premium offer after the intro', () => {
  assert.equal(getEntryRoute({ ...baseState, onboardingComplete: true, introSeen: true }), 'premium');
});

test('Premium users go to Coach first when the coach intro is pending', () => {
  assert.equal(getEntryRoute({
    ...baseState,
    onboardingComplete: true,
    introSeen: true,
    isPremium: true,
    coachIntroPending: true,
  }), 'coach');
});

test('a completed user without a pending coach intro goes to the tabs', () => {
  assert.equal(getEntryRoute({
    ...baseState,
    onboardingComplete: true,
    introSeen: true,
    isPremium: true,
  }), 'tabs');
});