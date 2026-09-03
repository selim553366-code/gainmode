import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Language, TranslationKey } from '@/lib/i18n';
import { useSubscription } from '@/lib/revenuecat';
import { NotificationSettingKey, NotificationSettings, syncFitnessNotifications } from '@/lib/notifications';
import { getCurrentMonthKey } from '@/lib/profileEdit';
import { localDateKey } from '@/lib/nutritionDates';
import { addStreakActivity, normalizeStreakDates } from '@/lib/streak';
import { addExerciseToPlan, buildWorkoutPlan, clampWorkoutSets, getSharedWorkoutSets, normalizeWorkoutSets, restoreWorkoutProgress, workoutIsComplete, type MuscleGroup } from '@/lib/workoutPlan';
import { TEST_PREMIUM_PROMO_STORAGE_KEY } from '@/lib/testPremiumPromo';

export type Meal = { id: string; name: string; type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; calories: number; protein: number; carbs: number; fat: number; imageUri?: string; date?: string };
export type Equipment = 'bodyweight' | 'home' | 'gym';
export type GymLevel = 'basic' | 'intermediate' | 'full';
export type FitnessGoal = 'muscle' | 'weightGain' | 'weightLoss' | 'fatLoss' | 'maintain';
export type BiologicalSex = 'female' | 'male' | 'preferNot';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high';
export type GoalRate = 'slow' | 'balanced' | 'fast';
export type DietPreference = 'everything' | 'vegetarian' | 'vegan' | 'halal';
export type ProteinPreference = 'balanced' | 'high' | 'lower';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Profile = {
  equipment: Equipment;
  equipmentDetails?: string;
  gymLevel?: GymLevel;
  height: number;
  weight: number;
  age: number;
  birthDate?: string;
  goal: FitnessGoal;
  sex?: BiologicalSex;
  activity?: ActivityLevel;
  trainingDays?: number;
  sessionDuration?: number;
  goalRate?: GoalRate;
  diet?: DietPreference;
  proteinPreference?: ProteinPreference;
  experience?: ExperienceLevel;
  preferredDays?: string[];
  targetWeight?: number;
};
export type Workout = { id: string; day: string; name: string; duration: number; focusAreas?: MuscleGroup[]; exercises: { id: string; name: string; sets: number; reps: number; muscleGroup?: MuscleGroup; completed?: boolean }[]; completed: boolean };
export type { MuscleGroup } from '@/lib/workoutPlan';
export type GoalProjection = {
  goal: FitnessGoal;
  direction: 'loss' | 'gain' | 'maintain';
  startWeightKg: number;
  targetWeightKg: number;
  weeklyChangeKg: number;
  estimatedWeeks: number;
  estimatedMonths: number;
  dailyCalorieGap: number;
  weeklyWorkoutMinutes: number;
};
export type Friend = { id: string; username: string };
export type Challenge = { id: string; name: string; target: number; progress: number };
type FitState = {
  version: number;
  language: Language;
  meals: Meal[];
  weight: number | null;
  calorieGoal: number | null;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;
  goalWeight: number | null;
  goalProjection: GoalProjection | null;
  profile: Profile | null;
  username: string | null;
  onboardingComplete: boolean;
  coachIntroPending: boolean;
  introSeen: boolean;
  isPremium: boolean;
  coachMessagesUsed: number;
  photoAnalysesUsed: number;
  usageDate: string;
  workouts: Workout[];
  streakDates: string[];
  friends: Friend[];
  challenges: Challenge[];
  weightLogs: { id: string; value: number; date: string }[];
  notificationSettings: NotificationSettings;
  profileEditUsedMonth: string | null;
};

