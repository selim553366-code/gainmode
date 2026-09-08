import assert from 'node:assert/strict';
import test from 'node:test';
import { formatAnnualMonthlyPrice } from '../lib/subscriptionPricing.ts';

test('divides the numeric store price by twelve and rounds for its currency', () => {
  assert.equal(formatAnnualMonthlyPrice({ price: 59.99, currencyCode: 'USD' }, 'en-US'), '$5.00');
  assert.equal(formatAnnualMonthlyPrice({ price: 1200, currencyCode: 'TRY' }, 'tr-TR'), '₺100,00');
  assert.equal(formatAnnualMonthlyPrice({ price: 12000, currencyCode: 'JPY' }, 'ja-JP'), '￥1,000');
});

test('uses the supplied locale without changing the store currency', () => {
  assert.equal(formatAnnualMonthlyPrice({ price: 119.99, currencyCode: 'EUR' }, 'de-DE'), '10,00\u00a0€');
  assert.equal(formatAnnualMonthlyPrice({ price: 0, currencyCode: 'USD' }, 'en-US'), '$0.00');
});

test('does not invent a comparison price while store data is missing or invalid', () => {
  for (const product of [undefined, null, { price: NaN, currencyCode: 'USD' }, { price: Infinity, currencyCode: 'USD' }, { price: -1, currencyCode: 'USD' }, { price: 120, currencyCode: '' }]) {
    assert.equal(formatAnnualMonthlyPrice(product), null);
  }
});