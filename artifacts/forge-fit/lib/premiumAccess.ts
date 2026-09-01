export const PREMIUM_ENTITLEMENT_IDENTIFIER = 'forge_fit_pro';

type CustomerInfoLike = {
  entitlements?: {
    active?: Record<string, unknown>;
  };
};

export function hasActivePremiumEntitlement(customerInfo: CustomerInfoLike | null | undefined) {
  return Boolean(customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_IDENTIFIER]);
}