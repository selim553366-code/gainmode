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

const weekdayKeys = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export function getWeekdayKey(date = new Date()) {
  return weekdayKeys[date.getDay()];
}

export function getWorkoutForDate(workouts: Workout[], date = new Date()) {
  const day = getWeekdayKey(date);
  return workouts.find((workout) => workout.day === day);
}

export function getWorkoutCompletionRatio(workout: Workout) {
  if (workout.exercises.length === 0) return 0;
  return workout.exercises.filter((exercise) => Boolean(exercise.completed)).length / workout.exercises.length;
}

export function getWorkoutIntensity(profile?: Pick<Profile, 'equipment'>) {
  return profile?.equipment === 'gym' ? 6.5 : profile?.equipment === 'home' ? 5.5 : 5;
}

type WorkoutExercise = Workout['exercises'][number];

function exerciseMovementFactor(exercise: WorkoutExercise) {
  const name = exercise.name.toLocaleLowerCase();
  if (/burpee|mountain|thruster|squat|lunge|split|step.?up|donkey|calf|jump/.test(name)) return 1.2;
  if (/deadlift|rdl|good.?morning|hinge|bridge|hip.?thrust|superman|snow.?angel/.test(name)) return 1.12;
  if (/push|press|dip|row|pull|bench|fly|renegade|shoulder.?tap/.test(name)) return 1.05;
  if (/plank|dead.?bug|core|russian|side.?bend/.test(name)) return 0.86;
  if (/curl|raise|kickback|concentration|lateral|front|reverse.?fly/.test(name)) return 0.8;
  if (exercise.muscleGroup === 'core') return 0.86;
  if (exercise.muscleGroup === 'quadriceps' || exercise.muscleGroup === 'hamstrings' || exercise.muscleGroup === 'glutes') return 1.12;
  return 1;
}

function usesDumbbell(exercise: WorkoutExercise) {
  return /dumbbell|dumbell|dambıl|dambil|halter|mancuerna|hantel|haltère/.test(exercise.name.toLocaleLowerCase());
}

function bodyWeightFactor(profile?: Pick<Profile, 'weight'>) {
  return profile?.weight ? Math.min(1.35, Math.max(0.75, profile.weight / 70)) : 1;
}

function exerciseCalorieWeight(exercise: WorkoutExercise, profile?: Pick<Profile, 'weight' | 'dumbbellWeightKg'>) {
  const volume = Math.max(1, Number(exercise.sets) || 1) * Math.max(1, Number(exercise.reps) || 1);
  const dumbbellLoadFactor = usesDumbbell(exercise) && profile?.dumbbellWeightKg
    ? 1 + Math.min(0.35, Math.max(0, profile.dumbbellWeightKg) / 40)
    : 1;
  return exerciseMovementFactor(exercise) * Math.sqrt(volume / 24) * dumbbellLoadFactor;
}

/**
 * Estimate calories for one movement from its volume, movement pattern and dumbbell load.
 * The workout duration is distributed by each movement's relative effort so the
 * completed movement total remains aligned with the workout-level intensity model.
 */
export function estimateExerciseCalories(workout: Workout, exercise: WorkoutExercise, profile?: Pick<Profile, 'equipment' | 'weight' | 'dumbbellWeightKg'>) {
  if (workout.exercises.length === 0) return 0;
  const duration = Number.isFinite(workout.duration) ? Math.max(0, workout.duration) : 0;
  const totalEffort = workout.exercises.reduce((sum, item) => sum + exerciseCalorieWeight(item, profile), 0);
  if (totalEffort <= 0) return 0;
  const dumbbellExerciseRatio = workout.exercises.filter(usesDumbbell).length / workout.exercises.length;
  const dumbbellLoadFactor = profile?.dumbbellWeightKg && dumbbellExerciseRatio > 0
    ? 1 + Math.min(0.2, Math.max(0, profile.dumbbellWeightKg) / 60) * dumbbellExerciseRatio
    : 1;
  return Math.max(1, Math.round(duration * getWorkoutIntensity(profile) * bodyWeightFactor(profile) * dumbbellLoadFactor * (exerciseCalorieWeight(exercise, profile) / totalEffort)));
}

