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

test('accepts safe profile, workout, and exercise-name updates', () => {
  const actions = validateCoachActions([
    { type: 'update_profile', patch: { activity: 'moderate', preferredDays: ['TUE', 'THU'], weight: 74 } },
    { type: 'update_workout', workoutId: 'workout-1', day: 'WED', duration: 60 },
    { type: 'update_exercise', workoutId: 'workout-1', exerciseId: 'exercise-1', name: 'Tempo push-up', reps: 10 },
  ], workouts);

  assert.deepEqual(actions, [
    { type: 'update_profile', patch: { activity: 'moderate', preferredDays: ['TUE', 'THU'], weight: 74 } },
    { type: 'update_workout', workoutId: 'workout-1', day: 'WED', duration: 60 },
    { type: 'update_exercise', workoutId: 'workout-1', exerciseId: 'exercise-1', name: 'Tempo push-up', reps: 10 },
  ]);
});

test('rejects profile updates outside safe bounds and occupied workout days', () => {
  const actions = validateCoachActions([
    { type: 'update_profile', patch: { weight: 2, preferredDays: ['MON', 'MON'] } },
    { type: 'update_workout', workoutId: 'workout-1', day: 'INVALID' },
  ], workouts);

  assert.deepEqual(actions, []);
});