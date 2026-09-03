export const TEST_PREMIUM_PROMO_STORAGE_KEY = 'forge-fit-test-premium-unlocked';

const TEST_PREMIUM_PROMO_CODE = 'selim';

export function isValidTestPremiumPromoCode(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue.length === TEST_PREMIUM_PROMO_CODE.length
    && normalizedValue === TEST_PREMIUM_PROMO_CODE;
}