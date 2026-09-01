import type { Workout } from '@/context/FitContext';

type ActionBase = { workoutId: string };

export type CoachAction =
  | (ActionBase & { type: 'add_exercise'; name: string; sets: number; reps: number })
  | (ActionBase & { type: 'remove_exercise'; exerciseId: string })
  | (ActionBase & { type: 'update_exercise'; exerciseId: string; sets?: number; reps?: number })
  | { type: 'update_nutrition'; calories?: number; protein?: number; carbs?: number; fat?: number };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isIntegerInRange = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const isString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 100;

function validWorkout(workouts: Workout[], id: unknown) {
  return typeof id === 'string' ? workouts.find((workout) => workout.id === id) : undefined;
}

function validExercise(workout: Workout | undefined, id: unknown) {
  return typeof id === 'string' ? workout?.exercises.find((exercise) => exercise.id === id) : undefined;
}

export function validateCoachActions(rawActions: unknown, workouts: Workout[]): CoachAction[] {
  if (!Array.isArray(rawActions)) return [];
  const valid: CoachAction[] = [];
  for (const raw of rawActions.slice(0, 6)) {
    if (!isRecord(raw) || typeof raw.type !== 'string') continue;
    if (raw.type === 'add_exercise') {
      if (!validWorkout(workouts, raw.workoutId) || !isString(raw.name) || !isIntegerInRange(raw.sets, 1, 3) || !isIntegerInRange(raw.reps, 1, 100)) continue;
      valid.push({ type: 'add_exercise', workoutId: raw.workoutId as string, name: raw.name.trim(), sets: raw.sets, reps: raw.reps });
      continue;
    }
    if (raw.type === 'remove_exercise') {
      const workout = validWorkout(workouts, raw.workoutId);
      if (!workout || !validExercise(workout, raw.exerciseId)) continue;
      valid.push({ type: 'remove_exercise', workoutId: raw.workoutId as string, exerciseId: raw.exerciseId as string });
      continue;
    }
    if (raw.type === 'update_exercise') {
      const workout = validWorkout(workouts, raw.workoutId);
      const hasSets = raw.sets !== undefined;
      const hasReps = raw.reps !== undefined;
      if (!workout || !validExercise(workout, raw.exerciseId) || (!hasSets && !hasReps) || (hasSets && !isIntegerInRange(raw.sets, 1, 3)) || (hasReps && !isIntegerInRange(raw.reps, 1, 100))) continue;
      valid.push({ type: 'update_exercise', workoutId: raw.workoutId as string, exerciseId: raw.exerciseId as string, ...(hasSets ? { sets: raw.sets as number } : {}), ...(hasReps ? { reps: raw.reps as number } : {}) });
      continue;
    }
    if (raw.type === 'update_nutrition') {
      const fields = ['calories', 'protein', 'carbs', 'fat'] as const;
      const hasField = fields.some((field) => raw[field] !== undefined);
      if (!hasField) continue;
      if (raw.calories !== undefined && !isIntegerInRange(raw.calories, 1000, 6000)) continue;
      if (raw.protein !== undefined && !isIntegerInRange(raw.protein, 30, 400)) continue;
      if (raw.carbs !== undefined && !isIntegerInRange(raw.carbs, 30, 800)) continue;
      if (raw.fat !== undefined && !isIntegerInRange(raw.fat, 20, 250)) continue;
      valid.push({
        type: 'update_nutrition',
        ...(raw.calories !== undefined ? { calories: raw.calories as number } : {}),
        ...(raw.protein !== undefined ? { protein: raw.protein as number } : {}),
        ...(raw.carbs !== undefined ? { carbs: raw.carbs as number } : {}),
        ...(raw.fat !== undefined ? { fat: raw.fat as number } : {}),
      });
    }
  }
  return valid;
}