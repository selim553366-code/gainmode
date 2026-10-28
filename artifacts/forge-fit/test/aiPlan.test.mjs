import assert from 'node:assert/strict';
import test from 'node:test';
import { aiPlanRequestBody, applyAiExercises, blendNutrition, parseAiPlan } from '../lib/aiPlan.ts';

const slots = [
  { day: 'MON', name: 'workoutPushDay', areas: ['chest', 'triceps'], perArea: 2, candidates: { chest: ['a', 'b', 'c'], triceps: ['t1', 't2'] } },
  { day: 'WED', name: 'workoutLegDay', areas: ['quadriceps'], perArea: 2, candidates: { quadriceps: ['q1', 'q2', 'q3'] } },
];

test('request body lists each day with readable exercise options', () => {
  const body = aiPlanRequestBody({ goal: 'muscle', weight: 70, height: 175, age: 25 }, slots, (key) => key.toUpperCase(), 'tr');
  assert.equal(body.language, 'tr');
  assert.deepEqual(body.days[0].areas[0], { area: 'chest', options: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }] });
});

test('only allowed, distinct picks survive and numbers are kept in range', () => {
  const plan = parseAiPlan({
    nutrition: { calories: 2500.4, protein: 150, fat: 70 },
    sets: 9, reps: 2,
    days: [{ exercises: { chest: ['c', 'c', 'hack', 'a', 'b'], triceps: 'nope' } }],
    note: '  Fits you.  ',
  }, slots);
  assert.deepEqual(plan.exercises, [{ chest: ['c', 'a'] }, {}]);
  assert.equal(plan.sets, 3);
  assert.equal(plan.reps, 5);
  assert.deepEqual(plan.nutrition, { calories: 2500, protein: 150, fat: 70 });
  assert.equal(plan.note, 'Fits you.');
});

test('missing nutrition gives no AI targets', () => {
  assert.equal(parseAiPlan({ days: [] }, slots).nutrition, null);
  assert.equal(blendNutrition({ calories: 2000, protein: 120, fat: 60 }, null, 1200), null);
});

test('AI nutrition is held near the formula and carbs fill the rest', () => {
  const result = blendNutrition({ calories: 2000, protein: 120, fat: 60 }, { calories: 4000, protein: 50, fat: 60 }, 1200);
  assert.equal(result.calories, 2300);
  assert.equal(result.protein, 90);
  assert.equal(result.carbs, Math.round((2300 - 90 * 4 - 60 * 9) / 4));
});

test('exercise picks replace names per muscle group and keep ids', () => {
  const workouts = [{ id: 'w0', day: 'MON', name: 'x', duration: 40, completed: false, exercises: [
    { id: '1', name: 'a', muscleGroup: 'chest', sets: 2, reps: 12 },
    { id: '2', name: 'b', muscleGroup: 'chest', sets: 2, reps: 12 },
    { id: '3', name: 't1', muscleGroup: 'triceps', sets: 2, reps: 12 },
  ] }];
  const [day] = applyAiExercises(workouts, { nutrition: null, sets: 3, reps: 8, exercises: [{ chest: ['c'] }], note: null });
  assert.deepEqual(day.exercises.map((exercise) => [exercise.id, exercise.name, exercise.sets, exercise.reps]), [['1', 'c', 3, 8], ['2', 'a', 3, 8], ['3', 't1', 3, 8]]);
});

test('a pick that matches a later local move does not repeat it', () => {
  const workouts = [{ id: 'w0', day: 'MON', name: 'x', duration: 40, completed: false, exercises: [
    { id: '1', name: 'a', muscleGroup: 'chest', sets: 2, reps: 12 },
    { id: '2', name: 'b', muscleGroup: 'chest', sets: 2, reps: 12 },
  ] }];
  const [day] = applyAiExercises(workouts, { nutrition: null, sets: null, reps: null, exercises: [{ chest: ['b'] }], note: null });
  assert.deepEqual(day.exercises.map((exercise) => exercise.name), ['b', 'a']);
});
