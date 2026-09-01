export type StreakCalendarDay = {
  date: string;
  dayNumber: number;
  isToday: boolean;
  isCompleted: boolean;
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function shiftDate(dateKey: string, amount: number) {
  const date = dateFromKey(dateKey);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

export function normalizeStreakDates(dates: string[]) {
  return [...new Set(dates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)))].sort();
}

export function addStreakActivity(dates: string[], date = new Date()) {
  return normalizeStreakDates([...dates, localDateKey(date)]).slice(-400);
}

export function getCurrentStreak(dates: string[], now = new Date()) {
  const completedDates = new Set(normalizeStreakDates(dates));
  const today = localDateKey(now);
  let cursor = completedDates.has(today) ? today : shiftDate(today, -1);
  let streak = 0;

  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }

  return streak;
}

export function getStreakCalendar(dates: string[], now = new Date(), count = 7): StreakCalendarDay[] {
  const completedDates = new Set(normalizeStreakDates(dates));
  const today = localDateKey(now);
  const streak = getCurrentStreak(dates, now);
  const firstDate = shiftDate(today, -(count - 1));

  return Array.from({ length: count }, (_, index) => {
    const date = shiftDate(firstDate, index);
    return {
      date,
      dayNumber: Math.max(0, streak - (count - 1 - index)),
      isToday: date === today,
      isCompleted: completedDates.has(date),
    };
  });
}