export function estimateWorkoutCalories(workout: Workout, profile?: Pick<Profile, 'equipment' | 'weight' | 'dumbbellWeightKg'>) {
  return workout.exercises.reduce((total, exercise) => (
    total + (exercise.completed ? estimateExerciseCalories(workout, exercise, profile) : 0)
  ), 0);
}

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
  chest: ['exerciseDumbbellBenchPress', 'exerciseInclineDumbbellPress', 'exerciseDumbbellFloorPress', 'exerciseDumbbellFly'],
  back: ['exerciseOneArmDumbbellRow', 'exerciseBentOverDumbbellRow', 'exerciseRenegadeRow', 'exerciseDumbbellReverseFly'],
  shoulders: ['exerciseDumbbellShoulderPress', 'exerciseArnoldPress', 'exerciseDumbbellLateralRaise', 'exerciseDumbbellFrontRaise'],
  biceps: ['exerciseDumbbellCurl', 'exerciseDumbbellHammerCurl', 'exerciseConcentrationCurl', 'exerciseInclineDumbbellCurl'],
  triceps: ['exerciseDumbbellOverheadTriceps', 'exerciseDumbbellKickback', 'exerciseDumbbellSkullCrusher', 'exerciseCloseGripDumbbellPress'],
  core: ['exerciseDumbbellRussianTwist', 'exerciseWeightedDeadBug', 'exerciseDumbbellSideBend'],
  quadriceps: ['exerciseGobletSquat', 'exerciseDumbbellBulgarianSplitSquat', 'exerciseDumbbellStepUp'],
  hamstrings: ['exerciseDumbbellRdl', 'exerciseSingleLegDumbbellRdl', 'exerciseDumbbellGoodMorning'],
  glutes: ['exerciseDumbbellHipThrust', 'exerciseDumbbellSumoSquat'],
  calves: ['exerciseStandingDumbbellCalfRaise', 'exerciseSeatedDumbbellCalfRaise'],
  other: ['exerciseDumbbellFarmerCarry', 'exerciseDumbbellThruster'],
};

export const dumbbellExerciseKeys = Array.from(new Set(Object.values(dumbbellLibrary).flat()));

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
    ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'core'],
    ['quadriceps', 'hamstrings', 'glutes', 'calves'],
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

const splitNames: Record<number, TranslationKey[]> = {
  2: ['workoutUpperDay', 'workoutLowerDay'],
  3: ['workoutPushDay', 'workoutPullDay', 'workoutLegDay'],
  4: ['workoutPushDay', 'workoutLegDay', 'workoutPullDay', 'workoutUpperDay'],
  5: ['workoutPushDay', 'workoutPullDay', 'workoutLegDay', 'workoutUpperDay', 'workoutLowerDay'],
  6: ['workoutPushDay', 'workoutPullDay', 'workoutLegDay', 'workoutPushDay', 'workoutPullDay', 'workoutLegDay'],
};

const lowerBodyGroups = new Set<MuscleGroup>(['quadriceps', 'hamstrings', 'glutes', 'calves']);

function inferWorkoutName(areas: MuscleGroup[], fallback: Workout['name']): Workout['name'] {
  const hasLowerBody = areas.some((area) => lowerBodyGroups.has(area));
  const hasChest = areas.includes('chest');
  const hasBack = areas.includes('back');
  const hasBiceps = areas.includes('biceps');
  const hasTriceps = areas.includes('triceps');
  const hasUpperBody = hasChest || hasBack || hasBiceps || hasTriceps || areas.includes('shoulders');

  if (hasLowerBody && hasUpperBody) return 'workoutFullBody';
  if (hasLowerBody) return fallback === 'workoutLowerDay' ? 'workoutLowerDay' : 'workoutLegDay';
  if (hasChest && hasBack) return 'workoutUpperDay';
  if (hasChest && !hasBack && !hasBiceps) return 'workoutPushDay';
  if (hasBack && !hasChest) return 'workoutPullDay';
  return fallback;
}

function equipmentText(profile: Profile) {
  return `${profile.equipmentDetails ?? ''} ${profile.dumbbellWeightKg ? 'dumbbell' : ''}`.toLocaleLowerCase();
}

function prioritizeDumbbellLibrary(preferred: TranslationKey[]): ExerciseLibrary {
  const preferredSet = new Set(preferred);
  return Object.fromEntries(Object.entries(dumbbellLibrary).map(([group, exercises]) => [
    group,
    [...exercises.filter((exercise) => preferredSet.has(exercise)), ...exercises.filter((exercise) => !preferredSet.has(exercise))],
  ])) as ExerciseLibrary;
}

