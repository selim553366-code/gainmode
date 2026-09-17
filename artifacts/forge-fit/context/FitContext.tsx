import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { Language, TranslationKey } from '@/lib/i18n';
import { PREVIEW_SUBSCRIPTION_ACTIVE, useSubscription } from '@/lib/revenuecat';
import { NotificationSettingKey, NotificationSettings, syncFitnessNotifications } from '@/lib/notifications';
import { getCurrentMonthKey } from '@/lib/profileEdit';
import { localDateKey } from '@/lib/nutritionDates';
import { addStreakActivity, getCurrentStreak, normalizeStreakDates } from '@/lib/streak';
import { badges, type BadgeMetric } from '@/lib/badges';
import { addExerciseToPlan, buildWorkoutPlanForCycle, clampWorkoutSets, getSharedWorkoutSets, getWorkoutIntensity, normalizeWorkoutSets, restoreWorkoutProgress, sanitizeWorkoutSplits, workoutIsComplete, workoutsAreComplete, type MuscleGroup } from '@/lib/workoutPlan';

export type Meal = { id: string; name: string; type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; calories: number; protein: number; carbs: number; fat: number; imageUri?: string; date?: string };
export type SavedMeal = Omit<Meal, 'date'> & { savedAt: string };
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
  dumbbellWeightKg?: number;
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
export type DumbbellWeightLog = {
  id: string;
  workoutId: string;
  exerciseId: string;
  weightKg: number;
  date: string;
};
export type Workout = {
  id: string;
  day: string;
  name: string;
  duration: number;
  focusAreas?: MuscleGroup[];
  exercises: {
    id: string;
    name: string;
    sets: number;
    reps: number;
    muscleGroup?: MuscleGroup;
    completed?: boolean;
    dumbbellWeightKg?: number;
  }[];
  completed: boolean;
};
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
  accountId: string;
  language: Language;
  meals: Meal[];
  savedMeals: SavedMeal[];
  weight: number | null;
  calorieGoal: number | null;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;
  goalWeight: number | null;
  goalProjection: GoalProjection | null;
  profile: Profile | null;
  username: string | null;
  registeredAt: string | null;
  onboardingComplete: boolean;
  coachIntroPending: boolean;
  introSeen: boolean;
  isPremium: boolean;
  coachMessagesUsed: number;
  photoAnalysesUsed: number;
  usageDate: string;
  workouts: Workout[];
  workoutCycle: number;
  workoutCycleReady: boolean;
  streakDates: string[];
  friends: Friend[];
  challenges: Challenge[];
  weightLogs: { id: string; value: number; date: string }[];
  dumbbellWeightHistory: DumbbellWeightLog[];
  notificationSettings: NotificationSettings;
  profileEditUsedMonth: string | null;
  dailyMoodCompletedDate: string | null;
  achievementStats: {
    workouts: number;
    minutes: number;
    exercises: number;
    meals: number;
    weightLogs: number;
  };
  unlockedBadgeIds: string[];
};

function createLocalAccountId() {
  return `account-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function localUsageHourKey(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}`;
}

type FitContextValue = FitState & {
  hydrated: boolean;
  coachThinking: boolean;
  setCoachThinking: (value: boolean) => void;
  enablePremium: () => void;
  setLanguage: (language: Language) => void;
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  removeMeal: (id: string) => void;
  addSavedMeal: (meal: Omit<SavedMeal, 'id' | 'savedAt'>) => void;
  removeSavedMeal: (id: string) => void;
  completeOnboarding: (profile: Profile, username: string, options?: { profileEdit?: boolean }) => void;
  markCoachIntroSeen: () => void;
  setIntroSeen: () => void;
  incrementCoachUsage: () => void;
  incrementPhotoUsage: () => void;
  toggleWorkout: (id: string) => void;
  toggleExercise: (workoutId: string, exerciseId: string) => void;
  refreshWorkoutCycleIfReady: (firstDay?: string) => void;
  addExercise: (workoutId: string, name: string, sets?: number, reps?: number) => void;
  removeExercise: (workoutId: string, exerciseId: string) => void;
  updateExercise: (workoutId: string, exerciseId: string, patch: { name?: string; sets?: number; reps?: number; dumbbellWeightKg?: number | null }) => void;
  updateWorkout: (workoutId: string, patch: { day?: string; name?: string; duration?: number }) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  updateNutritionGoals: (patch: { calories?: number; protein?: number; carbs?: number; fat?: number }) => void;
  addFriend: (username: string) => void;
  addChallenge: (name: string, target: number) => void;
  addWeight: (value: number) => void;
  setNotificationSetting: (key: NotificationSettingKey, enabled: boolean) => void;
  completeDailyMood: () => void;
};

