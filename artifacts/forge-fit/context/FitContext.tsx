import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Language, TranslationKey } from '@/lib/i18n';

export type Meal = { id: string; name: string; type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; calories: number; protein: number; carbs: number; fat: number; imageUri?: string };
export type Equipment = 'bodyweight' | 'home' | 'gym';
export type FitnessGoal = 'muscle' | 'weightLoss' | 'fatLoss' | 'maintain';
export type Profile = { equipment: Equipment; height: number; weight: number; age: number; goal: FitnessGoal };
export type Workout = { id: string; day: string; name: string; duration: number; exercises: { id: string; name: string; sets: number; reps: number }[]; completed: boolean };
export type Friend = { id: string; username: string };
export type Challenge = { id: string; name: string; target: number; progress: number };
type FitState = {
  version: number;
  language: Language;
  water: number;
  meals: Meal[];
  weight: number | null;
  calorieGoal: number | null;
  proteinGoal: number | null;
  goalWeight: number | null;
  hydrationGoal: number | null;
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
  setLanguage: (language: Language) => void;
  addWater: () => void;
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  removeMeal: (id: string) => void;
  completeOnboarding: (profile: Profile, username: string) => void;
  setIntroSeen: () => void;
  setPremium: (value: boolean) => void;
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
  water: 0,
  weight: null,
  calorieGoal: null,
  proteinGoal: null,
  goalWeight: null,
  hydrationGoal: null,
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

  useEffect(() => {
    AsyncStorage.getItem('forge-fit-state').then((stored) => {
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FitState>;
        if (parsed.version === initialState.version) {
          const merged = { ...initialState, ...parsed };
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

  const calculatePlan = (profile: Profile): Workout[] => {
    const names: TranslationKey[] = profile.goal === 'weightLoss' || profile.goal === 'fatLoss'
      ? ['workoutConditioning', 'workoutStrength', 'workoutFullBody']
      : ['workoutUpper', 'workoutPull', 'workoutLower'];
    const bodyweight = profile.equipment === 'bodyweight';
    const exerciseSets: TranslationKey[][] = bodyweight
      ? [['exercisePushup', 'exerciseSquat', 'exercisePlank'], ['exerciseRow', 'exerciseLunge', 'exerciseDeadBug'], ['exerciseMountain', 'exerciseGluteBridge', 'exerciseSidePlank']]
      : [['exerciseBench', 'exerciseShoulderPress', 'exerciseTriceps'], ['exerciseRow', 'exerciseLatPulldown', 'exerciseCurl'], ['exerciseLegPress', 'exerciseRdl', 'exerciseCalfRaise']];
    return names.map((name, index) => ({
      id: `workout-${index}`,
      day: ['MON', 'WED', 'FRI'][index],
      name,
      duration: profile.goal === 'muscle' ? 50 : 40,
      completed: false,
      exercises: exerciseSets[index].map((exercise, exerciseIndex) => ({ id: `${index}-${exerciseIndex}`, name: exercise, sets: 3, reps: bodyweight ? 12 : 10 })),
    }));
  };

  const value = useMemo<FitContextValue>(() => ({
    ...state,
    setLanguage: (language) => setState((current) => ({ ...current, language })),
    addWater: () => setState((current) => ({ ...current, water: Math.min(current.water + 1, current.hydrationGoal ?? 8) })),
    addMeal: (meal) => setState((current) => ({ ...current, meals: [...current.meals, { ...meal, id: `${Date.now()}-${Math.random()}` }] })),
    removeMeal: (id) => setState((current) => {
      return { ...current, meals: current.meals.filter((item) => item.id !== id) };
    }),
    completeOnboarding: (profile, username) => setState((current) => {
      const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
      const baseCalories = bmr * 1.35;
      const calorieGoal = Math.round(baseCalories + (profile.goal === 'muscle' ? 250 : profile.goal === 'weightLoss' || profile.goal === 'fatLoss' ? -400 : 0));
      const proteinGoal = Math.round(profile.weight * (profile.goal === 'muscle' ? 2 : 1.7));
      return {
        ...current,
        profile,
        username,
        weight: profile.weight,
        calorieGoal,
        proteinGoal,
        goalWeight: profile.goal === 'muscle' || profile.goal === 'maintain' ? profile.weight : Math.max(profile.weight - 5, 1),
        hydrationGoal: Math.min(Math.max(Math.round((profile.weight * 35) / 250), 4), 12),
        workouts: calculatePlan(profile),
        onboardingComplete: true,
      };
    }),
    setIntroSeen: () => setState((current) => ({ ...current, introSeen: true })),
    setPremium: (value) => setState((current) => ({ ...current, isPremium: value })),
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
  }), [state]);

  return <FitContext.Provider value={value}>{children}</FitContext.Provider>;
}

export function useFit() {
  const context = useContext(FitContext);
  if (!context) throw new Error('useFit must be used within FitProvider');
  return context;
}