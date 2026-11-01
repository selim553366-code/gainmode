import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyWidgetCard, performancePaths, widgetFirstName } from '../widgets/widgetSchedule.ts';

const pending = { workoutPending: true, hasNextGoal: true };
const done = { workoutPending: false, hasNextGoal: true };

test('night hours always show the good night card', () => {
  for (const hour of [21, 23, 0, 4]) assert.equal(dailyWidgetCard(pending, hour), 'GoodNight');
});

test('mornings nudge an unfinished workout, then celebrate the streak', () => {
  assert.equal(dailyWidgetCard(pending, 7), 'StartWorkout');
  assert.equal(dailyWidgetCard(done, 7), 'Streak');
});

test('midday shows the next goal unless every badge is unlocked', () => {
  assert.equal(dailyWidgetCard(done, 13), 'NextGoal');
  assert.equal(dailyWidgetCard({ workoutPending: false, hasNextGoal: false }, 13), 'Streak');
});

test('evenings show performance once the workout is done', () => {
  assert.equal(dailyWidgetCard(pending, 18), 'StartWorkout');
  assert.equal(dailyWidgetCard(done, 18), 'Performance');
});

test('greeting uses a short first name', () => {
  assert.equal(widgetFirstName('  Selim Yılmaz '), 'Selim');
  assert.equal(widgetFirstName(null), '');
  assert.equal(widgetFirstName('Bartholomewsson'), 'Bartholomew…');
});

test('performance path spans the chart and peaks at the top', () => {
  const { line, last } = performancePaths([0, 30, 60], 100, 40, 5);
  assert.match(line, /^M5\.0 35\.0/);
  assert.equal(last.x, 95);
  assert.equal(last.y, 5);
});