type FitContextValue = FitState & {
  coachThinking: boolean;
  setCoachThinking: (value: boolean) => void;
  enablePremium: () => void;
  enableTestPremium: () => void;
  setLanguage: (language: Language) => void;
  restartOnboarding: () => void;
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  removeMeal: (id: string) => void;
  completeOnboarding: (profile: Profile, username: string, options?: { profileEdit?: boolean }) => void;
  markCoachIntroSeen: () => void;
  setIntroSeen: () => void;
  incrementCoachUsage: () => void;
  incrementPhotoUsage: () => void;
  toggleWorkout: (id: string) => void;
  toggleExercise: (workoutId: string, exerciseId: string) => void;
  addExercise: (workoutId: string, name: string, sets?: number, reps?: number) => void;
  removeExercise: (workoutId: string, exerciseId: string) => void;
  updateExercise: (workoutId: string, exerciseId: string, patch: { sets?: number; reps?: number }) => void;
  updateNutritionGoals: (patch: { calories?: number; protein?: number; carbs?: number; fat?: number }) => void;
  addFriend: (username: string) => void;
  addChallenge: (name: string, target: number) => void;
  addWeight: (value: number) => void;
  setNotificationSetting: (key: NotificationSettingKey, enabled: boolean) => void;
};

const initialState: FitState = {
  version: 5,
  language: 'tr',
  weight: null,
  calorieGoal: null,
  proteinGoal: null,
  carbsGoal: null,
  fatGoal: null,
  goalWeight: null,
  goalProjection: null,
  profile: null,
  username: null,
  onboardingComplete: false,
  coachIntroPending: false,
  introSeen: false,
  isPremium: false,
  coachMessagesUsed: 0,
  photoAnalysesUsed: 0,
  usageDate: '',
  workouts: [],
  streakDates: [],
  friends: [],
  challenges: [],
  weightLogs: [],
  meals: [],
  notificationSettings: {
    workoutReminder: false,
    waterReminder: false,
    mealReminder: false,
    coachCheckIn: false,
    weeklySummary: false,
  },
  profileEditUsedMonth: null,
};

const FitContext = createContext<FitContextValue | null>(null);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const roundKg = (value: number) => Math.round(value * 10) / 10;
const recordStreakActivity = (current: FitState) => ({ ...current, streakDates: addStreakActivity(current.streakDates) });

export function recommendTargetWeight(profile: Pick<Profile, 'height' | 'weight' | 'age' | 'goal' | 'sex' | 'activity' | 'goalRate'>) {
  const heightMeters = profile.height / 100;
  const healthyLower = heightMeters * heightMeters * 18.5;
  const healthyUpper = heightMeters * heightMeters * 24.9;
  const paceFactor = { slow: 0.72, balanced: 0.9, fast: 1 }[profile.goalRate ?? 'balanced'];
  const activityFactor = { sedentary: 0.82, light: 0.92, moderate: 1, high: 1.06 }[profile.activity ?? 'light'];
  const ageFactor = profile.age >= 50 ? 0.78 : profile.age < 18 ? 0.68 : 1;
  const sexFactor = profile.sex === 'female' ? 0.94 : profile.sex === 'male' ? 1 : 0.97;
  const conservativeChange = Math.min(profile.weight * 0.08, (2 + profile.weight * 0.025) * paceFactor * activityFactor * ageFactor * sexFactor);

  if (profile.goal === 'weightLoss' || profile.goal === 'fatLoss') {
    const change = profile.goal === 'fatLoss' ? Math.min(profile.weight * 0.05, conservativeChange * 1.25) : conservativeChange;
    return roundKg(clamp(Math.min(profile.weight, profile.weight - change), 35, Math.min(200, healthyUpper)));
  }
  if (profile.goal === 'weightGain' || profile.goal === 'muscle') {
    const change = profile.goal === 'muscle' ? Math.min(profile.weight * 0.04, conservativeChange * 0.85) : conservativeChange;
    return roundKg(clamp(Math.max(profile.weight, profile.weight + change), Math.max(35, healthyLower), 200));
  }
  return roundKg(profile.weight);
}

