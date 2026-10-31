import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import { router } from 'expo-router';
import type { NotificationResponse } from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { FitProvider, useFit } from '@/context/FitContext';
import { initializeRevenueCat, SubscriptionProvider } from '@/lib/revenuecat';
import { getApiBaseUrl } from '@/lib/api';
import { setBaseUrl } from '@workspace/api-client-react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import colors from '@/constants/colors';
import { WidgetOfferHost } from '@/components/WidgetOffer';
import { BadgeUnlockHost } from '@/components/BadgeUnlock';
import { clearNotificationResponse, subscribeToNotificationResponses } from '@/lib/notifications';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
setBaseUrl(getApiBaseUrl());
try {
  initializeRevenueCat();
} catch (error) {
  console.warn('RevenueCat could not be initialized.', error);
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { resolvedTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const handledNotificationResponse = useRef<string | null>(null);
  useEffect(() => {
    const openNotificationDestination = (response: NotificationResponse) => {
      if (handledNotificationResponse.current === response.notification.request.identifier) return;
      const notificationData = response.notification.request.content.data;
      if (!notificationData || typeof notificationData !== 'object') return;
      const data = notificationData as Record<string, unknown>;
      const supportedSources = [
        'forge-fit-daily-mood',
        'forge-fit-workout',
        'forge-fit-progress',
        'forge-fit-nutrition',
        'forge-fit-coach',
        'forge-fit-home',
      ];
      if (!supportedSources.includes(String(data?.source))) return;
      handledNotificationResponse.current = response.notification.request.identifier;
      clearNotificationResponse();
      setTimeout(() => {
        if (data.source === 'forge-fit-workout' && typeof data.workoutDay === 'string') {
          router.push({ pathname: '/(tabs)/plan', params: { day: data.workoutDay } });
          return;
        }
        if (data.source === 'forge-fit-progress') {
          router.push('/(tabs)/progress');
          return;
        }
        if (data.source === 'forge-fit-nutrition') {
          router.push('/(tabs)/nutrition');
          return;
        }
        if (data.source === 'forge-fit-coach') {
          router.push('/(tabs)/coach');
          return;
        }
        if (data.source === 'forge-fit-home') {
          router.push('/(tabs)');
          return;
        }
        router.push('/daily-mood');
      }, 0);
    };
    return subscribeToNotificationResponses(openNotificationDestination);
  }, []);

  return (
    <>
    <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerBackTitle: 'Back', contentStyle: { backgroundColor: colors[resolvedTheme].background }, animation: reducedMotion ? 'fade' : 'slide_from_right', animationMatchesGesture: true, fullScreenGestureEnabled: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="live-workout" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="workout-session" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="settings-language" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="progress-charts" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="settings-notifications" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="update-preferences" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="streak" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="breathe" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="badges" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="badge-wall" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="features" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="paywall-preview" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="daily-mood" options={{ headerShown: false, presentation: 'card', animation: reducedMotion ? 'fade' : 'fade_from_bottom' }} />
    </Stack>
    <BadgeUnlockHost />
    <WidgetOfferHost />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [startupFallbackReady, setStartupFallbackReady] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const imageSources = [
      require('@/assets/images/icon.png'),
      require('@/assets/images/coach.png'),
      require('@/assets/images/coach-tab-custom.jpeg'),
      require('@/assets/images/coach-background.jpeg'),
      require('@/assets/images/coach-thinking.png'),
      require('@/assets/images/coach-thinking-custom.jpeg'),
      require('@/assets/images/coach-writing-no-bg.png'),
      require('@/assets/images/coach-thumbs-up-no-bg.png'),
      require('@/assets/images/coach-wave-direct.jpg'),
      require('@/assets/images/forge-fit-logo.jpeg'),
    ];
    void Promise.allSettled(imageSources.map((source) => {
      const uri = Image.resolveAssetSource(source)?.uri;
      return uri ? Image.prefetch(uri) : Promise.resolve(false);
    }));
    return undefined;
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setStartupFallbackReady(true), 2500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError || startupFallbackReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError, startupFallbackReady]);

  return (
    <ThemeProvider>
      <SafeAreaProvider style={{ flex: 1 }}>
       <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SubscriptionProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <FitProvider>
                  <RootLayoutNav />
                </FitProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </SubscriptionProvider>
        </QueryClientProvider>
       </ErrorBoundary>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
