import assert from 'node:assert/strict';
import test from 'node:test';
import { translate } from '../lib/i18n.ts';
import { hasActivePremiumEntitlement, PREMIUM_ENTITLEMENT_IDENTIFIER } from '../lib/premiumAccess.ts';
import { isValidTestPremiumPromoCode } from '../lib/testPremiumPromo.ts';

test('Premium is active only when the configured entitlement is active', () => {
  assert.equal(
    hasActivePremiumEntitlement({ entitlements: { active: { [PREMIUM_ENTITLEMENT_IDENTIFIER]: { isActive: true } } } }),
    true,
  );
  assert.equal(hasActivePremiumEntitlement({ entitlements: { active: {} } }), false);
  assert.equal(hasActivePremiumEntitlement(undefined), false);
});

test('an unrelated active entitlement does not unlock Premium', () => {
  assert.equal(
    hasActivePremiumEntitlement({ entitlements: { active: { another_entitlement: { isActive: true } } } }),
    false,
  );
});

test('the development test code is case-insensitive and never accepted when disabled', () => {
  assert.equal(isValidTestPremiumPromoCode('selim', true), true);
  assert.equal(isValidTestPremiumPromoCode(' SELIM ', true), true);
  assert.equal(isValidTestPremiumPromoCode('premium', true), false);
  assert.equal(isValidTestPremiumPromoCode('selim', false), false);
});

test('test access labels are translated in all supported languages', () => {
  const keys = ['premiumPromo', 'premiumPromoPlaceholder', 'premiumPromoApply', 'premiumPromoInvalid'];
  for (const language of ['tr', 'en', 'de', 'fr', 'es']) {
    for (const key of keys) {
      assert.notEqual(translate(language, key), key);
    }
  }
});
