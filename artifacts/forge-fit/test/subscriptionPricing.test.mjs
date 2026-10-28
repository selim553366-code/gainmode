import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateAnnualSavingsPercent, formatAnnualMonthlyPrice } from '../lib/subscriptionPricing.ts';
import { getPremiumPreviewProduct, getPremiumPreviewPriceOptions } from '../lib/i18n.ts';

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

test('calculates annual savings from the monthly and annual store prices', () => {
  assert.equal(
    calculateAnnualSavingsPercent({ price: 6.99, currencyCode: 'USD' }, { price: 49.99, currencyCode: 'USD' }),
    40,
  );
});

test('shows the updated preview prices with the selected language currency', () => {
  assert.deepEqual(getPremiumPreviewProduct('tr', 6.99), {
    price: 6.99,
    currencyCode: 'USD',
    priceString: '$6.99',
  });
  assert.deepEqual(getPremiumPreviewProduct('en', 49.99), {
    price: 49.99,
    currencyCode: 'USD',
    priceString: '$49.99',
  });
  assert.match(getPremiumPreviewPriceOptions('de'), /6,99 €.*49,99 €/);
});

test('does not compare plans with missing, mismatched, or non-discounted prices', () => {
  assert.equal(calculateAnnualSavingsPercent({ price: 6.99, currencyCode: 'USD' }, { price: 49.99, currencyCode: 'EUR' }), null);
  assert.equal(calculateAnnualSavingsPercent({ price: 6.99, currencyCode: 'USD' }, { price: 83.88, currencyCode: 'USD' }), null);
  assert.equal(calculateAnnualSavingsPercent(undefined, { price: 49.99, currencyCode: 'USD' }), null);
});