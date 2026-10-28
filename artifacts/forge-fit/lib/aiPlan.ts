import type { Profile, Workout } from '@/context/FitContext';
import type { TranslationKey } from '@/lib/i18n';
import type { MuscleGroup, PlanSlot } from '@/lib/workoutPlan';

/** What the AI planner sends back, after the server's shape check. */
export type AiPlanResponse = {
  nutrition?: { calories?: unknown; protein?: unknown; fat?: unknown };
  sets?: unknown;
  reps?: unknown;
  days?: { exercises?: Record<string, unknown> }[];
  note?: unknown;
};

/** The parts of an AI plan the app accepts, already checked against the local plan. */
export type AiPlan = {
  nutrition: { calories: number; protein: number; fat: number } | null;
  sets: number | null;
  reps: number | null;
  /** Per training day, per muscle group: the chosen exercise keys. */
  exercises: Partial<Record<MuscleGroup, TranslationKey[]>>[];
  note: string | null;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const finite = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/** The request body for the planner: the answers plus each day's allowed exercises with readable names. */
export function aiPlanRequestBody(profile: Profile, slots: PlanSlot[], label: (key: TranslationKey) => string, language: string) {
  return {
    language,
    profile: {
      goal: profile.goal, sex: profile.sex, age: profile.age, height: profile.height, weight: profile.weight,
      targetWeight: profile.targetWeight, activity: profile.activity, trainingDays: profile.trainingDays,
      sessionDuration: profile.sessionDuration, goalRate: profile.goalRate, diet: profile.diet,
      proteinPreference: profile.proteinPreference, experience: profile.experience, equipment: profile.equipment,
      gymLevel: profile.gymLevel, equipmentDetails: profile.equipmentDetails?.slice(0, 300),
    },
    days: slots.map((slot) => ({
      day: slot.day,
      perArea: slot.perArea,
      areas: slot.areas.map((area) => ({ area, options: (slot.candidates[area] ?? []).map((key) => ({ id: key, name: label(key) })) })),
    })),
  };
}

/**
 * Keep only what is safe to use from the planner's answer. Exercise picks must come from the
 * day's allowed list (duplicates dropped, missing picks left to the local plan), and the numbers
 * are held to sensible ranges; anything else falls back to the local calculation.
 */
export function parseAiPlan(response: AiPlanResponse, slots: PlanSlot[]): AiPlan {
  const calories = finite(response.nutrition?.calories);
  const protein = finite(response.nutrition?.protein);
  const fat = finite(response.nutrition?.fat);
  const nutrition = calories && protein && fat ? { calories: Math.round(calories), protein: Math.round(protein), fat: Math.round(fat) } : null;
  const sets = finite(response.sets);
  const reps = finite(response.reps);
  const exercises = slots.map((slot, index) => {
    const picked = response.days?.[index]?.exercises ?? {};
    const day: Partial<Record<MuscleGroup, TranslationKey[]>> = {};
    for (const area of slot.areas) {
      const allowed = slot.candidates[area] ?? [];
      const raw = Array.isArray(picked[area]) ? picked[area] as unknown[] : [];
      const keys = [...new Set(raw.filter((key): key is TranslationKey => typeof key === 'string' && allowed.includes(key as TranslationKey)))].slice(0, slot.perArea);
      if (keys.length) day[area] = keys;
    }
    return day;
  });
  const note = typeof response.note === 'string' && response.note.trim() ? response.note.trim().slice(0, 240) : null;
  return {
    nutrition,
    sets: sets === null ? null : clamp(Math.round(sets), 1, 3),
    reps: reps === null ? null : clamp(Math.round(reps), 5, 20),
    exercises,
    note,
  };
}

/**
 * Blend the AI targets into the locally calculated ones. Calories may move at most 15% from the
 * formula, protein and fat stay within 25%, and carbs fill the remaining energy.
 */
export function blendNutrition(local: { calories: number; protein: number; fat: number }, ai: AiPlan['nutrition'], minimumCalories: number) {
  if (!ai) return null;
  const calories = Math.max(minimumCalories, Math.round(clamp(ai.calories, local.calories * 0.85, local.calories * 1.15)));
  const protein = Math.round(clamp(ai.protein, local.protein * 0.75, local.protein * 1.25));
  const fat = Math.round(clamp(ai.fat, local.fat * 0.75, local.fat * 1.25));
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, fat, carbs };
}

/** Swap in the AI's exercise picks and set/rep scheme, keeping ids and everything else from the local plan. */
export function applyAiExercises(workouts: Workout[], plan: AiPlan): Workout[] {
  return workouts.map((workout, dayIndex) => {
    const picks = plan.exercises[dayIndex] ?? {};
    // Per group: the AI picks first, then the local moves it didn't already choose.
    const names = new Map<string, string[]>();
    workout.exercises.forEach((exercise) => {
      const group = exercise.muscleGroup ?? 'other';
      names.set(group, [...(names.get(group) ?? []), exercise.name]);
    });
    names.forEach((local, group) => {
      const chosen = picks[group as MuscleGroup] ?? [];
      names.set(group, [...chosen, ...local.filter((name) => !chosen.includes(name as TranslationKey))]);
    });
    const used = new Map<string, number>();
    return {
      ...workout,
      exercises: workout.exercises.map((exercise) => {
        const group = exercise.muscleGroup ?? 'other';
        const slot = used.get(group) ?? 0;
        used.set(group, slot + 1);
        return {
          ...exercise,
          name: names.get(group)?.[slot] ?? exercise.name,
          sets: plan.sets ?? exercise.sets,
          reps: plan.reps ?? exercise.reps,
        };
      }),
    };
  });
}
