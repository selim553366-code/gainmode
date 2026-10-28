import assert from 'node:assert/strict';
import test from 'node:test';
import { getCoachAtmosphere } from '../lib/coachAtmosphere.ts';

test('coach scene follows the local clock, not the color theme', () => {
  assert.equal(getCoachAtmosphere(new Date(2026, 9, 28, 8)), 'morning');
  assert.equal(getCoachAtmosphere(new Date(2026, 9, 28, 5, 59)), 'night');
  assert.equal(getCoachAtmosphere(new Date(2026, 9, 28, 6)), 'morning');
  assert.equal(getCoachAtmosphere(new Date(2026, 9, 28, 17, 59)), 'morning');
  assert.equal(getCoachAtmosphere(new Date(2026, 9, 28, 18)), 'night');
});
