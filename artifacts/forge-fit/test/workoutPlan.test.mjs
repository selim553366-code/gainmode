import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWorkoutPlan, workoutIsComplete } from '../lib/workoutPlan.ts';

const profile = (overrides = {}) => ({
  equipment: 'bodyweight',
  height: 175,
  weight: 75,
  age: 30,
  goal: 'muscle',
  trainingDays: 3,
  sessionDuration: 45,
  experience: 'beginner',
  ...overrides,
});

test('keeps every generated muscle group between two and three exercises', () => {
  const workouts = buildWorkoutPlan(profile({ trainingDays: 6, sessionDuration: 60 }));

  assert.equal(workouts.length, 6);
  for (const workout of workouts) {
    assert.ok(workout.focusAreas?.length);
    for (const group of workout.focusAreas) {
      const exercises = workout.exercises.filter((exercise) => exercise.muscleGroup === group);
      assert.ok(exercises.length >= 2 && exercises.length <= 3, `${group} has ${exercises.length} exercises`);
    }
  }
});

test('bodyweight plans never use gym or weight-specific exercises', () => {
  const workouts = buildWorkoutPlan(profile({ trainingDays: 3 }));
  const gymOnly = new Set([
    'exerciseBench',
    'exerciseInclineBench',
    'exerciseCableFly',
    'exerciseLatPulldown',
    'exercisePullup',
    'exerciseLegPress',
    'exerciseCableCrunch',
    'exerciseLegCurl',
    'exerciseHipThrust',
    'exerciseSeatedCalfRaise',
  ]);

  assert.ok(workouts.flatMap((workout) => workout.exercises).every((exercise) => !gymOnly.has(exercise.name)));
});

test('equipment details choose matching home movement variations', () => {
  const bandPlan = buildWorkoutPlan(profile({ equipment: 'home', equipmentDetails: 'resistance bands', trainingDays: 3 }));
  const bandNames = bandPlan.flatMap((workout) => workout.exercises).map((exercise) => exercise.name);
  assert.ok(bandNames.includes('exerciseBandRow'));
  assert.ok(!bandNames.includes('exerciseCurl'));

  const dumbbellPlan = buildWorkoutPlan(profile({ equipment: 'home', equipmentDetails: 'two dumbbells', trainingDays: 3 }));
  const dumbbellNames = dumbbellPlan.flatMap((workout) => workout.exercises).map((exercise) => exercise.name);
  assert.ok(dumbbellNames.includes('exerciseCurl'));
  assert.ok(!dumbbellNames.includes('exerciseBandRow'));
});

test('a workout is complete only when every exercise is complete', () => {
  const workout = buildWorkoutPlan(profile({ trainingDays: 2 }))[0];
  assert.equal(workoutIsComplete(workout), false);
  assert.equal(workoutIsComplete({
    ...workout,
    exercises: workout.exercises.map((exercise) => ({ ...exercise, completed: true })),
  }), true);
  assert.equal(workoutIsComplete({
    ...workout,
    exercises: workout.exercises.map((exercise, index) => ({ ...exercise, completed: index > 0 })),
  }), false);
});