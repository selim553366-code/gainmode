import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Language, TranslationKey } from '@/lib/i18n';
import { useSubscription } from '@/lib/revenuecat';

export type Meal = { id: string; name: string; type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; calories: number; protein: number; carbs: number; fat: number; imageUri?: string };
export type Equipment = 'bodyweight' | 'home' | 'gym';
export type GymLevel = 'basic' | 'intermediate' | 'full';
export type FitnessGoal = 'muscle' | 'weightLoss' | 'fatLoss' | 'maintain';
export type BiologicalSex = 'female' | 'male' | 'preferNot';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high';
export type GoalRate = 'slow' | 'balanced' | 'fast';
export type DietPreference = 'everything' | 'vegetarian' | 'vegan' | 'halal';
export type ProteinPreference = 'balanced' | 'high' | 'lower';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Profile = {
  equipment: Equipment;
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
};
export type Workout = { id: string; day: string; name: string; duration: number; exercises: { id: string; name: string; sets: number; reps: number }[]; completed: boolean };
export type Friend = { id: string; username: string };
export type Challenge = { id: string; name: string; target: number; progress: number };
type FitState = {
  version: number;
  language: Language;
  meals: Meal[];
  weight: number | null;
  calorieGoal: number | null;
  proteinGoal: number | null;
  goalWeight: number | null;
  profile: Profile | null;
  username: string | null;
  onboardingComplete: boolean;
  introSeen: boolean;
  isPremium: boolean;
  coachMessagesUsed: number;
  photoAnalysesUsed: number;
  usageDate: string;
  workouts: Workout[];
  friends: Friend[];
  challenges: Challenge[];
  weightLogs: { id: string; value: number; date: string }[];
};

type FitContextValue = FitState & {
  coachThinking: boolean;
  setCoachThinking: (value: boolean) => void;
  setLanguage: (language: Language) => void;
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  removeMeal: (id: string) => void;
  completeOnboarding: (profile: Profile, username: string) => void;
  setIntroSeen: () => void;
  incrementCoachUsage: () => void;
  incrementPhotoUsage: () => void;
  toggleWorkout: (id: string) => void;
  addExercise: (workoutId: string, name: TranslationKey) => void;
  removeExercise: (workoutId: string, exerciseId: string) => void;
  addFriend: (username: string) => void;
  addChallenge: (name: string, target: number) => void;
  addWeight: (value: number) => void;
};

const initialState: FitState = {
  version: 3,
  language: 'tr',
  weight: null,
  calorieGoal: null,
  proteinGoal: null,
  goalWeight: null,
  profile: null,
  username: null,
  onboardingComplete: false,
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
};

const FitContext = createContext<FitContextValue | null>(null);

export function FitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FitState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [coachThinking, setCoachThinking] = useState(false);
  const { isSubscribed } = useSubscription();

  useEffect(() => {
    AsyncStorage.getItem('forge-fit-state').then((stored) => {
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FitState> & { water?: unknown; hydrationGoal?: unknown };
        if (parsed.version === initialState.version) {
          const { water: _legacyWater, hydrationGoal: _legacyHydrationGoal, ...storedState } = parsed;
          const merged = { ...initialState, ...storedState };
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

  const calculatePlan = (profile: Profile): Workout[] => {
    const names: TranslationKey[] = profile.goal === 'weightLoss' || profile.goal === 'fatLoss'
      ? ['workoutConditioning', 'workoutStrength', 'workoutFullBody', 'workoutLower', 'workoutUpper', 'workoutPull']
      : ['workoutUpper', 'workoutPull', 'workoutLower', 'workoutFullBody', 'workoutStrength', 'workoutConditioning'];
    const bodyweight = profile.equipment === 'bodyweight';
    const exerciseSets: TranslationKey[][] = bodyweight
      ? [['exercisePushup', 'exerciseSquat', 'exercisePlank'], ['exerciseRow', 'exerciseLunge', 'exerciseDeadBug'], ['exerciseMountain', 'exerciseGluteBridge', 'exerciseSidePlank'], ['exercisePushup', 'exerciseLunge', 'exerciseSidePlank'], ['exerciseSquat', 'exerciseGluteBridge', 'exercisePlank'], ['exerciseMountain', 'exercisePushup', 'exerciseDeadBug']]
      : [['exerciseBench', 'exerciseShoulderPress', 'exerciseTriceps'], ['exerciseRow', 'exerciseLatPulldown', 'exerciseCurl'], ['exerciseLegPress', 'exerciseRdl', 'exerciseCalfRaise'], ['exerciseBench', 'exerciseRow', 'exerciseLegPress'], ['exerciseShoulderPress', 'exerciseCurl', 'exerciseRdl'], ['exerciseLatPulldown', 'exerciseTriceps', 'exerciseCalfRaise']];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const count = Math.min(Math.max(profile.trainingDays ?? 3, 2), 6);
    const reps = profile.experience === 'advanced' ? 8 : profile.experience === 'intermediate' ? 10 : 12;
    return names.slice(0, count).map((name, index) => ({
      id: `workout-${index}`,
      day: profile.preferredDays?.[index] ?? days[index],
      name,
      duration: profile.sessionDuration ?? (profile.goal === 'muscle' ? 50 : 40),
      completed: false,
      exercises: exerciseSets[index].map((exercise, exerciseIndex) => ({ id: `${index}-${exerciseIndex}`, name: exercise, sets: profile.experience === 'advanced' ? 4 : 3, reps: bodyweight ? reps + 2 : reps })),
    }));
  };

  const value = useMemo<FitContextValue>(() => ({
    ...state,
    coachThinking,
    setCoachThinking,
    setLanguage: (language) => setState((current) => ({ ...current, language })),
    addMeal: (meal) => setState((current) => ({ ...current, meals: [...current.meals, { ...meal, id: `${Date.now()}-${Math.random()}` }] })),
    removeMeal: (id) => setState((current) => {
      return { ...current, meals: current.meals.filter((item) => item.id !== id) };
    }),
    completeOnboarding: (profile, username) => setState((current) => {
      const sexAdjustment = profile.sex === 'female' ? -161 : profile.sex === 'preferNot' ? -78 : 5;
      const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + sexAdjustment;
      const activityMultiplier = { sedentary: 1.2, light: 1.35, moderate: 1.5, high: 1.7 }[profile.activity ?? 'light'];
      const rateAdjustment = { slow: 200, balanced: 350, fast: 500 }[profile.goalRate ?? 'balanced'];
      const goalAdjustment = profile.goal === 'muscle' ? rateAdjustment : profile.goal === 'weightLoss' || profile.goal === 'fatLoss' ? -rateAdjustment : 0;
      const calorieGoal = Math.max(1200, Math.round(bmr * activityMultiplier + goalAdjustment));
      const proteinMultiplier = profile.proteinPreference === 'high' ? 2.2 : profile.proteinPreference === 'lower' ? 1.4 : profile.goal === 'muscle' ? 2 : 1.7;
      const proteinGoal = Math.round(profile.weight * proteinMultiplier);
      return {
        ...current,
        profile,
        username,
        weight: profile.weight,
        calorieGoal,
        proteinGoal,
        goalWeight: profile.goal === 'muscle' || profile.goal === 'maintain' ? profile.weight : Math.max(profile.weight - 5, 1),
        workouts: calculatePlan(profile),
        onboardingComplete: true,
      };
    }),
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
  }), [state, coachThinking]);

  return <FitContext.Provider value={value}>{children}</FitContext.Provider>;
}

export function useFit() {
  const context = useContext(FitContext);
  if (!context) throw new Error('useFit must be used within FitProvider');
  return context;
}