function estimateMaintenanceCalories(profile: Profile) {
  const sexAdjustment = profile.sex === 'female' ? -161 : profile.sex === 'preferNot' ? -78 : 5;
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + sexAdjustment;
  const activityMultiplier = { sedentary: 1.2, light: 1.35, moderate: 1.5, high: 1.7 }[profile.activity ?? 'light'];
  return Math.max(1200, bmr * activityMultiplier);
}

export function createGoalProjection(profile: Profile, calorieGoal: number, workouts: Workout[], targetWeight = profile.targetWeight ?? recommendTargetWeight(profile)): GoalProjection {
  const direction: GoalProjection['direction'] = targetWeight < profile.weight ? 'loss' : targetWeight > profile.weight ? 'gain' : 'maintain';
  const weeklyWorkoutMinutes = workouts.reduce((total, workout) => total + workout.duration, 0);
  const workoutIntensity = profile.equipment === 'gym' ? 6.5 : profile.equipment === 'home' ? 5.5 : 5;
  const dailyWorkoutCalories = (weeklyWorkoutMinutes * workoutIntensity) / 7;
  const energyGap = estimateMaintenanceCalories(profile) + dailyWorkoutCalories - calorieGoal;
  const dailyCalorieGap = Math.round(Math.abs(energyGap));
  const targetDelta = Math.abs(targetWeight - profile.weight);
  const pace = profile.goalRate ?? 'balanced';
  const maxWeeklyFraction = direction === 'loss'
    ? { slow: 0.005, balanced: 0.0075, fast: 0.01 }[pace]
    : direction === 'gain'
      ? { slow: 0.0025, balanced: 0.005, fast: 0.0075 }[pace]
      : 0;
  const safeWeeklyLimit = profile.weight * maxWeeklyFraction;
  const energyBasedChange = direction === 'loss'
    ? Math.max(0, energyGap) * 7 / 7700
    : direction === 'gain'
      ? Math.max(0, -energyGap) * 7 / 7700
      : 0;
  const weeklyChangeKg = direction === 'maintain'
    ? 0
    : roundKg(clamp(Math.max(energyBasedChange, 0.05), 0.05, safeWeeklyLimit));
  const estimatedWeeks = direction === 'maintain'
    ? ({ slow: 12, balanced: 8, fast: 6 }[pace])
    : Math.max(1, Math.ceil(targetDelta / weeklyChangeKg));
  return {
    goal: profile.goal,
    direction,
    startWeightKg: roundKg(profile.weight),
    targetWeightKg: roundKg(targetWeight),
    weeklyChangeKg,
    estimatedWeeks,
    estimatedMonths: Math.max(1, Math.round(estimatedWeeks / 4.345)),
    dailyCalorieGap,
    weeklyWorkoutMinutes,
  };
}