const initialState: FitState = {
  version: 5,
  accountId: createLocalAccountId(),
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
  registeredAt: null,
  onboardingComplete: false,
  coachIntroPending: false,
  introSeen: false,
  isPremium: PREVIEW_SUBSCRIPTION_ACTIVE,
  coachMessagesUsed: 0,
  photoAnalysesUsed: 0,
  usageDate: '',
  workouts: [],
  workoutCycle: 0,
  workoutCycleReady: false,
  savedMeals: [],
  streakDates: [],
  friends: [],
  challenges: [],
  weightLogs: [],
  dumbbellWeightHistory: [],
  meals: [],
  notificationSettings: {
    workoutReminder: true,
    waterReminder: true,
    mealReminder: true,
    coachCheckIn: true,
    weeklySummary: true,
  },
  profileEditUsedMonth: null,
  dailyMoodCompletedDate: null,
  achievementStats: { workouts: 0, minutes: 0, exercises: 0, meals: 0, weightLogs: 0 },
  unlockedBadgeIds: [],
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

function calculateNutritionGoals(profile: Profile, workouts: Workout[]) {
  const sexAdjustment = profile.sex === 'female' ? -161 : profile.sex === 'preferNot' ? -78 : 5;
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + sexAdjustment;
  const activityMultiplier = { sedentary: 1.2, light: 1.35, moderate: 1.5, high: 1.7 }[profile.activity ?? 'light'];
  const rateAdjustment = { slow: 200, balanced: 350, fast: 500 }[profile.goalRate ?? 'balanced'];
  const isGainGoal = profile.goal === 'muscle' || profile.goal === 'weightGain';
  const isLossGoal = profile.goal === 'weightLoss' || profile.goal === 'fatLoss';
  const targetWeight = roundKg(clamp(profile.targetWeight ?? recommendTargetWeight(profile), 35, 200));
  const targetDelta = clamp(targetWeight - profile.weight, -25, 25);
  const goalAdjustment = isGainGoal ? rateAdjustment : isLossGoal ? -rateAdjustment : 0;
  const targetAdjustment = isGainGoal || isLossGoal ? Math.round(targetDelta * 18) : 0;
  const trainingAdjustment = Math.round(((profile.trainingDays ?? 3) * (profile.sessionDuration ?? 45)) / 12);
  const equipmentAdjustment = profile.equipment === 'gym' ? (profile.gymLevel === 'full' ? 70 : profile.gymLevel === 'intermediate' ? 45 : 25) : profile.equipment === 'home' ? 20 : 0;
  const calories = Math.max(profile.age < 18 ? 1600 : 1200, Math.round(bmr * activityMultiplier + goalAdjustment + targetAdjustment + trainingAdjustment + equipmentAdjustment));
  const preferenceProteinMultiplier = profile.proteinPreference === 'high' ? 2.2 : profile.proteinPreference === 'lower' ? 1.4 : isGainGoal ? 1.9 : 1.6;
  const dietProteinMultiplier = profile.diet === 'vegan' ? 1.85 : profile.diet === 'vegetarian' ? 1.75 : profile.diet === 'halal' ? 1.68 : 1.6;
  const activityProteinBonus = { sedentary: -0.1, light: 0, moderate: 0.1, high: 0.2 }[profile.activity ?? 'light'];
  const experienceProteinBonus = { beginner: 0, intermediate: 0.05, advanced: 0.1 }[profile.experience ?? 'beginner'];
  const proteinGoal = Math.round(profile.weight * clamp(Math.max(preferenceProteinMultiplier, dietProteinMultiplier) + activityProteinBonus + experienceProteinBonus + (isLossGoal ? 0.1 : isGainGoal ? 0.15 : 0), 1.4, 2.4));
  const fatRatio = profile.diet === 'vegan' ? 0.3 : profile.diet === 'vegetarian' ? 0.28 : isLossGoal ? (profile.goalRate === 'fast' ? 0.23 : 0.25) : isGainGoal ? 0.28 : 0.27;
  const fat = Math.round((calories * fatRatio) / 9);
  return { calories, protein: proteinGoal, fat, carbs: Math.max(0, Math.round((calories - proteinGoal * 4 - fat * 9) / 4)), targetWeight, projection: createGoalProjection(profile, calories, workouts, targetWeight) };
}

export function createGoalProjection(profile: Profile, calorieGoal: number, workouts: Workout[], targetWeight = profile.targetWeight ?? recommendTargetWeight(profile)): GoalProjection {
  const direction: GoalProjection['direction'] = targetWeight < profile.weight ? 'loss' : targetWeight > profile.weight ? 'gain' : 'maintain';
  const weeklyWorkoutMinutes = workouts.reduce((total, workout) => total + workout.duration, 0);
  const workoutIntensity = getWorkoutIntensity(profile);
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
  const { isSubscribed } = useSubscription();

  useEffect(() => {
    AsyncStorage.getItem('forge-fit-state').then((stored) => {
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FitState> & { water?: unknown; hydrationGoal?: unknown };
        if (parsed.version === initialState.version || parsed.version === 5 || parsed.version === 4 || parsed.version === 3) {
          const { water: _legacyWater, hydrationGoal: _legacyHydrationGoal, ...storedState } = parsed;
          const merged = {
            ...initialState,
            ...storedState,
            accountId: typeof parsed.accountId === 'string' && parsed.accountId.trim() ? parsed.accountId : initialState.accountId,
            registeredAt: typeof parsed.registeredAt === 'string'
              ? parsed.registeredAt
              : parsed.onboardingComplete
                ? new Date().toISOString()
                : null,
             // Preview access is web-only; native access still comes from RevenueCat.
             isPremium: PREVIEW_SUBSCRIPTION_ACTIVE,
            notificationSettings: initialState.notificationSettings,
             savedMeals: Array.isArray(parsed.savedMeals) ? parsed.savedMeals : [],
             streakDates: normalizeStreakDates(Array.isArray(parsed.streakDates) ? parsed.streakDates : []),
             unlockedBadgeIds: Array.isArray(parsed.unlockedBadgeIds) ? parsed.unlockedBadgeIds : [],
             dumbbellWeightHistory: Array.isArray(parsed.dumbbellWeightHistory)
               ? parsed.dumbbellWeightHistory.filter((item): item is DumbbellWeightLog => (
                 Boolean(item)
                 && typeof item === 'object'
                 && typeof (item as DumbbellWeightLog).workoutId === 'string'
                 && typeof (item as DumbbellWeightLog).exerciseId === 'string'
                 && Number.isFinite((item as DumbbellWeightLog).weightKg)
                 && typeof (item as DumbbellWeightLog).date === 'string'
               ))
               : [],
            version: initialState.version,
          };
           const restoredWorkouts = sanitizeWorkoutSplits(normalizeWorkoutSets(restoreWorkoutProgress(merged.workouts)));
           merged.workoutCycle = Number.isInteger(parsed.workoutCycle) ? Math.max(0, Number(parsed.workoutCycle)) : 0;
           merged.workoutCycleReady = Boolean(parsed.workoutCycleReady) || workoutsAreComplete(restoredWorkouts);
          const needsWorkoutUpgrade = merged.profile && merged.workouts.length > 0 && merged.workouts.some((workout) => (
            !workout.focusAreas?.length || workout.exercises.some((exercise) => !exercise.muscleGroup)
          ));
          if (needsWorkoutUpgrade && merged.profile) {
            const previousWorkouts = new Map(restoredWorkouts.map((workout) => [workout.id, workout]));
            merged.workouts = buildWorkoutPlanForCycle(merged.profile, merged.workoutCycle).map((workout) => {
              const previous = previousWorkouts.get(workout.id);
              if (!previous) return workout;
              const exercises = workout.exercises.map((exercise) => ({ ...exercise, completed: previous.completed }));
              return { ...workout, exercises, completed: workoutIsComplete({ ...workout, exercises }) };
            });
          } else {
            merged.workouts = restoredWorkouts;
          }
           const completedWorkouts = merged.workouts.filter((workout) => workout.completed);
           const storedStats = parsed.achievementStats ?? initialState.achievementStats;
           merged.achievementStats = {
             workouts: Math.max(storedStats.workouts ?? 0, completedWorkouts.length),
             minutes: Math.max(storedStats.minutes ?? 0, completedWorkouts.reduce((sum, workout) => sum + workout.duration, 0)),
             exercises: Math.max(storedStats.exercises ?? 0, merged.workouts.reduce((sum, workout) => sum + workout.exercises.filter((exercise) => exercise.completed).length, 0)),
             meals: Math.max(storedStats.meals ?? 0, merged.meals.length),
             weightLogs: Math.max(storedStats.weightLogs ?? 0, merged.weightLogs.length),
           };
          if (!merged.goalProjection && merged.profile && merged.calorieGoal) {
            merged.goalProjection = createGoalProjection(merged.profile, merged.calorieGoal, merged.workouts, merged.goalWeight ?? undefined);
          }
           const usageHour = localUsageHourKey();
           setState(merged.usageDate === usageHour ? merged : { ...merged, usageDate: usageHour, coachMessagesUsed: 0, photoAnalysesUsed: 0 });
        }
      }
      setHydrated(true);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const resetExpiredUsageWindow = () => {
      const usageHour = localUsageHourKey();
      setState((current) => current.usageDate === usageHour
        ? current
        : { ...current, usageDate: usageHour, coachMessagesUsed: 0, photoAnalysesUsed: 0 });
    };
    const interval = setInterval(resetExpiredUsageWindow, 60_000);
    return () => clearInterval(interval);
  }, []);

  const sanitizedWorkouts = useMemo(() => sanitizeWorkoutSplits(state.workouts), [state.workouts]);

  useEffect(() => {
    if (!hydrated || JSON.stringify(sanitizedWorkouts) === JSON.stringify(state.workouts)) return;
    setState((current) => ({ ...current, workouts: sanitizeWorkoutSplits(current.workouts) }));
  }, [hydrated, sanitizedWorkouts, state.workouts]);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem('forge-fit-state', JSON.stringify(state)).catch(() => undefined);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return undefined;

    const recordDailyUse = () => {
      setState((current) => current.onboardingComplete ? recordStreakActivity(current) : current);
    };

    recordDailyUse();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') recordDailyUse();
    });

    return () => subscription.remove();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setState((current) => {
      const metrics: Record<BadgeMetric, number> = {
        ...current.achievementStats,
        streak: getCurrentStreak(current.streakDates),
        activeDays: current.streakDates.length,
      };
      const unlocked = new Set(current.unlockedBadgeIds);
      badges.forEach((badge) => {
        if (metrics[badge.metric] >= badge.target) unlocked.add(badge.id);
      });
      const next = [...unlocked];
      return next.length === current.unlockedBadgeIds.length ? current : { ...current, unlockedBadgeIds: next };
    });
  }, [hydrated, state.achievementStats, state.streakDates, state.unlockedBadgeIds]);

  useEffect(() => {
    if (isSubscribed === undefined) return;
    setState((current) => {
      const nextPremium = Boolean(isSubscribed);
      return current.isPremium === nextPremium ? current : { ...current, isPremium: nextPremium };
    });
  }, [isSubscribed]);

  useEffect(() => {
    if (!hydrated) return;
    syncFitnessNotifications({
      settings: state.notificationSettings,
      profile: state.profile,
      workouts: state.workouts,
      language: state.language,
      weightLogs: state.weightLogs,
      registeredAt: state.registeredAt,
      premiumActive: state.isPremium,
    }).catch((error) => {
      console.warn('GainMode notifications could not be synchronized.', error);
    });
  }, [hydrated, state.isPremium, state.notificationSettings, state.profile, state.workouts, state.language, state.weightLogs]);

  const value = useMemo<FitContextValue>(() => ({
    ...state,
    hydrated,
    workouts: sanitizedWorkouts,
    coachThinking,
    setCoachThinking,
     enablePremium: () => setState((current) => current.isPremium ? current : { ...current, isPremium: true }),
    setLanguage: (language) => setState((current) => ({ ...current, language })),
     addMeal: (meal) => setState((current) => recordStreakActivity({
       ...current,
       meals: [...current.meals, { ...meal, date: meal.date ?? new Date().toISOString(), id: `${Date.now()}-${Math.random()}` }],
       achievementStats: { ...current.achievementStats, meals: current.achievementStats.meals + 1 },
     })),
    removeMeal: (id) => setState((current) => {
      return { ...current, meals: current.meals.filter((item) => item.id !== id) };
    }),
     addSavedMeal: (meal) => setState((current) => {
       const duplicate = current.savedMeals.some((item) => (
         item.name === meal.name
         && item.calories === meal.calories
         && item.protein === meal.protein
         && item.carbs === meal.carbs
         && item.fat === meal.fat
       ));
       if (duplicate) return current;
       return {
         ...current,
         savedMeals: [...current.savedMeals, {
           ...meal,
           id: `${Date.now()}-${Math.random()}`,
           savedAt: new Date().toISOString(),
         }],
       };
     }),
     removeSavedMeal: (id) => setState((current) => ({ ...current, savedMeals: current.savedMeals.filter((item) => item.id !== id) })),
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
       const generatedWorkouts = buildWorkoutPlanForCycle(profile, 0);
       const workouts = options?.profileEdit
         ? generatedWorkouts.map((workout) => {
           const previous = current.workouts.find((item) => item.id === workout.id);
           if (!previous) return workout;
           const exercises = workout.exercises.map((exercise) => {
             const previousExercise = previous.exercises.find((item) => item.id === exercise.id)
               ?? previous.exercises.find((item) => item.name === exercise.name && item.muscleGroup === exercise.muscleGroup);
             return {
               ...exercise,
               completed: previousExercise?.completed ?? false,
               dumbbellWeightKg: previousExercise?.dumbbellWeightKg ?? exercise.dumbbellWeightKg,
             };
           });
           return { ...workout, exercises, completed: workoutIsComplete({ ...workout, exercises }) };
         })
         : generatedWorkouts;
      const projection = createGoalProjection(profile, calorieGoal, workouts, targetWeight);
       return recordStreakActivity({
        ...current,
        profile,
        username,
         registeredAt: current.registeredAt ?? new Date().toISOString(),
        weight: profile.weight,
        calorieGoal,
        proteinGoal,
        carbsGoal,
        fatGoal,
        goalWeight: targetWeight,
        goalProjection: projection,
        workouts,
         workoutCycle: 0,
         workoutCycleReady: false,
        onboardingComplete: true,
        coachIntroPending: options?.profileEdit ? current.coachIntroPending : true,
        profileEditUsedMonth: options?.profileEdit ? currentMonth : current.profileEditUsedMonth,
       });
    }),
    markCoachIntroSeen: () => setState((current) => current.coachIntroPending ? { ...current, coachIntroPending: false } : current),
    setIntroSeen: () => setState((current) => ({ ...current, introSeen: true })),
    incrementCoachUsage: () => setState((current) => {
       const usageHour = localUsageHourKey();
       return current.usageDate === usageHour ? { ...current, coachMessagesUsed: current.coachMessagesUsed + 1 } : { ...current, usageDate: usageHour, coachMessagesUsed: 1, photoAnalysesUsed: 0 };
    }),
    incrementPhotoUsage: () => setState((current) => {
       const usageHour = localUsageHourKey();
       return current.usageDate === usageHour ? { ...current, photoAnalysesUsed: current.photoAnalysesUsed + 1 } : { ...current, usageDate: usageHour, coachMessagesUsed: 0, photoAnalysesUsed: 1 };
    }),
     toggleWorkout: (id) => setState((current) => {
        const previousWorkout = current.workouts.find((workout) => workout.id === id);
       const workouts = current.workouts.map((workout) => {
         if (workout.id !== id) return workout;
         const completed = !workout.completed;
         return { ...workout, completed, exercises: workout.exercises.map((exercise) => ({ ...exercise, completed })) };
       });
       const changedWorkout = workouts.find((workout) => workout.id === id);
       const newlyCompleted = !previousWorkout?.completed && Boolean(changedWorkout?.completed);
       const nextState = {
         ...current,
         workouts,
          workoutCycleReady: workoutsAreComplete(workouts),
         achievementStats: newlyCompleted && changedWorkout ? {
           ...current.achievementStats,
           workouts: current.achievementStats.workouts + 1,
           minutes: current.achievementStats.minutes + changedWorkout.duration,
           exercises: current.achievementStats.exercises + previousWorkout!.exercises.filter((exercise) => !exercise.completed).length,
         } : current.achievementStats,
       };
       return changedWorkout?.completed ? recordStreakActivity(nextState) : nextState;
     }),
     toggleExercise: (workoutId, exerciseId) => setState((current) => {
        const previousWorkout = current.workouts.find((workout) => workout.id === workoutId);
        const previousExercise = previousWorkout?.exercises.find((exercise) => exercise.id === exerciseId);
       const workouts = current.workouts.map((workout) => {
         if (workout.id !== workoutId) return workout;
         const exercises = workout.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, completed: !exercise.completed } : exercise);
         return { ...workout, exercises, completed: workoutIsComplete({ ...workout, exercises }) };
       });
       const changedWorkout = workouts.find((workout) => workout.id === workoutId);
       const newlyCompletedWorkout = !previousWorkout?.completed && Boolean(changedWorkout?.completed);
       const newlyCompletedExercise = !previousExercise?.completed && Boolean(changedWorkout?.exercises.find((exercise) => exercise.id === exerciseId)?.completed);
       const nextState = {
         ...current,
         workouts,
          workoutCycleReady: workoutsAreComplete(workouts),
         achievementStats: {
           ...current.achievementStats,
           workouts: current.achievementStats.workouts + (newlyCompletedWorkout ? 1 : 0),
           minutes: current.achievementStats.minutes + (newlyCompletedWorkout && changedWorkout ? changedWorkout.duration : 0),
           exercises: current.achievementStats.exercises + (newlyCompletedExercise ? 1 : 0),
         },
       };
       return changedWorkout?.completed ? recordStreakActivity(nextState) : nextState;
     }),
      refreshWorkoutCycleIfReady: (firstDay) => setState((current) => {
        if (!current.workoutCycleReady || !current.profile || !current.workouts.length) return current;
        if (firstDay && current.workouts[0]?.day !== firstDay) return current;
        const workoutCycle = current.workoutCycle + 1;
         const previousWeights = new Map(
           current.workouts
             .flatMap((workout) => workout.exercises)
             .filter((exercise) => exercise.dumbbellWeightKg !== undefined)
             .map((exercise) => [`${exercise.name}:${exercise.muscleGroup ?? 'other'}`, exercise.dumbbellWeightKg]),
         );
         const workouts = buildWorkoutPlanForCycle(current.profile, workoutCycle).map((workout) => ({
           ...workout,
           exercises: workout.exercises.map((exercise) => ({
             ...exercise,
             dumbbellWeightKg: previousWeights.get(`${exercise.name}:${exercise.muscleGroup ?? 'other'}`) ?? exercise.dumbbellWeightKg,
           })),
         }));
        return {
          ...current,
           workouts,
          workoutCycle,
          workoutCycleReady: false,
        };
      }),
      addExercise: (workoutId, name, sets = 3, reps = 10) => setState((current) => {
        const workouts = addExerciseToPlan(current.workouts, workoutId, name, sets, reps);
        return { ...current, workouts, workoutCycleReady: workoutsAreComplete(workouts) };
      }),
     removeExercise: (workoutId, exerciseId) => setState((current) => {
       const workouts = current.workouts.map((workout) => {
         if (workout.id !== workoutId) return workout;
         const exercises = workout.exercises.filter((exercise) => exercise.id !== exerciseId);
         return { ...workout, exercises, completed: workoutIsComplete({ ...workout, exercises }) };
       });
       return { ...current, workouts, workoutCycleReady: workoutsAreComplete(workouts) };
     }),
       updateExercise: (workoutId, exerciseId, patch) => setState((current) => {
        const sharedSets = patch.sets === undefined ? getSharedWorkoutSets(current.workouts) : clampWorkoutSets(patch.sets);
         const previousExercise = current.workouts.find((workout) => workout.id === workoutId)?.exercises.find((exercise) => exercise.id === exerciseId);
         const workouts = normalizeWorkoutSets(current.workouts, sharedSets).map((workout) => ({
           ...workout,
           exercises: workout.exercises.map((exercise) => {
             if (exercise.id !== exerciseId || workout.id !== workoutId) return exercise;
             const nextExercise = {
               ...exercise,
               name: patch.name ?? exercise.name,
               sets: sharedSets,
               reps: patch.reps ?? exercise.reps,
             };
             if (Object.prototype.hasOwnProperty.call(patch, 'dumbbellWeightKg')) {
               nextExercise.dumbbellWeightKg = patch.dumbbellWeightKg ?? undefined;
             }
             return nextExercise;
           }),
         }));
         const hasWeightPatch = Object.prototype.hasOwnProperty.call(patch, 'dumbbellWeightKg');
         const nextWeight = patch.dumbbellWeightKg === null || patch.dumbbellWeightKg === undefined
           ? undefined
           : patch.dumbbellWeightKg;
         const previousWeight = previousExercise?.dumbbellWeightKg;
         const dumbbellWeightHistory = hasWeightPatch && nextWeight !== previousWeight && nextWeight !== undefined
           ? [...current.dumbbellWeightHistory, {
             id: `${Date.now()}-${Math.random()}`,
             workoutId,
             exerciseId,
             weightKg: nextWeight,
             date: new Date().toISOString(),
           }]
           : current.dumbbellWeightHistory;
         return { ...current, workouts, dumbbellWeightHistory };
      }),
      updateWorkout: (workoutId, patch) => setState((current) => ({
        ...current,
        workouts: current.workouts.map((workout) => workout.id === workoutId ? { ...workout, ...patch } : workout),
      })),
      updateProfile: (patch) => setState((current) => {
        if (!current.profile) return current;
        const profile = { ...current.profile, ...patch };
        const nextWorkouts = buildWorkoutPlanForCycle(profile, current.workoutCycle).map((workout) => {
          const previous = current.workouts.find((item) => item.id === workout.id);
          return previous
             ? {
               ...workout,
               exercises: workout.exercises.map((exercise) => {
                 const previousExercise = previous.exercises.find((item) => item.id === exercise.id)
                   ?? previous.exercises.find((item) => item.name === exercise.name && item.muscleGroup === exercise.muscleGroup);
                 return {
                   ...exercise,
                   completed: previousExercise?.completed ?? false,
                   dumbbellWeightKg: previousExercise?.dumbbellWeightKg ?? exercise.dumbbellWeightKg,
                 };
               }),
             }
            : workout;
        });
        const goals = calculateNutritionGoals(profile, nextWorkouts);
        return { ...current, profile, weight: profile.weight, calorieGoal: goals.calories, proteinGoal: goals.protein, carbsGoal: goals.carbs, fatGoal: goals.fat, goalWeight: goals.targetWeight, goalProjection: goals.projection, workouts: nextWorkouts, workoutCycleReady: false };
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
      addWeight: (value) => setState((current) => recordStreakActivity({
        ...current,
        weight: value,
        weightLogs: [...current.weightLogs, { id: `${Date.now()}-${Math.random()}`, value, date: new Date().toISOString() }],
        achievementStats: { ...current.achievementStats, weightLogs: current.achievementStats.weightLogs + 1 },
      })),
    setNotificationSetting: (key, enabled) => setState((current) => ({ ...current, notificationSettings: { ...current.notificationSettings, [key]: enabled } })),
    completeDailyMood: () => setState((current) => ({ ...current, dailyMoodCompletedDate: localDateKey() })),
  }), [state, sanitizedWorkouts, coachThinking, hydrated]);

  return <FitContext.Provider value={value}>{children}</FitContext.Provider>;
}

export function useFit() {
  const context = useContext(FitContext);
  if (!context) throw new Error('useFit must be used within FitProvider');
  return context;
}