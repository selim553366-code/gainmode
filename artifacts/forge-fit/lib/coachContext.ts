import type { DumbbellWeightLog, Meal, Profile, Workout } from '@/context/FitContext';
import { getWeeklySummary, type WeeklySummary } from '@/lib/weeklyAnalysis';
import { getMealsForRange, localDateKey, mealDateKey } from '@/lib/nutritionDates';
import { buildCoachBaseline } from '@/lib/coachPersonalization';

type CoachContextInput = {
  message: string;
  conversation?: { role: 'coach' | 'user'; content: string }[];
  username: string | null;
  profile: Profile | null;
  meals: Meal[];
  workouts: Workout[];
  weight: number | null;
  weightLogs: { id: string; value: number; date: string }[];
  dumbbellWeightHistory: DumbbellWeightLog[];
  calorieGoal: number | null;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;
  language: string;
};

const words = {
  nutrition: /kalori|protein|karbonhidrat|yağ|öğün|yemek|beslen|makro|calorie|protein|carb|fat|meal|food|nutrition|macro|kalorien|eiweiß|kohlenhydrate|fett|mahlzeit|ernährung|calories|repas|aliment|nutrition|calorías|comida|alimento|nutrición/i,
  workout: /antrenman|egzersiz|hareket|set|tekrar|squat|şınav|lunge|çalış|workout|exercise|sets|reps|training|squat|push.?up|lunge|entraînement|exercice|entrenamiento|ejercicio/i,
  progress: /kilo|ağırlık|gelişim|ilerleme|hafta|sonuç|weight|progress|result|week|poids|progrès|semaine|gewicht|fortschritt|woche|peso|progreso|semana/i,
  profile: /boy|yaş|hedef|cinsiyet|ekipman|aktivite|diyet|profil|height|age|goal|equipment|activity|diet|profile|taille|âge|objectif|équipement|activité|profil|größe|alter|ziel|ausrüstung|aktivität|profil|altura|edad|objetivo|equipo|actividad|perfil/i,
  mutation: /ekle|çıkar|sil|değiştir|güncelle|taşı|kaldır|add|remove|delete|change|update|move|ersetze|lösche|ajoute|supprime|modifie|cambia|elimina/i,
} as const;

function compactMeal(meal: Meal) {
  return {
    name: meal.name,
    type: meal.type,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    date: mealDateKey(meal.date),
  };
}

function compactWorkout(workout: Workout) {
  return {
    id: workout.id,
    day: workout.day,
    name: workout.name,
    duration: workout.duration,
    completed: workout.completed,
    exercises: workout.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      completed: Boolean(exercise.completed),
       dumbbellWeightKg: exercise.dumbbellWeightKg ?? null,
    })),
  };
}

function getTodayTotals(meals: Meal[]) {
  return getMealsForRange(meals, 'daily').reduce((totals, meal) => ({
    calories: totals.calories + meal.calories,
    protein: totals.protein + meal.protein,
    carbs: totals.carbs + meal.carbs,
    fat: totals.fat + meal.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

export function buildCoachContext(input: CoachContextInput) {
  const message = input.message.trim();
  const wantsNutrition = words.nutrition.test(message);
  const wantsWorkout = words.workout.test(message);
  const wantsProgress = words.progress.test(message);
  const wantsProfile = words.profile.test(message);
  const wantsMutation = words.mutation.test(message);
  const includeNutrition = wantsNutrition;
  const includeWorkout = wantsWorkout || wantsMutation;
  const includeProgress = wantsProgress || message.toLocaleLowerCase().includes('weekly') || message.includes('haftalık') || message.toLocaleLowerCase().includes('hebdo');
  const includeFullProfile = wantsProfile || wantsMutation;
  const includeTargets = includeFullProfile || includeNutrition || includeProgress;
  const context = buildCoachBaseline(input);

  if (includeFullProfile) {
    context.profile = input.profile;
  }
  if (includeTargets) {
    context.targets = {
      calories: input.calorieGoal,
      protein: input.proteinGoal,
      carbs: input.carbsGoal,
      fat: input.fatGoal,
    };
  }

  if (includeNutrition) {
    const todayMeals = getMealsForRange(input.meals, 'daily');
    const recentMeals = input.meals
      .filter((meal) => mealDateKey(meal.date) !== localDateKey())
      .slice(-5)
      .map(compactMeal);
    context.nutrition = {
      today: {
        totals: getTodayTotals(input.meals),
        meals: todayMeals.map(compactMeal),
      },
      recentMeals,
    };
  }

  if (includeWorkout) {
    context.workouts = wantsMutation
      ? input.workouts.map(compactWorkout)
      : {
          today: input.workouts.filter((workout) => workout.day === new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()).map(compactWorkout),
          recent: input.workouts.filter((workout) => workout.completed).slice(-2).map(compactWorkout),
        };
  }

  if (includeProgress) {
    const summary: WeeklySummary = getWeeklySummary({
      weight: input.weight,
      weightLogs: input.weightLogs,
      meals: input.meals,
      workouts: input.workouts,
      calorieGoal: input.calorieGoal,
      goal: input.profile?.goal,
      profile: input.profile ?? undefined,
      dumbbellWeightHistory: input.dumbbellWeightHistory,
    });
    context.progress = { currentWeight: input.weight, weightLogs: input.weightLogs.slice(-4), weeklySummary: summary };
  }

  return JSON.stringify(context);
}