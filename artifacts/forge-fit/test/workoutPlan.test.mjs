import assert from 'node:assert/strict';
import test from 'node:test';
import { addExerciseToPlan, buildWorkoutPlan, buildWorkoutPlanForCycle, dumbbellExerciseKeys, estimateExerciseCalories, estimateWorkoutCalories, getWorkoutCompletionRatio, getWorkoutForDate, getWeekdayKey, normalizeWorkoutSets, restoreWorkoutProgress, sanitizeWorkoutSplits, workoutIsComplete, workoutsAreComplete } from '../lib/workoutPlan.ts';

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

test('rotates exercise choices when a completed workout cycle refreshes', () => {
  const firstCycle = buildWorkoutPlanForCycle(profile({ trainingDays: 3 }), 0);
  const secondCycle = buildWorkoutPlanForCycle(profile({ trainingDays: 3 }), 1);

  assert.notDeepEqual(
    firstCycle.flatMap((workout) => workout.exercises.map((exercise) => exercise.name)),
    secondCycle.flatMap((workout) => workout.exercises.map((exercise) => exercise.name)),
  );
  assert.ok(secondCycle.every((workout) => workout.exercises.every((exercise) => exercise.completed === false)));
});

test('assigns workouts only to preferred days so other days remain rest days', () => {
  const workouts = buildWorkoutPlan(profile({ trainingDays: 2, preferredDays: ['TUE', 'THU'] }));

  assert.deepEqual(workouts.map((workout) => workout.day), ['TUE', 'THU']);
});

test('never assigns biceps to a generated push day', () => {
  for (const trainingDays of [3, 4, 5, 6]) {
    const pushDays = buildWorkoutPlan(profile({ trainingDays })).filter((workout) => workout.name === 'workoutPushDay');
    assert.ok(pushDays.length > 0);
    for (const workout of pushDays) {
      assert.ok(!workout.focusAreas?.includes('biceps'));
      assert.ok(workout.exercises.every((exercise) => exercise.muscleGroup !== 'biceps'));
    }
  }
});

test('matches four-day workout names to their actual muscle splits', () => {
  const workouts = buildWorkoutPlan(profile({ trainingDays: 4 }));

  assert.deepEqual(workouts.map((workout) => workout.name), [
    'workoutPushDay',
    'workoutLegDay',
    'workoutPullDay',
    'workoutUpperDay',
  ]);
  const pullDay = workouts.find((workout) => workout.name === 'workoutPullDay');
  const legDay = workouts.find((workout) => workout.name === 'workoutLegDay');
  assert.ok(pullDay?.focusAreas?.includes('back'));
  assert.ok(pullDay?.focusAreas?.includes('biceps'));
  assert.ok(!pullDay?.focusAreas?.some((area) => ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(area)));
  assert.ok(legDay?.focusAreas?.includes('quadriceps'));
  assert.ok(!legDay?.focusAreas?.includes('core'));
});

test('repairs persisted pull and leg labels from their muscle content', () => {
  const workouts = buildWorkoutPlan(profile({ trainingDays: 4 }));
  const mislabeled = workouts.map((workout, index) => index === 1
    ? { ...workout, name: 'workoutPullDay' }
    : index === 2
      ? { ...workout, name: 'workoutLegDay' }
      : workout);
  const repaired = sanitizeWorkoutSplits(mislabeled);

  assert.equal(repaired[1].name, 'workoutLegDay');
  assert.equal(repaired[2].name, 'workoutPullDay');
});

test('removes legacy biceps exercises from a persisted push day', () => {
  const pushDay = buildWorkoutPlan(profile({ trainingDays: 3 }))[0];
  const polluted = {
    ...pushDay,
    focusAreas: [...(pushDay.focusAreas ?? []), 'biceps'],
    exercises: [
      ...pushDay.exercises,
      { id: 'legacy-curl', name: 'exerciseCurl', muscleGroup: 'biceps', sets: 3, reps: 10, completed: false },
    ],
  };
  const repaired = sanitizeWorkoutSplits([polluted])[0];

  assert.ok(!repaired.focusAreas?.includes('biceps'));
  assert.ok(repaired.exercises.every((exercise) => exercise.muscleGroup !== 'biceps'));
});

test('removes biceps from a push split even when its saved name is stale', () => {
  const pushDay = buildWorkoutPlan(profile({ trainingDays: 3 }))[0];
  const polluted = {
    ...pushDay,
    name: 'workoutUpperDay',
    focusAreas: [...(pushDay.focusAreas ?? []), 'biceps'],
    exercises: [
      ...pushDay.exercises,
      { id: 'stale-curl', name: 'exerciseCurl', muscleGroup: 'biceps', sets: 3, reps: 10, completed: false },
    ],
  };
  const repaired = sanitizeWorkoutSplits([polluted])[0];

  assert.equal(repaired.name, 'workoutPushDay');
  assert.ok(!repaired.focusAreas?.includes('biceps'));
  assert.ok(repaired.exercises.every((exercise) => exercise.muscleGroup !== 'biceps'));
});

