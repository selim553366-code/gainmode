import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCoachActions } from '../lib/coachActions.ts';

const workouts = [
  {
    id: 'workout-1',
    day: 'MON',
    name: 'workoutUpper',
    duration: 45,
    completed: false,
    exercises: [{ id: 'exercise-1', name: 'exercisePushup', sets: 3, reps: 12 }],
  },
];

test('accepts valid plan and nutrition actions using existing ids', () => {
  const actions = validateCoachActions([
    { type: 'add_exercise', workoutId: 'workout-1', name: 'Incline push-up', sets: 3, reps: 10 },
     { type: 'update_exercise', workoutId: 'workout-1', exerciseId: 'exercise-1', sets: 3 },
    { type: 'remove_exercise', workoutId: 'workout-1', exerciseId: 'exercise-1' },
    { type: 'update_nutrition', calories: 2200, protein: 150 },
  ], workouts);

  assert.deepEqual(actions, [
    { type: 'add_exercise', workoutId: 'workout-1', name: 'Incline push-up', sets: 3, reps: 10 },
     { type: 'update_exercise', workoutId: 'workout-1', exerciseId: 'exercise-1', sets: 3 },
    { type: 'remove_exercise', workoutId: 'workout-1', exerciseId: 'exercise-1' },
    { type: 'update_nutrition', calories: 2200, protein: 150 },
  ]);
});

test('rejects guessed ids and unsafe numeric changes', () => {
  const actions = validateCoachActions([
    { type: 'remove_exercise', workoutId: 'workout-1', exerciseId: 'not-real' },
    { type: 'update_exercise', workoutId: 'workout-1', exerciseId: 'exercise-1', reps: 0 },
    { type: 'update_nutrition', calories: 9000 },
    { type: 'add_exercise', workoutId: 'not-real', name: 'Burpees', sets: 3, reps: 10 },
  ], workouts);

  assert.deepEqual(actions, []);
});

test('rejects workout set counts above the three-set limit', () => {
  const actions = validateCoachActions([
    { type: 'add_exercise', workoutId: 'workout-1', name: 'Burpees', sets: 4, reps: 10 },
    { type: 'update_exercise', workoutId: 'workout-1', exerciseId: 'exercise-1', sets: 4 },
  ], workouts);

  assert.deepEqual(actions, []);
});

test('limits the number of actions in one assistant response', () => {
  const actions = validateCoachActions(Array.from({ length: 8 }, (_, index) => ({
    type: 'add_exercise',
    workoutId: 'workout-1',
    name: `Exercise ${index}`,
    sets: 2,
    reps: 10,
  })), workouts);

  assert.equal(actions.length, 6);
});