export function FitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FitState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [coachThinking, setCoachThinking] = useState(false);
  const [testPromoUnlocked, setTestPromoUnlocked] = useState(false);
  const { isSubscribed } = useSubscription();

  useEffect(() => {
    AsyncStorage.getItem('forge-fit-state').then((stored) => {
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FitState> & { water?: unknown; hydrationGoal?: unknown };
        if (parsed.version === initialState.version || parsed.version === 4 || parsed.version === 3) {
          const { water: _legacyWater, hydrationGoal: _legacyHydrationGoal, ...storedState } = parsed;
          const merged = {
            ...initialState,
            ...storedState,
             // Premium access must come from RevenueCat, never from a locally persisted test flag.
             isPremium: false,
            notificationSettings: { ...initialState.notificationSettings, ...(parsed.notificationSettings ?? {}) },
             streakDates: normalizeStreakDates(Array.isArray(parsed.streakDates) ? parsed.streakDates : []),
            version: initialState.version,
          };
           const restoredWorkouts = normalizeWorkoutSets(restoreWorkoutProgress(merged.workouts));
          const needsWorkoutUpgrade = merged.profile && merged.workouts.length > 0 && merged.workouts.some((workout) => (
            !workout.focusAreas?.length || workout.exercises.some((exercise) => !exercise.muscleGroup)
          ));
          if (needsWorkoutUpgrade && merged.profile) {
            const previousWorkouts = new Map(restoredWorkouts.map((workout) => [workout.id, workout]));
            merged.workouts = buildWorkoutPlan(merged.profile).map((workout) => {
              const previous = previousWorkouts.get(workout.id);
              if (!previous) return workout;
              const exercises = workout.exercises.map((exercise) => ({ ...exercise, completed: previous.completed }));
              return { ...workout, exercises, completed: workoutIsComplete({ ...workout, exercises }) };
            });
          } else {
            merged.workouts = restoredWorkouts;
          }
          if (!merged.goalProjection && merged.profile && merged.calorieGoal) {
            merged.goalProjection = createGoalProjection(merged.profile, merged.calorieGoal, merged.workouts, merged.goalWeight ?? undefined);
          }
          const today = localDateKey();
          setState(merged.usageDate === today ? merged : { ...merged, usageDate: today, coachMessagesUsed: 0, photoAnalysesUsed: 0 });
        }
      }
      setHydrated(true);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(TEST_PREMIUM_PROMO_STORAGE_KEY).then((value) => {
      if (value === 'true') setTestPromoUnlocked(true);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (testPromoUnlocked) AsyncStorage.setItem(TEST_PREMIUM_PROMO_STORAGE_KEY, 'true').catch(() => undefined);
  }, [testPromoUnlocked]);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem('forge-fit-state', JSON.stringify(state)).catch(() => undefined);
  }, [state, hydrated]);

  useEffect(() => {
    if (isSubscribed === undefined && !testPromoUnlocked) return;
    setState((current) => {
      const nextPremium = Boolean(isSubscribed) || testPromoUnlocked;
      return current.isPremium === nextPremium ? current : { ...current, isPremium: nextPremium };
    });
  }, [isSubscribed, testPromoUnlocked]);

  useEffect(() => {
    if (!hydrated) return;
    syncFitnessNotifications({ settings: state.notificationSettings, profile: state.profile, language: state.language }).catch((error) => {
      console.warn('Forge Fit notifications could not be synchronized.', error);
    });
  }, [hydrated, state.notificationSettings, state.profile, state.language]);

  const value = useMemo<FitContextValue>(() => ({
    ...state,
    coachThinking,
    setCoachThinking,
     enablePremium: () => setState((current) => current.isPremium ? current : { ...current, isPremium: true }),
    enableTestPremium: () => {
      setTestPromoUnlocked(true);
      setState((current) => current.isPremium ? current : { ...current, isPremium: true });
    },
    setLanguage: (language) => setState((current) => ({ ...current, language })),
    restartOnboarding: () => setState((current) => ({ ...current, onboardingComplete: false, introSeen: false, coachIntroPending: false })),
     addMeal: (meal) => setState((current) => recordStreakActivity({ ...current, meals: [...current.meals, { ...meal, date: meal.date ?? new Date().toISOString(), id: `${Date.now()}-${Math.random()}` }] })),
    removeMeal: (id) => setState((current) => {
      return { ...current, meals: current.meals.filter((item) => item.id !== id) };
    }),
    completeOnboarding: (profile, username, options) => setState((current) => {
      const currentMonth = getCurrentMonthKey();
      if (options?.profileEdit && current.profileEditUsedMonth === currentMonth) return current;
      const sexAdjustment = profile.sex === 'female' ? -161 : profile.sex === 'preferNot' ? -78 : 5;
      const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + sexAdjustment;
      const activityMultiplier = { sedentary: 1.2, light: 1.35, moderate: 1.5, high: 1.7 }[profile.activity ?? 'light'];
      const rateAdjustment = { slow: 200, balanced: 350, fast: 500 }[profile.goalRate ?? 'balanced'];
      const targetWeight = roundKg(clamp(profile.targetWeight ?? recommendTargetWeight(profile), 35, 200));
      const targetDelta = clamp(targetWeight - profile.weight, -25, 25);
      const isGainGoal = profile.goal === 'muscle' || profile.goal === 'weightGain';
      const isLossGoal = profile.goal === 'weightLoss' || profile.goal === 'fatLoss';
      const goalAdjustment = isGainGoal ? rateAdjustment : isLossGoal ? -rateAdjustment : 0;
      const targetAdjustment = isGainGoal || isLossGoal ? Math.round(targetDelta * 18) : 0;
      const trainingAdjustment = Math.round(((profile.trainingDays ?? 3) * (profile.sessionDuration ?? 45)) / 12);
      const equipmentAdjustment = profile.equipment === 'gym' ? (profile.gymLevel === 'full' ? 70 : profile.gymLevel === 'intermediate' ? 45 : 25) : profile.equipment === 'home' ? 20 : 0;
      const calorieGoal = Math.max(profile.age < 18 ? 1600 : 1200, Math.round(bmr * activityMultiplier + goalAdjustment + targetAdjustment + trainingAdjustment + equipmentAdjustment));
       const preferenceProteinMultiplier = profile.proteinPreference === 'high' ? 2.2 : profile.proteinPreference === 'lower' ? 1.4 : isGainGoal ? 1.9 : 1.6;
       const dietProteinMultiplier = profile.diet === 'vegan' ? 1.85 : profile.diet === 'vegetarian' ? 1.75 : profile.diet === 'halal' ? 1.68 : 1.6;
       const activityProteinBonus = { sedentary: -0.1, light: 0, moderate: 0.1, high: 0.2 }[profile.activity ?? 'light'];
       const experienceProteinBonus = { beginner: 0, intermediate: 0.05, advanced: 0.1 }[profile.experience ?? 'beginner'];
       const goalProteinBonus = isLossGoal ? 0.1 : isGainGoal ? 0.15 : 0;
       const proteinMultiplier = clamp(Math.max(preferenceProteinMultiplier, dietProteinMultiplier) + activityProteinBonus + experienceProteinBonus + goalProteinBonus, 1.4, 2.4);
       const proteinGoal = Math.round(profile.weight * proteinMultiplier);
       const fatRatio = profile.diet === 'vegan' ? 0.3 : profile.diet === 'vegetarian' ? 0.28 : isLossGoal ? (profile.goalRate === 'fast' ? 0.23 : 0.25) : isGainGoal ? 0.28 : 0.27;
      const fatGoal = Math.round((calorieGoal * fatRatio) / 9);
      const carbsGoal = Math.max(0, Math.round((calorieGoal - proteinGoal * 4 - fatGoal * 9) / 4));
      const workouts = buildWorkoutPlan(profile);
      const projection = createGoalProjection(profile, calorieGoal, workouts, targetWeight);
      return {
        ...current,
        profile,
        username,
        weight: profile.weight,
        calorieGoal,
        proteinGoal,
        carbsGoal,
        fatGoal,
        goalWeight: targetWeight,
        goalProjection: projection,
        workouts,
        onboardingComplete: true,
        coachIntroPending: options?.profileEdit ? current.coachIntroPending : true,
        profileEditUsedMonth: options?.profileEdit ? currentMonth : current.profileEditUsedMonth,
      };
    }),
    markCoachIntroSeen: () => setState((current) => current.coachIntroPending ? { ...current, coachIntroPending: false } : current),
    setIntroSeen: () => setState((current) => ({ ...current, introSeen: true })),
    incrementCoachUsage: () => setState((current) => {
      const today = new Date().toISOString().slice(0, 10);
      return current.usageDate === today ? { ...current, coachMessagesUsed: current.coachMessagesUsed + 1 } : { ...current, usageDate: today, coachMessagesUsed: 1, photoAnalysesUsed: 0 };
    }),
    incrementPhotoUsage: () => setState((current) => {
      const today = new Date().toISOString().slice(0, 10);
      return current.usageDate === today ? { ...current, photoAnalysesUsed: current.photoAnalysesUsed + 1 } : { ...current, usageDate: today, coachMessagesUsed: 0, photoAnalysesUsed: 1 };
    }),
     toggleWorkout: (id) => setState((current) => {
       const workouts = current.workouts.map((workout) => {
         if (workout.id !== id) return workout;
         const completed = !workout.completed;
         return { ...workout, completed, exercises: workout.exercises.map((exercise) => ({ ...exercise, completed })) };
       });
       const changedWorkout = workouts.find((workout) => workout.id === id);
       const nextState = { ...current, workouts };
       return changedWorkout?.completed ? recordStreakActivity(nextState) : nextState;
     }),
     toggleExercise: (workoutId, exerciseId) => setState((current) => {
       const workouts = current.workouts.map((workout) => {
         if (workout.id !== workoutId) return workout;
         const exercises = workout.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, completed: !exercise.completed } : exercise);
         return { ...workout, exercises, completed: workoutIsComplete({ ...workout, exercises }) };
       });
       const changedWorkout = workouts.find((workout) => workout.id === workoutId);
       const nextState = { ...current, workouts };
       return changedWorkout?.completed ? recordStreakActivity(nextState) : nextState;
     }),
     addExercise: (workoutId, name, sets = 3, reps = 10) => setState((current) => ({
       ...current,
       workouts: addExerciseToPlan(current.workouts, workoutId, name, sets, reps),
     })),
    removeExercise: (workoutId, exerciseId) => setState((current) => ({ ...current, workouts: current.workouts.map((workout) => {
      if (workout.id !== workoutId) return workout;
      const exercises = workout.exercises.filter((exercise) => exercise.id !== exerciseId);
      return { ...workout, exercises, completed: workoutIsComplete({ ...workout, exercises }) };
    }) })),
      updateExercise: (workoutId, exerciseId, patch) => setState((current) => {
        const sharedSets = patch.sets === undefined ? getSharedWorkoutSets(current.workouts) : clampWorkoutSets(patch.sets);
        const workouts = normalizeWorkoutSets(current.workouts, sharedSets).map((workout) => ({
          ...workout,
          exercises: workout.exercises.map((exercise) => exercise.id === exerciseId && workout.id === workoutId
            ? { ...exercise, ...patch, sets: sharedSets }
            : exercise),
        }));
        return { ...current, workouts };
      }),
     updateNutritionGoals: (patch) => setState((current) => {
       const nextGoals = {
         calories: patch.calories ?? current.calorieGoal,
         protein: patch.protein ?? current.proteinGoal,
         carbs: patch.carbs ?? current.carbsGoal,
         fat: patch.fat ?? current.fatGoal,
       };
       const goalProjection = current.profile && nextGoals.calories
         ? createGoalProjection(current.profile, nextGoals.calories, current.workouts, current.goalWeight ?? undefined)
         : current.goalProjection;
       return { ...current, calorieGoal: nextGoals.calories, proteinGoal: nextGoals.protein, carbsGoal: nextGoals.carbs, fatGoal: nextGoals.fat, goalProjection };
     }),
    addFriend: (username) => setState((current) => current.friends.some((friend) => friend.username.toLowerCase() === username.toLowerCase()) ? current : { ...current, friends: [...current.friends, { id: `${Date.now()}-${Math.random()}`, username }] }),
    addChallenge: (name, target) => setState((current) => ({ ...current, challenges: [...current.challenges, { id: `${Date.now()}-${Math.random()}`, name, target, progress: 0 }] })),
     addWeight: (value) => setState((current) => recordStreakActivity({ ...current, weight: value, weightLogs: [...current.weightLogs, { id: `${Date.now()}-${Math.random()}`, value, date: new Date().toISOString() }] })),
    setNotificationSetting: (key, enabled) => setState((current) => ({ ...current, notificationSettings: { ...current.notificationSettings, [key]: enabled } })),
  }), [state, coachThinking]);

  return <FitContext.Provider value={value}>{children}</FitContext.Provider>;
}

export function useFit() {
  const context = useContext(FitContext);
  if (!context) throw new Error('useFit must be used within FitProvider');
  return context;
}