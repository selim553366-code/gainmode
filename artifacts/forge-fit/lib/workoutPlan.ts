import type { TranslationKey } from '@/lib/i18n';
import type { Profile, Workout } from '@/context/FitContext';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'other';

type ExerciseLibrary = Record<MuscleGroup, TranslationKey[]>;

const bodyweightLibrary: ExerciseLibrary = {
  chest: ['exercisePushup', 'exerciseWidePushup', 'exerciseInclinePushup'],
  back: ['exerciseSuperman', 'exerciseReverseSnowAngel', 'exerciseBodyweightRow'],
  shoulders: ['exercisePikePushup', 'exerciseShoulderTap', 'exerciseProneYRaise'],
  biceps: ['exerciseInvertedRow', 'exerciseSelfResistedCurl', 'exerciseTowelCurl'],
  triceps: ['exerciseDiamondPushup', 'exerciseCloseGripPushup', 'exerciseBodyweightDip'],
  core: ['exercisePlank', 'exerciseSidePlank', 'exerciseDeadBug'],
  quadriceps: ['exerciseSquat', 'exerciseReverseLunge', 'exerciseSplitSquat'],
  hamstrings: ['exerciseGoodMorning', 'exerciseNordicCurl', 'exerciseSingleLegRdl'],
  glutes: ['exerciseGluteBridge', 'exerciseSingleLegGluteBridge', 'exerciseDonkeyKick'],
  calves: ['exerciseCalfRaise', 'exerciseSingleLegCalfRaise', 'exerciseCalfPulse'],
  other: ['exerciseMountain', 'exerciseDeadBug', 'exercisePlank'],
};

const dumbbellLibrary: ExerciseLibrary = {
  ...bodyweightLibrary,
  shoulders: ['exerciseShoulderPress', 'exerciseLateralRaise', 'exerciseProneYRaise'],
  biceps: ['exerciseCurl', 'exerciseHammerCurl', 'exerciseSelfResistedCurl'],
  triceps: ['exerciseTriceps', 'exerciseOverheadTriceps', 'exerciseCloseGripPushup'],
  hamstrings: ['exerciseRdl', 'exerciseGoodMorning', 'exerciseSingleLegRdl'],
  glutes: ['exerciseRdl', 'exerciseGluteBridge', 'exerciseReverseLunge'],
};

const bandLibrary: ExerciseLibrary = {
  ...bodyweightLibrary,
  chest: ['exercisePushup', 'exerciseBandChestPress', 'exerciseWidePushup'],
  back: ['exerciseBandRow', 'exerciseReverseSnowAngel', 'exerciseBodyweightRow'],
  shoulders: ['exerciseBandShoulderPress', 'exerciseLateralRaise', 'exerciseShoulderTap'],
  biceps: ['exerciseBandCurl', 'exerciseInvertedRow', 'exerciseSelfResistedCurl'],
  triceps: ['exerciseBandTriceps', 'exerciseDiamondPushup', 'exerciseCloseGripPushup'],
};

const kettlebellLibrary: ExerciseLibrary = {
  ...bodyweightLibrary,
  back: ['exerciseKettlebellRow', 'exerciseBodyweightRow', 'exerciseSuperman'],
  shoulders: ['exerciseKettlebellPress', 'exercisePikePushup', 'exerciseShoulderTap'],
  biceps: ['exerciseCurl', 'exerciseInvertedRow', 'exerciseSelfResistedCurl'],
  hamstrings: ['exerciseRdl', 'exerciseKettlebellSwing', 'exerciseGoodMorning'],
  glutes: ['exerciseKettlebellSwing', 'exerciseGluteBridge', 'exerciseReverseLunge'],
};

