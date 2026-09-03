export const TEST_PREMIUM_PROMO_STORAGE_KEY = 'forge-fit-test-premium-unlocked';

const TEST_PREMIUM_PROMO_CODE = 'selim';

export function isValidTestPremiumPromoCode(value: string) {
  return value.trim().toLowerCase() === TEST_PREMIUM_PROMO_CODE;
}