import type { DumbbellWeightLog, FitnessGoal, Meal, Profile, Workout } from '@/context/FitContext';
import { localDateKey, mealDateKey } from '@/lib/nutritionDates';
import { estimateWorkoutCalories, isDumbbellExercise } from '@/lib/workoutPlan';

export type WeightOutcome = 'lost' | 'gained' | 'steady' | 'missing';

export type WeeklySummary = {
  weightChangeKg: number | null;
  currentWeightKg: number | null;
  weightOutcome: WeightOutcome;
  completedWorkouts: number;
  workoutMinutes: number;
  totalSets: number;
  totalExercises: number;
  workoutCalories: number;
  dumbbellWeightKg: number | null;
  dumbbellWeightIncreaseKg: number | null;
  dumbbellProgress: {
    workoutId: string;
    exerciseId: string;
    exerciseName: string;
    currentWeightKg: number;
    previousWeightKg: number | null;
    increaseKg: number;
    previousWeekWeightKg: number | null;
    weekIncreaseKg: number;
  }[];
  trackedCalorieDays: number;
  onTargetCalorieDays: number;
  calorieConsistency: number | null;
  weekStart: string;
  weekEnd: string;
};

function getWeekRange() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { start: localDateKey(start), end: localDateKey(end) };
}

function roundKg(value: number) {
  return Math.round(value * 10) / 10;
}

function inCurrentWeek(date: string | undefined, start: string, end: string) {
  const normalized = mealDateKey(date);
  return normalized >= start && normalized <= end;
}

function getDumbbellProgress(workouts: Workout[], history: DumbbellWeightLog[], weekStart: string, weekEnd: string) {
  return workouts.flatMap((workout) => workout.exercises
    .filter((exercise) => isDumbbellExercise(exercise) && Number.isFinite(exercise.dumbbellWeightKg) && (exercise.dumbbellWeightKg ?? 0) > 0)
    .map((exercise) => {
      const logs = history
        .filter((item) => item.workoutId === workout.id && item.exerciseId === exercise.id)
        .sort((a, b) => a.date.localeCompare(b.date));
      const previousWeightKg = logs.length > 1 ? logs[logs.length - 2].weightKg : null;
      const currentWeightKg = exercise.dumbbellWeightKg ?? 0;
      const previousWeekWeightKg = logs.filter((item) => mealDateKey(item.date) < weekStart).at(-1)?.weightKg ?? null;
      const currentWeekWeight = logs.filter((item) => {
        const date = mealDateKey(item.date);
        return date >= weekStart && date <= weekEnd;
      }).at(-1)?.weightKg ?? currentWeightKg;
      return {
        workoutId: workout.id,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        currentWeightKg,
        previousWeightKg,
        increaseKg: previousWeightKg === null ? 0 : roundKg(currentWeightKg - previousWeightKg),
        previousWeekWeightKg,
        weekIncreaseKg: previousWeekWeightKg === null ? 0 : roundKg(currentWeekWeight - previousWeekWeightKg),
      };
    }));
}

export function getWeeklySummary({
  weight,
  weightLogs,
  meals,
  workouts,
  calorieGoal,
  goal,
  profile,
  dumbbellWeightHistory,
}: {
  weight: number | null;
  weightLogs: { value: number; date: string }[];
  meals: Meal[];
  workouts: Workout[];
  calorieGoal: number | null;
  goal?: FitnessGoal;
  profile?: Pick<Profile, 'goal' | 'equipment' | 'weight' | 'dumbbellWeightKg'>;
  dumbbellWeightHistory?: DumbbellWeightLog[];
}): WeeklySummary {
  const { start, end } = getWeekRange();
  const weekWeights = weightLogs
    .filter((item) => inCurrentWeek(item.date, start, end))
    .sort((a, b) => mealDateKey(a.date).localeCompare(mealDateKey(b.date)));
  const tracksWeight = (profile?.goal ?? goal) !== 'muscle';
  const firstWeight = tracksWeight ? weekWeights[0]?.value : undefined;
  const lastWeight = tracksWeight ? weekWeights.at(-1)?.value ?? weight : null;
  const weightChangeKg = firstWeight !== undefined && lastWeight !== null && lastWeight !== undefined
    ? roundKg(lastWeight - firstWeight)
    : null;
  const weightOutcome: WeightOutcome = !tracksWeight
    ? 'missing'
    : weightChangeKg === null
      ? 'missing'
      : weightChangeKg < -0.05
        ? 'lost'
        : weightChangeKg > 0.05
          ? 'gained'
          : 'steady';

  const completedWorkouts = workouts.filter((item) => item.completed);
  const workoutMinutes = completedWorkouts.reduce((sum, item) => sum + item.duration, 0);
  const totalSets = completedWorkouts.reduce((sum, item) => sum + item.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.sets, 0), 0);
  const totalExercises = completedWorkouts.reduce((sum, item) => sum + item.exercises.length, 0);
  const workoutCalories = profile
    ? completedWorkouts.reduce((sum, workout) => sum + estimateWorkoutCalories(workout, profile), 0)
    : 0;
  const dumbbellProgress = getDumbbellProgress(workouts, dumbbellWeightHistory ?? [], start, end);
  const dumbbellWeights = dumbbellProgress.map((item) => item.currentWeightKg);
  const dumbbellWeightKg = dumbbellWeights.length > 0
    ? Math.max(...dumbbellWeights)
    : profile?.equipment !== 'bodyweight' ? profile?.dumbbellWeightKg ?? null : null;
  const dumbbellIncreases = dumbbellProgress.map((item) => item.weekIncreaseKg).filter((value) => value > 0);

  const caloriesByDay = new Map<string, number>();
  meals.forEach((meal) => {
    const date = mealDateKey(meal.date);
    if (date >= start && date <= end) caloriesByDay.set(date, (caloriesByDay.get(date) ?? 0) + meal.calories);
  });
  const trackedCalorieDays = caloriesByDay.size;
  const onTargetCalorieDays = calorieGoal
    ? [...caloriesByDay.values()].filter((total) => total >= calorieGoal * 0.8 && total <= calorieGoal * 1.2).length
    : 0;

  return {
    weightChangeKg,
    currentWeightKg: lastWeight ?? null,
    weightOutcome,
    completedWorkouts: completedWorkouts.length,
    workoutMinutes,
    totalSets,
    totalExercises,
    workoutCalories,
    dumbbellWeightKg,
    dumbbellWeightIncreaseKg: dumbbellIncreases.length > 0 ? Math.max(...dumbbellIncreases) : null,
    dumbbellProgress,
    trackedCalorieDays,
    onTargetCalorieDays,
    calorieConsistency: calorieGoal && trackedCalorieDays > 0 ? Math.round((onTargetCalorieDays / trackedCalorieDays) * 100) : null,
    weekStart: start,
    weekEnd: end,
  };
}