const gymLibrary: ExerciseLibrary = {
  chest: ['exerciseBench', 'exerciseInclineBench', 'exerciseCableFly'],
  back: ['exerciseLatPulldown', 'exerciseRow', 'exercisePullup'],
  shoulders: ['exerciseShoulderPress', 'exerciseLateralRaise', 'exerciseFacePull'],
  biceps: ['exerciseCurl', 'exerciseHammerCurl', 'exerciseCableCurl'],
  triceps: ['exerciseTriceps', 'exerciseOverheadTriceps', 'exerciseCloseGripBench'],
  core: ['exercisePlank', 'exerciseCableCrunch', 'exerciseDeadBug'],
  quadriceps: ['exerciseSquat', 'exerciseLegPress', 'exerciseSplitSquat'],
  hamstrings: ['exerciseRdl', 'exerciseLegCurl', 'exerciseGoodMorning'],
  glutes: ['exerciseHipThrust', 'exerciseRdl', 'exerciseGluteBridge'],
  calves: ['exerciseCalfRaise', 'exerciseSeatedCalfRaise', 'exerciseLegPress'],
  other: ['exerciseMountain', 'exerciseCableCrunch', 'exercisePlank'],
};

const splitAreas: Record<number, MuscleGroup[][]> = {
  2: [
    ['chest', 'shoulders', 'triceps', 'core'],
    ['back', 'biceps', 'quadriceps', 'hamstrings', 'glutes', 'calves'],
  ],
  3: [
    ['chest', 'shoulders', 'triceps'],
    ['back', 'biceps', 'core'],
    ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  ],
  4: [
    ['chest', 'shoulders', 'triceps'],
    ['quadriceps', 'hamstrings', 'glutes', 'calves'],
    ['back', 'biceps', 'core'],
    ['chest', 'back', 'shoulders', 'core'],
  ],
  5: [
    ['chest', 'shoulders', 'triceps'],
    ['back', 'biceps', 'core'],
    ['quadriceps', 'hamstrings', 'glutes', 'calves'],
    ['chest', 'back', 'shoulders'],
    ['quadriceps', 'hamstrings', 'glutes', 'core'],
  ],
  6: [
    ['chest', 'shoulders', 'triceps'],
    ['back', 'biceps', 'core'],
    ['quadriceps', 'hamstrings', 'glutes', 'calves'],
    ['chest', 'shoulders', 'core'],
    ['back', 'biceps', 'triceps'],
    ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  ],
};

const splitNames: TranslationKey[] = [
  'workoutPushDay',
  'workoutPullDay',
  'workoutLegDay',
  'workoutUpperDay',
  'workoutLowerDay',
  'workoutFullBody',
];

function equipmentText(profile: Profile) {
  return (profile.equipmentDetails ?? '').toLocaleLowerCase();
}

function chooseLibrary(profile: Profile): ExerciseLibrary {
  if (profile.equipment === 'bodyweight') return bodyweightLibrary;
  if (profile.equipment === 'gym' && profile.gymLevel !== 'basic') return gymLibrary;
  const details = equipmentText(profile);
  if (/dumbbell|dumbell|dambıl|dambil|halter|mancuerna|hantel|haltère/.test(details)) return dumbbellLibrary;
  if (/band|bant|direnç|resistance|elastique|gummiband|banda/.test(details)) return bandLibrary;
  if (/kettlebell|girya/.test(details)) return kettlebellLibrary;
  return bodyweightLibrary;
}

function preferredDayNames(profile: Profile, count: number) {
  const fallback = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return Array.from({ length: count }, (_, index) => profile.preferredDays?.[index] ?? fallback[index]);
}

export const MIN_WORKOUT_SETS = 1;
export const MAX_WORKOUT_SETS = 3;

export function clampWorkoutSets(value: number, fallback = 2) {
  const safeValue = Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(MAX_WORKOUT_SETS, Math.max(MIN_WORKOUT_SETS, safeValue));
}

export function getSharedWorkoutSets(workouts: Workout[], fallback = 2) {
  const firstExercise = workouts.flatMap((workout) => workout.exercises).find((exercise) => Number.isFinite(exercise.sets));
  return clampWorkoutSets(firstExercise?.sets ?? fallback, fallback);
}

