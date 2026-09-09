export function calculateNetCalories(consumedCalories: number, exerciseCalories: number) {
  return consumedCalories - exerciseCalories;
}

export function calculateRemainingCalories(calorieGoal: number | null, netCalories: number) {
  return calorieGoal === null ? null : Math.max(calorieGoal - netCalories, 0);
}

export function calculateCalorieProgress(calorieGoal: number | null, netCalories: number) {
  return calorieGoal ? netCalories / calorieGoal : 0;
}