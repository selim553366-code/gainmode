import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = 'forge_fit_pro';
export const SUBSCRIPTION_PURCHASE_ENABLED = true;
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

let configured = false;

export function initializeRevenueCat() {
  if (configured || Platform.OS !== 'android' || !REVENUECAT_ANDROID_API_KEY) return;
  Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.INFO);
  Purchases.configure({ apiKey: REVENUECAT_ANDROID_API_KEY });
  configured = true;
}

export function isRevenueCatConfigured() {
  return configured;
}

type SubscriptionContextValue = {
  customerInfo?: CustomerInfo;
  offerings?: PurchasesOfferings;
  monthlyPackage?: PurchasesPackage;
  isAvailable: boolean;
  isLoading: boolean;
  isSubscribed: boolean | undefined;
  purchase: (packageToPurchase: PurchasesPackage) => Promise<CustomerInfo>;
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
    mutationFn: async (packageToPurchase: PurchasesPackage) => {
      const result = await Purchases.purchasePackage(packageToPurchase);
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
      isAvailable,
      isLoading: isAvailable && (customerInfoQuery.isLoading || offeringsQuery.isLoading),
      isSubscribed: customerInfoQuery.data
        ? Boolean(customerInfoQuery.data.entitlements.active[REVENUECAT_ENTITLEMENT_IDENTIFIER])
        : undefined,
      purchase: purchaseMutation.mutateAsync,
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