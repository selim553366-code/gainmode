export type NutritionRange = 'daily' | 'weekly' | 'monthly';

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function mealDateKey(value: string | undefined, fallbackDate = new Date()) {
  if (!value) return localDateKey(fallbackDate);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value.slice(0, 10) : localDateKey(parsed);
}

function rangeStartKey(range: NutritionRange, now: Date) {
  if (range === 'daily') return localDateKey(now);
  if (range === 'monthly') {
    const monthStart = new Date(now);
    monthStart.setDate(1);
    return localDateKey(monthStart);
  }
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  return localDateKey(weekStart);
}

export function getMealsForRange<T extends { date?: string }>(meals: T[], range: NutritionRange, now = new Date()) {
  const start = rangeStartKey(range, now);
  const end = localDateKey(now);
  return meals.filter((meal) => {
    const date = mealDateKey(meal.date, now);
    return date >= start && date <= end;
  });
}