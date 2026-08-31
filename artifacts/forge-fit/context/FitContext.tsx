import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Language, TranslationKey } from '@/lib/i18n';
import { useSubscription } from '@/lib/revenuecat';
import { NotificationSettingKey, NotificationSettings, syncFitnessNotifications } from '@/lib/notifications';

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
export type Workout = { id: string; day: string; name: string; duration: number; exercises: { id: string; name: string; sets: number; reps: number }[]; completed: boolean };
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
  friends: Friend[];
  challenges: Challenge[];
  weightLogs: { id: string; value: number; date: string }[];
  notificationSettings: NotificationSettings;
};

type FitContextValue = FitState & {
  coachThinking: boolean;
  setCoachThinking: (value: boolean) => void;
  enablePremium: () => void;
  setLanguage: (language: Language) => void;
  restartOnboarding: () => void;
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  removeMeal: (id: string) => void;
  completeOnboarding: (profile: Profile, username: string) => void;
  markCoachIntroSeen: () => void;
  setIntroSeen: () => void;
  incrementCoachUsage: () => void;
  incrementPhotoUsage: () => void;
  toggleWorkout: (id: string) => void;
  addExercise: (workoutId: string, name: TranslationKey) => void;
  removeExercise: (workoutId: string, exerciseId: string) => void;
  addFriend: (username: string) => void;
  addChallenge: (name: string, target: number) => void;
  addWeight: (value: number) => void;
  setNotificationSetting: (key: NotificationSettingKey, enabled: boolean) => void;
};

const initialState: FitState = {
  version: 4,
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
};

