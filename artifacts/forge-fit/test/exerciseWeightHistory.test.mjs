import assert from 'node:assert/strict';
import test from 'node:test';
import { getExerciseWeightHistory } from '../lib/exerciseWeightHistory.ts';

const target = {
  workoutId: 'workout-0',
  exerciseId: '0-chest-0',
  exerciseName: 'exerciseBenchPress',
  muscleGroup: 'chest',
};

const entry = (id, overrides = {}) => ({
  id,
  workoutId: 'workout-0',
  exerciseId: '0-chest-0',
  weightKg: 10,
  date: '2026-09-01T10:00:00.000Z',
  exerciseName: 'exerciseBenchPress',
  muscleGroup: 'chest',
  ...overrides,
});

test('matches the same movement across rotated workout cycles', () => {
  const history = getExerciseWeightHistory([
    entry('older-cycle', {
      workoutId: 'workout-0',
      exerciseId: '0-chest-0',
      weightKg: 8,
      date: '2026-08-01T10:00:00.000Z',
    }),
    entry('different-movement', { exerciseName: 'exercisePushup' }),
    entry('same-name-different-muscle', { muscleGroup: 'back' }),
  ], target);

  assert.deepEqual(history.map((item) => item.id), ['older-cycle']);
});

test('keeps legacy history by its original workout and exercise IDs', () => {
  const history = getExerciseWeightHistory([
    entry('legacy-match', { exerciseName: undefined, muscleGroup: undefined }),
    entry('legacy-other-slot', { exerciseName: undefined, exerciseId: '0-chest-1' }),
  ], target);

  assert.deepEqual(history.map((item) => item.id), ['legacy-match']);
});

test('sorts chronologically and ignores invalid saved entries', () => {
  const history = getExerciseWeightHistory([
    entry('later', { date: '2026-09-20T10:00:00.000Z' }),
    entry('earlier', { date: '2026-09-10T10:00:00.000Z' }),
    entry('bad-date', { date: 'not-a-date' }),
    entry('bad-weight', { weightKg: Number.NaN }),
  ], target);

  assert.deepEqual(history.map((item) => item.id), ['earlier', 'later']);
});