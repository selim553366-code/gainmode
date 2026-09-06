import assert from 'node:assert/strict';
import test from 'node:test';
import { addExerciseToPlan, buildWorkoutPlan, getWorkoutForDate, getWeekdayKey, normalizeWorkoutSets, restoreWorkoutProgress, workoutIsComplete } from '../lib/workoutPlan.ts';

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

test('assigns workouts only to preferred days so other days remain rest days', () => {
  const workouts = buildWorkoutPlan(profile({ trainingDays: 2, preferredDays: ['TUE', 'THU'] }));

  assert.deepEqual(workouts.map((workout) => workout.day), ['TUE', 'THU']);
});

test('selects the workout assigned to the local calendar day', () => {
  const workouts = buildWorkoutPlan(profile({ trainingDays: 2, preferredDays: ['TUE', 'THU'] }));
  const thursday = new Date(2026, 8, 3, 8, 30);

  assert.equal(getWeekdayKey(thursday), 'THU');
  assert.equal(getWorkoutForDate(workouts, thursday)?.day, 'THU');
  assert.equal(getWorkoutForDate(workouts, new Date(2026, 8, 4, 8, 30)), undefined);
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

test('uses one safe set count for every generated exercise', () => {
  const workouts = buildWorkoutPlan(profile({ experience: 'advanced', sessionDuration: 60, activity: 'high' }));
  const sets = workouts.flatMap((workout) => workout.exercises).map((exercise) => exercise.sets);

  assert.ok(sets.length > 0);
  assert.ok(sets.every((value) => value === sets[0]));
  assert.ok(sets[0] >= 1 && sets[0] <= 3);
});

test('normalizes persisted exercises to one set count between one and three', () => {
  const workouts = buildWorkoutPlan(profile({ trainingDays: 2 }));
  const restored = normalizeWorkoutSets(workouts.map((workout, workoutIndex) => ({
    ...workout,
    exercises: workout.exercises.map((exercise, exerciseIndex) => ({ ...exercise, sets: workoutIndex + exerciseIndex + 4 })),
  })));
  const sets = restored.flatMap((workout) => workout.exercises).map((exercise) => exercise.sets);

  assert.ok(sets.every((value) => value === 3));
});

test('adds a custom exercise to the selected workout and keeps the shared set count', () => {
  const workouts = buildWorkoutPlan(profile({ trainingDays: 2 }));
  const selectedId = workouts[0].id;
  const updated = addExerciseToPlan(workouts, selectedId, 'Bulgarian split squat', 3, 8);
  const added = updated[0].exercises.at(-1);

  assert.equal(added?.name, 'Bulgarian split squat');
  assert.equal(added?.reps, 8);
  assert.equal(added?.muscleGroup, 'other');
  assert.equal(added?.completed, false);
  assert.equal(added?.sets, updated.flatMap((workout) => workout.exercises)[0].sets);
  assert.equal(updated[1].exercises.length, workouts[1].exercises.length);
});

test('ignores blank custom exercise names', () => {
  const workouts = buildWorkoutPlan(profile({ trainingDays: 2 }));
  const updated = addExerciseToPlan(workouts, workouts[0].id, '   ');

  assert.deepEqual(updated, workouts);
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

test('restores individual exercise completion after a persisted round-trip', () => {
  const workout = buildWorkoutPlan(profile({ trainingDays: 2 }))[0];
  const completedIndexes = new Set([0, 2]);
  const beforeRestart = {
    ...workout,
    completed: true,
    exercises: workout.exercises.map((exercise, index) => ({
      ...exercise,
      completed: completedIndexes.has(index),
    })),
  };

  const afterRestart = restoreWorkoutProgress(JSON.parse(JSON.stringify([beforeRestart])))[0];

  assert.deepEqual(afterRestart.exercises.map((exercise) => exercise.completed), workout.exercises.map((_, index) => completedIndexes.has(index)));
  assert.equal(afterRestart.completed, false);
});

test('keeps day completion aligned with restored exercise flags', () => {
  const workout = buildWorkoutPlan(profile({ trainingDays: 2 }))[0];
  const beforeRestart = {
    ...workout,
    completed: true,
    exercises: workout.exercises.map((exercise) => ({ ...exercise, completed: true })),
  };

  const afterRestart = restoreWorkoutProgress(JSON.parse(JSON.stringify([beforeRestart])))[0];

  assert.ok(afterRestart.exercises.every((exercise) => exercise.completed));
  assert.equal(afterRestart.completed, true);
  assert.equal(afterRestart.completed, workoutIsComplete(afterRestart));
});

test('migrates legacy workout records without exercise completion fields', () => {
  const workout = buildWorkoutPlan(profile({ trainingDays: 2 }))[0];
  const legacyWorkout = {
    ...workout,
    completed: true,
    exercises: workout.exercises.map(({ completed: _completed, ...exercise }) => exercise),
  };

  const restored = restoreWorkoutProgress(JSON.parse(JSON.stringify([legacyWorkout])))[0];

  assert.ok(restored.exercises.every((exercise) => exercise.completed));
  assert.equal(restored.completed, true);
});