test('removes biceps from a legacy push split without triceps metadata', () => {
  const pushDay = buildWorkoutPlan(profile({ trainingDays: 3 }))[0];
  const polluted = {
    ...pushDay,
    name: 'workoutUpperDay',
    focusAreas: ['chest', 'shoulders', 'biceps'],
    exercises: [
      ...pushDay.exercises.filter((exercise) => exercise.muscleGroup !== 'triceps'),
      { id: 'legacy-curl-without-triceps', name: 'exerciseCurl', muscleGroup: 'biceps', sets: 3, reps: 10, completed: false },
    ],
  };
  const repaired = sanitizeWorkoutSplits([polluted])[0];

  assert.equal(repaired.name, 'workoutPushDay');
  assert.ok(!repaired.focusAreas?.includes('biceps'));
  assert.ok(repaired.exercises.every((exercise) => exercise.muscleGroup !== 'biceps'));
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
  assert.ok(dumbbellNames.includes('exerciseDumbbellCurl'));
  assert.ok(!dumbbellNames.includes('exerciseBandRow'));
});

test('dumbbell library offers a broad equipment-specific movement pool', () => {
  assert.equal(dumbbellExerciseKeys.length, 35);
  assert.ok(dumbbellExerciseKeys.includes('exerciseDumbbellBenchPress'));
  assert.ok(dumbbellExerciseKeys.includes('exerciseGobletSquat'));
  assert.ok(dumbbellExerciseKeys.includes('exerciseDumbbellFarmerCarry'));
});

test('onboarding equipment details prioritize compatible dumbbell movements', () => {
  const benchPlan = buildWorkoutPlan(profile({ equipment: 'gym', gymLevel: 'advanced', equipmentDetails: 'adjustable dumbbells and incline bench', trainingDays: 4, sessionDuration: 60 }));
  const benchNames = benchPlan.flatMap((workout) => workout.exercises).map((exercise) => exercise.name);
  assert.ok(benchNames.includes('exerciseDumbbellBenchPress'));
  assert.ok(benchNames.includes('exerciseInclineDumbbellPress'));
  assert.ok(!benchNames.includes('exerciseCableFly'));

  const lightPlan = buildWorkoutPlan(profile({ equipment: 'home', equipmentDetails: 'light dumbbells', trainingDays: 4, sessionDuration: 60 }));
  const lightNames = lightPlan.flatMap((workout) => workout.exercises).map((exercise) => exercise.name);
  assert.ok(lightNames.includes('exerciseDumbbellLateralRaise'));
  assert.ok(lightNames.includes('exerciseDumbbellReverseFly'));
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

test('marks a workout cycle complete only when every workout is complete', () => {
  const workouts = buildWorkoutPlan(profile({ trainingDays: 2 }));

  assert.equal(workoutsAreComplete(workouts), false);
  assert.equal(workoutsAreComplete(workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map((exercise) => ({ ...exercise, completed: true })),
  }))), true);
});

test('estimates workout calories from duration, equipment intensity, and completed exercises', () => {
  const workout = buildWorkoutPlan(profile({ equipment: 'gym', trainingDays: 2, sessionDuration: 40 }))[0];
  const completedCount = Math.ceil(workout.exercises.length / 2);
  const partialWorkout = {
    ...workout,
    exercises: workout.exercises.map((exercise, index) => ({ ...exercise, completed: index < completedCount })),
  };

  assert.equal(getWorkoutCompletionRatio(partialWorkout), completedCount / workout.exercises.length);
  const expectedPartial = partialWorkout.exercises.reduce((sum, exercise) => sum + (exercise.completed ? estimateExerciseCalories(partialWorkout, exercise, profile({ equipment: 'gym' })) : 0), 0);
  const fullWorkout = { ...workout, exercises: workout.exercises.map((exercise) => ({ ...exercise, completed: true })) };

  assert.equal(estimateWorkoutCalories(partialWorkout, profile({ equipment: 'gym' })), expectedPartial);
  assert.ok(estimateWorkoutCalories(fullWorkout, profile({ equipment: 'gym' })) > estimateWorkoutCalories(partialWorkout, profile({ equipment: 'gym' })));
});

test('calculates a distinct movement burn and applies dumbbell load', () => {
  const workout = buildWorkoutPlan(profile({ equipment: 'home', trainingDays: 2, sessionDuration: 40 }))[0];
  const squat = { ...workout.exercises.find((exercise) => exercise.name === 'exerciseGobletSquat') ?? workout.exercises[0], name: 'exerciseGobletSquat' };
  const curl = { ...workout.exercises.find((exercise) => exercise.name === 'exerciseDumbbellCurl') ?? workout.exercises[1], name: 'exerciseDumbbellCurl' };
  const lightProfile = profile({ equipment: 'home', dumbbellWeightKg: 5 });
  const heavyProfile = profile({ equipment: 'home', dumbbellWeightKg: 20 });
  const heavierUserProfile = profile({ equipment: 'home', weight: 110, dumbbellWeightKg: 5 });
  const isolatedCurlWorkout = { ...workout, duration: 120, exercises: [curl] };

  assert.notEqual(estimateExerciseCalories(workout, squat, lightProfile), estimateExerciseCalories(workout, curl, lightProfile));
  assert.ok(estimateExerciseCalories(workout, curl, heavyProfile) > estimateExerciseCalories(workout, curl, lightProfile));
  assert.ok(estimateExerciseCalories(isolatedCurlWorkout, curl, heavierUserProfile) > estimateExerciseCalories(isolatedCurlWorkout, curl, lightProfile));
  assert.equal(estimateExerciseCalories({ ...workout, exercises: [] }, squat, lightProfile), 0);
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