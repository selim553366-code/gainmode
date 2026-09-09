import assert from 'node:assert/strict';
import test from 'node:test';

import { getFirstCoachReply } from '../lib/coachRating.ts';

test('does not target the welcome message before the first user question', () => {
  const target = getFirstCoachReply([
    { id: 'welcome', text: 'Hoş geldin!', from: 'coach' },
    { id: 'question', text: 'Bugün ne yapmalıyım?', from: 'user' },
    { id: 'reply', text: 'Bugünkü planını birlikte inceleyelim.', from: 'coach' },
  ]);

  assert.equal(target?.id, 'reply');
});

test('targets the first real coach reply and ignores later replies', () => {
  const target = getFirstCoachReply([
    { id: 'welcome', text: 'Hoş geldin!', from: 'coach' },
    { id: 'question', text: 'Kalorim kaç?', from: 'user' },
    { id: 'reply', text: 'Hedefin 2200 kcal.', from: 'coach' },
    { id: 'second-question', text: 'Peki protein?', from: 'user' },
    { id: 'second-reply', text: 'Protein hedefin 150 g.', from: 'coach' },
  ]);

  assert.equal(target?.id, 'reply');
});

test('does not rate media or weekly analysis messages as the first exchange', () => {
  const target = getFirstCoachReply([
    { id: 'welcome', text: 'Hoş geldin!', from: 'coach' },
    { id: 'weekly', text: 'Haftalık analiz', from: 'user', variant: 'weeklyAnalysis' },
    { id: 'weekly-reply', text: 'Haftalık özetin hazır.', from: 'coach' },
    { id: 'question', text: 'Merhaba', from: 'user' },
    { id: 'reply', text: 'Merhaba! Nasıl yardımcı olayım?', from: 'coach' },
  ]);

  assert.equal(target?.id, 'reply');
});