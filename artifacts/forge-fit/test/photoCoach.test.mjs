import assert from 'node:assert/strict';
import test from 'node:test';
import { runPhotoCoachRequest } from '../lib/photoCoach.ts';
import { DAILY_PHOTO_ANALYSIS_LIMIT } from '../lib/usageLimits.ts';
import { translate } from '../lib/i18n.ts';

test('increments photo usage exactly once after a successful coach request', async () => {
  let photoUsage = 0;
  let requestCount = 0;

  const status = await runPhotoCoachRequest({
    photoAnalysesUsed: 0,
    limit: DAILY_PHOTO_ANALYSIS_LIMIT,
    request: async () => {
      requestCount += 1;
      return { content: 'Keep going' };
    },
    onSuccess: () => {
      photoUsage += 1;
    },
    onError: () => {
      throw new Error('success path should not fail');
    },
    onLimit: () => {
      throw new Error('success path should not be limited');
    },
  });

  assert.equal(status, 'success');
  assert.equal(requestCount, 1);
  assert.equal(photoUsage, 1);
});

test('leaves photo usage unchanged and shows the localized retry message after an API failure', async () => {
  let photoUsage = 0;
  const messages = [];

  const status = await runPhotoCoachRequest({
    photoAnalysesUsed: 2,
    limit: DAILY_PHOTO_ANALYSIS_LIMIT,
    request: async () => {
      throw new Error('API unavailable');
    },
    onSuccess: () => {
      photoUsage += 1;
    },
    onError: () => {
      messages.push(translate('tr', 'photoCoachError'));
    },
    onLimit: () => {
      throw new Error('failure path should not be limited');
    },
  });

  assert.equal(status, 'failed');
  assert.equal(photoUsage, 0);
  assert.deepEqual(messages, [translate('tr', 'photoCoachError')]);
});

test('blocks a photo request at the daily limit without spending another request', async () => {
  let requestCount = 0;
  const messages = [];

  const status = await runPhotoCoachRequest({
    photoAnalysesUsed: DAILY_PHOTO_ANALYSIS_LIMIT,
    limit: DAILY_PHOTO_ANALYSIS_LIMIT,
    request: async () => {
      requestCount += 1;
      return { content: 'This should not be requested' };
    },
    onSuccess: () => {
      throw new Error('limit path should not succeed');
    },
    onError: () => {
      throw new Error('limit path should not fail');
    },
    onLimit: () => {
      messages.push(translate('tr', 'photoLimitReached'));
    },
  });

  assert.equal(status, 'limited');
  assert.equal(requestCount, 0);
  assert.deepEqual(messages, [translate('tr', 'photoLimitReached')]);
});