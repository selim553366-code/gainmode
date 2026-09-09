import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCoachBaseline } from '../lib/coachPersonalization.ts';

const profile = {
  equipment: 'gym',
  gymLevel: 'full',
  height: 180,
  weight: 82,
  age: 30,
  goal: 'muscle',
  trainingDays: 4,
  sessionDuration: 60,
  experience: 'intermediate',
  preferredDays: ['MON', 'TUE', 'THU', 'SAT'],
};

const workouts = [{
  id: 'workout-1',
  day: 'MON',
  name: 'Push',
  duration: 60,
  completed: false,
  exercises: [{ id: 'exercise-1', name: 'Bench Press', sets: 3, reps: 10, completed: false }],
}];

function contextFor(message, conversation = []) {
  return buildCoachBaseline({
    message,
    conversation,
    username: 'Selim',
    profile,
    workouts,
  });
}

test('keeps baseline personalization and plan awareness for a greeting', () => {
  const context = contextFor('Merhaba');

  assert.equal(context.request.intent, 'greeting');
  assert.equal(context.userSummary.preferredName, 'Selim');
  assert.equal(context.userSummary.goal, 'muscle');
  assert.equal(context.userSummary.trainingDays, 4);
  assert.equal(context.planOverview.hasWorkoutPlan, true);
  assert.deepEqual(context.planOverview.schedule, [{
    day: 'MON',
    name: 'Push',
    duration: 60,
    completed: false,
  }]);
});

test('includes recent conversation so follow-up questions retain context', () => {
  const context = contextFor('Peki yarın?', [
    { role: 'user', content: 'Bugünkü antrenmanım ne?' },
    { role: 'coach', content: 'Bugün Push antrenmanın var.' },
  ]);

  assert.equal(context.request.intent, 'general');
  assert.deepEqual(context.recentConversation, [
    { role: 'user', content: 'Bugünkü antrenmanım ne?' },
    { role: 'coach', content: 'Bugün Push antrenmanın var.' },
  ]);
});

test('classifies workout questions without turning greetings into workout requests', () => {
  assert.equal(contextFor('Antrenmanımda hangi hareketler var?').request.intent, 'workout');
  assert.equal(contextFor('Selam, nasılsın?').request.intent, 'greeting');
});