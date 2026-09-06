import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyMoodQuoteIndex, getDailyMoodQuote, isDailyMoodDue } from '../lib/dailyMood.ts';

test('daily mood is not due before 19:50', () => {
  assert.equal(isDailyMoodDue(new Date(2026, 8, 4, 19, 49)), false);
  assert.equal(isDailyMoodDue(new Date(2026, 8, 4, 12, 0)), false);
});

test('daily mood is due at and after 19:50', () => {
  assert.equal(isDailyMoodDue(new Date(2026, 8, 4, 19, 50)), true);
  assert.equal(isDailyMoodDue(new Date(2026, 8, 4, 23, 59)), true);
});

test('daily mood provides 365 unique localized quotes', () => {
  const quotes = new Set();
  for (let day = 0; day < 365; day += 1) {
    const date = new Date(2025, 0, day + 1, 12);
    assert.equal(dailyMoodQuoteIndex(date), day);
    quotes.add(getDailyMoodQuote('tr', date));
    for (const language of ['en', 'de', 'fr', 'es']) {
      assert.ok(getDailyMoodQuote(language, date).length > 30);
    }
  }
  assert.equal(quotes.size, 365);
});

test('daily mood quote stays stable throughout the same day', () => {
  const morning = new Date(2026, 4, 18, 8, 15);
  const evening = new Date(2026, 4, 18, 22, 45);
  assert.equal(getDailyMoodQuote('tr', morning), getDailyMoodQuote('tr', evening));
});