function chooseDumbbellLibrary(profile: Profile) {
  const details = equipmentText(profile);
  const preferred: TranslationKey[] = [];

  if (/bench|bank|sehpa|banc|banco/.test(details)) {
    preferred.push('exerciseDumbbellBenchPress', 'exerciseInclineDumbbellPress', 'exerciseDumbbellFly', 'exerciseInclineDumbbellCurl', 'exerciseDumbbellSkullCrusher');
  }
  if (/single|one dumbbell|tek damb|tek dumb|einzel|seul|una mancuerna/.test(details)) {
    preferred.push('exerciseOneArmDumbbellRow', 'exerciseGobletSquat', 'exerciseConcentrationCurl', 'exerciseDumbbellOverheadTriceps', 'exerciseDumbbellSideBend');
  }
  if (/light|hafif|leicht|léger|liger/.test(details)) {
    preferred.push('exerciseDumbbellLateralRaise', 'exerciseDumbbellFrontRaise', 'exerciseDumbbellReverseFly', 'exerciseDumbbellKickback', 'exerciseDumbbellCurl');
  }
  if (/adjustable|heavy|ayarlanabilir|ağır|schwer|verstellbar|lourd|réglable|pesad|ajustable/.test(details)) {
    preferred.push('exerciseDumbbellBenchPress', 'exerciseBentOverDumbbellRow', 'exerciseDumbbellRdl', 'exerciseDumbbellHipThrust', 'exerciseGobletSquat');
  }

  return prioritizeDumbbellLibrary(preferred);
}

function chooseLibrary(profile: Profile): ExerciseLibrary {
  if (profile.equipment === 'bodyweight') return bodyweightLibrary;
  const details = equipmentText(profile);
  if (profile.dumbbellWeightKg || /dumbbell|dumbell|dambıl|dambil|halter|mancuerna|hantel|haltère/.test(details)) return chooseDumbbellLibrary(profile);
  if (profile.equipment === 'gym' && profile.gymLevel !== 'basic') return gymLibrary;
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

export function sanitizeWorkoutSplits(workouts: Workout[]) {
  return workouts.map((workout) => {
    const originalFocusAreas = workout.focusAreas ?? Array.from(new Set(workout.exercises
      .map((exercise) => exercise.muscleGroup)
      .filter((muscleGroup): muscleGroup is MuscleGroup => Boolean(muscleGroup))));
    const isPushByContent = originalFocusAreas.includes('chest')
      && originalFocusAreas.includes('shoulders')
      && !originalFocusAreas.includes('back')
      && !originalFocusAreas.some((muscleGroup) => lowerBodyGroups.has(muscleGroup));
    const removeBiceps = workout.name === 'workoutPushDay' || isPushByContent;
    const exercises = removeBiceps
      ? workout.exercises.filter((exercise) => exercise.muscleGroup !== 'biceps')
      : workout.exercises;
    const focusAreas = originalFocusAreas
      .filter((muscleGroup) => !removeBiceps || muscleGroup !== 'biceps');
    const name = inferWorkoutName(focusAreas, workout.name);
    return {
      ...workout,
      name,
      focusAreas,
      exercises,
      completed: workoutIsComplete({ ...workout, name, focusAreas, exercises }),
    };
  });
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
  return buildWorkoutPlanForCycle(profile, 0);
}

function selectCycleExercises(exercises: TranslationKey[], count: number, cycle: number) {
  if (exercises.length === 0) return [];
  const offset = ((cycle % exercises.length) + exercises.length) % exercises.length;
  return Array.from({ length: count }, (_, index) => exercises[(offset + index) % exercises.length]);
}

export function buildWorkoutPlanForCycle(profile: Profile, cycle: number): Workout[] {
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
    const exercises = areas.flatMap((muscleGroup) => selectCycleExercises(library[muscleGroup], exercisesPerArea, cycle).map((name, exerciseIndex) => ({
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
      name: splitNames[count]?.[dayIndex] ?? 'workoutFullBody',
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

export function workoutsAreComplete(workouts: Workout[]) {
  return workouts.length > 0 && workouts.every(workoutIsComplete);
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