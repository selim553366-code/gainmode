import React from 'react';
import { Platform } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Paywall } from '@/components/Paywall';
import { PremiumSuccessCelebration } from '@/components/FitUI';

/**
 * Web-only design preview of the purchase flow. There is no store on the web, so the purchase is
 * simulated to show the welcome sequence. Native builds never reach this route.
 */
export default function PaywallPreview() {
  const [welcome, setWelcome] = React.useState(false);
  if (Platform.OS !== 'web') return <Redirect href="/" />;
  if (welcome) return <PremiumSuccessCelebration visible modal={false} onDone={() => router.replace('/')} />;
  return <Paywall previewMode onUnlock={() => router.replace('/')} onPurchaseSuccess={() => setWelcome(true)} />;
}
