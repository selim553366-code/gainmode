import assert from 'node:assert/strict';
import test from 'node:test';
import { daysToNextFire, fireScale, fireTier, fireTierProgress } from '../lib/streakFire.ts';

test('fire tiers change on day 10, 50 and 100', () => {
  assert.equal(fireTier(0), 'none');
  assert.equal(fireTier(1), 'spark');
  assert.equal(fireTier(9), 'spark');
  assert.equal(fireTier(10), 'blaze');
  assert.equal(fireTier(49), 'blaze');
  assert.equal(fireTier(50), 'inferno');
  assert.equal(fireTier(100), 'legend');
  assert.equal(fireTier(365), 'legend');
});

test('fire grows every day and jumps at milestones', () => {
  for (let day = 1; day < 120; day += 1) assert.ok(fireScale(day + 1) >= fireScale(day), `day ${day}`);
  assert.ok(fireScale(10) - fireScale(9) > 0.05);
  assert.ok(fireScale(50) - fireScale(49) > 0.03);
  assert.equal(fireScale(100), 1);
});

test('counts down to the next milestone', () => {
  assert.equal(daysToNextFire(3), 7);
  assert.equal(daysToNextFire(10), 40);
  assert.equal(daysToNextFire(99), 1);
  assert.equal(daysToNextFire(100), null);
  assert.equal(fireTierProgress(30), 0.5);
});
