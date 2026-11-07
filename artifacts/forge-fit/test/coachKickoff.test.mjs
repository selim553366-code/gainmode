import assert from 'node:assert/strict';
import test from 'node:test';
import { coachKickoffText } from '../lib/coachKickoff.ts';

test('kickoff names the user and today’s workout', () => {
  assert.equal(
    coachKickoffText('tr', 'Selim', { name: 'İtiş gücü', minutes: 60, exercises: 9 }),
    'Selim, planın hazır! Bugün İtiş gücü günün: 60 dakika, 9 hareket. İlk adımı birlikte atalım.',
  );
  assert.equal(
    coachKickoffText('en', 'Alex', { name: 'Push strength', minutes: 45, exercises: 7 }),
    'Alex, your plan is ready! Today is Push strength: 45 min, 7 exercises. Let’s take the first step together.',
  );
});

test('kickoff falls back to a rest-day nudge and works without a name', () => {
  assert.equal(coachKickoffText('en', '  ', null), 'Your plan is ready! Today is a rest day, so start by scanning your first meal.');
  assert.equal(coachKickoffText('tr', null, null), 'Planın hazır! Bugün dinlenme günün. İlk öğününü tarayarak başlayabilirsin.');
});
