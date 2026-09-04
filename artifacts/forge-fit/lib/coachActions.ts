import type { FitnessGoal, Profile, Workout } from '@/context/FitContext';

type ActionBase = { workoutId: string };

export type CoachAction =
  | (ActionBase & { type: 'add_exercise'; name: string; sets: number; reps: number })
  | (ActionBase & { type: 'remove_exercise'; exerciseId: string })
  | (ActionBase & { type: 'update_exercise'; exerciseId: string; name?: string; sets?: number; reps?: number })
  | (ActionBase & { type: 'update_workout'; day?: string; name?: string; duration?: number })
  | { type: 'update_profile'; patch: ProfilePatch }
  | { type: 'update_nutrition'; calories?: number; protein?: number; carbs?: number; fat?: number };

export type ProfilePatch = Partial<Pick<Profile, 'equipment' | 'equipmentDetails' | 'gymLevel' | 'height' | 'weight' | 'age' | 'goal' | 'sex' | 'activity' | 'trainingDays' | 'sessionDuration' | 'goalRate' | 'diet' | 'proteinPreference' | 'experience' | 'preferredDays' | 'targetWeight'>>;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isIntegerInRange = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const isNumberInRange = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const isString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 100;
const weekdays = new Set(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
const goals = new Set<FitnessGoal>(['muscle', 'weightGain', 'weightLoss', 'fatLoss', 'maintain']);
const enumValues = {
  equipment: new Set(['bodyweight', 'home', 'gym']),
  gymLevel: new Set(['basic', 'intermediate', 'full']),
  sex: new Set(['female', 'male', 'preferNot']),
  activity: new Set(['sedentary', 'light', 'moderate', 'high']),
  goalRate: new Set(['slow', 'balanced', 'fast']),
  diet: new Set(['everything', 'vegetarian', 'vegan', 'halal']),
  proteinPreference: new Set(['balanced', 'high', 'lower']),
  experience: new Set(['beginner', 'intermediate', 'advanced']),
} as const;

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
      const hasName = raw.name !== undefined;
      if (!workout || !validExercise(workout, raw.exerciseId) || (!hasSets && !hasReps && !hasName) || (hasName && !isString(raw.name)) || (hasSets && !isIntegerInRange(raw.sets, 1, 3)) || (hasReps && !isIntegerInRange(raw.reps, 1, 100))) continue;
      valid.push({ type: 'update_exercise', workoutId: raw.workoutId as string, exerciseId: raw.exerciseId as string, ...(hasName ? { name: (raw.name as string).trim() } : {}), ...(hasSets ? { sets: raw.sets as number } : {}), ...(hasReps ? { reps: raw.reps as number } : {}) });
      continue;
    }
    if (raw.type === 'update_workout') {
      const workout = validWorkout(workouts, raw.workoutId);
      const hasDay = raw.day !== undefined;
      const hasName = raw.name !== undefined;
      const hasDuration = raw.duration !== undefined;
      const dayIsAvailable = typeof raw.day === 'string' && weekdays.has(raw.day) && !workouts.some((item) => item.id !== raw.workoutId && item.day === raw.day);
      if (!workout || (!hasDay && !hasName && !hasDuration) || (hasDay && !dayIsAvailable) || (hasName && !isString(raw.name)) || (hasDuration && !isIntegerInRange(raw.duration, 15, 180))) continue;
      valid.push({ type: 'update_workout', workoutId: raw.workoutId as string, ...(hasDay ? { day: raw.day as string } : {}), ...(hasName ? { name: (raw.name as string).trim() } : {}), ...(hasDuration ? { duration: raw.duration as number } : {}) });
      continue;
    }
    if (raw.type === 'update_profile') {
      if (!isRecord(raw.patch)) continue;
      const patch = raw.patch;
      const accepted: ProfilePatch = {};
      const stringEnumFields = ['equipment', 'gymLevel', 'sex', 'activity', 'goalRate', 'diet', 'proteinPreference', 'experience'] as const;
      for (const field of stringEnumFields) {
        if (patch[field] !== undefined && enumValues[field].has(patch[field] as never)) (accepted as Record<string, unknown>)[field] = patch[field];
      }
      if (patch.goal !== undefined && goals.has(patch.goal as FitnessGoal)) accepted.goal = patch.goal as FitnessGoal;
      if (patch.equipmentDetails !== undefined && isString(patch.equipmentDetails)) accepted.equipmentDetails = patch.equipmentDetails.trim();
      if (patch.height !== undefined && isNumberInRange(patch.height, 120, 230)) accepted.height = patch.height;
      if (patch.weight !== undefined && isNumberInRange(patch.weight, 35, 250)) accepted.weight = patch.weight;
      if (patch.age !== undefined && isIntegerInRange(patch.age, 13, 100)) accepted.age = patch.age;
      if (patch.trainingDays !== undefined && isIntegerInRange(patch.trainingDays, 2, 6)) accepted.trainingDays = patch.trainingDays;
      if (patch.sessionDuration !== undefined && isIntegerInRange(patch.sessionDuration, 15, 180)) accepted.sessionDuration = patch.sessionDuration;
      if (patch.targetWeight !== undefined && isNumberInRange(patch.targetWeight, 35, 250)) accepted.targetWeight = patch.targetWeight;
      if (patch.preferredDays !== undefined && Array.isArray(patch.preferredDays) && patch.preferredDays.length >= 2 && patch.preferredDays.length <= 6 && patch.preferredDays.every((day) => typeof day === 'string' && weekdays.has(day)) && new Set(patch.preferredDays).size === patch.preferredDays.length) accepted.preferredDays = patch.preferredDays as string[];
      if (Object.keys(accepted).length === 0) continue;
      valid.push({ type: 'update_profile', patch: accepted });
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