import assert from 'node:assert/strict';
import test from 'node:test';

import { COACH_MESSAGES_STORAGE_KEY, getCoachMessagesStorageKey, parseStoredCoachMessages } from '../lib/coachMessages.ts';

test('keeps coach storage separate from the display name', () => {
  assert.notEqual(getCoachMessagesStorageKey('account-a'), getCoachMessagesStorageKey('account-b'));
  assert.equal(getCoachMessagesStorageKey('account-a'), `${COACH_MESSAGES_STORAGE_KEY}:account-a`);
  assert.equal(getCoachMessagesStorageKey(null), COACH_MESSAGES_STORAGE_KEY);
});

test('restores the complete coach conversation in its stored order', () => {
  const stored = JSON.stringify([
    { id: 'welcome', text: 'Welcome', from: 'coach' },
    { id: 'user-1', text: 'How should I train today?', from: 'user' },
    { id: 'coach-1', text: 'Start with your lower body plan.', from: 'coach' },
    { id: 'user-2', text: 'And nutrition?', from: 'user' },
    { id: 'coach-2', text: 'Keep your protein target steady.', from: 'coach' },
  ]);

  const restored = parseStoredCoachMessages(stored);

  assert.deepEqual(restored?.map((message) => message.id), ['welcome', 'user-1', 'coach-1', 'user-2', 'coach-2']);
});

test('ignores malformed storage without breaking the chat', () => {
  assert.equal(parseStoredCoachMessages('{not-json'), null);
  assert.equal(parseStoredCoachMessages(JSON.stringify({ id: 'not-an-array' })), null);
  assert.deepEqual(parseStoredCoachMessages(JSON.stringify([
    { id: 'valid', text: 'Keep me', from: 'user' },
    { id: 42, text: 'Discard me', from: 'coach' },
  ])), [{ id: 'valid', text: 'Keep me', from: 'user' }]);
});