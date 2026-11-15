import React from 'react';
import { router } from 'expo-router';
import { Paywall } from '@/components/Paywall';
import { PremiumSuccessCelebration } from '@/components/FitUI';
import { useFit } from '@/context/FitContext';
import { queueCoachKickoff } from '@/lib/coachKickoffStore';

/**
 * The real purchase screen on its own route, so it can be opened from a link (forge-fit://paywall)
 * at any time, for example to check how it looks with the store's live prices.
 */
export default function PaywallScreen() {
  const { enablePremium } = useFit();
  const [welcome, setWelcome] = React.useState(false);
  const close = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };
  if (welcome) return <PremiumSuccessCelebration visible modal={false} onDone={() => { queueCoachKickoff(); router.replace('/(tabs)/coach'); }} />;
  return <Paywall
    onClose={close}
    onUnlock={close}
    onPurchaseSuccess={(kind) => { enablePremium(); if (kind === 'purchase') setWelcome(true); else close(); }}
  />;
}
