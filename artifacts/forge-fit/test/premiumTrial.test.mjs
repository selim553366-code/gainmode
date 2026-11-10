import test from 'node:test';
import assert from 'node:assert/strict';
import { freeTrialDays } from '../lib/premiumTrial.ts';

test('reads a Google Play free phase', () => {
  assert.equal(freeTrialDays({ defaultOption: { freePhase: { billingPeriod: { unit: 'DAY', value: 3 } } } }), 3);
  assert.equal(freeTrialDays({ defaultOption: { freePhase: { billingPeriod: { unit: 'WEEK', value: 1 } } } }), 7);
});

test('reads a free App Store introductory price', () => {
  assert.equal(freeTrialDays({ introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3, cycles: 1 } }), 3);
});

test('a paid introductory price is not a free trial', () => {
  assert.equal(freeTrialDays({ introPrice: { price: 0.99, periodUnit: 'WEEK', periodNumberOfUnits: 1, cycles: 1 } }), null);
});

test('no trial information means no trial', () => {
  assert.equal(freeTrialDays(undefined), null);
  assert.equal(freeTrialDays({ introPrice: null, defaultOption: null }), null);
  assert.equal(freeTrialDays({ defaultOption: { freePhase: null } }), null);
});