const FitContext = createContext<FitContextValue | null>(null);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const roundKg = (value: number) => Math.round(value * 10) / 10;

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
  const { isSubscribed } = useSubscription();

  useEffect(() => {
    AsyncStorage.getItem('forge-fit-state').then((stored) => {
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FitState> & { water?: unknown; hydrationGoal?: unknown };
        if (parsed.version === initialState.version || parsed.version === 3) {
          const { water: _legacyWater, hydrationGoal: _legacyHydrationGoal, ...storedState } = parsed;
          const merged = {
            ...initialState,
            ...storedState,
            notificationSettings: { ...initialState.notificationSettings, ...(parsed.notificationSettings ?? {}) },
            version: initialState.version,
          };
          if (!merged.goalProjection && merged.profile && merged.calorieGoal) {
            merged.goalProjection = createGoalProjection(merged.profile, merged.calorieGoal, merged.workouts, merged.goalWeight ?? undefined);
          }
          const today = new Date().toISOString().slice(0, 10);
          setState(merged.usageDate === today ? merged : { ...merged, usageDate: today, coachMessagesUsed: 0, photoAnalysesUsed: 0 });
        }
      }
      setHydrated(true);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem('forge-fit-state', JSON.stringify(state)).catch(() => undefined);
  }, [state, hydrated]);

  useEffect(() => {
    if (isSubscribed === undefined) return;
    setState((current) => current.isPremium === isSubscribed ? current : { ...current, isPremium: isSubscribed });
  }, [isSubscribed]);

  useEffect(() => {
    if (!hydrated) return;
    syncFitnessNotifications({ settings: state.notificationSettings, profile: state.profile, language: state.language }).catch((error) => {
      console.warn('Forge Fit notifications could not be synchronized.', error);
    });
  }, [hydrated, state.notificationSettings, state.profile, state.language]);

  const calculatePlan = (profile: Profile): Workout[] => {
    const isLossGoal = profile.goal === 'weightLoss' || profile.goal === 'fatLoss';
    const isBuildGoal = profile.goal === 'muscle' || profile.goal === 'weightGain';
    const names: TranslationKey[] = isLossGoal
      ? ['workoutConditioning', 'workoutStrength', 'workoutFullBody', 'workoutLower', 'workoutUpper', 'workoutPull']
      : ['workoutUpper', 'workoutPull', 'workoutLower', 'workoutFullBody', 'workoutStrength', 'workoutConditioning'];
    const bodyweight = profile.equipment === 'bodyweight';
     const homeEquipment = profile.equipment === 'home' || (profile.equipment === 'gym' && profile.gymLevel === 'basic');
     const equipmentText = (profile.equipmentDetails ?? '').toLocaleLowerCase();
     const hasDumbbells = /dumbbell|halter|mancuerna|hantel|haltère/.test(equipmentText);
     const hasBands = /band|bant|direnç|resistance|elastique|gummiband|banda/.test(equipmentText);
     const hasKettlebell = /kettlebell|girya/.test(equipmentText);
     const hasBench = /bench|bank|banco|banc/.test(equipmentText);
     const homeExerciseSets: TranslationKey[][] = hasDumbbells || hasKettlebell
       ? [['exerciseShoulderPress', 'exerciseRow', 'exerciseSquat'], ['exerciseRdl', 'exerciseCurl', 'exerciseLunge'], ['exerciseSquat', 'exerciseShoulderPress', 'exerciseGluteBridge'], ['exerciseRow', 'exerciseRdl', 'exerciseSidePlank'], ['exerciseLunge', 'exerciseCurl', 'exercisePlank'], ['exerciseSquat', 'exerciseRow', 'exerciseDeadBug']]
       : hasBands
         ? [['exerciseRow', 'exercisePushup', 'exerciseSquat'], ['exerciseShoulderPress', 'exerciseLunge', 'exerciseGluteBridge'], ['exerciseRow', 'exercisePushup', 'exerciseSidePlank'], ['exerciseShoulderPress', 'exerciseSquat', 'exerciseDeadBug'], ['exercisePushup', 'exerciseLunge', 'exercisePlank'], ['exerciseRow', 'exerciseGluteBridge', 'exerciseMountain']]
         : hasBench
           ? [['exerciseBench', 'exercisePushup', 'exerciseSquat'], ['exerciseRow', 'exerciseLunge', 'exerciseGluteBridge'], ['exerciseBench', 'exerciseShoulderPress', 'exerciseSidePlank'], ['exercisePushup', 'exerciseSquat', 'exerciseDeadBug'], ['exerciseBench', 'exerciseRdl', 'exercisePlank'], ['exerciseRow', 'exerciseLunge', 'exerciseMountain']]
           : [['exercisePushup', 'exerciseSquat', 'exerciseGluteBridge'], ['exerciseRow', 'exerciseLunge', 'exerciseDeadBug'], ['exerciseShoulderPress', 'exerciseMountain', 'exerciseSidePlank'], ['exercisePushup', 'exerciseLunge', 'exercisePlank'], ['exerciseSquat', 'exerciseGluteBridge', 'exerciseDeadBug'], ['exerciseMountain', 'exerciseRow', 'exerciseSidePlank']];
     const exerciseSets: TranslationKey[][] = bodyweight
      ? [['exercisePushup', 'exerciseSquat', 'exercisePlank'], ['exerciseRow', 'exerciseLunge', 'exerciseDeadBug'], ['exerciseMountain', 'exerciseGluteBridge', 'exerciseSidePlank'], ['exercisePushup', 'exerciseLunge', 'exerciseSidePlank'], ['exerciseSquat', 'exerciseGluteBridge', 'exercisePlank'], ['exerciseMountain', 'exercisePushup', 'exerciseDeadBug']]
      : homeEquipment
        ? homeExerciseSets
        : [['exerciseBench', 'exerciseShoulderPress', 'exerciseTriceps'], ['exerciseRow', 'exerciseLatPulldown', 'exerciseCurl'], ['exerciseLegPress', 'exerciseRdl', 'exerciseCalfRaise'], ['exerciseBench', 'exerciseRow', 'exerciseLegPress'], ['exerciseShoulderPress', 'exerciseCurl', 'exerciseRdl'], ['exerciseLatPulldown', 'exerciseTriceps', 'exerciseCalfRaise']];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const count = Math.min(Math.max(profile.trainingDays ?? 3, 2), 6);
    const reps = profile.experience === 'advanced' ? (isBuildGoal ? 8 : 10) : profile.experience === 'intermediate' ? 10 : isLossGoal ? 14 : 12;
    const duration = profile.sessionDuration ?? (isBuildGoal ? 50 : 40);
    const baseSets = profile.experience === 'advanced' ? 4 : profile.experience === 'intermediate' ? 3 : 2;
    const durationSet = duration >= 55 ? 1 : 0;
    const activitySet = profile.activity === 'high' ? 1 : 0;
    const goalSet = isBuildGoal ? 1 : 0;
    const sets = Math.min(5, baseSets + durationSet + activitySet + goalSet);
    return names.slice(0, count).map((name, index) => ({
      id: `workout-${index}`,
      day: profile.preferredDays?.[index] ?? days[index],
      name,
      duration,
      completed: false,
      exercises: exerciseSets[index].map((exercise, exerciseIndex) => ({ id: `${index}-${exerciseIndex}`, name: exercise, sets, reps: bodyweight ? reps + 2 : reps })),
    }));
  };

  const value = useMemo<FitContextValue>(() => ({
    ...state,
    coachThinking,
    setCoachThinking,
     enablePremium: () => setState((current) => current.isPremium ? current : { ...current, isPremium: true }),
    setLanguage: (language) => setState((current) => ({ ...current, language })),
    restartOnboarding: () => setState((current) => ({ ...current, onboardingComplete: false, introSeen: false, coachIntroPending: false })),
     addMeal: (meal) => setState((current) => ({ ...current, meals: [...current.meals, { ...meal, date: meal.date ?? new Date().toISOString(), id: `${Date.now()}-${Math.random()}` }] })),
    removeMeal: (id) => setState((current) => {
      return { ...current, meals: current.meals.filter((item) => item.id !== id) };
    }),
    completeOnboarding: (profile, username) => setState((current) => {
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
      const workouts = calculatePlan(profile);
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
        coachIntroPending: true,
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
    toggleWorkout: (id) => setState((current) => ({ ...current, workouts: current.workouts.map((workout) => workout.id === id ? { ...workout, completed: !workout.completed } : workout) })),
    addExercise: (workoutId, name) => setState((current) => ({ ...current, workouts: current.workouts.map((workout) => workout.id === workoutId ? { ...workout, exercises: [...workout.exercises, { id: `${Date.now()}-${Math.random()}`, name, sets: 3, reps: 10 }] } : workout) })),
    removeExercise: (workoutId, exerciseId) => setState((current) => ({ ...current, workouts: current.workouts.map((workout) => workout.id === workoutId ? { ...workout, exercises: workout.exercises.filter((exercise) => exercise.id !== exerciseId) } : workout) })),
    addFriend: (username) => setState((current) => current.friends.some((friend) => friend.username.toLowerCase() === username.toLowerCase()) ? current : { ...current, friends: [...current.friends, { id: `${Date.now()}-${Math.random()}`, username }] }),
    addChallenge: (name, target) => setState((current) => ({ ...current, challenges: [...current.challenges, { id: `${Date.now()}-${Math.random()}`, name, target, progress: 0 }] })),
    addWeight: (value) => setState((current) => ({ ...current, weight: value, weightLogs: [...current.weightLogs, { id: `${Date.now()}-${Math.random()}`, value, date: new Date().toISOString() }] })),
    setNotificationSetting: (key, enabled) => setState((current) => ({ ...current, notificationSettings: { ...current.notificationSettings, [key]: enabled } })),
  }), [state, coachThinking]);

  return <FitContext.Provider value={value}>{children}</FitContext.Provider>;
}

export function useFit() {
  const context = useContext(FitContext);
  if (!context) throw new Error('useFit must be used within FitProvider');
  return context;
}