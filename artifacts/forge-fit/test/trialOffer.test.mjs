import test from 'node:test';
import assert from 'node:assert/strict';
import { TRIAL_OFFER_WINDOW_MS, countdownParts, trialOfferRemaining } from '../lib/trialCountdown.ts';

test('the offer lasts 15 minutes from its start', () => {
  assert.equal(TRIAL_OFFER_WINDOW_MS, 900000);
  assert.equal(trialOfferRemaining(1000, 1000), 900000);
  assert.equal(trialOfferRemaining(1000, 1000 + 60000), 840000);
});

test('the offer never goes below zero once it has ended', () => {
  assert.equal(trialOfferRemaining(0, 900000), 0);
  assert.equal(trialOfferRemaining(0, 5000000), 0);
});

test('the countdown splits into hours, minutes and seconds, rounding seconds up', () => {
  assert.deepEqual(countdownParts(900000), { hours: 0, minutes: 15, seconds: 0 });
  assert.deepEqual(countdownParts(899001), { hours: 0, minutes: 15, seconds: 0 });
  assert.deepEqual(countdownParts(898999), { hours: 0, minutes: 14, seconds: 59 });
  assert.deepEqual(countdownParts(0), { hours: 0, minutes: 0, seconds: 0 });
});