export function normalizeWorkoutSets(workouts: Workout[], fallback = 2) {
  const sharedSets = getSharedWorkoutSets(workouts, fallback);
  return workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map((exercise) => ({ ...exercise, sets: sharedSets })),
  }));
}

export function addExerciseToPlan(workouts: Workout[], workoutId: string, name: string, sets = 3, reps = 10) {
  const trimmedName = name.trim();
  if (!trimmedName) return workouts;

  const sharedSets = getSharedWorkoutSets(workouts, clampWorkoutSets(sets));
  return normalizeWorkoutSets(workouts, sharedSets).map((workout) => workout.id === workoutId
    ? {
      ...workout,
      completed: false,
      exercises: [
        ...workout.exercises,
        {
          id: `${Date.now()}-${Math.random()}`,
          name: trimmedName,
          sets: sharedSets,
          reps: Math.max(1, Math.round(reps)),
          muscleGroup: 'other' as MuscleGroup,
          completed: false,
        },
      ],
    }
    : workout);
}

export function buildWorkoutPlan(profile: Profile): Workout[] {
  const count = Math.min(Math.max(profile.trainingDays ?? 3, 2), 6);
  const areasByDay = splitAreas[count];
  const library = chooseLibrary(profile);
  const exercisesPerArea = profile.sessionDuration && profile.sessionDuration >= 50 ? 3 : 2;
  const isBuildGoal = profile.goal === 'muscle' || profile.goal === 'weightGain';
  const isLossGoal = profile.goal === 'weightLoss' || profile.goal === 'fatLoss';
  const reps = profile.experience === 'advanced'
    ? (isBuildGoal ? 8 : 10)
    : profile.experience === 'intermediate'
      ? 10
      : isLossGoal ? 14 : 12;
  const baseSets = profile.experience === 'advanced' ? 4 : profile.experience === 'intermediate' ? 3 : 2;
  const sets = clampWorkoutSets(baseSets + (profile.sessionDuration && profile.sessionDuration >= 55 ? 1 : 0) + (profile.activity === 'high' ? 1 : 0) + (isBuildGoal ? 1 : 0));
  const days = preferredDayNames(profile, count);

  return areasByDay.map((areas, dayIndex) => {
    const exercises = areas.flatMap((muscleGroup) => library[muscleGroup].slice(0, exercisesPerArea).map((name, exerciseIndex) => ({
      id: `${dayIndex}-${muscleGroup}-${exerciseIndex}`,
      name,
      muscleGroup,
      sets,
      reps: profile.equipment === 'bodyweight' ? reps + 2 : reps,
      completed: false,
    })));
    return {
      id: `workout-${dayIndex}`,
      day: days[dayIndex],
      name: splitNames[dayIndex] ?? 'workoutFullBody',
      duration: profile.sessionDuration ?? (isBuildGoal ? 50 : 40),
      focusAreas: areas,
      completed: false,
      exercises,
    };
  });
}

export function workoutIsComplete(workout: Workout) {
  return workout.exercises.length > 0 && workout.exercises.every((exercise) => Boolean(exercise.completed));
}

/**
 * Normalize persisted workout progress after loading it from storage.
 *
 * Records written before per-exercise completion existed only had the
 * workout-level flag, so use that flag to seed every exercise exactly once.
 * Current records always derive the workout flag from the exercise flags so a
 * stale `completed: true` value cannot turn a partial workout into a complete
 * one during hydration.
 */
export function restoreWorkoutProgress(workouts: Workout[]) {
  return workouts.map((workout) => {
    const hasExerciseProgress = workout.exercises.some((exercise) => exercise.completed !== undefined);
    const exercises = workout.exercises.map((exercise) => ({
      ...exercise,
      completed: hasExerciseProgress ? Boolean(exercise.completed) : Boolean(workout.completed),
    }));

    return {
      ...workout,
      exercises,
      completed: workoutIsComplete({ ...workout, exercises }),
    };
  });
}