/** The card designs the time-of-day "Daily" widget can show. */
export type DailyWidgetCard = 'StartWorkout' | 'Streak' | 'NextGoal' | 'Performance' | 'GoodNight';

export type DailyWidgetState = {
  /** A workout is planned for today and is not finished yet. */
  workoutPending: boolean;
  /** There is still a badge left to unlock. */
  hasNextGoal: boolean;
};

/**
 * Which card the Daily widget shows at a given local hour.
 * 05–11 morning: today's workout, or the streak card once it is done.
 * 11–17 midday: the next badge to unlock.
 * 17–21 evening: an unfinished workout gets one more nudge, otherwise the weekly performance.
 * 21–05 night: good night, with today's summary and tomorrow's plan.
 */
export function dailyWidgetCard(state: DailyWidgetState, hour: number): DailyWidgetCard {
  if (hour >= 21 || hour < 5) return 'GoodNight';
  if (hour < 11) return state.workoutPending ? 'StartWorkout' : 'Streak';
  if (hour < 17) return state.hasNextGoal ? 'NextGoal' : 'Streak';
  return state.workoutPending ? 'StartWorkout' : 'Performance';
}

/** Short given name for a greeting: the first word, at most 12 characters. */
export function widgetFirstName(username: unknown) {
  if (typeof username !== 'string') return '';
  const first = username.trim().split(/\s+/)[0] ?? '';
  return first.length > 12 ? `${first.slice(0, 11)}…` : first;
}

/** Points for a smooth line through the week's minutes, as an SVG path (line and closed area). */
export function performancePaths(values: number[], width: number, height: number, pad = 6) {
  const count = Math.max(values.length, 2);
  const max = Math.max(...values, 1);
  const points = (values.length ? values : [0, 0]).map((value, index) => ({
    x: pad + (index * (width - pad * 2)) / (count - 1),
    y: height - pad - (Math.max(0, value) / max) * (height - pad * 2),
  }));
  let line = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midX = (previous.x + current.x) / 2;
    line += ` C${midX.toFixed(1)} ${previous.y.toFixed(1)} ${midX.toFixed(1)} ${current.y.toFixed(1)} ${current.x.toFixed(1)} ${current.y.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  const area = `${line} L${last.x.toFixed(1)} ${height} L${points[0].x.toFixed(1)} ${height} Z`;
  return { line, area, last };
}
