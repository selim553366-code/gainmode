import assert from 'node:assert/strict';
import test from 'node:test';
import { hasActivePremiumEntitlement, PREMIUM_ENTITLEMENT_IDENTIFIER } from '../lib/premiumAccess.ts';

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
