import test from 'node:test';
import assert from 'node:assert/strict';
import { clampGameMinutes, formatGameLength, gameTimeLeft } from '../lib/gameTimerMath.ts';

test('the gaming session length stays between 15 minutes and 8 hours, in 15-minute steps', () => {
  assert.equal(clampGameMinutes(5), 15);
  assert.equal(clampGameMinutes(52), 45);
  assert.equal(clampGameMinutes(53), 60);
  assert.equal(clampGameMinutes(1000), 480);
});

test('the time left never goes below zero', () => {
  assert.equal(gameTimeLeft(10_000, 4_000), 6_000);
  assert.equal(gameTimeLeft(10_000, 20_000), 0);
});

test('lengths read naturally', () => {
  assert.equal(formatGameLength(45, 'h', 'min'), '45 min');
  assert.equal(formatGameLength(60, 'h', 'min'), '1 h');
  assert.equal(formatGameLength(90, 'sa', 'dk'), '1 sa 30 dk');
});
