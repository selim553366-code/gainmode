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

test('profile edit groups map to the complete set of affected onboarding steps', () => {
  assert.deepEqual(
    profileEdit.getProfileEditStepIds(['training'], false),
    [8, 9, 10, 13, 14],
  );
  assert.deepEqual(
    profileEdit.getProfileEditStepIds(['goal'], true),
    [5, 15],
  );
  assert.deepEqual(
    profileEdit.getProfileEditStepIds(['body', 'personal', 'nutrition'], false),
    [2, 3, 4, 6, 11, 12],
  );
});

test('an empty or invalid profile edit selection cannot create an edit flow', () => {
  assert.deepEqual(profileEdit.getProfileEditStepIds([], false), []);
  assert.deepEqual(profileEdit.getProfileEditStepIds(profileEdit.parseProfileEditFields('unknown'), false), []);
});