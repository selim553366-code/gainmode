import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateCalorieProgress, calculateNetCalories, calculateRemainingCalories } from '../lib/nutritionCalories.ts';

test('subtracts completed exercise burn from consumed calories', () => {
  assert.equal(calculateNetCalories(2100, 315), 1785);
});

test('increases the remaining target when exercise burn is logged', () => {
  assert.equal(calculateRemainingCalories(2200, calculateNetCalories(1500, 300)), 1000);
  assert.equal(calculateRemainingCalories(2200, 1500), 700);
});

test('keeps progress based on net calories and handles a missing goal', () => {
  assert.equal(calculateCalorieProgress(2000, calculateNetCalories(1400, 200)), 0.6);
  assert.equal(calculateCalorieProgress(null, 1200), 0);
});