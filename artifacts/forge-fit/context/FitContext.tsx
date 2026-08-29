import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Language } from '@/lib/i18n';

export type Meal = { id: string; name: string; type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; calories: number; protein: number; carbs: number; fat: number };
type FitState = {
  language: Language;
  calories: number;
  water: number;
  workoutComplete: boolean;
  meals: Meal[];
  weight: number;
};

type FitContextValue = FitState & {
  setLanguage: (language: Language) => void;
  addWater: () => void;
  toggleWorkout: () => void;
  addMeal: (type: Meal['type']) => void;
  removeMeal: (id: string) => void;
};

const initialState: FitState = {
  language: 'tr',
  calories: 1248,
  water: 4,
  workoutComplete: false,
  weight: 68.4,
  meals: [
    { id: '1', name: 'Yulaf & meyve', type: 'breakfast', calories: 420, protein: 24, carbs: 58, fat: 12 },
    { id: '2', name: 'Izgara tavuk bowl', type: 'lunch', calories: 540, protein: 46, carbs: 48, fat: 16 },
    { id: '3', name: 'Bademli yoğurt', type: 'snack', calories: 288, protein: 18, carbs: 24, fat: 14 },
  ],
};

const FitContext = createContext<FitContextValue | null>(null);

export function FitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FitState>(initialState);

  useEffect(() => {
    AsyncStorage.getItem('forge-fit-state').then((stored) => {
      if (stored) setState({ ...initialState, ...JSON.parse(stored) as Partial<FitState> });
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('forge-fit-state', JSON.stringify(state)).catch(() => undefined);
  }, [state]);

  const value = useMemo<FitContextValue>(() => ({
    ...state,
    setLanguage: (language) => setState((current) => ({ ...current, language })),
    addWater: () => setState((current) => ({ ...current, water: Math.min(current.water + 1, 8) })),
    toggleWorkout: () => setState((current) => ({ ...current, workoutComplete: !current.workoutComplete })),
    addMeal: (type) => {
      const names: Record<Meal['type'], string> = { breakfast: 'Avokadolu yumurta', lunch: 'Protein tabağı', dinner: 'Somon & sebze', snack: 'Protein smoothie' };
      const meal: Meal = { id: `${Date.now()}-${Math.random()}`, name: names[type], type, calories: type === 'snack' ? 220 : 430, protein: type === 'snack' ? 22 : 34, carbs: 32, fat: 14 };
      setState((current) => ({ ...current, meals: [...current.meals, meal], calories: current.calories + meal.calories }));
    },
    removeMeal: (id) => setState((current) => {
      const meal = current.meals.find((item) => item.id === id);
      return { ...current, meals: current.meals.filter((item) => item.id !== id), calories: Math.max(0, current.calories - (meal?.calories ?? 0)) };
    }),
  }), [state]);

  return <FitContext.Provider value={value}>{children}</FitContext.Provider>;
}

export function useFit() {
  const context = useContext(FitContext);
  if (!context) throw new Error('useFit must be used within FitProvider');
  return context;
}