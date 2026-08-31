import test from 'node:test';
import assert from 'node:assert/strict';

const profileEdit = await import('../lib/profileEdit.ts');

test('profile update availability resets at the start of a new month', () => {
  assert.equal(profileEdit.getCurrentMonthKey(new Date(2026, 8, 1)), '2026-09');
  assert.equal(profileEdit.isProfileEditAvailable('2026-08', new Date(2026, 8, 1)), true);
  assert.equal(profileEdit.isProfileEditAvailable('2026-09', new Date(2026, 8, 1)), false);
});

test('profile edit fields are deduplicated and invalid values are ignored', () => {
  assert.deepEqual(
    profileEdit.parseProfileEditFields('goal,body,goal,unknown,nutrition'),
    ['goal', 'body', 'nutrition'],
  );
});