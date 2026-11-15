import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasActivePremiumEntitlement, PREMIUM_ENTITLEMENT_IDENTIFIER } from '@/lib/premiumAccess';

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = PREMIUM_ENTITLEMENT_IDENTIFIER;
export const SUBSCRIPTION_PURCHASE_ENABLED = true;
// The preview is a product walkthrough, so it always has access without
// changing the native iOS/Android entitlement flow.
export const PREVIEW_SUBSCRIPTION_ACTIVE = Platform.OS === 'web';
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

let configured = false;

export function initializeRevenueCat() {
  if (configured || Platform.OS === 'web') return;
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
  if (!apiKey) return;
  Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.INFO);
  Purchases.configure({ apiKey });
  configured = true;
}

export function isRevenueCatConfigured() {
  return configured;
}

type SubscriptionContextValue = {
  customerInfo?: CustomerInfo;
  offerings?: PurchasesOfferings;
  monthlyPackage?: PurchasesPackage;
  annualPackage?: PurchasesPackage;
  isAvailable: boolean;
  isLoading: boolean;
  isSubscribed: boolean | undefined;
  /**
   * Buys a package. With `withoutTrial` on Google Play it buys the plain base plan, skipping any
   * free-trial offer (used once the paywall's trial offer has run out). The App Store applies an
   * introductory offer on its own, so there the flag has no effect.
   */
  purchase: (packageToPurchase: PurchasesPackage, options?: { withoutTrial?: boolean }) => Promise<CustomerInfo>;
  /** Fetch the store offerings again, e.g. when they were not loaded yet at purchase time. */
  refreshPackages: () => Promise<{ monthly?: PurchasesPackage; annual?: PurchasesPackage }>;
  restore: () => Promise<CustomerInfo>;
  isPurchasing: boolean;
  isRestoring: boolean;
  purchaseError: unknown;
  restoreError: unknown;
};

function useSubscriptionContext(): SubscriptionContextValue {
  const queryClient = useQueryClient();
  const isAvailable = isRevenueCatConfigured();
  const customerInfoQuery = useQuery({
    queryKey: ['revenuecat', 'customer-info'],
    queryFn: () => Purchases.getCustomerInfo(),
    enabled: isAvailable,
    retry: false,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const offeringsQuery = useQuery({
    queryKey: ['revenuecat', 'offerings'],
    queryFn: () => Purchases.getOfferings(),
    enabled: isAvailable,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isAvailable) return undefined;
    const listener = (customerInfo: CustomerInfo) => {
      queryClient.setQueryData(['revenuecat', 'customer-info'], customerInfo);
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isAvailable, queryClient]);

  const purchaseMutation = useMutation({
    mutationFn: async ({ pkg, withoutTrial }: { pkg: PurchasesPackage; withoutTrial: boolean }) => {
      const basePlan = withoutTrial && Platform.OS === 'android'
        ? pkg.product.subscriptionOptions?.find((option) => option.isBasePlan)
        : undefined;
      const result = basePlan ? await Purchases.purchaseSubscriptionOption(basePlan) : await Purchases.purchasePackage(pkg);
      return result.customerInfo;
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(['revenuecat', 'customer-info'], customerInfo);
    },
  });
  const restoreMutation = useMutation({
    mutationFn: () => Purchases.restorePurchases(),
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(['revenuecat', 'customer-info'], customerInfo);
    },
  });

  return useMemo(() => {
    const currentOffering = offeringsQuery.data?.current;
    return {
      customerInfo: customerInfoQuery.data,
      offerings: offeringsQuery.data,
      monthlyPackage: currentOffering?.monthly ?? undefined,
      annualPackage: currentOffering?.annual ?? undefined,
      isAvailable,
      isLoading: isAvailable && (customerInfoQuery.isLoading || offeringsQuery.isLoading),
      isSubscribed: PREVIEW_SUBSCRIPTION_ACTIVE
        ? true
        : customerInfoQuery.data
          ? hasActivePremiumEntitlement(customerInfoQuery.data)
          : undefined,
      purchase: (pkg: PurchasesPackage, options?: { withoutTrial?: boolean }) => purchaseMutation.mutateAsync({ pkg, withoutTrial: Boolean(options?.withoutTrial) }),
      refreshPackages: async () => {
        if (!isAvailable) return {};
        const result = await offeringsQuery.refetch();
        const offering = result.data?.current;
        return { monthly: offering?.monthly ?? undefined, annual: offering?.annual ?? undefined };
      },
      restore: restoreMutation.mutateAsync,
      isPurchasing: purchaseMutation.isPending,
      isRestoring: restoreMutation.isPending,
      purchaseError: purchaseMutation.error,
      restoreError: restoreMutation.error,
    };
  }, [
    customerInfoQuery.data,
    customerInfoQuery.isLoading,
    offeringsQuery.data,
    offeringsQuery.isLoading,
    offeringsQuery.refetch,
    isAvailable,
    purchaseMutation.mutateAsync,
    purchaseMutation.isPending,
    purchaseMutation.error,
    restoreMutation.mutateAsync,
    restoreMutation.isPending,
    restoreMutation.error,
  ]);
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value = useSubscriptionContext();
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
  return context;
}